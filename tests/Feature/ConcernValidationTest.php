<?php

namespace Tests\Feature;

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
            ConcernValidationSuccess::class,
            ConcernValidationFailed::class,
        ]);
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
                ->with('Valid Concern Real fire incident')
                ->andReturn([
                    'is_valid' => true,
                    'category' => 'safety',
                    'severity' => 'high',
                    'confidence' => 0.95,
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
}
