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
            $validated = $request->validated();

            $location = Locations::create($validated);

            return redirect()->back()->with('success', 'Location created successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'An error occurred while creating the location.')
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
