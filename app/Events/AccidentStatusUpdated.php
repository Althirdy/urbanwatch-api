<?php

namespace App\Events;

use App\Models\Accident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event broadcasted when an accident's status is updated.
 *
 * Used to update map markers in real-time on mobile apps.
 * Broadcasts minimal data for efficient marker updates.
 */
class AccidentStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Accident $accident;

    public string $previousStatus;

    /**
     * Create a new event instance.
     *
     * @param  Accident  $accident  The accident that was updated
     * @param  string  $previousStatus  The status before the update
     */
    public function __construct(Accident $accident, string $previousStatus)
    {
        $this->accident = $accident;
        $this->previousStatus = $previousStatus;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * Using a public channel so all authenticated users can receive updates.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('active-accidents');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'accident.status.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * Returns minimal marker data for efficient real-time updates.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->accident->id,
            'latitude' => $this->accident->latitude,
            'longitude' => $this->accident->longitude,
            'accidentType' => $this->accident->accident_type,
            'severity' => $this->accident->severity,
            'status' => $this->accident->status,
            'title' => $this->accident->title,
            'occurredAt' => $this->accident->occurred_at->diffForHumans(),
        ];
    }
}
