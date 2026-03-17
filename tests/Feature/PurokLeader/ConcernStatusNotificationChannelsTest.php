<?php

namespace Tests\Feature\PurokLeader;

use App\Jobs\SendConcernStatusNotificationJob;
use App\Jobs\SendExpoPushNotificationJob;
use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConcernStatusNotificationChannelsTest extends TestCase
{
    use RefreshDatabase;

    private User $purokLeader;

    private User $citizen;

    protected function setUp(): void
    {
        parent::setUp();

        Roles::factory()->create(['id' => 2, 'name' => 'Purok Leader']);
        Roles::factory()->create(['id' => 3, 'name' => 'Citizen']);

        $this->purokLeader = User::factory()->create(['role_id' => 2]);
        $this->citizen = User::factory()->create(['role_id' => 3]);
    }

    public function test_ongoing_status_dispatches_push_and_email(): void
    {
        Queue::fake();
        Event::fake();

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'status' => 'pending',
        ]);

        ConcernDistribution::create([
            'concern_id' => $concern->id,
            'purok_leader_id' => $this->purokLeader->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        Sanctum::actingAs($this->purokLeader, ['access-api']);

        $response = $this->putJson("/api/v1/purok-leader/concerns/{$concern->id}/status", [
            'status' => 'ongoing',
            'remarks' => 'Action already in progress',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.new_status', 'ongoing');

        Queue::assertPushed(SendExpoPushNotificationJob::class);
        Queue::assertPushed(SendConcernStatusNotificationJob::class);
    }

    public function test_resolved_status_after_awaiting_confirmation_dispatches_push_and_email(): void
    {
        Queue::fake();
        Event::fake();

        $concern = Concern::factory()->create([
            'citizen_id' => $this->citizen->id,
            'status' => 'awaiting_confirmation',
            'resolution_requested_at' => now()->subHours(25),
        ]);

        ConcernDistribution::create([
            'concern_id' => $concern->id,
            'purok_leader_id' => $this->purokLeader->id,
            'status' => 'awaiting_confirmation',
            'assigned_at' => now()->subDays(1),
            'acknowledged_at' => now()->subHours(20),
        ]);

        Sanctum::actingAs($this->purokLeader, ['access-api']);

        $response = $this->putJson("/api/v1/purok-leader/concerns/{$concern->id}/status", [
            'status' => 'resolved',
            'remarks' => 'Resolved after confirmation window',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.new_status', 'resolved');

        Queue::assertPushed(SendExpoPushNotificationJob::class);
        Queue::assertPushed(SendConcernStatusNotificationJob::class);
    }
}
