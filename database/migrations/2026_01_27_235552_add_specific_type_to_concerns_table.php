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
            if (! Schema::hasColumn('concerns', 'specific_type')) {
                $table->string('specific_type')->nullable()->after('ai_category');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('concerns', function (Blueprint $table) {
            if (Schema::hasColumn('concerns', 'specific_type')) {
                $table->dropColumn('specific_type');
            }
        });
    }
};
