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
        Schema::create('incident_media', function (Blueprint $table) {
            $table->id();
            $table->string('media_type')->default('image'); // e.g., image, video
            $table->text('original_path'); // Cloudinary URL
            $table->text('blurred_path')->nullable(); // Optional blurred version URL
            $table->string('public_id'); // Cloudinary public_id for deletion/transformation
            $table->string('original_filename'); // Original file name
            $table->integer('file_size')->nullable(); // File size in bytes
            $table->string('mime_type')->nullable(); // File MIME type
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_media');
    }
};
