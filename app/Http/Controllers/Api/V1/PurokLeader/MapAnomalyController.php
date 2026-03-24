<?php

namespace App\Http\Controllers\Api\V1\PurokLeader;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AnomalyLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MapAnomalyController extends BaseApiController
{
    /**
     * Get ALL anomaly logs within the barangay (no purok filtering).
     * Used by the mobile app's barangay-wide map view.
     *
     * Response format matches /api/v1/anomaly-logs for frontend reuse.
     */
    public function index(Request $request)
    {
        try {
            $query = AnomalyLog::with('iotBox')
                ->whereHas('iotBox') // Only anomalies from known devices
                ->withCount('relatedAnomalies')
                ->orderBy('created_at', 'desc');

            // Filter by anomaly type
            if ($request->has('anomaly_type')) {
                $query->where('anomaly_type', $request->anomaly_type);
            }

            // Filter by confirmation status
            if ($request->has('is_confirmed')) {
                $query->where('is_confirmed', $request->boolean('is_confirmed'));
            }

            // Filter by time window (default: last 24 hours)
            $hours = $request->input('hours', 24);
            $query->where('created_at', '>=', now()->subHours((int) $hours));

            $anomalyLogs = $query->paginate($request->input('per_page', 100));

            return $this->sendResponse([
                'anomaly_logs' => $anomalyLogs,
            ], 'Map anomalies retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving map anomalies', [
                'error' => $e->getMessage(),
            ]);

            return $this->sendError('Failed to retrieve map anomalies');
        }
    }
}
