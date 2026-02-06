<?php

namespace App\Mail;

use App\Models\Citizen\Concern;
use App\Models\OfficialsDetails;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConcernAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Concern $concern;

    public OfficialsDetails $assignedTo;

    /**
     * Create a new message instance.
     */
    public function __construct(Concern $concern, OfficialsDetails $assignedTo)
    {
        $this->concern = $concern;
        $this->assignedTo = $assignedTo;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Concern Assigned - '.$this->concern->tracking_code,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.concern-assigned',
            with: [
                'concern' => $this->concern,
                'assignedTo' => $this->assignedTo,
                'citizenName' => $this->getCitizenName(),
                'leaderName' => trim("{$this->assignedTo->first_name} {$this->assignedTo->last_name}"),
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
