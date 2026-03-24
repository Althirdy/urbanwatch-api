<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Psr\Http\Message\StreamInterface;

class GeminiService
{
    private const YOLO_PROMPT_VERSION = 'yolo-v2-strict';

    protected $apiKey;

    protected string $apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

    protected string $audioModel = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

    protected string $audioModelName = 'gemini-2.5-flash-lite';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->apiBaseUrl = rtrim((string) config('services.gemini.api_base', 'https://generativelanguage.googleapis.com/v1beta'), '/');
        $this->audioModelName = (string) config('services.gemini.audio_model', 'gemini-2.5-flash-lite');

        $generateUrl = "{$this->apiBaseUrl}/models/{$this->audioModelName}:generateContent";

        $this->baseUrl = $generateUrl;
        $this->audioModel = $generateUrl;
    }

    /**
     * Transcribe and analyze audio content with category and severity detection.
     *
     * Stream-first signature:
     * analyzeAudio(resource|StreamInterface $audioInput, int $audioSize, string $mimeType, array $context = [])
     *
     * Legacy signature (backwards compatible):
     * analyzeAudio(string $fileContent, string $mimeType, array $context = [])
     *
     * @return array|null Returns array with 'transcription_text', 'title', 'description', 'category', 'severity',
     *                    'confidence', 'is_valid', 'rejection_reason' or null on failure.
     */
    public function analyzeAudio($audioInput, $audioSizeOrMimeType, $mimeTypeOrContext = null, array $context = [])
    {
        if (! $this->apiKey) {
            Log::error('Gemini API Key is missing.');

            return null;
        }

        $audioSize = 0;
        $mimeType = '';
        $resolvedContext = $context;

        if (is_string($audioInput)) {
            // Legacy path: analyzeAudio($fileContent, $mimeType, $context)
            $audioSize = strlen($audioInput);
            $mimeType = (string) $audioSizeOrMimeType;
            $resolvedContext = is_array($mimeTypeOrContext) ? $mimeTypeOrContext : $context;
        } else {
            // Stream-first path: analyzeAudio($stream, $audioSize, $mimeType, $context)
            $audioSize = (int) $audioSizeOrMimeType;
            $mimeType = (string) $mimeTypeOrContext;
            $resolvedContext = $context;
        }

        $mimeType = $this->normalizeVoiceAudioMimeType($mimeType);
        $fileContent = $this->extractAudioContentFromInput($audioInput);

        if ($audioSize <= 0 || trim($mimeType) === '' || $fileContent === '') {
            Log::error('Gemini audio analysis input is invalid', [
                'has_stream_input' => is_resource($audioInput) || $audioInput instanceof StreamInterface,
                'has_file_content' => $fileContent !== '',
                'audio_size' => $audioSize,
                'mime_type' => $mimeType,
                'concern_id' => $resolvedContext['concern_id'] ?? null,
            ]);

            return null;
        }

        $maxAttempts = 3;
        $retryDelaysMs = [0, 1000, 2000];

        $logContext = array_filter([
            'concern_id' => $resolvedContext['concern_id'] ?? null,
            'mime_type' => $mimeType,
            'input_bytes' => $audioSize,
            'model' => $this->audioModelName,
            'voice_ai_path' => 'inline_data',
        ], static fn ($value) => ! is_null($value));

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            Log::info('Gemini audio analysis attempt started', array_merge($logContext, [
                'attempt' => $attempt,
                'max_attempts' => $maxAttempts,
            ]));

            try {
                $inlineResult = $this->analyzeAudioInlineData($fileContent, $mimeType, $logContext, $attempt);

                if (! $inlineResult['success']) {
                    if ($inlineResult['retryable'] && $attempt < $maxAttempts) {
                        usleep($retryDelaysMs[$attempt] * 1000);

                        continue;
                    }

                    Log::error('Gemini audio analysis failed at inline step', array_merge($logContext, [
                        'attempt' => $attempt,
                        'status' => $inlineResult['status'],
                        'error' => $inlineResult['error'],
                    ]));

                    return null;
                }

                $result = $inlineResult['result'] ?? null;

                if (! is_array($result)) {
                    return null;
                }

                Log::info('Gemini audio analysis completed', array_merge($logContext, [
                    'attempt' => $attempt,
                    'is_valid' => (bool) ($result['is_valid'] ?? false),
                ]));

                return $this->normalizeConcernAiResult($result);
            } catch (\Throwable $e) {
                $retryable = $attempt < $maxAttempts;
                Log::warning('Gemini audio analysis exception', array_merge($logContext, [
                    'attempt' => $attempt,
                    'retryable' => $retryable,
                    'error' => $e->getMessage(),
                    'exception' => get_class($e),
                ]));

                if (! $retryable) {
                    Log::error('GeminiService audio analysis exhausted after exceptions', array_merge($logContext, [
                        'error' => $e->getMessage(),
                    ]));

                    return null;
                }

                usleep($retryDelaysMs[$attempt] * 1000);
            }
        }

        return null;
    }

    /**
     * Analyze concern text to determine category and severity.
     *
     * @param  string  $text  The concern text (transcript, title, or description)
     * @return array|null Returns array with 'category', 'severity', 'confidence', 'reasoning' or null on failure
     */
    public function analyzeConcernCategoryAndSeverity(string $text)
    {
        try {
            if (! $this->apiKey) {
                Log::error('Gemini API Key is missing.');

                return null;
            }

            $prompt = 'Analyze the following citizen concern text (in Filipino/Taglish or English). '.
                      'Determine the most appropriate category and severity level. '.
                      "\n\n".
                      'CATEGORIES (choose one):'."\n".
                      '- safety: Threats to personal safety, fire (sunog), accidents (aksidente), dangerous situations'."\n".
                      '- security: Crime, theft (nakawan), suspicious activity (kahina-hinala), violence'."\n".
                      '- infrastructure: Roads (daan), utilities (kuryente/tubig), broken facilities (sira), construction issues'."\n".
                      '- environment: Garbage (basura), pollution (polusyon), flooding (baha), sanitation (kalinisan)'."\n".
                      '- noise: Loud noise (ingay), disturbances, noise pollution'."\n".
                      '- other: Anything that doesn\'t fit the above categories'."\n".
                      "\n".
                      'SPECIFIC TYPE: One-word lowercase tag identifying the exact issue (e.g., fire, collision, theft, flood, assault, noise, garbage, pothole, light, sewage).'."\n".
                      "\n".
                      'SEVERITY LEVELS (choose one):'."\n".
                      '- high: Immediate danger, emergency, requires urgent action'."\n".
                      '- medium: Significant issue, needs attention soon'."\n".
                      '- low: Minor issue, can be addressed in normal schedule'."\n".
                      "\n".
                      'EXAMPLES:'."\n".
                      '- "May sunog sa bahay" → category: safety, specific_type: fire, severity: high'."\n".
                      '- "Maraming basura sa kalsada" → category: environment, specific_type: garbage, severity: medium'."\n".
                      '- "Sira ang kalsada" → category: infrastructure, specific_type: pothole, severity: medium'."\n".
                      '- "Napakalakas ng ingay ng kapitbahay" → category: noise, specific_type: noise, severity: low'."\n".
                      '- "May nakawan sa amin" → category: security, specific_type: theft, severity: high'."\n".
                      "\n".
                      'Concern Text: '.$text."\n\n".
                      'Return strictly valid JSON with keys: '.
                      '"category" (one of: safety, security, infrastructure, environment, noise, other), '.
                      '"specific_type" (lowercase string), '.
                      '"severity" (one of: low, medium, high), '.
                      '"confidence" (decimal 0.0 to 1.0 indicating how confident you are), '.
                      '"reasoning" (brief explanation in English). '.
                      'Do not include markdown formatting.';

            $response = Http::timeout(30)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->audioModel}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => $prompt,
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                ],
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error (Category Analysis)', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $responseData = $response->json();

            if (! isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Gemini API: Unexpected response format (Category Analysis)', ['response' => $responseData]);

                return null;
            }

            $jsonString = $responseData['candidates'][0]['content']['parts'][0]['text'];
            $jsonString = preg_replace('/^```json\s*|\s*```$/', '', $jsonString);

            $result = json_decode($jsonString, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Gemini API: Failed to parse JSON response (Category Analysis)', [
                    'error' => json_last_error_msg(),
                    'raw' => $jsonString,
                ]);

                return null;
            }

            // Validate response structure
            if (! isset($result['category']) || ! isset($result['severity']) || ! isset($result['confidence'])) {
                Log::error('Gemini API: Missing required fields in response', ['result' => $result]);

                return null;
            }

            return $this->normalizeConcernAiResult($result);

        } catch (\Exception $e) {
            Log::error('GeminiService Exception (Category Analysis)', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Analyze YOLO image and evaluate each detected class independently.
     */
    public function analyzeYoloImage(string $fileContent, string $mimeType, array $context = [], array $detectedClasses = [])
    {
        try {
            if (! $this->apiKey) {
                Log::error('Gemini API Key is missing.');

                return null;
            }

            $base64Data = base64_encode($fileContent);
            $contextInfo = '';
            if (! empty($context)) {
                $contextInfo = "\n\nContext Information:\n";
                if (isset($context['device_name'])) {
                    $contextInfo .= "- Camera: {$context['device_name']}\n";
                }
                if (isset($context['location'])) {
                    $contextInfo .= "- Location: {$context['location']}\n";
                }
            }

            $demoMode = (bool) config('yolo.demo_mode_enabled', false);

            $prompt = $this->getImageAnalysisSystemPrompt(
                $contextInfo,
                $detectedClasses,
                $demoMode
            );

            $response = Http::timeout(60)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->audioModel}?key={$this->apiKey}", [
                'contents' => [[
                    'parts' => [
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data' => $base64Data,
                            ],
                        ],
                        [
                            'text' => $prompt,
                        ],
                    ],
                ]],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                    'temperature' => 0.2,
                ],
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error (YOLO Image Analysis)', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $responseData = $response->json();
            if (! isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Gemini API: Unexpected response format (YOLO Image Analysis)', ['response' => $responseData]);

                return null;
            }

            $jsonString = preg_replace('/^```json\s*|\s*```$/', '', trim($responseData['candidates'][0]['content']['parts'][0]['text']));
            $result = json_decode($jsonString, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Gemini API: Failed to parse JSON response (YOLO Image Analysis)', [
                    'error' => json_last_error_msg(),
                    'raw' => $jsonString,
                ]);

                return null;
            }

            return $this->normalizeYoloImageResult($result, $detectedClasses, $demoMode);
        } catch (\Exception $e) {
            Log::error('GeminiService Exception (YOLO Image Analysis)', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Backward-compatible image analysis adapter for existing call sites.
     */
    public function analyzeImage(string $fileContent, string $mimeType, array $context = [])
    {
        $result = $this->analyzeYoloImage($fileContent, $mimeType, $context, []);
        if (! $result) {
            return null;
        }

        $bestVerdict = collect($result['class_verdicts'] ?? [])
            ->firstWhere('is_legit', true);

        if (! $bestVerdict) {
            return [
                'is_valid' => false,
                'accident_type' => null,
                'severity' => null,
                'title' => null,
                'description' => null,
                'confidence' => null,
                'detected_objects' => [],
                'reasoning' => $result['reasoning'] ?? 'No legitimate emergency detected.',
                'class_verdicts' => $result['class_verdicts'] ?? [],
                'raw' => $result['raw'] ?? $result,
            ];
        }

        return [
            'is_valid' => true,
            'accident_type' => $bestVerdict['accident_type'],
            'severity' => $bestVerdict['severity'],
            'title' => $bestVerdict['title'],
            'description' => $bestVerdict['description'],
            'confidence' => $bestVerdict['confidence'],
            'detected_objects' => $bestVerdict['detected_objects'],
            'reasoning' => $bestVerdict['reasoning'],
            'class_verdicts' => $result['class_verdicts'] ?? [],
            'raw' => $result['raw'] ?? $result,
        ];
    }

    /**
     * Validate and classify a citizen concern (text and optional image).
     *
     * @param  string  $text  The concern text
     * @param  string|null  $fileContent  Optional image binary content
     * @param  string|null  $mimeType  Optional image mime type
     * @return array|null Returns array with 'is_valid', 'rejection_reason', 'category', 'severity', 'confidence', 'reasoning'
     */
    public function validateAndClassify(string $text, ?string $fileContent = null, ?string $mimeType = null)
    {
        try {
            if (! $this->apiKey) {
                Log::error('Gemini API Key is missing.');

                return null;
            }

            $hasImage = $fileContent && $mimeType;
            $prompt = $this->getValidationSystemPrompt($text, $hasImage);

            $parts = [['text' => $prompt]];

            if ($fileContent && $mimeType) {
                $parts[] = [
                    'inline_data' => [
                        'mime_type' => $mimeType,
                        'data' => base64_encode($fileContent),
                    ],
                ];
            }

            $response = Http::timeout(30)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [['parts' => $parts]],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                    'temperature' => 0.1,
                ],
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error (Validate and Classify)', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $responseData = $response->json();
            $jsonString = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (! $jsonString) {
                Log::error('Gemini API: Unexpected response format (Validate and Classify)', ['response' => $responseData]);

                return null;
            }

            $jsonString = preg_replace('/^```json\s*|\s*```$/', '', trim($jsonString));
            $result = json_decode($jsonString, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Gemini API: Failed to parse JSON response (Validate and Classify)', [
                    'error' => json_last_error_msg(),
                    'raw' => $jsonString,
                ]);

                return null;
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('GeminiService Exception (Validate and Classify)', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Analyze Philippine National ID image for authenticity verification and data extraction.
     *
     * @param  string  $fileContent  Raw binary content of the image file
     * @param  string  $mimeType  Mime type of the file (e.g., 'image/jpeg')
     * @return array Returns array with 'is_authentic', 'data' containing extracted fields, 'isOutsideAllowedArea', 'locationRestrictionReason' or throws exception on API failure
     *
     * @throws \Exception When Gemini API fails
     */
    public function analyzeNationalId(string $fileContent, string $mimeType): array
    {
        if (empty($this->apiKey)) {
            Log::error('Gemini API Key is missing.');
            throw new \Exception('Gemini API configuration error');
        }

        $prompt = <<<'PROMPT'
You are a fast PhilSys ID verifier.
Return ONLY strict JSON (no markdown, no extra keys).
Prioritize speed and core extraction.

{
  "isAuthentic": boolean,
  "backSideDetected": boolean,
  "imageQualityIssue": boolean,
  "confidence": number,
  "reasoning": "short string",
  "isPhase9Resident": boolean,
  "data": {
    "pcnNumber": "string|null",
    "lastName": "string|null",
    "firstName": "string|null",
    "suffix": "string|null",
    "middleName": "string|null",
    "dateOfBirth": "MM/DD/YYYY|null",
    "address": "string|null",
    "barangay": "string|null",
    "city": "string|null",
    "province": "string|null",
    "region": "string|null",
    "postalCode": "string|null"
  }
}
PROMPT;

        try {
            $response = Http::connectTimeout(5)
                ->timeout(30)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("{$this->baseUrl}?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt],
                                [
                                    'inline_data' => [
                                        'mime_type' => $mimeType,
                                        'data' => base64_encode($fileContent),
                                    ],
                                ],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'response_mime_type' => 'application/json',
                        'temperature' => 0.1,
                        'maxOutputTokens' => 450,
                    ],
                ]);

            if ($response->failed()) {
                Log::error('Gemini API Error', ['status' => $response->status(), 'body' => $response->body()]);
                throw new \Exception('Gemini API request failed');
            }

            // 3. Parse Response
            $responseData = $response->json();
            $rawText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

            // Clean markdown just in case (e.g. ```json ... ```)
            $cleanJson = preg_replace('/^```json\s*|\s*```$/', '', trim($rawText));
            $result = json_decode($cleanJson, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Failed to parse Gemini JSON: '.json_last_error_msg());
            }

            $result = $this->normalizeNationalIdResult($result);

            // Registration residency rules are evaluated in OCR workflow service.
            $result['isOutsideAllowedArea'] = false;
            $result['locationRestrictionReason'] = null;

            return $result;

        } catch (\Throwable $e) {
            Log::error('Gemini Service Exception', ['error' => $e->getMessage()]);
            // Re-throw or return a safe fallback depending on your preference
            throw $e;
        }
    }

    private function normalizeNationalIdResult(array $result): array
    {
        $result['isAuthentic'] = (bool) ($result['isAuthentic'] ?? false);
        $result['backSideDetected'] = (bool) ($result['backSideDetected'] ?? false);
        $result['imageQualityIssue'] = (bool) ($result['imageQualityIssue'] ?? false);
        $result['confidence'] = max(0, min((int) ($result['confidence'] ?? 0), 100));
        $result['reasoning'] = (string) ($result['reasoning'] ?? '');
        $result['isPhase9Resident'] = (bool) ($result['isPhase9Resident'] ?? false);

        $data = $result['data'] ?? [];
        $result['data'] = [
            'pcnNumber' => $data['pcnNumber'] ?? null,
            'lastName' => $data['lastName'] ?? null,
            'firstName' => $data['firstName'] ?? null,
            'suffix' => $data['suffix'] ?? null,
            'middleName' => $data['middleName'] ?? null,
            'dateOfBirth' => $data['dateOfBirth'] ?? null,
            'address' => $data['address'] ?? null,
            'barangay' => $data['barangay'] ?? null,
            'city' => $data['city'] ?? null,
            'province' => $data['province'] ?? null,
            'region' => $data['region'] ?? null,
            'postalCode' => $data['postalCode'] ?? null,
        ];

        return $result;
    }

    /**
     * Compare two concern descriptions/transcripts to see if they refer to the same incident.
     */
    public function compareConcerns(string $text1, string $text2): bool
    {
        try {
            if (! $this->apiKey) {
                return $this->hasStrongTextOverlap($text1, $text2);
            }

            $prompt = "You are an incident deduplication assistant. Compare the following two citizen reports and determine if they refer to the SAME specific incident/event.\n\n".
                      "CRITERIA:\n".
                      "- Same landmarks or specific street numbers mentioned.\n".
                      "- Same type of incident (e.g., both are a car crash, both are a trash pile).\n".
                      "- Significant differences (e.g., 'Bakery fire' vs 'Pharmacy fire') mean different incidents.\n\n".
                      "Report 1: \"$text1\"\n".
                      "Report 2: \"$text2\"\n\n".
                      'Return strictly JSON: {"is_same_incident": boolean, "reasoning": "string"}';

            $response = Http::timeout(10)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                    'temperature' => 0.1,
                ],
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error (Comparison)', ['status' => $response->status()]);

                return $this->hasStrongTextOverlap($text1, $text2);
            }

            $responseData = $response->json();
            $jsonString = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $jsonString = preg_replace('/^```json\s*|\s*```$/', '', trim($jsonString));
            $result = json_decode($jsonString, true);

            return (bool) ($result['is_same_incident'] ?? $this->hasStrongTextOverlap($text1, $text2));

        } catch (\Exception $e) {
            Log::error('Gemini Comparison Exception', ['error' => $e->getMessage()]);

            return $this->hasStrongTextOverlap($text1, $text2);
        }
    }

    /**
     * Normalize concern AI response into a consistent contract for both manual and voice concerns.
     */
    private function normalizeConcernAiResult(array $result): array
    {
        return [
            'transcription_text' => $result['transcription_text'] ?? null,
            'title' => $result['title'] ?? null,
            'description' => $result['description'] ?? null,
            'is_valid' => (bool) ($result['is_valid'] ?? false),
            'rejection_reason' => $result['rejection_reason'] ?? null,
            'category' => $result['category'] ?? null,
            'specific_type' => $result['specific_type'] ?? null,
            'severity' => $result['severity'] ?? null,
            'confidence' => isset($result['confidence']) ? (float) $result['confidence'] : 0.0,
            'coherence_score' => isset($result['coherence_score']) ? (float) $result['coherence_score'] : 0.0,
            'detail_score' => isset($result['detail_score']) ? (float) $result['detail_score'] : 0.0,
            'reasoning' => $result['reasoning'] ?? null,
            'raw' => $result,
        ];
    }

    /**
     * Deterministic fallback comparator when model output is unavailable.
     */
    private function hasStrongTextOverlap(string $text1, string $text2): bool
    {
        $tokens1 = $this->tokenizeForCompare($text1);
        $tokens2 = $this->tokenizeForCompare($text2);
        if (empty($tokens1) || empty($tokens2)) {
            return false;
        }

        $intersection = array_intersect($tokens1, $tokens2);
        $union = array_unique(array_merge($tokens1, $tokens2));
        $score = count($union) > 0 ? count($intersection) / count($union) : 0.0;

        return $score >= 0.40;
    }

    private function tokenizeForCompare(string $text): array
    {
        $normalized = strtolower(trim($text));
        if ($normalized === '') {
            return [];
        }

        $cleaned = preg_replace('/[^a-z0-9\\s]/', ' ', $normalized);
        $parts = preg_split('/\\s+/', (string) $cleaned);
        $parts = array_filter($parts, fn ($part) => strlen($part) >= 3);

        return array_values(array_unique($parts));
    }

    private function analyzeAudioInlineData(string $fileContent, string $mimeType, array $logContext, int $attempt): array
    {
        $response = Http::timeout(30)->withHeaders([
            'Content-Type' => 'application/json',
        ])->post("{$this->audioModel}?key={$this->apiKey}", [
            'contents' => [[
                'parts' => [
                    [
                        'inline_data' => [
                            'mime_type' => $mimeType,
                            'data' => base64_encode($fileContent),
                        ],
                    ],
                    [
                        'text' => $this->buildAudioPrompt(),
                    ],
                ],
            ]],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
            ],
        ]);

        if ($response->failed()) {
            $status = $response->status();
            $retryable = $this->isRetryableGeminiStatus($status);
            Log::warning('Gemini audio inline_data HTTP failure', array_merge($logContext, [
                'attempt' => $attempt,
                'status' => $status,
                'retryable' => $retryable,
                'response_preview' => substr($response->body(), 0, 500),
            ]));

            return [
                'success' => false,
                'retryable' => $retryable,
                'status' => $status,
                'error' => 'inline_request_failed',
            ];
        }

        $responseData = $response->json();
        if (! isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
            Log::error('Gemini audio inline_data unexpected response format', array_merge($logContext, [
                'attempt' => $attempt,
                'response' => $responseData,
            ]));

            return [
                'success' => false,
                'retryable' => false,
                'status' => $response->status(),
                'error' => 'inline_unexpected_response',
            ];
        }

        $jsonString = preg_replace('/^```json\s*|\s*```$/', '', (string) $responseData['candidates'][0]['content']['parts'][0]['text']);
        $result = json_decode($jsonString, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Gemini audio inline_data JSON parse failure', array_merge($logContext, [
                'attempt' => $attempt,
                'error' => json_last_error_msg(),
                'raw_preview' => substr($jsonString, 0, 500),
            ]));

            return [
                'success' => false,
                'retryable' => false,
                'status' => $response->status(),
                'error' => 'inline_json_parse_failed',
            ];
        }

        return [
            'success' => true,
            'retryable' => false,
            'status' => $response->status(),
            'result' => $this->normalizeConcernAiResult($result),
        ];
    }

    private function extractAudioContentFromInput($audioInput): string
    {
        if (is_string($audioInput)) {
            return $audioInput;
        }

        if ($audioInput instanceof StreamInterface) {
            try {
                if ($audioInput->isSeekable()) {
                    $audioInput->rewind();
                }

                return $audioInput->getContents();
            } catch (\Throwable) {
                return '';
            }
        }

        if (is_resource($audioInput)) {
            $meta = stream_get_meta_data($audioInput);
            if (($meta['seekable'] ?? false) === true) {
                @rewind($audioInput);
            }

            $contents = stream_get_contents($audioInput);
            if ($contents === false) {
                return '';
            }

            return $contents;
        }

        return '';
    }

    private function normalizeVoiceAudioMimeType(string $mimeType): string
    {
        $normalized = strtolower(trim($mimeType));

        return match ($normalized) {
            'video/mp4' => 'audio/mp4',
            'audio/m4a' => 'audio/mp4',
            default => $normalized,
        };
    }

    private function buildAudioPrompt(): string
    {
        return 'Transcribe the following audio recording of a citizen concern (likely in Filipino or Taglish). '.
            'Provide the transcription text verbatim. '.
            'Generate a concise 3-5 word title in Tagalog (Filipino). '.
            'Generate a brief 1-sentence summary description in Tagalog (Filipino). '.
            "\n\n".
            'Also analyze the concern for VALIDITY and CLASSIFICATION:'."\n".
            '- is_valid: true if it describes a real community issue or emergency.'."\n".
            '- rejection_reason: Brief Tagalog explanation if invalid, else null.'."\n".
            '- CATEGORIES: safety, security, infrastructure, environment, noise, other'."\n".
            '- SPECIFIC TYPE: One-word lowercase tag identifying the exact issue (e.g., fire, collision, theft, flood, assault, noise, garbage).'."\n".
            '- SEVERITY LEVELS: low, medium, high'."\n".
            '- IMPORTANT: Reports mentioning emergencies like "sunog", "banggaan/aksidente", "baha", "nakawan", especially with landmarks/locations (e.g., gasolinahan, rotonda, school, kanto), are VALID even if short.'."\n".
            '- INVALID ONLY if clearly gibberish, joke/test spam, or unrelated chat.'."\n".
            "\n".
            'EXAMPLES:'."\n".
            '- "May sunog" → category: safety, specific_type: fire, severity: high, is_valid: true'."\n".
            '- "May banggaan malapit sa Roden gasoline station" → category: safety, specific_type: collision, severity: high, is_valid: true'."\n".
            '- "Maraming basura" → category: environment, specific_type: garbage, severity: medium, is_valid: true'."\n".
            '- "Testing 123 asdf" → is_valid: false'."\n".
            "\n".
            "Return strictly valid JSON with keys: 'transcription_text', 'title', 'description', 'category', 'specific_type', 'severity', 'confidence', 'is_valid', 'rejection_reason'. ".
            'Do not include markdown formatting.';
    }

    private function isRetryableGeminiStatus(int $status): bool
    {
        return in_array($status, [429, 500, 502, 503, 504], true);
    }

    /**
     * Get the system prompt for YOLO/CCTV image analysis (Diorama and Real-World Detection).
     *
     * Uses Natural Taglish (conversational, avoiding deep Tagalog) for Barangay admin readability.
     * Supports thesis diorama simulation mode with explicit class mapping: Collision, Flood, Fir.
     */
    private function getImageAnalysisSystemPrompt(string $contextInfo = '', array $detectedClasses = [], bool $demoMode = false): string
    {
        $promptVersion = self::YOLO_PROMPT_VERSION;
        $detectedClassesText = empty($detectedClasses)
            ? 'No explicit YOLO classes provided. Infer likely emergency classes.'
            : 'YOLO detected classes: '.implode(', ', $detectedClasses);
        $mode = $demoMode
            ? "MODE: DEMO_SIMULATION\n- Diorama/toy scenes are valid emergency simulations if emergency pattern is clearly represented."
            : "MODE: REAL_WORLD\n- Diorama/toy scenes are NOT real emergencies and must be marked as not legit.";

        return <<<IMAGEPROMPT
You are the UrbanWatch Emergency Detection AI. You analyze CCTV footage and flag emergencies.

PROMPT VERSION: {$promptVersion}

{$mode}

CLASS MAPPING:
- CarCollision/Collision -> Accident
- Flood -> Flood
- Fire/Fir -> Fire

{$detectedClassesText}

DECISION POLICY:
1) Decide scene_type first: real_world | diorama | uncertain.
2) Apply mode strictly:
   - REAL_WORLD: if scene_type is diorama, set is_legit=false for all classes.
   - DEMO_SIMULATION: do NOT reject only because the scene is a diorama/toy setup.
   - DEMO_SIMULATION: if emergency representation is clear for Flood/Fire/Accident, mark is_legit=true.
