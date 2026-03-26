<?php

namespace App\Console\Commands;

use App\Services\PurokBoundaryReconciliationService;
use Illuminate\Console\Command;

class ReconcilePurokBoundaries extends Command
{
    protected $signature = 'app:reconcile-purok-boundaries
        {--source= : Path to GeoJSON source file (default: base_path(map.geojson))}
        {--apply : Apply source upserts into database}
        {--dedupe : Remove duplicate normalized names when applying}
        {--delete-stale : Delete DB puroks not found in source (destructive)}
        {--force : Allow destructive operations without interactive confirmation}
        {--json : Output report as JSON}';

    protected $description = 'Audit and reconcile purok boundaries between DB and map.geojson source';

    public function handle(PurokBoundaryReconciliationService $service): int
    {
        $sourcePath = $this->option('source') ?: base_path('map.geojson');

        try {
            $report = $service->buildReport($sourcePath);
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->renderReport($report);
        }

        if (! $this->option('apply')) {
            $this->warn('Dry run only. Use --apply to perform DB updates.');

            return self::SUCCESS;
        }

        $deleteStale = (bool) $this->option('delete-stale');
        $dedupe = (bool) $this->option('dedupe') || $deleteStale;

        if ($deleteStale && ! $this->option('force')) {
            $confirmed = $this->confirm('Delete stale DB puroks not present in source? This is destructive.', false);
            if (! $confirmed) {
                $this->warn('Aborted destructive step. Re-run with --force when ready.');

                return self::SUCCESS;
            }
        }

        try {
            $result = $service->apply($sourcePath, $dedupe, $deleteStale);
        } catch (\Throwable $e) {
            $this->error('Reconciliation failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Reconciliation applied successfully.');
        $this->line('created='.$result['created'].' updated='.$result['updated'].' deleted_duplicates='.$result['deleted_duplicates'].' deleted_stale='.$result['deleted_stale']);

        if ($this->option('json')) {
            $this->line(json_encode($result['post_report'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->renderReport($result['post_report']);
        }

        return self::SUCCESS;
    }

    private function renderReport(array $report): void
    {
        $this->info('Source Summary');
        $this->line('features='.$report['source']['feature_count']);
        $this->line('unique_names='.$report['source']['unique_name_count']);
        $this->line('territories_excluding_boundary='.$report['source']['unique_territory_count']);
        $this->line('duplicate_name_rows='.$report['source']['duplicate_name_rows']);

        $this->newLine();
        $this->info('Database Summary');
        $this->line('rows='.$report['database']['total_rows']);
        $this->line('distinct_normalized_names='.$report['database']['distinct_normalized_name_count']);
        $this->line('rows_with_null_boundary='.$report['database']['rows_with_null_boundary']);
        $invalid = $report['database']['rows_with_invalid_boundary'];
        $this->line('rows_with_invalid_boundary='.($invalid === null ? 'n/a (function unavailable)' : $invalid));
        $this->line('duplicate_groups='.count($report['database']['duplicates']));

        $this->newLine();
        $this->info('Drift Summary');
        $this->line('source_not_in_db='.count($report['diff']['source_not_in_db']));
        $this->line('db_not_in_source='.count($report['diff']['db_not_in_source']));

        if (! empty($report['diff']['source_not_in_db'])) {
            $this->warn('Missing in DB: '.implode(', ', $report['diff']['source_not_in_db']));
        }

        if (! empty($report['diff']['db_not_in_source'])) {
            $this->warn('Extra in DB: '.implode(', ', $report['diff']['db_not_in_source']));
        }
    }
}
