<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\LocationRequest;
use App\Models\Locations;
use App\Services\LocationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function __construct(
        private LocationService $locationService
    ) {}

    public function store(LocationRequest $request)
    {
        try {
            $this->locationService->createLocation($request->validated());

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
        $locationWithDetails = $this->locationService->getLocationWithDetails($location);

        return Inertia::render('LocationDetails', [
            'location' => $locationWithDetails
        ]);
    }

    /**
     * Update the specified location in storage.
     */
    public function update(LocationRequest $request, Locations $location)
    {
        try {
            $this->locationService->updateLocation($location, $request->validated());

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
            $this->locationService->deleteLocation($location);

            return redirect()->back()->with('success', 'Location deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'An error occurred while deleting the location.');
        }
    }
}
