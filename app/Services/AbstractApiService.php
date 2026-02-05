<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AbstractApiService
{
    protected $apiKey;

    protected $baseUrl = 'https://emailreputation.abstractapi.com/v1/';

    protected $enabled;

    public function __construct()
    {
        $this->apiKey = config('services.abstract_api.api_key');
        $this->enabled = config('services.abstract_api.enabled', true);
    }

    public function validateEmail(string $email): array
    {
        if (! $this->isEnabled()) {
            return $this->getFallBackResponse(true, 'Abstract API service is disabled.');
        }

        try {
            $response = Http::timeout(5)
                ->retry(2, 100)
                ->get($this->baseUrl, [
                    'api_key' => $this->apiKey,
                    'email' => $email,
                ]);

            if ($response->failed()) {
                Log::warning('AbstractAPI request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return $this->getFallBackResponse(false, 'Failed to connect to Abstract API service.');
            }

            return $this->parseResponse($response->json(), $email);
        } catch (\Exception $e) {
            Log::error('AbstractAPI request exception: '.$e->getMessage());

            return $this->getFallbackResponse(error: $e->getMessage());
        }

    }

    protected function parseResponse(array $response, string $email): array
    {
        $status = $response['email_deliverability']['status'] ?? 'unknown';
        $isDeliverable = ($status === 'deliverable');
        $isDisposable = $response['email_quality']['is_disposable'] ?? false;
        $isFormatValid = $response['email_deliverability']['is_format_valid'] ?? true;
        $qualityScore = (float) ($response['email_quality']['score'] ?? 0.5);
        $isValid = $isDeliverable && ! $isDisposable && $isFormatValid;
        $suggestion = null;

        return [
            'valid' => $isValid,
            'deliverable' => $isDeliverable,
            'disposable' => $isDisposable,
            'quality_score' => $qualityScore,
            'suggestion' => $suggestion,
            'bypass' => false,
            'error' => null,
        ];
    }

    protected function isEnabled(): bool
    {
        return $this->enabled && ! empty($this->apiKey);
    }

    protected function getFallBackResponse(bool $bypass = true, ?string $error = null): array
    {
        return [
            'valid' => true,
            'deliverable' => true,
            'disposable' => false,
            'quality_score' => 1.0,
            'suggestion' => null,
            'bypass' => $bypass,
            'error' => $error,
        ];
    }
}
