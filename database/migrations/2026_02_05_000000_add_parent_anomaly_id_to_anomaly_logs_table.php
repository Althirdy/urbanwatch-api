<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds branching/grouping support for anomaly logs similar to how concerns handle related reports.
     * This allows multiple anomaly detections to be grouped under a parent anomaly for:
     * - Same IoT box detecting same anomaly type within a time window
     * - Manual grouping by purok leaders
     */
    public function up(): void
    {
        Schema::table('anomaly_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_anomaly_id')->nullable()->after('id');
            $table->boolean('is_duplicate')->default(false)->after('parent_anomaly_id');

            $table->foreign('parent_anomaly_id')
                ->references('id')
                ->on('anomaly_logs')
                ->onDelete('set null');

            // Index for faster deduplication queries
            // Anomalies from same IoT box, same type, within time window can be grouped
            $table->index(['iot_box_id', 'anomaly_type', 'created_at'], 'anomaly_deduplication_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('anomaly_logs', function (Blueprint $table) {
            $table->dropForeign(['parent_anomaly_id']);
            $table->dropIndex('anomaly_deduplication_index');
            $table->dropColumn(['parent_anomaly_id', 'is_duplicate']);
        });
    }
};
