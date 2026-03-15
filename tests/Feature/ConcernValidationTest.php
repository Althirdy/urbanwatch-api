<?php

namespace Tests\Feature;

use App\Events\ConcernAssigned;
use App\Events\ConcernValidationFailed;
use App\Events\ConcernValidationSuccess;
use App\Jobs\ProcessManualConcernJob;
use App\Jobs\ProcessVoiceConcernJob;
use App\Models\Citizen\Concern;
use App\Models\OfficialsDetails;
use App\Models\User;
use App\Models\UserSuspension;
use App\Services\ConcernService;
use App\Services\GeminiService;
use App\Services\TextBeeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Mockery\MockInterface;
use Tests\TestCase;

class ConcernValidationTest extends TestCase
{
    use RefreshDatabase;

    protected $geminiService;

    protected $textBeeService;

    protected $purokLeader;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Roles
        \App\Models\Roles::factory()->create(['id' => 1, 'name' => 'Citizen']);
        \App\Models\Roles::factory()->create(['id' => 2, 'name' => 'Purok Leader']);

        // Create Admin User (ID 1) for automated suspensions
        User::factory()->create([
            'id' => 1,
            'role_id' => 1, // Using Citizen role for now, as long as ID is 1
        ]);

        // Create a Purok Leader (Required for assignment logic)
        $this->purokLeader = User::factory()->create([
            'id' => 2, // Hardcoded ID in ConcernService
            'role_id' => 2, // Matches Purok Leader Role
        ]);

        OfficialsDetails::create([
            'user_id' => $this->purokLeader->id,
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'contact_number' => '09123456789',
            'office_address' => 'Brgy 176 Office',
            'assigned_brgy' => '176',
        ]);

        // Fake Events
        Event::fake([
            ConcernAssigned::class,
            ConcernValidationSuccess::class,
            ConcernValidationFailed::class,
        ]);

