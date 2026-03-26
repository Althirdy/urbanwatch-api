<?php

namespace Tests\Unit\Services;

use App\Services\PurokBoundaryReconciliationService;
use Tests\TestCase;

class PurokBoundaryReconciliationServiceTest extends TestCase
{
    public function test_it_parses_current_map_geojson_and_excludes_barangay_boundary(): void
    {
        $service = new PurokBoundaryReconciliationService;

        $source = $service->loadSource(base_path('map.geojson'));

        $this->assertSame(28, $source['feature_count']);
        $this->assertSame(26, $source['unique_name_count']);
        $this->assertSame(2, $source['duplicate_name_rows']);
        $this->assertCount(25, $source['territories']);
        $this->assertSame(28, $source['geometry_type_counts']['LineString'] ?? 0);

        $names = collect($source['territories'])->pluck('normalized_name');
        $this->assertFalse($names->contains($service->normalizeName(PurokBoundaryReconciliationService::BARANGAY_BOUNDARY_NAME)));
    }

    public function test_it_normalizes_names_case_and_spacing_consistently(): void
    {
        $service = new PurokBoundaryReconciliationService;

        $this->assertSame('PKG 7A', $service->normalizeName('  pkg   7a  '));
        $this->assertSame('PKG 7A', $service->normalizeName('PKG 7A'));
    }
}
