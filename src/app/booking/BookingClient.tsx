'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Calendar, User, LogOut, Moon, Sun, LayoutDashboard } from 'lucide-react';

export default function BookingClient() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams?.get('email') || '';
  const [email, setEmail] = useState<string>(emailFromUrl);

  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  // Initialize dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(savedMode);
    document.documentElement.classList.toggle('dark', savedMode);
  }, []);

  // Check for stored email and validate session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedEmail = localStorage.getItem('userEmail');
    if (!emailFromUrl && storedEmail) {
      setEmail(storedEmail);
      router.replace(`/booking?email=${encodeURIComponent(storedEmail)}`);
    } else if (!emailFromUrl && !storedEmail) {
      setError('กรุณาเข้าสู่ระบบเพื่อจองนัดหมาย');
      router.replace('/login');
    }
  }, [emailFromUrl, router]);

  // Handle dark mode updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userEmail');
    }
    router.replace('/login');
  };

  const handleViewBookings = () => {
    router.push(`/bookings?email=${encodeURIComponent(email)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || hasSubmitted) return;

    setError('');
    setIsLoading(true);
    setHasSubmitted(true);

    if (!firstName || !lastName || !timeSlot || !details) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      setIsLoading(false);
      setHasSubmitted(false);
      return;
    }

    try {
      const scriptUrl = process.env.NEXT_PUBLIC_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxOAMq6q5ir0e_j1_2Pc_2KG9r_LovObThQlaO8-LUrHij9zzmGR-mYbtzEgwnjhoNl/exec';
      if (!scriptUrl) {
        throw new Error('Missing NEXT_PUBLIC_SCRIPT_URL environment variable');
      }

      const formData = new URLSearchParams();
      formData.append('email', email);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('timeSlot', timeSlot);
      formData.append('details', details);

      console.log('Submitting booking with data:', {
        email,
        firstName,
        lastName,
        timeSlot,
        details,
      });

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('POST response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('POST response data:', data);

      if (data.success) {
        setFirstName('');
        setLastName('');
        setTimeSlot('');
        setDetails('');
        setHasSubmitted(false);
        router.push(`/bookings?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.message || 'ไม่สามารถจองได้ กรุณาลองอีกครั้ง');
        setHasSubmitted(false);
      }
    } catch (err) {
      console.error('POST error:', err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง');
      setHasSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const timeSlots = [
    { display: 'คาบ 0', value: '07:30-08:00' },
    { display: 'คาบ 1', value: '08:30-09:30' },
    { display: 'คาบ 2', value: '09:30-10:30' },
    { display: 'คาบ 3', value: '10:30-11:30' },
    { display: 'คาบ 4', value: '11:30-12:30' },
    { display: 'คาบ 5', value: '12:30-13:30' },
    { display: 'คาบ 6', value: '13:30-14:30' },
    { display: 'คาบ 7', value: '14:30-15:30' },
    { display: 'คาบ 8', value: '15:30-16:30' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-indigo-100 to-red-100 dark:from-indigo-950 dark:via-gray-900 dark:to-red-950 transition-colors duration-700">
      {/* Navigation */}
      <motion.nav
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-850/95 backdrop-blur-2xl shadow-md border-b border-gray-200/50 dark:border-[rgba(99,102,241,0.5)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <Calendar className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400">
              iMedReserve
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-950 dark:text-gray-100">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium">{email}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/dashboard?email=${encodeURIComponent(email)}`)}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewBookings}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Bookings</span>
            </motion.button>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={isDark}
                onChange={handleToggle}
                className="sr-only peer"
              />
              <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-red-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                <motion.div
                  className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500"
                >
                  <span className="text-sm">{isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}</span>
                </motion.div>
              </div>
              <span className="ml-4 text-sm font-semibold text-gray-950 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </label>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-gradient-to-r from-indigo-600 to-red-600 dark:from-indigo-700 dark:to-red-700 text-white text-sm font-medium py-2 px-5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </motion.button>
          </div>
          <div className="md:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-950 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </motion.button>
          </div>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-white/95 dark:bg-gray-850/95 backdrop-blur-2xl border-t border-gray-200/50 dark:border-[rgba(99,102,241,0.5)]"
            >
              <div className="px-4 py-4 flex flex-col space-y-4">
                <div className="flex items-center space-x-2 text-gray-950 dark:text-gray-100">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium">{email}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/dashboard?email=${encodeURIComponent(email)}`)}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewBookings}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Bookings</span>
                </motion.button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={handleToggle}
                    className="sr-only peer"
                  />
                  <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-red-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                    <motion.div
                      className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500"
                    >
                      <span className="text-sm">{isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}</span>
                    </motion.div>
                  </div>
                  <span className="ml-4 text-sm font-semibold text-gray-950 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </label>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-indigo-600 to-red-600 dark:from-indigo-700 dark:to-red-700 text-white text-sm font-medium py-2 px-5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-10 transition-colors duration-700">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-white/90 dark:bg-gray-850/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_25px_rgba(99,102,241,0.7)] border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] transform transition-all duration-500 hover:scale-105"
        >
          <h2 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400 mb-8 tracking-tight">
            ระบบจองการใช้ห้องพยาบาล
          </h2>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center text-sm text-red-600 dark:text-red-400 mb-6 bg-red-100/50 dark:bg-red-900/50 rounded-lg p-3 shadow-sm"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                  ชื่อจริง
                </label>
                <motion.input
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                  type="text"
                  id="firstName"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white/90 dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                  นามสกุล
                </label>
                <motion.input
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                  type="text"
                  id="lastName"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white/90 dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                เวลาในการเข้าใช้งาน
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {timeSlots.map((slot) => (
                  <motion.div
                    key={slot.value}
                    whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(99,102,241,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center w-16 h-16 rounded-full border-2 cursor-pointer transition-all duration-300 ${
                      timeSlot === slot.value
                        ? 'bg-gradient-to-r from-indigo-600 to-red-600 text-white border-indigo-600 dark:border-indigo-500 shadow-lg'
                        : 'bg-white/90 dark:bg-gray-700/80 border-gray-300 dark:border-indigo-600 text-gray-950 dark:text-gray-100 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                    }`}
                    onClick={() => setTimeSlot(slot.value)}
                  >
                    <span className="text-sm font-medium">{slot.display}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="details" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                อาการที่เป็น
              </label>
              <motion.textarea
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                id="details"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white/90 dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                placeholder="ใส่รายละเอียดอาการที่เป็น เช่น ปวดหัว ท้องเสีย คลื่นไส้ อาเจียน"
                required
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-red-600 dark:from-indigo-700 dark:to-red-700 hover:from-indigo-700 hover:to-red-700 dark:hover:from-indigo-800 dark:hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading || hasSubmitted}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>ยืนยันการจอง...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>ยืนยันการจอง</span>
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/20 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 15, 0], y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-red-200/20 dark:bg-red-600/20 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, -15, 0], y: [0, -20, 0] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
    </div>
  );
}