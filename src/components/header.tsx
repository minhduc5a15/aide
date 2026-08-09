'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Code2, User } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    signOut();
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Code2 className="text-zinc-100" size={22} />
            <span className="text-lg font-semibold text-zinc-100 tracking-tight">
              AIDE Snippets
            </span>
          </Link>
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search..."
              className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 w-64 text-zinc-100 placeholder-zinc-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt={session.user?.name || 'User'} width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-semibold text-zinc-200 text-sm">
                      {session.user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-zinc-200 hidden sm:block">
                  {session.user?.name}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-50">
                  <div className="px-4 py-2 text-xs text-zinc-400 border-b border-zinc-800 mb-1">
                    Signed in as <br/>
                    <strong className="text-zinc-200 font-medium truncate block mt-0.5">{session.user?.email || session.user?.name}</strong>
                  </div>
                  <Link 
                    href="/my-snippets" 
                    className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Your snippets
                  </Link>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-[320px] p-5">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Sign out</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to sign out?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-1.5 rounded-md text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="px-4 py-1.5 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
