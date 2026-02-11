<?php

namespace Tests\Feature\Auth;

use App\Jobs\ProcessNationalIdOcrJob;
use App\Models\CitizenDetails;
use App\Models\IdVerification;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
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
            'name' => 'citizen',
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

        Storage::disk('local')->assertExists($verification->image_path);

        Queue::assertPushed(ProcessNationalIdOcrJob::class, function (ProcessNationalIdOcrJob $job) use ($verification) {
            return $job->idVerificationId === $verification->id;
        });
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
}
