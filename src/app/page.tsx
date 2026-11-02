'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav, AppModule } from '@/components/BottomNav';
import { ModuleTabBar } from '@/components/ModuleTabBar';
import { DashboardScreen } from '@/components/DashboardScreen';
import { EmergencyAssistanceScreen } from '@/components/EmergencyAssistanceScreen';
import { QrPayScreen } from '@/components/QrPayScreen';
import { MessagesScreen } from '@/components/MessagesScreen';
import { FraudLinkScreen } from '@/components/FraudLinkScreen';
import { UpiVerifyScreen } from '@/components/UpiVerifyScreen';
import { ReportsScreen } from '@/components/ReportsScreen';
import { FraudNetworkScreen } from '@/components/FraudNetworkScreen';
import { SafetyAssistantScreen } from '@/components/SafetyAssistantScreen';
import { LoginScreen } from '@/components/LoginScreen';
import { SafetyTipsModal } from '@/components/SafetyTipsModal';
import { LoginModal } from '@/components/LoginModal';
import { ReportModal } from '@/components/ReportModal';
import { AuthUser, getSavedSession, signOutUser } from '@/lib/supabase';
import { ScamCategory } from '@/lib/types';

export default function ScamGuardApp() {
  const [activeModule, setActiveModule] = useState<AppModule>('dashboard');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSafetyTipsOpen, setIsSafetyTipsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPrefill, setReportPrefill] = useState<{ target: string; category: ScamCategory }>({
    target: '',
    category: 'upi',
  });

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

  const handleOpenReportWithTarget = (target: string, category: string) => {
    setReportPrefill({
      target,
      category: (category as ScamCategory) || 'upi',
    });
    setIsReportModalOpen(true);
  };

  const handleOpenReportModal = (target?: string, category?: ScamCategory) => {
    setReportPrefill({
      target: target || '',
      category: category || 'upi',
    });
    setIsReportModalOpen(true);
  };

  const handleOpenEmergency = () => {
    setActiveModule('emergency-assistance');
  };

  return (
    <div className="relative min-h-screen bg-[#F7F9F7] text-[#191C19] flex flex-col font-['Inter',sans-serif] selection:bg-[#1DB954]/20 selection:text-[#191C19]">
      {/* 1. Fixed Top Header */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setActiveModule('login')}
        onSignOut={handleSignOut}
        onOpenHelpline={() => setActiveModule('emergency-assistance')}
      />

      {/* 2. Top Module Navigation Pills (All Core Modules) */}
      <div className="pt-16">
        <ModuleTabBar
          activeModule={activeModule}
          onSelectModule={(mod) => setActiveModule(mod)}
        />
      </div>

      {/* 3. Main Content Area */}
      <main className="flex-1 w-full pt-2 pb-16 flex flex-col">
        {activeModule === 'dashboard' && (
          <DashboardScreen
            onSelectModule={(mod) => setActiveModule(mod)}
            onOpenReportWithTarget={handleOpenReportWithTarget}
            onOpenEmergency={handleOpenEmergency}
          />
        )}

        {activeModule === 'emergency-assistance' && (
          <EmergencyAssistanceScreen
            onBackToDashboard={() => setActiveModule('dashboard')}
          />
        )}

        {activeModule === 'qr-scanner' && (
          <QrPayScreen
            onReportClick={handleOpenReportWithTarget}
            onNavigateToUpi={() => setActiveModule('upi-verify')}
            onOpenEmergency={handleOpenEmergency}
          />
        )}

        {activeModule === 'fake-message' && (
          <MessagesScreen
            onReportClick={handleOpenReportWithTarget}
            onOpenEmergency={handleOpenEmergency}
          />
        )}

        {activeModule === 'fraud-link' && (
          <FraudLinkScreen
            onReportClick={handleOpenReportWithTarget}
            onOpenEmergency={handleOpenEmergency}
          />
        )}

        {activeModule === 'upi-verify' && (
          <UpiVerifyScreen
            onReportClick={handleOpenReportWithTarget}
            onOpenEmergency={handleOpenEmergency}
          />
        )}

        {activeModule === 'reports' && (
          <ReportsScreen
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {activeModule === 'fraud-network' && (
          <FraudNetworkScreen />
        )}

        {activeModule === 'safety-assistant' && (
          <SafetyAssistantScreen
            onOpenEmergency={handleOpenEmergency}
          />
        )}

        {activeModule === 'login' && (
          <LoginScreen
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setActiveModule('dashboard');
            }}
            onBackToDashboard={() => setActiveModule('dashboard')}
          />
        )}
      </main>

      {/* 4. Fixed Bottom Mobile Navigation */}
      <BottomNav
        activeModule={activeModule}
        onSelectModule={(mod: AppModule) => setActiveModule(mod)}
      />

      {/* 5. Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      <SafetyTipsModal
        isOpen={isSafetyTipsOpen}
        onClose={() => setIsSafetyTipsOpen(false)}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        prefillTarget={reportPrefill.target}
        prefillCategory={reportPrefill.category}
        onReportAdded={() => {
          setIsReportModalOpen(false);
          setActiveModule('reports');
        }}
      />
    </div>
  );
}
