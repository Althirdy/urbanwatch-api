<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\LocationRequest;
use App\Models\Locations;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function store(LocationRequest $request)
    {
        try {
            // Get validated data
            $validated = $request->validated();
            
            // Ensure latitude and longitude are numeric
            $validated['latitude'] = (float) $validated['latitude'];
            $validated['longitude'] = (float) $validated['longitude'];
            $validated['location_category'] = (int) $validated['location_category'];

            $location = Locations::create($validated);

            return redirect()->back()->with('success', 'Location created successfully!');
        } catch (\Exception $e) {
            \Log::error('Location creation failed: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'An error occurred while creating the location: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Display the specified location.
     */
    public function show(Locations $location)
    {
        $location->load('locationCategory');

        return Inertia::render('LocationDetails', [
            'location' => $location
        ]);
    }

    /**
     * Update the specified location in storage.
     */
    public function update(LocationRequest $request, Locations $location)
    {
        try {
            $validated = $request->validated();

            $location->update($validated);

            return redirect()->back()->with('success', 'Location updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'An error occurred while updating the location.')
                ->withInput();
        }
    }

    /**
     * Remove the specified location from storage.
     */
    public function destroy(Locations $location)
    {
        try {
            $location->delete();

            return redirect()->back()->with('success', 'Location deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'An error occurred while deleting the location.');
        }
    }
}
