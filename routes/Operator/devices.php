<?php

use App\Http\Controllers\Operator\CCTVController;
use App\Http\Controllers\Operator\UWDeviceController;
use App\Models\cctvDevices;
use App\Models\UwDevice;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('devices', function () {
        $page = request()->get('page', 1);
        $search = request()->get('search', '');
        $status = request()->get('status', 'all');
        $package = request()->get('package', 'all');
        $yolo = request()->get('yolo', 'all');
        
        // Build cache key with all filters
        $cacheKey = "devices_list_page_{$page}_search_{$search}_status_{$status}_package_{$package}_yolo_{$yolo}";

        // Use tagged caching so that when any cctv_devices or uw_devices are updated,
        // the observers will invalidate this cache automatically
        $data = \Illuminate\Support\Facades\Cache::tags(['cctv_devices', 'uw_devices'])->remember($cacheKey, now()->addHours(1), function () use ($page, $search, $status, $package, $yolo) {
            // Build CCTV query with filters
            $cctvQuery = cctvDevices::query();
            
            // Apply search filter
            if ($search) {
                $cctvQuery->where(function($q) use ($search) {
                    $q->where('location_name', 'like', "%{$search}%")
                      ->orWhere('primary_rtsp_url', 'like', "%{$search}%")
                      ->orWhere('package', 'like', "%{$search}%");
                });
            }
            
            // Apply status filter
            if ($status !== 'all') {
                $cctvQuery->where('status', $status);
            }
            
            // Apply package filter
            if ($package !== 'all') {
                $cctvQuery->where('package', $package);
            }
            
            // Apply YOLO filter
            if ($yolo !== 'all') {
                $yoloEnabled = $yolo === 'enabled';
                $cctvQuery->where('yolo_enabled', $yoloEnabled);
            }
            
            $cctvDevices = $cctvQuery->paginate(10, ['*'], 'page', $page)->withQueryString();

            // Get UW Devices
            $uwDevices = UwDevice::paginate(10, ['*'], 'page', $page)->withQueryString();

            // Get all CCTV devices for the dropdown in UW Device form
            $allCctvDevices = cctvDevices::all();

            return [
                'devices' => $cctvDevices,
                'uwDevices' => $uwDevices,
                'cctvDevices' => $allCctvDevices,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'package' => $package,
                    'yolo' => $yolo,
                ],
            ];
        });

        return Inertia::render('devices', $data);
    })->name('devices');

    // CCTV Routes
    Route::post('devices/cctv', [CCTVController::class, 'store'])->name('devices.cctv.store');
    Route::put('devices/cctv/{cctv}', [CCTVController::class, 'update'])->name('devices.cctv.update');
    Route::delete('devices/cctv/{cctv}', [CCTVController::class, 'destroy'])->name('devices.cctv.destroy');
    Route::patch('devices/cctv/{cctv}/toggle-yolo', [CCTVController::class, 'toggleYolo'])->name('devices.cctv.toggle-yolo');

    // UW Device Routes
    Route::post('devices/uwdevice', [UWDeviceController::class, 'store'])->name('devices.uwdevice.store');
    Route::put('devices/uwdevice/{uwdevice}', [UWDeviceController::class, 'update'])->name('devices.uwdevice.update');
    Route::delete('devices/uwdevice/{uwdevice}', [UWDeviceController::class, 'destroy'])->name('devices.uwdevice.destroy');
});
