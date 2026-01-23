<?php

namespace App\Jobs;

use App\Models\Citizen\Concern;
use App\Services\GeminiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessManualConcernJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $concernId;

    /**
     * Create a new job instance.
     */
    public function __construct($concernId)
    {
        $this->concernId = $concernId;
    }

    /**
     * Execute the job.
     */
    public function handle(GeminiService $geminiService, \App\Services\ConcernService $concernService)
    {
        try {
            Log::info('ProcessManualConcernJob: Starting job', ['concern_id' => $this->concernId]);

            $concern = Concern::find($this->concernId);

            if (! $concern) {
                Log::error('ProcessManualConcernJob: Concern not found', ['concern_id' => $this->concernId]);

                return;
            }

            // Combine title and description for analysis
            $textToAnalyze = trim($concern->title.' '.$concern->description);

            if (! empty($textToAnalyze)) {
                Log::info('ProcessManualConcernJob: Calling Gemini for Validation & Classification', [
                    'concern_id' => $concern->id,
                ]);

                $analysis = $geminiService->validateAndClassify($textToAnalyze);

                Log::info('ProcessManualConcernJob: AI Result', [
                    'concern_id' => $concern->id,
                    'is_valid' => $analysis['is_valid'] ?? 'unknown',
                ]);

                if ($analysis) {
                    if ($analysis['is_valid'] === true) {
                        $concernService->markAsValid($concern->id, $analysis);
                    } else {
                        $reason = $analysis['rejection_reason'] ?? 'Ang iyong ulat ay tinukoy bilang spam o hindi wasto ng aming system.';
                        $concernService->markAsInvalid($concern->id, $reason, $analysis);
                    }
                } else {
                    // Fallback: If AI fails, default to valid for manual review
                    Log::warning('ProcessManualConcernJob: AI failed. Defaulting to valid.', ['concern_id' => $concern->id]);
                    $concernService->markAsValid($concern->id, [
                        'category' => $concern->category,
                        'severity' => $concern->severity,
                        'confidence' => 0,
                    ]);
                }
            }

        } catch (\Exception $e) {
            Log::error('ProcessManualConcernJob: Error', [
                'concern_id' => $this->concernId,
                'error' => $e->getMessage(),
            ]);
            // Fallback: Mark as valid if job crashes to avoid lost reports
            $concernService->markAsValid($this->concernId, []);
        }
    }
}
