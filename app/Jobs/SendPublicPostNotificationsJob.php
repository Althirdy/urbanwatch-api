<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\PublicPost;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendPublicPostNotificationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected PublicPost $post,
        protected array $userIds
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $now = now();
            $post = $this->post;

            // Process user IDs in chunks of 100 to manage memory
            foreach (array_chunk($this->userIds, 100) as $chunk) {
                $notifications = [];

                // Fetch users in this chunk to determine their roles/types
                $users = User::whereIn('id', $chunk)->get(['id', 'role_id']);

                foreach ($users as $user) {
                    // Determine user type: Role 2 is Purok Leader
                    $userType = $user->role_id == 2
                        ? Notification::USER_TYPE_PUROK_LEADER
                        : Notification::USER_TYPE_CITIZEN;

                    $notifications[] = [
                        'user_id' => $user->id,
                        'user_type' => $userType,
                        'type' => Notification::TYPE_NEW_SAFETY_POST,
                        'title' => 'Safety Alert: '.$post->title,
                        'message' => $post->excerpt ?? Str::limit($post->content, 100),
                        'data' => json_encode([
                            'post_id' => $post->id,
                            'category' => $post->category,
                        ]),
                        'read_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if (! empty($notifications)) {
                    DB::table('notifications')->insert($notifications);
                }
            }

            Log::info('Public post notifications job completed', [
                'post_id' => $post->id,
                'total_users' => count($this->userIds),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to process public post notifications job', [
                'error' => $e->getMessage(),
                'post_id' => $this->post->id,
            ]);
            throw $e;
        }
    }
}
