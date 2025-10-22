<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerificationNotification extends Notification
{
    use Queueable;

    protected $otp;

    /**
     * Create a new notification instance.
     */
    public function __construct($otp = null)
    {
        $this->otp = $otp;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        if ($this->otp) {
            // OTP-based verification
            return (new MailMessage)
                ->subject('Your Citizen UI Registration Code')
                ->greeting('Hello!')
                ->line('You have requested a **REGISTRATION** verification code for your Citizen UI account.')
                ->line('Please use the following One-Time Password (OTP) to complete your registration:')
                ->line('**' . $this->otp . '**')
                ->line('This code will expire in 5 minutes.')
                ->line('If you did not request this code, please ignore this email.')
                ->salutation('Thank you for using Citizen UI!');
        } else {
            // Link-based verification (fallback)
            return (new MailMessage)
                ->subject('Verify Email Address')
                ->greeting('Hello!')
                ->line('Please click the button below to verify your email address.')
                ->action('Verify Email Address', $this->verificationUrl($notifiable))
                ->line('If you did not create an account, no further action is required.');
        }
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl($notifiable)
    {
        return url()->temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
