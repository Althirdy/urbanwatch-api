<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'awaiting_confirmation' to the status ENUM
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE concerns MODIFY COLUMN status ENUM('analyzing', 'needs_review', 'pending', 'ongoing', 'escalated', 'resolved', 'rejected', 'awaiting_confirmation') NOT NULL DEFAULT 'analyzing'");
        }

        // Add resolution_requested_at (when PL marked for resolve) and resolution_confirmed_at (when citizen confirmed)
        Schema::table('concerns', function (Blueprint $table) {
            if (!Schema::hasColumn('concerns', 'resolution_requested_at')) {
                $table->timestamp('resolution_requested_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('concerns', 'resolution_confirmed_at')) {
                $table->timestamp('resolution_confirmed_at')->nullable()->after('resolution_requested_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert any awaiting_confirmation concerns back to ongoing
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("UPDATE concerns SET status = 'ongoing' WHERE status = 'awaiting_confirmation'");
            DB::statement("ALTER TABLE concerns MODIFY COLUMN status ENUM('analyzing', 'needs_review', 'pending', 'ongoing', 'escalated', 'resolved', 'rejected') NOT NULL DEFAULT 'analyzing'");
        }

        Schema::table('concerns', function (Blueprint $table) {
            $dropColumns = [];
            if (Schema::hasColumn('concerns', 'resolution_requested_at')) {
                $dropColumns[] = 'resolution_requested_at';
            }
            if (Schema::hasColumn('concerns', 'resolution_confirmed_at')) {
                $dropColumns[] = 'resolution_confirmed_at';
            }
            if (!empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
