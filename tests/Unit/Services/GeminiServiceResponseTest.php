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
}
