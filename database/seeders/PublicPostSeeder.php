<?php

namespace Database\Seeders;

use App\Models\PublicPost;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;

class PublicPostSeeder extends Seeder
{
    public function run(): void
    {
        // Get reports that are acknowledged and have Ongoing status
        $reports = Report::where('is_acknowledge', true)
            ->where('status', 'Ongoing')
            ->get();

        if ($reports->isEmpty()) {
            $this->command->info('No acknowledged ongoing reports found to create public posts.');
            return;
        }

        // Get a user to be the publisher (preferably an operator)
        $publisher = User::whereHas('role', function($query) {
            $query->where('name', 'Operator');
        })->first();

        if (!$publisher) {
            $publisher = User::first();
        }

        foreach ($reports as $report) {
            // Check if public post already exists for this report
            if (!$report->publicPost) {
                PublicPost::create([
                    'report_id' => $report->id,
                    'published_by' => $publisher->id,
                    'published_at' => null, // Draft by default, can be published later
                ]);
            }
        }

        $this->command->info('PublicPost seeder completed successfully.');
    }
}
