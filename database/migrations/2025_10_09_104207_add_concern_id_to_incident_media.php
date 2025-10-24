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
        Schema::table('incident_media', function (Blueprint $table) {
            // Add polymorphic relationship fields
            $table->string('source_type'); // 'App\Models\Citizen\Concern', 'App\Models\CctvDevices', etc.
            $table->unsignedBigInteger('source_id'); // ID of the source record
            
            // Add source category for easier filtering
            $table->enum('source_category', ['citizen_concern', 'device_snapshot', 'cctv_detection'])->default('citizen_concern');
            
            // Add detection metadata for YOLO detections
            $table->json('detection_metadata')->nullable(); // Store YOLO detection data
            
            // Add device information for device snapshots
            $table->string('device_identifier')->nullable(); // Device ID/name for snapshots
            
            // Add temporal information
            $table->timestamp('captured_at')->nullable(); // When media was actually captured
            
            // Add index for better performance
            $table->index(['source_type', 'source_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incident_media', function (Blueprint $table) {
            $table->dropIndex(['source_type', 'source_id']);
            $table->dropColumn([
                'source_type',
                'source_id', 
                'source_category',
                'detection_metadata',
                'device_identifier',
                'captured_at'
            ]);
        });
    }
};
