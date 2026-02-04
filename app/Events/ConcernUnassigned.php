<?php

namespace App\Events;

use App\Models\Citizen\Concern;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConcernUnassigned implements ShouldBroadcast
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
            new PrivateChannel('operators'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'concern.unassigned';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->concern->id,
            'title' => $this->concern->title,
            'category' => $this->concern->category,
            'severity' => $this->concern->severity,
            'latitude' => $this->concern->latitude,
            'longitude' => $this->concern->longitude,
            'tracking_code' => $this->concern->tracking_code,
            'created_at' => $this->concern->created_at,
        ];
    }
}
