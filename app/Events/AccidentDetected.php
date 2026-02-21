<?php

namespace App\Events;

use App\Models\Accident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AccidentDetected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $accident;

    /**
     * Create a new event instance.
     */
    public function __construct(Accident $accident)
    {
        $this->accident = $accident->load('media');
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('accidents');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'accident.detected';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->accident->id,
            'title' => $this->accident->title,
            'description' => $this->accident->description,
            'accidentType' => $this->accident->accident_type,
            'accident_type' => $this->accident->accident_type,
            'severity' => $this->accident->severity,
            'status' => $this->accident->status,
            'latitude' => $this->accident->latitude,
            'longitude' => $this->accident->longitude,
            'occurredAt' => $this->accident->occurred_at,
            'createdAt' => $this->accident->created_at,
            'media' => $this->accident->media->map(function ($media) {
                return $media->original_path;
            })->toArray(),
        ];
    }
}
