<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class SystemSettingController extends Controller
{
    /**
     * Display the system settings page.
     */
    public function index()
    {
        // Check if user is Operator (ID 1) or Admin to access this
        // Assuming Role 1 is Operator/Admin based on seeder logic
        if (auth()->user()->role_id !== 1) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('settings/system', [
            'settings' => SystemSetting::all()->keyBy('key'),
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        if (auth()->user()->role_id !== 1) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'key' => 'required|exists:system_settings,key',
            'value' => 'required',
        ]);

        \Illuminate\Support\Facades\Log::info('Updating System Setting', $validated);

        SystemSetting::set($validated['key'], $validated['value']);

        // Clear cache so changes reflect immediately
        Cache::forget($validated['key']);

        return back()->with('success', 'Setting updated successfully.');
    }
}
