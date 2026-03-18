<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('branch_unit_abbreviation', 50)->nullable()->after('branch_unit_name');
        });

        // Preserve existing values by moving current branch/unit text into abbreviation.
        DB::table('contacts')
            ->whereNull('branch_unit_abbreviation')
            ->update([
                'branch_unit_abbreviation' => DB::raw('branch_unit_name'),
            ]);

        $fullNameMappings = [
            'BEST' => 'Barangay Emergency Services Team',
            'BCCM' => 'Barangay Council for the Care of Minors',
            'BCPC' => 'Barangay Council for the Protection of Children',
            'BDRRM' => 'Barangay Disaster Risk Reduction and Management',
            'BHERT' => 'Barangay Health Emergency Response Team',
            'BHW' => 'Barangay Health Workers',
            'BPSO' => 'Barangay Public Safety Officers',
            'BTMO' => 'Barangay Traffic Management Office',
            'VAWC' => 'Violence Against Women and Children Desk',
        ];

        foreach ($fullNameMappings as $abbreviation => $fullName) {
            DB::table('contacts')
                ->where('branch_unit_abbreviation', $abbreviation)
                ->update(['branch_unit_name' => $fullName]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn('branch_unit_abbreviation');
        });
    }
};
