<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected $apiKey;

    protected $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-001:generateContent';

    protected $audioModel = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }

    /**
     * Transcribe and analyze audio content with category and severity detection.
     *
     * @param  string  $fileContent  Raw binary content of the file
     * @param  string  $mimeType  Mime type of the file (e.g., 'audio/mp3')
     * @return array|null Returns array with 'transcription_text', 'title', 'description', 'category', 'severity', 'confidence' or null on failure
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
                      'Also analyze the concern to determine the category and severity:'."\n".
                      'CATEGORIES: safety, security, infrastructure, environment, noise, other'."\n".
                      'SEVERITY LEVELS: low, medium, high'."\n".
                      "\n".
                      'EXAMPLES:'."\n".
                      '- "May sunog" → category: safety, severity: high'."\n".
                      '- "Maraming basura" → category: environment, severity: medium'."\n".
                      '- "Sira ang daan" → category: infrastructure, severity: medium'."\n".
                      '- "Malakas ang ingay" → category: noise, severity: low'."\n".
                      "\n".
                      "Return strictly valid JSON with keys: 'transcription_text', 'title', 'description', 'category', 'severity', 'confidence'. ".
                      'Do not include markdown formatting (like ```json) in the response.';

            $response = Http::withHeaders([
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
                      'SEVERITY LEVELS (choose one):'."\n".
                      '- high: Immediate danger, emergency, requires urgent action'."\n".
                      '- medium: Significant issue, needs attention soon'."\n".
                      '- low: Minor issue, can be addressed in normal schedule'."\n".
                      "\n".
                      'EXAMPLES:'."\n".
                      '- "May sunog sa bahay" → category: safety, severity: high'."\n".
                      '- "Maraming basura sa kalsada" → category: environment, severity: medium'."\n".
                      '- "Sira ang kalsada" → category: infrastructure, severity: medium'."\n".
                      '- "Napakalakas ng ingay ng kapitbahay" → category: noise, severity: low'."\n".
                      '- "May nakawan sa amin" → category: security, severity: high'."\n".
                      "\n".
                      'Concern Text: '.$text."\n\n".
                      'Return strictly valid JSON with keys: '.
                      '"category" (one of: safety, security, infrastructure, environment, noise, other), '.
                      '"severity" (one of: low, medium, high), '.
                      '"confidence" (decimal 0.0 to 1.0 indicating how confident you are), '.
                      '"reasoning" (brief explanation in English). '.
                      'Do not include markdown formatting.';

            $response = Http::withHeaders([
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

            $prompt = "You are an emergency detection AI system currently operating in DEMO/SIMULATION MODE. Your job is to analyze CCTV footage and flag emergencies for the UrbanWatch system.\n\n".
                       "CRITICAL DEMO RULES:\n".
                       "1. ENABLE SIMULATION RECOGNITION: The image is a **SIMULATION** (diorama, printed photo, or screen capture) for a thesis project. You MUST treat scale models, toy vehicles, or printed photos of accidents as REAL events. Ignore that they are toys or paper. Analyze the *scenario* depicted.\n".
                       "2. ALWAYS PREPEND 'DEMO:': Start the description with 'DEMO:' to indicate this is a simulation analysis.\n".
                       "3. LOWER THRESHOLD: Be sensitive. If it looks like an accident/fire/flood (even if simulated), mark it as VALID (is_valid: true).\n".
                       "4. LANGUAGE: Use conversational Tagalog (Taglish). Use terms like 'Accident', 'Fire', 'Flood' mixed with Tagalog sentences.\n\n".

                       "VALID EMERGENCIES (is_valid: true):\n".
                       "- Fire: Flames consuming a structure/vehicle (real or diorama), large smoke.\n".
                       "- Flood: Water covering roads/areas (real or diorama).\n".
                       "- Accident: Vehicle collisions (real or toy cars), debris.\n\n".

                       "FALSE ALARMS (is_valid: false):\n".
                       "- TRIVIAL FIRE: Lighters, matchsticks, candles, stove burners (unless out of control).\n".
                       "- TRIVIAL WATER: Wet floors, small spills, puddles indoors.\n".
                       "- Normal traffic, empty roads, blurry images.\n\n".

                       "OUTPUT FORMAT (JSON):\n".
                       "If VALID EMERGENCY (is_valid: true):\n".
                       "1. accident_type: 'Fire', 'Flood', or 'Accident'\n".
                       "2. severity: 'Low', 'Medium', or 'High'\n".
                       "3. title: 5-8 words in Tagalog. Example: 'DEMO: May banggaan ng sasakyan sa kalsada'\n".
                       "4. description: Start with 'DEMO: Paki-check ang picture na ito mula sa CCTV. Sa tingin ko may [Incident]...' followed by details in Tagalog.\n".
                       "   Example: 'DEMO: Paki-check ang picture na ito mula sa CCTV. Sa tingin ko may car accident. Dalawang sasakyan ang nagbanggaan sa gitna ng daan.'\n".
                       "5. confidence: 60-100\n".
                       "6. detected_objects: ['car', 'toy_car', ...]\n".
                       "7. reasoning: English explanation (e.g., 'Simulation detected: Toy cars colliding').\n\n".

                       "If FALSE ALARM (is_valid: false):\n".
                       "1. is_valid: false\n".
                       "2. Set others to null except reasoning.\n\n".

                       $contextInfo."\n".

                       "Return ONLY valid JSON with keys: is_valid, accident_type, severity, title, description, confidence, detected_objects, reasoning.\n".
                       'Do not include markdown formatting.';

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
     * Analyze Philippine National ID image for authenticity verification and data extraction.
     *
     * @param  string  $fileContent  Raw binary content of the image file
     * @param  string  $mimeType  Mime type of the file (e.g., 'image/jpeg')
     * @return array Returns array with 'is_authentic', 'data' containing extracted fields, or throws exception on API failure
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

                    JSON OUTPUT FORMAT (Strictly follow this):
                    {
                        "isAuthentic": boolean,
                        "backSideDetected": boolean,
                        "imageQualityIssue": boolean,
                        "confidence": number (0-100),
                        "reasoning": "string",
                        "data": {
                            "pcnNumber": "string" or null,
                            "lastName": "string" or null,
                            "firstName": "string" or null,
                            "suffix": string" or null,  
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

            return $result;

        } catch (\Throwable $e) {
            Log::error('Gemini Service Exception', ['error' => $e->getMessage()]);
            // Re-throw or return a safe fallback depending on your preference
            throw $e;
        }
    }
}
