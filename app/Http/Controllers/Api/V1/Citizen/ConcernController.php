<?php

namespace App\Http\Controllers\Api\V1\Citizen;

use App\Exceptions\UrbanWatchException;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Citizen\StoreConcernRequest;
use App\Http\Requests\Api\V1\Citizen\UpdateConcernRequest;
use App\Http\Resources\Api\V1\ConcernResource;
use App\Services\ConcernService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ConcernController extends BaseApiController
{
    protected $concernService;

    public function __construct(ConcernService $concernService)
    {
        $this->concernService = $concernService;
    }

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 4);

        // Build filters array from request
        $filters = $this->extractFilters($request);

        $concerns = $this->concernService->getUserConcerns(auth()->id(), $perPage, $filters);
        $concernsCount = $this->concernService->getConcernsCount(auth()->id(), $filters);

        return $this->sendResponse([
            'concerns' => ConcernResource::collection($concerns),
            'concerns_count' => $concernsCount,
            // Manually extract the cursor string
            'next_cursor' => $concerns->nextCursor()?->encode(),
            'prev_cursor' => $concerns->previousCursor()?->encode(),
        ], 'Concerns retrieved successfully', status: 201);
    }

    public function archived(Request $request)
    {
        $perPage = $request->input('per_page', 4);
        $filters = $this->extractFilters($request);

        $concerns = $this->concernService->getUserArchivedConcerns(auth()->id(), $perPage, $filters);
        $concernsCount = $this->concernService->getArchivedConcernsCount(auth()->id(), $filters);

        return $this->sendResponse([
            'concerns' => ConcernResource::collection($concerns),
            'concerns_count' => $concernsCount,
            'next_cursor' => $concerns->nextCursor()?->encode(),
            'prev_cursor' => $concerns->previousCursor()?->encode(),
        ], 'Archived concerns retrieved successfully', status: 200);
    }

    private function extractFilters(Request $request): array
    {
        $filters = [];
        foreach (['status', 'category', 'severity', 'date_from', 'date_to'] as $field) {
            if ($request->filled($field)) {
                $filters[$field] = $request->input($field);
            }
        }

        return $filters;
    }

    public function store(StoreConcernRequest $request)
    {
        $validated = $request->validated();

        try {
            // Determine file input (files or images fallback)
            $files = $request->file('files') ?? $request->file('images');

            $concern = $this->concernService->createConcern($validated, auth()->id(), $files);

            return $this->sendResponse([
                'concern' => new ConcernResource($concern),
            ], 'Concern submitted successfully!', 201);
        } catch (UrbanWatchException $e) {
            throw $e;
        } catch (\Exception $e) {
            $errorRef = 'concern-submit-'.now()->timestamp;
            Log::error('Error creating concern', [
                'reference' => $errorRef,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError("Unable to submit concern right now. Please try again. Reference: {$errorRef}", status: 500);
        }
    }

    public function show(string $id)
    {

        $concern = $this->concernService->getConcernDetails($id, auth()->id());

        return $this->sendResponse([
            'concern' => new ConcernResource($concern),
        ], 'Concern details retrieved successfully');
    }

    public function update(UpdateConcernRequest $request, string $id)
    {
        $concern = $this->concernService->updateConcern($id, auth()->id(), $request->validated());

        return $this->sendResponse([
            'concern' => new ConcernResource($concern),
        ], 'Concern updated successfully');
    }

    public function destroy(string $id)
    {
        $this->concernService->deleteConcern($id, auth()->id());

        return $this->sendResponse([
            'concern_id' => $id,
        ], 'Concern deleted successfully', 200);
    }

    /**
     * Citizen confirms or disputes a resolution marked by Purok Leader.
     * POST /api/v1/concerns/{id}/confirm-resolution
     */
    public function confirmResolution(Request $request, string $id)
    {
        $request->validate([
            'confirmed' => 'required|boolean',
            'reason' => 'nullable|required_if:confirmed,false|string|max:1000',
        ], [
            'confirmed.required' => 'Confirmation status is required.',
            'confirmed.boolean' => 'Confirmation must be true or false.',
            'reason.required_if' => 'A reason is required when disputing the resolution.',
            'reason.max' => 'Reason must not exceed 1000 characters.',
        ]);

        try {
            $concern = $this->concernService->confirmResolution(
                (int) $id,
                auth()->id(),
                (bool) $request->confirmed,
                $request->reason
            );

            $statusLabel = $request->confirmed ? 'confirmed' : 'disputed';

            return $this->sendResponse([
                'concern' => new ConcernResource($concern),
            ], "Resolution {$statusLabel} successfully.");
        } catch (UrbanWatchException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error during resolution confirmation', [
                'concern_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return $this->sendError('Unable to process your confirmation. Please try again.', status: 500);
        }
    }
}
