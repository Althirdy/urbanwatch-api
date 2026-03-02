<?php

namespace App\Http\Requests\Operator;

use App\Models\CitizenDetails;
use App\Models\OfficialsDetails;
use App\Models\Roles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    private ?bool $isPurokLeaderTarget = null;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user') ? $this->route('user')->id : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');
        $isPurokLeader = $this->isPurokLeaderTarget();

        // Different password validation for Purok Leader (PIN) vs other roles
        if ($isUpdate) {
            $passwordRules = 'nullable';
        } elseif ($isPurokLeader) {
            // For Purok Leader creation: PIN is auto-generated, so password field should not be sent
            $passwordRules = 'nullable|prohibited';
        } else {
            // Regular password validation for other roles (Operators, etc.)
            $passwordRules = ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()->symbols()];
        }

        return [
            'first_name' => 'required|string|max:255|regex:/^[a-zA-Z\s\'-]+$/',
            'middle_name' => 'nullable|string|max:255|regex:/^[a-zA-Z\s\'\-\.]*$/',
            'last_name' => 'required|string|max:255|regex:/^[a-zA-Z\s\'-]+$/',
            'suffix' => 'nullable|string|max:10',
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                $isUpdate ? 'unique:users,email,' . $userId : 'unique:users',
            ],
            'phone_number' => $isPurokLeader
                ? 'required|regex:/^09\d{9}$/'
                : 'nullable|regex:/^[0-9+\-\s]{10,20}$/',
            'role_id' => $isUpdate ? 'nullable|exists:roles,id' : 'required|numeric|exists:roles,id',
            'password' => $passwordRules,
            'status' => 'nullable|string|in:Active,Inactive,Archived',
            // For citizens
            'date_of_birth' => 'nullable|date|before:today',
            'address' => 'nullable|string|max:500',
            'barangay' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'is_verified' => 'nullable|boolean',
            // For officials
            'office_address' => 'nullable|string|max:500',
            'assigned_brgy' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            // ID Number for Purok Leaders (no length restriction, just unique)
            'id_number' => $isPurokLeader
                ? ['required', 'string', $isUpdate ? 'unique:officials_details,id_number,' . $userId . ',user_id' : 'unique:officials_details,id_number']
                : 'nullable',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $isPurokLeader = $this->isPurokLeaderTarget();
        $passwordFieldName = $isPurokLeader ? 'PIN' : 'Password';

        return [
            'first_name.required' => 'First name is required.',
            'first_name.regex' => 'First name can only contain letters, spaces, hyphens, and apostrophes.',
            'first_name.max' => 'First name cannot exceed 255 characters.',
            'middle_name.regex' => 'Middle name can only contain letters, spaces, hyphens, apostrophes, and periods.',
            'middle_name.max' => 'Middle name cannot exceed 255 characters.',
            'last_name.required' => 'Last name is required.',
            'last_name.regex' => 'Last name can only contain letters, spaces, hyphens, and apostrophes.',
            'last_name.max' => 'Last name cannot exceed 255 characters.',
            'suffix.max' => 'Suffix cannot exceed 10 characters.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'email.max' => 'Email cannot exceed 255 characters.',
            'phone_number.required' => 'Phone number is required for Purok Leader.',
            'phone_number.regex' => $isPurokLeader
                ? 'Phone number must be a valid PH mobile number (09XXXXXXXXX).'
                : 'Phone number must be a valid format (10-20 digits, can include +, -, and spaces).',
            'role_id.required' => 'User role is required.',
            'role_id.exists' => 'The selected role is invalid.',
            'password.required' => $passwordFieldName . ' is required.',
            'password.confirmed' => $passwordFieldName . ' confirmation does not match.',
            'password.prohibited' => 'PIN should not be provided. It will be auto-generated.',
            'status.in' => 'Status must be Active, Inactive, or Archived.',
            'date_of_birth.date' => 'Date of birth must be a valid date.',
            'date_of_birth.before' => 'Date of birth must be before today.',
            'address.max' => 'Address cannot exceed 500 characters.',
            'barangay.max' => 'Barangay cannot exceed 255 characters.',
            'city.max' => 'City cannot exceed 255 characters.',
            'province.max' => 'Province cannot exceed 255 characters.',
            'postal_code.max' => 'Postal code cannot exceed 10 characters.',
            'office_address.max' => 'Office address cannot exceed 500 characters.',
            'assigned_brgy.max' => 'Assigned barangay cannot exceed 255 characters.',
            'latitude.numeric' => 'Latitude must be a valid number.',
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.numeric' => 'Longitude must be a valid number.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
            'id_number.required' => 'ID Number is required for Purok Leader.',
            'id_number.unique' => 'This ID Number is already in use by another Purok Leader.',
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'first_name' => 'first name',
            'middle_name' => 'middle name',
            'last_name' => 'last name',
            'phone_number' => 'phone number',
            'role_id' => 'role',
            'date_of_birth' => 'date of birth',
            'office_address' => 'office address',
            'assigned_brgy' => 'assigned barangay',
            'postal_code' => 'postal code',
            'is_verified' => 'verification status',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->isPurokLeaderTarget()) {
            return;
        }

        $normalizedPhone = $this->normalizePhilippineMobileNumber($this->input('phone_number'));
        if ($normalizedPhone !== null) {
            $this->merge(['phone_number' => $normalizedPhone]);
        }
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (!$this->isPurokLeaderTarget()) {
                return;
            }

            $phoneNumber = $this->input('phone_number');
            if (!$phoneNumber || !preg_match('/^09\d{9}$/', $phoneNumber)) {
                return;
            }

            $userId = $this->route('user')?->id;

            $existsInOfficials = OfficialsDetails::all()
                ->contains(function (OfficialsDetails $details) use ($phoneNumber, $userId) {
                    if ($userId && (int) $details->user_id === (int) $userId) {
                        return false;
                    }

                    return $details->contact_number === $phoneNumber;
                });

            $existsInCitizens = CitizenDetails::all()
                ->contains(function (CitizenDetails $details) use ($phoneNumber, $userId) {
                    if ($userId && (int) $details->user_id === (int) $userId) {
                        return false;
                    }

                    return $details->phone_number === $phoneNumber;
                });

            if ($existsInOfficials || $existsInCitizens) {
                $validator->errors()->add('phone_number', 'Phone number is already registered.');
            }
        });
    }

    private function isPurokLeaderTarget(): bool
    {
        if ($this->isPurokLeaderTarget !== null) {
            return $this->isPurokLeaderTarget;
        }

        $targetRoleId = $this->input('role_id') ?: $this->route('user')?->role_id;
        if (!$targetRoleId) {
            return $this->isPurokLeaderTarget = false;
        }

        $role = Roles::find($targetRoleId);

        return $this->isPurokLeaderTarget = strtolower((string) $role?->name) === 'purok leader';
    }

    private function normalizePhilippineMobileNumber(?string $rawPhone): ?string
    {
        if (!is_string($rawPhone)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $rawPhone);
        if (!$digits) {
            return null;
        }

        if (str_starts_with($digits, '63') && strlen($digits) === 12) {
            $digits = '0' . substr($digits, 2);
        } elseif (str_starts_with($digits, '9') && strlen($digits) === 10) {
            $digits = '0' . $digits;
        }

        return $digits;
    }
}
