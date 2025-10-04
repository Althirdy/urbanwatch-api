<?php

namespace Database\Seeders;

use App\Models\Report;
use Illuminate\Database\Seeder;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing users to ensure we have valid user_ids
        $users = \App\Models\User::take(5)->get();
        
        if ($users->isEmpty()) {
            $this->command->info('No users found. Please run UserSeeder first.');
            return;
        }

        $reports = [
            [
                'user_id'        => $users->first()->id,
                'report_type'    => 'CCTV',
                'transcript'     => 'Suspicious activity near Metroplaza Phase 5.',
                'description'    => 'Saw someone loitering around the mall entrance late evening.',
                'latitute'       => '14.7730',
                'longtitude'     => '121.0540',
                'is_acknowledge' => false, // Changed to true so it can be used for public posts
                'status'        => 'pending',
                'acknowledge_by' => $users->skip(1)->first()?->id ?? $users->first()->id,
            ],
            [
                'user_id'        => $users->skip(1)->first()?->id ?? $users->first()->id,
                'report_type'    => 'Citizen Concern',
                'transcript'     => 'Issue at Barangay 176A office.',
                'description'    => 'Altercation reported at the barangay hall.',
                'latitute'       => '14.7751',
                'longtitude'     => '121.0448',
                'is_acknowledge' => false, // Changed to true so it can be used for public posts
                'status'        => 'pending',
                'acknowledge_by' => $users->skip(2)->first()?->id ?? $users->first()->id,
            ],
            [
                'user_id'        => $users->skip(2)->first()?->id ?? $users->first()->id,
                'report_type'    => 'CCTV',
                'transcript'     => 'Altercation reported at the barangay 176A office.',
                'description'    => 'Loud altercation between residents occurred at the barangay office during business hours.',
                'latitute'       => '14.7730',
                'longtitude'     => '121.0540',
                'is_acknowledge' => false,
                'status'        => 'pending',
                'acknowledge_by' => $users->first()->id,
            ],
            [
                'user_id'        => $users->skip(3)->first()?->id ?? $users->first()->id,
                'report_type'    => 'Citizen Concern',
                'transcript'     => 'Medical emergency at local clinic.',
                'description'    => 'Person collapsed near the local health center, ambulance was called.',
                'latitute'       => '14.7751',
                'longtitude'     => '121.0448',
                'is_acknowledge' => false,
                'status'        => 'pending',
                'acknowledge_by' => $users->first()->id,
            ],
            [
                'user_id'        => $users->skip(4)->first()?->id ?? $users->first()->id,
                'report_type'    => 'CCTV',
                'transcript'     => 'Pothole on main road causing traffic issues.',
                'description'    => 'Large pothole developed on the main road, causing vehicles to swerve and creating safety hazard.',
                'latitute'       => '14.7740',
                'longtitude'     => '121.0530',
                'is_acknowledge' => false,
                'status'        => 'pending',
                'acknowledge_by' => $users->skip(1)->first()?->id ?? $users->first()->id,
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

        $this->command->info('Report seeder completed successfully.');
    }
}