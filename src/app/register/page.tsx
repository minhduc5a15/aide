'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Code2, Loader2, ArrowRight, User, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username]);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password) || /[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return Math.min(strength, 3); // 0-3 scale
  };
  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is already taken.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Account created! Please sign in.');
        router.push('/login');
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] w-full flex bg-zinc-950 overflow-hidden relative">
      {/* Background Particles/Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_80%,rgba(99,102,241,0.05),transparent_40%)]"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        ></div>
      </div>

      <div className="flex w-full max-w-[1200px] mx-auto z-10">
        {/* Left Column: Branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 lg:p-20 relative">
          <div
            className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Code2 className="text-indigo-400" size={28} />
              </div>
              <span className="text-2xl font-bold text-zinc-100 tracking-tight">AIDE Snippets</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-zinc-100 leading-tight tracking-tight mb-6">
              Start sharing <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                your code
              </span>{' '}
              today.
            </h1>
            <p className="text-lg text-zinc-400 max-w-md">
              Create an account in seconds and unlock features like secret snippets, starring, and
              community discussions.
            </p>
          </div>

          <div
            className={`flex items-center gap-4 text-sm text-zinc-500 transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center"
                >
                  <User size={14} className="text-zinc-500" />
                </div>
              ))}
            </div>
            <p>Join thousands of developers sharing code.</p>
          </div>
        </div>

        {/* Right Column: Register Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
          <div
            className={`w-full max-w-[420px] transition-all duration-700 transform ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center justify-center mb-8">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)] mb-4">
                <Code2 className="text-indigo-400" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Create an account</h1>
            </div>

            {/* Register Card */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80"></div>

              <div className="mb-6 hidden lg:block">
                <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">
                  Create an account
                </h2>
              </div>

              {error && (
                <div className="mb-6 p-4 border border-red-500/20 bg-red-500/10 rounded-xl text-red-400 text-sm font-medium flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Username Input */}
                <div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className={`w-full bg-zinc-950/50 border ${usernameAvailable === false ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : usernameAvailable === true ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500' : 'border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500'} rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 text-zinc-100 transition-all shadow-inner placeholder-zinc-500`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      {checkingUsername && (
                        <Loader2 size={16} className="text-zinc-500 animate-spin" />
                      )}
                      {!checkingUsername && usernameAvailable === true && (
                        <Check size={16} className="text-green-500" />
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <X size={16} className="text-red-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5 ml-1">
                    3-20 chars, letters/numbers/underscores only
                  </p>
                </div>

                {/* Email Input */}
                <div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-all shadow-inner placeholder-zinc-500"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-all shadow-inner placeholder-zinc-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 focus:outline-none transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      <div
                        className={`h-1 flex-1 rounded-full ${strength >= 1 ? 'bg-red-500' : 'bg-zinc-800'} transition-colors`}
                      ></div>
                      <div
                        className={`h-1 flex-1 rounded-full ${strength >= 2 ? 'bg-yellow-500' : 'bg-zinc-800'} transition-colors`}
                      ></div>
                      <div
                        className={`h-1 flex-1 rounded-full ${strength >= 3 ? 'bg-green-500' : 'bg-zinc-800'} transition-colors`}
                      ></div>
                    </div>
                  )}
                  <p className="text-[11px] text-zinc-500 mt-1.5 ml-1">
                    Min 8 chars, including at least 1 number
                  </p>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-all shadow-inner placeholder-zinc-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 focus:outline-none transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || usernameAvailable === false}
                  className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 group/btn"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight
                        size={16}
                        className="opacity-70 group-hover/btn:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 text-center text-sm text-zinc-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
