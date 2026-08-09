'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (res.ok) {
      router.push('/login');
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to register');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-[340px]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-medium text-zinc-100 tracking-tight">Create an account</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 shadow-lg">
          {error && (
            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 rounded-md text-red-400 text-sm font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Username</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-100 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-100 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-100 transition-colors"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="mt-6 border border-zinc-800 rounded-lg p-4 text-center text-sm text-zinc-400 bg-zinc-900/50">
          Already have an account?{' '}
          <Link href="/login" className="text-zinc-100 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
