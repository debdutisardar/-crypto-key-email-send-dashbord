import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatabase, ref, update, get } from 'firebase/database';
import { auth } from '@/config/firebase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Send welcome email
    const { data, error } = await resend.emails.send({
      from: 'Crypto Key <noreply@movie4uhub.xyz>',
      to: email,
      subject: 'Welcome to Crypto Key! 🔐🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fafc; border-radius: 8px;">
          <div style="padding: 20px;">
            <h1 style="color: #1a365d; margin-bottom: 20px; text-align: center;">Welcome to Crypto Key! 🔐🚀</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for signing up — we're thrilled to have you with us!
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Your account has been successfully created, and you're now ready to explore the powerful features of Crypto Key, your trusted crypto wallet. Whether you're sending, receiving, or managing digital assets, we've got you covered every step of the way.
            </p>

            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #2d3748; margin-bottom: 15px;">🔑 What You Can Do with Crypto Key:</h2>
              <ul style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Securely store and manage your cryptocurrencies</li>
                <li>Send and receive USDT, ETH, BNB, and more</li>
                <li>Access your wallet anytime, anywhere</li>
                <li>Enjoy top-notch security and privacy features</li>
              </ul>
            </div>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions or need help getting started, feel free to visit our Help Center or explore our in-app tutorials.
            </p>

            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for choosing Crypto Key — let's unlock the future of finance together!
            </p>

            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
              <p style="color: #718096; font-size: 14px; margin-bottom: 15px; text-align: center;">
                This is an automated message. Please do not reply directly to this email.
              </p>
              
              <p style="color: #4a5568; font-size: 16px; margin-bottom: 0;">
                Stay secure,<br>
                The Crypto Key Team
              </p>
            </div>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update Realtime Database with the email sent timestamp
    try {
      const db = getDatabase();
      
      // Find user by email
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      const users = snapshot.val();
      
      if (users) {
        const userEntry = Object.entries(users).find(([_, userData]: [string, any]) => userData.email === email);
        
        if (userEntry) {
          const [userId] = userEntry;
          await update(ref(db, `users/${userId}`), {
            lastEmailSent: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error updating database:', error);
      // We still return success since the email was sent
    }

    return NextResponse.json(
      { message: 'Welcome email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in welcome email route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 