'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useRegisteredUsers } from '../hooks/useRegisteredUsers';

interface UserData {
  uid: string;
  email: string;
  registeredAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { users, loading, error, isAdmin } = useRegisteredUsers();
  const [processedEmails, setProcessedEmails] = useState<Set<string>>(new Set());

  // Function to check if user is recently registered (within last 24 hours)
  const isRecentlyRegistered = (registrationDate: string) => {
    const registrationTime = new Date(registrationDate).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (currentTime - registrationTime) / (1000 * 60 * 60);
    return hoursDifference <= 24;
  };

  // Function to send welcome email
  const sendWelcomeEmail = async (email: string) => {
    try {
      const response = await fetch('/api/send/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send welcome email');
      }

      setProcessedEmails(prev => new Set([...prev, email]));
      console.log('Welcome email sent successfully to:', email);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Check for new users that need welcome emails
  useEffect(() => {
    if (users && isAdmin) {
      // Sort users by registration date (newest first)
      const sortedUsers = [...users].sort((a, b) => 
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
      );

      sortedUsers.forEach(user => {
        if (!processedEmails.has(user.email) && isRecentlyRegistered(user.registeredAt)) {
          sendWelcomeEmail(user.email);
        }
      });
    }
  }, [users, isAdmin, processedEmails]);

  // Function to manually send welcome email (for admin)
  const handleManualWelcomeEmail = async (email: string, registeredAt: string) => {
    if (isRecentlyRegistered(registeredAt)) {
      await sendWelcomeEmail(email);
    } else {
      alert('Cannot send welcome email to users registered more than 24 hours ago.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {isAdmin ? 'Admin Dashboard' : 'User Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{userEmail}</span>
              <button
                onClick={() => auth.signOut()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {isAdmin ? 'All Registered Users' : 'Your Account Details'}
              </h2>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 mr-2 bg-green-400 rounded-full animate-pulse"></span>
                  Real-time Updates Active
                </span>
              </div>
            </div>
            
            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...users].sort((a, b) => 
                    new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
                  ).map((user) => (
                    <tr key={user.uid} className={isRecentlyRegistered(user.registeredAt) ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.registeredAt).toLocaleString()}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleManualWelcomeEmail(user.email, user.registeredAt)}
                            className={`text-indigo-600 hover:text-indigo-900 ${
                              !isRecentlyRegistered(user.registeredAt) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={!isRecentlyRegistered(user.registeredAt)}
                          >
                            {isRecentlyRegistered(user.registeredAt) ? 'Send Welcome Email' : 'Too Old to Send Email'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 3 : 2} className="px-6 py-4 text-center text-sm text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 