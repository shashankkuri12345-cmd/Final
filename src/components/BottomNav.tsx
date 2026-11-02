'use client';

import React from 'react';
import {
  LayoutDashboard,
  QrCode,
  MessageSquare,
  Link2,
  Bot
} from 'lucide-react';
import { AppModule } from '@/lib/types';

export { type AppModule, type NavTab } from '@/lib/types';

interface BottomNavProps {
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeModule,
  onSelectModule,
}) => {
  const navTabs: {
    id: AppModule;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'qr-scanner', label: 'QR & Pay', icon: QrCode },
    { id: 'fake-message', label: 'Messages', icon: MessageSquare },
    { id: 'fraud-link', label: 'Links', icon: Link2 },
    { id: 'safety-assistant', label: 'Assistant', icon: Bot },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-white/95 backdrop-blur-md border-t border-[#E5EAE5] shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      aria-label="Main Security Modules"
    >
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-1">
        {navTabs.map((tab) => {
          const isActive =
            activeModule === tab.id ||
            (tab.id === 'qr-scanner' && activeModule === 'upi-verify') ||
            (tab.id === 'dashboard' && (activeModule === 'fraud-network' || activeModule === 'emergency-assistance' || activeModule === 'reports'));

          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectModule(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[62px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#1DB954] font-semibold'
                  : 'text-[#6B756D] hover:text-[#191C19] active:scale-95'
              }`}
            >
              <div
                className={`relative flex items-center justify-center p-1 rounded-xl transition-all ${
                  isActive ? 'bg-[#EAF8EF] text-[#1DB954]' : ''
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
                )}
              </div>
              <span
                className={`text-[11px] tracking-tight leading-none ${
                  isActive ? 'font-bold text-[#169C46]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
