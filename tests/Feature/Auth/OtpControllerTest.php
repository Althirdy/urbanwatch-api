<?php

namespace Tests\Feature\Auth;

use App\Jobs\SendOtpJob;
use App\Models\CitizenDetails;
use App\Models\IdVerification;
use App\Models\OfficialsDetails;
use App\Models\Roles;
use App\Models\User;
use App\Services\AbstractApiService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class OtpControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        RateLimiter::clear('otp:verify:09123456789');
        RateLimiter::clear('otp:verify:09123456788');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_registration_otp_rejects_undeliverable_email_with_explicit_code(): void
    {
        Queue::fake();
        $verification = $this->createVerification();

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')
                ->once()
                ->andReturn([
                    'valid' => false,
                    'deliverable' => false,
                    'disposable' => false,
                    'is_format_valid' => true,
                    'status' => 'undeliverable',
                    'status_detail' => 'invalid_mailbox',
                    'quality_score' => 0.0,
                    'suggestion' => null,
                    'bypass' => false,
                    'error' => null,
                ]);
        });

        $response = $this->postJson('/api/v1/auth/request_otp', [
            'phone' => '09123456789',
            'email' => 'disposable@example.com',
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'EMAIL_UNDELIVERABLE',
                'message' => 'Email is undeliverable. Please use a real and reachable email address.',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_registration_otp_rejects_disposable_email_with_explicit_code(): void
    {
        Queue::fake();
        $verification = $this->createVerification();

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')
                ->once()
                ->andReturn([
                    'valid' => false,
                    'deliverable' => true,
                    'disposable' => true,
                    'is_format_valid' => true,
                    'status' => 'deliverable',
                    'status_detail' => 'valid_email',
                    'quality_score' => 0.2,
                    'suggestion' => null,
                    'bypass' => false,
                    'error' => null,
                ]);
        });

        $response = $this->postJson('/api/v1/auth/request_otp', [
            'phone' => '09123456789',
            'email' => 'temp-mail@example.com',
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'EMAIL_DISPOSABLE',
                'message' => 'Disposable email addresses are not allowed. Please use your primary email.',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_registration_otp_rejects_invalid_email_format_with_explicit_code(): void
    {
        Queue::fake();
        $verification = $this->createVerification();

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')
                ->once()
                ->andReturn([
                    'valid' => false,
                    'deliverable' => false,
                    'disposable' => false,
                    'is_format_valid' => false,
                    'status' => 'undeliverable',
                    'status_detail' => 'invalid_format',
                    'quality_score' => 0.0,
                    'suggestion' => null,
                    'bypass' => false,
                    'error' => null,
                ]);
        });

        $response = $this->postJson('/api/v1/auth/request_otp', [
            'phone' => '09123456789',
            'email' => 'bad-format@example.com',
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'EMAIL_INVALID_FORMAT',
                'message' => 'Please enter a valid email format.',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_registration_otp_allows_send_when_abstract_is_bypassed(): void
    {
        Queue::fake();
        $verification = $this->createVerification();

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')
                ->once()
                ->andReturn([
                    'valid' => true,
                    'deliverable' => true,
                    'disposable' => false,
                    'is_format_valid' => true,
                    'status' => 'bypassed',
                    'status_detail' => 'abstract_api_unavailable',
                    'quality_score' => 1.0,
                    'suggestion' => null,
                    'bypass' => true,
                    'error' => 'Failed to connect to Abstract API service.',
                ]);
        });

        $response = $this->postJson('/api/v1/auth/request_otp', [
            'phone' => '09123456789',
            'email' => 'fallback@example.com',
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'phone' => '09123456789',
                    'expires_in' => 5,
                ],
            ]);

        Queue::assertPushed(SendOtpJob::class);
    }

    public function test_resend_otp_does_not_require_or_recheck_email_and_uses_five_minute_ttl(): void
    {
        Queue::fake();

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')->never();
        });

        $response = $this->postJson('/api/v1/otp/resend', [
            'phone' => '09123456788',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'phone' => '09123456788',
                    'expires_in' => 5,
                ],
            ]);

        Queue::assertPushed(SendOtpJob::class);
    }

    public function test_otp_expires_after_five_minutes(): void
    {
        Queue::fake();

        Carbon::setTestNow(now());

        $requestResponse = $this->postJson('/api/v1/otp/request', [
            'phone' => '09123456789',
        ]);

        $requestResponse->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'expires_in' => 5,
                ],
            ]);

        $code = Cache::get('otp_09123456789');
        $this->assertNotNull($code);

        Carbon::setTestNow(now()->addMinutes(6));

        $verifyResponse = $this->postJson('/api/v1/otp/verify', [
            'phone' => '09123456789',
            'otp' => (string) $code,
        ]);

        $verifyResponse->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'OTP has expired or does not exist. Please request a new one.',
            ]);
    }

    public function test_registration_otp_rejects_phone_already_registered_to_citizen(): void
    {
        Queue::fake();
        $verification = $this->createVerification();

        $citizenRole = Roles::create([
            'name' => 'Citizen',
            'description' => 'Citizen role',
        ]);

        $user = User::create([
            'name' => 'Existing Citizen',
            'email' => 'existing-citizen@example.com',
            'password' => 'StrongPass1!',
            'role_id' => $citizenRole->id,
            'email_verified_at' => now(),
        ]);

        CitizenDetails::create([
            'user_id' => $user->id,
            'pcn_number' => '1111-2222-3333-4444',
            'first_name' => 'Existing',
            'middle_name' => null,
            'last_name' => 'Citizen',
            'suffix' => null,
            'date_of_birth' => '1998-01-01',
            'phone_number' => '09123456789',
            'address' => 'PH9 Block 1',
            'barangay' => 'Barangay 176-E',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postal_code' => '1400',
            'is_verified' => true,
            'status' => 'active',
        ]);

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')->never();
        });

        $response = $this->postJson('/api/v1/auth/request_otp', [
            'phone' => '09123456789',
            'email' => 'new-email@example.com',
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'PHONE_ALREADY_REGISTERED',
                'message' => 'This phone number is already registered. Please use a different phone number.',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_registration_otp_rejects_phone_already_registered_to_official_using_plus_63_format(): void
    {
        Queue::fake();
        $verification = $this->createVerification();

        $operatorRole = Roles::create([
            'name' => 'Operator',
            'description' => 'Operator role',
        ]);

        $user = User::create([
            'name' => 'Existing Official',
            'email' => 'existing-official@example.com',
            'password' => 'StrongPass1!',
            'role_id' => $operatorRole->id,
            'email_verified_at' => now(),
        ]);

        OfficialsDetails::create([
            'user_id' => $user->id,
            'id_number' => 'OP-1001',
            'first_name' => 'Existing',
            'middle_name' => null,
            'last_name' => 'Official',
            'suffix' => null,
            'contact_number' => '+63 912-345-6789',
            'office_address' => 'Barangay Hall',
            'assigned_brgy' => 'Barangay 176-E',
            'status' => 'active',
        ]);

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')->never();
        });

        $response = $this->postJson('/api/v1/auth/request_otp', [
            'phone' => '09123456789',
            'email' => 'new-email-2@example.com',
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'PHONE_ALREADY_REGISTERED',
                'message' => 'This phone number is already registered. Please use a different phone number.',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_registration_otp_rejects_when_id_verification_is_not_completed(): void
    {
        Queue::fake();

        $verification = $this->createVerification('pending');

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')->never();
        });

        $response = $this->postJson('/api/v1/auth/request_otp', [
            'phone' => '09123456789',
            'email' => 'pending-id@example.com',
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'code' => 'ID_VERIFICATION_NOT_COMPLETED',
                'ocrStatus' => 'pending',
            ]);

        Queue::assertNothingPushed();
    }

    public function test_registration_otp_rejects_when_id_verification_failed(): void
    {
        Queue::fake();

        $verification = $this->createVerification(
            'failed',
            'PCN_ALREADY_REGISTERED',
            'This National ID is already registered in UrbanWatch.'
        );

        $this->mock(AbstractApiService::class, function ($mock) {
            $mock->shouldReceive('validateEmail')->never();
        });

        $response = $this->postJson('/api/v1/auth/request_otp', [
            'phone' => '09123456789',
            'email' => 'failed-id@example.com',
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'ID_VERIFICATION_FAILED',
                'ocrStatus' => 'failed',
                'failureCode' => 'PCN_ALREADY_REGISTERED',
                'failureReason' => 'This National ID is already registered in UrbanWatch.',
            ]);

        Queue::assertNothingPushed();
    }

    private function createVerification(
        string $status = 'completed',
        ?string $failureCode = null,
        ?string $failureReason = null
    ): IdVerification {
        return IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => $status,
            'image_disk' => 'local',
            'image_path' => null,
            'expires_at' => now()->addMinutes(10),
            'failure_code' => $failureCode,
            'failure_reason' => $failureReason,
        ]);
    }
}
