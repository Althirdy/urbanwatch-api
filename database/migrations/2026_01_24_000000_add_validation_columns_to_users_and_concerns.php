<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add columns to users table
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'false_alarm_strikes')) {
                $table->integer('false_alarm_strikes')->default(0)->after('remember_token');
            }
        });

        // 2. Add columns to concerns table
        Schema::table('concerns', function (Blueprint $table) {
            if (! Schema::hasColumn('concerns', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('status');
            }
            if (! Schema::hasColumn('concerns', 'is_valid')) {
                $table->boolean('is_valid')->nullable()->after('rejection_reason');
            }
            if (! Schema::hasColumn('concerns', 'ai_analysis_raw')) {
                $table->json('ai_analysis_raw')->nullable()->after('is_valid');
            }
        });

        // 3. Modify status enum in concerns table
        // Note: We use raw SQL because Doctrine DBAL (used by Laravel for changing columns)
        // has historical issues with ENUMs, and this is the most reliable way for MySQL.
        DB::statement("ALTER TABLE concerns MODIFY COLUMN status ENUM('analyzing', 'pending', 'ongoing', 'escalated', 'resolved', 'rejected') NOT NULL DEFAULT 'analyzing'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Revert status enum
        // We set default back to 'pending' and remove the new options.
        // Warning: This will fail if there are records with 'analyzing' or 'rejected' status.
        // Ideally, we would update those records first, but for now we just attempt the revert.
        DB::statement("UPDATE concerns SET status = 'pending' WHERE status IN ('analyzing', 'rejected')");
        DB::statement("ALTER TABLE concerns MODIFY COLUMN status ENUM('pending', 'ongoing', 'escalated', 'resolved') NOT NULL DEFAULT 'pending'");

        // 2. Drop columns from concerns
        Schema::table('concerns', function (Blueprint $table) {
            $table->dropColumn(['rejection_reason', 'is_valid', 'ai_analysis_raw']);
        });

        // 3. Drop columns from users
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('false_alarm_strikes');
        });
    }
};
