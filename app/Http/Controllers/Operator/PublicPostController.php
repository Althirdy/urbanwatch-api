<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\PublicPost;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PublicPostController extends Controller
{
    /**
     * Display a listing of public posts.
     */
    public function index(Request $request)
    {
        try {
            // Check if this is an API request (for AJAX calls)
            if ($request->expectsJson()) {
                return $this->getPublicPostsJson($request);
            }

            // For web requests, return Inertia response
            $query = PublicPost::with([
                'report' => function($query) {
                    $query->with('user');
                },
                'publishedBy'
            ])->orderBy('created_at', 'desc');

            // Filter by publication status
            if ($request->has('status')) {
                switch ($request->status) {
                    case 'published':
                        $query->published();
                        break;
                    case 'unpublished':
                        $query->unpublished();
                        break;
                    case 'scheduled':
                        $query->where('published_at', '>', now());
                        break;
                }
            }

            // Filter by date range
            if ($request->has('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // Search functionality
            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('report', function ($q) use ($search) {
                    $q->where('transcript', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('report_type', 'like', "%{$search}%");
                });
            }

            $publicPosts = $query->paginate($request->get('per_page', 15));

            return Inertia::render('public-post', [
                'data' => $publicPosts
            ]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to retrieve public posts: ' . $e->getMessage()]);
        }
    }

    /**
     * Get public posts data as JSON (for API requests)
     */
    private function getPublicPostsJson(Request $request): JsonResponse
    {
        try {
            $query = PublicPost::with([
                'report' => function($query) {
                    $query->with('user');
                },
                'publishedBy'
            ])->orderBy('created_at', 'desc');

            // Filter by publication status
            if ($request->has('status')) {
                switch ($request->status) {
                    case 'published':
                        $query->published();
                        break;
                    case 'unpublished':
                        $query->unpublished();
                        break;
                    case 'scheduled':
                        $query->where('published_at', '>', now());
                        break;
                }
            }

            // Filter by date range
            if ($request->has('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // Search functionality
            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('report', function ($q) use ($search) {
                    $q->where('transcript', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('report_type', 'like', "%{$search}%");
                });
            }

            $publicPosts = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'status' => 'success',
                'message' => 'Public posts retrieved successfully',
                'data' => $publicPosts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve public posts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created public post.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'report_id' => 'required|exists:reports,id',
                'published_at' => 'nullable|date|after_or_equal:now',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if public post already exists for this report
            if (PublicPost::where('report_id', $request->report_id)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'A public post already exists for this report'
                ], 409);
            }

            $publicPost = PublicPost::create([
                'report_id' => $request->report_id,
                'published_by' => Auth::id(),
                'published_at' => $request->published_at,
            ]);

            $publicPost->load(['report.user', 'publishedBy']);

            return response()->json([
                'status' => 'success',
                'message' => 'Public post created successfully',
                'data' => $publicPost
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create public post',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified public post.
     */
    public function show(PublicPost $publicPost): JsonResponse
    {
        try {
            $publicPost->load(['report.user', 'publishedBy']);

            return response()->json([
                'status' => 'success',
                'message' => 'Public post retrieved successfully',
                'data' => $publicPost
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve public post',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified public post.
     */
    public function update(Request $request, PublicPost $publicPost)
    {
        try {
            $validator = Validator::make($request->all(), [
                'published_at' => 'nullable|date',
                'transcript' => 'nullable|string|max:1000',
                'description' => 'nullable|string|max:2000',
            ]);

            if ($validator->fails()) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Validation failed',
                        'errors' => $validator->errors()
                    ], 422);
                }
                return back()->withErrors($validator->errors());
            }

            // Update the public post
            $publicPost->update($request->only(['published_at']));
            
            // Update the associated report if transcript or description are provided
            if ($request->has('transcript') || $request->has('description')) {
                $publicPost->report->update($request->only(['transcript', 'description']));
            }
            
            $publicPost->load(['report.user', 'publishedBy']);

            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Public post updated successfully',
                    'data' => $publicPost
                ]);
            }

            return redirect()->route('public-posts')->with('success', 'Public post updated successfully');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to update public post',
                    'error' => $e->getMessage()
                ], 500);
            }
            return back()->withErrors(['error' => 'Failed to update public post: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified public post from storage (soft delete).
     */
    public function destroy(Request $request, PublicPost $publicPost)
    {
        try {
            $publicPost->delete();

            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Public post deleted successfully'
                ]);
            }

            return redirect()->route('public-posts')->with('success', 'Public post deleted successfully');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to delete public post',
                    'error' => $e->getMessage()
                ], 500);
            }
            return back()->withErrors(['error' => 'Failed to delete public post: ' . $e->getMessage()]);
        }
    }

    /**
     * Publish a public post immediately.
     */
    public function publish(Request $request, PublicPost $publicPost)
    {
        try {
            $publicPost->publish();
            $publicPost->load(['report.user', 'publishedBy']);

            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Public post published successfully',
                    'data' => $publicPost
                ]);
            }

            return redirect()->route('public-posts')->with('success', 'Public post published successfully');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to publish public post',
                    'error' => $e->getMessage()
                ], 500);
            }
            return back()->withErrors(['error' => 'Failed to publish public post: ' . $e->getMessage()]);
        }
    }

    /**
     * Unpublish a public post (set published_at to null).
     */
    public function unpublish(Request $request, PublicPost $publicPost)
    {
        try {
            $publicPost->update(['published_at' => null]);
            $publicPost->load(['report.user', 'publishedBy']);

            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Public post unpublished successfully',
                    'data' => $publicPost
                ]);
            }

            return redirect()->route('public-posts')->with('success', 'Public post unpublished successfully');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to unpublish public post',
                    'error' => $e->getMessage()
                ], 500);
            }
            return back()->withErrors(['error' => 'Failed to unpublish public post: ' . $e->getMessage()]);
        }
    }

    /**
     * Get available reports that can be turned into public posts.
     */
    public function getAvailableReports(Request $request): JsonResponse
    {
        try {
            $query = Report::with('user')
                ->whereDoesntHave('publicPost')
                ->where('is_acknowledge', true)
                ->where('status', 'Ongoing')
                ->orderBy('created_at', 'desc');

            // Search functionality
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('transcript', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('report_type', 'like', "%{$search}%");
                });
            }

            // Filter by report type
            if ($request->has('report_type')) {
                $query->where('report_type', $request->report_type);
            }

            $reports = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'status' => 'success',
                'message' => 'Available reports retrieved successfully',
                'data' => $reports
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve available reports',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get public posts statistics.
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = [
                'total_posts' => PublicPost::count(),
                'published_posts' => PublicPost::published()->count(),
                'unpublished_posts' => PublicPost::unpublished()->count(),
                'scheduled_posts' => PublicPost::where('published_at', '>', now())->count(),
                'posts_this_month' => PublicPost::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'recent_posts' => PublicPost::with(['report.user', 'publishedBy'])
                    ->published()
                    ->limit(5)
                    ->latest('published_at')
                    ->get(),
            ];

            return response()->json([
                'status' => 'success',
                'message' => 'Statistics retrieved successfully',
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk actions on public posts.
     */
    public function bulkAction(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'action' => 'required|in:publish,unpublish,delete',
                'post_ids' => 'required|array|min:1',
                'post_ids.*' => 'exists:public_posts,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $posts = PublicPost::whereIn('id', $request->post_ids);
            $count = $posts->count();

            switch ($request->action) {
                case 'publish':
                    $posts->update(['published_at' => now()]);
                    $message = "{$count} posts published successfully";
                    break;
                case 'unpublish':
                    $posts->update(['published_at' => null]);
                    $message = "{$count} posts unpublished successfully";
                    break;
                case 'delete':
                    $posts->delete();
                    $message = "{$count} posts deleted successfully";
                    break;
            }

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'affected_count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Bulk action failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
