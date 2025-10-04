<?php

namespace App\Http\Requests\Operator;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
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

        return [
            'first_name' => 'required|string|max:255|regex:/^[a-zA-Z\s\'-]+$/',
            'middle_name' => 'nullable|string|max:255|regex:/^[a-zA-Z\s\'\-\.]*$/',
            'last_name' => 'required|string|max:255|regex:/^[a-zA-Z\s\'-]+$/',
            'suffix' => 'nullable|string|max:10',
            'email' => [
                'required',
                'email:rfc,dns',
                'max:255',
                $isUpdate ? 'unique:users,email,' . $userId : 'unique:users',
            ],
            'phone_number' => 'nullable|regex:/^[0-9+\-\s]{10,20}$/',
            'role_id' => $isUpdate ? 'nullable|exists:roles,id' : 'required|numeric|exists:roles,id',
            'password' => $isUpdate ? 'nullable' : [
                'required',
                'string',
                Password::min(8)->letters()->numbers()->symbols(),
                'confirmed',
            ],
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
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
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
            'phone_number.regex' => 'Phone number must be a valid format (10-20 digits, can include +, -, and spaces).',
            'role_id.required' => 'User role is required.',
            'role_id.exists' => 'The selected role is invalid.',
            'password.required' => 'Password is required.',
            'password.confirmed' => 'Password confirmation does not match.',
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
}
