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
        Schema::create('public_posts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('report_id');
            $table->unsignedBigInteger('published_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps(); // This creates updated_at and created_at
            $table->softDeletes(); // This creates deleted_at
            $table->enum('status', ['draft', 'published', 'scheduled'])->default('draft');
            
            // Foreign key constraints
            $table->foreign('report_id')->references('id')->on('reports');
            $table->foreign('published_by')->references('id')->on('users');

            // Indexes for better performance
            $table->index('report_id');
            $table->index('published_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public_posts');
    }
};