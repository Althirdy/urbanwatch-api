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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('report_type');
            $table->text('transcript');
            $table->text('description');
            $table->string('latitute');
            $table->string('longtitude');
            $table->boolean('is_acknowledge')->default(false);
            $table->foreignId('acknowledge_by')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('status')->default('On going');
            $table->timestamps();
            $table->softDeletes();

            // Add indexes for better performance
            $table->index('report_type');
            $table->index('is_acknowledge');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};