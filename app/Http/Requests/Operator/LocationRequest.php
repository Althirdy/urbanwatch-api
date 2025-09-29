<?php

namespace App\Http\Requests\Operator;

use Illuminate\Foundation\Http\FormRequest;

class LocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Allow authenticated users to make this request
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'location_name' => 'required|string|max:255',
            'landmark' => 'required|string|max:255',
            'barangay' => 'required|string|max:255',
            'location_category' => 'required|exists:location_categories,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'description' => 'nullable|string|max:1000',
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
            'location_name.required' => 'Location name is required.',
            'location_name.max' => 'Location name cannot exceed 255 characters.',
            'landmark.required' => 'Landmark is required.',
            'landmark.max' => 'Landmark cannot exceed 255 characters.',
            'barangay.required' => 'Barangay is required.',
            'barangay.max' => 'Barangay cannot exceed 255 characters.',
            'location_category.required' => 'Location category is required.',
            'location_category.exists' => 'The selected location category is invalid.',
            'latitude.required' => 'Latitude is required.',
            'latitude.numeric' => 'Latitude must be a valid number.',
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.required' => 'Longitude is required.',
            'longitude.numeric' => 'Longitude must be a valid number.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
            'description.max' => 'Description cannot exceed 1000 characters.',
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
            'location_name' => 'location name',
            'location_category' => 'category',
        ];
    }
}
