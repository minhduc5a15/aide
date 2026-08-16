'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Code2,
  Lock,
  GitFork,
  Star,
  Search,
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Settings,
  X,
  Loader2,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function MySnippets() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [snippets, setSnippets] = useState<
    {
      id: string;
      files?: { name: string; content: string }[];
      filesCount: number;
      forksCount: number;
      createdAt: string;
      isSecret: boolean;
      description?: string | null;
      updatedAt?: string;
      _count?: { comments: number };
      starsCount?: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [profile, setProfile] = useState<{
    name?: string;
    bio?: string;
    location?: string;
    website?: string;
    createdAt?: string;
    email?: string;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '', website: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'stars'
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/my-snippets').then((res) => res.json()),
        fetch('/api/profile').then((res) => res.json()),
      ])
        .then(([snippetsData, profileData]) => {
          if (Array.isArray(snippetsData)) setSnippets(snippetsData);
          if (!profileData.error) {
            setProfile(profileData);
            setEditForm({
              name: profileData.name || '',
              bio: profileData.bio || '',
              location: profileData.location || '',
              website: profileData.website || '',
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  // Derived stats
  const totalSnippets = snippets.length;
  const totalStars = snippets.reduce((acc, curr) => acc + (curr.starsCount || 0), 0);

  // Filtered & Sorted snippets
  const processedSnippets = useMemo(() => {
    const result = snippets.filter(
      (s) =>
        (s.files?.[0]?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'stars') {
      result.sort((a, b) => (b.starsCount || 0) - (a.starsCount || 0));
    }

    return result;
  }, [snippets, searchQuery, sortOrder]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (res.ok) {
        setProfile(data);
        setIsEditModalOpen(false);
        toast.success('Profile updated successfully');
        // Update session if name changed
        if (data.name !== session?.user?.name) {
          await update({ name: data.name });
        }
      } else {
        setProfileError(data.error || 'Failed to update profile');
      }
    } catch {
      setProfileError('An unexpected error occurred');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex justify-center items-center text-zinc-500">
        Loading your profile...
      </div>
    );
  }

  return (
    <main className="w-full bg-zinc-950 pb-16">
      {/* Cover Banner */}
      <div className="w-full h-48 md:h-64 bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-zinc-900 border-b border-zinc-800 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar (Profile Info) */}
          <div className="w-full md:w-1/4 -mt-16 relative z-10">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-zinc-900 border-4 border-zinc-950 flex items-center justify-center overflow-hidden shadow-xl mb-4">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={profile?.name || 'User'}
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-semibold text-zinc-200 text-5xl md:text-7xl">
                  {profile?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
              {profile?.name}
            </h1>
            <p className="text-lg text-zinc-400 mb-4">{profile?.email}</p>

            <button
              onClick={() => {
                setEditForm({
                  name: profile?.name || '',
                  bio: profile?.bio || '',
                  location: profile?.location || '',
                  website: profile?.website || '',
                });
                setIsEditModalOpen(true);
              }}
              className="w-full py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-sm font-medium text-zinc-200 transition-colors mb-4 flex justify-center items-center gap-2"
            >
              <Settings size={16} /> Edit profile
            </button>

            <div className="text-sm text-zinc-300 mb-6 leading-relaxed whitespace-pre-wrap">
              {profile?.bio || 'Add a bio to let people know more about you and your work.'}
            </div>

            <div className="flex flex-col gap-2 text-sm text-zinc-400 mb-6">
              {profile?.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} /> {profile.location}
                </div>
              )}
              {profile?.website && (
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} />
                  <a
                    href={
                      profile.website.startsWith('http')
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-400 hover:underline"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {profile?.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} /> Joined{' '}
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-800 text-sm">
              <div className="flex flex-col">
                <span className="font-bold text-zinc-200 text-lg">{totalSnippets}</span>
                <span className="text-zinc-500">Snippets</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-zinc-200 text-lg">{totalStars}</span>
                <span className="text-zinc-500">Stars</span>
              </div>
            </div>
          </div>

          {/* Right Main Content (Snippets List) */}
          <div className="w-full md:w-3/4 pt-8 md:pt-12">
            {/* Toolbar (Search, Sort, View) */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 pb-4 border-b border-zinc-800">
              <div className="relative w-full sm:w-auto flex-1 max-w-md">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Find a snippet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-200 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Plus size={16} /> New Snippet
                </Link>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="stars">Most starred</option>
                </select>

                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      'p-1.5 rounded transition-colors',
                      viewMode === 'list'
                        ? 'bg-zinc-800 text-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-300'
                    )}
                    title="List view"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      'p-1.5 rounded transition-colors',
                      viewMode === 'grid'
                        ? 'bg-zinc-800 text-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-300'
                    )}
                    title="Grid view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Snippets Container */}
            <div
              className={clsx(
                'gap-6',
                viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2' : 'flex flex-col'
              )}
            >
              {processedSnippets.length === 0 ? (
                <div className="col-span-full text-center py-16 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/30">
                  <p className="text-zinc-400 mb-4">No snippets found matching your criteria.</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium text-sm transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                processedSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="border border-zinc-800 rounded-xl bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-colors shadow-sm group flex flex-col"
                  >
                    <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-900">
                      <div className="flex justify-between items-start mb-2">
                        <Link
                          href={`/${profile?.name || 'guest'}/${snippet.id}`}
                          className="text-indigo-400 font-semibold text-lg hover:underline truncate mr-2"
                        >
                          {snippet.files?.[0]?.name || snippet.id}
                        </Link>
                        {snippet.isSecret && (
                          <span className="flex items-center shrink-0 gap-1 px-2 py-0.5 rounded-full border border-zinc-700 text-[10px] font-medium text-zinc-400 bg-zinc-800 uppercase tracking-wider">
                            <Lock size={10} /> Secret
                          </span>
                        )}
                      </div>

                      {snippet.description ? (
                        <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                          {snippet.description}
                        </p>
                      ) : (
                        <p className="text-sm text-zinc-600 italic line-clamp-2 mb-3">
                          No description provided.
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium mt-auto">
                        <div
                          className={clsx(
                            'flex items-center gap-1.5 transition-colors',
                            (snippet.starsCount || 0) > 0 ? 'text-yellow-400/90' : 'text-zinc-600'
                          )}
                          title="Stars"
                        >
                          <Star
                            size={14}
                            className={(snippet.starsCount || 0) > 0 ? 'fill-yellow-400/20' : ''}
                          />
                          {(snippet.starsCount || 0) > 0 ? snippet.starsCount : '0'}
                        </div>
                        <div
                          className={clsx(
                            'flex items-center gap-1.5 transition-colors',
                            (snippet.forksCount || 0) > 0 ? 'text-blue-400/90' : 'text-zinc-600'
                          )}
                          title="Forks"
                        >
                          <GitFork size={14} />
                          {(snippet.forksCount || 0) > 0 ? snippet.forksCount : '0'}
                        </div>
                        <div
                          className={clsx(
                            'flex items-center gap-1.5 transition-colors',
                            (snippet._count?.comments || 0) > 0
                              ? 'text-green-400/90'
                              : 'text-zinc-600'
                          )}
                          title="Comments"
                        >
                          <MessageSquare size={14} />
                          {(snippet._count?.comments || 0) > 0 ? snippet._count?.comments : '0'}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500" title="Files">
                          <Code2 size={14} />
                          {snippet.filesCount || 1}
                        </div>
                        <div className="text-zinc-500 ml-auto" title="Updated">
                          {new Date(snippet.updatedAt || snippet.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Short Preview */}
                    <div className="p-4 bg-zinc-950 text-xs text-zinc-300 font-mono whitespace-pre-wrap relative flex-1">
                      <div className="max-h-24 overflow-hidden">
                        {snippet.files?.[0]?.content
                          ? snippet.files[0].content.split('\n').slice(0, 5).join('\n')
                          : '// Empty file'}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-semibold text-zinc-100">Edit profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {profileError && (
                <div className="mb-4 p-3 border border-red-500/20 bg-red-500/10 rounded-lg text-red-400 text-sm font-medium">
                  {profileError}
                </div>
              )}
              <form
                id="edit-profile-form"
                onSubmit={handleSaveProfile}
                className="flex flex-col gap-5"
              >
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us a little about yourself"
                    rows={3}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Website</label>
                  <input
                    type="text"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 transition-colors"
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                form="edit-profile-form"
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingProfile && <Loader2 size={16} className="animate-spin" />}
                Save profile
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
