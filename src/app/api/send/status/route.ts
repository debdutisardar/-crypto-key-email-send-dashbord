import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatabase, ref, update } from 'firebase/database';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, status, userId } = await request.json();

    if (!email || !status || !userId) {
      return NextResponse.json(
        { error: 'Email, status, and userId are required' },
        { status: 400 }
      );
    }

    let subject = '';
    let content = '';

    switch (status) {
      case 'wallet_created':
        subject = 'Your Crypto Key Wallet is Ready! 🎉';
        content = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a365d; margin-bottom: 10px;">Your Wallet is Ready! 🎉</h1>
              <p style="color: #4a5568; font-size: 16px;">Great news! Your crypto wallet has been successfully created.</p>
            </div>

            <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h2 style="color: #2d3748; margin-bottom: 15px;">Next Steps</h2>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li>Log in to your dashboard to view your wallet details</li>
                <li>Set up additional security measures</li>
                <li>Start managing your crypto assets</li>
              </ul>
            </div>

            <div style="background-color: #ebf8ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h2 style="color: #2c5282; margin-bottom: 15px;">Important Security Reminders</h2>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li>Keep your private keys secure</li>
                <li>Never share your wallet credentials</li>
                <li>Enable all recommended security features</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #718096; font-size: 14px;">
                Need help? Contact our support team.<br>
                This is an automated message, please do not reply directly to this email.
              </p>
            </div>
          </div>
        `;
        break;

      case 'error':
        subject = 'Action Required: Issue with Your Crypto Key Wallet';
        content = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #c53030; margin-bottom: 10px;">Attention Required</h1>
              <p style="color: #4a5568; font-size: 16px;">We've encountered an issue with your wallet setup.</p>
            </div>

            <div style="background-color: #fff5f5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h2 style="color: #c53030; margin-bottom: 15px;">What Happened?</h2>
              <p style="color: #4a5568; line-height: 1.6;">
                There was an issue during your wallet creation process. Don't worry - your account is secure, 
                but we need to take some additional steps to complete your setup.
              </p>
            </div>

            <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h2 style="color: #2d3748; margin-bottom: 15px;">Next Steps</h2>
              <ul style="color: #4a5568; line-height: 1.6; padding-left: 20px;">
                <li>Log in to your dashboard</li>
                <li>Visit the wallet setup section</li>
                <li>Follow the troubleshooting steps</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #718096; font-size: 14px;">
                Need immediate assistance? Contact our support team.<br>
                This is an automated message, please do not reply directly to this email.
              </p>
            </div>
          </div>
        `;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'Crypto Key <noreply@movie4uhub.xyz>',
      to: email,
      subject: subject,
      html: content
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update database with email sent timestamp
    try {
      const db = getDatabase();
      await update(ref(db, `users/${userId}`), {
        lastEmailSent: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating database:', error);
      // We still return success since the email was sent
    }

    return NextResponse.json(
      { message: 'Status update email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in status email route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 