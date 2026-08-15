'use client';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Code2, Loader2, ArrowRight, User } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] w-full flex bg-zinc-950 overflow-hidden relative">
      {/* Background Particles/Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.05),transparent_40%)]"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        ></div>
      </div>

      <div className="flex w-full max-w-[1200px] mx-auto z-10">
        {/* Left Column: Branding (Hidden on small screens) */}
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
              The fastest way to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                share code
              </span>{' '}
              with your team.
            </h1>
            <p className="text-lg text-zinc-400 max-w-md">
              A lightning-fast, beautifully designed snippet manager built for modern developers.
            </p>
          </div>

          <div
            className={`flex items-center gap-4 text-sm text-zinc-500 transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center"
                >
                  <User size={14} className="text-zinc-500" />
                </div>
              ))}
            </div>
            <p>Join thousands of developers sharing code daily.</p>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
          <div
            className={`w-full max-w-[400px] transition-all duration-700 transform ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          >
            {/* Mobile Logo (Visible only on small screens) */}
            <div className="lg:hidden flex flex-col items-center justify-center mb-10">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)] mb-4">
                <Code2 className="text-indigo-400" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">AIDE Snippets</h1>
              <p className="text-sm text-zinc-400 mt-2">Share code snippets with your team</p>
            </div>

            {/* Login Card */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80"></div>

              <div className="mb-8 hidden lg:block">
                <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-sm text-zinc-400 mt-1">Sign in to your account to continue</p>
              </div>

              {error && (
                <div className="mb-6 p-4 border border-red-500/20 bg-red-500/10 rounded-xl text-red-400 text-sm font-medium flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email address
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-all shadow-inner placeholder-zinc-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-zinc-300">Password</label>
                    <a
                      href="#"
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within/input:text-indigo-400 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-all shadow-inner placeholder-zinc-600"
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 group/btn"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
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
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign up for free
              </Link>
            </div>

            <div className="mt-16 text-center text-xs text-zinc-600 flex items-center justify-center gap-4">
              <a href="#" className="hover:text-zinc-400 transition-colors">
                Terms of Service
              </a>
              <span>•</span>
              <a href="#" className="hover:text-zinc-400 transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
