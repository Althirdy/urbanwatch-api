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

            // Foreign key constraint (optional but good practice)
            $table->foreign('parent_concern_id')->references('id')->on('concerns')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('concerns', function (Blueprint $table) {
            $table->dropForeign(['parent_concern_id']);
            $table->dropColumn(['parent_concern_id', 'is_duplicate']);
        });
    }
};
