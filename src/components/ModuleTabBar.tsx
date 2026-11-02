'use client';

import React from 'react';
import { AppModule } from '@/lib/types';
import {
  LayoutDashboard,
  QrCode,
  MessageSquare,
  Link2,
  AtSign,
  Share2,
  Bot,
  PhoneCall,
  LogIn
} from 'lucide-react';

interface ModuleTabBarProps {
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
}

export const ModuleTabBar: React.FC<ModuleTabBarProps> = ({
  activeModule,
  onSelectModule,
}) => {
  // The 7 Core Modules defined in the official problem statement and Stitch design
  const coreModules: {
    id: AppModule;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'qr-scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'fake-message', label: 'Fake Message', icon: MessageSquare },
    { id: 'fraud-link', label: 'Fraud Link', icon: Link2 },
    { id: 'upi-verify', label: 'UPI Verify', icon: AtSign },
    { id: 'fraud-network', label: 'Fraud Network', icon: Share2 },
    { id: 'safety-assistant', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <div className="w-full bg-white border-b border-[#E5EAE5] px-3 py-2 sticky top-16 z-40 shadow-xs">
      <div className="max-w-lg mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {/* If Emergency Assistance or Login is currently active, show a dynamic active indicator chip */}
        {activeModule === 'emergency-assistance' && (
          <button
            onClick={() => onSelectModule('emergency-assistance')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 bg-red-600 text-white shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Emergency 1930</span>
          </button>
        )}

        {activeModule === 'login' && (
          <button
            onClick={() => onSelectModule('login')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 bg-[#1DB954] text-white shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Citizen Sign In</span>
          </button>
        )}

        {coreModules.map((m) => {
          const isActive = activeModule === m.id;
          const IconComp = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => onSelectModule(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-[#1DB954] text-white shadow-xs'
                  : 'bg-[#F7F9F7] text-[#6B756D] hover:text-[#191C19] hover:bg-[#F0F4F0] border border-[#E5EAE5]'
              }`}
            >
              <IconComp className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
