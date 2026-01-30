<?php

namespace App\Http\Requests\Operator;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IotBoxRequest extends FormRequest
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
        $iotBoxId = $this->route('iotbox')?->id;

        return [
            'device_id' => [
                'required',
                'string',
                'max:255',
                Rule::unique('iot_box', 'device_id')->ignore($iotBoxId),
            ],
            'device_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('iot_box', 'device_name')->ignore($iotBoxId),
            ],
            'location_id' => 'nullable|exists:locations,id',
            'status' => 'required|in:active,inactive,maintenance',
            'custom_address' => 'nullable|string|max:500',
            'custom_latitude' => 'nullable|numeric|between:-90,90',
            'custom_longtitide' => 'nullable|numeric|between:-180,180',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'device_id.required' => 'Device ID (hardware hash) is required.',
            'device_id.unique' => 'This Device ID is already registered.',
            'device_name.required' => 'Device name is required.',
            'device_name.unique' => 'This device name is already taken.',
            'device_name.max' => 'Device name cannot exceed 255 characters.',
            'location_id.exists' => 'The selected location does not exist.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: active, inactive, maintenance.',
            'custom_latitude.numeric' => 'Latitude must be a valid number.',
            'custom_latitude.between' => 'Latitude must be between -90 and 90.',
            'custom_longtitide.numeric' => 'Longitude must be a valid number.',
            'custom_longtitide.between' => 'Longitude must be between -180 and 180.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // If no location_id, custom location fields should be provided
            if (! $this->location_id && (! $this->custom_address || ! $this->custom_latitude || ! $this->custom_longtitide)) {
                $validator->errors()->add('custom_location', 'Custom location details are required when no location is selected.');
            }
        });
    }
}
