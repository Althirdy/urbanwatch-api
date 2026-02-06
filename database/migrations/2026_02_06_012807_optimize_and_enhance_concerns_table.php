<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Schema Optimization:
     * - ADD: coherence_score and detail_score for AI validation quality tracking.
     * - DELETE: is_duplicate (redundant with parent_concern_id).
     * - DELETE: user_selected_category and user_selected_severity (consolidated into ai_analysis_raw).
     */
    public function up(): void
    {
        Schema::table('concerns', function (Blueprint $table) {
            // Add new AI quality score columns
            if (! Schema::hasColumn('concerns', 'coherence_score')) {
                $table->decimal('coherence_score', 3, 2)->nullable()->after('ai_confidence')
                    ->comment('Agreement between Title, Description, and Image (0.00-1.00)');
            }
            if (! Schema::hasColumn('concerns', 'detail_score')) {
                $table->decimal('detail_score', 3, 2)->nullable()->after('coherence_score')
                    ->comment('Context completeness: Who, What, Where (0.00-1.00)');
            }

            // Remove redundant columns
            if (Schema::hasColumn('concerns', 'is_duplicate')) {
                $table->dropColumn('is_duplicate');
            }
            if (Schema::hasColumn('concerns', 'user_selected_category')) {
                $table->dropColumn('user_selected_category');
            }
            if (Schema::hasColumn('concerns', 'user_selected_severity')) {
                $table->dropColumn('user_selected_severity');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('concerns', function (Blueprint $table) {
            // Remove the new columns
            if (Schema::hasColumn('concerns', 'coherence_score')) {
                $table->dropColumn('coherence_score');
            }
            if (Schema::hasColumn('concerns', 'detail_score')) {
                $table->dropColumn('detail_score');
            }

            // Restore the removed columns
            if (! Schema::hasColumn('concerns', 'is_duplicate')) {
                $table->boolean('is_duplicate')->default(false)->after('parent_concern_id');
            }
            if (! Schema::hasColumn('concerns', 'user_selected_category')) {
                $table->string('user_selected_category')->nullable()->after('category');
            }
            if (! Schema::hasColumn('concerns', 'user_selected_severity')) {
                $table->enum('user_selected_severity', ['low', 'medium', 'high'])->nullable()->after('severity');
            }
        });
    }
};
