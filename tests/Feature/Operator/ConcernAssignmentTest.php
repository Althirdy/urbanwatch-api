<?php

namespace Tests\Feature\Operator;

use App\Events\ConcernUnassigned;
use App\Models\Citizen\Concern;
use App\Models\Purok;
use App\Models\User;
use App\Services\ConcernService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ConcernAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected ConcernService $concernService;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        $roles = [
            ['name' => 'Operator', 'description' => 'Operator role with limited access'],
            ['name' => 'Purok Leader', 'description' => 'Purok Leader role with moderate access'],
            ['name' => 'Citizen', 'description' => 'Citizen role with basic access'],
        ];

        foreach ($roles as $role) {
            \App\Models\Roles::firstOrCreate(['name' => $role['name']], $role);
        }

        $this->concernService = app(\App\Services\ConcernService::class);
    }

    public function test_it_marks_concern_as_unassigned_if_no_purok_is_found()
    {
        Event::fake([ConcernUnassigned::class]);

        $citizenRoleId = \App\Models\Roles::where('name', 'Citizen')->value('id');
        $citizen = User::factory()->create(['role_id' => $citizenRoleId]);

        // Create a concern at coordinates that are NOT inside any Purok
        $concern = Concern::create([
            'citizen_id' => $citizen->id,
            'title' => 'Unmapped Incident',
            'description' => 'This is somewhere in the middle of nowhere',
            'category' => 'other',
            'status' => 'pending',
            'latitude' => 0, // 0,0 is definitely unmapped in this project
            'longitude' => 0,
            'tracking_code' => 'CN-UNMAPPED',
            'type' => 'manual',
            'is_valid' => true,
        ]);

        $this->concernService->finalizeConcern($concern->id);

        $this->assertDatabaseMissing('concern_distribution', [
            'concern_id' => $concern->id,
        ]);

        Event::assertDispatched(ConcernUnassigned::class, function ($event) use ($concern) {
            return $event->concern->id === $concern->id;
        });
    }

    public function test_it_allows_purok_leader_to_reject_concern_as_false_alarm()
    {
        $citizenRoleId = \App\Models\Roles::where('name', 'Citizen')->value('id');
        $leaderRoleId = \App\Models\Roles::where('name', 'Purok Leader')->value('id');

        $citizen = User::factory()->create(['role_id' => $citizenRoleId, 'false_alarm_strikes' => 0]);
        $leader = User::factory()->create(['role_id' => $leaderRoleId]);

        $concern = Concern::create([
            'citizen_id' => $citizen->id,
            'title' => 'Spam Incident',
            'description' => 'Pure spam',
            'category' => 'other',
            'status' => 'pending',
            'latitude' => 14.78043,
            'longitude' => 121.0415,
            'tracking_code' => 'CN-SPAM',
            'type' => 'manual',
            'is_valid' => true,
        ]);

        // Mock distribution
        \App\Models\ConcernDistribution::create([
            'concern_id' => $concern->id,
            'purok_leader_id' => $leader->id,
            'status' => 'assigned',
        ]);

        $this->concernService->rejectConcernByOfficial($concern, 'Obvious spam', $leader);

        $this->assertEquals('rejected', $concern->fresh()->status);
        $this->assertFalse($concern->fresh()->is_valid);
        $this->assertEquals(1, $citizen->fresh()->false_alarm_strikes);
        $this->assertEquals('rejected', $concern->distribution->fresh()->status);
    }
}
