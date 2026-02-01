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
            $table->string('device_id')->change();
        });

        Schema::table('anomaly_logs', function (Blueprint $table) {
            $table->string('device_id')->change();
            $table->enum('anomaly_type', ['sound_anomaly', 'anti_tampering', 'crowded'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('uw_devices', function (Blueprint $table) {
            $table->integer('device_id')->change();
        });

        Schema::table('anomaly_logs', function (Blueprint $table) {
            $table->integer('device_id')->change();
            $table->enum('anomaly_type', ['sound_anomaly', 'anti_tampering'])->change();
        });
    }
};
