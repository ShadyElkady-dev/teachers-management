import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { isSmallScreen } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FaFacebook, FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaCheckCircle } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";
import { HiSparkles } from "react-icons/hi";
import { BiSolidSchool } from "react-icons/bi";

const LoginPage = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(isSmallScreen());
  const [isTyping, setIsTyping] = useState({ username: false, password: false });
  const [loginAnimation, setLoginAnimation] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // إضافة meta tags للتحكم في الـ status bar
  useEffect(() => {
    // تغيير لون الـ status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = '#1e1b4b'; // لون بنفسجي داكن
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#1e1b4b';
      document.head.appendChild(meta);
    }

    // إضافة meta tags أخرى لـ iOS
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaStatusBar) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-status-bar-style';
      meta.content = 'black-translucent';
      document.head.appendChild(meta);
    }

    // إضافة meta tag للـ viewport
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    return () => {
      // إعادة اللون الأصلي عند مغادرة الصفحة
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.content = '#ffffff';
      }
    };
  }, []);

  // تحديث ارتفاع الشاشة الفعلي
  useEffect(() => {
    const updateVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    updateVH();
    window.addEventListener('resize', updateVH);
    window.addEventListener('orientationchange', updateVH);
    
    return () => {
      window.removeEventListener('resize', updateVH);
      window.removeEventListener('orientationchange', updateVH);
    };
  }, []);

  // مراقبة تغيير حجم الشاشة والكيبورد
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isSmallScreen());
      
      // كشف فتح الكيبورد على الموبايل
      if (window.visualViewport) {
        const heightDifference = window.innerHeight - window.visualViewport.height;
        setKeyboardOpen(heightDifference > 100);
      }
    };

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const heightDifference = window.innerHeight - window.visualViewport.height;
        setKeyboardOpen(heightDifference > 100);
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);

  // مسح الأخطاء عند تغيير القيم
  useEffect(() => {
    if (error && (formData.username.trim() || formData.password.trim())) {
      clearError();
    }
  }, [formData.username, formData.password, error, clearError]);

  // معالجة تغيير القيم
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // معالجة التركيز على الحقول
  const handleFocus = (field) => {
    setIsTyping(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsTyping(prev => ({ ...prev, [field]: false }));
  };

  // معالجة إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      return toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
    }

    setLoginAnimation(true);
    
    try {
      await login(formData.username, formData.password);
    } catch (error) {
      setLoginAnimation(false);
      // الـ AuthContext يتولى عرض رسالة الخطأ
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden ${keyboardOpen ? 'pb-0' : ''}`}>
      {/* خلفية متحركة - مخفية على الموبايل لتحسين الأداء */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      )}

      <div className={`max-w-md w-full ${keyboardOpen ? 'space-y-4' : 'space-y-8'} relative z-10`}>
        {/* شعار وعنوان التطبيق */}
        <div className={`text-center ${keyboardOpen && isMobile ? 'hidden' : ''}`}>
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img 
                src="/logo512.png" 
                alt="شعار النظام" 
                className="w-full h-full object-contain animate-logo-float"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-2 shadow-lg">
              <FaCheckCircle className="text-white text-xl" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              إدارة حسابات المدرسين
            </span>
          </h1>
          <p className="text-gray-300 text-lg flex items-center justify-center gap-2">
            <BiSolidSchool className="text-xl" />
            مرحباً بك في نظام الإدارة الشامل
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <div className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl ${isMobile ? 'p-6' : 'p-8'} border border-white/20 ${loginAnimation ? 'animate-login-success' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* اسم المستخدم */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                اسم المستخدم
              </label>
              <div className={`relative group ${isTyping.username && !isMobile ? 'scale-105' : ''} transition-transform duration-200`}>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => handleFocus('username')}
                  onBlur={() => handleBlur('username')}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="أدخل اسم المستخدم"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors duration-200 pointer-events-none">
                  <FaUser className="text-lg" />
                </div>
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                كلمة المرور
              </label>
              <div className={`relative group ${isTyping.password && !isMobile ? 'scale-105' : ''} transition-transform duration-200`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="أدخل كلمة المرور"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors duration-200 pointer-events-none">
                  <FaLock className="text-lg" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 p-1 -m-1"
                  disabled={isLoading}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl p-4 animate-shake">
                <div className="flex items-center gap-3 text-red-300">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm md:text-base">{error}</span>
                </div>
              </div>
            )}

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
              className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-base md:text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group touch-manipulation"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="text-xl" />
                    <span>تسجيل الدخول</span>
                    <HiSparkles className="text-xl animate-pulse" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* خط فاصل */}
          <div className={`mt-6 pt-4 border-t border-white/10 ${keyboardOpen && isMobile ? 'hidden' : ''}`}>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <MdSecurity className="text-lg" />
              <span>اتصال آمن ومشفر</span>
            </div>
          </div>
        </div>

        {/* معلومات المطور */}
        <div className={`text-center space-y-3 ${keyboardOpen && isMobile ? 'hidden' : ''}`}>
          <p className="text-sm font-medium text-gray-300">
            جميع الحقوق محفوظة ٢٠٢٥
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-gray-400 text-sm">تمت البرمجة والتطوير بواسطة</span>
            <a 
              href="https://www.facebook.com/shady.elkady8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-blue-400 hover:text-blue-300 hover:bg-white/20 transition-all duration-200 group touch-manipulation"
            >
              <span className="font-semibold">شادى القاضى</span>
              <FaFacebook className="text-lg group-hover:scale-110 transition-transform duration-200" />
            </a>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        /* إصلاح ارتفاع الشاشة على الموبايل */
        .min-h-screen {
          min-height: 100vh;
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes logo-float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(-5deg);
          }
          75% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        .animate-logo-float {
          animation: logo-float 6s ease-in-out infinite;
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-2px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(2px);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes login-success {
          0% {
            transform: scale(1) rotateY(0);
          }
          50% {
            transform: scale(1.05) rotateY(180deg);
          }
          100% {
            transform: scale(1) rotateY(360deg);
          }
        }

        .animate-login-success {
          animation: login-success 1s ease-in-out;
        }

        /* تحسين الأداء على الموبايل */
        @media (max-width: 640px) {
          .animate-blob {
            display: none !important;
          }
          
          /* منع التكبير عند النقر المزدوج */
          .touch-manipulation {
            touch-action: manipulation;
          }
          
          /* تحسين حجم النص على iOS */
          input {
            font-size: 16px !important;
          }
        }

        /* إصلاح مشكلة الكيبورد والـ safe areas على iOS */
        @supports (-webkit-touch-callout: none) {
          .min-h-screen {
            min-height: -webkit-fill-available;
            min-height: 100vh;
            min-height: 100dvh;
          }
        }
        
        /* التأكد من عدم وجود فراغات */
        #root > div:first-child {
          margin-top: 0 !important;
        }
        
        /* منع الفراغ الأبيض */
        html {
          background: linear-gradient(to bottom right, #0f172a, #581c87, #0f172a);
          min-height: 100%;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: transparent;
        }

        /* تأثير الإضاءة الخلفية للديسكتوب فقط */
        @media (min-width: 768px) {
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
            }
            50% {
              box-shadow: 0 0 40px rgba(139, 92, 246, 0.8);
            }
          }

          input:focus {
            animation: glow 2s ease-in-out infinite;
          }
        }

        /* تحسين الأزرار للمس */
        button {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        /* منع تحديد النص في الواجهة */
        .select-none {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;