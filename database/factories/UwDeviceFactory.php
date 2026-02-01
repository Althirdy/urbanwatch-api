<?php

namespace Database\Factories;

use App\Models\UwDevice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UwDeviceFactory extends Factory
{
    protected $model = UwDevice::class;

    public function definition(): array
    {
        return [
            'device_id' => $this->faker->unique()->numerify('SN-######'),
            'device_name' => 'IoT Device '.$this->faker->word,
            'status' => 'active',
            'api_token' => 'uw_live_'.Str::random(40),
            'last_seen_at' => now(),
        ];
    }

    public function offline(): self
    {
        return $this->state(fn (array $attributes) => [
            'last_seen_at' => now()->subMinutes(10),
        ]);
    }

    public function inactive(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
