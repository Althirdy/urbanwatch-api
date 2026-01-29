<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('uw_devices', function (Blueprint $table) {
            // Remove cctv_id column if exists (not in ERD)
            if (Schema::hasColumn('uw_devices', 'cctv_id')) {
                $table->dropForeign(['cctv_id']);
                $table->dropColumn('cctv_id');
            }

            // Add device_id as integer if not exists (matching ERD)
            if (!Schema::hasColumn('uw_devices', 'device_id')) {
                $table->integer('device_id')->unique()->after('id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('uw_devices', function (Blueprint $table) {
            if (Schema::hasColumn('uw_devices', 'device_id')) {
                $table->dropUnique(['device_id']);
                $table->dropColumn('device_id');
            }

            if (!Schema::hasColumn('uw_devices', 'cctv_id')) {
                $table->foreignId('cctv_id')->nullable()->constrained('cctv_devices')->onDelete('set null');
            }
        });
    }
};
