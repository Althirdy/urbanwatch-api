<?php

namespace App\Jobs;

use App\Events\ConcernAICategoryUpdated;
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

            Log::info('ProcessManualConcernJob: Concern found', [
                'concern_id' => $concern->id,
                'title' => $concern->title,
                'description' => substr($concern->description, 0, 100),
            ]);

            // Combine title and description for analysis
            $textToAnalyze = trim($concern->title.' '.$concern->description);

            if (! empty($textToAnalyze)) {
                // Analyze category and severity
                Log::info('ProcessManualConcernJob: Calling Gemini API', [
                    'concern_id' => $concern->id,
                    'text_length' => strlen($textToAnalyze),
                ]);

                $categoryAnalysis = $geminiService->analyzeConcernCategoryAndSeverity($textToAnalyze);

                Log::info('ProcessManualConcernJob: Gemini API response received', [
                    'concern_id' => $concern->id,
                    'analysis' => $categoryAnalysis,
                ]);

                if ($categoryAnalysis) {
                    $updateData = [
                        'ai_category' => $categoryAnalysis['category'] ?? null,
                        'ai_severity' => $categoryAnalysis['severity'] ?? null,
                        'ai_confidence' => $categoryAnalysis['confidence'] ?? null,
                        'ai_processed_at' => now(),
                    ];

                    // If confidence is high enough, update the main category and severity
                    $confidenceThreshold = 0.7;
                    if (isset($categoryAnalysis['confidence']) && $categoryAnalysis['confidence'] >= $confidenceThreshold) {
                        $updateData['category'] = $categoryAnalysis['category'];
                        $updateData['severity'] = $categoryAnalysis['severity'];
                    }

                    $concern->update($updateData);

                    // Refresh the model to get the latest data
                    $concern->refresh();

                    // Fire AI Category Updated Event
                    // $concern->load('distribution'); // Distribution not created yet

                    Log::info('ProcessManualConcernJob: Firing ConcernAICategoryUpdated event', [
                        'concern_id' => $concern->id,
                        'citizen_id' => $concern->citizen_id,
                    ]);

                    event(new ConcernAICategoryUpdated($concern));
                }
            }

        } catch (\Exception $e) {
            Log::error('ProcessManualConcernJob: Error processing manual concern', [
                'concern_id' => $this->concernId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        } finally {
            // Finalize the concern (Deduplication -> Assignment -> Notification)
            Log::info('ProcessManualConcernJob: Finalizing concern', ['concern_id' => $this->concernId]);
            $concernService->finalizeConcern($this->concernId);
        }
    }
}
