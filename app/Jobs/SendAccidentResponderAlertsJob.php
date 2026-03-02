<?php

namespace App\Jobs;

use App\Models\Accident;
use App\Services\AccidentResponderDispatchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendAccidentResponderAlertsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    public function __construct(
        protected int $accidentId,
        protected string $incidentClass
    ) {}

    public function handle(AccidentResponderDispatchService $dispatchService): void
    {
        $accident = Accident::find($this->accidentId);
        if (! $accident) {
            Log::warning('SendAccidentResponderAlertsJob skipped: accident not found', [
                'accident_id' => $this->accidentId,
                'incident_class' => $this->incidentClass,
            ]);

            return;
        }

        $dispatchService->dispatchForAccidentClass($accident, $this->incidentClass);
    }
}
