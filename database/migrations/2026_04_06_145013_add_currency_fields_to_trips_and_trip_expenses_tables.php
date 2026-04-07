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
        Schema::table('trips', function (Blueprint $table) {
            $table->string('default_currency', 3)->default('USD')->after('members_can_edit_entries');
        });

        Schema::table('trip_expenses', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_expenses', function (Blueprint $table) {
            $table->dropColumn('currency');
        });

        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn('default_currency');
        });
    }
};
