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
            if (! Schema::hasColumn('uw_devices', 'device_id')) {
                $table->integer('device_id')->unique()->after('id');
            }

            // Add api_token for IoT authentication
            if (! Schema::hasColumn('uw_devices', 'api_token')) {
                $table->string('api_token')->unique()->nullable()->after('device_id');
            }

            // Update device_name to be unique and add indexes for performance
            $table->string('device_name')->unique()->change();
            $table->index('status');
            $table->index('location_id');

            // Add last_seen_at for health monitoring
            if (! Schema::hasColumn('uw_devices', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable()->after('status');
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

            if (Schema::hasColumn('uw_devices', 'api_token')) {
                $table->dropColumn('api_token');
            }

            if (Schema::hasColumn('uw_devices', 'last_seen_at')) {
                $table->dropColumn('last_seen_at');
            }

            if (! Schema::hasColumn('uw_devices', 'cctv_id')) {
                $table->foreignId('cctv_id')->nullable()->constrained('cctv_devices')->onDelete('set null');
            }
        });
    }
};
