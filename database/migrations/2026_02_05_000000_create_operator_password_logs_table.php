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
        Schema::create('operator_password_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('operator_id')->constrained('users')->onDelete('cascade'); // The operator whose password was changed
            $table->foreignId('changed_by')->constrained('users')->onDelete('cascade'); // Who made the change
            $table->string('action')->default('reset'); // 'reset', 'changed', etc.
            $table->text('reason')->nullable(); // Reason for the password change
            $table->string('ip_address')->nullable(); // IP address of who made the change
            $table->string('user_agent')->nullable(); // Browser/device info
            $table->timestamps();

            $table->index(['operator_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operator_password_logs');
    }
};
