<?php

namespace Database\Seeders;

use App\Models\Report;
use Illuminate\Database\Seeder;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        $reports = [
            [
                'user_id'        => 1,
                'report_type'    => 'Anomaly',
                'transcript'     => 'Suspicious activity near Metroplaza Phase 5.',
                'description'    => 'Saw someone loitering around the mall entrance late evening.',
                'latitute'       => '14.7730',
                'longtitude'     => '121.0540',
                'is_acknowledge' => false,
                'status'        => 'on going',
                'acknowledge_by' => 2,
            ],
            [
                'user_id'        => 2,
                'report_type'    => 'Incident',
                'transcript'     => 'Issue at Barangay 176A office.',
                'description'    => 'Altercation reported at the barangay hall.',
                'latitute'       => '14.7751',
                'longtitude'     => '121.0448',
                'is_acknowledge' => false,
                'status'        => 'on going',
                'acknowledge_by' => 1,
            ],
        ];

        foreach ($reports as $reportData) {
            Report::firstOrCreate(
                [
                    'user_id' => $reportData['user_id'],
                    'transcript' => $reportData['transcript'],
                ],
                $reportData
            );
        }
    }
}