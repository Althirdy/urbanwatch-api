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
            $table->string('rtsp_username')->nullable()->after('primary_rtsp_url');
            $table->string('rtsp_password')->nullable()->after('rtsp_username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cctv_devices', function (Blueprint $table) {
            $table->dropColumn(['rtsp_username', 'rtsp_password']);
        });
    }
};
