import React, { useState, useEffect, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import {
  LockKeyhole,
  Mail,
  Store,
  X,
  Phone,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  User,
  Sparkles,
  ShieldCheck,
  Bike,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { marketplaceApi } from '../../services/marketplaceApi';
import { seedDemoMarketplace } from '../../lib/seedDemoData';
import { useApp } from '../../context/AppContext';

interface AuthenticationScreenProps {
  onClose?: () => void;
  isModal?: boolean;
}

type AuthViewMode = 'signin' | 'signup' | 'phone' | 'forgot';

export const AuthenticationScreen: React.FC<AuthenticationScreenProps> = ({
  onClose,
  isModal = false,
}) => {
  const { loginDemoAccount } = useApp();

  const [mode, setMode] = useState<AuthViewMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Status & Error
  const [error, setError] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Production check: Demo accounts only appear if explicitly set in development
  const showDemoAccounts = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Standard Email + Password submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsOperationNotAllowed(false);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg(`Password reset instructions sent to ${email.trim()}`);
        setMode('signin');
      } else if (mode === 'signup') {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Authoritative server/db registration as CUSTOMER (never client-chosen role)
        await marketplaceApi.syncUserProfile(userCred.user, {
          name: fullName.trim() || undefined,
        });
        if (onClose) onClose();
      } else {
        // Sign in: system automatically resolves trusted role (Customer, Shop Owner, Staff, Delivery, Admin)
        await signInWithEmailAndPassword(auth, email.trim(), password);
        if (onClose) onClose();
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setError(
          'Email/Password sign-in method is not enabled in your Firebase project (dailymart-dd50a) yet.'
        );
      } else if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password. Please verify and try again.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
        setMode('signin');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        console.warn('Auth notice:', err?.message || err);
        setError(err?.message || 'Authentication failed. Please verify credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Continue with Google
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsOperationNotAllowed(false);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Ensure customer profile is recorded with Google identity
      await marketplaceApi.syncUserProfile(result.user);
      if (onClose) onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setError('Google Sign-In is not enabled in Firebase Console yet.');
      } else if (code === 'auth/popup-closed-by-user') {
        // Handled silently
      } else {
        setError(err?.message || 'Google Sign-In failed. Please try email or phone.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Continue with Phone
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsOperationNotAllowed(false);
    setLoading(true);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      setLoading(false);
      return;
    }

    const formattedNumber = cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? `+${cleanPhone}`
      : `+91${cleanPhone.slice(-10)}`;

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'phone-recaptcha-container', {
          size: 'invisible',
        });
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedNumber,
        recaptchaVerifierRef.current
      );
      setConfirmationResult(confirmation);
      setSuccessMsg(`OTP sent to ${formattedNumber}`);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setError('Phone sign-in is not enabled in Firebase project yet.');
      } else {
        setError(err?.message || 'Could not send verification code. Please check the number.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError(null);
    setLoading(true);

    try {
      const cred = await confirmationResult.confirm(otpCode.trim());
      await marketplaceApi.syncUserProfile(cred.user, {
        phone: phoneNumber,
      });
      if (onClose) onClose();
    } catch (err: any) {
      setError('Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Developer Test Account Fallback (only rendered when VITE_SHOW_DEMO_ACCOUNTS === 'true')
  const handleQuickDemoLogin = async (demoEmail: string) => {
    setError(null);
    setIsOperationNotAllowed(false);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, demoEmail, 'Demo@12345');
      if (onClose) onClose();
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        loginDemoAccount(demoEmail);
        if (onClose) onClose();
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, demoEmail, 'Demo@12345');
        if (onClose) onClose();
      } catch (signupErr: any) {
        if (signupErr?.code === 'auth/operation-not-allowed') {
          loginDemoAccount(demoEmail);
          if (onClose) onClose();
          return;
        }
        setError(`Could not log in as ${demoEmail}. ${signupErr?.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeedMarketplace = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await seedDemoMarketplace();
      if (res.success) {
        setSuccessMsg('Demo marketplace seeded! Test accounts and shops ready.');
      } else {
        setError(res.message);
      }
    } finally {
      setSeeding(false);
    }
  };

  const containerClasses = isModal
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto'
    : 'min-h-screen bg-stone-50 flex items-center justify-center p-4';

  return (
    <main className={containerClasses}>
      <div id="phone-recaptcha-container"></div>
      <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-xl space-y-4 my-auto relative animate-in zoom-in-95 duration-150 text-stone-900">
        {/* Close Button if Modal */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">DailyMart</h1>
          <p className="text-xs text-stone-500 font-medium">
            {mode === 'forgot'
              ? 'Reset your password'
              : mode === 'signup'
              ? 'Create an account'
              : mode === 'phone'
              ? 'Sign in with Phone'
              : 'Welcome back'}
          </p>
        </div>

        {/* Alerts & Operational Notes */}
        {error && !isOperationNotAllowed && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-medium text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isOperationNotAllowed && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-950 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Enable Email/Password in Firebase Console:</p>
                <ol className="list-decimal ml-4 mt-1 space-y-0.5 text-[11px] text-amber-900 font-medium">
                  <li>Open Firebase Console for <code className="bg-amber-100 px-1 rounded">dailymart-dd50a</code></li>
                  <li>Go to <strong>Authentication</strong> → <strong>Sign-in method</strong></li>
                  <li>Enable <strong>Email/Password</strong> and click <strong>Save</strong></li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-medium text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE: PHONE AUTH */}
        {mode === 'phone' ? (
          <div className="space-y-3.5">
            {!confirmationResult ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                <label className="block text-xs font-bold text-stone-700">
                  Mobile Number
                  <div className="relative mt-1 flex rounded-xl border border-stone-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                    <span className="inline-flex items-center px-3 bg-stone-50 text-stone-500 text-xs font-bold border-r border-stone-200">
                      +91
                    </span>
                    <input
                      required
                      type="tel"
                      autoFocus
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-2.5 px-3 text-xs focus:outline-none font-medium"
                      placeholder="98765 43210"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading || phoneNumber.length < 10}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-extrabold text-white disabled:opacity-60 transition-colors shadow-xs cursor-pointer"
                >
                  {loading ? 'Sending OTP…' : 'Continue with Phone'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                <label className="block text-xs font-bold text-stone-700">
                  Enter 6-Digit Verification Code
                  <input
                    required
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full mt-1 text-center tracking-widest text-lg font-black rounded-xl border border-stone-300 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••••"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-extrabold text-white disabled:opacity-60 transition-colors shadow-xs cursor-pointer"
                >
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setConfirmationResult(null);
                setError(null);
              }}
              className="w-full text-center text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 cursor-pointer pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        ) : mode === 'forgot' ? (
          /* MODE: FORGOT PASSWORD */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <label className="block text-xs font-bold text-stone-700">
              Email address
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-extrabold text-white disabled:opacity-60 transition-colors shadow-xs cursor-pointer"
            >
              {loading ? 'Please wait…' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="w-full text-center text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 cursor-pointer pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </form>
        ) : (
          /* MODE: SIGN IN / CREATE ACCOUNT */
          <div className="space-y-3.5">
            {/* 1. Continue with Google */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.14C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.41l4.04-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.14c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* 2. Continue with Phone */}
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMode('phone');
                setError(null);
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Continue with Phone</span>
            </button>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  or
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <label className="block text-xs font-bold text-stone-700">
                  Full Name
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      required
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      placeholder="Your full name"
                    />
                  </div>
                </label>
              )}

              <label className="block text-xs font-bold text-stone-700">
                Email address
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </label>

              <label className="block text-xs font-bold text-stone-700">
                <div className="flex items-center justify-between">
                  <span>Password</span>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                      }}
                      className="text-[11px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <LockKeyhole className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    required
                    minLength={6}
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-extrabold text-white disabled:opacity-60 transition-colors shadow-xs cursor-pointer mt-1"
              >
                {loading
                  ? 'Please wait…'
                  : mode === 'signup'
                  ? 'Create Account'
                  : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                {mode === 'signup' ? (
                  <p className="text-xs text-stone-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="font-extrabold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-stone-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                      }}
                      className="font-extrabold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Create Account
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        {/* 🧪 Developer Only Test Panel (COMPLETELY OMITTED in production) */}
        {showDemoAccounts && (
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Development Test Accounts</span>
              </span>
              <button
                onClick={handleSeedMarketplace}
                disabled={seeding}
                className="text-[10px] font-bold text-stone-500 hover:text-emerald-700 cursor-pointer underline"
                title="Resets demo marketplace data"
              >
                {seeding ? 'Seeding...' : 'Reset Demo Data'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('user@dailymart.com')}
                className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-left"
              >
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight">Customer</p>
                  <p className="text-[9px] text-stone-400 truncate">user@</p>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('shopowner@dailymart.com')}
                className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-left"
              >
                <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight">Shop Owner</p>
                  <p className="text-[9px] text-stone-400 truncate">shopowner@</p>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('delivery@dailymart.com')}
                className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-left"
              >
                <Bike className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight">Delivery Staff</p>
                  <p className="text-[9px] text-stone-400 truncate">delivery@</p>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('admin@dailymart.com')}
                className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-left"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight">Platform Admin</p>
                  <p className="text-[9px] text-stone-400 truncate">admin@</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
