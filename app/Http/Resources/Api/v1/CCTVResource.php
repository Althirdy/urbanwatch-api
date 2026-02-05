<?php

namespace App\Http\Resources\Api\v1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CCTVResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'location_name' => $this->location_name,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'primaryRtspUrl' => $this->full_rtsp_url,
            'backupRtspUrl' => $this->full_backup_rtsp_url,
        ];
    }
}
