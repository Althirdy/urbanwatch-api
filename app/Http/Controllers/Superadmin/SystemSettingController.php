<?php

namespace App\Http\Controllers\Superadmin;

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
        return Inertia::render('settings/system', [
            'settings' => SystemSetting::all()->keyBy('key'),
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|exists:system_settings,key',
            'value' => 'required',
        ]);

        SystemSetting::set($validated['key'], $validated['value']);
        Cache::forget($validated['key']);

        return back()->with('success', 'Setting updated successfully.');
    }
}
