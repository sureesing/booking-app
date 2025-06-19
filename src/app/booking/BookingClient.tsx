'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Calendar, Moon, Sun, LayoutDashboard } from 'lucide-react';

export default function BookingClient() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [date, setDate] = useState<string>('');
  const [period, setPeriod] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [symptomCategory, setSymptomCategory] = useState<string>('');
  const [customSymptoms, setCustomSymptoms] = useState<string>('');
  const [treatment, setTreatment] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const router = useRouter();

  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  // Initialize dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(savedMode);
    document.documentElement.classList.toggle('dark', savedMode);
  }, []);

  // Handle dark mode updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('กรุณาอัปโหลดไฟล์ภาพ (.jpg หรือ .png เท่านั้น)');
        setImage(null);
        setImagePreview(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ไฟล์ภาพต้องมีขนาดไม่เกิน 5MB');
        setImage(null);
        setImagePreview(null);
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        setError('ไม่สามารถโหลดตัวอย่างภาพได้');
        setImage(null);
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  const handleViewBookings = () => {
    router.push('/bookings');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || hasSubmitted) return;

    setError('');
    setIsLoading(true);
    setHasSubmitted(true);

    // Validate inputs
    if (!date || !period || !studentId || !grade || !prefix || !firstName || !lastName || !symptomCategory || (symptomCategory === 'อื่นๆ' && !customSymptoms) || !treatment) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      setIsLoading(false);
      setHasSubmitted(false);
      return;
    }

    // Validate student ID (numeric only)
    if (!/^\d+$/.test(studentId)) {
      setError('รหัสนักเรียนต้องเป็นตัวเลขเท่านั้น');
      setIsLoading(false);
      setHasSubmitted(false);
      return;
    }

    // Prepare symptoms
    const symptoms = symptomCategory === 'อื่นๆ' ? customSymptoms : symptomCategory;

    try {
      const scriptUrl = '/api/proxy';
      const formData = new FormData();
      formData.append('date', date);
      formData.append('period', period);
      formData.append('studentId', studentId);
      formData.append('grade', grade);
      formData.append('prefix', prefix);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('symptoms', symptoms);
      formData.append('treatment', treatment);

      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setDate('');
        setPeriod('');
        setStudentId('');
        setGrade('');
        setPrefix('');
        setFirstName('');
        setLastName('');
        setSymptomCategory('');
        setCustomSymptoms('');
        setTreatment('');
        setImage(null);
        setImagePreview(null);
        setHasSubmitted(false);
        router.push('/bookings');
      } else {
        setError(data.message || 'ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง');
        setHasSubmitted(false);
      }
    } catch (err: any) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + err.message);
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

  const prefixes = ['เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว'];

  const symptomCategories = ['ปวดหัว', 'ไข้', 'ปวดท้อง', 'เจ็บคอ', 'บาดเจ็บ', 'อื่นๆ'];

  // Generate grade options (1/1 to 6/12)
  const gradeOptions: string[] = [];
  for (let level = 1; level <= 6; level++) {
    for (let room = 1; room <= 12; room++) {
      gradeOptions.push(`${level}/${room}`);
    }
  }

  // Define min and max date for input (original range)
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;
  const maxDate = `${currentYear + 1}-12-31`;

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
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>แดชบอร์ด</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewBookings}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>ประวัติการบันทึก</span>
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
                  {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </motion.div>
              </div>
              <span className="ml-4 text-sm font-semibold text-gray-950 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                {isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
              </span>
            </label>
          </div>
          <div className="md:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-950 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>แดชบอร์ด</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewBookings}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>ประวัติการบันทึก</span>
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
                      {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    </motion.div>
                  </div>
                  <span className="ml-4 text-sm font-semibold text-gray-950 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    {isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                  </span>
                </label>
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
          className="w-full max-w-2xl p-8 sm:p-10 rounded-3xl bg-white dark:bg-gray-850/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_25px_rgba(99,102,241,0.7)] border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] transform transition-all duration-500"
          style={{ backgroundColor: 'white' }}
        >
          <h2 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400 mb-4 tracking-tight">
            โรงเรียนสิงห์บุรี
          </h2>
          <h3 className="text-2xl font-semibold text-center text-gray-950 dark:text-gray-100 mb-4">
            ระบบบันทึกนักเรียนเข้ารับบริการห้องพยาบาล
          </h3>
          <p className="text-center text-lg text-gray-950 dark:text-gray-100 mb-8">
            ปีการศึกษา 2567
          </p>
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
            <div>
              <label htmlFor="date" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                วันที่
              </label>
              <motion.input
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                type="date"
                id="date"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                max={maxDate}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                คาบเรียน
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {timeSlots.map((slot) => (
                  <motion.div
                    key={slot.value}
                    whileHover={{
                      scale: 1.12,
                      boxShadow: '0 0 18px rgba(99,102,241,0.18)',
                      borderColor: '#6366f1',
                      backgroundColor: '#e0e7ff',
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 cursor-pointer transition-all duration-300 select-none
                      ${period === slot.value
                        ? 'bg-gradient-to-r from-indigo-600 to-red-600 text-white border-indigo-600 dark:border-indigo-500 shadow-xl'
                        : 'bg-white dark:bg-gray-700/80 border-gray-300 dark:border-indigo-600 text-gray-950 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg'}
                    `}
                    onClick={() => setPeriod(slot.value)}
                    style={{ minWidth: '80px', minHeight: '80px' }}
                  >
                    <span className="text-base font-bold leading-tight">
                      {slot.display}
                    </span>
                    <span className={`text-xs mt-1 ${period === slot.value ? 'text-white/90' : 'text-gray-500 dark:text-gray-300'}`}>{slot.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="studentId" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                  เลขประจำตัวนักเรียน
                </label>
                <motion.input
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                  type="text"
                  id="studentId"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="grade" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                  ชั้น
                </label>
                <div className="relative">
                  <motion.select
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                    id="grade"
                    className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 appearance-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                  >
                    <option value="">เลือกชั้น</option>
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>{`ม.${g}`}</option>
                    ))}
                  </motion.select>
                  <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300">
                    ▼
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="prefix" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                คำนำหน้า
              </label>
              <div className="relative">
                <motion.select
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                  id="prefix"
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 appearance-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  required
                >
                  <option value="">เลือกคำนำหน้า</option>
                  {prefixes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </motion.select>
                <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300">
                  ▼
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                  ชื่อ
                </label>
                <motion.input
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                  type="text"
                  id="firstName"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="symptomCategory" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                อาการ
              </label>
              <div className="relative">
                <motion.select
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                  id="symptomCategory"
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 appearance-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                  value={symptomCategory}
                  onChange={(e) => setSymptomCategory(e.target.value)}
                  required
                >
                  <option value="">เลือกอาการ</option>
                  {symptomCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </motion.select>
                <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300">
                  ▼
                </span>
              </div>
            </div>
            {symptomCategory === 'อื่นๆ' && (
              <div>
                <label htmlFor="customSymptoms" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                  ระบุอาการเพิ่มเติม
                </label>
                <motion.textarea
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                  id="customSymptoms"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                  value={customSymptoms}
                  onChange={(e) => setCustomSymptoms(e.target.value)}
                  rows={4}
                  placeholder="ระบุอาการ เช่น ท้องเสีย คลื่นไส้"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="image" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                แนบรูปภาพ (ถ้ามี)
              </label>
              <motion.input
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                type="file"
                id="image"
                accept="image/jpeg,image/png"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <p className="text-sm text-gray-950 dark:text-gray-100 mb-2">ตัวอย่างภาพ:</p>
                  <img src={imagePreview} alt="Image Preview" className="max-w-xs rounded-lg shadow-sm" />
                </motion.div>
              )}
            </div>
            <div>
              <label htmlFor="treatment" className="block mb-2 text-sm font-semibold text-gray-950 dark:text-gray-100">
                การรักษา
              </label>
              <motion.textarea
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}
                id="treatment"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-indigo-600 bg-white dark:bg-gray-700/80 text-gray-950 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                rows={4}
                placeholder="เช่น ให้ยาแก้ปวด พักผ่อน"
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
                  <span>บันทึกข้อมูล...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>บันทึกข้อมูล</span>
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-400/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 15, 0], y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-red-200/20 dark:bg-red-400/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, -15, 0], y: [0, -20, 0] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
    </div>
  );
}