<?php

namespace App\Services;

use App\Models\Purok;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PurokBoundaryReconciliationService
{
    public const BARANGAY_BOUNDARY_NAME = 'Brgy 176-E Boundary';

    /**
     * Build a reconciliation report between GeoJSON source and DB puroks.
     */
    public function buildReport(string $sourcePath): array
    {
        $source = $this->loadSource($sourcePath);
        $dbRows = Purok::query()->get(['id', 'name', 'boundary', 'created_at', 'updated_at']);

        $dbNormalizedNames = $dbRows
            ->map(fn (Purok $row) => $this->normalizeName((string) $row->name))
            ->filter()
            ->values();

        $dbUniqueNormalized = $dbNormalizedNames->unique()->values();

        $dbDuplicates = $dbRows
            ->groupBy(fn (Purok $row) => $this->normalizeName((string) $row->name))
            ->filter(fn (Collection $group, string $normalized) => $normalized !== '' && $group->count() > 1)
            ->map(fn (Collection $group, string $normalized) => [
                'normalized_name' => $normalized,
                'ids' => $group->pluck('id')->values()->all(),
                'names' => $group->pluck('name')->values()->all(),
                'count' => $group->count(),
            ])
            ->values()
            ->all();

        $sourceSet = collect($source['territories'])->pluck('normalized_name')->unique()->values();

        $inSourceNotDb = $sourceSet->diff($dbUniqueNormalized)->values()->all();
        $inDbNotSource = $dbUniqueNormalized->diff($sourceSet)->values()->all();

        $invalidGeometryCount = $this->countInvalidGeometries();

        return [
            'source' => [
                'path' => $sourcePath,
                'feature_count' => $source['feature_count'],
                'geometry_type_counts' => $source['geometry_type_counts'],
                'unique_name_count' => $source['unique_name_count'],
                'unique_territory_count' => count($source['territories']),
                'duplicate_name_rows' => $source['duplicate_name_rows'],
                'boundary_name' => self::BARANGAY_BOUNDARY_NAME,
                'territories' => $source['territories'],
            ],
            'database' => [
                'total_rows' => $dbRows->count(),
                'rows_with_null_boundary' => $dbRows->whereNull('boundary')->count(),
                'rows_with_invalid_boundary' => $invalidGeometryCount,
                'distinct_normalized_name_count' => $dbUniqueNormalized->count(),
                'duplicates' => $dbDuplicates,
            ],
            'diff' => [
                'source_not_in_db' => $inSourceNotDb,
                'db_not_in_source' => $inDbNotSource,
            ],
        ];
    }

    /**
     * Apply source data into DB with optional dedupe and stale deletion.
     */
    public function apply(string $sourcePath, bool $dedupe = true, bool $deleteStale = false): array
    {
        $source = $this->loadSource($sourcePath);

        $result = DB::transaction(function () use ($source, $dedupe, $deleteStale) {
            $applied = [
                'created' => 0,
                'updated' => 0,
                'deleted_stale' => 0,
                'deleted_duplicates' => 0,
            ];

            $dbRows = Purok::query()->get(['id', 'name', 'boundary', 'updated_at']);
            $byNormalized = $dbRows
                ->groupBy(fn (Purok $row) => $this->normalizeName((string) $row->name));

            $sourceNormalizedSet = collect($source['territories'])
                ->pluck('normalized_name')
                ->unique();

            foreach ($source['territories'] as $territory) {
                $normalized = $territory['normalized_name'];
                $existingGroup = $byNormalized->get($normalized, collect());
                $canonical = $this->pickCanonical($existingGroup);

                $payload = [
                    'name' => $territory['name'],
                    'color' => $territory['color'],
                    'boundary' => DB::raw("ST_GeomFromText('{$territory['wkt']}')"),
                ];

                if ($canonical) {
                    Purok::query()->whereKey($canonical->id)->update($payload);
                    $applied['updated']++;
                } else {
                    Purok::query()->create($payload);
                    $applied['created']++;
                }
            }

            if ($dedupe) {
                $freshRows = Purok::query()->get(['id', 'name', 'boundary', 'updated_at']);
                $duplicateGroups = $freshRows
                    ->groupBy(fn (Purok $row) => $this->normalizeName((string) $row->name))
                    ->filter(fn (Collection $group, string $normalized) => $normalized !== '' && $group->count() > 1);

                foreach ($duplicateGroups as $group) {
                    $canonical = $this->pickCanonical($group);
                    $toDelete = $group->filter(fn (Purok $row) => $canonical && $row->id !== $canonical->id);

                    if ($toDelete->isNotEmpty()) {
                        Purok::query()->whereIn('id', $toDelete->pluck('id')->all())->delete();
                        $applied['deleted_duplicates'] += $toDelete->count();
                    }
                }
            }

            if ($deleteStale) {
                $staleIds = Purok::query()
                    ->get(['id', 'name'])
                    ->filter(function (Purok $row) use ($sourceNormalizedSet) {
                        return ! $sourceNormalizedSet->contains($this->normalizeName((string) $row->name));
                    })
                    ->pluck('id')
                    ->values();

                if ($staleIds->isNotEmpty()) {
                    Purok::query()->whereIn('id', $staleIds->all())->delete();
                    $applied['deleted_stale'] = $staleIds->count();
                }
            }

            return $applied;
        });

        return array_merge($result, [
            'post_report' => $this->buildReport($sourcePath),
        ]);
    }

    /**
     * Parse GeoJSON source and return normalized territory records.
     */
    public function loadSource(string $sourcePath): array
    {
        if (! is_file($sourcePath)) {
            throw new \InvalidArgumentException("GeoJSON source not found: {$sourcePath}");
        }

        $raw = file_get_contents($sourcePath);
        $json = json_decode((string) $raw, true);

        if (! is_array($json) || ! isset($json['features']) || ! is_array($json['features'])) {
            throw new \RuntimeException('Invalid GeoJSON: missing features array.');
        }

        $features = $json['features'];
        $geometryTypeCounts = [];
        $nameRows = [];
        $territoriesByNormalized = [];

        foreach ($features as $feature) {
            $geometry = $feature['geometry'] ?? [];
            $type = (string) ($geometry['type'] ?? '');
            $geometryTypeCounts[$type] = ($geometryTypeCounts[$type] ?? 0) + 1;

            $name = trim((string) (($feature['properties']['name'] ?? 'Unnamed Purok')));
            $nameRows[] = $name;

            if (strcasecmp($name, self::BARANGAY_BOUNDARY_NAME) === 0) {
                continue;
            }

            $coordinates = $this->extractCoordinates($geometry);
            if (count($coordinates) < 3) {
                continue;
            }

            $closedCoordinates = $this->closeRing($coordinates);
            $wkt = $this->toWktPolygon($closedCoordinates);

            $normalized = $this->normalizeName($name);
            if ($normalized === '') {
                continue;
            }

            $territoriesByNormalized[$normalized] = [
                'name' => $name,
                'normalized_name' => $normalized,
                'color' => $feature['properties']['color'] ?? null,
                'wkt' => $wkt,
            ];
        }

        $uniqueNameCount = count(array_unique(array_map(fn ($n) => $this->normalizeName((string) $n), $nameRows)));
        $duplicateNameRows = count($nameRows) - $uniqueNameCount;

        return [
            'feature_count' => count($features),
            'geometry_type_counts' => $geometryTypeCounts,
            'unique_name_count' => $uniqueNameCount,
            'duplicate_name_rows' => max(0, $duplicateNameRows),
            'territories' => array_values($territoriesByNormalized),
        ];
    }

    public function normalizeName(string $name): string
    {
        $name = preg_replace('/\s+/', ' ', trim($name)) ?? '';

        return mb_strtoupper($name);
    }

    private function extractCoordinates(array $geometry): array
    {
        $type = (string) ($geometry['type'] ?? '');
        $coordinates = $geometry['coordinates'] ?? [];

        if ($type === 'Polygon' && isset($coordinates[0]) && is_array($coordinates[0])) {
            return $coordinates[0];
        }

        if ($type === 'LineString' && is_array($coordinates)) {
            return $coordinates;
        }

        return [];
    }

    private function closeRing(array $coordinates): array
    {
        if (empty($coordinates)) {
            return $coordinates;
        }

        $first = $coordinates[0];
        $last = $coordinates[count($coordinates) - 1];

        if ($first !== $last) {
            $coordinates[] = $first;
        }

        return $coordinates;
    }

    private function toWktPolygon(array $coordinates): string
    {
        $points = array_map(function ($point) {
            $lng = (float) ($point[0] ?? 0);
            $lat = (float) ($point[1] ?? 0);

            return $lng.' '.$lat;
        }, $coordinates);

        return 'POLYGON(('.implode(', ', $points).'))';
    }

    private function countInvalidGeometries(): ?int
    {
        try {
            return (int) Purok::query()
                ->whereNotNull('boundary')
                ->whereRaw('ST_IsValid(boundary) = 0')
                ->count();
        } catch (\Throwable) {
            return null;
        }
    }

    private function pickCanonical(Collection $group): ?Purok
    {
        if ($group->isEmpty()) {
            return null;
        }

        return $group
            ->sortByDesc(function (Purok $row) {
                return [
                    $row->boundary !== null ? 1 : 0,
                    optional($row->updated_at)->timestamp ?? 0,
                    $row->id,
                ];
            })
            ->first();
    }
}
