<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purok_pin_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purok_leader_id')->constrained('users')->onDelete('cascade'); // The purok leader whose PIN was reset
            $table->foreignId('reset_by_operator_id')->nullable()->constrained('users')->onDelete('cascade'); // Operator who reset the PIN (null for user-initiated changes)
            $table->text('reason')->nullable(); // Optional reason for PIN reset
            $table->timestamp('created_at')->useCurrent(); // When the PIN was reset

            $table->index(['purok_leader_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purok_pin_logs');
    }
};
