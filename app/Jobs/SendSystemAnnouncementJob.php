<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendSystemAnnouncementJob implements ShouldQueue
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
        protected string $title,
        protected string $message,
        protected ?string $userType = null,
        protected ?array $data = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $now = now();
            $processedCount = 0;

            // Use chunking to avoid loading all users into memory
            $query = User::query();

            // Filter by user type if specified
            if ($this->userType === Notification::USER_TYPE_CITIZEN) {
                $query->whereHas('citizenDetails');
            } elseif ($this->userType === Notification::USER_TYPE_PUROK_LEADER) {
                $query->where('role_id', 2); // Purok Leader role
            }

            // Process users in chunks of 100 to prevent memory issues
            $query->select(['id', 'role_id'])->chunkById(100, function ($users) use ($now, &$processedCount) {
                $notifications = [];

                foreach ($users as $user) {
                    // Determine user type based on role
                    $userType = $user->role_id === 2
                        ? Notification::USER_TYPE_PUROK_LEADER
                        : Notification::USER_TYPE_CITIZEN;

                    $notifications[] = [
                        'user_id' => $user->id,
                        'user_type' => $userType,
                        'type' => Notification::TYPE_SYSTEM_ANNOUNCEMENT,
                        'title' => $this->title,
                        'message' => $this->message,
                        'data' => $this->data ? json_encode($this->data) : null,
                        'read_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if (! empty($notifications)) {
                    DB::table('notifications')->insert($notifications);
                    $processedCount += count($notifications);
                }
            });

            Log::info('System announcement job completed', [
                'title' => $this->title,
                'user_type' => $this->userType ?? 'all',
                'notification_count' => $processedCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to process system announcement job', [
                'error' => $e->getMessage(),
                'title' => $this->title,
            ]);
            throw $e;
        }
    }
}
