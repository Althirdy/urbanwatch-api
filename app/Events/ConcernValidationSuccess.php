<?php

namespace App\Events;

use App\Models\Citizen\Concern;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConcernValidationSuccess implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $concern;

    /**
     * Create a new event instance.
     */
    public function __construct(Concern $concern)
    {
        $this->concern = $concern;
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
        return 'concern.validation.success';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'concern' => [
                'id' => $this->concern->id,
                'status' => $this->concern->status,
                'category' => $this->concern->category,
                'severity' => $this->concern->severity,
                'tracking_code' => $this->concern->tracking_code,
            ],
            'message' => 'Concern verified and submitted successfully.',
        ];
    }
}
