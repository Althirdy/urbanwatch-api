<?php

namespace App\Jobs;

use App\Services\YoloAccidentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessYoloSnapshotJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var array
     */
    public $backoff = [30, 60, 120];

    /**
     * Job properties using camelCase.
     */
    protected string $tempPath;

    protected int $deviceId;

    protected ?string $detectedAt;

    protected string $originalFilename;

    protected string $mimeType;

    protected int $fileSize;

    protected array $detectedClasses;

    /**
     * Create a new job instance.
     */
    public function __construct(
        string $tempPath,
        int $deviceId,
        ?string $detectedAt,
        string $originalFilename,
        string $mimeType,
        int $fileSize,
        array $detectedClasses = []
    ) {
        $this->tempPath = $tempPath;
        $this->deviceId = $deviceId;
        $this->detectedAt = $detectedAt;
        $this->originalFilename = $originalFilename;
        $this->mimeType = $mimeType;
        $this->fileSize = $fileSize;
        $this->detectedClasses = $detectedClasses;
    }

    /**
     * Execute the job.
     */
    public function handle(YoloAccidentService $yoloService): void
    {
        Log::info('ProcessYoloSnapshotJob: Starting async processing', [
            'deviceId' => $this->deviceId,
            'tempPath' => $this->tempPath,
        ]);

        try {
            // Check if file still exists
            if (! Storage::disk('local')->exists($this->tempPath)) {
                Log::error('ProcessYoloSnapshotJob: Temp file not found', [
                    'tempPath' => $this->tempPath,
                ]);
                throw new \Exception("Temporary file not found: {$this->tempPath}");
            }

            // Process the detection using the service
            $result = $yoloService->processDetectionFromPath(
                $this->tempPath,
                $this->deviceId,
                $this->detectedAt,
                $this->originalFilename,
                $this->mimeType,
                $this->fileSize,
                $this->detectedClasses
            );

            Log::info('ProcessYoloSnapshotJob: Processing complete', [
                'deviceId' => $this->deviceId,
                'isNew' => $result['isNew'] ?? null,
                'falseAlarm' => $result['falseAlarm'] ?? false,
            ]);

        } catch (\Exception $e) {
            Log::error('ProcessYoloSnapshotJob: Processing failed', [
                'deviceId' => $this->deviceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        } finally {
            // Always cleanup temp file
            $this->cleanupTempFile();
        }
    }

    /**
     * Cleanup the temporary file after processing.
     */
    protected function cleanupTempFile(): void
    {
        try {
            if (Storage::disk('local')->exists($this->tempPath)) {
                Storage::disk('local')->delete($this->tempPath);
                Log::info('ProcessYoloSnapshotJob: Temp file cleaned up', [
                    'tempPath' => $this->tempPath,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('ProcessYoloSnapshotJob: Failed to cleanup temp file', [
                'tempPath' => $this->tempPath,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('ProcessYoloSnapshotJob: Job failed permanently', [
            'deviceId' => $this->deviceId,
            'tempPath' => $this->tempPath,
            'error' => $exception->getMessage(),
        ]);

        // Cleanup temp file even on failure
        $this->cleanupTempFile();
    }
}
