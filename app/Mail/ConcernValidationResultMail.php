<?php

namespace App\Mail;

use App\Models\Citizen\Concern;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConcernValidationResultMail extends Mailable
{
    use Queueable, SerializesModels;

    public Concern $concern;

    public bool $isValid;

    public ?string $reason;

    /**
     * Create a new message instance.
     */
    public function __construct(Concern $concern, bool $isValid, ?string $reason = null)
    {
        $this->concern = $concern;
        $this->isValid = $isValid;
        $this->reason = $reason;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $statusText = $this->isValid ? 'Verified' : 'Rejected';

        return new Envelope(
            subject: "Concern {$statusText} - {$this->concern->tracking_code}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.concern-validation-result',
            with: [
                'concern' => $this->concern,
                'isValid' => $this->isValid,
                'reason' => $this->reason,
                'citizenName' => $this->getCitizenName(),
            ],
        );
    }

    /**
     * Get the citizen's name.
     */
    protected function getCitizenName(): string
    {
        if ($this->concern->citizen && $this->concern->citizen->citizenDetails) {
            $details = $this->concern->citizen->citizenDetails;

            return trim("{$details->first_name} {$details->last_name}");
        }

        return $this->concern->citizen?->name ?? 'Citizen';
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
