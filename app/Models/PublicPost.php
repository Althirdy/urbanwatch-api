<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PublicPost extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'report_id',
        'published_by',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the report associated with this public post.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Get the user who published this post.
     */
    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    /**
     * Check if the post is published.
     */
    public function isPublished(): bool
    {
        return $this->published_at !== null && $this->published_at <= now();
    }

    /**
     * Publish the post.
     */
    public function publish(): void
    {
        $this->update([
            'published_at' => now(),
        ]);
    }

    /**
     * Scope to filter published posts.
     */
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at')
                    ->where('published_at', '<=', now());
    }

    /**
     * Scope to filter unpublished posts.
     */
    public function scopeUnpublished($query)
    {
        return $query->whereNull('published_at')
                    ->orWhere('published_at', '>', now());
    }

    /**
     * Get formatted published date.
     */
    public function getFormattedPublishedAtAttribute(): ?string
    {
        return $this->published_at?->format('M d, Y g:i A');
    }
}