<?php

use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use App\Models\OfficialsDetails;
use App\Models\User;
use App\Services\ConcernService;
use App\Services\FileUploadService;
use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed the Purok Leader required by the service
    // We force ID 2 because the service has it hardcoded
    // Note: Factories might not respect ID if not explicitly handled,
    // but User::factory()->create(['id' => 2]) usually works if ID is fillable or guarded is empty.
    // If not, we might need to rely on DB state.
    $this->purokLeader = User::factory()->create(['id' => 2]);

    // Create official details linked to that user
    OfficialsDetails::create([
        'id' => 2, // Force ID to match user if auto-increment doesn't align
        'user_id' => 2,
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'contact_number' => '09123456789',
        'office_address' => 'Barangay Hall',
        'assigned_brgy' => 'Poblacion',
    ]);

    // Create a citizen for reporting
    $this->citizen = User::factory()->create();

    // Mock the FileUploadService
    $this->fileUploadService = Mockery::mock(FileUploadService::class);
    $this->textBeeService = Mockery::mock(App\Services\TextBeeService::class);
    $this->notificationService = Mockery::mock(App\Services\NotificationService::class);
    $this->geminiService = Mockery::mock(GeminiService::class);

    // Allow any calls to services (we don't strictly test SMS/Notifications in clustering tests)
    $this->textBeeService->shouldIgnoreMissing();
    $this->notificationService->shouldIgnoreMissing();

    // Default mock for Gemini comparison (Same incident by default for spatial tests)
    $this->geminiService->shouldReceive('compareConcerns')->andReturn(true)->byDefault();

    $this->concernService = new ConcernService(
        $this->fileUploadService,
        $this->textBeeService,
        $this->notificationService,
        $this->geminiService
    );
});

test('it creates a new concern and assigns it when no parent exists', function () {
    Event::fake();
    Queue::fake();

    $data = [
        'type' => 'manual',
        'title' => 'Accident Here',
        'description' => 'Motorcycle crash',
        'category' => 'safety',
        'severity' => 'high',
        'latitude' => 10.0000,
        'longitude' => 123.0000,
    ];

    $concern = $this->concernService->createConcern($data, $this->citizen->id);

    // Simulate AI Validation success
    $concern->update(['status' => 'pending']);

    // Simulate the Job finishing and calling finalizeConcern
    $this->concernService->finalizeConcern($concern->id);

    $concern->refresh();

    expect($concern->is_duplicate)->toBeFalse()
        ->and($concern->parent_concern_id)->toBeNull()
        ->and($concern->status)->toBe('pending');

    // Check Distribution
    $distribution = ConcernDistribution::where('concern_id', $concern->id)->first();
    expect($distribution)->not->toBeNull()
        ->and($distribution->purok_leader_id)->toBe(2);
});

test('it clusters a nearby same-category concern as duplicate', function () {
    Event::fake();
    Queue::fake();

    // 1. Create Parent Concern
    $parent = Concern::factory()->create([
        'citizen_id' => $this->citizen->id,
        'category' => 'safety',
        'latitude' => 10.0000,
        'longitude' => 123.0000,
        'created_at' => now()->subMinutes(10),
        'status' => 'pending',
    ]);

    // 2. Create New "Duplicate" Concern (very close, same category)
    // 0.0001 degrees is ~11 meters
    $data = [
        'type' => 'manual',
        'title' => 'Another Accident Report',
        'description' => 'Same crash',
        'category' => 'safety',
        'latitude' => 10.0001,
        'longitude' => 123.0001,
    ];

    $concern = $this->concernService->createConcern($data, $this->citizen->id);

    // Simulate Job finalization
    $this->concernService->finalizeConcern($concern->id);

    $concern->refresh();

    expect($concern->is_duplicate)->toBeTrue()
        ->and($concern->parent_concern_id)->toBe($parent->id);

    // Assert NO distribution created for duplicate
    $distribution = ConcernDistribution::where('concern_id', $concern->id)->first();
    expect($distribution)->toBeNull();
});

test('it does NOT cluster concerns with different categories', function () {
    Event::fake();
    Queue::fake();

    // 1. Create Parent Concern (Accident)
    $parent = Concern::factory()->create([
        'citizen_id' => $this->citizen->id,
        'category' => 'safety',
        'latitude' => 10.0000,
        'longitude' => 123.0000,
    ]);

    // 2. Create New Concern (Waste) - same location
    $data = [
        'type' => 'manual',
        'title' => 'Garbage Pile',
        'description' => 'Smelly',
        'category' => 'environment',
        'latitude' => 10.0000,
        'longitude' => 123.0000,
    ];

    $concern = $this->concernService->createConcern($data, $this->citizen->id);
    $this->concernService->finalizeConcern($concern->id);

    $concern->refresh();

    expect($concern->is_duplicate)->toBeFalse()
        ->and($concern->parent_concern_id)->toBeNull();
});

test('it does NOT cluster concerns far away', function () {
    Event::fake();
    Queue::fake();

    // 1. Create Parent Concern
    $parent = Concern::factory()->create([
        'citizen_id' => $this->citizen->id,
        'category' => 'safety',
        'latitude' => 10.0000,
        'longitude' => 123.0000,
    ]);

    // 2. Create New Concern (>50m away)
    // 0.001 degrees is roughly 111m, which is > 50m
    $data = [
        'type' => 'manual',
        'title' => 'Far Away Accident',
        'description' => 'Another one',
        'category' => 'safety',
        'latitude' => 10.0020,
        'longitude' => 123.0020,
    ];

    $concern = $this->concernService->createConcern($data, $this->citizen->id);
    $this->concernService->finalizeConcern($concern->id);

    $concern->refresh();

    expect($concern->is_duplicate)->toBeFalse();
});

test('purok leader sees related reports count in api response', function () {
    Event::fake();
    Queue::fake();

    // 1. Create Parent Concern
    $parent = Concern::factory()->create([
        'citizen_id' => $this->citizen->id,
        'category' => 'safety',
        'latitude' => 10.0000,
        'longitude' => 123.0000,
        'created_at' => now()->subMinutes(10),
        'status' => 'pending',
    ]);

    // Assign parent to our Purok Leader (id 2)
    ConcernDistribution::create([
        'concern_id' => $parent->id,
        'purok_leader_id' => $this->purokLeader->id,
        'status' => 'assigned',
        'assigned_at' => now(),
    ]);

    // 2. Create 3 Duplicate Concerns linked to parent
    Concern::factory()->count(3)->create([
        'citizen_id' => $this->citizen->id,
        'parent_concern_id' => $parent->id,
        'is_duplicate' => true,
        'category' => 'safety',
    ]);

    // 3. Ensure Purok Leader has correct role for middleware
    // Create the role first because of foreign key constraint
    \App\Models\Roles::factory()->create(['id' => 2, 'name' => 'Purok Leader']);

    $this->purokLeader->role_id = 2;
    $this->purokLeader->save();

    // 4. Hit API
    // We use Sanctum::actingAs to pass auth:sanctum check
    \Laravel\Sanctum\Sanctum::actingAs(
        $this->purokLeader,
        ['*']
    );

    $response = $this->getJson('/api/v1/purok-leader/concerns');

    // 5. Assert
    $response->assertOk();

    // Check if the first concern in the list is our parent and has the count
    $data = $response->json('data.concerns');

    // Find our specific concern in the list (in case other tests left data, though RefreshDatabase should clear it)
    $concernData = collect($data)->firstWhere('id', $parent->id);

    expect($concernData)->not->toBeNull()
        ->and($concernData['duplicatesCount'])->toBe(3);
});
