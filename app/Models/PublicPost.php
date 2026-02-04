<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PublicPost extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'public_id',
        'postable_id',
        'postable_type',
        'title',
        'content',
        'image_path',
        'category',
        'published_by',
        'published_at',
        'status',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = ['computed_status'];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->public_id)) {
                $model->public_id = self::generateUniquePublicId();
            }
        });
    }

    /**
     * Generate a unique 6-character public ID.
     */
    protected static function generateUniquePublicId(): string
    {
        do {
            $publicId = strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while (self::where('public_id', $publicId)->exists());

        return $publicId;
    }

    /**
     * Get the parent postable model (Accident, Report, etc.).
     */
    public function postable(): \Illuminate\Database\Eloquent\Relations\MorphTo
    {
        return $this->morphTo();
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
     * Get the computed status based on current time and published_at.
     * This ensures scheduled posts automatically become "published" when their time arrives.
     */
    public function getComputedStatusAttribute(): string
    {
        // If no published_at date is set, it's a draft
        if (! $this->published_at) {
            return 'draft';
        }

        // If published_at is in the future, it's scheduled
        if ($this->published_at > now()) {
            return 'scheduled';
        }

        // If published_at is in the past or now, it's published
        return 'published';
    }

    /**
     * Get formatted published date.
     */
    public function getFormattedPublishedAtAttribute(): ?string
    {
        return $this->published_at?->format('M d, Y g:i A');
    }
}
