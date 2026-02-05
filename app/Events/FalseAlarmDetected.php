<?php

namespace App\Events;

use App\Models\FalseAlarm;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FalseAlarmDetected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $falseAlarm;

    /**
     * Create a new event instance.
     */
    public function __construct(FalseAlarm $falseAlarm)
    {
        $this->falseAlarm = $falseAlarm->load('cctvDevice');
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('false-alarms');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'false-alarm.detected';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $device = $this->falseAlarm->cctvDevice;

        return [
            'id' => $this->falseAlarm->id,
            'device_name' => $device?->device_name ?? 'Unknown Device',
            'location_name' => $device?->location_name ?? 'Unknown Location',
            'attempted_accident_type' => $this->falseAlarm->attempted_accident_type,
            'gemini_reasoning' => $this->falseAlarm->gemini_reasoning,
            'confidence_score' => $this->falseAlarm->confidence_score,
            'detected_objects' => $this->falseAlarm->detected_objects,
            'detected_at' => $this->falseAlarm->detected_at,
            'created_at' => $this->falseAlarm->created_at,
        ];
    }
}
