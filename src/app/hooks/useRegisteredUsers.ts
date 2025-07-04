'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off, getDatabase } from 'firebase/database';
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface RegisteredUser {
  uid: string;
  email: string;
  registeredAt: string;
  status: 'pending_wallet_creation' | 'wallet_created' | 'error';
  lastEmailSent?: string;
}

export function useRegisteredUsers() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeDB: (() => void) | null = null;

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const isAdminUser = user.email === 'admin@gmail.com';
      setIsAdmin(isAdminUser);

      const db = getDatabase();
      // If admin, fetch all users, otherwise fetch only current user
      const dbRef = isAdminUser ? ref(db, 'users') : ref(db, `users/${user.uid}`);

      const handleData = (snapshot: any) => {
        try {
          const data = snapshot.val();
          if (!data) {
            setUsers([]);
            setLoading(false);
            return;
          }

          if (isAdminUser) {
            // For admin, process all users
            const usersList = Object.entries(data).map(([uid, userData]: [string, any]) => ({
              uid,
              email: userData.email,
              registeredAt: userData.registeredAt,
              status: userData.status,
              lastEmailSent: userData.lastEmailSent || null
            }));
            setUsers(usersList);
          } else {
            // For regular user, process only their data
            const userData: RegisteredUser = {
              uid: user.uid,
              email: data.email,
              registeredAt: data.registeredAt,
              status: data.status,
              lastEmailSent: data.lastEmailSent || null
            };

            setUsers([userData]);
          }

          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error fetching user data');
          console.error('Error fetching user data:', err);
        } finally {
          setLoading(false);
        }
      };

      const handleError = (err: Error) => {
        setError('Error connecting to database');
        console.error('Database error:', err);
        setLoading(false);
      };

      // Set up real-time listener
      onValue(dbRef, handleData, handleError);
      
      // Store unsubscribe function
      unsubscribeDB = () => off(dbRef);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeAuth();
      if (unsubscribeDB) {
        unsubscribeDB();
      }
    };
  }, []);

  return {
    users,
    loading,
    error,
    isAdmin
  };
} 