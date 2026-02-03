<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\StorePublicPostRequest;
use App\Http\Resources\Api\v1\PublicPostsResource;
use App\Models\PublicPost;
use App\Services\Operator\PublicPostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class PublicPostController extends Controller
{
    protected $publicPostService;

    public function __construct(PublicPostService $publicPostService)
    {
        $this->publicPostService = $publicPostService;
    }

    /**
     * Get published manual public posts for mobile app (cursor paginated)
     */
    public function getMobilePublicPosts(Request $request): JsonResponse
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 15);

        $posts = $this->publicPostService->getPublicPostMobile($search, $perPage);

        return response()->json([
            'status' => 'success',
            'message' => 'Public posts retrieved successfully',
            'data' => PublicPostsResource::collection($posts),
            'pagination' => [
                'next_cursor' => $posts->nextCursor()?->encode(),
                'prev_cursor' => $posts->previousCursor()?->encode(),
            ],
        ]);
    }

    /**
     * Display a listing of public posts.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['status', 'from_date', 'to_date', 'search']);
        $perPage = $request->get('per_page', 15);

        $publicPosts = $this->publicPostService->getAllPublicPosts($filters, $perPage);

        // Check if this is an API request (for AJAX calls)
        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Public posts retrieved successfully',
                'data' => $publicPosts,
            ]);
        }

        // For web requests, return Inertia response
        return Inertia::render('public-post', [
            'data' => $publicPosts,
        ]);
    }

    /**
     * Store a newly created public post.
     */
    public function store(StorePublicPostRequest $request): JsonResponse
    {
        $data = $request->validated();
        $image = $request->file('image');

        $publicPost = $this->publicPostService->createPublicPost($data, $image);

        return response()->json([
            'status' => 'success',
            'message' => 'Public post created successfully',
            'data' => $publicPost,
        ], 201);
    }

    /**
     * Display the specified public post.
     */
    public function show(PublicPost $publicPost): JsonResponse
    {
        $post = $this->publicPostService->getPublicPost($publicPost);

        return response()->json([
            'status' => 'success',
            'message' => 'Public post retrieved successfully',
            'data' => $post,
        ]);
    }

    /**
     * Update the specified public post.
     */
    public function update(Request $request, PublicPost $publicPost)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
            'category' => 'nullable|string',
            'published_at' => 'nullable|date',
            'status' => 'nullable|string|in:draft,published,scheduled',
            'delete_image' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            return back()->withErrors($validator->errors());
        }

        $image = $request->file('image');
        $data = $request->only([
            'title',
            'content',
            'category',
            'published_at',
            'status',
            'delete_image',
        ]);

        $post = $this->publicPostService->updatePublicPost($publicPost, $data, $image);

        return back()->with([
            'status' => 'success',
            'message' => 'Public post updated successfully',
        ]);
    }

    /**
     * Remove the specified public post from storage (soft delete).
     */
    public function destroy(Request $request, PublicPost $publicPost)
    {
        $this->publicPostService->deletePublicPost($publicPost);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Public post deleted successfully',
            ]);
        }

        return redirect()->route('public-posts')->with('success', 'Public post deleted successfully');
    }

    /**
     * Publish a public post immediately.
     */
    public function publish(Request $request, PublicPost $publicPost)
    {
        $post = $this->publicPostService->publishPost($publicPost);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Public post published successfully',
                'data' => $post,
            ]);
        }

        return redirect()->route('public-posts')->with('success', 'Public post published successfully');
    }

    /**
     * Unpublish a public post (set published_at to null).
     */
    public function unpublish(Request $request, PublicPost $publicPost)
    {
        $post = $this->publicPostService->unpublishPost($publicPost);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Public post unpublished successfully',
                'data' => $post,
            ]);
        }

        return redirect()->route('public-posts')->with('success', 'Public post unpublished successfully');
    }

    /**
     * Get available reports that can be turned into public posts.
     */
    public function getAvailableReports(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'report_type']);
        $perPage = $request->get('per_page', 15);

        $reports = $this->publicPostService->getAvailableReports($filters, $perPage);

        return response()->json([
            'status' => 'success',
            'message' => 'Available reports retrieved successfully',
            'data' => $reports,
        ]);
    }

    // /**
    //  * Get public posts statistics.
    //  */
    // public function getStats(): JsonResponse
    // {
    //     $stats = $this->publicPostService->getStats();

    //     return response()->json([
    //         'status' => 'success',
    //         'message' => 'Statistics retrieved successfully',
    //         'data' => $stats,
    //     ]);
    // }

    /**
     * Bulk actions on public posts.
     */
    public function bulkAction(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:publish,unpublish,delete',
            'post_ids' => 'required|array|min:1',
            'post_ids.*' => 'exists:public_posts,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->publicPostService->executeBulkAction($request->action, $request->post_ids);

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'affected_count' => $result['affected_count'],
        ]);
    }

    /**
     * Resolve the accident associated with a public post
     */
    public function resolve(PublicPost $publicPost)
    {
        $this->publicPostService->resolveAccidentPost($publicPost);

        return back()->with('success', 'Accident resolved successfully.');
    }
}