        // Mock GeographicRoutingService to avoid spatial query issues
        $this->mock(\App\Services\GeographicRoutingService::class, function (MockInterface $mock) {
            $mock->shouldReceive('findPurokLeader')
                ->andReturn([
                    'purok' => (object) ['name' => '176', 'id' => 1],
                    'leader' => OfficialsDetails::where('user_id', 2)->first(),
                ]);
        });
    }

    public function test_valid_manual_concern_is_processed_correctly()
    {
        // 1. Arrange
        $user = User::factory()->create();
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'title' => 'Valid Concern',
            'description' => 'Real fire incident',
        ]);

        // 2. Mock Services
        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('validateAndClassify')
                ->once()
                ->with('Valid Concern Real fire incident', null, null)
                ->andReturn([
                    'is_valid' => true,
                    'category' => 'safety',
                    'severity' => 'high',
                    'confidence' => 0.95,
                    'coherence_score' => 0.90,
                    'detail_score' => 0.85,
                    'rejection_reason' => null,
                ]);
        });

        $this->mock(TextBeeService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendConcernAssignedNotification')
                ->atLeast()->times(1)
                ->with('09123456789', \Mockery::type('array'));
        });

        // 3. Act - Run the Job Synchronously
        $job = new ProcessManualConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        // 4. Assert
        $concern->refresh();

        $this->assertEquals('pending', $concern->status);
        $this->assertTrue($concern->is_valid);
        $this->assertEquals('safety', $concern->category);

        Event::assertDispatched(ConcernValidationSuccess::class);
    }

    public function test_invalid_manual_concern_is_rejected()
    {
        // 1. Arrange
        $user = User::factory()->create(['false_alarm_strikes' => 0]);
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'title' => 'Spam',
            'description' => 'asdfghjkl',
        ]);

        // 2. Mock Services
        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('validateAndClassify')
                ->once()
                ->andReturn([
                    'is_valid' => false,
                    'rejection_reason' => 'Gibberish detected',
                ]);
        });

        // TextBee should NOT be called
        $this->mock(TextBeeService::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('sendConcernAssignedNotification');
        });

        // 3. Act
        $job = new ProcessManualConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        // 4. Assert
        $concern->refresh();
        $user->refresh();

        $this->assertEquals('rejected', $concern->status);
        $this->assertFalse($concern->is_valid);
        $this->assertEquals('Gibberish detected', $concern->rejection_reason);
        $this->assertEquals(1, $user->false_alarm_strikes);

        Event::assertDispatched(ConcernValidationFailed::class);
    }

    public function test_mark_as_invalid_is_idempotent_for_already_rejected_concern()
    {
        $user = User::factory()->create(['false_alarm_strikes' => 1]);
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'rejected',
            'is_valid' => false,
            'rejection_reason' => 'Original AI rejection',
        ]);

        $initialHistoryCount = \App\Models\ConcernHistory::where('concern_id', $concern->id)->count();

        app(ConcernService::class)->markAsInvalid($concern->id, 'Repeated rejection from duplicate event', [
            'source' => 'test_duplicate',
        ]);

        $user->refresh();
        $concern->refresh();
        $currentHistoryCount = \App\Models\ConcernHistory::where('concern_id', $concern->id)->count();

        $this->assertEquals(1, $user->false_alarm_strikes);
        $this->assertEquals('rejected', $concern->status);
        $this->assertEquals($initialHistoryCount, $currentHistoryCount);
        Event::assertNotDispatched(ConcernValidationFailed::class);
    }

    public function test_user_gets_suspended_on_3rd_strike()
    {
        // 1. Arrange
        $user = User::factory()->create(['false_alarm_strikes' => 2]);
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
        ]);

        // 2. Mock Services
        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('validateAndClassify')
                ->andReturn([
                    'is_valid' => false,
                    'rejection_reason' => 'Spam',
                ]);
        });

        // 3. Act
        $job = new ProcessManualConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        // 4. Assert
        $user->refresh();
        $this->assertEquals(3, $user->false_alarm_strikes);

        $suspension = UserSuspension::where('user_id', $user->id)->first();
        $this->assertNotNull($suspension);
        $this->assertEquals('warning_1', $suspension->punishment_type);
        $this->assertEquals('active', $suspension->status);
    }

    public function test_user_gets_warning_2_on_5th_strike()
    {
        $user = User::factory()->create(['false_alarm_strikes' => 4]);
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
        ]);

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('validateAndClassify')
                ->andReturn([
                    'is_valid' => false,
                    'rejection_reason' => 'Spam',
                ]);
        });

        $job = new ProcessManualConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        $user->refresh();
        $this->assertEquals(5, $user->false_alarm_strikes);

        $suspension = UserSuspension::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($suspension);
        $this->assertEquals('warning_2', $suspension->punishment_type);
        $this->assertEquals('active', $suspension->status);
    }

    public function test_user_gets_permanent_suspension_on_8th_strike()
    {
        $user = User::factory()->create(['false_alarm_strikes' => 7]);
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
        ]);

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('validateAndClassify')
                ->andReturn([
                    'is_valid' => false,
                    'rejection_reason' => 'Spam',
                ]);
        });

        $job = new ProcessManualConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        $user->refresh();
        $this->assertEquals(8, $user->false_alarm_strikes);

        $suspension = UserSuspension::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($suspension);
        $this->assertEquals('suspension', $suspension->punishment_type);
        $this->assertEquals('active', $suspension->status);
    }

    public function test_repeated_invalid_concern_after_8th_strike_does_not_create_duplicate_permanent_suspension()
    {
        $user = User::factory()->create(['false_alarm_strikes' => 7]);

        $firstConcern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
        ]);
        $secondConcern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
        ]);

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('validateAndClassify')
                ->twice()
                ->andReturn([
                    'is_valid' => false,
                    'rejection_reason' => 'Spam',
                ]);
        });

        $job = new ProcessManualConcernJob($firstConcern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));
        $job = new ProcessManualConcernJob($secondConcern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        $user->refresh();
        $this->assertEquals(9, $user->false_alarm_strikes);
        $this->assertEquals(
            1,
            UserSuspension::where('user_id', $user->id)
                ->where('punishment_type', 'suspension')
                ->where('status', 'active')
                ->count()
        );
    }

    public function test_voice_concern_validation()
    {
        // Force filesystem to public to match Job logic and Storage::fake
        config(['filesystems.default' => 'public']);

        // 1. Arrange
        // We need to create media first.
        // Note: Creating media requires an existing concern usually, but factories help.
        // We'll manually create the relation.
        $user = User::factory()->create();
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'type' => 'voice',
        ]);

        // Create Audio Media
        // Using a mock file is tricky with Storage facade in integration tests if not careful,
        // but ProcessVoiceConcernJob uses Storage::disk()->exists().
        // We will Mock Storage facade.
        \Illuminate\Support\Facades\Storage::fake('public');
        \Illuminate\Support\Facades\Storage::disk('public')->put('concerns/audio.mp3', 'dummy content');

        $concern->media()->create([
            'media_type' => 'audio',
            'public_id' => 'concerns/audio.mp3',
            'original_path' => 'concerns/audio.mp3',
            'mime_type' => 'audio/mp3',
            'original_filename' => 'audio.mp3',
            'source_category' => 'citizen_concern',
        ]);

        // 2. Mock Services
        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('analyzeAudio')
                ->once()
                ->andReturn([
                    'transcription_text' => 'Tulong may sunog',
                    'title' => 'Sunog Detected',
                    'description' => 'Report of fire',
                    'category' => 'safety',
                    'severity' => 'high',
                    'is_valid' => true,
                    'confidence' => 0.99,
                ]);
        });

        $this->mock(TextBeeService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendConcernAssignedNotification')->atLeast()->times(1);
        });

        // 3. Act
        $job = new ProcessVoiceConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        // 4. Assert
        $concern->refresh();
        $this->assertEquals('pending', $concern->status);
        $this->assertEquals('Tulong may sunog', $concern->transcript_text);
        $this->assertEquals('safety', $concern->ai_category);
        $this->assertEquals('safety', $concern->category); // Auto-update if high confidence
    }

    public function test_voice_concern_with_low_scores_is_not_rejected_by_score_gate()
    {
        config(['filesystems.default' => 'public']);

        $user = User::factory()->create();
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'type' => 'voice',
        ]);

        \Illuminate\Support\Facades\Storage::fake('public');
        \Illuminate\Support\Facades\Storage::disk('public')->put('concerns/voice-low-score.mp3', 'dummy content');

        $concern->media()->create([
            'media_type' => 'audio',
            'public_id' => 'concerns/voice-low-score.mp3',
            'original_path' => 'concerns/voice-low-score.mp3',
            'mime_type' => 'audio/mp3',
            'original_filename' => 'voice-low-score.mp3',
            'source_category' => 'citizen_concern',
        ]);

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('analyzeAudio')
                ->once()
                ->andReturn([
                    'transcription_text' => 'May banggaan malapit sa gasoline station',
                    'title' => 'Banggaan sa kalsada',
                    'description' => 'May banggaan at may sugatan.',
                    'category' => 'safety',
                    'severity' => 'high',
                    'is_valid' => true,
                    'confidence' => 0.9,
                    'coherence_score' => 0.0,
                    'detail_score' => 0.0,
                ]);
        });

        $this->mock(TextBeeService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendConcernAssignedNotification')->atLeast()->times(1);
        });

        $job = new ProcessVoiceConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        $concern->refresh();
        $this->assertEquals('pending', $concern->status);
        $this->assertTrue($concern->is_valid);
        $this->assertEquals('safety', $concern->category);
    }

    public function test_voice_mark_as_invalid_is_blocked_when_ai_marks_valid()
    {
        $user = User::factory()->create(['false_alarm_strikes' => 0]);
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'type' => 'voice',
        ]);

        $service = app(ConcernService::class);

        $service->markAsInvalid($concern->id, 'Hindi tugma ang detalye ng ulat. Paki-check kung tama ang title, description, at image.', [
            'is_valid' => true,
            'category' => 'safety',
            'specific_type' => 'fire',
            'severity' => 'high',
            'confidence' => 0.9,
            'coherence_score' => 0.0,
            'detail_score' => 0.0,
            'title' => 'May sunog',
            'description' => 'May sunog malapit sa gasolinahan',
            'transcription_text' => 'May sunog malapit sa gasolinahan',
            'rejection_reason' => null,
        ]);

        $concern->refresh();
        $user->refresh();

        $this->assertEquals('pending', $concern->status);
        $this->assertTrue($concern->is_valid);
        $this->assertEquals(0, $user->false_alarm_strikes);
    }

    public function test_manual_concern_with_low_coherence_still_rejects()
    {
        $user = User::factory()->create(['false_alarm_strikes' => 0]);
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'title' => 'Banggaan sa highway',
            'description' => 'May aksidente malapit sa gasolinahan.',
            'type' => 'manual',
        ]);

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('validateAndClassify')
                ->once()
                ->andReturn([
                    'is_valid' => true,
                    'category' => 'safety',
                    'severity' => 'high',
                    'confidence' => 0.9,
                    'coherence_score' => 0.0,
                    'detail_score' => 0.9,
                    'rejection_reason' => null,
                ]);
        });

        $this->mock(TextBeeService::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('sendConcernAssignedNotification');
        });

        $job = new ProcessManualConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        $concern->refresh();
        $user->refresh();

        $this->assertEquals('rejected', $concern->status);
        $this->assertFalse($concern->is_valid);
        $this->assertEquals(1, $user->false_alarm_strikes);
    }

    public function test_manual_concern_ai_failure_is_routed_to_needs_review()
    {
        $user = User::factory()->create();
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'title' => 'Possible Incident',
            'description' => 'Something happened',
        ]);

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('validateAndClassify')
                ->once()
                ->andReturn(null);
        });

        $job = new ProcessManualConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        $concern->refresh();
        $this->assertEquals('needs_review', $concern->status);
        $this->assertStringContainsString('manual review', (string) $concern->rejection_reason);
    }

    public function test_voice_concern_without_audio_is_routed_to_needs_review()
    {
        $user = User::factory()->create();
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'type' => 'voice',
        ]);

        $job = new ProcessVoiceConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        $concern->refresh();
        $this->assertEquals('needs_review', $concern->status);
        $this->assertStringContainsString('No audio file found', (string) $concern->rejection_reason);
    }

    public function test_voice_concern_gemini_failure_falls_back_to_pending_and_keeps_user_inputs()
    {
        config(['filesystems.default' => 'public']);

        $user = User::factory()->create();
        $concern = Concern::factory()->create([
            'citizen_id' => $user->id,
            'status' => 'analyzing',
            'type' => 'voice',
            'category' => 'environment',
            'severity' => 'medium',
            'title' => 'Original Voice Title',
            'description' => 'Original voice description',
        ]);

        \Illuminate\Support\Facades\Storage::fake('public');
        \Illuminate\Support\Facades\Storage::disk('public')->put('concerns/fallback-audio.mp3', 'dummy content');

        $concern->media()->create([
            'media_type' => 'audio',
            'public_id' => 'concerns/fallback-audio.mp3',
            'original_path' => 'concerns/fallback-audio.mp3',
            'mime_type' => 'audio/mp3',
            'original_filename' => 'fallback-audio.mp3',
            'source_category' => 'citizen_concern',
        ]);

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('analyzeAudio')
                ->once()
                ->andReturn(null);
        });

        $job = new ProcessVoiceConcernJob($concern->id);
        $job->handle(app(GeminiService::class), app(ConcernService::class));

        $concern->refresh();

        $this->assertEquals('pending', $concern->status);
        $this->assertTrue($concern->is_valid);
        $this->assertEquals('environment', $concern->category);
        $this->assertEquals('medium', $concern->severity);
        $this->assertEquals('Ulat ng Mamamayan (Voice)', $concern->title);
        $this->assertEquals('Naisumiteng voice concern. Sinusuri ng aming team.', $concern->description);
        $this->assertNull($concern->rejection_reason);
        $this->assertIsArray($concern->ai_analysis_raw);
        $this->assertTrue((bool) ($concern->ai_analysis_raw['is_fallback'] ?? false));
        $this->assertEquals('voice_ai_analysis_null', $concern->ai_analysis_raw['fallback_source'] ?? null);
    }
}