3) One verdict per detected class whenever possible.
4) Use JSON null, never the string "null".

VALIDATION EXAMPLES:
- VALID in DEMO_SIMULATION: clear flood/fire/collision representation in a toy/diorama setup.
- INVALID in any mode: very simple/ambiguous scene with no clear emergency cues (e.g., random sticks/objects without visible hazard).
- INVALID in REAL_WORLD: obvious miniature/diorama scene even if it resembles an emergency.

Return JSON:
{
  "prompt_version": "yolo-v2-strict",
  "mode_applied": "REAL_WORLD|DEMO_SIMULATION",
  "scene_type": "real_world|diorama|uncertain",
  "overall_valid": boolean,
  "reasoning": "Overall explanation",
  "class_verdicts": [
    {
      "source_class": "CarCollision|Collision|Flood|Fire|unknown",
      "normalized_class": "Accident|Flood|Fire|null",
      "is_legit": boolean,
      "accident_type": "Accident|Flood|Fire|null",
      "severity": "Low|Medium|High|null",
      "title": "short title or null",
      "description": "short description or null",
      "confidence": 0-100 or null,
      "detected_objects": ["..."],
      "reasoning": "class level reasoning",
      "warnings": ["optional warning strings"]
    }
  ]
}

{$contextInfo}

