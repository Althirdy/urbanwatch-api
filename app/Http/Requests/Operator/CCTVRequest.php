<?php

namespace App\Http\Requests\Operator;

use Illuminate\Foundation\Http\FormRequest;

class CCTVRequest extends FormRequest
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
            'location_name' => 'required|string|max:255',
            'package' => 'nullable|string|max:255',
            'latitude' => 'nullable|string|max:50',
            'longitude' => 'nullable|string|max:50',
            'primary_rtsp_url' => 'required|string|max:500',
            'backup_rtsp_url' => 'nullable|string|max:500',
            'rtsp_username' => 'nullable|string|max:255',
            'rtsp_password' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive,maintenance',
            'installation_date' => 'nullable|date',
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
            'primary_rtsp_url.required' => 'Primary RTSP URL is required.',
            'primary_rtsp_url.url' => 'Primary RTSP URL must be a valid URL.',
            'backup_rtsp_url.url' => 'Backup RTSP URL must be a valid URL.',
            'location_name.required' => 'Location is required.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be active, inactive, or maintenance.',
            'installation_date.date' => 'Installation date must be a valid date.',
        ];
    }
}
