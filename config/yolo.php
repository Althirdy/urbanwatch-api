<?php

return [
    'demo_mode_enabled' => env('YOLO_DEMO_MODE_ENABLED', false),

    'global_fallback_enabled' => env('YOLO_GLOBAL_FALLBACK_ENABLED', true),

    'sms_cooldown_minutes' => (int) env('YOLO_SMS_COOLDOWN_MINUTES', 15),

    'responder_mapping' => [
        'CarCollision' => ['Traffic', 'Emergency', 'Crime'],
        'Accident' => ['Traffic', 'Emergency', 'Crime'],
        'Flood' => ['Emergency', 'Barangay'],
        'Fire' => ['Fire', 'Emergency'],
    ],
];
