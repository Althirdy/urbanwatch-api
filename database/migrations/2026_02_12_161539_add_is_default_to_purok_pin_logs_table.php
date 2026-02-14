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
        Schema::table('purok_pin_logs', function (Blueprint $table) {
            // Add is_default column (tracks if PIN is operator-generated vs user-changed)
            // Default true for backward compatibility - existing logs are operator-generated
            $table->boolean('is_default')->default(true)->after('reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purok_pin_logs', function (Blueprint $table) {
            $table->dropColumn('is_default');
        });
    }
};
