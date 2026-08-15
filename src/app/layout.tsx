import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/auth-provider';
import Header from '@/components/header';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AIDE',
  description: 'Advanced Agentic IDE platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-zinc-950 min-h-screen text-zinc-300`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' },
            }}
          />
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
