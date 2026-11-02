'use client';

import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  ShieldAlert
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionGuide?: string[];
  isUrgentPostFraud?: boolean;
  timestamp: string;
}

interface SafetyAssistantScreenProps {
  onOpenEmergency?: () => void;
}

let messageSeq = 0;
const createMsgId = (prefix: string) => `${prefix}-${++messageSeq}`;

export const SafetyAssistantScreen: React.FC<SafetyAssistantScreenProps> = ({
  onOpenEmergency,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: 'Hello, I am your SCAM GUARD Safety Assistant. Ask me about suspicious calls, messages, reverse UPI collect requests, or what steps to take if you suspect a scam.',
      actionGuide: [
        'Never enter your 4 or 6-digit UPI PIN to receive money or cashbacks',
        'Utilities never cut electricity connections via WhatsApp or SMS callbacks',
        'Official banks never ask for NetBanking passwords or full PAN updates over phone calls',
      ],
      timestamp: 'Just now',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickScenarios = [
    'I just lost ₹15,000 in a UPI scam! What do I do right now?',
    'Someone on OLX asked me to enter UPI PIN to receive money',
    'How do I prepare a formal cybercrime complaint summary?',
    'I clicked a suspicious link. How do I protect my accounts?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: createMsgId('usr'),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: createMsgId('bot'),
          sender: 'assistant',
          text: data.reply,
          actionGuide: data.actionGuide,
          isUrgentPostFraud: data.isUrgentPostFraud,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Assistant API returned an error.');
      }
    } catch {
      // Fallback message
      const botMsg: ChatMessage = {
        id: createMsgId('bot'),
        sender: 'assistant',
        text: 'SCAM GUARD Safety Guidance: Never disclose your OTP, CVV, or UPI PIN under any circumstance. If unauthorized transactions occurred, dial 1930 immediately.',
        actionGuide: ['Call 1930 immediately', 'Contact your issuing bank helpline'],
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 pt-3 pb-24 space-y-4 max-w-lg mx-auto">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-[#191C19] tracking-tight flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#1DB954]" />
          <span>Fraud Safety Assistant</span>
        </h1>
        <p className="text-xs text-[#6B756D] leading-relaxed">
          AI guidance for recognizing scams, safe payment practices, and emergency reporting.
        </p>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-[#E5EAE5] p-3 shadow-xs min-h-[380px] max-h-[500px] flex flex-col justify-between space-y-3">
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-[#1DB954] text-white font-medium rounded-br-xs'
                    : m.isUrgentPostFraud
                    ? 'bg-red-50 text-red-950 border border-red-200 rounded-bl-xs'
                    : 'bg-[#F7F9F7] text-[#191C19] border border-[#E5EAE5] rounded-bl-xs'
                }`}
              >
                {/* Urgent Header if Post-Fraud */}
                {m.isUrgentPostFraud && (
                  <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs border-b border-red-200 pb-1">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>EMERGENCY 1930 RESPONSE PROTOCOL</span>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{m.text}</p>

                {/* Emergency Assistant Direct Jump Button */}
                {m.isUrgentPostFraud && onOpenEmergency && (
                  <button
                    onClick={onOpenEmergency}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Launch Emergency Fraud Assistance</span>
                  </button>
                )}

                {/* Action Guides */}
                {m.actionGuide && m.actionGuide.length > 0 && (
                  <div className="pt-1.5 border-t border-black/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide block opacity-75">
                      Key Recommendations:
                    </span>
                    <ul className="space-y-0.5 text-[11px]">
                      {m.actionGuide.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-[#1DB954] font-bold">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <span className="text-[9px] opacity-60 block text-right pt-0.5">
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 p-2.5 bg-[#F7F9F7] rounded-xl border border-[#E5EAE5] w-fit text-xs text-[#6B756D]">
              <Sparkles className="w-3.5 h-3.5 text-[#1DB954] animate-spin" />
              <span>Safety Assistant is typing...</span>
            </div>
          )}
        </div>

        {/* Quick Query Shortcuts */}
        <div className="space-y-1.5 pt-2 border-t border-[#E5EAE5]">
          <span className="text-[10px] font-bold text-[#6B756D] uppercase tracking-wide block">
            Suggested Prompts:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {quickScenarios.map((sc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sc)}
                className="px-2.5 py-1 rounded-full bg-[#F7F9F7] hover:bg-white text-[#191C19] border border-[#E5EAE5] text-[11px] font-medium shrink-0 transition-all hover:border-[#1DB954]"
              >
                {sc.length > 35 ? `${sc.slice(0, 35)}...` : sc}
              </button>
            ))}
          </div>
        </div>

        {/* Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about a suspicious call, link, UPI request..."
            className="flex-1 px-3 py-2 bg-[#F7F9F7] border border-[#E5EAE5] rounded-xl text-xs text-[#191C19] focus:outline-none focus:border-[#1DB954]"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2 bg-[#1DB954] hover:bg-[#169C46] text-white rounded-xl transition-all shadow-xs disabled:opacity-50 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
