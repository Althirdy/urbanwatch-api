<?php

namespace App\Http\Requests\Api\V1\Notifications;

use Illuminate\Foundation\Http\FormRequest;

class RegisterPushTokenRequest extends FormRequest
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
            'token' => 'required|string|starts_with:ExponentPushToken[',
            'platform' => 'required|string|in:android,ios',
            'provider' => 'nullable|string|in:expo',
            'device_id' => 'nullable|string|max:191',
            'app_version' => 'nullable|string|max:50',
        ];
    }
}

