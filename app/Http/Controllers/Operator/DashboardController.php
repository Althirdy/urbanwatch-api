<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use App\Models\ConcernHistory;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Fetch Concerns that need attention (Unmapped or Assigned to Admin)
        // assuming '1' is the Admin/Operator ID fallback
        $unmappedConcerns = Concern::with(['media'])
            ->where('status', 'pending')
            ->where(function ($query) {
                $query->whereDoesntHave('distribution')
                      ->orWhereHas('distribution', function ($q) {
                          $q->where('purok_leader_id', 1);
                      });
            })
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
            ->with('officialDetails')
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

            // Update or Create Distribution
            ConcernDistribution::updateOrCreate(
                ['concern_id' => $concern->id],
                [
                    'purok_leader_id' => $leaderId,
                    'status' => 'assigned',
                    'assigned_at' => now(),
                ]
            );

            // Create History Log
            ConcernHistory::create([
                'concern_id' => $concern->id,
                'status' => 'pending',
                'remarks' => 'Manually assigned to Purok Leader by Operator.',
            ]);

            // Notify Leader (SMS/Event)
            // Ideally delegate to ConcernService logic to avoid duplication,
            // but for now we implement basic notification here or dispatch the job directly.
            $leader = User::with('officialDetails')->find($leaderId);
            if ($leader && $leader->officialDetails && $leader->officialDetails->contact_number) {
                 dispatch(new \App\Jobs\SendSmsNotificationJob(
                    $leader->officialDetails->contact_number,
                    [
                        'tracking_code' => $concern->tracking_code,
                        'category' => $concern->category,
                        'severity' => $concern->severity,
                        'description' => $concern->description,
                        'address' => $concern->address,
                        'custom_location' => 'Manual Assignment',
                    ]
                ));
            }

            DB::commit();
            return redirect()->back()->with('success', 'Concern assigned successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to assign concern: ' . $e->getMessage());
        }
    }
}