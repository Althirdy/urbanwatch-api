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
        Schema::create('anomaly_logs', function (Blueprint $table) {
            $table->id();
            $table->integer('device_id'); // Device ID sent by IoT box
            $table->foreignId('iot_box_id')->constrained('uw_devices')->onDelete('cascade');
            $table->enum('anomaly_type', ['sound_anomaly', 'anti_tampering']);
            $table->string('image')->nullable(); // Path of image from FileUploadService
            $table->text('details')->nullable(); // Sensor values (JSON or text)
            $table->boolean('is_confirmed')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anomaly_logs');
    }
};
