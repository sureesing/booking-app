'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingPage() {
  const [isDark, setIsDark] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

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

  const handleLogout = () => {
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('timeSlot', timeSlot);
      formData.append('details', details);

      const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwU8bJTlS7L0-bQWBmCNyXYyYkZTUWpMA8Mdz3giK46kdocoKhOnN4HmPy3DPntYDhz/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        alert('Booking successful!');
        setFirstName('');
        setLastName('');
        setTimeSlot('');
        setDetails('');
      } else {
        setError(data.message || 'Failed to book time slot');
      }
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const timeSlots = [
    '08:00-09:00',
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
    '17:00-18:00',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
      {/* Menubar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 glassmorphism"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">BookingHub</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{email}</span>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={isDark}
                onChange={handleToggle}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-300 peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-purple-600 rounded-full transition-all duration-300 shadow-inner">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transform peer-checked:translate-x-6 transition-transform duration-300 flex items-center justify-center">
                  <span className="text-xs">{isDark ? '☀️' : '🌙'}</span>
                </div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDark ? 'Light' : 'Dark'}
              </span>
            </label>
            <button
              onClick={handleLogout}
              className="gradient-button text-white text-sm font-medium py-2 px-4 rounded-full shadow-md hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300"
            >
              Logout
            </button>
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden glassmorphism border-t border-gray-200/30 dark:border-indigo-500/30"
            >
              <div className="px-4 py-4 flex flex-col space-y-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{email}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={handleToggle}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-300 peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-purple-600 rounded-full transition-all duration-300 shadow-inner">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transform peer-checked:translate-x-6 transition-transform duration-300 flex items-center justify-center">
                      <span className="text-xs">{isDark ? '☀️' : '🌙'}</span>
                    </div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isDark ? 'Light' : 'Dark'}
                  </span>
                </label>
                <button
                  onClick={handleLogout}
                  className="gradient-button text-white text-sm font-medium py-2 px-4 rounded-full shadow-md hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto p-8 sm:p-10 rounded-3xl glassmorphism gradient-border transform transition-all duration-500 hover:scale-[1.02]"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          Book a Time Slot
        </h2>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-red-600 dark:text-red-400 mb-6 bg-red-100/50 dark:bg-red-900/30 rounded-lg p-3"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName" className="block mb-2 text-sm font-semibold text-gray-900 dark:text-gray-300">
              First Name
            </label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              type="text"
              id="firstName"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 input-focus transition-all duration-300 shadow-sm hover:shadow-md"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block mb-2 text-sm font-semibold text-gray-900 dark:text-gray-300">
              Last Name
            </label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              type="text"
              id="lastName"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 input-focus transition-all duration-300 shadow-sm hover:shadow-md"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="timeSlot" className="block mb-2 text-sm font-semibold text-gray-900 dark:text-gray-300">
              Time Slot
            </label>
            <motion.select
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              id="timeSlot"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 input-focus transition-all duration-300 shadow-sm hover:shadow-md"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              required
            >
              <option value="" disabled>Select a time slot</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </motion.select>
          </div>
          <div>
            <label htmlFor="details" className="block mb-2 text-sm font-semibold text-gray-900 dark:text-gray-300">
              Booking Details
            </label>
            <motion.textarea
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              id="details"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 input-focus transition-all duration-300 shadow-sm hover:shadow-md"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Enter booking details"
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full gradient-button text-white font-semibold py-3 px-4 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Booking...
              </span>
            ) : (
              'Book Now'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}