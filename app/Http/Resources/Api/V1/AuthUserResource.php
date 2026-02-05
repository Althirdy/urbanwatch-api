<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthUserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $this->loadMissing(['role', 'officialDetails', 'citizenDetails']);

        if ($this->role_id == 1 || $this->role_id == 2) {
            $officialDetails = $this->officialDetails;

            if (! $officialDetails) {
                return [];
            }

            return [
                'id' => $this->id,
                'profilePhotoPath' => $this->profile_photo_path,
                'profilePhotoUrl' => $this->profile_photo_path 
                    ? (filter_var($this->profile_photo_path, FILTER_VALIDATE_URL) 
                        ? $this->profile_photo_path 
                        : \Illuminate\Support\Facades\Storage::disk('public')->url($this->profile_photo_path))
                    : null,
                'firstName' => $officialDetails->first_name,
                'lastName' => $officialDetails->last_name,
                'middleName' => $officialDetails->middle_name,
                'suffix' => $officialDetails->suffix,
                'email' => $this->email,
                'role' => $this->role->name,
                'officeAddress' => $officialDetails->office_address,
                'phoneNumber' => $officialDetails->contact_number,
            ];
        } elseif ($this->role_id == 3) {
            $citizenDetails = $this->citizenDetails;

            if (! $citizenDetails) {
                return [];
            }

            return [
                'id' => $this->id,
                'profilePhotoPath' => $this->profile_photo_path,
                'profilePhotoUrl' => $this->profile_photo_path 
                    ? (filter_var($this->profile_photo_path, FILTER_VALIDATE_URL) 
                        ? $this->profile_photo_path 
                        : \Illuminate\Support\Facades\Storage::disk('public')->url($this->profile_photo_path))
                    : null,
                'firstName' => $citizenDetails->first_name,
                'lastName' => $citizenDetails->last_name,
                'middleName' => $citizenDetails->middle_name,
                'suffix' => $citizenDetails->suffix,
                'email' => $this->email,
                'role' => $this->role->name,
                'address' => $citizenDetails->address,
                'phoneNumber' => $citizenDetails->phone_number,
                'barangay' => $citizenDetails->barangay,
                'city' => $citizenDetails->city,
                'province' => $citizenDetails->province,
                'postalCode' => $citizenDetails->postal_code,
                'isVerified' => $citizenDetails->is_verified,
            ];
        }

        return [];
    }
}
