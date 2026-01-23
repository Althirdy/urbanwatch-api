<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'ocr_space' => [
        'api_key' => env('OCR_SPACE_API_KEY'),
        'api_url' => env('OCR_SPACE_API_URL', 'https://api.ocr.space/parse/image'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
    ],
    'semaphore' => [
        'api_key' => env('SEMAPHORE_API_KEY'),
        'sender_name' => env('SEMAPHORE_SENDER_NAME', 'SEMAPHORE'),
    ],
    'textbee' => [
        'api_key' => env('TEXTBEE_API_KEY'),
        'device_id' => env('TEXTBEE_DEVICE_ID'),
        'sms_notification_enabled' => env('TEXTBEE_SMS_NOTIFICATION_ENABLED', true),
    ],

    // YOLO Python Script API Key
    'yolo_api_key' => env('YOLO_API_KEY'),
    'abstract_api' => [
        'api_key' => env('ABSTRACT_API_KEY'),
        'enabled' => env('ABSTRACT_API_ENABLED', true),
    ],

];
