<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CitizenDetailsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'firstName' => $this->first_name,
            'middleName' => $this->middle_name,
            'lastName' => $this->last_name,
            'suffix' => $this->suffix,
            'phoneNumber' => $this->phone_number,
            'address' => $this->address,
            'barangay' => $this->barangay,
            'city' => $this->city,
            'province' => $this->province,
            'zipCode' => $this->zip_code,
            'birthdate' => $this->birthdate,
            'gender' => $this->gender,
        ];
    }
}
