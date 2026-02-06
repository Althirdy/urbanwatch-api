<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Concern Assigned</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="padding: 30px;">
                <!-- Header -->
                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">UrbanWatch</h2>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 0 0 20px 0;">
                
                <!-- Title -->
                <h1 style="margin: 0 0 20px 0; color: #000; font-size: 24px; font-weight: normal;">Concern Assigned</h1>
                
                <!-- Message -->
                <p style="margin: 0 0 20px 0; color: #555; line-height: 1.6;">
                    Hello {{ $citizenName }},
                </p>
                <p style="margin: 0 0 30px 0; color: #555; line-height: 1.6;">
                    Your concern has been verified and assigned to a Purok Leader for action.
                </p>
                
                <!-- Details Table -->
                <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #ddd; margin-bottom: 30px;">
                    <tr style="background-color: #f9f9f9;">
                        <td style="border-bottom: 1px solid #ddd; color: #666; font-size: 14px;">Tracking Code</td>
                        <td style="border-bottom: 1px solid #ddd; color: #000; font-size: 14px; text-align: right;">{{ $concern->tracking_code }}</td>
                    </tr>
                    <tr>
                        <td style="border-bottom: 1px solid #ddd; color: #666; font-size: 14px;">Title</td>
                        <td style="border-bottom: 1px solid #ddd; color: #000; font-size: 14px; text-align: right;">{{ $concern->title }}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="border-bottom: 1px solid #ddd; color: #666; font-size: 14px;">Category</td>
                        <td style="border-bottom: 1px solid #ddd; color: #000; font-size: 14px; text-align: right;">{{ ucfirst($concern->category ?? 'General') }}</td>
                    </tr>
                    <tr>
                        <td style="border-bottom: 1px solid #ddd; color: #666; font-size: 14px;">Severity</td>
                        <td style="border-bottom: 1px solid #ddd; color: #000; font-size: 14px; text-align: right;">{{ ucfirst($concern->severity ?? 'Low') }}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="color: #666; font-size: 14px;">Assigned To</td>
                        <td style="color: #000; font-size: 14px; text-align: right;">{{ $leaderName }}</td>
                    </tr>
                </table>
                
                <!-- Footer Message -->
                <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.6;">
                    Your Purok Leader will review and take action on your concern. You'll receive updates on any status changes.
                </p>
                
                <!-- Footer -->
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0 20px 0;">
                <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                    &copy; {{ date('Y') }} UrbanWatch System<br>
                    This is an automated notification. Please do not reply.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
