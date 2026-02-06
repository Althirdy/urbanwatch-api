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

            return $result;

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

            return $result;

        } catch (\Exception $e) {
            Log::error('GeminiService Exception (Category Analysis)', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Analyze image content to verify emergency validity and extract incident details.
     *
     * @param  string  $fileContent  Raw binary content of the image file
     * @param  string  $mimeType  Mime type of the file (e.g., 'image/jpeg')
     * @param  array  $context  Additional context like device location, device name
     * @return array|null Returns array with 'is_valid', 'accident_type', 'severity', 'title', 'description', 'confidence', 'detected_objects', 'reasoning' or null on failure
     */
    public function analyzeImage(string $fileContent, string $mimeType, array $context = [])
    {
        try {
            if (! $this->apiKey) {
                Log::error('Gemini API Key is missing.');

                return null;
            }

            $base64Data = base64_encode($fileContent);

            // Build context string if provided
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

            $prompt = $this->getImageAnalysisSystemPrompt($contextInfo);

            $response = Http::timeout(60)->withHeaders([
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
                    'temperature' => 0.2, // Lower temperature for more consistent/reliable responses
                ],
            ]);

            if ($response->failed()) {
                Log::error('Gemini API Error (Image Analysis)', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $responseData = $response->json();

            // Extract the text from the response
            if (! isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Gemini API: Unexpected response format (Image Analysis)', ['response' => $responseData]);

                return null;
            }

            $jsonString = $responseData['candidates'][0]['content']['parts'][0]['text'];

            // Clean up any markdown code blocks if present
            $jsonString = preg_replace('/^```json\s*|\s*```$/', '', trim($jsonString));

            $result = json_decode($jsonString, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Gemini API: Failed to parse JSON response (Image Analysis)', [
                    'error' => json_last_error_msg(),
                    'raw' => $jsonString,
                ]);

                return null;
            }

            // Log the analysis result
            Log::info('Gemini Image Analysis Complete', [
                'is_valid' => $result['is_valid'] ?? false,
                'accident_type' => $result['accident_type'] ?? null,
                'confidence' => $result['confidence'] ?? null,
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error('GeminiService Exception (Image Analysis)', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
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

        // 1. Prepare Prompt (Heredoc)
        $prompt = <<<'PROMPT'
                    You are an expert document verification AI specialized in Philippine National ID (PhilSys ID).

                    TASK: Analyze the provided image for AUTHENTICITY and DATA EXTRACTION.

                    AUTHENTICITY CHECKS:
                    - Header: "REPUBLIKA NG PILIPINAS" / "Republic of the Philippines"
                    - Title: "PAMBANSANG PAGKAKAKILANLAN"
                    - Security: Holographic gradient background, Ghost image on left, PHL code.
                    - Format: PCN must be 16 digits (XXXX-XXXX-XXXX-XXXX).

                    DATA EXTRACTION:
                    - Extract all visible fields (Name, DOB, Address).
                    - INFER the 4-digit Postal Code based on the City/Barangay.
                    - INFER the value of province based on the City.

                    PHASE 9 (PH 9) DETECTION - IMPORTANT:
                    - Check if the address contains "PH 9", "PH9", "PH. 9", "Phase 9", or "Phase Nine".
                    - Phase 9 (PH 9) is the area code for Barangay 176-E in Caloocan City.
                    - Common address patterns: "Pkg. [Name] PH 9, Caloocan City" or "PH 9 [Street], Caloocan" or similar.
                    - Set isPhase9Resident to true ONLY if the address clearly contains PH 9 or Phase 9.

                    JSON OUTPUT FORMAT (Strictly follow this):
                    {
                        "isAuthentic": boolean,
                        "backSideDetected": boolean,
                        "imageQualityIssue": boolean,
                        "confidence": number (0-100),
                        "reasoning": "string",
                        "isPhase9Resident": boolean,
                        "data": {
                            "pcnNumber": "string" or null,
                            "lastName": "string" or null,
                            "firstName": "string" or null,
                            "suffix": "string" or null,  
                            "middleName": "string" or null,
                            "dateOfBirth": "MM/DD/YYYY" or null,
                            "address": "string" or null,
                            "barangay": "string" or null,
                            "city": "string" or null,
                            "province": "string" or null,
                            "region": "string" or null,
                            "postalCode": "string" or null
                        }
                    }
                PROMPT;

        try {
            // 2. Send Request
            $response = Http::timeout(45) // 45s timeout usually sufficient for Flash
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
                        'response_mime_type' => 'application/json', // Forces JSON response
                        'temperature' => 0.2,
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

            // Check location restriction if system setting is enabled
            $restrictToBarangay = \App\Models\SystemSetting::get('restrict_registration_to_brgy_176', 'false') === 'true';
            $result['isOutsideAllowedArea'] = false;
            $result['locationRestrictionReason'] = null;

            if ($restrictToBarangay && $result['isAuthentic']) {
                $isPhase9Resident = $result['isPhase9Resident'] ?? false;
                $address = $result['data']['address'] ?? null;
                
                // Check using Gemini's detection or fallback to pattern matching
                $isWithinAllowedArea = $isPhase9Resident;
                
                // Fallback: Check address for PH 9, PH9, Phase 9 patterns
                if (!$isWithinAllowedArea && $address) {
                    $addressUpper = strtoupper($address);
                    // Match patterns: PH 9, PH9, PH. 9, PHASE 9, PHASE9
                    if (preg_match('/\bPH\.?\s*9\b|\bPHASE\s*9\b/i', $addressUpper)) {
                        $isWithinAllowedArea = true;
                    }
                }
                
                if (!$isWithinAllowedArea) {
                    $result['isOutsideAllowedArea'] = true;
                    $result['locationRestrictionReason'] = 'Registration is only available to Phase 9 (PH 9) residents. Your address is not in Phase 9.';

                    Log::info('National ID validation: Outside allowed area (not PH 9)', [
                        'address' => $address,
                        'isPhase9Resident' => $isPhase9Resident,
                        'restriction_enabled' => $restrictToBarangay,
                    ]);
                }
            }

            return $result;

        } catch (\Throwable $e) {
            Log::error('Gemini Service Exception', ['error' => $e->getMessage()]);
            // Re-throw or return a safe fallback depending on your preference
            throw $e;
        }
    }

    /**
     * Compare two concern descriptions/transcripts to see if they refer to the same incident.
     */
    public function compareConcerns(string $text1, string $text2): bool
    {
        try {
            if (! $this->apiKey) {
                return true; // Default to old behavior (merge) if AI is unavailable to prevent spam
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

                return true;
            }

            $responseData = $response->json();
            $jsonString = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $jsonString = preg_replace('/^```json\s*|\s*```$/', '', trim($jsonString));
            $result = json_decode($jsonString, true);

            return (bool) ($result['is_same_incident'] ?? true);

        } catch (\Exception $e) {
            Log::error('Gemini Comparison Exception', ['error' => $e->getMessage()]);

            return true;
        }
    }

    /**
     * Get the system prompt for YOLO/CCTV image analysis (Diorama and Real-World Detection).
     *
     * Uses Natural Taglish (conversational, avoiding deep Tagalog) for Barangay admin readability.
     * Supports thesis diorama simulation mode with explicit class mapping: Collision, Flood, Fir.
     */
    private function getImageAnalysisSystemPrompt(string $contextInfo = ''): string
    {
        return <<<PROMPT
You are the UrbanWatch Emergency Detection AI. You analyze CCTV footage and flag emergencies.

MODE: DEMO/SIMULATION (Thesis Diorama Mode Enabled)
- Treat toy vehicles, scale models, and diorama scenes AS REAL emergencies.
- Ignore that they are toys or paper. Focus on the SCENARIO depicted.

YOLO CLASS MAPPING (from dataset):
- 'Collision' or car crash/vehicle accident → accident_type: 'Accident'
- 'Flood' or water on roads/areas → accident_type: 'Flood'
- 'Fir' or flames/smoke → accident_type: 'Fire'

VALID EMERGENCIES (is_valid: true):
- Fire: Flames, large smoke, burning structures/vehicles (real or diorama).
- Flood: Water covering roads/areas significantly (real or diorama).
- Accident: Vehicle collisions, debris on road (real or toy cars).

FALSE ALARMS (is_valid: false):
- Trivial fire: Lighters, candles, stove burners (unless out of control).
- Trivial water: Wet floors, small spills, indoor puddles.
- Normal traffic, empty roads, blurry/unclear images.

OUTPUT (JSON):

If VALID (is_valid: true):
{
  "is_valid": true,
  "accident_type": "Fire" | "Flood" | "Accident",
  "severity": "Low" | "Medium" | "High",
  "title": "SYSTEM ALERT: [Type in Natural Taglish, 5-8 words]",
  "description": "SYSTEM ALERT: [Type] IDENTIFIED. [Natural Taglish description for Barangay admin, e.g., 'May na-detect na collision sa intersection area. Based sa camera analysis, medyo malakas ang impact. Paki-deploy po ng responders asap.']",
  "confidence": 60-100,
  "detected_objects": ["car", "toy_car", "smoke", ...],
  "reasoning": "English internal reasoning for logs."
}

If DIORAMA/SIMULATION (still valid, add prefix):
- title: "DEMO: SYSTEM ALERT: [Type]"
- description: "DEMO: SYSTEM ALERT: [Type] IDENTIFIED (Simulation). ..."

If FALSE ALARM (is_valid: false):
{
  "is_valid": false,
  "accident_type": null,
  "severity": null,
  "title": null,
  "description": null,
  "confidence": null,
  "detected_objects": null,
  "reasoning": "Explanation why it's a false alarm."
}

{$contextInfo}

Return ONLY valid JSON. Do not include markdown formatting.
PROMPT;
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
