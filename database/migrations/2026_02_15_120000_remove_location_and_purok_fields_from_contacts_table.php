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
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex('contacts_active_type_purok_idx');
            $table->dropConstrainedForeignId('purok_id');
            $table->dropColumn(['location', 'latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('location')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->foreignId('purok_id')
                ->nullable()
                ->after('longitude')
                ->constrained('puroks')
                ->nullOnDelete();

            $table->index(['active', 'responder_type', 'purok_id'], 'contacts_active_type_purok_idx');
        });
    }
};
