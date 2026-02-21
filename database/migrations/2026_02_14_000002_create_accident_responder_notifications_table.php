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
        Schema::create('accident_responder_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('accident_id')->constrained('accidents')->cascadeOnDelete();
            $table->string('incident_class');
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->string('phone_used')->nullable();
            $table->enum('send_target', ['primary', 'backup'])->nullable();
            $table->enum('status', ['sent', 'failed', 'skipped_cooldown', 'skipped_no_contacts']);
            $table->json('provider_response')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['accident_id', 'incident_class', 'created_at'], 'arn_accident_class_created_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accident_responder_notifications');
    }
};
