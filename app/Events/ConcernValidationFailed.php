<?php

namespace App\Events;

use App\Models\Citizen\Concern;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConcernValidationFailed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $concern;

    public $reason;

    public $strikeCount;

    /**
     * Create a new event instance.
     */
    public function __construct(Concern $concern, string $reason, int $strikeCount)
    {
        $this->concern = $concern;
        $this->reason = $reason;
        $this->strikeCount = $strikeCount;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('citizen.'.$this->concern->citizen_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'concern.validation.failed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'concern' => [
                'id' => $this->concern->id,
                'type' => $this->concern->type,
                'status' => $this->concern->status,
                'rejection_reason' => $this->reason,
                'tracking_code' => $this->concern->tracking_code,
            ],
            'strike_count' => $this->strikeCount,
            'message' => 'Your concern was rejected by our automated system.',
        ];
    }
}
