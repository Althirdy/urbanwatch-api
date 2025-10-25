<?php

namespace App\Http\Controllers\Api\Citizen\Concern;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Citizen\ConcernRequest;
use App\Models\Citizen\Concern;
use App\Models\IncidentMedia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Services\FileUploadService;


class ManualConcernController extends BaseApiController
{

    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $concerns = Concern::where('type', 'manual')
                ->with([
                    'media' => function ($query) {
                        $query->where('source_category', 'citizen_concern');
                    }
                ])
                ->orderBy('created_at', 'asc')
                ->get();

            $formattedConcerns = $concerns->map(function ($concern) {
                return [
                    'id' => $concern->id,
                    'title' => $concern->title,
                    'description' => $concern->description,
                    'category' => $concern->category,
                    'latitude' => $concern->latitude,
                    'longitude' => $concern->longitude,
                    'status' => $concern->status,
                    'created_at' => $concern->created_at,
                    'images' => $concern->media->pluck('original_path')->toArray()
                ];
            });

            return $this->sendResponse([
                'concerns' => $formattedConcerns
            ], 'Manual concerns retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving manual concerns', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError('An error occurred while retrieving concerns: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ConcernRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            // 🟢 Step 1: Create the Concern record
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

            // 🟡 Step 2: Handle file uploads
            if ($request->hasFile('files')) {
                $files = $request->file('files');
                $isMultiple = is_array($files);

                // Upload (single or multiple)
                $uploadResults = $isMultiple
                    ? $this->fileUploadService->uploadMultiple($files, 'concerns')
                    : ['successful' => [$this->fileUploadService->uploadSingle($files, 'concerns')]];

                // 🟣 Step 3: Save uploaded files in the database
                foreach ($uploadResults['successful'] as $upload) {
                    $media = IncidentMedia::create([
                        'source_type' => \App\Models\Citizen\Concern::class,
                        'source_id' => $concern->id,
                        'source_category' => 'citizen_concern',
                        'media_type' => 'image', // you can later detect type dynamically
                        'original_path' => $upload['public_url'] ?? null,
                        'blurred_path' => null,
                        'public_id' => $upload['storage_path'] ?? null,
                        'original_filename' => $upload['original_filename'] ?? null,
                        'file_size' => $upload['file_size'] ?? null,
                        'mime_type' => $upload['mime_type'] ?? null,
                        'captured_at' => now(),
                    ]);

                    $uploadedMedia[] = $media->original_path;
                }
            }

            DB::commit();

            // 🟢 Step 4: Return successful response
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

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $concern = Concern::where('type', 'manual')
                ->where('id', $id)
                ->with([
                    'media' => function ($query) {
                        $query->where('source_category', 'citizen_concern');
                    }
                ])
                ->first();

            if (!$concern) {
                return $this->sendError('Manual concern not found', [], 404);
            }

            $formattedConcern = [
                'id' => $concern->id,
                'title' => $concern->title,
                'description' => $concern->description,
                'category' => $concern->category,
                'status' => $concern->status,
                'latitude' => $concern->latitude,
                'longitude' => $concern->longitude,
                'created_at' => $concern->created_at,
                'images' => $concern->media->pluck('original_path')->toArray()
            ];

            return $this->sendResponse([
                'concern' => $formattedConcern
            ], 'Manual concern retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving manual concern', [
                'error' => $e->getMessage(),
                'concern_id' => $id,
            ]);

            return $this->sendError('An error occurred while retrieving concern: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
