<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify ENUM to include 'rejected'
        DB::statement("ALTER TABLE concern_distribution MODIFY COLUMN status ENUM('assigned', 'acknowledged', 'in_progress', 'resolved', 'rejected') NOT NULL DEFAULT 'assigned'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'rejected' from ENUM (revert to original)
        DB::statement("ALTER TABLE concern_distribution MODIFY COLUMN status ENUM('assigned', 'acknowledged', 'in_progress', 'resolved') NOT NULL DEFAULT 'assigned'");
    }
};
