<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Purok;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurokController extends Controller
{
    public function index()
    {
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

        return Inertia::render('puroks', [
            'puroks' => $puroks,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7',
            'coordinates' => 'required|array|min:3', // Array of [lng, lat]
        ]);

        $purok = Purok::findOrFail($id);

        $coords = $request->coordinates;
        // Ensure it's closed
        if ($coords[0] !== end($coords)) {
            $coords[] = $coords[0];
        }

        $wktPoints = array_map(function ($point) {
            return "{$point[0]} {$point[1]}";
        }, $coords);

        $wkt = 'POLYGON(('.implode(', ', $wktPoints).'))';

        try {
            $purok->update([
                'name' => $request->name,
                'color' => $request->color,
                'boundary' => DB::raw("ST_GeomFromText('{$wkt}')"),
            ]);

            return redirect()->back()->with('success', 'Purok boundary updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update boundary: '.$e->getMessage());
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7',
            'coordinates' => 'required|array|min:3',
        ]);

        $coords = $request->coordinates;
        if ($coords[0] !== end($coords)) {
            $coords[] = $coords[0];
        }

        $wktPoints = array_map(function ($point) {
            return "{$point[0]} {$point[1]}";
        }, $coords);

        $wkt = 'POLYGON(('.implode(', ', $wktPoints).'))';

        Purok::create([
            'name' => $request->name,
            'color' => $request->color,
            'boundary' => DB::raw("ST_GeomFromText('{$wkt}')"),
        ]);

        return redirect()->back()->with('success', 'Purok created successfully.');
    }

    public function destroy($id)
    {
        $purok = Purok::findOrFail($id);
        $purok->delete();

        return redirect()->back()->with('success', 'Purok deleted successfully.');
    }
}
