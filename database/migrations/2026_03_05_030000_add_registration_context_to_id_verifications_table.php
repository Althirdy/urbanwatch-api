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
        Schema::table('id_verifications', function (Blueprint $table) {
            $table->string('failure_code', 64)->nullable()->after('failure_reason');
            $table->decimal('request_latitude', 10, 7)->nullable()->after('device_fingerprint');
            $table->decimal('request_longitude', 10, 7)->nullable()->after('request_latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('id_verifications', function (Blueprint $table) {
            $table->dropColumn(['failure_code', 'request_latitude', 'request_longitude']);
        });
    }
};
