<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Citizen\Concern;
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
            ->get()
            ->map(function ($concern) {
                return [
                    'id' => $concern->id,
                    'title' => $concern->title,
                    'category' => $concern->category,
                    'latitude' => $concern->latitude,
                    'longitude' => $concern->longitude,
                    'description' => $concern->description,
                ];
            });

        // 2. Fetch Purok Boundaries for the Map
        $puroks = Purok::select('id', 'name', 'color', DB::raw('ST_AsGeoJSON(boundary) as geometry'))
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'color' => $p->color,
                    'geometry' => json_decode($p->geometry),
                ];
            });

        // 3. Fetch Active Purok Leaders for Manual Assignment
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
