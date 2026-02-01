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
        Schema::table('officials_details', function (Blueprint $table) {
            $table->text('first_name')->change();
            $table->text('middle_name')->nullable()->change();
            $table->text('last_name')->change();
            $table->text('contact_number')->change();
            $table->text('office_address')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('officials_details', function (Blueprint $table) {
            $table->text('first_name')->change();
            $table->text('middle_name')->nullable()->change();
            $table->text('last_name')->change();
            $table->text('contact_number')->change();
            $table->text('office_address')->change();
        });
    }
};
