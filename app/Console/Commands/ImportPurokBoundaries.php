<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ImportPurokBoundaries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-purok-boundaries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = base_path('map.geojson');

        if (! file_exists($filePath)) {
            $this->error("GeoJSON file not found at {$filePath}");

            return 1;
        }

        $json = file_get_contents($filePath);
        $data = json_decode($json, true);

        if (! isset($data['features'])) {
            $this->error('Invalid GeoJSON format: "features" key missing.');

            return 1;
        }

        $this->info('Importing Purok boundaries...');

        foreach ($data['features'] as $feature) {
            $properties = $feature['properties'] ?? [];
            $name = $properties['name'] ?? 'Unnamed Purok';

            // Special handling for the overall Barangay Boundary
            if ($name === 'Brgy 176-E Boundary') {
                $this->info("Found 'Brgy 176-E Boundary'. Skipping Purok creation.");

                $geometry = $feature['geometry'] ?? [];
                $coordinates = $geometry['coordinates'];

                if ($geometry['type'] === 'Polygon') {
                    $coordinates = $coordinates[0];
                }

                // Format for config/geofencing.php
                $phpArray = "[\n";
                foreach ($coordinates as $point) {
                    $phpArray .= "        [{$point[0]}, {$point[1]}],\n";
                }
                $phpArray .= '    ]';

                $this->info('---------------------------------------------------');
                $this->info('UPDATE config/geofencing.php WITH THE FOLLOWING DATA:');
                $this->info('---------------------------------------------------');
                $this->line("'boundary' => ".$phpArray.',');
                $this->info('---------------------------------------------------');

                continue;
            }

            $color = $properties['color'] ?? null;
            $geometry = $feature['geometry'] ?? [];

            if ($geometry['type'] !== 'LineString' && $geometry['type'] !== 'Polygon') {
                $this->warn("Skipping feature '{$name}': Unsupported geometry type '{$geometry['type']}'.");

                continue;
            }

            $coordinates = $geometry['coordinates'];

            // Handle Polygon (GeoJSON Polygons have an extra array layer)
            if ($geometry['type'] === 'Polygon') {
                $coordinates = $coordinates[0];
            }

            // Ensure the polygon is closed (first point must equal last point)
            if (! empty($coordinates)) {
                $first = $coordinates[0];
                $last = end($coordinates);

                if ($first !== $last) {
                    $coordinates[] = $first;
                }
            }

            // Convert coordinates to WKT format: lng lat, lng lat...
            $wktPoints = array_map(function ($point) {
                return "{$point[0]} {$point[1]}";
            }, $coordinates);

            $wkt = 'POLYGON(('.implode(', ', $wktPoints).'))';

            try {
                \App\Models\Purok::updateOrCreate(
                    ['name' => $name],
                    [
                        'color' => $color,
                        'boundary' => \Illuminate\Support\Facades\DB::raw("ST_GeomFromText('{$wkt}')"),
                    ]
                );
                $this->line("Successfully imported: {$name}");
            } catch (\Exception $e) {
                $this->error("Failed to import '{$name}': ".$e->getMessage());
            }
        }

        $this->info('Import complete!');

        return 0;
    }
}
