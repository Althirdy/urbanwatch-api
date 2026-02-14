<?php

use App\Models\OfficialsDetails;
use App\Models\PurokPinLog;
use App\Models\Purok;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use function Pest\Laravel\{actingAs, assertDatabaseCount, assertDatabaseHas, post};

beforeEach(function () {
    // Create roles
    $this->operatorRole = Roles::create(['name' => 'Operator']);
    $this->purokLeaderRole = Roles::create(['name' => 'Purok Leader']);

    // Create a test purok
    $this->purok = Purok::create([
        'name' => 'Test Purok',
        'color' => '#FF0000',
    ]);

    // Create an operator user
    $this->operator = User::create([
        'name' => 'Test Operator',
        'email' => 'operator@test.com',
        'password' => Hash::make('password123'),
        'role_id' => $this->operatorRole->id,
    ]);

    OfficialsDetails::create([
        'user_id' => $this->operator->id,
        'first_name' => 'Test',
        'last_name' => 'Operator',
        'contact_number' => '09123456789',
        'office_address' => 'Test Address',
        'assigned_brgy' => 'BRGY 176 E',
        'status' => 'active',
    ]);

    // Create a purok leader user
    $this->purokLeader = User::create([
        'name' => 'Test Purok Leader',
        'email' => 'purok@test.com',
        'password' => Hash::make('1234'),
        'role_id' => $this->purokLeaderRole->id,
    ]);

    OfficialsDetails::create([
        'user_id' => $this->purokLeader->id,
        'purok_id' => $this->purok->id,
        'first_name' => 'Test',
        'last_name' => 'Leader',
        'contact_number' => '09987654321',
        'office_address' => 'Test Address',
        'assigned_brgy' => 'Test Purok',
        'status' => 'active',
    ]);
});

test('purok leader creation auto-generates PIN', function () {
    actingAs($this->operator);

    $response = post('/user', [
        'first_name' => 'New',
        'middle_name' => 'Test',
        'last_name' => 'Leader',
        'email' => 'newleader@test.com',
        'phone_number' => '09111222333',
        'role_id' => $this->purokLeaderRole->id,
        'assigned_brgy' => 'Test Purok',
        'purok_id' => $this->purok->id,
        // Note: NO password field sent
    ]);

    $response->assertRedirect(route('users'));
    $response->assertSessionHas('success');
    $response->assertSessionHas('generated_pin');

    // Verify user was created
    assertDatabaseHas('users', [
        'email' => 'newleader@test.com',
        'role_id' => $this->purokLeaderRole->id,
    ]);

    // Verify PIN was hashed
    $user = User::where('email', 'newleader@test.com')->first();
    expect($user->password)->not->toBeNull();
    expect(strlen($user->password))->toBeGreaterThan(10); // Hashed password should be long
});

test('operator can reset purok leader PIN with correct password', function () {
    actingAs($this->operator);

    $oldPasswordHash = $this->purokLeader->password;

    $response = post("/user/{$this->purokLeader->id}/reset-pin", [
        'operator_password' => 'password123',
        'reason' => 'Forgot PIN',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');
    $response->assertSessionHas('generated_pin');

    // Verify PIN was changed
    $this->purokLeader->refresh();
    expect($this->purokLeader->password)->not->toBe($oldPasswordHash);

    // Verify log entry was created
    assertDatabaseHas('purok_pin_logs', [
        'purok_leader_id' => $this->purokLeader->id,
        'reset_by_operator_id' => $this->operator->id,
        'reason' => 'Forgot PIN',
    ]);
});

test('operator cannot reset PIN with incorrect password', function () {
    actingAs($this->operator);

    $oldPasswordHash = $this->purokLeader->password;

    $response = post("/user/{$this->purokLeader->id}/reset-pin", [
        'operator_password' => 'wrongpassword',
        'reason' => 'Test',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('operator_password');

    // Verify PIN was NOT changed
    $this->purokLeader->refresh();
    expect($this->purokLeader->password)->toBe($oldPasswordHash);

    // Verify no log entry was created
    assertDatabaseCount('purok_pin_logs', 0);
});

test('PIN reset invalidates existing tokens', function () {
    actingAs($this->operator);

    // Create a token for the purok leader
    $token = $this->purokLeader->createToken('test-device')->plainTextToken;
    expect($this->purokLeader->tokens()->count())->toBe(1);

    // Reset PIN
    post("/user/{$this->purokLeader->id}/reset-pin", [
        'operator_password' => 'password123',
    ]);

    // Verify tokens were deleted
    $this->purokLeader->refresh();
    expect($this->purokLeader->tokens()->count())->toBe(0);
});

test('PIN reset requires operator password', function () {
    actingAs($this->operator);

    $response = post("/user/{$this->purokLeader->id}/reset-pin", [
        'reason' => 'Test',
        // Missing operator_password
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('operator_password');
});

test('only purok leaders can have PIN reset via this method', function () {
    actingAs($this->operator);

    // Try to reset operator's password using PIN reset method
    $response = post("/user/{$this->operator->id}/reset-pin", [
        'operator_password' => 'password123',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');
});

test('generated PIN is 4 digits', function () {
    actingAs($this->operator);

    $response = post("/user/{$this->purokLeader->id}/reset-pin", [
        'operator_password' => 'password123',
    ]);

    $generatedPin = session('generated_pin');
    expect($generatedPin)->not->toBeNull();
    expect(strlen($generatedPin))->toBe(4);
    expect(ctype_digit($generatedPin))->toBeTrue();
});

test('audit log captures optional reason', function () {
    actingAs($this->operator);

    // With reason
    post("/user/{$this->purokLeader->id}/reset-pin", [
        'operator_password' => 'password123',
        'reason' => 'Security concern',
    ]);

    assertDatabaseHas('purok_pin_logs', [
        'purok_leader_id' => $this->purokLeader->id,
        'reason' => 'Security concern',
    ]);

    // Create another purok leader for second test
    $anotherLeader = User::create([
        'name' => 'Another Leader',
        'email' => 'another@test.com',
        'password' => Hash::make('1234'),
        'role_id' => $this->purokLeaderRole->id,
    ]);

    OfficialsDetails::create([
        'user_id' => $anotherLeader->id,
        'purok_id' => $this->purok->id,
        'first_name' => 'Another',
        'last_name' => 'Leader',
        'contact_number' => '09888777666',
        'office_address' => 'Test',
        'assigned_brgy' => 'Test',
        'status' => 'active',
    ]);

    // Without reason
    post("/user/{$anotherLeader->id}/reset-pin", [
        'operator_password' => 'password123',
    ]);

    assertDatabaseHas('purok_pin_logs', [
        'purok_leader_id' => $anotherLeader->id,
        'reason' => null,
    ]);
});

test('audit log captures IP address and user agent', function () {
    actingAs($this->operator);

    $response = post("/user/{$this->purokLeader->id}/reset-pin", [
        'operator_password' => 'password123',
    ]);

    $log = PurokPinLog::where('purok_leader_id', $this->purokLeader->id)->first();
    expect($log->ip_address)->not->toBeNull();
    expect($log->user_agent)->not->toBeNull();
});
