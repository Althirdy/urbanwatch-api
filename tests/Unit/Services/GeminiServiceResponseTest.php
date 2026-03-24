<?php

namespace Tests\Unit\Services;

use App\Services\GeminiService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class GeminiServiceResponseTest extends TestCase
{
    public function test_validate_and_classify_parses_json_correctly()
    {
        // Mock the HTTP client
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => '```json
{
  "is_valid": true,
  "rejection_reason": null,
  "category": "safety",
  "specific_type": "fire",
  "severity": "high",
  "confidence": 0.95,
  "reasoning": "User reported fire"
}
```',
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config(['services.gemini.api_key' => 'test-key']);
        $service = new GeminiService;

        $result = $service->validateAndClassify('Help there is a fire');

        $this->assertNotNull($result, 'Result should not be null');
        $this->assertTrue($result['is_valid']);
        $this->assertEquals('safety', $result['category']);
    }

    public function test_validate_and_classify_handles_plain_json_response()
    {
        // Mock the HTTP client with plain JSON (no markdown)
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => '{
  "is_valid": true,
  "rejection_reason": null,
  "category": "safety",
  "specific_type": "fire",
  "severity": "high",
  "confidence": 0.95,
  "reasoning": "User reported fire"
}',
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config(['services.gemini.api_key' => 'test-key']);
        $service = new GeminiService;

        $result = $service->validateAndClassify('Help there is a fire');

        $this->assertNotNull($result, 'Result should not be null');
        $this->assertTrue($result['is_valid']);
    }

    public function test_validate_and_classify_logs_error_on_invalid_json()
    {
        Log::shouldReceive('error')
            ->once()
            ->withArgs(function ($message, $context) {
                return str_contains($message, 'Failed to parse JSON response') &&
                    isset($context['raw']);
            });

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => 'INVALID JSON',
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config(['services.gemini.api_key' => 'test-key']);
        $service = new GeminiService;

        $result = $service->validateAndClassify('Help there is a fire');

        $this->assertNull($result);
    }

    public function test_validate_and_classify_logs_error_on_unexpected_format()
    {
        Log::shouldReceive('error')
            ->once()
            ->withArgs(function ($message, $context) {
                return str_contains($message, 'Unexpected response format') &&
                    isset($context['response']);
            });

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [], // Empty candidates
            ], 200),
        ]);

        config(['services.gemini.api_key' => 'test-key']);
        $service = new GeminiService;

        $result = $service->validateAndClassify('Help there is a fire');

        $this->assertNull($result);
    }

    public function test_analyze_audio_retries_transient_http_errors_then_succeeds()
    {
        Http::fakeSequence()
            ->push(['error' => ['message' => 'internal']], 500)
            ->push([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'transcription_text' => 'May sunog dito',
                                        'title' => 'May Sunog',
                                        'description' => 'May sunog sa bahay',
                                        'category' => 'safety',
                                        'specific_type' => 'fire',
                                        'severity' => 'high',
                                        'confidence' => 0.9,
                                        'is_valid' => true,
                                        'rejection_reason' => null,
                                    ], JSON_THROW_ON_ERROR),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200);

        config([
            'services.gemini.api_key' => 'test-key',
        ]);
        $service = new GeminiService;
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, 'fake-audio-content');

        $result = $service->analyzeAudio($stream, 18, 'audio/mpeg', ['concern_id' => 999]);

        $this->assertNotNull($result);
        $this->assertSame('May sunog dito', $result['transcription_text']);
        $this->assertSame('safety', $result['category']);
        $this->assertTrue($result['is_valid']);

        fclose($stream);
    }

    public function test_analyze_audio_returns_null_after_exhausted_retries()
    {
        Http::fakeSequence()
            ->push(['error' => ['message' => 'internal']], 500)
            ->push(['error' => ['message' => 'unavailable']], 503)
            ->push(['error' => ['message' => 'gateway timeout']], 504);

        config([
            'services.gemini.api_key' => 'test-key',
        ]);
        $service = new GeminiService;

        // Legacy signature remains supported.
        $result = $service->analyzeAudio('fake-audio-content', 'audio/mpeg', ['concern_id' => 1000]);

        $this->assertNull($result);
    }

    public function test_analyze_audio_normalizes_video_mime_to_audio_for_inline_path()
    {
        Http::fakeSequence()
            ->push([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'transcription_text' => 'May aksidente po',
                                        'title' => 'Aksidente sa Kalsada',
                                        'description' => 'May banggaan ng motorsiklo sa kanto.',
                                        'category' => 'safety',
                                        'specific_type' => 'collision',
                                        'severity' => 'high',
                                        'confidence' => 0.88,
                                        'is_valid' => true,
                                        'rejection_reason' => null,
                                    ], JSON_THROW_ON_ERROR),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200);

        config([
            'services.gemini.api_key' => 'test-key',
        ]);
        $service = new GeminiService;
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, 'another-fake-audio-content');

        $result = $service->analyzeAudio($stream, 26, 'video/mp4', ['concern_id' => 1002]);

        $this->assertNotNull($result);
        $this->assertSame('May aksidente po', $result['transcription_text']);
        $this->assertSame('collision', $result['specific_type']);
        $this->assertTrue($result['is_valid']);
        Http::assertSent(function ($request) {
            $data = $request->data();
            $mime = $data['contents'][0]['parts'][0]['inline_data']['mime_type'] ?? null;

            return $mime === 'audio/mp4';
        });

        fclose($stream);
    }

    public function test_analyze_audio_returns_null_on_invalid_stream_input()
    {
        config([
            'services.gemini.api_key' => 'test-key',
        ]);
        $service = new GeminiService;

        $result = $service->analyzeAudio(new \stdClass, 100, 'audio/mpeg', ['concern_id' => 1001]);

        $this->assertNull($result);
    }

    public function test_analyze_yolo_image_normalizes_string_nulls_and_adds_audit_fields()
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'mode_applied' => 'REAL_WORLD',
                                        'scene_type' => 'real_world',
                                        'overall_valid' => false,
                                        'reasoning' => 'Diorama simulation only.',
                                        'class_verdicts' => [[
                                            'source_class' => 'Flood',
                                            'normalized_class' => 'Flood',
                                            'is_legit' => false,
                                            'accident_type' => 'null',
                                            'severity' => 'null',
                                            'title' => 'null',
                                            'description' => 'Miniature flood scene.',
                                            'confidence' => '87.5',
                                            'detected_objects' => ['miniature_water'],
                                            'reasoning' => 'Not real-world.',
                                        ]],
                                    ], JSON_THROW_ON_ERROR),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config([
            'services.gemini.api_key' => 'test-key',
            'yolo.demo_mode_enabled' => true,
        ]);
        $service = new GeminiService;

        $result = $service->analyzeYoloImage('fake-image-content', 'image/jpeg', ['device_name' => 'CCTV-1'], ['Flood']);

        $this->assertNotNull($result);
        $this->assertSame('REAL_WORLD', $result['mode_applied']);
        $this->assertSame('real_world', $result['scene_type']);
        $this->assertSame('yolo-v2-strict', $result['prompt_version']);
        $this->assertSame(['Flood'], $result['detected_classes_input']);
        $this->assertNull($result['class_verdicts'][0]['accident_type']);
        $this->assertNull($result['class_verdicts'][0]['severity']);
        $this->assertNull($result['class_verdicts'][0]['title']);
        $this->assertSame(87.5, $result['class_verdicts'][0]['confidence']);
    }

    public function test_analyze_yolo_image_prompt_uses_real_world_mode_instructions()
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'overall_valid' => false,
                                        'reasoning' => 'No emergency',
                                        'class_verdicts' => [],
                                    ], JSON_THROW_ON_ERROR),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config([
            'services.gemini.api_key' => 'test-key',
            'yolo.demo_mode_enabled' => false,
        ]);
        $service = new GeminiService;

        $service->analyzeYoloImage('fake-image-content', 'image/jpeg', ['device_name' => 'CCTV-2'], ['Flood']);

        Http::assertSent(function ($request) {
            $data = $request->data();
            $prompt = $data['contents'][0]['parts'][1]['text'] ?? '';

            return str_contains($prompt, 'MODE: REAL_WORLD') &&
                str_contains($prompt, 'do NOT reject only because the scene is a diorama') &&
                str_contains($prompt, 'very simple/ambiguous scene with no clear emergency cues') &&
                str_contains($prompt, 'Do not return the string "null"') &&
                str_contains($prompt, 'PROMPT VERSION: yolo-v2-strict');
        });
    }

    public function test_analyze_yolo_image_demo_mode_promotes_diorama_supported_class_to_legit()
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'mode_applied' => 'DEMO_SIMULATION',
                                        'scene_type' => 'diorama',
                                        'overall_valid' => false,
                                        'reasoning' => 'Looks like a miniature scene.',
                                        'class_verdicts' => [[
                                            'source_class' => 'Flood',
                                            'normalized_class' => 'Flood',
                                            'is_legit' => false,
                                            'accident_type' => 'Flood',
                                            'severity' => null,
                                            'title' => null,
                                            'description' => null,
                                            'confidence' => 81,
                                            'detected_objects' => ['water'],
                                            'reasoning' => 'The image is a diorama, not a real-world scene.',
                                        ]],
                                    ], JSON_THROW_ON_ERROR),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config([
            'services.gemini.api_key' => 'test-key',
            'yolo.demo_mode_enabled' => true,
        ]);
        $service = new GeminiService;

        $result = $service->analyzeYoloImage('fake-image-content', 'image/jpeg', ['device_name' => 'CCTV-3'], ['Flood']);

        $this->assertNotNull($result);
        $this->assertTrue($result['overall_valid']);
        $this->assertTrue($result['policy_adjusted']);
        $this->assertTrue($result['class_verdicts'][0]['is_legit']);
        $this->assertSame('Flood', $result['class_verdicts'][0]['accident_type']);
        $this->assertContains(
            'Adjusted by DEMO_SIMULATION policy: diorama emergency simulation accepted.',
            $result['class_verdicts'][0]['warnings']
        );
    }

    public function test_analyze_yolo_image_demo_mode_infers_diorama_from_reasoning_when_scene_type_missing()
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'mode_applied' => 'DEMO_SIMULATION',
                                        'overall_valid' => false,
                                        'reasoning' => 'The detected objects are part of a diorama and not real-world events.',
                                        'class_verdicts' => [[
                                            'source_class' => 'Flood',
                                            'normalized_class' => 'Flood',
                                            'is_legit' => false,
                                            'accident_type' => 'Flood',
                                            'severity' => null,
                                            'title' => null,
                                            'description' => null,
                                            'confidence' => null,
                                            'detected_objects' => [],
                                            'reasoning' => 'The image shows a diorama with toy cars and buildings, not a real-world flood.',
                                        ]],
                                    ], JSON_THROW_ON_ERROR),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config([
            'services.gemini.api_key' => 'test-key',
            'yolo.demo_mode_enabled' => true,
        ]);
        $service = new GeminiService;

        $result = $service->analyzeYoloImage('fake-image-content', 'image/jpeg', ['device_name' => 'CCTV-5'], ['Flood']);

        $this->assertNotNull($result);
        $this->assertSame('diorama', $result['scene_type']);
        $this->assertTrue($result['policy_adjusted']);
        $this->assertTrue($result['overall_valid']);
        $this->assertTrue($result['class_verdicts'][0]['is_legit']);
    }

    public function test_analyze_yolo_image_real_world_mode_keeps_diorama_non_legit()
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'mode_applied' => 'REAL_WORLD',
                                        'scene_type' => 'diorama',
                                        'overall_valid' => false,
                                        'reasoning' => 'Diorama scene.',
                                        'class_verdicts' => [[
                                            'source_class' => 'Flood',
                                            'normalized_class' => 'Flood',
                                            'is_legit' => false,
                                            'accident_type' => 'Flood',
                                            'severity' => null,
                                            'title' => null,
                                            'description' => null,
                                            'confidence' => 81,
                                            'detected_objects' => ['water'],
                                            'reasoning' => 'Diorama only.',
                                        ]],
                                    ], JSON_THROW_ON_ERROR),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config([
            'services.gemini.api_key' => 'test-key',
            'yolo.demo_mode_enabled' => false,
        ]);
        $service = new GeminiService;

        $result = $service->analyzeYoloImage('fake-image-content', 'image/jpeg', ['device_name' => 'CCTV-4'], ['Flood']);

        $this->assertNotNull($result);
        $this->assertFalse($result['overall_valid']);
        $this->assertFalse($result['policy_adjusted']);
        $this->assertFalse($result['class_verdicts'][0]['is_legit']);
    }
}
