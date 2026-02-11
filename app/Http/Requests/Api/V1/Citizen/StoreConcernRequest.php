<?php

namespace App\Http\Requests\Api\V1\Citizen;

use Illuminate\Contracts\Validation\Validator;
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
            'description' => 'required_if:type,manual|nullable|string|max:1500',
            'category' => 'required|string|in:safety,security,infrastructure,environment,noise,other',
            'severity' => 'nullable|string|in:low,medium,high',
            'transcript_text' => 'nullable|string|max:5000',
            'longitude' => "{$locationRule}|numeric|between:-180,180",
            'latitude' => "{$locationRule}|numeric|between:-90,90",
            'address' => 'nullable|string|max:255',
            'custom_location' => 'nullable|string|max:255',
            'files' => 'nullable|array|min:1|max:3',
            'files.*' => 'file|max:10240', // 10 MB each
        ];
    }

    /**
     * Configure conditional validation rules based on concern type.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $type = $this->input('type');
            $files = $this->file('files', []);

            if ($type === 'voice') {
                if (empty($files) || count($files) !== 1) {
                    $validator->errors()->add('files', 'Voice concern requires exactly 1 audio file.');

                    return;
                }

                foreach ($files as $index => $file) {
                    if (! str_starts_with((string) $file->getMimeType(), 'audio/')) {
                        $validator->errors()->add("files.{$index}", 'Voice concern file must be an audio file.');
                    }
                }

                return;
            }

            if ($type === 'manual' && ! empty($files)) {
                foreach ($files as $index => $file) {
                    if (! str_starts_with((string) $file->getMimeType(), 'image/')) {
                        $validator->errors()->add("files.{$index}", 'Manual concern files must be images only.');
                    }
                }
            }
        });
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
            'description.max' => 'Description cannot exceed 1500 characters.',
            'category.required' => 'Category is required.',
            'category.string' => 'Category must be a string.',
            'category.in' => 'Category must be one of: safety, security, infrastructure, environment, noise, other.',
            'severity.string' => 'Severity must be a string.',
            'severity.in' => 'Severity must be one of: low, medium, high.',
            'transcript_text.string' => 'Transcript text must be a string.',
            'transcript_text.max' => 'Transcript text cannot exceed 5000 characters.',
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
            'files.*.max' => 'Each file must not exceed 10MB.',
        ];
    }
}
