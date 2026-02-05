<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add location_name to cctv_devices and migrate data from locations table
        Schema::table('cctv_devices', function (Blueprint $table) {
            $table->string('location_name')->nullable()->after('id');
        });

        // Migrate location names from locations table to cctv_devices
        DB::statement('
            UPDATE cctv_devices 
            SET location_name = (
                SELECT location_name FROM locations WHERE locations.id = cctv_devices.location_id
            )
        ');

        // Step 2: Remove foreign key and columns from cctv_devices
        Schema::table('cctv_devices', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropColumn(['location_id', 'brand', 'model', 'resolution', 'fps']);
        });

        // Make location_name required after migration
        Schema::table('cctv_devices', function (Blueprint $table) {
            $table->string('location_name')->nullable(false)->change();
        });

        // Step 3: Remove location_id foreign key and column from uw_devices
        Schema::table('uw_devices', function (Blueprint $table) {
            // Drop foreign key first (before index, since FK depends on the index)
            $table->dropForeign(['location_id']);
        });

        Schema::table('uw_devices', function (Blueprint $table) {
            // Now drop index if exists
            if (Schema::hasIndex('uw_devices', 'uw_devices_location_id_index')) {
                $table->dropIndex('uw_devices_location_id_index');
            }
            $table->dropColumn('location_id');
        });

        // Step 4: Drop location_categories table first (no dependencies)
        Schema::dropIfExists('location_categories');

        // Step 5: Drop locations table
        Schema::dropIfExists('locations');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate locations table
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('location_name');
            $table->string('landmark')->nullable();
            $table->string('barangay');
            $table->string('latitude');
            $table->string('longitude');
            $table->text('description');
            $table->softDeletes();
            $table->timestamps();
        });

        // Recreate location_categories table
        Schema::create('location_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // Add location_id back to uw_devices
        Schema::table('uw_devices', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('device_name')
                ->constrained('locations')->onDelete('set null');
            $table->index('location_id');
        });

        // Add columns back to cctv_devices
        Schema::table('cctv_devices', function (Blueprint $table) {
            $table->foreignId('location_id')->after('id')
                ->constrained('locations')->onDelete('cascade');
            $table->string('brand')->after('status');
            $table->string('model')->after('brand');
            $table->string('resolution')->after('model');
            $table->integer('fps')->after('resolution');
        });

        // Remove location_name from cctv_devices
        Schema::table('cctv_devices', function (Blueprint $table) {
            $table->dropColumn('location_name');
        });
    }
};
