<?php

namespace App\Http\Controllers\Api\Citizen;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Citizen\ConcernRequest;
use App\Services\CloudinaryService;
use App\Models\Citizen\Concern;
use App\Models\IncidentMedia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConcernController extends BaseApiController
{
    protected CloudinaryService $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    public function voiceConcern() {}

    public function manualConcern(ConcernRequest $request)
    {
        $validated = $request->validated();

        // ✅ Validate first (you can temporarily comment out unnecessary fields in ConcernRequest if you want)
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // Create the concern record
            $concern = Concern::create([
                'type' => 'manual',
                'citizen_id' => $validated['citizen_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'status' => 'pending',
                'category' => $validated['category'],
                'transcript_text' => $validated['transcript_text'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
            ]);

            $uploadedMedia = [];
            if ($request->hasFile('files')) {
                $files = $request->file('files');


                // ✅ Upload to Cloudinary using your service
                $uploadResults = $this->cloudinaryService->uploadMultipleFiles($files, 'concern');

                foreach ($uploadResults['successful'] as $upload) {
                    $media = IncidentMedia::create([
                        'concern_id' => $concern->id,
                        'media_type' => 'image', // Assuming all uploads are images for now
                        'original_path' => $upload['secure_url'] ?? null,
                        'blurred_path' => null, // You can implement blurring if needed
                        'public_id' => $upload['public_id'] ?? null,
                        'original_filename' => $upload['original_filename'] ?? null,
                        'file_size' => $upload['file_size'] ?? null,
                        'mime_type' => $upload['mime_type'] ?? null,
                    ]);
                    $uploadedMedia[] = $media['original_path'];
                }
            }
            DB::commit();

            return $this->sendResponse([
                'concern' => [
                    'id' => $concern->id,
                    'title' => $concern->title,
                    'description' => $concern->description,
                    'category' => $concern->category,
                    'status' => $concern->status,
                    'created_at' => $concern->created_at,
                    'images' => $uploadedMedia,
                ],

            ], 'Concern submitted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating concern', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError('An error occurred while submitting concern: ' . $e->getMessage());
        }
    }
}
