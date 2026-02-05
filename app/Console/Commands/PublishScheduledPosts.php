<?php

namespace App\Console\Commands;

use App\Models\PublicPost;
use Illuminate\Console\Command;

class PublishScheduledPosts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'posts:publish-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish scheduled posts that have reached their publication date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for scheduled posts to publish...');

        // Find all posts with status 'scheduled' and published_at <= now
        $scheduledPosts = PublicPost::where('status', 'scheduled')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->get();

        if ($scheduledPosts->isEmpty()) {
            $this->info('No scheduled posts to publish at this time.');

            return 0;
        }

        $count = 0;
        foreach ($scheduledPosts as $post) {
            $post->update(['status' => 'published']);
            $count++;
            $this->info("Published post #{$post->id}: {$post->title}");
        }

        $this->info("Successfully published {$count} scheduled post(s).");

        return 0;
    }
}
