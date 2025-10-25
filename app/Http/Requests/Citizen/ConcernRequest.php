<?php

namespace App\Http\Requests\Citizen;

use Illuminate\Foundation\Http\FormRequest;

class ConcernRequest extends FormRequest
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
            'citizen_id' => 'required|integer|exists:users,id',
            'title' => 'required|string|max:100',
            'description' => 'required|string',
            'category' => 'required|string|in:accident,fire,flood,crime,other',
            'transcript_text' => 'nullable|string',
            'longitude' => 'nullable|numeric',
            'latitude' => 'nullable|numeric',
            // 'files' => 'nullable|array|min:1|max:3', // Maximum 3 files, minimum 1 if provided
            // 'files.*' => 'file|mimes:jpeg,jpg,png,gif|max:3072', // Each file max 3MB, images only
        ];
    }

    /**
     * Customize the error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'citizen_id.required' => 'Citizen ID is required.',
            'citizen_id.integer' => 'Citizen ID must be an integer.',
            'citizen_id.exists' => 'Citizen ID does not exist.',
            'title.required' => 'Title is required.',
            'title.string' => 'Title must be a string.',
            'title.max' => 'Title cannot exceed 100 characters.',
            'description.required' => 'Description is required.',
            'description.string' => 'Description must be a string.',
            'category.required' => 'Category is required.',
            'category.string' => 'Category must be a string.',
            'category.in' => 'Category must be one of: accident, fire, flood, crime, other.',
            'transcript_text.string' => 'Transcript text must be a string.',
            'longitude.numeric' => 'Longitude must be a numeric value.',
            'latitude.numeric' => 'Latitude must be a numeric value.',
            'files.array' => 'Files must be an array.',
            'files.min' => 'At least one file must be uploaded when files are provided.',
            'files.max' => 'You can upload a maximum of 3 files.',
            'files.*.file' => 'Each uploaded item must be a valid file.',
            'files.*.mimes' => 'Each file must be of type: jpeg, jpg, png, gif.',
            'files.*.max' => 'Each file size cannot exceed 3MB.',
        ];
    }
}
