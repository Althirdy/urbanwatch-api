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
        // 1. Add Indexes to Concerns Table (Section 1)
        Schema::table('concerns', function (Blueprint $table) {
            // Main feed (My Concerns)
            $table->index(['citizen_id', 'is_duplicate', 'created_at'], 'idx_concerns_feed');
            // Archive feed
            $table->index(['citizen_id', 'deleted_at'], 'idx_concerns_archive');
            // Filtering
            $table->index(['citizen_id', 'status'], 'idx_concerns_status');
            $table->index(['citizen_id', 'category'], 'idx_concerns_category');
        });

        // 2. Normalize Accidents Table (Section 7)
        // Convert status and severity to lowercase
        DB::statement("UPDATE accidents SET status = LOWER(status), severity = LOWER(severity)");
        
        // Modify columns to use lowercase enums (using raw SQL for reliability)
        DB::statement("ALTER TABLE accidents MODIFY COLUMN status ENUM('pending', 'in progress', 'resolved') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE accidents MODIFY COLUMN severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low'");

        // Add indexes to Accidents (Section 7)
        Schema::table('accidents', function (Blueprint $table) {
            $table->index(['status', 'occurred_at'], 'idx_accidents_dashboard');
        });

        // 3. Citizen Details Optimization & Encryption Prep (Section 6 & 7)
        Schema::table('citizen_details', function (Blueprint $table) {
            // Add index for admin filtering
            $table->index(['status', 'is_verified'], 'idx_citizen_status');
            
            // Change columns to TEXT to support Laravel Encryption (which increases string length)
            $table->text('first_name')->change();
            $table->text('middle_name')->nullable()->change();
            $table->text('last_name')->change();
            $table->text('phone_number')->change();
            $table->text('address')->change();
        });
        
        // Update Users table for encryption as well
        Schema::table('users', function (Blueprint $table) {
             $table->text('name')->change(); // Encrypting name in User model too
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop Indexes from Concerns
        Schema::table('concerns', function (Blueprint $table) {
            $table->dropIndex('idx_concerns_feed');
            $table->dropIndex('idx_concerns_archive');
            $table->dropIndex('idx_concerns_status');
            $table->dropIndex('idx_concerns_category');
        });

        // 2. Revert Accidents
        Schema::table('accidents', function (Blueprint $table) {
            $table->dropIndex('idx_accidents_dashboard');
        });
        // Note: We don't revert the data back to Title Case as it's a normalization fix.
        // We just revert the schema definition if needed, but usually normalization is permanent.
        DB::statement("ALTER TABLE accidents MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Pending'");
        DB::statement("ALTER TABLE accidents MODIFY COLUMN severity ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low'");

        // 3. Revert Citizen Details
        Schema::table('citizen_details', function (Blueprint $table) {
            $table->dropIndex('idx_citizen_status');
            
            // Revert to strings (Data might be truncated if encrypted, so this is risky in prod, fine for dev)
            $table->string('first_name')->change();
            $table->string('middle_name')->nullable()->change();
            $table->string('last_name')->change();
            $table->string('phone_number')->change();
            $table->string('address')->change();
        });
        
        Schema::table('users', function (Blueprint $table) {
             $table->string('name')->change();
        });
    }
};
