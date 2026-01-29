<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens; // Import the Attribute class

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role_id',
        'name', // Keep 'name' fillable, but accessor will override its display
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'assigned_brgy',
        'status',
        'false_alarm_strikes',
        'last_sensitive_update_at',
        'profile_photo_path',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'name' => 'encrypted',
    ];

    /**
     * Get the user's full name.
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: function (?string $value, array $attributes) {
                // If name is already set in the database, return it
                if (! empty($value)) {
                    return $value;
                }

                // Otherwise, build name from relationships if loaded
                if ($this->relationLoaded('officialDetails') && $this->officialDetails) {
                    return trim(
                        ($this->officialDetails->first_name ?? '').' '.
                            (($this->officialDetails->middle_name ?? null) ? ($this->officialDetails->middle_name.' ') : '').
                            ($this->officialDetails->last_name ?? '')
                    );
                }

                if ($this->relationLoaded('citizenDetails') && $this->citizenDetails) {
                    return trim(
                        ($this->citizenDetails->first_name ?? '').' '.
                            (($this->citizenDetails->middle_name ?? null) ? ($this->citizenDetails->middle_name.' ') : '').
                            ($this->citizenDetails->last_name ?? '')
                    );
                }

                // Fallback to empty string if no name available
                return '';
            },
        );
    }

    /**
     * Interact with the user's first name.
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => ucwords(trim($value)),
        );
    }

    /**
     * Interact with the user's middle name.
     */
    protected function middleName(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => ucwords(trim($value)),
        );
    }

    /**
     * Interact with the user's last name.
     */
    protected function lastName(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => ucwords(trim($value)),
        );
    }

    public function role()
    {
        return $this->belongsTo(Roles::class);
    }

    public function officialDetails()
    {
        return $this->hasOne(OfficialsDetails::class);
    }

    public function citizenDetails()
    {
        return $this->hasOne(CitizenDetails::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function acknowledgedReports()
    {
        return $this->hasMany(Report::class, 'acknowledge_by');
    }

    public function citizenConcerns()
    {
        return $this->hasMany(\App\Models\Citizen\Concern::class, 'citizen_id');
    }

    public function suspensions()
    {
        return $this->hasMany(UserSuspension::class);
    }

    public function activeSuspension()
    {
        return $this->hasOne(UserSuspension::class)
            ->where('status', 'active')
            ->orderBy('created_at', 'desc');
    }
}
