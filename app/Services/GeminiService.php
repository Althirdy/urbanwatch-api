<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected $apiKey;

    protected $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

    protected $audioModel = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }

    /**
     * Transcribe and analyze audio content with category and severity detection.
     *
     * @param  string  $fileContent  Raw binary content of the file
     * @param  string  $mimeType  Mime type of the file (e.g., 'audio/mp3')
     * @return array|null Returns array with 'transcription_text', 'title', 'description', 'category', 'severity', 'confidence', 'is_valid', 'rejection_reason' or null on failure
     */
    public function analyzeAudio(string $fileContent, string $mimeType)
    {
        try {
            if (! $this->apiKey) {
                Log::error('Gemini API Key is missing.');

                return null;
            }

            $base64Data = base64_encode($fileContent);

            $prompt = 'Transcribe the following audio recording of a citizen concern (likely in Filipino or Taglish). '.
                      'Provide the transcription text verbatim. '.
                      'Generate a concise 3-5 word title in Tagalog (Filipino). '.
                      'Generate a brief 1-sentence summary description in Tagalog (Filipino). '.
                      "\n\n".
                      'Also analyze the concern for VALIDITY and CLASSIFICATION:'."\n".
                      '- is_valid: true if it describes a real community issue.'."\n".
                      '- rejection_reason: Brief Tagalog explanation if invalid, else null.'."\n".
                      '- CATEGORIES: safety, security, infrastructure, environment, noise, other'."\n".
                      '- SPECIFIC TYPE: One-word lowercase tag identifying the exact issue (e.g., fire, collision, theft, flood, assault, noise, garbage).'."\n".
                      '- SEVERITY LEVELS: low, medium, high'."\n".
                      "\n".
                      'EXAMPLES:'."\n".
                      '- "May sunog" → category: safety, specific_type: fire, severity: high, is_valid: true'."\n".
                      '- "Maraming basura" → category: environment, specific_type: garbage, severity: medium, is_valid: true'."\n".
                      "\n".
                      "Return strictly valid JSON with keys: 'transcription_text', 'title', 'description', 'category', 'specific_type', 'severity', 'confidence', 'is_valid', 'rejection_reason'. ".
                      'Do not include markdown formatting.';

            $response = Http::timeout(30)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->audioModel}?key={$this->apiKey}", [
                'contents' => [
                    [
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
                    ],
                ],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                ],
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $responseData = $response->json();

            // Extract the text from the response
            if (! isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Gemini API: Unexpected response format', ['response' => $responseData]);

                return null;
            }

            $jsonString = $responseData['candidates'][0]['content']['parts'][0]['text'];

            // Clean up any markdown code blocks if present (just in case)
            $jsonString = preg_replace('/^```json\s*|\s*```$/', '', $jsonString);

            $result = json_decode($jsonString, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Gemini API: Failed to parse JSON response', [
                    'error' => json_last_error_msg(),
                    'raw' => $jsonString,
                ]);

                return null;
            }

            return $this->normalizeConcernAiResult($result);

        } catch (\Exception $e) {
            Log::error('GeminiService Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
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

            $prompt = $this->getImageAnalysisSystemPrompt(
                $contextInfo,
                $detectedClasses,
                (bool) config('yolo.demo_mode_enabled', false)
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

            return $this->normalizeYoloImageResult($result, $detectedClasses);
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

    /**
     * Get the system prompt for YOLO/CCTV image analysis (Diorama and Real-World Detection).
     *
     * Uses Natural Taglish (conversational, avoiding deep Tagalog) for Barangay admin readability.
     * Supports thesis diorama simulation mode with explicit class mapping: Collision, Flood, Fir.
     */
    private function getImageAnalysisSystemPrompt(string $contextInfo = '', array $detectedClasses = [], bool $demoMode = false): string
    {
        $detectedClassesText = empty($detectedClasses)
            ? 'No explicit YOLO classes provided. Infer likely emergency classes.'
            : 'YOLO detected classes: '.implode(', ', $detectedClasses);
        $mode = $demoMode
            ? "MODE: DEMO/SIMULATION\n- Treat toy vehicles and diorama scenes as real emergency simulation."
            : "MODE: REAL-WORLD\n- Do not treat toy/diorama props as real emergencies.";

        return <<<PROMPT
You are the UrbanWatch Emergency Detection AI. You analyze CCTV footage and flag emergencies.

{$mode}

CLASS MAPPING:
- CarCollision/Collision -> Accident
- Flood -> Flood
- Fire/Fir -> Fire

{$detectedClassesText}

Return JSON:
{
  "overall_valid": boolean,
  "reasoning": "Overall explanation",
  "class_verdicts": [
    {
      "source_class": "CarCollision|Flood|Fire",
      "normalized_class": "Accident|Flood|Fire",
      "is_legit": boolean,
      "accident_type": "Accident|Flood|Fire|null",
      "severity": "Low|Medium|High|null",
      "title": "short title|null",
      "description": "short description|null",
      "confidence": 0-100|null,
      "detected_objects": ["..."],
      "reasoning": "class level reasoning"
    }
  ]
}

{$contextInfo}

Return ONLY valid JSON. Do not include markdown formatting.
PROMPT;
    }

    private function normalizeYoloImageResult(array $result, array $detectedClasses = []): array
    {
        if (isset($result['is_valid'])) {
            $legacyAccidentType = $result['accident_type'] ?? null;
            $result['class_verdicts'] = [[
                'source_class' => $legacyAccidentType,
                'normalized_class' => $legacyAccidentType,
                'is_legit' => (bool) ($result['is_valid'] ?? false),
                'accident_type' => $legacyAccidentType,
                'severity' => $result['severity'] ?? null,
                'title' => $result['title'] ?? null,
                'description' => $result['description'] ?? null,
                'confidence' => $result['confidence'] ?? null,
                'detected_objects' => $result['detected_objects'] ?? [],
                'reasoning' => $result['reasoning'] ?? null,
            ]];
            $result['overall_valid'] = (bool) ($result['is_valid'] ?? false);
        }

        $verdicts = collect($result['class_verdicts'] ?? [])->map(function ($item) {
            $normalizedClass = $item['normalized_class'] ?? $item['accident_type'] ?? null;
            $accidentType = $item['accident_type'] ?? $normalizedClass;
            if ($accidentType === 'CarCollision') {
                $accidentType = 'Accident';
            }

            return [
                'source_class' => $item['source_class'] ?? $normalizedClass,
                'normalized_class' => $normalizedClass,
                'is_legit' => (bool) ($item['is_legit'] ?? false),
                'accident_type' => $accidentType,
                'severity' => $item['severity'] ?? null,
                'title' => $item['title'] ?? null,
                'description' => $item['description'] ?? null,
                'confidence' => isset($item['confidence']) ? (float) $item['confidence'] : null,
                'detected_objects' => $item['detected_objects'] ?? [],
                'reasoning' => $item['reasoning'] ?? null,
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

        return [
            'overall_valid' => (bool) ($result['overall_valid'] ?? collect($verdicts)->contains(fn ($v) => $v['is_legit'])),
            'reasoning' => $result['reasoning'] ?? null,
            'class_verdicts' => $verdicts,
            'raw' => $result,
        ];
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
