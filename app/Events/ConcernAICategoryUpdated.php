<?php

namespace App\Events;

use App\Models\Citizen\Concern;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ConcernAICategoryUpdated implements ShouldBroadcast
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
        $channels = [];

        // Notify the citizen who created the concern
        if ($this->concern->citizen_id) {
            $channels[] = new PrivateChannel('citizen.'.$this->concern->citizen_id);
        }

        // Notify the assigned purok leader
        $distribution = $this->concern->distribution;
        if ($distribution && $distribution->purok_leader_id) {
            $channels[] = new PrivateChannel('purok-leader.'.$distribution->purok_leader_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'concern.ai.category.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        Log::info('ConcernAICategoryUpdated: Broadcasting event', [
            'concern_id' => $this->concern->id,
            'category' => $this->concern->category,
            'severity' => $this->concern->severity,
            'ai_category' => $this->concern->ai_category,
            'ai_severity' => $this->concern->ai_severity,
            'status' => $this->concern->status,
        ]);

        $payload = [
            'id' => $this->concern->id,
            'title' => $this->concern->title,
            'description' => $this->concern->description,
            'category' => $this->concern->category,
            'severity' => $this->concern->severity,
            'status' => $this->concern->status,
            'transcript_text' => $this->concern->transcript_text,
            'ai_category' => $this->concern->ai_category,
            'ai_severity' => $this->concern->ai_severity,
            'ai_confidence' => $this->concern->ai_confidence,
            'ai_processed_at' => $this->concern->ai_processed_at ?
                (is_string($this->concern->ai_processed_at) ? $this->concern->ai_processed_at : $this->concern->ai_processed_at->toISOString())
                : null,
            'updated_at' => $this->concern->updated_at ?
                (is_string($this->concern->updated_at) ? $this->concern->updated_at : $this->concern->updated_at->toISOString())
                : null,
        ];

        Log::info('ConcernAICategoryUpdated: Payload prepared', ['payload' => $payload]);

        return $payload;
    }
}
