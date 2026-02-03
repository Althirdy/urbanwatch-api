<?php

namespace App\Services\Operator;

use App\Exceptions\UrbanWatchException;
use App\Jobs\SendPublicPostNotificationsJob;
use App\Models\Accident;
use App\Models\PublicPost;
use App\Models\Report;
use App\Services\FileUploadService;
use App\Services\NotificationService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PublicPostService
{
    public function __construct(
        protected FileUploadService $fileUploadService,
        protected NotificationService $notificationService,
    ) {}

    /**
     * Get a paginated list of public posts based on filters.
     */
    public function getAllPublicPosts(array $filters, int $perPage = 15)
    {
        $query = PublicPost::with([
            'postable',
            'publishedBy',
        ])->orderBy('created_at', 'desc');

        // Filter by publication status
        if (isset($filters['status'])) {
            switch ($filters['status']) {
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
        if (isset($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }
        if (isset($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        // Search functionality
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }

    public function getPublicPostMobile(?string $search = null, int $perPage = 15)
    {
        $query = PublicPost::with([
            'publishedBy',
        ])
            ->published()
            ->whereNull('postable_id')
            ->whereNull('postable_type')
            ->orderBy('created_at', 'desc');

        // Search by title
        if ($search) {
            $query->where('title', 'like', "%{$search}%");
        }

        return $query->cursorPaginate($perPage);
    }

    /**
     * Create a new public post.
     */
    public function createPublicPost(array $data, ?UploadedFile $image = null)
    {
        // Handle Image Upload
        $imagePath = null;
        if ($image) {
            $uploadResult = $this->fileUploadService->uploadSingle($image, 'public_posts');
            $imagePath = $uploadResult['public_url'];
        }

        // Handle Published At
        $publishedAt = null;
        if (($data['status'] ?? '') === 'published') {
            $publishedAt = now();
        } elseif (($data['status'] ?? '') === 'scheduled') {
            $publishedAt = $data['published_at'] ?? null;
        }

        // Check duplicate for postable (if provided)
        if (! empty($data['postable_id']) && ! empty($data['postable_type'])) {
            if (PublicPost::where('postable_id', $data['postable_id'])
                ->where('postable_type', $data['postable_type'])
                ->exists()
            ) {
                throw new UrbanWatchException('A public post already exists for this item');
            }
        }

        DB::beginTransaction();
        try {
            $publicPost = PublicPost::create([
                'title' => $data['title'],
                'content' => $data['content'],
                'image_path' => $imagePath,
                'category' => $data['category'] ?? 'General',
                'postable_id' => $data['postable_id'] ?? null,
                'postable_type' => $data['postable_type'] ?? null,
                'published_by' => Auth::id(),
                'published_at' => $publishedAt,
                'status' => $data['status'],
            ]);
            DB::commit();

            $loadedPost = $publicPost->load(['postable', 'publishedBy']);

            // Trigger notifications if published immediately
            if ($publicPost->status === 'published' && $publicPost->published_at) {
                $this->triggerPostNotifications($loadedPost);
            }

            return $loadedPost;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Helper to trigger notifications for a public post.
     * Dispatches a queued job to handle bulk notifications asynchronously.
     */
    protected function triggerPostNotifications(PublicPost $post)
    {
        // Fetch only user IDs for Citizens (3) and Purok Leaders (2)
        // Using pluck to avoid loading full models - prevents N+1
        $userIds = \App\Models\User::whereIn('role_id', [2, 3])
            ->pluck('id')
            ->toArray();

        if (! empty($userIds)) {
            // Dispatch job to process notifications asynchronously
            SendPublicPostNotificationsJob::dispatch($post, $userIds);
        }
    }

    /**
     * Get a single public post.
     */
    public function getPublicPost(PublicPost $publicPost)
    {
        return $publicPost->load(['postable', 'publishedBy']);
    }

    /**
     * Update a public post.
     */
    public function updatePublicPost(PublicPost $publicPost, array $data, ?UploadedFile $image = null)
    {
        DB::beginTransaction();
        try {
            // Handle Image Upload
            if ($image) {
                // Delete old image if it exists
                if ($publicPost->image_path) {
                    $this->deleteImageFile($publicPost->image_path);
                }

                $uploadResult = $this->fileUploadService->uploadSingle($image, 'public_posts');
                $data['image_path'] = $uploadResult['public_url'];
            } elseif (isset($data['delete_image']) && $data['delete_image']) {
                if ($publicPost->image_path) {
                    $this->deleteImageFile($publicPost->image_path);
                }
                $data['image_path'] = null;
            }

            // Sync status and published_at
            if (isset($data['status'])) {
                if ($data['status'] === 'published') {
                    $data['published_at'] = $data['published_at'] ?? now();
                } elseif ($data['status'] === 'scheduled') {
                    // Keep existing or use provided
                    $data['published_at'] = $data['published_at'] ?? $publicPost->published_at;
                } elseif ($data['status'] === 'draft') {
                    $data['published_at'] = null;
                }
            }

            $publicPost->update($data);
            DB::commit();

            return $publicPost->load(['postable', 'publishedBy']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete a public post.
     */
    public function deletePublicPost(PublicPost $publicPost)
    {
        DB::beginTransaction();
        try {
            $publicPost->delete();
            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Publish a public post.
     */
    public function publishPost(PublicPost $publicPost)
    {
        $publicPost->publish();

        $loadedPost = $publicPost->load(['postable', 'publishedBy']);

        $this->triggerPostNotifications($loadedPost);

        return $loadedPost;
    }

    /**
     * Unpublish a public post.
     */
    public function unpublishPost(PublicPost $publicPost)
    {
        $publicPost->update(['published_at' => null]);

        return $publicPost->load(['postable', 'publishedBy']);
    }

    /**
     * Get available reports for posting.
     */
    public function getAvailableReports(array $filters, int $perPage = 15)
    {
        $query = Report::with('user')
            ->whereDoesntHave('publicPost')
            ->where('is_acknowledge', true)
            ->where('status', 'Ongoing')
            ->orderBy('created_at', 'desc');

        // Search functionality
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('transcript', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('report_type', 'like', "%{$search}%");
            });
        }

        // Filter by report type
        if (isset($filters['report_type'])) {
            $query->where('report_type', $filters['report_type']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get statistics for public posts.
     */
    public function getStats()
    {
        return [
            'total_posts' => PublicPost::count(),
            'published_posts' => PublicPost::published()->count(),
            'unpublished_posts' => PublicPost::unpublished()->count(),
            'scheduled_posts' => PublicPost::where('published_at', '>', now())->count(),
            'posts_this_month' => PublicPost::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'recent_posts' => PublicPost::with(['postable', 'publishedBy'])
                ->published()
                ->limit(5)
                ->latest('published_at')
                ->get(),
        ];
    }

    /**
     * Execute bulk actions.
     */
    public function executeBulkAction(string $action, array $postIds)
    {
        $posts = PublicPost::whereIn('id', $postIds);
        $count = $posts->count();

        switch ($action) {
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
            default:
                throw new UrbanWatchException('Invalid action');
        }

        return [
            'message' => $message,
            'affected_count' => $count,
        ];
    }

    /**
     * Resolve an accident associated with a post.
     */
    public function resolveAccidentPost(PublicPost $publicPost)
    {
        // Check if the post is associated with an accident
        if (! $publicPost->postable || ! ($publicPost->postable instanceof Accident)) {
            throw new UrbanWatchException('This post is not associated with an accident.');
        }

        $accident = $publicPost->postable;

        // Check if already resolved
        if ($accident->status === 'resolved') {
            throw new UrbanWatchException('This accident is already resolved.');
        }

        // Check if status is ongoing
        if ($accident->status !== 'ongoing') {
            throw new UrbanWatchException('Only ongoing accidents can be resolved.');
        }

        DB::beginTransaction();
        try {
            // Update accident status to resolved
            $accident->update([
                'status' => 'resolved',
            ]);

            // Update the public post title to indicate it's resolved
            $publicPost->update([
                'title' => str_contains($publicPost->title, '[RESOLVED]')
                    ? $publicPost->title
                    : '[RESOLVED] '.$publicPost->title,
            ]);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Helper to delete an image file from storage.
     */
    protected function deleteImageFile(string $imageUrl)
    {
        try {
            // Extract the path from the URL
            // This is a naive implementation that assumes standard Laravel storage URL
            $path = parse_url($imageUrl, PHP_URL_PATH);

            // Remove /storage prefix if exists (for local disk)
            if (str_starts_with($path, '/storage/')) {
                $path = substr($path, 9);
            }

            // Delete from the default disk which FileUploadService uses
            $disk = config('filesystems.default') === 'local' ? 'public' : config('filesystems.default');
            Storage::disk($disk)->delete($path);
        } catch (\Exception $e) {
            // Log error but don't fail the operation
            \Illuminate\Support\Facades\Log::error('Failed to delete image: '.$e->getMessage());
        }
    }
}
