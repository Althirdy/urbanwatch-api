<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LocationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // For now, return empty locations array
        $locations = [];
        
        return Inertia::render('locations', [
            'locations' => $locations
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'location_name' => 'required|string|max:255',
            'landmark' => 'required|string|max:255',
            'barangay' => 'required|string|max:255',
            'location_category' => 'required|string',
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'description' => 'nullable|string',
        ]);

        // For now, just log the data and return success
        // In a real implementation, you would save to database
        Log::info('Location created:', $validated);

        return redirect()->back()->with('success', 'Location created successfully!');
    }

    /**
     * Get categories (hardcoded for now)
     */
    public function getCategories()
    {
        $categories = [
            ['id' => 1, 'name' => 'School'],
            ['id' => 2, 'name' => 'Hospital'],
            ['id' => 3, 'name' => 'Market'],
            ['id' => 4, 'name' => 'Park'],
            ['id' => 5, 'name' => 'Government Office'],
        ];

        return response()->json($categories);
    }

    /**
     * Get barangays (hardcoded for now)
     */
    public function getBarangays()
    {
        $barangays = [
            ['id' => 1, 'name' => 'Brgy 176 - A'],
            ['id' => 2, 'name' => 'Brgy 176 - B'],
            ['id' => 3, 'name' => 'Brgy 176 - C'],
            ['id' => 4, 'name' => 'Brgy 176 - D'],
            ['id' => 5, 'name' => 'Brgy 176 - E'],
            ['id' => 6, 'name' => 'Brgy 176 - F'],
        ];

        return response()->json($barangays);
    }
}