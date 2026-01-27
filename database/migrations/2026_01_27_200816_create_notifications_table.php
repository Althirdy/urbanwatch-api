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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('user_type', ['citizen', 'purok_leader'])->index();
            $table->string('type', 50)->index(); // concern_assigned, concern_acknowledged, etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional metadata (concern_id, tracking_code, etc.)
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamps();

            // Composite index for efficient user notification queries
            $table->index(['user_id', 'user_type', 'read_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
