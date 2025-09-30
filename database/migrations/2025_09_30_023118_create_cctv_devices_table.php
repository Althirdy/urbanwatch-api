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
        Schema::create('cctv_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->onDelete('cascade');
            $table->string('device_name');
            $table->string('primary_rtsp_url');
            $table->string('backup_rtsp_url')->nullable();
            $table->string('status');
            $table->string('brand');
            $table->string('model');
            $table->string('resolution');
            $table->integer('bitrate');
            $table->integer('fps');
            $table->date('installation_date');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cctv_devices');
    }
};
