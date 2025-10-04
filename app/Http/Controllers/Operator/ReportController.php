<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\PublicPost;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        // Only show acknowledged reports in the table
        $query = Report::with(['user', 'acknowledgedBy'])
                      ->where('is_acknowledge', true);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('transcript', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhereHas('user', function ($userQuery) use ($searchTerm) {
                      $userQuery->where('name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        // Filter by report type
        if ($request->has('report_type') && $request->report_type) {
            $query->where('report_type', $request->report_type);
        }

        // Filter by status (Ongoing or Resolved)
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $reports = $query->orderBy('created_at', 'desc')
                        ->paginate(10)
                        ->withQueryString();

        // Get pending unacknowledged reports for the carousel
        $pendingReports = Report::with(['user', 'acknowledgedBy'])
                               ->where('status', 'Pending')
                               ->where('is_acknowledge', false)
                               ->orderBy('created_at', 'desc')
                               ->get();

        return Inertia::render('reports', [
            'reports' => $reports,
            'pendingReports' => $pendingReports,
            'filters' => $request->only(['search', 'report_type', 'status']),
            'reportTypes' => Report::getReportTypes(),
            'statusOptions' => Report::getStatusOptions(),
        ]);
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
                'report_type' => 'required|string|in:' . implode(',', Report::getReportTypes()),
                'transcript' => 'required|string|max:500',
                'description' => 'required|string|max:1000',
                'latitute' => 'required|numeric|between:-90,90',
                'longtitude' => 'required|numeric|between:-180,180',
                'user_id' => 'nullable|exists:users,id',
                'status' => 'nullable|string|in:Pending,Ongoing,Resolved,Archived',
            ]);

            // Set user_id to current user if not provided
            if (!isset($validated['user_id'])) {
                $validated['user_id'] = auth()->id();
            }
            
            // Set default status if not provided
            if (!isset($validated['status'])) {
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

    public function update(Request $request, Report $report)
    {
        try {
            $validated = $request->validate([
                'report_type' => 'required|string|in:' . implode(',', Report::getReportTypes()),
                'transcript' => 'required|string|max:500',
                'description' => 'required|string|max:1000',
                'latitute' => 'required|numeric|between:-90,90',
                'longtitude' => 'required|numeric|between:-180,180',
                'user_id' => 'nullable|exists:users,id',
                'is_acknowledge' => 'nullable|boolean',
                'acknowledge_by' => 'nullable|exists:users,id',
                'status' => 'nullable|string|in:Pending,Ongoing,Resolved,Archived',
            ]);

            // Auto-set status to 'Ongoing' if report is being acknowledged
            if (isset($validated['is_acknowledge']) && $validated['is_acknowledge'] === true) {
                $validated['status'] = 'Ongoing';
            }

            DB::beginTransaction();
            try {
                $report->update($validated);
                DB::commit();

                return redirect()->route('reports')
                    ->with('success', 'Report updated successfully.');
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

    public function destroy(Report $report)
    {
        try {
            DB::beginTransaction();
            try {
                // Set status to 'Archived' before soft deleting
                $report->update(['status' => 'Archived']);
                $report->delete();
                DB::commit();

                return redirect()->route('reports')
                    ->with('success', 'Report archived successfully.');
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

    public function acknowledge(Report $report)
    {
        try {
            if ($report->isAcknowledged()) {
                return back()->with('error', 'Report is already acknowledged.');
            }

            DB::beginTransaction();
            try {
                $report->acknowledge(auth()->id());
                
                // Automatically create a public post for the acknowledged report if it doesn't exist
                if (!$report->publicPost) {
                    PublicPost::create([
                        'report_id' => $report->id,
                        'published_by' => auth()->id(),
                        'published_at' => null, // Draft by default
                    ]);
                }
                
                DB::commit();

                return redirect()->route('reports')
                    ->with('success', 'Report acknowledged and added to public posts.')
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

    public function resolve(Report $report)
    {
        try {
            if ($report->status === 'Resolved') {
                return back()->with('error', 'Report is already resolved.');
            }

            if ($report->status !== 'Ongoing') {
                return back()->with('error', 'Only ongoing reports can be resolved.');
            }

            DB::beginTransaction();
            try {
                $report->resolve();
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