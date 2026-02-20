<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'awaiting_confirmation' to the concern_distribution status ENUM
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE concern_distribution MODIFY COLUMN status ENUM('assigned', 'acknowledged', 'in_progress', 'resolved', 'rejected', 'awaiting_confirmation') NOT NULL DEFAULT 'assigned'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            // Revert any awaiting_confirmation rows back to assigned before removing the ENUM value
            DB::statement("UPDATE concern_distribution SET status = 'assigned' WHERE status = 'awaiting_confirmation'");
            DB::statement("ALTER TABLE concern_distribution MODIFY COLUMN status ENUM('assigned', 'acknowledged', 'in_progress', 'resolved', 'rejected') NOT NULL DEFAULT 'assigned'");
        }
    }
};
