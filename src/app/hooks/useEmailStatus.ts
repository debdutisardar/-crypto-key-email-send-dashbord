'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/config/firebase';
import { sendEmail } from '@/app/utils/email';
import { getDatabase, ref, onValue, off } from 'firebase/database';

interface EmailStatus {
  id: string;
  to: string;
  status: string;
  timestamp: string;
}

interface EmailForm {
  to: string;
  subject: string;
  message: string;
}

export function useEmailStatus() {
  const [emailStatus, setEmailStatus] = useState<EmailStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for status changes and send emails automatically
  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');

    const handleStatusChange = async (snapshot: any) => {
      const data = snapshot.val();
      if (!data) return;

      Object.entries(data).forEach(async ([userId, userData]: [string, any]) => {
        // Check if status has changed and no email has been sent yet
        if (
          (userData.status === 'wallet_created' || userData.status === 'error') &&
          (!userData.lastEmailSent || new Date(userData.lastEmailSent).getTime() < new Date(userData.registeredAt).getTime())
        ) {
          try {
            const response = await fetch('/api/send/status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: userData.email,
                status: userData.status,
                userId: userId
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to send status email');
            }

            console.log(`Status email sent to ${userData.email}`);
          } catch (err) {
            console.error('Error sending status email:', err);
          }
        }
      });
    };

    onValue(usersRef, handleStatusChange);

    return () => {
      off(usersRef);
    };
  }, []);

  const sendNewEmail = async (emailData: EmailForm) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Send email using Resend
      await sendEmail(
        emailData.to,
        emailData.subject,
        emailData.message
      );

      // Add to status list
      const newStatus: EmailStatus = {
        id: Date.now().toString(),
        to: emailData.to,
        status: 'sent',
        timestamp: new Date().toLocaleString()
      };

      setEmailStatus(prev => [newStatus, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
      
      // Add failed status to list
      const failedStatus: EmailStatus = {
        id: Date.now().toString(),
        to: emailData.to,
        status: 'failed',
        timestamp: new Date().toLocaleString()
      };

      setEmailStatus(prev => [failedStatus, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return {
    emailStatus,
    loading,
    error,
    sendNewEmail
  };
} 