<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Accident;
use App\Models\FalseAlarm;
use App\Models\PublicPost;
use App\Models\Report;
use App\Models\User;
use App\Services\Operator\PublicPostService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(protected PublicPostService $publicPostService) {}

    public function index(Request $request): Response
    {
        $viewType = $request->input('view', 'incidents'); // 'incidents' or 'false_alarms'

        if ($viewType === 'false_alarms') {
            $query = FalseAlarm::with(['cctvDevice']);

            // Search functionality for False Alarms
            if ($request->has('search') && $request->search) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('gemini_reasoning', 'like', "%{$searchTerm}%")
                        ->orWhere('attempted_accident_type', 'like', "%{$searchTerm}%");
                });
            }

            $reports = $query->orderBy('created_at', 'desc')
                ->paginate(10)
                ->withQueryString();

            $reports->getCollection()->transform(function ($alarm) {
                $displayLocation = $alarm->cctvDevice?->location_name;

                return [
                    'id' => $alarm->id,
                    'report_type' => ucfirst($alarm->attempted_accident_type ?? 'Unknown'),
                    'transcript' => 'AI: False Alarm Detected',
                    'description' => $alarm->gemini_reasoning,
                    'latitude' => 0,
                    'longtitude' => 0,
                    'location_name' => $displayLocation,
                    'is_acknowledge' => true, // False alarms are auto-acknowledged/ignored
                    'status' => 'False Alarm',
                    'created_at' => $alarm->created_at,
                    'updated_at' => $alarm->updated_at,
                    'user' => null,
                    'acknowledgedBy' => null,
                    'media' => [], // No media for false alarms
                ];
            });
        } else {
            // Get accidents with media and cctv device
            $query = Accident::with(['media', 'cctvDevice']);

            // Search functionality
            if ($request->has('search') && $request->search) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('title', 'like', "%{$searchTerm}%")
                        ->orWhere('description', 'like', "%{$searchTerm}%")
                        ->orWhere('accident_type', 'like', "%{$searchTerm}%");
                });
            }

            // Filter by accident type
            if ($request->has('report_type') && $request->report_type) {
                $query->where('accident_type', $request->report_type);
            }

            // Filter by status
            if ($request->has('acknowledged') && $request->acknowledged !== '') {
                $statusFilter = $request->acknowledged === 'true' ? 'Resolved' : 'Pending';
                $query->where('status', $statusFilter);
            }

            // Order by status (Pending first, then In Progress, then Resolved last) and then by created_at
            $accidents = $query
                ->orderByRaw("CASE 
                    WHEN status = 'Pending' THEN 1 
                    WHEN status = 'In Progress' THEN 2 
                    WHEN status = 'Resolved' THEN 3 
                    ELSE 4 
                END")
                ->orderBy('created_at', 'desc')
                ->paginate(10)
                ->withQueryString();

            // Transform accidents data to match reports structure
            $accidents->getCollection()->transform(function ($accident) {
                // Get location from CCTV device
                $displayLocation = $accident->cctvDevice?->location_name;

                return [
                    'id' => $accident->id,
                    'report_type' => ucfirst($accident->accident_type),
                    'transcript' => $accident->title,
                    'description' => $accident->description,
                    'latitude' => $accident->latitude,
                    'longtitude' => $accident->longitude,
                    'location_name' => $displayLocation,
                    'is_acknowledge' => strtolower($accident->status) !== 'pending',
                    'status' => ucfirst($accident->status),
                    'created_at' => $accident->created_at,
                    'updated_at' => $accident->updated_at,
                    'user' => null, // Accidents don't have users (YOLO detected)
                    'acknowledgedBy' => null,
                    'media' => $accident->media->map(function ($media) {
                        return $media->original_path;
                    })->toArray(),
                ];
            });

            $reports = $accidents;
        }

        return Inertia::render('reports', [
            'reports' => $reports,
            'currentView' => $viewType,
            'filters' => $request->only(['search', 'report_type', 'acknowledged', 'view']),
            'reportTypes' => ['Accident', 'Fire', 'Flood'], // Accident types
            'statusOptions' => ['Pending', 'Ongoing', 'Resolved', 'Archived'],
        ]);
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     * Returns distance in meters.
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // Earth's radius in meters

        $lat1 = deg2rad((float) $lat1);
        $lon1 = deg2rad((float) $lon1);
        $lat2 = deg2rad((float) $lat2);
        $lon2 = deg2rad((float) $lon2);

        $dLat = $lat2 - $lat1;
        $dLon = $lon2 - $lon1;

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos($lat1) * cos($lat2) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function create(): Response
    {
        $users = User::all();

        return Inertia::render('Reports/Create', [
            'users' => $users,
            'reportTypes' => Report::getReportTypes(),
            'statusOptions' => Report::getStatusOptions(),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'report_type' => 'required|string|in:'.implode(',', Report::getReportTypes()),
                'transcript' => 'required|string|max:500',
                'description' => 'required|string|max:1000',
                'latitude' => 'required|numeric|between:-90,90',
                'longtitude' => 'required|numeric|between:-180,180',
                'user_id' => 'nullable|exists:users,id',
                'status' => 'nullable|string|in:Pending,Ongoing,Resolved,Archived',
            ]);

            // Set user_id to current user if not provided
            if (! isset($validated['user_id'])) {
                $validated['user_id'] = auth()->id();
            }

            // Set default status if not provided
            if (! isset($validated['status'])) {
                $validated['status'] = 'Pending';
            }

            $validated['is_acknowledge'] = false;

            DB::beginTransaction();
            try {
                $report = Report::create($validated);

                DB::commit();

                return redirect()->route('reports')
                    ->with('success', 'Report created successfully.');

            } catch (\Exception $e) {
                DB::rollBack();

                return back()
                    ->with('error', 'Failed to create report. Please try again.')
                    ->withInput();
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }
    }

    public function show(Report $report): Response
    {
        $report->load(['user', 'acknowledgedBy']);

        return Inertia::render('Reports/Show', [
            'report' => $report,
            'statusOptions' => Report::getStatusOptions(),
        ]);
    }

    public function edit(Report $report): Response
    {
        $users = User::all();

        return Inertia::render('Reports/Edit', [
            'report' => $report,
            'users' => $users,
            'reportTypes' => Report::getReportTypes(),
            'statusOptions' => Report::getStatusOptions(),
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            // Find accident instead of report
            $accident = Accident::findOrFail($id);

            $validated = $request->validate([
                'report_type' => 'required|string',
                'transcript' => 'nullable|string|max:500',
                'description' => 'required|string|max:1000',
                'latitute' => 'required|numeric|between:-90,90',
                'longtitude' => 'required|numeric|between:-180,180',
                'status' => 'nullable|string|in:Pending,In Progress,Resolved',
            ]);

            DB::beginTransaction();
            try {
                // Map report fields to accident fields
                $accident->update([
                    'title' => $validated['transcript'] ?? $accident->title,
                    'description' => $validated['description'],
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longtitude'],
                    'accident_type' => strtolower($validated['report_type']),
                    'status' => $validated['status'] ?? $accident->status,
                ]);

                DB::commit();

                return redirect()->route('reports')
                    ->with('success', 'Accident report updated successfully.');
            } catch (\Exception $e) {
                DB::rollBack();

                return back()
                    ->with('error', 'Failed to update report. Please try again.')
                    ->withInput();
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }
    }

    public function destroy($id)
    {
        try {
            $accident = Accident::findOrFail($id);

            DB::beginTransaction();
            try {
                // Set status to 'archived' before deleting
                $accident->update(['status' => 'archived']);
                $accident->delete();
                DB::commit();

                return redirect()->route('reports')
                    ->with('success', 'Accident report archived successfully.');
            } catch (\Exception $e) {
                DB::rollBack();

                return back()
                    ->with('error', 'Failed to archive report. Please try again.');
            }
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to archive report. Please try again.');
        }
    }

    public function acknowledge($id)
    {
        try {
            $accident = Accident::findOrFail($id);

            \Log::info('Acknowledging accident', [
                'id' => $id,
                'current_status' => $accident->status,
            ]);

            // Check if already acknowledged (not Pending)
            if ($accident->status !== 'Pending') {
                \Log::warning('Accident already acknowledged', ['status' => $accident->status]);

                return back()->with('error', 'Report is already acknowledged.');
            }

            DB::beginTransaction();
            try {
                // Update status to In Progress when acknowledged
                $accident->update([
                    'status' => 'In Progress',
                ]);

                \Log::info('Accident status updated', ['new_status' => $accident->fresh()->status]);

                // Create a PublicPost for this accident using the service
                $imagePath = null;
                $firstMedia = $accident->media()->first();
                // We'll pass the image as a file if we had it, but here we just have a path.
                // Since the Service handles upload, but we already have the media, we might need to adjust
                // OR we pass the path directly if we modify the Service, BUT better:
                // We construct the data array and let the service handle the creation logic and triggering notifications.
                // Note: The service expects an UploadedFile for 'image', but we already have a path.
                // However, the PublicPost model uses 'image_path'.
                // The service's createPublicPost takes $data and $image.
                // We can cheat slightly or update the service. Let's see...
                // The service does: $publicPost = PublicPost::create([... 'image_path' => $imagePath ...]);
                // So if we pass null as image, image_path becomes null in the service logic.
                // We need to bypass the service's image upload if we already have a path.
                // BUT, createPublicPost doesn't support setting image_path directly from $data unless we modify it.
                // Wait, the service does: 'image_path' => $imagePath (from upload).
                // It does NOT merge $data['image_path'].
                // So we have to pass null as image, and then update it manually or use a specialized method.
                // BETTER: We use the Service to create the post structure and trigger notifications,
                // but we might need to handle the image path separately or update the service to accept it.
                // Let's rely on the fact that we can update the post immediately after creation if needed,
                // OR simpler: We trust the service to create the post.
                // If we want the image, we should probably update the PublicPostService to verify if 'image_path' is in $data.

                // For now, let's look at PublicPostService::createPublicPost again.
                // It takes $data['title'], $data['content'], etc.
                // It ignores $data['image_path'].
                // Let's use the service to create, then force update the image path if we have one.

                $postData = [
                    'title' => 'PAUNAWA: '.$accident->title,
                    'content' => $accident->description,
                    'category' => 'emergency',
                    'postable_id' => $accident->id,
                    'postable_type' => Accident::class,
                    'status' => 'published',
                    // 'published_at' => now(), // Handled by service based on status='published'
                ];

                $publicPost = $this->publicPostService->createPublicPost($postData, null);

                // If we have an existing image path, update it (since we didn't upload a new file)
                if ($firstMedia) {
                    $publicPost->update(['image_path' => $firstMedia->original_path]);
                }

                DB::commit();

                return redirect()->route('reports')
                    ->with('success', 'Accident report acknowledged successfully.')
                    ->with('refresh', true);
            } catch (\Exception $e) {
                DB::rollBack();

                return back()
                    ->with('error', 'Failed to acknowledge report. Please try again.');
            }
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to acknowledge report. Please try again.');
        }
    }

    public function resolve($id)
    {
        try {
            $accident = Accident::findOrFail($id);

            if ($accident->status === 'Resolved') {
                return back()->with('error', 'Report is already resolved.');
            }

            if ($accident->status !== 'In Progress') {
                return back()->with('error', 'Only ongoing reports can be resolved.');
            }

            DB::beginTransaction();
            try {
                $accident->update([
                    'status' => 'Resolved',
                ]);

                // Find the associated public post
                $publicPost = PublicPost::where('postable_id', $accident->id)
                    ->where('postable_type', Accident::class)
                    ->first();

                if ($publicPost) {
                    // Use service to resolve/update the post
                    $this->publicPostService->resolveAccidentPost($publicPost);
                }

                DB::commit();

                return redirect()->route('reports')
                    ->with('success', 'Report resolved successfully.');
            } catch (\Exception $e) {
                DB::rollBack();

                return back()
                    ->with('error', 'Failed to resolve report. Please try again.');
            }
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to resolve report. Please try again.');
        }
    }
}
