<?php

namespace App\Events;

use App\Models\PublicPost;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Event broadcast when a new safety post/public announcement is published.
 * 
 * Listeners in mobile apps should subscribe to the 'public-posts' channel
 * and listen for the 'safety-post.published' event.
 */
class NewSafetyPostPublished implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public PublicPost $post;

    /**
     * Create a new event instance.
     */
    public function __construct(PublicPost $post)
    {
        $this->post = $post->load('publishedBy');
    }

    /**
     * Get the channels the event should broadcast on.
     * 
     * Uses a public channel since safety posts are public information
     * that all authenticated users (citizens and purok leaders) should receive.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('public-posts');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'safety-post.published';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->post->id,
            'title' => $this->post->title,
            'excerpt' => $this->post->excerpt ?? Str::limit($this->post->content, 100),
            'category' => $this->post->category,
            'image_path' => $this->post->image_path,
            'published_at' => $this->post->published_at?->toISOString(),
            'created_at' => $this->post->created_at->toISOString(),
            'published_by' => $this->post->publishedBy ? [
                'id' => $this->post->publishedBy->id,
                'name' => $this->post->publishedBy->name,
            ] : null,
            'notification_type' => 'new_safety_post',
        ];
    }
}
