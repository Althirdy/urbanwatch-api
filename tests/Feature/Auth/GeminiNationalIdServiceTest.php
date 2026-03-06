<?php

namespace Tests\Feature\Auth;

use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiNationalIdServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_analyze_national_id_normalizes_missing_fields_for_fast_response(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => '{"isAuthentic":true,"data":{"pcnNumber":"1234-5678-9012-3456"},"confidence":120}',
                        ]],
                    ],
                ]],
            ], 200),
        ]);

        config(['services.gemini.api_key' => 'test-key']);

        $result = (new GeminiService)->analyzeNationalId('fake-image-content', 'image/jpeg');

        $this->assertTrue($result['isAuthentic']);
        $this->assertSame(100, $result['confidence']);
        $this->assertArrayHasKey('backSideDetected', $result);
        $this->assertArrayHasKey('imageQualityIssue', $result);
        $this->assertArrayHasKey('isPhase9Resident', $result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('province', $result['data']);
        $this->assertArrayHasKey('postalCode', $result['data']);
    }

    public function test_analyze_national_id_does_not_apply_registration_gate_in_gemini_response(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode([
                                'isAuthentic' => true,
                                'isPhase9Resident' => false,
                                'confidence' => 90,
                                'data' => [
                                    'pcnNumber' => '1234-5678-9012-3456',
                                    'address' => 'Sample Street, Caloocan City',
                                ],
                            ]),
                        ]],
                    ],
                ]],
            ], 200),
        ]);

        config(['services.gemini.api_key' => 'test-key']);

        $result = (new GeminiService)->analyzeNationalId('fake-image-content', 'image/jpeg');

        $this->assertFalse($result['isOutsideAllowedArea']);
        $this->assertNull($result['locationRestrictionReason']);
    }
}
