import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { NeonButton } from '../components/ui';
import { Zap, Mail, AlertCircle, Phone, MessageCircle, Play, ChevronLeft, ChevronRight, ChevronDown, Camera, Image as ImageIcon, Pencil } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase/config';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';
import { mockLogin, mockGoogleSignIn, mockSignup, mockOTPSend, mockOTPVerify } from '../lib/mock/mockAuth';

export default function AuthScreen() {
  const { setAuthenticated } = useAuthStore();
  const [step, setStep] = useState<'splash' | 'onboarding' | 'login' | 'signup' | 'otp' | 'phone-login' | 'profile-setup' | 'forgot-password'>('splash');
  const [slideIndex, setSlideIndex] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSource, setOtpSource] = useState<'signup' | 'phone-login'>('signup');
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [forgotEmailSent, setForgotEmailSent] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(val.length - 1);
    }
    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);

    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit logic
    const currentCode = newOtp.join('');
    if (currentCode.length === 6) {
       handleVerifyOTP(undefined, currentCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleForgot = () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setForgotEmailSent(true);
      setTimeout(() => setForgotEmailSent(false), 3000);
    }, 1000);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (FEATURE_FLAGS.MOCK_MODE) {
        await mockLogin(email, password);
        setAuthenticated(true);
      } else {
        if (!auth) throw new Error("Firebase not initialized");
        await signInWithEmailAndPassword(auth, email, password);
        setAuthenticated(true);
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong, please try again";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (FEATURE_FLAGS.MOCK_MODE) {
        await mockGoogleSignIn();
        setAuthenticated(true);
      } else {
        if (!auth) throw new Error("Firebase not initialized");
        await signInWithPopup(auth, googleProvider);
        setAuthenticated(true);
      }
    } catch (err: any) {
      setError("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!fullName || fullName.length < 2) { setError("Full Name must be at least 2 characters"); setLoading(false); return; }
    if (!username || username.length < 3) { setError("Username must be at least 3 characters"); setLoading(false); return; }
    if (username.includes(' ')) { setError("Username cannot contain spaces"); setLoading(false); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Only letters, numbers, and _ allowed"); setLoading(false); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }

    try {
       if (FEATURE_FLAGS.MOCK_MODE) {
         const user = await mockSignup(email, password, '@' + username, fullName, phone);
         setPendingUser(user);
         setResendTimer(30);
         setTimeout(() => {
           setAuthenticated(true);
           setLoading(false);
         }, 800);
         return; // don't set loading to false in finally block
       } else {
         setError("Signup not fully implemented in non-mock mode yet.");
       }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong, please try again";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      if (FEATURE_FLAGS.MOCK_MODE) {
        await mockOTPSend(phone);
        setStep('otp');
      } else {
        setError("Phone auth requires real Firebase setup.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOTP = async (e?: React.FormEvent, code?: string) => {
    if (e) e.preventDefault();
    const otpValue = code || otpValues.join('');
    if (otpValue.length < 6) {
      setError("Please enter complete 6-digit code");
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (FEATURE_FLAGS.MOCK_MODE) {
        await mockOTPVerify(otpValue, pendingUser);
        setOtpSuccess(true);
        setTimeout(() => {
          if (otpSource === 'phone-login') {
             const existingUsers = JSON.parse(localStorage.getItem('mock_db_users') || '[]');
             const fullPhone = `${countryCode} ${phone}`;
             const found = existingUsers.find((u: any) => u.phone === phone || u.phone === fullPhone);
             if (found) {
                localStorage.setItem("skrimchat_user", JSON.stringify(found));
                setAuthenticated(true);
             } else {
                setStep('profile-setup');
             }
          } else {
             setAuthenticated(true);
          }
        }, 1000);
        return; // don't set loading to false in finally block
      } else {
        setError("Firebase OTP not configured.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!otpSuccess) setLoading(false);
    }
  };

  const handlePhoneSubmit = () => {
    if (!phone) { setError("Please enter phone number"); return; }
    if (phone.length < 10) { setError("Enter valid phone number"); return; }
    setOtpSource('phone-login');
    setLoading(true);
    setResendTimer(30);
    setTimeout(() => {
        setLoading(false);
        setStep('otp');
    }, 800);
  };
  
  const handleAvatarClick = () => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
      setShowAvatarSheet(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarBase64(reader.result as string);
        setShowAvatarSheet(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) { setError("Please enter your full name"); return; }
    if (fullName.length < 2) { setError("Full Name must be at least 2 characters"); return; }
    if (!username) { setError("Please choose a username"); return; }
    if (username.length < 3) { setError("Username too short"); return; }
    if (username.includes(' ')) { setError("Username cannot contain spaces"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Only letters, numbers, and _ allowed"); return; }
    const fullPhone = `${countryCode} ${phone}`;
    const formattedUsername = '@' + username;
    const finalAvatar = avatarBase64 || "https://i.pravatar.cc/150?img=1";
    if (avatarBase64) {
      localStorage.setItem('skrimchat_avatar', avatarBase64);
    }
    const newUser = { id: `user_${Date.now()}`, phone: fullPhone, fullName, username: formattedUsername, bio, avatar: finalAvatar };
    const existingUsers = JSON.parse(localStorage.getItem('mock_db_users') || '[]');
    existingUsers.push(newUser);
    localStorage.setItem('mock_db_users', JSON.stringify(existingUsers));
    localStorage.setItem("skrimchat_user", JSON.stringify(newUser));
    setAuthenticated(true);
  };

  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => setStep('onboarding'), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'onboarding') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSlideIndex((prev) => (prev + 1) % 3);
      if (e.key === 'ArrowLeft') setSlideIndex((prev) => (prev - 1 + 3) % 3);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  const nextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % 3);
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + 3) % 3);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 20 && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  let touchStartX = 0;
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50) nextSlide();
    if (touchEndX > touchStartX + 50) prevSlide();
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [step]);

  return (
    <div ref={scrollRef} className="w-full h-full relative overflow-hidden bg-[#0A0A0A] flex flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:items-center lg:justify-start">
      {/* Dynamic Backgrounds based on Slide */}
      <AnimatePresence>
         {slideIndex === 0 && step !== 'splash' && (
           <motion.div key="bg0" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:1}} className="absolute inset-0 lg:fixed lg:top-0 lg:left-0 lg:w-[100vw] lg:h-[100vh] lg:z-0 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neon-purple opacity-20 blur-[100px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-blue opacity-20 blur-[100px]" />
           </motion.div>
         )}
         {slideIndex === 1 && step !== 'splash' && (
           <motion.div key="bg1" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:1}} className="absolute inset-0 lg:fixed lg:top-0 lg:left-0 lg:w-[100vw] lg:h-[100vh] lg:z-0 pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-blue opacity-30 blur-[100px] animate-pulse" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neon-purple opacity-10 blur-[120px]" />
           </motion.div>
         )}
         {slideIndex === 2 && step !== 'splash' && (
           <motion.div key="bg2" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:1}} className="absolute inset-0 lg:fixed lg:top-0 lg:left-0 lg:w-[100vw] lg:h-[100vh] lg:z-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-[100%] h-[100%] bg-gradient-to-bl from-[#FF2D87]/20 via-[#B026FF]/10 to-transparent opacity-50 block" />
              {/* Twinkling stars */}
              {[...Array(20)].map((_, i) => (
                 <motion.div key={i} className="absolute w-1 h-1 bg-white rounded-full opacity-50 shadow-[0_0_5px_white]"
                    style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%` }}
                    animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2 + Math.random()*2, repeat: Infinity }}
                 />
              ))}
           </motion.div>
         )}
      </AnimatePresence>


      <AnimatePresence mode="wait">
        {step === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center flex-1 h-full w-full gap-4"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-neon-purple to-neon-blue p-[2px]">
              <div className="w-full h-full bg-skrim-bg rounded-[22px] flex items-center justify-center">
                <span className="text-4xl font-bold bg-gradient-to-br from-neon-purple to-neon-blue text-transparent bg-clip-text">S</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Skrim<span className="text-neon-purple text-glow-purple">Chat</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium tracking-widest uppercase">Connect. Create. Converse.</p>
          </motion.div>
        )}

        {step === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-[560px] mx-auto h-[100dvh] flex flex-col items-center justify-between z-10 px-6 pb-[env(safe-area-inset-bottom,32px)] box-border relative lg:max-w-none lg:w-[100vw] lg:min-h-[100dvh] lg:h-[100dvh] lg:overflow-y-auto lg:overflow-x-hidden lg:flex-col lg:items-center lg:pt-0 lg:pb-0 scroll-smooth"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onScroll={handleScroll}
          >
            {/* Inner Wrapper for max-w on Web */}
            <div className="w-full h-full flex flex-col items-center justify-between lg:w-full lg:max-w-[600px] lg:mx-auto lg:px-[24px] lg:pt-[60px] lg:pb-[60px] lg:flex-col lg:items-center lg:gap-[24px] lg:h-max lg:min-h-[100dvh] lg:justify-center flex-1">
              {/* Skip Button */}
              {slideIndex < 2 && (
                <div className="absolute top-6 right-6 z-50 pointer-events-auto">
                  <button onClick={() => setStep('login')} className="text-gray-400 font-medium text-sm hover:text-white transition-colors">
                    Skip
                  </button>
                </div>
              )}

              <div className="flex-1 min-h-[16px] lg:hidden" />
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={slideIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center w-full"
                >
                  {slideIndex === 0 && (
                    <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] lg:w-[200px] lg:h-[200px] relative shrink-0">
                     <div className="absolute inset-0 border-2 border-dashed border-neon-purple/50 rounded-full animate-[spin_10s_linear_infinite]" />
                     <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                       <Zap className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[90px] lg:h-[90px] text-neon-purple drop-shadow-[0_0_15px_rgba(176,38,255,0.8)]" />
                     </motion.div>
                  </div>
                )}
                {slideIndex === 1 && (
                  <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] lg:w-[200px] lg:h-[200px] relative shrink-0">
                     <motion.div animate={{ scale: [1, 1.3], opacity: [0.8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 border-2 border-[#00F0FF] rounded-full" />
                     <motion.div animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }} className="absolute inset-0 border-2 border-[#00F0FF] rounded-full" />
                     
                     <div className="absolute inset-0 border-2 border-[#00F0FF] rounded-full shadow-[0_0_15px_rgba(0,240,255,0.5)] bg-[#0A0A0A] z-10" />
                     
                     <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                       <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="relative">
                         <MessageCircle className="w-[50px] h-[50px] md:w-[70px] md:h-[70px] lg:w-[80px] lg:h-[80px] text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
                         <Zap className="w-4 h-4 md:w-6 md:h-6 text-[#0A0A0A] fill-[#00F0FF] absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                       </motion.div>
                     </motion.div>

                     {/* Orbiting Avatars */}
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 z-30">
                        <img src="https://i.pravatar.cc/150?img=4" className="w-8 h-8 rounded-full border-2 border-[#00F0FF] absolute -top-4 left-[64px] md:left-[80px] lg:left-[90px]" alt="user" />
                        <img src="https://i.pravatar.cc/150?img=5" className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full border-2 border-[#00F0FF] absolute bottom-[16px] -left-2" alt="user" />
                        <img src="https://i.pravatar.cc/150?img=6" className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-[#00F0FF] absolute bottom-[8px] -right-3 lg:-right-4" alt="user" />
                     </motion.div>
                  </div>
                )}
                {slideIndex === 2 && (
                  <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] lg:w-[200px] lg:h-[200px] relative shrink-0">
                     <motion.div animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-[-10px] md:inset-[-15px] lg:inset-[-18px] border-[3px] border-dashed border-[#B026FF]/50 rounded-full p-2" />
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-[-18px] md:inset-[-25px] lg:inset-[-30px] border-[2px] border-transparent border-t-[#FF2D87] border-b-[#FF2D87] rounded-full opacity-70" />
                     
                     <div className="absolute inset-0 border-2 border-[#FF2D87] rounded-full shadow-[0_0_15px_rgba(255,45,135,0.5)] bg-[#0A0A0A] z-10" />
                     
                     <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-[#B026FF] to-[#FF2D87] w-[70px] h-[70px] md:w-[90px] md:h-[90px] lg:w-[100px] lg:h-[100px] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,45,135,0.6)] z-20">
                       <Play className="w-[30px] h-[30px] md:w-[40px] md:h-[40px] lg:w-[45px] lg:h-[45px] text-white ml-1.5 md:ml-2 fill-white relative left-1" />
                     </motion.div>

                     {/* Floating stat chips */}
                     <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-3 -right-6 md:-top-4 md:-right-8 bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-xl z-30">
                        <span className="text-[9px] md:text-[10px] lg:text-[11px] font-bold text-white">1.2M Views</span>
                     </motion.div>
                     <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-1/2 -left-10 md:-left-12 transform -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-xl z-30">
                        <span className="text-[9px] md:text-[10px] lg:text-[11px] font-bold text-white">128K Followers</span>
                     </motion.div>
                     <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3.5, repeat: Infinity }} className="absolute -bottom-5 -right-3 md:-bottom-6 md:-right-4 lg:-bottom-8 lg:-right-6 bg-[#FF2D87]/20 backdrop-blur-md border border-[#FF2D87]/30 px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-xl z-30">
                        <span className="text-[9px] md:text-[10px] lg:text-[11px] font-bold text-white">$4.2K Earned</span>
                     </motion.div>
                  </div>
                )}

                <div className="h-[32px] shrink-0" />
                
                {slideIndex === 0 && (
                  <div className="flex flex-col items-center">
                    <h2 className="text-[28px] md:text-3xl lg:text-[32px] font-bold text-center leading-tight">Feel the <span className="text-neon-purple text-glow-purple">Pulse</span> of<br/>the digital world.</h2>
                    <div className="h-[12px] md:h-[16px] shrink-0" />
                    <p className="text-sm md:text-base lg:text-[15px] text-gray-400 text-center max-w-sm">Experience the ultimate all-in-one social platform. Connect, Create, and Converse safely.</p>
                  </div>
                )}
                {slideIndex === 1 && (
                  <div className="flex flex-col items-center">
                    <h2 className="text-[28px] md:text-3xl lg:text-[32px] font-bold text-center leading-tight">Connect <span className="text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">Beyond</span><br/>Boundaries.</h2>
                    <div className="h-[12px] md:h-[16px] shrink-0" />
                    <p className="text-sm md:text-base lg:text-[15px] text-gray-400 text-center max-w-sm">Chat privately with end-to-end encryption. Call, collaborate, and create with people who matter most.</p>
                  </div>
                )}
                {slideIndex === 2 && (
                  <div className="flex flex-col items-center">
                    <h2 className="text-[28px] md:text-3xl lg:text-[32px] font-bold text-center leading-tight">Create. Share.<br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-[#B026FF] to-[#FF2D87] drop-shadow-[0_0_10px_rgba(255,45,135,0.4)]">Get Rewarded.</span></h2>
                    <div className="h-[12px] md:h-[16px] shrink-0" />
                    <p className="text-sm md:text-base lg:text-[15px] text-gray-400 text-center max-w-sm">Share your Vibes, grow your audience, and monetize your content. Your creativity. Your earnings.</p>
                  </div>
                )}
                
              </motion.div>
            </AnimatePresence>

            <div className="flex-1 min-h-[16px] lg:hidden" />
                
            <div className="w-full max-w-[560px] shrink-0">
              {slideIndex === 0 && (
                 <NeonButton onClick={nextSlide} className="w-full h-[52px]">
                   Next →
                 </NeonButton>
              )}
              {slideIndex === 1 && (
                 <NeonButton onClick={nextSlide} className="w-full h-[52px]">
                   Next →
                 </NeonButton>
              )}
              {slideIndex === 2 && (
                 <button onClick={() => setStep('login')} className="w-full h-[52px] bg-gradient-to-r from-[#B026FF] to-[#FF2D87] text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(255,45,135,0.6)] flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm uppercase tracking-wider">
                   Start Creating →
                 </button>
              )}
            </div>
            
            <div className="h-[20px] lg:h-[16px] shrink-0" />
            
            <div className="flex gap-2 shrink-0 z-20">
              <div onClick={() => setSlideIndex(0)} className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${slideIndex === 0 ? 'w-8 bg-neon-purple shadow-neon-purple' : 'w-2 bg-gray-700'}`} />
              <div onClick={() => setSlideIndex(1)} className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${slideIndex === 1 ? 'w-8 bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]' : 'w-2 bg-gray-700'}`} />
              <div onClick={() => setSlideIndex(2)} className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${slideIndex === 2 ? 'w-8 bg-gradient-to-r from-[#B026FF] to-[#FF2D87] shadow-[0_0_10px_#FF2D87]' : 'w-2 bg-gray-700'}`} />
            </div>
            
            </div >
            
            {/* Scroll Hint for Web */}
            {!hasScrolled && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="hidden lg:flex fixed bottom-2 left-1/2 -translate-x-1/2 flex-col items-center gap-1 z-50 animate-bounce pointer-events-none"
               >
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Scroll Down</span>
                 <ChevronDown className="w-4 h-4 text-gray-500" />
               </motion.div>
            )}
            
          </motion.div>
        )}

        {step === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[560px] mx-auto h-full flex flex-col px-6 pt-6 pb-[env(safe-area-inset-bottom,24px)] z-10 lg:max-w-[480px] lg:h-max lg:shrink-0 lg:px-[40px] lg:pt-[48px] lg:pb-[48px] lg:my-[40px] lg:bg-[rgba(20,20,20,0.9)] lg:rounded-[24px] lg:border lg:border-white/10 lg:backdrop-blur-[20px]"
          >
            <div className="flex-1 overflow-y-auto no-scrollbar pt-16 lg:flex-none lg:overflow-visible lg:pt-0">
              <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
              <p className="text-gray-400 mb-8">Login to continue to SkrimChat.</p>

              {error && (
                <div className="bg-[rgba(255,39,39,0.1)] border border-[rgba(255,39,39,0.3)] rounded-[12px] py-[12px] px-[16px] mb-6 flex items-start gap-2">
                  <span className="text-[14px] leading-none mt-0.5">⚠️</span>
                  <span className="text-[14px] text-[#FF6B6B] leading-tight">{error}</span>
                </div>
              )}
              {forgotEmailSent && (
                <div className="bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.3)] rounded-[12px] py-[12px] px-[16px] mb-6 flex items-start gap-2">
                  <span className="text-[14px] leading-none mt-0.5">Done</span>
                  <span className="text-[14px] text-[#00F0FF] leading-tight">Password reset link sent to your email</span>
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 ml-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="chaiwala_sharma@gmail.com" className="w-full bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 ml-2">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" />
                </div>
                <div className="flex justify-end">
                  <span onClick={() => { setError(''); setStep('forgot-password'); }} className="text-sm font-medium text-neon-blue cursor-pointer hover:underline">Forgot Password?</span>
                </div>

                <div className="mt-8">
                  <NeonButton type="submit" disabled={loading}>
                    {loading ? 'Authenticating...' : 'Login'}
                  </NeonButton>
                  
                  <div className="flex items-center gap-4 my-8">
                    <div className="h-px bg-gray-800 flex-1" />
                    <span className="text-sm text-gray-500 font-medium">OR CONTINUE WITH</span>
                    <div className="h-px bg-gray-800 flex-1" />
                  </div>

                  <div className="flex flex-col gap-4">
                     <NeonButton type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="flex-1">
                       <Mail className="w-5 h-5"/> Google Gmail
                     </NeonButton>
                     <NeonButton type="button" variant="outline" onClick={() => {
                        setError('');
                        setStep('phone-login');
                     }} disabled={loading} className="flex-1 border-white/10 hover:bg-white/5">
                       <Phone className="w-5 h-5"/> Continue with Phone Number
                     </NeonButton>
                  </div>
                </div>
              </form>
            </div>

            <div className="mt-auto pt-8 flex justify-center pb-8 lg:mt-8 lg:pt-0 lg:pb-0">
              <p className="text-gray-400 text-sm">
                Don't have an account? <span className="text-neon-purple font-medium cursor-pointer hover:underline" onClick={() => setStep('signup')}>Sign up</span>
              </p>
            </div>
          </motion.div>
        )}

        {step === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[560px] mx-auto h-full flex flex-col px-6 pt-6 pb-[env(safe-area-inset-bottom,24px)] z-10 lg:max-w-[480px] lg:h-max lg:shrink-0 lg:px-[40px] lg:pt-[48px] lg:pb-[48px] lg:my-[40px] lg:bg-[rgba(20,20,20,0.9)] lg:rounded-[24px] lg:border lg:border-white/10 lg:backdrop-blur-[20px]"
          >
            <div className="flex-1 overflow-y-auto no-scrollbar pt-16 lg:flex-none lg:overflow-visible lg:pt-0">
              <h2 className="text-3xl font-bold mb-2">Create Account</h2>
              <p className="text-gray-400 mb-8">Join SkrimChat today.</p>

              {error && (
                <div className="bg-[rgba(255,39,39,0.1)] border border-[rgba(255,39,39,0.3)] rounded-[12px] py-[12px] px-[16px] mb-6 flex items-start gap-2">
                  <span className="text-[14px] leading-none mt-0.5">⚠️</span>
                  <span className="text-[14px] text-[#FF6B6B] leading-tight">{error}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 ml-2">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Bappu Bhai Sharma" className="w-full bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 ml-2">Username</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-medium select-none pointer-events-none">
                      @
                    </span>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/@/g, ''))} placeholder="bappu_bhai" className="w-full bg-skrim-surface border border-gray-800 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 ml-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="chaiwala_sharma@gmail.com" className="w-full bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 ml-2">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" />
                </div>
                <div className="relative">
                  <label className="text-xs font-medium text-gray-400 ml-2">Confirm Password</label>
                  <div className="relative">
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={`w-full bg-skrim-surface border rounded-xl px-4 py-3 mt-1 focus:outline-none transition-all text-white pr-10 hover:border-white/20 ${
                        confirmPassword 
                          ? (password === confirmPassword ? 'border-green-500/50 focus:border-green-500 focus:ring-1 focus:ring-green-500/50' : 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/50') 
                          : 'border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50'
                    }`} />
                    {confirmPassword && (
                       <span className="absolute right-3 top-[18px]">
                          {password === confirmPassword ? 'Done' : 'Error'}
                       </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-8">
                  <NeonButton type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Sign Up'}
                  </NeonButton>
                  
                  <div className="flex items-center gap-4 my-8">
                    <div className="h-px bg-gray-800 flex-1" />
                    <span className="text-sm text-gray-500 font-medium">OR</span>
                    <div className="h-px bg-gray-800 flex-1" />
                  </div>

                  <div className="flex flex-col gap-4">
                     <NeonButton type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="flex-1">
                       <Mail className="w-5 h-5"/> Continue with Google Gmail
                     </NeonButton>
                     <NeonButton type="button" variant="outline" onClick={() => {
                        setError('');
                        setStep('phone-login');
                     }} disabled={loading} className="flex-1 border-white/10 hover:bg-white/5">
                       <Phone className="w-5 h-5"/> Continue with Phone Number
                     </NeonButton>
                  </div>
                </div>
              </form>
            </div>

            <div className="mt-auto pt-8 flex justify-center pb-8 lg:mt-8 lg:pt-0 lg:pb-0">
              <p className="text-gray-400 text-sm">
                Already have an account? <span className="text-neon-purple font-medium cursor-pointer hover:underline" onClick={() => setStep('login')}>Log in</span>
              </p>
            </div>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full mx-auto h-full flex flex-col px-6 pt-6 pb-[env(safe-area-inset-bottom,24px)] z-10 lg:w-[480px] lg:h-max lg:shrink-0 lg:px-[40px] lg:pt-[48px] lg:pb-[48px] lg:my-[40px] lg:bg-[rgba(20,20,20,0.9)] lg:rounded-[24px] lg:border lg:border-white/10 lg:backdrop-blur-[20px]"
          >
            <div className="flex items-center mb-10 mt-4 cursor-pointer" onClick={() => setStep(otpSource === 'phone-login' ? 'phone-login' : 'signup')}>
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 lg:flex-none">
              <div className="bg-neon-purple/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(176,38,255,0.4)]">
                <Mail className="w-6 h-6 text-neon-purple drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]" />
              </div>
              
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Verify Your Number</h2>
              <p className="text-gray-400 mb-8 text-[15px] leading-relaxed">
                Code sent to <span className="text-white font-medium">{otpSource === 'phone-login' ? `${countryCode} ${phone}` : phone || "+91 XXXXXXXX"}</span>
              </p>

              {error && (
                <div className="bg-[rgba(255,39,39,0.1)] border border-[rgba(255,39,39,0.3)] rounded-[12px] py-[12px] px-[16px] mb-6 flex items-start gap-2">
                  <span className="text-[14px] leading-none mt-0.5">⚠️</span>
                  <span className="text-[14px] text-[#FF6B6B] leading-tight">{error}</span>
                </div>
              )}

              <div className="space-y-8">
                 <form onSubmit={handleVerifyOTP} className="space-y-8">
                    <div className="flex gap-2 sm:gap-3 justify-center mb-6">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={otpValues[index]}
                          onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className={`w-[45px] h-[55px] sm:w-[50px] sm:h-[60px] bg-skrim-surface border ${
                            otpValues[index] ? 'border-neon-purple/50 bg-[#B026FF] bg-opacity-20 text-white' : 'border-gray-800 text-transparent'
                          } rounded-[12px] px-1 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 focus:shadow-[0_0_15px_rgba(176,38,255,0.4)] transition-all text-center text-[24px] font-bold font-mono shadow-inner`}
                        />
                      ))}
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading || otpSuccess || otpValues.join('').length < 6}
                      className="w-full h-[52px] bg-gradient-to-r from-[#B026FF] to-[#FF2D87] text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(255,45,135,0.4)] flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                    >
                      {otpSuccess ? (
                         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-white text-[#B026FF] flex items-center justify-center text-xs font-black">✓</div>
                           Verified!
                         </motion.div>
                      ) : loading ? 'Verifying...' : 'Verify & Continue \u2192'}
                    </button>
                 </form>

                 <div className="flex flex-col items-center gap-2 mt-8">
                    {resendTimer > 0 ? (
                      <span className="text-gray-400 font-medium text-sm">
                        Resend in <span className="text-white">{formatTime(resendTimer)}</span>
                      </span>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => {
                          setResendTimer(30);
                          mockOTPSend(phone || '');
                        }}
                        className="text-neon-purple font-medium text-sm hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'phone-login' && (
          <motion.div
            key="phone-login"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full mx-auto h-full flex flex-col px-6 pt-6 pb-[env(safe-area-inset-bottom,24px)] z-10 lg:w-[480px] lg:h-max lg:shrink-0 lg:px-[40px] lg:pt-[48px] lg:pb-[48px] lg:my-[40px] lg:bg-[rgba(20,20,20,0.9)] lg:rounded-[24px] lg:border lg:border-white/10 lg:backdrop-blur-[20px]"
          >
            <div className="flex items-center mb-10 mt-4 cursor-pointer" onClick={() => setStep('login')}>
               <ChevronLeft className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 lg:flex-none">
              <div className="bg-neon-purple/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(176,38,255,0.4)]">
                 <Phone className="w-6 h-6 text-neon-purple drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]" />
              </div>
              
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Enter Your Phone Number</h2>
              <p className="text-gray-400 mb-8 text-[15px] leading-relaxed">
                 We'll send you a verification code to sign in
              </p>

              {error && (
                <div className="bg-[rgba(255,39,39,0.1)] border border-[rgba(255,39,39,0.3)] rounded-[12px] py-[12px] px-[16px] mb-6 flex items-start gap-2">
                  <span className="text-[14px] leading-none mt-0.5">⚠️</span>
                  <span className="text-[14px] text-[#FF6B6B] leading-tight">{error}</span>
                </div>
              )}

              <div className="flex gap-2 mb-8">
                  <select 
                     className="bg-skrim-surface border border-gray-800 rounded-xl px-3 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white min-w-[70px] appearance-none"
                     style={{ WebkitAppearance: 'none' }}
                     value={countryCode} 
                     onChange={e => setCountryCode(e.target.value)}
                  >
                     <option value="+91">🇮🇳 +91</option>
                     <option value="+1">🇺🇸 +1</option>
                     <option value="+44">🇬🇧 +44</option>
                     <option value="+971">🇦🇪 +971</option>
                     <option value="+65">🇸🇬 +65</option>
                     <option value="+61">🇦🇺 +61</option>
                  </select>
                  <input 
                     type="tel" 
                     value={phone} 
                     onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                     placeholder="Phone Number" 
                     className="flex-1 bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" 
                  />
              </div>

              <button 
                 onClick={handlePhoneSubmit}
                 disabled={loading}
                 className="w-full h-[52px] bg-gradient-to-r from-[#B026FF] to-[#FF2D87] text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(255,45,135,0.4)] flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
              >
                  {loading ? 'Sending...' : 'Send OTP Code \u2192'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'profile-setup' && (
          <motion.div
            key="profile-setup"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full mx-auto h-full flex flex-col px-6 pt-6 pb-[env(safe-area-inset-bottom,24px)] z-10 lg:w-[480px] lg:h-max lg:shrink-0 lg:px-[40px] lg:pt-[48px] lg:pb-[48px] lg:my-[40px] lg:bg-[rgba(20,20,20,0.9)] lg:rounded-[24px] lg:border lg:border-white/10 lg:backdrop-blur-[20px]"
          >
            <div className="flex-1 lg:flex-none mt-10">
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Almost there! 🎉</h2>
              <p className="text-gray-400 mb-8 text-[15px] leading-relaxed">
                 Set up your profile
              </p>

              {error && (
                <div className="bg-[rgba(255,39,39,0.1)] border border-[rgba(255,39,39,0.3)] rounded-[12px] py-[12px] px-[16px] mb-6 flex items-start gap-2">
                  <span className="text-[14px] leading-none mt-0.5">⚠️</span>
                  <span className="text-[14px] text-[#FF6B6B] leading-tight">{error}</span>
                </div>
              )}

              <div className="flex flex-col items-center mb-8 relative">
                 <div 
                    onClick={handleAvatarClick}
                    className={`w-[100px] h-[100px] rounded-full flex items-center justify-center mb-3 cursor-pointer transition-all relative ${
                      avatarBase64 
                        ? 'border-2 border-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.4)]' 
                        : 'bg-[#1F1F1F] border-2 border-dashed border-[#B026FF] hover:border-white/40'
                    }`}
                 >
                    {avatarBase64 ? (
                      <img src={avatarBase64} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-[#B026FF] text-sm font-medium">+ Add photo</span>
                    )}
                    {avatarBase64 && (
                      <div className="absolute bottom-0 right-0 w-[28px] h-[28px] bg-[#B026FF] rounded-full flex items-center justify-center border-2 border-black/80">
                         <Pencil className="w-[14px] h-[14px] text-white" />
                      </div>
                    )}
                 </div>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                   className="hidden" 
                   accept="image/*" 
                 />
                 <input 
                   type="file" 
                   ref={cameraInputRef} 
                   onChange={handleFileChange} 
                   className="hidden" 
                   accept="image/*" 
                   capture="environment" 
                 />
              </div>

              <form onSubmit={handleProfileSetupSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 ml-2">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Bappu Bhai Sharma" className="w-full bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 ml-2">Username</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-medium select-none pointer-events-none">
                        @
                      </span>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/@/g, ''))} placeholder="bappu_bhai" className="w-full bg-skrim-surface border border-gray-800 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-400 ml-2">Bio</label>
                    <div className="relative mt-1">
                      <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value.substring(0, 150))}
                        placeholder="Tell the world about yourself... ✨"
                        className="w-full bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white min-h-[80px]"
                      />
                      <span className={`absolute bottom-3 right-3 text-xs font-medium ${bio.length >= 145 ? 'text-red-500' : bio.length >= 120 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {bio.length}/150
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                       type="submit" 
                       disabled={loading}
                       className="w-full h-[52px] bg-gradient-to-r from-[#B026FF] to-[#FF2D87] text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(255,45,135,0.4)] flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Get Started \u2192'}
                    </button>
                  </div>
              </form>
            </div>
          </motion.div>
        )}

        {step === 'forgot-password' && (
          <motion.div
            key="forgot-password"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full mx-auto h-full flex flex-col px-6 pt-6 pb-[env(safe-area-inset-bottom,24px)] z-10 lg:w-[480px] lg:h-max lg:shrink-0 lg:px-[40px] lg:pt-[48px] lg:pb-[48px] lg:my-[40px] lg:bg-[rgba(20,20,20,0.9)] lg:rounded-[24px] lg:border lg:border-white/10 lg:backdrop-blur-[20px]"
          >
            <div className="flex items-center mb-10 mt-4 cursor-pointer" onClick={() => setStep('login')}>
               <ChevronLeft className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 lg:flex-none">
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Forgot Password</h2>
              <p className="text-gray-400 mb-8 text-[15px] leading-relaxed">
                 Enter your email to receive a reset link
              </p>

               {error && (
                <div className="bg-[rgba(255,39,39,0.1)] border border-[rgba(255,39,39,0.3)] rounded-[12px] py-[12px] px-[16px] mb-6 flex items-start gap-2">
                  <span className="text-[14px] leading-none mt-0.5">⚠️</span>
                  <span className="text-[14px] text-[#FF6B6B] leading-tight">{error}</span>
                </div>
               )}

              <div className="mb-8">
                 <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="chaiwala_sharma@gmail.com" 
                    className="w-full bg-skrim-surface border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all text-white" 
                 />
              </div>

              <button 
                 onClick={() => {
                    if (!email) { setError("Please enter your email"); return; }
                    setLoading(true);
                    setTimeout(() => {
                       setLoading(false);
                       setForgotEmailSent(true);
                       setStep('login');
                       setTimeout(() => setForgotEmailSent(false), 3000);
                    }, 1000);
                 }}
                 disabled={loading}
                 className="w-full h-[52px] bg-gradient-to-r from-[#B026FF] to-[#FF2D87] text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(255,45,135,0.4)] flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
              >
                  {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showAvatarSheet && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAvatarSheet(false)}
                className="fixed inset-0 bg-black/60 z-50 lg:hidden"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-3xl p-6 z-[60] border-t border-white/10 lg:hidden"
              >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-bold mb-4 px-2">Profile Photo</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      cameraInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium">Take Photo</span>
                  </button>
                  <button 
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium">Choose from Gallery</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
