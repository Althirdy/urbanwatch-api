<?php

namespace Tests\Feature\Auth;

use App\Jobs\SendOtpJob;
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
}
