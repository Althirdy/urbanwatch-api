<?php

namespace Database\Seeders;

use App\Models\Purok;
use Illuminate\Database\Seeder;

class PurokSeeder extends Seeder
{
    /**
     * Seed core purok records required for official assignments.
     */
    public function run(): void
    {
        $puroks = [
            ['name' => 'Phase 7A Lakan', 'color' => '#2563eb'],
            ['name' => 'Phase 9 Package 7A', 'color' => '#16a34a'],
            ['name' => 'Ph1 Pkg4', 'color' => '#f97316'],
        ];

        foreach ($puroks as $purok) {
            Purok::query()->firstOrCreate(['name' => $purok['name']], $purok);
        }
    }
}
