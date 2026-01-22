<?php

namespace App\Events;

use App\Models\Citizen\Concern;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConcernMerged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $duplicateConcern;

    public $parentConcern;

    /**
     * Create a new event instance.
     */
    public function __construct(Concern $duplicateConcern, Concern $parentConcern)
    {
        $this->duplicateConcern = $duplicateConcern;
        $this->parentConcern = $parentConcern;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.'.$this->duplicateConcern->citizen_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'concern.merged';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'duplicateConcernId' => $this->duplicateConcern->id,
            'parentConcern' => [
                'id' => $this->parentConcern->id,
                'trackingCode' => $this->parentConcern->tracking_code,
                'title' => $this->parentConcern->title,
                'category' => $this->parentConcern->category,
                'status' => $this->parentConcern->status,
            ],
            'message' => 'Your report was identified as a follow-up and merged with an existing concern.',
        ];
    }
}
