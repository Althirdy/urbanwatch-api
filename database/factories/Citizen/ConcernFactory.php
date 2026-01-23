<?php

namespace Database\Factories\Citizen;

use App\Models\Citizen\Concern;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Citizen\Concern>
 */
class ConcernFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Concern::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'citizen_id' => User::factory(),
            'tracking_code' => 'CN-'.now()->format('Ymd').'-'.strtoupper($this->faker->lexify('????')),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'type' => 'manual',
            'category' => $this->faker->randomElement(['safety', 'security', 'infrastructure', 'environment', 'noise', 'other']),
            'severity' => $this->faker->randomElement(['low', 'medium', 'high']),
            'status' => 'pending',
            'latitude' => $this->faker->latitude(14.7, 14.8), // Caloocan area roughly
            'longitude' => $this->faker->longitude(121.0, 121.1),
            'address' => $this->faker->address(),
        ];
    }
}
