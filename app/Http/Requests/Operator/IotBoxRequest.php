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
            'status' => 'required|in:active,inactive,maintenance',
            'custom_address' => 'required|string|max:500',
            'custom_latitude' => 'required|numeric|between:-90,90',
            'custom_longtitide' => 'required|numeric|between:-180,180',
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
        // Location fields are now always required, no need for custom validation
    }
}
