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
        Schema::table('concerns', function (Blueprint $table) {
            if (! Schema::hasColumn('concerns', 'followups_count')) {
                $table->unsignedInteger('followups_count')->default(0)->after('parent_concern_id');
            }

            if (! Schema::hasColumn('concerns', 'last_followup_at')) {
                $table->timestamp('last_followup_at')->nullable()->after('followups_count');
            }

            if (! Schema::hasColumn('concerns', 'last_digest_notified_at')) {
                $table->timestamp('last_digest_notified_at')->nullable()->after('last_followup_at');
            }

            if (! Schema::hasColumn('concerns', 'last_digest_count')) {
                $table->unsignedInteger('last_digest_count')->default(0)->after('last_digest_notified_at');
            }
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE concerns MODIFY COLUMN status ENUM('analyzing', 'needs_review', 'pending', 'ongoing', 'escalated', 'resolved', 'rejected') NOT NULL DEFAULT 'analyzing'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("UPDATE concerns SET status = 'pending' WHERE status = 'needs_review'");
            DB::statement("ALTER TABLE concerns MODIFY COLUMN status ENUM('analyzing', 'pending', 'ongoing', 'escalated', 'resolved', 'rejected') NOT NULL DEFAULT 'analyzing'");
        }

        Schema::table('concerns', function (Blueprint $table) {
            if (Schema::hasColumn('concerns', 'last_digest_count')) {
                $table->dropColumn('last_digest_count');
            }

            if (Schema::hasColumn('concerns', 'last_digest_notified_at')) {
                $table->dropColumn('last_digest_notified_at');
            }

            if (Schema::hasColumn('concerns', 'last_followup_at')) {
                $table->dropColumn('last_followup_at');
            }

            if (Schema::hasColumn('concerns', 'followups_count')) {
                $table->dropColumn('followups_count');
            }
        });
    }
};
