<?php

namespace Tests\Feature\Auth;

use App\Jobs\ProcessNationalIdOcrJob;
use App\Models\CitizenDetails;
use App\Models\IdVerification;
use App\Models\User;
use App\Services\GeminiService;
use App\Services\ImageProcessingService;
use App\Services\RegistrationEligibilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class AsyncOcrRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Queue::fake();

        DB::table('roles')->insert([
            'id' => 3,
            'name' => 'Citizen',
            'description' => 'Citizen role',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_it_starts_async_id_verification_and_dispatches_job(): void
    {
        $response = $this->postJson('/api/v1/auth/ocr/start', [
            'image' => UploadedFile::fake()->image('national-id.jpg', 1200, 800),
            'deviceFingerprint' => 'test-device-123',
            'latitude' => 14.7820134,
            'longitude' => 121.0412457,
        ]);

        $response->assertStatus(202)
            ->assertJson([
                'success' => true,
                'message' => 'ID verification started successfully.',
            ])
            ->assertJsonStructure([
                'data' => ['verificationId', 'status', 'expiresAt'],
            ]);

        $verificationId = $response->json('data.verificationId');
        $this->assertNotNull($verificationId);

        $verification = IdVerification::where('verification_id', $verificationId)->first();
        $this->assertNotNull($verification);
        $this->assertSame('pending', $verification->status);
        $this->assertSame(14.7820134, $verification->request_latitude);
        $this->assertSame(121.0412457, $verification->request_longitude);

        Storage::disk('local')->assertExists($verification->image_path);

        Queue::assertPushed(ProcessNationalIdOcrJob::class, function (ProcessNationalIdOcrJob $job) use ($verification) {
            return $job->idVerificationId === $verification->id;
        });
    }

    public function test_it_applies_10_second_cooldown_for_same_device_fingerprint(): void
    {
        Carbon::setTestNow(now());

        $payload = [
            'image' => UploadedFile::fake()->image('national-id.jpg', 1200, 800),
            'deviceFingerprint' => 'same-device',
        ];

        $first = $this->postJson('/api/v1/auth/ocr/start', $payload);
        $first->assertStatus(202);

        $second = $this->postJson('/api/v1/auth/ocr/start', [
            'image' => UploadedFile::fake()->image('national-id-2.jpg', 1200, 800),
            'deviceFingerprint' => 'same-device',
        ]);

        $second->assertStatus(429)
            ->assertJson([
                'success' => false,
                'code' => 'OCR_RATE_LIMITED',
                'lock_type' => 'cooldown',
            ]);

        $this->assertGreaterThanOrEqual(1, (int) $second->json('seconds'));
        $this->assertLessThanOrEqual(10, (int) $second->json('seconds'));
    }

    public function test_it_allows_immediate_retry_for_different_device_fingerprint(): void
    {
        $first = $this->postJson('/api/v1/auth/ocr/start', [
            'image' => UploadedFile::fake()->image('national-id.jpg', 1200, 800),
            'deviceFingerprint' => 'device-a',
        ]);
        $first->assertStatus(202);

        $second = $this->postJson('/api/v1/auth/ocr/start', [
            'image' => UploadedFile::fake()->image('national-id-2.jpg', 1200, 800),
            'deviceFingerprint' => 'device-b',
        ]);
        $second->assertStatus(202);
    }

    public function test_it_returns_completed_status_with_extracted_data_when_ready(): void
    {
        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'completed',
            'image_disk' => 'local',
            'image_path' => null,
            'result_json' => [
                'data' => [
                    'pcnNumber' => '1234-5678-9012-3456',
                    'firstName' => 'Juan',
                    'lastName' => 'Dela Cruz',
                    'middleName' => 'Santos',
                    'dateOfBirth' => '01/01/2000',
                    'address' => '123 Street',
                    'barangay' => 'Barangay 176',
                    'city' => 'Caloocan',
                    'province' => 'Metro Manila',
                    'region' => 'NCR',
                    'postalCode' => '1400',
                ],
            ],
            'confidence' => 96,
            'flags' => [
                'back_side_detected' => false,
                'is_authentic' => true,
                'is_outside_allowed_area' => false,
            ],
            'expires_at' => now()->addMinutes(10),
            'processed_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/auth/ocr/status/{$verification->verification_id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'verificationId' => $verification->verification_id,
                    'status' => 'completed',
                    'confidenceScore' => 96,
                ],
            ])
            ->assertJsonStructure([
                'data' => ['verificationId', 'status', 'extractedData', 'flags'],
            ]);
    }

    public function test_it_returns_not_found_for_unknown_verification_id(): void
    {
        $response = $this->getJson('/api/v1/auth/ocr/status/does-not-exist');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Verification request not found.',
            ]);
    }

    public function test_it_marks_pending_verification_as_expired_and_deletes_temp_image(): void
    {
        $verificationId = (string) \Illuminate\Support\Str::uuid();
        $imagePath = "ocr-temp/{$verificationId}.jpg";
        Storage::disk('local')->put($imagePath, 'temporary-image-content');

        $verification = IdVerification::create([
            'verification_id' => $verificationId,
            'status' => 'pending',
            'image_disk' => 'local',
            'image_path' => $imagePath,
            'expires_at' => now()->subMinute(),
        ]);

        Storage::disk('local')->assertExists($imagePath);

        $response = $this->getJson("/api/v1/auth/ocr/status/{$verification->verification_id}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'verificationId' => $verification->verification_id,
                    'status' => 'expired',
                    'failureReason' => 'Verification request expired. Please upload your ID again.',
                ],
            ]);

        $verification->refresh();
        $this->assertSame('expired', $verification->status);
        $this->assertNull($verification->image_path);
        $this->assertNotNull($verification->deleted_image_at);
        Storage::disk('local')->assertMissing($imagePath);
    }

    public function test_it_blocks_registration_when_id_verification_is_not_completed(): void
    {
        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'pending',
            'image_disk' => 'local',
            'image_path' => null,
            'expires_at' => now()->addMinutes(10),
        ]);

        $token = Crypt::encryptString(json_encode([
            'phone' => '09123456789',
            'expires_at' => Carbon::now()->addMinutes(10)->toIso8601String(),
        ]));

        $response = $this->postJson('/api/v1/auth/register/complete', [
            'email' => 'pending@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'firstName' => 'Juan',
            'middleName' => 'Santos',
            'lastName' => 'Dela Cruz',
            'suffix' => null,
            'dateOfBirth' => '2000-01-01',
            'phoneNumber' => '09123456789',
            'address' => '123 Street',
            'barangay' => 'Barangay 176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postalCode' => '1400',
            'pcnNumber' => '1234-5678-9012-3456',
            'verificationToken' => $token,
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'ID verification is not complete yet. Please wait.',
            ]);
    }

    public function test_it_registers_successfully_when_otp_and_id_verification_are_valid(): void
    {
        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'completed',
            'image_disk' => 'local',
            'image_path' => null,
            'result_json' => [
                'data' => [
                    'pcnNumber' => '1234-5678-9012-3456',
                ],
            ],
            'confidence' => 95,
            'expires_at' => now()->addMinutes(10),
            'processed_at' => now(),
        ]);

        $token = Crypt::encryptString(json_encode([
            'phone' => '09123456789',
            'expires_at' => Carbon::now()->addMinutes(10)->toIso8601String(),
        ]));

        $response = $this->postJson('/api/v1/auth/register/complete', [
            'email' => 'valid@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'firstName' => 'Juan',
            'middleName' => 'Santos',
            'lastName' => 'Dela Cruz',
            'suffix' => null,
            'dateOfBirth' => '2000-01-01',
            'phoneNumber' => '09123456789',
            'address' => '123 Street',
            'barangay' => 'Barangay 176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postalCode' => '1400',
            'pcnNumber' => '1234-5678-9012-3456',
            'verificationToken' => $token,
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful',
            ])
            ->assertJsonStructure([
                'data' => ['token', 'refreshToken', 'user'],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'valid@example.com',
            'role_id' => 3,
        ]);

        $citizenDetails = CitizenDetails::where('pcn_number', '1234-5678-9012-3456')->first();
        $this->assertNotNull($citizenDetails);
        $this->assertSame('09123456789', $citizenDetails->phone_number);
    }

    public function test_it_registers_successfully_when_verified_pcn_format_differs_from_payload(): void
    {
        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'completed',
            'image_disk' => 'local',
            'image_path' => null,
            'result_json' => [
                'data' => [
                    'pcnNumber' => '1234-5678-9012-3456',
                ],
            ],
            'confidence' => 95,
            'expires_at' => now()->addMinutes(10),
            'processed_at' => now(),
        ]);

        $token = Crypt::encryptString(json_encode([
            'phone' => '09123456782',
            'expires_at' => Carbon::now()->addMinutes(10)->toIso8601String(),
        ]));

        $response = $this->postJson('/api/v1/auth/register/complete', [
            'email' => 'valid-format-variant@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'firstName' => 'Maria',
            'middleName' => 'Santos',
            'lastName' => 'Dela Cruz',
            'suffix' => null,
            'dateOfBirth' => '2000-01-01',
            'phoneNumber' => '09123456782',
            'address' => '123 Street',
            'barangay' => 'Barangay 176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postalCode' => '1400',
            'pcnNumber' => '1234567890123456',
            'verificationToken' => $token,
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful',
            ]);

        $citizenDetails = CitizenDetails::where('pcn_number', '1234-5678-9012-3456')->first();
        $this->assertNotNull($citizenDetails);
        $this->assertSame('09123456782', $citizenDetails->phone_number);
    }

    public function test_it_registers_successfully_even_when_postal_code_is_missing(): void
    {
        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'completed',
            'image_disk' => 'local',
            'image_path' => null,
            'result_json' => [
                'data' => [
                    'pcnNumber' => '1234-1111-2222-3333',
                ],
            ],
            'confidence' => 95,
            'expires_at' => now()->addMinutes(10),
            'processed_at' => now(),
        ]);

        $token = Crypt::encryptString(json_encode([
            'phone' => '09123456780',
            'expires_at' => Carbon::now()->addMinutes(10)->toIso8601String(),
        ]));

        $response = $this->postJson('/api/v1/auth/register/complete', [
            'email' => 'missing-postal@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'firstName' => 'Juan',
            'middleName' => 'Santos',
            'lastName' => 'Dela Cruz',
            'suffix' => null,
            'dateOfBirth' => '2000-01-01',
            'phoneNumber' => '09123456780',
            'address' => '123 Street',
            'barangay' => 'Barangay 176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'pcnNumber' => '1234-1111-2222-3333',
            'verificationToken' => $token,
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'missing-postal@example.com',
            'role_id' => 3,
        ]);

        $citizenDetails = CitizenDetails::where('pcn_number', '1234-1111-2222-3333')->first();
        $this->assertNotNull($citizenDetails);
        $this->assertSame('', $citizenDetails->postal_code);
    }

    public function test_it_accepts_postal_code_snake_case_payload_key(): void
    {
        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'completed',
            'image_disk' => 'local',
            'image_path' => null,
            'result_json' => [
                'data' => [
                    'pcnNumber' => '1234-9999-8888-7777',
                ],
            ],
            'confidence' => 95,
            'expires_at' => now()->addMinutes(10),
            'processed_at' => now(),
        ]);

        $token = Crypt::encryptString(json_encode([
            'phone' => '09123456781',
            'expires_at' => Carbon::now()->addMinutes(10)->toIso8601String(),
        ]));

        $response = $this->postJson('/api/v1/auth/register/complete', [
            'email' => 'snake-postal@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'firstName' => 'Juan',
            'middleName' => 'Santos',
            'lastName' => 'Dela Cruz',
            'suffix' => null,
            'dateOfBirth' => '2000-01-01',
            'phoneNumber' => '09123456781',
            'address' => '123 Street',
            'barangay' => 'Barangay 176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postal_code' => '1400',
            'pcnNumber' => '1234-9999-8888-7777',
            'verificationToken' => $token,
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful',
            ]);

        $citizenDetails = CitizenDetails::where('pcn_number', '1234-9999-8888-7777')->first();
        $this->assertNotNull($citizenDetails);
        $this->assertSame('1400', $citizenDetails->postal_code);
    }

    public function test_it_blocks_registration_when_verified_pcn_does_not_match_payload(): void
    {
        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'completed',
            'image_disk' => 'local',
            'image_path' => null,
            'result_json' => [
                'data' => [
                    'pcnNumber' => '9999-9999-9999-9999',
                ],
            ],
            'confidence' => 93,
            'expires_at' => now()->addMinutes(10),
            'processed_at' => now(),
        ]);

        $token = Crypt::encryptString(json_encode([
            'phone' => '09123456789',
            'expires_at' => Carbon::now()->addMinutes(10)->toIso8601String(),
        ]));

        $response = $this->postJson('/api/v1/auth/register/complete', [
            'email' => 'mismatch@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'firstName' => 'Juan',
            'middleName' => 'Santos',
            'lastName' => 'Dela Cruz',
            'suffix' => null,
            'dateOfBirth' => '2000-01-01',
            'phoneNumber' => '09123456789',
            'address' => '123 Street',
            'barangay' => 'Barangay 176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postalCode' => '1400',
            'pcnNumber' => '1234-5678-9012-3456',
            'verificationToken' => $token,
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'PCN does not match verified ID data.',
            ]);
    }

    public function test_it_blocks_registration_when_phone_number_is_already_registered(): void
    {
        $existingUser = User::create([
            'name' => 'Existing Citizen',
            'email' => 'existing-phone@example.com',
            'password' => 'StrongPass1!',
            'role_id' => 3,
            'email_verified_at' => now(),
        ]);

        CitizenDetails::create([
            'user_id' => $existingUser->id,
            'pcn_number' => '3333-4444-5555-6666',
            'first_name' => 'Existing',
            'middle_name' => null,
            'last_name' => 'Citizen',
            'suffix' => null,
            'date_of_birth' => '1999-01-01',
            'phone_number' => '09129999999',
            'address' => 'PH9, Bagong Silang',
            'barangay' => 'Barangay 176-E',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postal_code' => '1400',
            'is_verified' => true,
            'status' => 'active',
        ]);

        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'completed',
            'image_disk' => 'local',
            'image_path' => null,
            'result_json' => [
                'data' => [
                    'pcnNumber' => '5555-6666-7777-8888',
                ],
            ],
            'confidence' => 95,
            'expires_at' => now()->addMinutes(10),
            'processed_at' => now(),
        ]);

        $token = Crypt::encryptString(json_encode([
            'phone' => '09129999999',
            'expires_at' => Carbon::now()->addMinutes(10)->toIso8601String(),
        ]));

        $response = $this->postJson('/api/v1/auth/register/complete', [
            'email' => 'duplicate-phone@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'firstName' => 'Juan',
            'middleName' => 'Santos',
            'lastName' => 'Dela Cruz',
            'suffix' => null,
            'dateOfBirth' => '2000-01-01',
            'phoneNumber' => '09129999999',
            'address' => '123 Street',
            'barangay' => 'Barangay 176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postalCode' => '1400',
            'pcnNumber' => '5555-6666-7777-8888',
            'verificationToken' => $token,
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'PHONE_ALREADY_REGISTERED',
                'message' => 'This phone number is already registered. Please use a different phone number.',
            ]);
    }

    public function test_it_blocks_registration_when_pcn_is_already_registered_even_with_format_variation(): void
    {
        $existingUser = User::create([
            'name' => 'Existing Citizen',
            'email' => 'existing-pcn@example.com',
            'password' => 'StrongPass1!',
            'role_id' => 3,
            'email_verified_at' => now(),
        ]);

        CitizenDetails::create([
            'user_id' => $existingUser->id,
            'pcn_number' => '1234-5678-9012-3456',
            'first_name' => 'Existing',
            'middle_name' => null,
            'last_name' => 'Citizen',
            'suffix' => null,
            'date_of_birth' => '1999-01-01',
            'phone_number' => '09125550000',
            'address' => 'PH9, Bagong Silang',
            'barangay' => 'Barangay 176-E',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postal_code' => '1400',
            'is_verified' => true,
            'status' => 'active',
        ]);

        $verification = IdVerification::create([
            'verification_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'completed',
            'image_disk' => 'local',
            'image_path' => null,
            'result_json' => [
                'data' => [
                    'pcnNumber' => '1234567890123456',
                ],
            ],
            'confidence' => 95,
            'expires_at' => now()->addMinutes(10),
            'processed_at' => now(),
        ]);

        $token = Crypt::encryptString(json_encode([
            'phone' => '09125550001',
            'expires_at' => Carbon::now()->addMinutes(10)->toIso8601String(),
        ]));

        $response = $this->postJson('/api/v1/auth/register/complete', [
            'email' => 'duplicate-pcn-variant@example.com',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'firstName' => 'Juan',
            'middleName' => 'Santos',
            'lastName' => 'Dela Cruz',
            'suffix' => null,
            'dateOfBirth' => '2000-01-01',
            'phoneNumber' => '09125550001',
            'address' => '123 Street',
            'barangay' => 'Barangay 176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postalCode' => '1400',
            'pcnNumber' => '1234567890123456',
            'verificationToken' => $token,
            'verificationId' => $verification->verification_id,
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_process_job_fails_when_pcn_is_already_registered(): void
    {
        $existingUser = User::create([
            'name' => 'Existing Citizen',
            'email' => 'existing@example.com',
            'password' => 'StrongPass1!',
            'role_id' => 3,
            'email_verified_at' => now(),
        ]);

        CitizenDetails::create([
            'user_id' => $existingUser->id,
            'pcn_number' => '1234-5678-9012-3456',
            'first_name' => 'Existing',
            'middle_name' => null,
            'last_name' => 'Citizen',
            'suffix' => null,
            'date_of_birth' => '1999-01-01',
            'phone_number' => '09120000001',
            'address' => 'PH9, Bagong Silang',
            'barangay' => 'Barangay 176-E',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postal_code' => '1400',
            'is_verified' => true,
            'status' => 'active',
        ]);

        $verification = $this->createPendingVerificationWithImage();

        $gemini = Mockery::mock(GeminiService::class);
        $gemini->shouldReceive('analyzeNationalId')->once()->andReturn([
            'backSideDetected' => false,
            'isAuthentic' => true,
            'confidence' => 95,
            'data' => [
                'pcnNumber' => '1234-5678-9012-3456',
                'address' => 'PH9 Block 1',
            ],
            'isPhase9Resident' => true,
        ]);

        $imageProcessor = Mockery::mock(ImageProcessingService::class);
        $imageProcessor->shouldReceive('optimizeForAi')->once()->andReturn('optimized-image-content');

        (new ProcessNationalIdOcrJob($verification->id))->handle(
            $gemini,
            $imageProcessor,
            app(RegistrationEligibilityService::class)
        );

        $verification->refresh();
        $this->assertSame('failed', $verification->status);
        $this->assertSame('PCN_ALREADY_REGISTERED', $verification->failure_code);
    }

    public function test_process_job_fails_when_registered_pcn_format_differs_from_ocr_result(): void
    {
        $existingUser = User::create([
            'name' => 'Existing Citizen',
            'email' => 'existing-pcn-variant@example.com',
            'password' => 'StrongPass1!',
            'role_id' => 3,
            'email_verified_at' => now(),
        ]);

        CitizenDetails::create([
            'user_id' => $existingUser->id,
            'pcn_number' => '1234567890123456',
            'first_name' => 'Existing',
            'middle_name' => null,
            'last_name' => 'Citizen',
            'suffix' => null,
            'date_of_birth' => '1999-01-01',
            'phone_number' => '09120000002',
            'address' => 'PH9, Bagong Silang',
            'barangay' => 'Barangay 176-E',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postal_code' => '1400',
            'is_verified' => true,
            'status' => 'active',
        ]);

        $verification = $this->createPendingVerificationWithImage();

        $gemini = Mockery::mock(GeminiService::class);
        $gemini->shouldReceive('analyzeNationalId')->once()->andReturn([
            'backSideDetected' => false,
            'isAuthentic' => true,
            'confidence' => 95,
            'data' => [
                'pcnNumber' => '1234-5678-9012-3456',
                'address' => 'PH9 Block 1',
            ],
            'isPhase9Resident' => true,
        ]);

        $imageProcessor = Mockery::mock(ImageProcessingService::class);
        $imageProcessor->shouldReceive('optimizeForAi')->once()->andReturn('optimized-image-content');

        (new ProcessNationalIdOcrJob($verification->id))->handle(
            $gemini,
            $imageProcessor,
            app(RegistrationEligibilityService::class)
        );

        $verification->refresh();
        $this->assertSame('failed', $verification->status);
        $this->assertSame('PCN_ALREADY_REGISTERED', $verification->failure_code);
    }

    public function test_process_job_passes_non_ph9_when_location_is_inside_barangay_boundary(): void
    {
        $verification = $this->createPendingVerificationWithImage();
        $verification->update([
            'request_latitude' => 14.777173324497454,
            'request_longitude' => 121.03456613420815,
        ]);

        $gemini = Mockery::mock(GeminiService::class);
        $gemini->shouldReceive('analyzeNationalId')->once()->andReturn([
            'backSideDetected' => false,
            'isAuthentic' => true,
            'confidence' => 92,
            'data' => [
                'pcnNumber' => '2222-3333-4444-5555',
                'address' => 'Outside PH9 Address',
            ],
            'isPhase9Resident' => false,
        ]);

        $imageProcessor = Mockery::mock(ImageProcessingService::class);
        $imageProcessor->shouldReceive('optimizeForAi')->once()->andReturn('optimized-image-content');

        (new ProcessNationalIdOcrJob($verification->id))->handle(
            $gemini,
            $imageProcessor,
            app(RegistrationEligibilityService::class)
        );

        $verification->refresh();
        $this->assertSame('completed', $verification->status);
        $this->assertNull($verification->failure_code);
    }

    public function test_process_job_fails_non_ph9_when_location_is_missing(): void
    {
        $verification = $this->createPendingVerificationWithImage();

        $gemini = Mockery::mock(GeminiService::class);
        $gemini->shouldReceive('analyzeNationalId')->once()->andReturn([
            'backSideDetected' => false,
            'isAuthentic' => true,
            'confidence' => 90,
            'data' => [
                'pcnNumber' => '7777-8888-9999-0000',
                'address' => 'Outside PH9 Address',
            ],
            'isPhase9Resident' => false,
        ]);

        $imageProcessor = Mockery::mock(ImageProcessingService::class);
        $imageProcessor->shouldReceive('optimizeForAi')->once()->andReturn('optimized-image-content');

        (new ProcessNationalIdOcrJob($verification->id))->handle(
            $gemini,
            $imageProcessor,
            app(RegistrationEligibilityService::class)
        );

        $verification->refresh();
        $this->assertSame('failed', $verification->status);
        $this->assertSame('NON_PH9_LOCATION_REQUIRED', $verification->failure_code);
    }

    private function createPendingVerificationWithImage(): IdVerification
    {
        $verificationId = (string) \Illuminate\Support\Str::uuid();
        $imagePath = "ocr-temp/{$verificationId}.jpg";
        Storage::disk('local')->put($imagePath, 'fake-image-content');

        return IdVerification::create([
            'verification_id' => $verificationId,
            'status' => 'pending',
            'image_disk' => 'local',
            'image_path' => $imagePath,
            'expires_at' => now()->addMinutes(10),
        ]);
    }
}
