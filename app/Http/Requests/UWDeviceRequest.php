<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UWDeviceRequest extends FormRequest
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
            'device_name' => ['required', 'string', 'max:255'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'cctv_id' => ['nullable', 'exists:cctv_devices,id'],
            'status' => ['required', 'string', 'in:active,inactive,maintenance'],
            'custom_address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Either location_id OR custom location details must be provided
            if (!$this->location_id && !$this->custom_address) {
                $validator->errors()->add('location', 'Either select a location or provide custom location details.');
            }
            
            // If custom_address is provided, coordinates are required
            if ($this->custom_address && (!$this->latitude || !$this->longitude)) {
                $validator->errors()->add('location', 'Custom locations require both latitude and longitude coordinates.');
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'device_name.required' => 'The IoT device name is required.',
            'device_name.max' => 'The IoT device name must not exceed 255 characters.',
            'location_id.exists' => 'The selected location is invalid.',
            'cctv_id.exists' => 'The selected camera is invalid.',
            'status.required' => 'Device status is required.',
            'status.in' => 'Device status must be active, inactive, or maintenance.',
            'custom_address.max' => 'Custom address must not exceed 500 characters.',
            'latitude.numeric' => 'Latitude must be a valid number.',
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.numeric' => 'Longitude must be a valid number.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
        ];
    }


}