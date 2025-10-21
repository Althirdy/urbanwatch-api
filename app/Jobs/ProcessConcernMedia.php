<?php

namespace App\Jobs;

use App\Models\Citizen\Concern;
use App\Models\IncidentMedia;
use App\Services\CloudinaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessConcernMedia implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $concernId;
    protected $tempFilePaths;

    public function __construct($concernId, array $tempFilePaths)
    {
        $this->concernId = $concernId;
        $this->tempFilePaths = $tempFilePaths;
    }

    public function handle(CloudinaryService $cloudinaryService)
    {
        try {
            $concern = Concern::find($this->concernId);
            if (!$concern) {
                Log::error('Concern not found for media processing', ['concern_id' => $this->concernId]);
                return;
            }

            foreach ($this->tempFilePaths as $tempFileData) {
                $tempPath = $tempFileData['path'];
                $originalName = $tempFileData['name'];
                $mimeType = $tempFileData['mime'];
                $size = $tempFileData['size'];

                if (Storage::exists($tempPath)) {
                    // Create a temporary file object for Cloudinary upload
                    $realPath = Storage::path($tempPath);
                    
                    // Upload to Cloudinary using file path
                    $uploadResult = $cloudinaryService->uploadFileFromPath($realPath, 'concerns', $originalName);

                    if ($uploadResult) {
                        // Save media record
                        IncidentMedia::create([
                            'concern_id' => $concern->id,
                            'media_type' => 'image',
                            'original_path' => $uploadResult['secure_url'],
                            'public_id' => $uploadResult['public_id'],
                            'original_filename' => $originalName,
                            'file_size' => $size,
                            'mime_type' => $mimeType,
                        ]);

                        Log::info('Media uploaded successfully for concern', [
                            'concern_id' => $concern->id,
                            'filename' => $originalName,
                            'url' => $uploadResult['secure_url']
                        ]);
                    }

                    // Clean up temporary file
                    Storage::delete($tempPath);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error processing concern media', [
                'concern_id' => $this->concernId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}