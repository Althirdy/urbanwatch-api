<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Citizen\Concern;
use App\Models\OfficialsDetails;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected \App\Services\ConcernService $concernService;

    public function __construct(\App\Services\ConcernService $concernService)
    {
        $this->concernService = $concernService;
    }

    public function index()
    {
        // 1. Fetch Concerns that need attention (Absolutely Unassigned)
        $unmappedConcerns = Concern::with(['media'])
            ->where('status', 'pending')
            ->whereDoesntHave('distribution')
            ->whereNull('parent_concern_id')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($concern) {
                return [
                    'id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'title' => $concern->title,
                    'category' => $concern->category,
                    'severity' => $concern->severity,
                    'latitude' => $concern->latitude,
                    'longitude' => $concern->longitude,
                    'address' => $concern->address,
                    'custom_location' => $concern->custom_location,
                    'description' => $concern->description,
                    'type' => $concern->type,
                    'created_at' => $concern->created_at?->toIso8601String(),
                    'duplicates_count' => $concern->duplicates()->count(),
                ];
            });

        // 2. Fetch active leaders keyed by purok so boundaries can show current assignment
        $activeLeadersByPurok = OfficialsDetails::with('user:id,name')
            ->where('status', 'active')
            ->whereNotNull('purok_id')
            ->whereHas('user', function ($query) {
                $query->where('role_id', 2);
            })
            ->orderByDesc('id')
            ->get()
            ->unique('purok_id')
            ->keyBy('purok_id');

        // 3. Fetch Purok Boundaries for the Map
        $puroks = Purok::select('id', 'name', 'color', DB::raw('ST_AsGeoJSON(boundary) as geometry'))
            ->get()
            ->map(function ($p) use ($activeLeadersByPurok) {
                $activeLeader = $activeLeadersByPurok->get($p->id);

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'color' => $p->color,
                    'geometry' => json_decode($p->geometry),
                    'is_occupied' => (bool) $activeLeader,
                    'active_leader_name' => $activeLeader?->user?->name,
                    'active_leader_id' => $activeLeader?->user_id,
                ];
            });

        // 4. Fetch Active Purok Leaders for Manual Assignment
        $purokLeaders = User::where('role_id', 2) // Purok Leader
            ->whereHas('officialDetails', function ($q) {
                $q->where('status', 'active');
            })
            ->with(['officialDetails.purok'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'purok_name' => $user->officialDetails->purok->name ?? 'Unassigned',
                ];
            });

        return Inertia::render('dashboard', [
            'unmappedConcerns' => $unmappedConcerns,
            'puroks' => $puroks,
            'purokLeaders' => $purokLeaders,
        ]);
    }

    public function assignConcern(Request $request, $id)
    {
        $request->validate([
            'leader_id' => 'required|exists:users,id',
        ]);

        DB::beginTransaction();
        try {
            $concern = Concern::findOrFail($id);
            $leaderId = $request->leader_id;

            // Use centralized assignment logic from ConcernService
            $this->concernService->assignToLeader($concern, $leaderId, 'Manually assigned to Purok Leader by Operator.');

            DB::commit();

            return redirect()->back()->with('success', 'Concern assigned successfully.');

        } catch (\Exception $e) {

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->with('error', 'Failed to assign concern: '.$e->getMessage());
        }
    }
}