Return ONLY strict valid JSON. Do not include markdown formatting.
Do not return the string "null". Use JSON null instead.
IMAGEPROMPT;
    }

    private function normalizeYoloImageResult(array $result, array $detectedClasses = [], bool $demoMode = false): array
    {
        if (isset($result['is_valid'])) {
            $legacyAccidentType = $this->normalizeAccidentType($result['accident_type'] ?? null);
            $result['class_verdicts'] = [[
                'source_class' => $legacyAccidentType,
                'normalized_class' => $legacyAccidentType,
                'is_legit' => (bool) ($result['is_valid'] ?? false),
                'accident_type' => $legacyAccidentType,
                'severity' => $this->normalizeSeverity($result['severity'] ?? null),
                'title' => $this->normalizeNullableString($result['title'] ?? null),
                'description' => $this->normalizeNullableString($result['description'] ?? null),
                'confidence' => $this->normalizeConfidence($result['confidence'] ?? null),
                'detected_objects' => $result['detected_objects'] ?? [],
                'reasoning' => $this->normalizeNullableString($result['reasoning'] ?? null),
            ]];
            $result['overall_valid'] = (bool) ($result['is_valid'] ?? false);
        }

        $verdicts = collect($result['class_verdicts'] ?? [])->map(function ($item) {
            $normalizedClass = $this->normalizeAccidentType($item['normalized_class'] ?? $item['accident_type'] ?? null);
            $accidentType = $this->normalizeAccidentType($item['accident_type'] ?? $normalizedClass);
            $sourceClass = $this->normalizeNullableString($item['source_class'] ?? $normalizedClass);

            return [
                'source_class' => $sourceClass,
                'normalized_class' => $normalizedClass,
                'is_legit' => (bool) ($item['is_legit'] ?? false),
                'accident_type' => $accidentType,
                'severity' => $this->normalizeSeverity($item['severity'] ?? null),
                'title' => $this->normalizeNullableString($item['title'] ?? null),
                'description' => $this->normalizeNullableString($item['description'] ?? null),
                'confidence' => $this->normalizeConfidence($item['confidence'] ?? null),
                'detected_objects' => collect($item['detected_objects'] ?? [])
                    ->filter(fn ($obj) => ! is_null($this->normalizeNullableString($obj)))
                    ->map(fn ($obj) => $this->normalizeNullableString($obj))
                    ->values()
                    ->toArray(),
                'reasoning' => $this->normalizeNullableString($item['reasoning'] ?? null),
                'warnings' => collect($item['warnings'] ?? [])
                    ->map(fn ($warning) => $this->normalizeNullableString($warning))
                    ->filter()
                    ->values()
                    ->toArray(),
            ];
        })->values()->toArray();

        if (empty($verdicts) && ! empty($detectedClasses)) {
            $verdicts = collect($detectedClasses)->map(function ($detectedClass) {
                $accidentType = $detectedClass === 'CarCollision' ? 'Accident' : $detectedClass;

                return [
                    'source_class' => $detectedClass,
                    'normalized_class' => $accidentType,
                    'is_legit' => false,
                    'accident_type' => $accidentType,
                    'severity' => null,
                    'title' => null,
                    'description' => null,
                    'confidence' => null,
                    'detected_objects' => [],
                    'reasoning' => 'Gemini did not return class verdict.',
                ];
            })->toArray();
        }

        $modeApplied = $this->normalizeModeApplied($result['mode_applied'] ?? null, $demoMode);
        $sceneType = $this->resolveSceneType(
            $this->normalizeSceneType($result['scene_type'] ?? null),
            $result,
            $verdicts
        );
        $policyAdjusted = false;
        $verdicts = $this->applyDemoSimulationFallbackPolicy($verdicts, $modeApplied, $sceneType, $policyAdjusted);

        $containsLegit = collect($verdicts)->contains(fn ($v) => $v['is_legit']);
        $overallValidFromResult = (bool) ($result['overall_valid'] ?? false);

        return [
            'overall_valid' => $overallValidFromResult || $containsLegit,
            'reasoning' => $this->normalizeNullableString($result['reasoning'] ?? null),
            'prompt_version' => self::YOLO_PROMPT_VERSION,
            'mode_applied' => $modeApplied,
            'scene_type' => $sceneType,
            'policy_adjusted' => $policyAdjusted,
            'detected_classes_input' => array_values($detectedClasses),
            'class_verdicts' => $verdicts,
            'raw' => $result,
        ];
    }

    private function applyDemoSimulationFallbackPolicy(
        array $verdicts,
        string $modeApplied,
        string $sceneType,
        bool &$policyAdjusted
    ): array {
        $policyAdjusted = false;
        if ($modeApplied !== 'DEMO_SIMULATION' || $sceneType !== 'diorama') {
            return $verdicts;
        }

        return collect($verdicts)->map(function ($verdict) use (&$policyAdjusted) {
            if (($verdict['is_legit'] ?? false) === true) {
                return $verdict;
            }

            $accidentType = $this->normalizeAccidentType($verdict['accident_type'] ?? $verdict['normalized_class'] ?? null);
            if (! in_array($accidentType, ['Accident', 'Flood', 'Fire'], true)) {
                return $verdict;
            }

            if ($this->hasStrongSimulationRejectionReason($verdict['reasoning'] ?? null)) {
                return $verdict;
            }

            $policyAdjusted = true;
            $warnings = collect($verdict['warnings'] ?? [])->filter()->values()->toArray();
            $warnings[] = 'Adjusted by DEMO_SIMULATION policy: diorama emergency simulation accepted.';

            return array_merge($verdict, [
                'is_legit' => true,
                'accident_type' => $accidentType,
                'normalized_class' => $accidentType,
                'severity' => $verdict['severity'] ?? 'Medium',
                'title' => $verdict['title'] ?? "Simulated {$accidentType} detected",
                'description' => $verdict['description'] ?? 'Diorama emergency simulation detected.',
                'warnings' => $warnings,
            ]);
        })->values()->toArray();
    }

    private function hasStrongSimulationRejectionReason(mixed $reasoning): bool
    {
        $text = strtolower((string) ($this->normalizeNullableString($reasoning) ?? ''));
        if ($text === '') {
            return false;
        }

        return str_contains($text, 'no hazard') ||
            str_contains($text, 'no flood') ||
            str_contains($text, 'no fire') ||
            str_contains($text, 'no collision') ||
            str_contains($text, 'no accident') ||
            str_contains($text, 'no emergency signs') ||
            str_contains($text, 'insufficient evidence') ||
            str_contains($text, 'cannot verify') ||
            str_contains($text, 'not visible');
    }

    private function resolveSceneType(string $sceneType, array $result, array $verdicts): string
    {
        if ($sceneType !== 'uncertain') {
            return $sceneType;
        }

        if ($this->isDioramaReasoningText($result['reasoning'] ?? null)) {
            return 'diorama';
        }

        foreach ($verdicts as $verdict) {
            if ($this->isDioramaReasoningText($verdict['reasoning'] ?? null)) {
                return 'diorama';
            }
        }

        return 'uncertain';
    }

    private function isDioramaReasoningText(mixed $reasoning): bool
    {
        $text = strtolower((string) ($this->normalizeNullableString($reasoning) ?? ''));
        if ($text === '') {
            return false;
        }

        return str_contains($text, 'diorama') ||
            str_contains($text, 'toy') ||
            str_contains($text, 'miniature') ||
            str_contains($text, 'scale model') ||
            str_contains($text, 'model scene');
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (is_null($value)) {
            return null;
        }

        if (is_bool($value) || is_numeric($value)) {
            return (string) $value;
        }

        $string = trim((string) $value);
        if ($string === '') {
            return null;
        }

        $lower = strtolower($string);
        if (in_array($lower, ['null', 'none', 'n/a', 'na', 'undefined'], true)) {
            return null;
        }

        return $string;
    }

    private function normalizeAccidentType(mixed $value): ?string
    {
        $normalized = $this->normalizeNullableString($value);
        if (is_null($normalized)) {
            return null;
        }

        $lower = strtolower($normalized);
        if (in_array($lower, ['carcollision', 'collision', 'accident'], true)) {
            return 'Accident';
        }
        if ($lower === 'flood') {
            return 'Flood';
        }
        if (in_array($lower, ['fire', 'fir', 'flame'], true)) {
            return 'Fire';
        }

        return null;
    }

    private function normalizeSeverity(mixed $value): ?string
    {
        $normalized = $this->normalizeNullableString($value);
        if (is_null($normalized)) {
            return null;
        }

        return match (strtolower($normalized)) {
            'low' => 'Low',
            'medium' => 'Medium',
            'high' => 'High',
            default => null,
        };
    }

    private function normalizeConfidence(mixed $value): ?float
    {
        $normalized = $this->normalizeNullableString($value);
        if (is_null($normalized) || ! is_numeric($normalized)) {
            return null;
        }

        $confidence = (float) $normalized;
        if ($confidence < 0) {
            return 0.0;
        }
        if ($confidence > 100) {
            return 100.0;
        }

        return $confidence;
    }

    private function normalizeSceneType(mixed $value): string
    {
        $normalized = strtolower((string) ($this->normalizeNullableString($value) ?? ''));

        return match ($normalized) {
            'real_world', 'real-world' => 'real_world',
            'diorama', 'simulation' => 'diorama',
            default => 'uncertain',
        };
    }

    private function normalizeModeApplied(mixed $value, bool $demoMode): string
    {
        $normalized = strtoupper((string) ($this->normalizeNullableString($value) ?? ''));

        if (in_array($normalized, ['REAL_WORLD', 'DEMO_SIMULATION'], true)) {
            return $normalized;
        }

        return $demoMode ? 'DEMO_SIMULATION' : 'REAL_WORLD';
    }

    /**
     * Get the system prompt for citizen concern validation and classification.
     *
     * Implements Weighted Coherence (Title vs. Description vs. Image) and Detail Level scoring.
     * Scores below threshold will be used by ConcernService to reject the concern.
     */
    private function getValidationSystemPrompt(string $text, bool $hasImage = false): string
    {
        $imageInstruction = $hasImage
            ? "\n- COHERENCE CHECK: Cross-reference the text with the provided image. If the image shows something unrelated to the text, lower the coherence_score."
            : '';

        return <<<PROMPT
You are the UrbanWatch AI Gatekeeper. Validate and classify citizen concern reports.

VALIDATION CRITERIA:
- is_valid: TRUE if it describes a real community issue (accidents, fire, garbage, noise, security threats).
- is_valid: FALSE if gibberish ("asdf"), irrelevant chat ("Kumain ka na?"), test spam, or personal/non-community issues.
{$imageInstruction}

QUALITY SCORING (0.00 to 1.00):
1. coherence_score: Agreement between Title, Description, and Image (if any).
   - High (0.8-1.0): All elements match (e.g., text says "Fire", image shows flames).
   - Medium (0.5-0.7): Partial match or minor inconsistencies.
   - Low (< 0.5): Mismatch (e.g., text says "Flood", image shows a cat).

2. detail_score: Context completeness (Who, What, Where).
   - High (0.8-1.0): Specific location, clear description of issue, identifiable subject.
   - Medium (0.5-0.7): Some details missing but understandable.
   - Low (< 0.5): Vague, no location, unclear issue (e.g., "Tulonggg" only).

CLASSIFICATION (Only if is_valid is true):
- CATEGORIES: safety, security, infrastructure, environment, noise, other
- SPECIFIC TYPE: One-word lowercase tag (fire, collision, theft, flood, assault, noise, garbage, pothole, light, sewage).
- SEVERITY: low, medium, high

INPUT TEXT: {$text}

Return strictly valid JSON:
{
  "is_valid": boolean,
  "rejection_reason": "Brief Tagalog explanation if invalid, else null",
  "category": "category string or null",
  "specific_type": "specific type string or null",
  "severity": "severity string or null",
  "confidence": float (0.0-1.0),
  "coherence_score": float (0.0-1.0),
  "detail_score": float (0.0-1.0),
  "reasoning": "Internal English reasoning"
}

Do not include markdown formatting.
PROMPT;
    }
}
