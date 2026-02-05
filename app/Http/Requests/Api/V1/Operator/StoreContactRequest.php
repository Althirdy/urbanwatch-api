<?php

namespace App\Http\Requests\Api\V1\Operator;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
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
            'branch_unit_name' => 'required|string|in:BEST,BCCM,BCPC,BDRRM,BHERT,BHW,BPSO,BTMO,VAWC',
            'contact_person' => 'nullable|string|max:255',
            'responder_type' => 'required|string|in:Fire,Emergency,Crime,Traffic,Barangay,Others',
            'location' => 'nullable|string|max:255',
            'primary_mobile' => 'required|string|size:11|regex:/^[0-9]{11}$/',
            'backup_mobile' => 'nullable|string|size:11|regex:/^[0-9]{11}$/',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
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
            'branch_unit_name.required' => 'Branch/Unit name is required.',
            'branch_unit_name.in' => 'The selected branch/unit name is invalid.',
            'contact_person.max' => 'Contact person name cannot exceed 255 characters.',
            'responder_type.required' => 'Responder type is required.',
            'responder_type.in' => 'The selected responder type is invalid.',
            'location.max' => 'Location cannot exceed 255 characters.',
            'primary_mobile.required' => 'Primary mobile number is required.',
            'primary_mobile.size' => 'Primary mobile number must be exactly 11 digits.',
            'primary_mobile.regex' => 'Primary mobile number must contain only numbers.',
            'backup_mobile.size' => 'Backup mobile number must be exactly 11 digits.',
            'backup_mobile.regex' => 'Backup mobile number must contain only numbers.',
            'latitude.numeric' => 'Latitude must be a number.',
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.numeric' => 'Longitude must be a number.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
            'active.boolean' => 'Active status must be true or false.',
        ];
    }
}
