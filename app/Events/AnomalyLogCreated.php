<?php

namespace App\Events;

use App\Models\AnomalyLog;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnomalyLogCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public AnomalyLog $anomalyLog;

    /**
     * Create a new event instance.
     */
    public function __construct(AnomalyLog $anomalyLog)
    {
        $this->anomalyLog = $anomalyLog->load('iotBox.location');
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('anomaly-logs');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'anomaly.created';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $iotBox = $this->anomalyLog->iotBox;
        $location = $iotBox?->location;

        return [
            'id' => $this->anomalyLog->id,
            'device_id' => $this->anomalyLog->device_id,
            'anomaly_type' => $this->anomalyLog->anomaly_type,
            'anomaly_type_label' => $this->getAnomalyTypeLabel($this->anomalyLog->anomaly_type),
            'image' => $this->anomalyLog->image,
            'details' => $this->anomalyLog->details,
            'is_confirmed' => $this->anomalyLog->is_confirmed,
            'created_at' => $this->anomalyLog->created_at->toISOString(),
            'iot_box' => [
                'id' => $iotBox?->id,
                'device_name' => $iotBox?->device_name ?? 'Unknown Device',
                'display_location' => $iotBox?->display_location ?? 'Unknown Location',
                'latitude' => $iotBox?->latitude,
                'longitude' => $iotBox?->longitude,
                'is_online' => $iotBox?->is_online ?? false,
            ],
            'location' => $location ? [
                'id' => $location->id,
                'location_name' => $location->location_name,
                'barangay' => $location->barangay,
            ] : null,
        ];
    }

    /**
     * Get human-readable label for anomaly type.
     */
    private function getAnomalyTypeLabel(string $type): string
    {
        return match ($type) {
            'sound_anomaly' => 'Sound Anomaly',
            'anti_tampering' => 'Anti-Tampering Alert',
            'crowded' => 'Crowded Area Detected',
            default => ucfirst(str_replace('_', ' ', $type)),
        };
    }
}
