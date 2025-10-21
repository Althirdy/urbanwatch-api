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
            $table->foreignId('concern_id')->constrained('concerns')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incident_media', function (Blueprint $table) {
            //
            $table->dropForeign(['concern_id']);
            $table->dropColumn('concern_id');
        });
    }
};
