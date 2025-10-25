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
        Schema::create('uw_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_name');
            $table->foreignId('location_id')->nullable()->constrained('locations')->onDelete('set null');
            $table->foreignId('cctv_id')->nullable()->constrained('cctv_devices')->onDelete('set null');
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            
            // Custom location fields (when location_id is null)
            $table->string('custom_address')->nullable();
            $table->decimal('custom_latitude', 10, 7)->nullable();
            $table->decimal('custom_longitude', 10, 7)->nullable();
            
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uw_devices');
    }
};
