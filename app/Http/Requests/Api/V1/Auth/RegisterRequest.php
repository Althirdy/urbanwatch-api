<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('postalCode') && $this->has('postal_code')) {
            $this->merge([
                'postalCode' => $this->input('postal_code'),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'firstName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'required|string|max:255',
            'suffix' => 'nullable|string|max:10',
            'dateOfBirth' => 'required|date|before:today',
            'phoneNumber' => 'required|string|max:20|unique:citizen_details,phone_number',
            'address' => 'required|string|max:255',
            'barangay' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'postalCode' => 'nullable|string|max:10',
            'pcnNumber' => 'required|string|max:50|unique:citizen_details,pcn_number',
            'verificationToken' => 'required|string',
            'verificationId' => 'required|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email address is required',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email address is already registered',
            'password.required' => 'Password is required',
            'password.min' => 'Password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match',
            'firstName.required' => 'First name is required',
            'lastName.required' => 'Last name is required',
            'dateOfBirth.required' => 'Date of birth is required',
            'dateOfBirth.before' => 'Date of birth must be in the past',
            'phoneNumber.required' => 'Phone number is required',
            'address.required' => 'Address is required',
            'barangay.required' => 'Barangay is required',
            'city.required' => 'City is required',
            'province.required' => 'Province is required',
            'phoneNumber.unique' => 'This phone number is already registered',
            'pcnNumber.required' => 'PCN Number is required',
            'verificationToken.required' => 'Phone verification is required',
            'verificationId.required' => 'ID verification is required',
        ];
    }
}
