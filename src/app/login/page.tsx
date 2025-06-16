'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [isDark, setIsDark] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check for stored email and redirect if logged in
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      router.replace(`/dashboard?email=${encodeURIComponent(storedEmail)}`);
    }
  }, [router]); // เพิ่ม router ใน dependency array

  // Load dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggle = () => {
    setIsDark((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode.toString());
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch(
        process.env.NEXT_PUBLIC_SCRIPT_URL ||
          'https://script.google.com/macros/s/AKfycbxOAMq6q5ir0e_j1_2Pc_2KG9r_LovObThQlaO8-LUrHij9zzmGR-mYbtzEgwnjhoNl/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          mode: 'cors',
          credentials: 'omit',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('userEmail', email); // เก็บ email หลัง login สำเร็จ
        router.push(`/dashboard?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-gray-900 dark:to-blue-950 transition-colors duration-700">
      <motion.div
        className="absolute top-6 right-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <label className="relative inline-flex items-center cursor-pointer group">
          <input type="checkbox" checked={isDark} onChange={handleToggle} className="sr-only peer" />
          <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-purple-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)] transform group-hover:scale-105">
            <motion.div className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg transform peer-checked:translate-x-10 transition-transform duration-500 flex items-center justify-center">
              <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
            </motion.div>
          </div>
        </label>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-gray-850/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_25px_rgba(99,102,241,0.7)] border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] transform transition-all duration-500 hover:scale-105"
      >
        <h2 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100 tracking-tight">เข้าสู่ระบบ</h2>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center text-sm text-red-600 dark:text-red-400 mb-4 bg-red-100/50 dark:bg-red-900/50 rounded-lg p-3 shadow-sm"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Email
            </label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
              type="email"
              id="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Password
            </label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
              type="password"
              id="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Signing In...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}