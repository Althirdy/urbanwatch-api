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
        Schema::table('officials_details', function (Blueprint $table) {
            $table->foreignId('purok_id')->nullable()->after('user_id')->constrained('puroks')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('officials_details', function (Blueprint $table) {
            $table->dropConstrainedForeignId('purok_id');
        });
    }
};
