<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\ContactRequest;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ContactController extends Controller
{
    /**
     * Display a listing of the contacts.
     */
    public function index(Request $request)
    {
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
            if ($request->active === '1') {
                $query->where('active', true);
            } elseif ($request->active === '0') {
                $query->where('active', false);
            }
        }

        $contacts = $query->latest()->paginate(10);

        return Inertia::render('contacts', [
            'contacts' => $contacts,
            'filters' => $request->only(['search', 'responder_type', 'active'])
        ]);
    }

    /**
     * Store a newly created contact in storage.
     */
    public function store(ContactRequest $request)
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            $contact = Contact::create($validated);

            DB::commit();

            return redirect()->back()->with('success', 'Contact created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'An error occurred while creating the contact.')
                ->withInput();
        }
    }

    /**
     * Display the specified contact.
     */
    public function show(Contact $contact)
    {
        return Inertia::render('ContactDetails', [
            'contact' => $contact
        ]);
    }

    /**
     * Update the specified contact in storage.
     */
    public function update(ContactRequest $request, Contact $contact)
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            $contact->update($validated);

            DB::commit();

            return redirect()->back()->with('success', 'Contact updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'An error occurred while updating the contact.')
                ->withInput();
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

            return redirect()->back()->with('success', 'Contact deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'An error occurred while deleting the contact.');
        }
    }

    public function heatMapContacts()
    {
        $contacts = Contact::all();

        return response()->json([
            'success' => true,
            'message' => 'Contacts retrieved successfully',
            'data' => $contacts,
        ], 200);
    }
}
