<?php

namespace Tests\Feature\Operator;

use App\Models\Roles;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicPostTest extends TestCase
{
    use RefreshDatabase;

    private Roles $operatorRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->operatorRole = Roles::firstOrCreate(
            ['name' => 'Operator'],
            ['description' => 'Operator role']
        );
    }

    public function test_can_create_public_post_without_image()
    {
        $user = User::factory()->create([
            'role_id' => $this->operatorRole->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->postJson(route('public-post.store'), [
            'title' => 'Test Post',
            'content' => 'This is a test content.',
            'category' => 'General',
            'status' => 'published',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('public_posts', [
            'title' => 'Test Post',
            'content' => 'This is a test content.',
            'category' => 'General',
            'status' => 'published',
        ]);
    }

    public function test_can_create_public_post_with_image()
    {
        Storage::fake('public');
        $user = User::factory()->create([
            'role_id' => $this->operatorRole->id,
            'email_verified_at' => now(),
        ]);
        $file = UploadedFile::fake()->image('post.jpg');

        $response = $this->actingAs($user)->postJson(route('public-post.store'), [
            'title' => 'Test Post Image',
            'content' => 'Content with image.',
            'category' => 'News',
            'status' => 'draft',
            'image' => $file,
        ]);

        $response->assertStatus(201);

    }

    public function test_validation_fails_for_missing_fields()
    {
        $user = User::factory()->create([
            'role_id' => $this->operatorRole->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->postJson(route('public-post.store'), [
            'status' => 'draft',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title', 'content']);
    }
}
