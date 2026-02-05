<?php

namespace App\Http\Controllers\Api\V1\Operator;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Operator\StoreContactRequest;
use App\Http\Requests\Api\V1\Operator\UpdateContactRequest;
use App\Http\Resources\Api\V1\ContactResource;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ContactController extends BaseApiController
{
    /**
     * Display a listing of the contacts.
     */
    public function index(Request $request)
    {
        try {
            $query = Contact::query();

            // Search functionality
            if ($request->filled('search')) {
                $query->search($request->search);
            }

            // Filter by responder type
            if ($request->filled('responder_type')) {
                $query->byResponderType($request->responder_type);
            }

            // Filter by status
            if ($request->filled('active')) {
                $isActive = filter_var($request->active, FILTER_VALIDATE_BOOLEAN);
                $query->where('active', $isActive);
            }

            $contacts = $query->latest()->paginate(10);

            return $this->sendResponse([
                'contacts' => ContactResource::collection($contacts),
                'meta' => [
                    'current_page' => $contacts->currentPage(),
                    'last_page' => $contacts->lastPage(),
                    'per_page' => $contacts->perPage(),
                    'total' => $contacts->total(),
                ],
            ], 'Contacts retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving contacts', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError('An error occurred while retrieving contacts: '.$e->getMessage());
        }
    }

    /**
     * Store a newly created contact in storage.
     */
    public function store(StoreContactRequest $request)
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            $contact = Contact::create($validated);

            DB::commit();

            return $this->sendResponse([
                'contact' => new ContactResource($contact),
            ], 'Contact created successfully!', 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creating contact', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError('An error occurred while creating the contact: '.$e->getMessage());
        }
    }

    /**
     * Display the specified contact.
     */
    public function show(Contact $contact)
    {
        try {
            return $this->sendResponse([
                'contact' => new ContactResource($contact),
            ], 'Contact retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving contact', [
                'error' => $e->getMessage(),
                'contact_id' => $contact->id,
            ]);

            return $this->sendError('An error occurred while retrieving the contact: '.$e->getMessage());
        }
    }

    /**
     * Update the specified contact in storage.
     */
    public function update(UpdateContactRequest $request, Contact $contact)
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            $contact->update($validated);

            DB::commit();

            return $this->sendResponse([
                'contact' => new ContactResource($contact),
            ], 'Contact updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error updating contact', [
                'error' => $e->getMessage(),
                'contact_id' => $contact->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError('An error occurred while updating the contact: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified contact from storage.
     */
    public function destroy(Contact $contact)
    {
        DB::beginTransaction();

        try {
            $contact->delete();

            DB::commit();

            return $this->sendResponse([
                'contact_id' => $contact->id,
            ], 'Contact deleted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error deleting contact', [
                'error' => $e->getMessage(),
                'contact_id' => $contact->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError('An error occurred while deleting the contact: '.$e->getMessage());
        }
    }
}
