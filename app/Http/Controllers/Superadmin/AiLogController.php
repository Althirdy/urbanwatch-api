<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\cctvDevices;
use App\Models\Citizen\Concern;
use App\Models\FalseAlarm;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class AiLogController extends Controller
{
    private const DEFAULT_SORT_BY = 'created_at';

    private const DEFAULT_SORT_DIR = 'desc';

    private const YOLO_SORTABLE_COLUMNS = [
        'id',
        'created_at',
        'confidence_score',
        'attempted_accident_type',
    ];

    private const CONCERN_SORTABLE_COLUMNS = [
        'id',
        'created_at',
        'category',
        'ai_confidence',
    ];

    public function index(Request $request): Response
    {
        $activeTab = $request->input('tab', 'yolo');
        if (! in_array($activeTab, ['yolo', 'concerns'], true)) {
            $activeTab = 'yolo';
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));
        [$sortBy, $sortDir] = $this->resolveSorting($request, $activeTab);

        $logs = $activeTab === 'concerns'
            ? $this->getConcernFalseAlarmLogs($request, $perPage, $sortBy, $sortDir)
            : $this->getYoloFalseAlarmLogs($request, $perPage, $sortBy, $sortDir);

        return Inertia::render('ai-logs', [
            'activeTab' => $activeTab,
            'logs' => $logs,
            'filters' => [
                'tab' => $activeTab,
                'search' => $request->input('search'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
                'device_id' => $request->input('device_id'),
                'attempted_type' => $request->input('attempted_type'),
                'rejection_source' => $request->input('rejection_source'),
                'category' => $request->input('category'),
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'options' => [
                'devices' => cctvDevices::query()
                    ->select(['id', 'location_name'])
                    ->orderBy('location_name')
                    ->get()
                    ->map(fn ($device) => [
                        'id' => $device->id,
                        'name' => $device->location_name,
                    ])->values(),
                'attemptedTypes' => FalseAlarm::query()
                    ->whereNotNull('attempted_accident_type')
                    ->distinct()
                    ->orderBy('attempted_accident_type')
                    ->pluck('attempted_accident_type')
                    ->values(),
                'concernCategories' => Concern::query()
                    ->whereNotNull('category')
                    ->distinct()
                    ->orderBy('category')
                    ->pluck('category')
                    ->values(),
            ],
        ]);
    }

    private function getYoloFalseAlarmLogs(Request $request, int $perPage, string $sortBy, string $sortDir): LengthAwarePaginator
    {
        $query = FalseAlarm::query()
            ->with(['cctvDevice:id,location_name']);

        if ($request->filled('search')) {
            $searchTerm = (string) $request->input('search');
            $query->where(function ($innerQuery) use ($searchTerm) {
                $innerQuery->where('gemini_reasoning', 'like', "%{$searchTerm}%")
                    ->orWhere('attempted_accident_type', 'like', "%{$searchTerm}%")
                    ->orWhereHas('cctvDevice', function ($deviceQuery) use ($searchTerm) {
                        $deviceQuery->where('location_name', 'like', "%{$searchTerm}%");
                    });
            });
        }

        if ($request->filled('device_id')) {
            $query->where('cctv_device_id', $request->integer('device_id'));
        }

        if ($request->filled('attempted_type')) {
            $query->where('attempted_accident_type', $request->input('attempted_type'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $query->orderBy($sortBy, $sortDir);

        $logs = $query->paginate($perPage)->withQueryString();

        $logs->getCollection()->transform(function (FalseAlarm $falseAlarm) {
            return [
                'id' => $falseAlarm->id,
                'cctv_device_id' => $falseAlarm->cctv_device_id,
                'device_name' => $falseAlarm->cctvDevice?->location_name ?? 'Unknown',
                'location_name' => $falseAlarm->cctvDevice?->location_name ?? 'Unknown',
                'attempted_accident_type' => $falseAlarm->attempted_accident_type,
                'gemini_reasoning' => $falseAlarm->gemini_reasoning,
                'confidence_score' => $falseAlarm->confidence_score,
                'detected_objects' => $falseAlarm->detected_objects,
                'gemini_metadata' => $falseAlarm->gemini_metadata,
                'detected_at' => $falseAlarm->detected_at,
                'created_at' => $falseAlarm->created_at,
            ];
        });

        return $logs;
    }

    private function getConcernFalseAlarmLogs(Request $request, int $perPage, string $sortBy, string $sortDir): LengthAwarePaginator
    {
        $query = Concern::query()
            ->with(['citizen:id,name,email'])
            ->where('status', 'rejected')
            ->where('is_valid', false);

        if ($request->filled('search')) {
            $searchTerm = (string) $request->input('search');
            $query->where(function ($innerQuery) use ($searchTerm) {
                $innerQuery->where('tracking_code', 'like', "%{$searchTerm}%")
                    ->orWhere('title', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhere('transcript_text', 'like', "%{$searchTerm}%")
                    ->orWhere('rejection_reason', 'like', "%{$searchTerm}%")
                    ->orWhereHas('citizen', function ($citizenQuery) use ($searchTerm) {
                        $citizenQuery->where('name', 'like', "%{$searchTerm}%")
                            ->orWhere('email', 'like', "%{$searchTerm}%");
                    });
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('rejection_source')) {
            if ($request->input('rejection_source') === 'official') {
                $query->whereNotNull('ai_analysis_raw->rejected_by');
            } elseif ($request->input('rejection_source') === 'ai_model') {
                $query->whereNull('ai_analysis_raw->rejected_by');
            }
        }

        $query->orderBy($sortBy, $sortDir);

        $logs = $query->paginate($perPage)->withQueryString();

        $logs->getCollection()->transform(function (Concern $concern) {
            $rawAnalysis = is_array($concern->ai_analysis_raw) ? $concern->ai_analysis_raw : null;
            $rejectionSource = isset($rawAnalysis['rejected_by']) ? 'official' : 'ai_model';

            return [
                'id' => $concern->id,
                'tracking_code' => $concern->tracking_code,
                'citizen_id' => $concern->citizen_id,
                'citizen_name' => $concern->citizen?->name,
                'title' => $concern->title,
                'description' => $concern->description,
                'transcript_text' => $concern->transcript_text,
                'status' => $concern->status,
                'is_valid' => $concern->is_valid,
                'category' => $concern->category,
                'specific_type' => $concern->specific_type,
                'severity' => $concern->severity,
                'rejection_reason' => $concern->rejection_reason,
                'ai_category' => $concern->ai_category,
                'ai_severity' => $concern->ai_severity,
                'ai_confidence' => $concern->ai_confidence,
                'coherence_score' => $concern->coherence_score,
                'detail_score' => $concern->detail_score,
                'ai_processed_at' => $concern->ai_processed_at,
                'ai_analysis_raw' => $rawAnalysis,
                'rejection_source' => $rejectionSource,
                'created_at' => $concern->created_at,
            ];
        });

        return $logs;
    }

    /**
     * @return array{0:string,1:string}
     */
    private function resolveSorting(Request $request, string $activeTab): array
    {
        $sortableColumns = $activeTab === 'concerns'
            ? self::CONCERN_SORTABLE_COLUMNS
            : self::YOLO_SORTABLE_COLUMNS;

        $sortBy = (string) $request->input('sort_by', self::DEFAULT_SORT_BY);
        if (! in_array($sortBy, $sortableColumns, true)) {
            $sortBy = self::DEFAULT_SORT_BY;
        }

        $sortDir = strtolower((string) $request->input('sort_dir', self::DEFAULT_SORT_DIR));
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = self::DEFAULT_SORT_DIR;
        }

        return [$sortBy, $sortDir];
    }
}
