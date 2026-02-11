<?php

namespace Tests\Feature\Citizen;

use App\Jobs\ProcessManualConcernJob;
use App\Jobs\ProcessVoiceConcernJob;
use App\Models\Citizen\Concern;
use App\Models\Roles;
use App\Models\User;
use App\Models\UserSuspension;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConcernManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $citizen;

    protected User $otherCitizen;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // Prevent actual Job dispatching to avoid external API calls
        Queue::fake();
        Storage::fake('concerns'); // Fake storage disk

        $this->setupPurokLeader();
        $this->admin = $this->createAdmin();
        $this->citizen = $this->createCitizen();
        $this->otherCitizen = $this->createCitizen();
    }

    /*
    |--------------------------------------------------------------------------
    | Tests: List & View Concerns
    |--------------------------------------------------------------------------
    */

    public function test_can_list_paginated_concerns()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        // Create 5 concerns for the user
        Concern::factory()->count(5)->create([
            'citizen_id' => $this->citizen->id,
            'category' => 'safety',
            'status' => 'pending',
            'tracking_code' => fn () => 'TRK-'.uniqid(),
        ]);

        $response = $this->getJson('/api/v1/concerns');

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'concerns',
                    'concerns_count',
                    'next_cursor',
                    'prev_cursor',
                ],
            ]);

        $this->assertCount(4, $response->json('data.concerns'));
    }

    public function test_can_filter_concerns_by_category()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'category' => 'safety',
            'title' => 'Safety Issue',
            'tracking_code' => 'SAFE-001',
        ]);

        Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'category' => 'environment',
            'title' => 'Env Issue',
            'tracking_code' => 'ENV-001',
        ]);

        $response = $this->getJson('/api/v1/concerns?category=safety');

        $response->assertStatus(201);
        $this->assertCount(1, $response->json('data.concerns'));
        $this->assertEquals('Safety Issue', $response->json('data.concerns.0.title'));
    }

    public function test_can_view_own_concern_details()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'title' => 'My Concern',
            'tracking_code' => 'MY-001',
        ]);

        $response = $this->getJson("/api/v1/concerns/{$concern->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.concern.title', 'My Concern');
    }

    public function test_cannot_view_others_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $otherConcern = Concern::factory()->create([
            'citizen_id' => $this->otherCitizen->id,
            'tracking_code' => 'OTHER-001',
        ]);

        $response = $this->getJson("/api/v1/concerns/{$otherConcern->id}");

        // UrbanWatchException renders as 400
        $response->assertStatus(400)
            ->assertJsonPath('message', 'Concern not found.');
    }

    /*
    |--------------------------------------------------------------------------
    | Tests: Create Concerns
    |--------------------------------------------------------------------------
    */

    public function test_can_submit_manual_concern_without_image()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $payload = [
            'title' => 'Broken Streetlight',
            'description' => 'Streetlight at corner is flickering.',
            'latitude' => 14.7785335,
            'longitude' => 121.1210474,
            'address' => '123 Test St, Test City',
            'type' => 'manual',
            'category' => 'infrastructure',
        ];

        $response = $this->post('/api/v1/concerns', $payload, ['Accept' => 'application/json']);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Concern submitted successfully!');

        $this->assertDatabaseHas('concerns', [
            'title' => 'Broken Streetlight',
            'category' => 'infrastructure',
            'citizen_id' => $this->citizen->id,
        ]);

        Queue::assertPushed(ProcessManualConcernJob::class);
    }

    public function test_can_submit_manual_concern_with_images()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $file = UploadedFile::fake()->image('evidence.jpg');

        $payload = [
            'title' => 'Trash Pile',
            'description' => 'Huge pile of trash.',
            'latitude' => 14.7785335,
            'longitude' => 121.1210474,
            'type' => 'manual',
            'category' => 'environment',
            'files' => [$file], // Array input
        ];

        $response = $this->post('/api/v1/concerns', $payload, ['Accept' => 'application/json']);

        $response->assertStatus(201);

        // Verify media was saved (assuming IncidentMedia creation logic works)
        // Since we mocked storage and the controller uses a service,
        // we implicitly trust the service integration here or check DB.
        $concern = Concern::where('title', 'Trash Pile')->first();
        $this->assertDatabaseHas('incident_media', [
            'source_id' => $concern->id,
            'source_type' => Concern::class,
        ]);
    }

    public function test_can_submit_voice_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $file = UploadedFile::fake()->create('voice.mp3', 100, 'audio/mpeg');

        $payload = [
            'type' => 'voice',
            'category' => 'safety',
            'files' => [$file],
            'latitude' => 14.7785335,
            'longitude' => 121.1210474,
        ];

        $response = $this->post('/api/v1/concerns', $payload, ['Accept' => 'application/json']);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Concern submitted successfully!');

        $this->assertDatabaseHas('concerns', [
            'type' => 'voice',
            'citizen_id' => $this->citizen->id,
            'category' => 'safety',
        ]);

        Queue::assertPushed(ProcessVoiceConcernJob::class);
    }

    public function test_voice_concern_requires_exactly_one_audio_file()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $payload = [
            'type' => 'voice',
            'category' => 'safety',
            'latitude' => 14.7785335,
            'longitude' => 121.1210474,
        ];

        $response = $this->postJson('/api/v1/concerns', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['files']);
    }

    public function test_manual_concern_rejects_audio_files()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $audio = UploadedFile::fake()->create('voice.mp3', 100, 'audio/mpeg');
        $payload = [
            'title' => 'Street Concern',
            'description' => 'Road issue reported.',
            'latitude' => 14.7785335,
            'longitude' => 121.1210474,
            'type' => 'manual',
            'category' => 'infrastructure',
            'files' => [$audio],
        ];

        $response = $this->postJson('/api/v1/concerns', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['files.0']);
    }

    public function test_validates_create_concern_request()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $response = $this->postJson('/api/v1/concerns', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'category']);
    }

    public function test_suspended_user_cannot_create_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);
        $this->suspendUser($this->citizen);

        $payload = [
            'title' => 'Suspended Attempt',
            'description' => 'I am suspended but trying to post.',
            'latitude' => 14.7785335,
            'longitude' => 121.1210474,
            'type' => 'manual',
            'category' => 'infrastructure',
        ];

        $response = $this->postJson('/api/v1/concerns', $payload);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertStringContainsString(
            'suspended',
            $response->json('message')
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Tests: Delete Concerns
    |--------------------------------------------------------------------------
    */

    public function test_can_delete_own_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'tracking_code' => 'DEL-001',
        ]);

        $response = $this->deleteJson("/api/v1/concerns/{$concern->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Concern deleted successfully');

        $this->assertSoftDeleted('concerns', ['id' => $concern->id]);
    }

    public function test_cannot_delete_others_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $otherConcern = Concern::factory()->create([
            'citizen_id' => $this->otherCitizen->id,
            'tracking_code' => 'NODEL-001',
        ]);

        $response = $this->deleteJson("/api/v1/concerns/{$otherConcern->id}");

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Concern not found.');

        $this->assertDatabaseHas('concerns', ['id' => $otherConcern->id, 'deleted_at' => null]);
    }

    public function test_suspended_user_cannot_delete_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'tracking_code' => 'DEL-SUSP',
        ]);

        $this->suspendUser($this->citizen);

        $response = $this->deleteJson("/api/v1/concerns/{$concern->id}");

        $response->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertStringContainsString('cannot delete concerns', $response->json('message'));
    }

    /*
    |--------------------------------------------------------------------------
    | Tests: Update Concerns
    |--------------------------------------------------------------------------
    */

    public function test_can_update_pending_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'status' => 'pending',
            'title' => 'Original Title',
            'description' => 'Original Description',
        ]);

        $payload = [
            'title' => 'Updated Title',
            'description' => 'Updated Description',
        ];

        $response = $this->putJson("/api/v1/concerns/{$concern->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Concern updated successfully')
            ->assertJsonPath('data.concern.title', 'Updated Title');

        $this->assertDatabaseHas('concerns', [
            'id' => $concern->id,
            'title' => 'Updated Title',
            'description' => 'Updated Description',
        ]);
    }

    public function test_cannot_update_ongoing_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'status' => 'ongoing', // Not pending
        ]);

        $payload = [
            'title' => 'Updated Title',
            'description' => 'Updated Description',
        ];

        $response = $this->putJson("/api/v1/concerns/{$concern->id}", $payload);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Only pending concerns can be edited.');
    }

    public function test_cannot_update_resolved_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'status' => 'resolved',
        ]);

        $payload = [
            'title' => 'Updated Title',
            'description' => 'Updated Description',
        ];

        $response = $this->putJson("/api/v1/concerns/{$concern->id}", $payload);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Only pending concerns can be edited.');
    }

    public function test_cannot_update_others_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $otherConcern = Concern::factory()->create([
            'citizen_id' => $this->otherCitizen->id,
            'status' => 'pending',
        ]);

        $payload = [
            'title' => 'Hacker Title',
            'description' => 'Hacker Description',
        ];

        $response = $this->putJson("/api/v1/concerns/{$otherConcern->id}", $payload);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Concern not found.');
    }

    public function test_suspended_user_cannot_update_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'status' => 'pending',
        ]);

        $this->suspendUser($this->citizen);

        $payload = [
            'title' => 'Updated Title',
            'description' => 'Updated Description',
        ];

        $response = $this->putJson("/api/v1/concerns/{$concern->id}", $payload);

        $response->assertStatus(400)
            ->assertJsonPath('success', false);

        $this->assertStringContainsString('cannot update concerns', $response->json('message'));
    }

    /*
    |--------------------------------------------------------------------------
    | Tests: Archived Concerns
    |--------------------------------------------------------------------------
    */

    public function test_can_list_archived_concerns()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        // Create 1 active concern
        Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'tracking_code' => 'ACTIVE-001',
        ]);

        // Create 1 soft-deleted (archived) concern for this user
        $archived = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'tracking_code' => 'ARCHIVED-001',
            'deleted_at' => now(),
        ]);

        // Create 1 soft-deleted concern for another user
        Concern::factory()->create([
            'citizen_id' => $this->otherCitizen->id,
            'tracking_code' => 'OTHER-ARCHIVED',
            'deleted_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/concerns/archived');

        $response->assertStatus(200)
            ->assertJsonPath('data.concerns_count', 1)
            ->assertJsonPath('data.concerns.0.trackingCode', 'ARCHIVED-001');
    }

    public function test_can_archive_rejected_concern()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'status' => 'rejected',
            'tracking_code' => 'REJ-001',
        ]);

        $response = $this->deleteJson("/api/v1/concerns/{$concern->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('concerns', ['id' => $concern->id]);
    }

    /*
    |--------------------------------------------------------------------------
    | Tests: Filtration
    |--------------------------------------------------------------------------
    */

    public function test_can_filter_concerns_by_status()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        Concern::factory()->create(['citizen_id' => $this->citizen->id, 'status' => 'pending', 'tracking_code' => 'P-001']);
        Concern::factory()->create(['citizen_id' => $this->citizen->id, 'status' => 'resolved', 'tracking_code' => 'R-001']);

        $response = $this->getJson('/api/v1/concerns?status=resolved');

        $response->assertStatus(201)
            ->assertJsonPath('data.concerns_count', 1)
            ->assertJsonPath('data.concerns.0.status', 'resolved');
    }

    public function test_can_filter_concerns_by_date_range()
    {
        Sanctum::actingAs($this->citizen, ['*']);

        // Old concern
        Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'created_at' => '2023-01-15 10:00:00',
            'tracking_code' => 'OLD-001',
        ]);

        // New concern
        Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'created_at' => now(),
            'tracking_code' => 'NEW-001',
        ]);

        $response = $this->getJson('/api/v1/concerns?date_from='.now()->format('Y-m-d').'&date_to='.now()->format('Y-m-d'));

        $response->assertStatus(201)
            ->assertJsonPath('data.concerns_count', 1)
            ->assertJsonPath('data.concerns.0.trackingCode', 'NEW-001');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    private function setupPurokLeader(): void
    {
        // Check if role exists to avoid unique constraint violation if seeding runs
        $role = Roles::firstOrCreate(
            ['name' => 'Purok Leader'],
            ['description' => 'Purok Leader role', 'id' => 2]
        );

        $user = User::factory()->create([
            'id' => 2,
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        DB::table('officials_details')->insertOrIgnore([
            'id' => 2,
            'user_id' => $user->id,
            'contact_number' => '+63 912-345-6789',
            'first_name' => 'Jerico',
            'middle_name' => '',
            'last_name' => 'Tagorda',
            'suffix' => null,
            'office_address' => 'Phase 9 Package 7A, Brgy, 176 E Bagong Silang, Caloocan',
            'assigned_brgy' => 'Barangay 176-E',
            'latitude' => '14.779280528659992',
            'longitude' => '121.0363472121374',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createCitizen(): User
    {
        $role = Roles::firstOrCreate(
            ['name' => 'Citizen'],
            ['description' => 'Citizen role', 'id' => 3]
        );

        return User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
    }

    private function createAdmin(): User
    {
        $role = Roles::firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'Admin role', 'id' => 1]
        );

        return User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);
    }

    private function suspendUser(User $user): void
    {
        UserSuspension::create([
            'user_id' => $user->id,
            'punishment_type' => 'warning_1',
            'duration_days' => 3,
            'suspended_at' => now(),
            'expires_at' => now()->addDays(3),
            'status' => 'active',
            'reason' => 'Violation of terms',
            'suspended_by' => $this->admin->id,
        ]);
    }
}
