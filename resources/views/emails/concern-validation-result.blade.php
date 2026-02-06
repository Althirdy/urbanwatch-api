<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Concern {{ $isValid ? 'Verified' : 'Rejected' }}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="padding: 30px;">
                <!-- Header -->
                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">UrbanWatch</h2>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 0 0 20px 0;">
                
                @if($isValid)
                    <!-- Success Content -->
                    <h1 style="margin: 0 0 20px 0; color: #000; font-size: 24px; font-weight: normal;">Concern Verified</h1>
                    
                    <p style="margin: 0 0 20px 0; color: #555; line-height: 1.6;">
                        Hello {{ $citizenName }},
                    </p>
                    <p style="margin: 0 0 30px 0; color: #555; line-height: 1.6;">
                        Your concern has been successfully verified by our system and is now being processed.
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
                            <td style="color: #666; font-size: 14px;">Status</td>
                            <td style="color: #000; font-size: 14px; text-align: right;">Pending Assignment</td>
                        </tr>
                    </table>
                    
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
                        Your concern will be assigned to a Purok Leader shortly. You'll receive another notification once assigned.
                    </p>
                @else
                    <!-- Rejection Content -->
                    <h1 style="margin: 0 0 20px 0; color: #000; font-size: 24px; font-weight: normal;">Concern Not Verified</h1>
                    
                    <p style="margin: 0 0 20px 0; color: #555; line-height: 1.6;">
                        Hello {{ $citizenName }},
                    </p>
                    <p style="margin: 0 0 30px 0; color: #555; line-height: 1.6;">
                        We were unable to verify your reported concern. Please review the details below.
                    </p>
                    
                    <!-- Details Table -->
                    <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #ddd; margin-bottom: 20px;">
                        <tr style="background-color: #f9f9f9;">
                            <td style="border-bottom: 1px solid #ddd; color: #666; font-size: 14px;">Tracking Code</td>
                            <td style="border-bottom: 1px solid #ddd; color: #000; font-size: 14px; text-align: right;">{{ $concern->tracking_code }}</td>
                        </tr>
                        <tr>
                            <td style="color: #666; font-size: 14px;">Title</td>
                            <td style="color: #000; font-size: 14px; text-align: right;">{{ $concern->title }}</td>
                        </tr>
                    </table>
                    
                    @if($reason)
                    <div style="padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <strong>Reason:</strong> {{ $reason }}
                        </p>
                    </div>
                    @endif
                    
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
                        If you believe this was a mistake, please submit a new concern with more details or clearer images.
                    </p>
                @endif
                
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
