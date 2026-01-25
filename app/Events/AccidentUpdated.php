<?php

namespace App\Events;

use App\Models\Accident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AccidentUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $accident;
    public $newMedia;

    /**
     * Create a new event instance.
     *
     * @param Accident $accident The updated accident model
     * @param mixed $newMedia The specific new media item that was added
     */
    public function __construct(Accident $accident, $newMedia = null)
    {
        $this->accident = $accident->load('media');
        $this->newMedia = $newMedia;
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
        return 'accident.updated';
    }

    /**
     * Get the data to broadcast.
     * Follows camelCase naming convention.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->accident->id,
            'title' => $this->accident->title,
            'description' => $this->accident->description,
            'accidentType' => $this->accident->accident_type,
            'severity' => $this->accident->severity,
            'status' => $this->accident->status,
            'latitude' => $this->accident->latitude,
            'longitude' => $this->accident->longitude,
            'occurredAt' => $this->accident->occurred_at,
            'updatedAt' => $this->accident->updated_at,
            'media' => $this->accident->media->map(fn($media) => $media->original_path)->toArray(),
            'newMediaUrl' => $this->newMedia ? $this->newMedia->original_path : null,
        ];
    }
}
