<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ChangePinRequest extends FormRequest
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
            'current_pin' => 'required|string|size:4',
            'new_pin' => 'required|string|size:4|regex:/^\d{4}$/|different:current_pin',
            'new_pin_confirmation' => 'required|same:new_pin',
        ];
    }

    /**
     * Custom validation messages for better mobile UX.
     */
    public function messages(): array
    {
        return [
            'current_pin.required' => 'Current PIN is required',
            'current_pin.size' => 'Current PIN must be exactly 4 digits',
            'new_pin.required' => 'New PIN is required',
            'new_pin.size' => 'New PIN must be exactly 4 digits',
            'new_pin.regex' => 'New PIN must contain only numbers',
            'new_pin.different' => 'New PIN must be different from current PIN',
            'new_pin_confirmation.required' => 'Please confirm your new PIN',
            'new_pin_confirmation.same' => 'PIN confirmation does not match',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }
}
