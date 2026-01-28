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
}
