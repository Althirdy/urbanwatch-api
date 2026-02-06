<?php

namespace App\Http\Requests\Api\V1\Citizen;

use Illuminate\Foundation\Http\FormRequest;

class StoreConcernRequest extends FormRequest
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
        // Check if geofencing is enabled
        $geofencingEnabled = \App\Models\SystemSetting::get('geofencing_enabled') === 'true';
        $locationRule = $geofencingEnabled ? 'required' : 'nullable';

        return [    
            'type' => 'required|string|in:manual,voice',
            'title' => 'required_if:type,manual|nullable|string|max:100',
            'description' => 'required_if:type,manual|nullable|string',
            'category' => 'required|string|in:safety,security,infrastructure,environment,noise,other',
            'severity' => 'nullable|string|in:low,medium,high',
            'transcript_text' => 'nullable|string',
            'longitude' => "{$locationRule}|numeric|between:-180,180",
            'latitude' => "{$locationRule}|numeric|between:-90,90",
            'address' => 'nullable|string',
            'custom_location' => 'nullable|string',
            'files' => 'nullable|array|min:1|max:3',
            'files.*' => 'file|mimes:jpeg,jpg,png,gif,mp3,wav,m4a,ogg,aac|max:10240', // Increased max size for audio
        ];
    }

    /**
     * Customize the error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Title is required.',
            'title.string' => 'Title must be a string.',
            'title.max' => 'Title cannot exceed 100 characters.',
            'description.required' => 'Description is required.',
            'description.string' => 'Description must be a string.',
            'category.required' => 'Category is required.',
            'category.string' => 'Category must be a string.',
            'category.in' => 'Category must be one of: safety, security, infrastructure, environment, noise, other.',
            'severity.string' => 'Severity must be a string.',
            'severity.in' => 'Severity must be one of: low, medium, high.',
            'transcript_text.string' => 'Transcript text must be a string.',
            'longitude.required' => 'Location is required. Please enable GPS/location services.',
            'longitude.numeric' => 'Longitude must be a number.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
            'latitude.required' => 'Location is required. Please enable GPS/location services.',
            'latitude.numeric' => 'Latitude must be a number.',
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'files.array' => 'Files must be an array.',
            'files.min' => 'At least 1 file must be uploaded.',
            'files.max' => 'Maximum 3 files can be uploaded.',
            'files.*.file' => 'Each file must be a valid file.',
            'files.*.mimes' => 'Each file must be an image (jpeg, jpg, png, gif) or audio (mp3, wav, m4a, ogg, aac).',
            'files.*.max' => 'Each file must not exceed 10MB.',
        ];
    }
}
