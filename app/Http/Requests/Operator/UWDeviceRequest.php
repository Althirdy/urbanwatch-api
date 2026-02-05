<?php

namespace App\Http\Requests\Operator;

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
        $deviceId = $this->route('uwdevice')?->id;

        return [
            'device_name' => [
                'required',
                'string',
                'max:255',
                $deviceId
                    ? 'unique:uw_devices,device_name,'.$deviceId
                    : 'unique:uw_devices,device_name',
            ],
            'status' => 'required|in:active,inactive,maintenance',
            'custom_address' => 'required|string|max:500',
            'custom_latitude' => 'required|numeric|between:-90,90',
            'custom_longitude' => 'required|numeric|between:-180,180',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'device_name.required' => 'Device name is required.',
            'device_name.max' => 'Device name cannot exceed 255 characters.',
            'device_name.unique' => 'A device with this name already exists. Please choose a unique name.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: active, inactive, maintenance.',
            'custom_address.required' => 'Location address is required.',
            'custom_latitude.required' => 'Latitude is required.',
            'custom_latitude.numeric' => 'Latitude must be a valid number.',
            'custom_latitude.between' => 'Latitude must be between -90 and 90.',
            'custom_longitude.required' => 'Longitude is required.',
            'custom_longitude.numeric' => 'Longitude must be a valid number.',
            'custom_longitude.between' => 'Longitude must be between -180 and 180.',
        ];
    }
}
