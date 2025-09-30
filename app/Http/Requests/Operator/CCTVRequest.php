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
            'device_name' => 'required|string|max:255',
            'primary_rtsp_url' => 'required|url|max:500',
            'backup_rtsp_url' => 'nullable|url|max:500',
            'location_id' => 'required|exists:locations,id',
            'status' => 'required|in:active,inactive,maintenance',
            'model' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'fps' => 'nullable|integer|min:1|max:120',
            'resolution' => 'nullable|in:4k,1080p,720p,480p',
            'installation_date' => 'nullable|date',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */    public function messages(): array
    {
        return [
            'device_name.required' => 'Device name is required.',
            'primary_rtsp_url.required' => 'Primary RTSP URL is required.',
            'primary_rtsp_url.url' => 'Primary RTSP URL must be a valid URL.',
            'backup_rtsp_url.url' => 'Backup RTSP URL must be a valid URL.',
            'location_id.required' => 'Location is required.',
            'location_id.exists' => 'Selected location does not exist.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be active, inactive, or maintenance.',
            'fps.integer' => 'FPS must be a number.',
            'fps.min' => 'FPS must be at least 1.',
            'fps.max' => 'FPS cannot exceed 120.',
            'resolution.in' => 'Resolution must be 4k, 1080p, 720p, or 480p.',
            'installation_date.date' => 'Installation date must be a valid date.',
        ];
    }
}
