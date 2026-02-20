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
            $columnsToDrop = collect(['ip_address', 'user_agent'])
                ->filter(fn ($col) => Schema::hasColumn('purok_pin_logs', $col))
                ->all();

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purok_pin_logs', function (Blueprint $table) {
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
        });
    }
};
