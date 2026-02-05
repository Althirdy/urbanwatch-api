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
        Schema::table('cctv_devices', function (Blueprint $table) {
            $table->dropColumn('device_name');
            $table->string('latitude')->nullable()->after('location_name');
            $table->string('longitude')->nullable()->after('latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cctv_devices', function (Blueprint $table) {
            $table->string('device_name')->after('location_name');
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
