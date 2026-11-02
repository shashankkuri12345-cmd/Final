'use client';

import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { signInUser, signUpUser, resetPasswordUser, AuthUser } from '@/lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToDashboard: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onBackToDashboard,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (authMode !== 'forgot' && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'forgot') {
        const res = await resetPasswordUser(cleanEmail);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(res.message || 'Password reset link sent to your email.');
        }
      } else if (authMode === 'signup') {
        const res = await signUpUser(cleanEmail, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setSuccessMsg(res.message || 'Account created successfully! Signing in...');
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 1000);
        }
      } else {
        const res = await signInUser(cleanEmail, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setSuccessMsg('Successfully signed in. Welcome back!');
          setTimeout(() => {
            onLoginSuccess(res.user!);
          }, 600);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 pt-3 pb-24 max-w-md mx-auto space-y-4">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6B756D] hover:text-[#191C19] p-1.5 -ml-1 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-[11px] font-semibold text-[#169C46] bg-[#EAF8EF] px-2 py-0.5 rounded-full border border-[#1DB954]/25">
          Secure Portal
        </span>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white rounded-3xl border border-[#E5EAE5] p-6 shadow-sm space-y-5">
        {/* Branding header — strictly NO PRO BADGE */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF8EF] border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shadow-xs">
            <Shield className="w-7 h-7 fill-[#1DB954]/20 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#191C19] tracking-tight">
              {authMode === 'signup'
                ? 'Create Citizen Account'
                : authMode === 'forgot'
                ? 'Reset Password'
                : 'Sign In to SCAM GUARD'}
            </h1>
            <p className="text-xs text-[#6B756D] mt-1 max-w-xs mx-auto">
              {authMode === 'signup'
                ? 'Join verified fraud prevention and contribute community safety telemetry.'
                : authMode === 'forgot'
                ? 'Enter your registered email to receive password recovery instructions.'
                : 'Access your scan telemetry, tracked incidents, and verified fraud reports.'}
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-[#F7F9F7] rounded-xl border border-[#E5EAE5] gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'signin'
                ? 'bg-white text-[#191C19] shadow-xs border border-[#E5EAE5]'
                : 'text-[#6B756D] hover:text-[#191C19]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'signup'
                ? 'bg-white text-[#191C19] shadow-xs border border-[#E5EAE5]'
                : 'text-[#6B756D] hover:text-[#191C19]'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('forgot');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'forgot'
                ? 'bg-white text-[#191C19] shadow-xs border border-[#E5EAE5]'
                : 'text-[#6B756D] hover:text-[#191C19]'
            }`}
          >
            Reset
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#191C19] block">
              Email Address
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[#F7F9F7] rounded-xl border border-[#E5EAE5] focus-within:border-[#1DB954] focus-within:bg-white transition-all">
              <Mail className="w-4 h-4 text-[#6B756D] shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full bg-transparent text-sm text-[#191C19] placeholder:text-[#8E9990] focus:outline-none"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password input (omitted for forgot mode) */}
          {authMode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#191C19]">
                  Password
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-[#169C46] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[#F7F9F7] rounded-xl border border-[#E5EAE5] focus-within:border-[#1DB954] focus-within:bg-white transition-all">
                <Lock className="w-4 h-4 text-[#6B756D] shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters..."
                  className="w-full bg-transparent text-sm text-[#191C19] placeholder:text-[#8E9990] focus:outline-none"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6B756D] hover:text-[#191C19] p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D64545] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D64545]" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[#EAF8EF] border border-[#1DB954]/25 text-xs text-[#169C46] flex items-start gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#1DB954]" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#1DB954] hover:bg-[#169C46] text-white font-semibold rounded-xl text-sm shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing request...</span>
              </>
            ) : (
              <>
                {authMode === 'signup' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                ) : authMode === 'forgot' ? (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Recovery</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Account</span>
                  </>
                )}
              </>
            )}
          </button>
        </form>

        {/* Security & Privacy Disclosures */}
        <div className="pt-3 border-t border-[#E5EAE5] space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-[#6B756D]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
            <span>Zero-knowledge security: No PAN or bank credentials asked.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#6B756D]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
            <span>End-to-end encrypted telemetry and incident report logs.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
