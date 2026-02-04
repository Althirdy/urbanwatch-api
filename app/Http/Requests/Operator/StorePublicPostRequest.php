<?php

namespace App\Http\Requests\Operator;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePublicPostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Auth middleware handles authentication
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:50'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
            'status' => ['required', 'string', Rule::in(['draft', 'published', 'scheduled'])],
            'published_at' => [
                'nullable',
                'date',
                'required_if:status,scheduled',
                'after:now', // Scheduled posts must be in the future
            ],
            // Polymorphic relations (optional for manual posts)
            'postable_id' => ['nullable', 'integer'],
            'postable_type' => ['nullable', 'string'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'published_at.required_if' => 'The publication date is required when the status is scheduled.',
            'image.max' => 'The image must not be greater than 5MB.',
        ];
    }
}
