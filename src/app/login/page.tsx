'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { LoginScreen } from '@/components/LoginScreen';
import { BottomNav } from '@/components/BottomNav';
import { AuthUser, getSavedSession, signOutUser } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      return getSavedSession();
    }
    return null;
  });

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setTimeout(() => {
      router.push('/');
    }, 600);
  };

  return (
    <div className="relative min-h-screen bg-[#F7F9F7] text-[#191C19] flex flex-col font-['Inter',sans-serif]">
      {/* Fixed Header */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => {}}
        onSignOut={handleSignOut}
        onOpenHelpline={() => router.push('/')}
      />

      {/* Main Login Screen */}
      <main className="flex-1 w-full pt-20 pb-20 flex flex-col justify-center">
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onBackToDashboard={() => router.push('/')}
        />
      </main>

      {/* Fixed Bottom Nav */}
      <BottomNav
        activeModule="dashboard"
        onSelectModule={() => router.push('/')}
      />
    </div>
  );
}
