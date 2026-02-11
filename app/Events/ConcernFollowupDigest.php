<?php

namespace App\Events;

use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConcernFollowupDigest implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Concern $parentConcern,
        public ConcernDistribution $distribution,
        public int $newFollowups,
        public int $totalFollowups
    ) {}

    /**
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('purok-leader.'.$this->distribution->purok_leader_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'concern.followup.digest';
    }

    public function broadcastWith(): array
    {
        return [
            'concern' => [
                'id' => $this->parentConcern->id,
                'tracking_code' => $this->parentConcern->tracking_code,
                'title' => $this->parentConcern->title,
            ],
            'new_followups' => $this->newFollowups,
            'total_followups' => $this->totalFollowups,
            'message' => 'New follow-up reports were merged into an existing concern thread.',
        ];
    }
}
