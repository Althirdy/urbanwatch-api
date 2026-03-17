<?php

namespace App\Http\Requests\Api\V1\Operator;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContactRequest extends FormRequest
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
        return [
            'branch_unit_name' => 'sometimes|required|string|max:255',
            'branch_unit_abbreviation' => 'sometimes|required|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'responder_type' => 'sometimes|required|string|in:Fire,Emergency,Crime,Traffic,Barangay,Others',
            'primary_mobile' => 'sometimes|required|string|size:11|regex:/^[0-9]{11}$/',
            'backup_mobile' => 'nullable|string|size:11|regex:/^[0-9]{11}$/',
            'active' => 'boolean',
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
            'branch_unit_name.required' => 'Response unit is required.',
            'branch_unit_abbreviation.required' => 'Response unit abbreviation is required.',
            'branch_unit_abbreviation.max' => 'Response unit abbreviation cannot exceed 50 characters.',
            'contact_person.max' => 'Contact person name cannot exceed 255 characters.',
            'responder_type.required' => 'Responder type is required.',
            'responder_type.in' => 'The selected responder type is invalid.',
            'primary_mobile.required' => 'Primary mobile number is required.',
            'primary_mobile.size' => 'Primary mobile number must be exactly 11 digits.',
            'primary_mobile.regex' => 'Primary mobile number must contain only numbers.',
            'backup_mobile.size' => 'Backup mobile number must be exactly 11 digits.',
            'backup_mobile.regex' => 'Backup mobile number must contain only numbers.',
            'active.boolean' => 'Active status must be true or false.',
        ];
    }
}
