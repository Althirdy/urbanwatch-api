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
        Schema::create('id_verifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('verification_id')->unique();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'expired'])->default('pending')->index();
            $table->string('image_disk', 32)->default('local');
            $table->string('image_path')->nullable();
            $table->json('result_json')->nullable();
            $table->unsignedTinyInteger('confidence')->nullable();
            $table->json('flags')->nullable();
            $table->text('failure_reason')->nullable();
            $table->string('request_ip', 45)->nullable()->index();
            $table->string('device_fingerprint', 191)->nullable()->index();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('deleted_image_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('id_verifications');
    }
};
