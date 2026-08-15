import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 max-w-md w-full shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 border border-zinc-700 shadow-inner">
          <FileQuestion size={40} className="text-zinc-400" />
        </div>

        <h1 className="text-4xl font-bold text-zinc-100 mb-2">404</h1>
        <h2 className="text-xl font-medium text-zinc-300 mb-6">Snippet not found</h2>

        <p className="text-zinc-500 mb-8 leading-relaxed">
          The snippet you are looking for doesn't exist, has been deleted, or is a secret snippet
          you don't have access to.
        </p>

        <Link
          href="/"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/20"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
