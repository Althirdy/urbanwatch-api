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
        Schema::table('concerns', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_concern_id')->nullable()->after('id');
            $table->boolean('is_duplicate')->default(false)->after('parent_concern_id');

            $table->foreign('parent_concern_id')
                ->references('id')
                ->on('concerns')
                ->onDelete('set null');

            // Index for faster deduplication queries
            // Note: latitude/longitude are decimals in the migration, so we can index them for B-Tree range scans.
            $table->index(['latitude', 'longitude', 'created_at', 'category'], 'concern_deduplication_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('concerns', function (Blueprint $table) {
            $table->dropForeign(['parent_concern_id']);
            $table->dropIndex('concern_deduplication_index');
            $table->dropColumn(['parent_concern_id', 'is_duplicate']);
        });
    }
};
