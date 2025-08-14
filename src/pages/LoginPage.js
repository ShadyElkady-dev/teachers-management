import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { isSmallScreen } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FaFacebook } from "react-icons/fa";

const LoginPage = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isMobile, setIsMobile] = useState(isSmallScreen());

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isSmallScreen());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // مسح الأخطاء عند تغيير القيم
useEffect(() => {
  if (error && (formData.username.trim() || formData.password.trim())) {
    clearError();
  }
}, [formData.username, formData.password]);
  // معالجة تغيير القيم
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // معالجة إرسال النموذج
const handleSubmit = async (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!formData.username.trim() || !formData.password.trim()) {
    return toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
  }

  try {
    console.log('محاولة تسجيل الدخول...', { username: formData.username });
    await login(formData.username, formData.password);
  } catch (error) {
    // مفيش toast هنا، هنسيب الـ AuthContext يتولى عرض الرسالة
  }
};


  // تعبئة سريعة للحسابات التجريبية
  const fillDemoAccount = (role) => {
    if (role === 'admin') {
      setFormData({ username: 'admin', password: 'admin123' });
    } else if (role === 'secretary') {
      setFormData({ username: 'secretary', password: 'secretary123' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* شعار وعنوان التطبيق */}
        <div className="text-center">
          <div className="w-35 h-35 flex items-center justify-center mx-auto mb-4 overflow-hidden animate-fade-in-zoom">
            <img 
              src="/logo512.png" 
              alt="شعار العميل" 
              className="mx-auto mb-4 w-32 h-32 object-contain animate-logo"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            إدارة حسابات المدرسين
          </h1>
          <p className="text-gray-600">
            يرجى تسجيل الدخول للمتابعة
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            {/* اسم المستخدم */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-mobile w-full pl-10"
                  placeholder="أدخل اسم المستخدم"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <span className="text-lg">👤</span>
                </div>
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-mobile w-full pl-10 pr-10"
                  placeholder="أدخل كلمة المرور"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  disabled={isLoading}
                >
                  <span className="text-lg">{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
            </div>

            {/* خيارات إضافية */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                تذكرني
              </label>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <span>❌</span>
                  {error}
                </div>
              </div>
            )}

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
              className="btn-mobile btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="small" color="white" />
                  جاري تسجيل الدخول...
                </div>
              ) : (
                <>
                  <span className="text-lg">🚀</span>
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* معلومات إضافية */}
          <div className="mt-8 text-center animate-fade-in-up">
            <p className="text-sm md:text-base font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              إدارة حسابات المدرسين
            </p>
            <p className="mt-2 text-sm md:text-base text-gray-700 flex items-center justify-center gap-2">
              تم البرمجة والتطوير بواسطة 
              <a 
                href="https://www.facebook.com/shady.elkady8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                شادى القاضى 
                <FaFacebook className="text-lg" />
              </a>
            </p>
          </div>
        </div>

        {/* CSS Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInZoom {
              0% {
                opacity: 0;
                transform: scale(0.8);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            .animate-fade-in-zoom {
              animation: fadeInZoom 0.8s ease-out forwards, pulse 2s infinite ease-in-out;
            }
            
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.05);
              }
            }

            @keyframes logoEntrance {
              0% {
                opacity: 0;
                transform: scale(0.7) rotate(-10deg);
              }
              60% {
                opacity: 1;
                transform: scale(1.05) rotate(3deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
              }
            }

            @keyframes logoFloat {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-6px);
              }
            }

            @keyframes logoPulse {
              0%, 100% {
                filter: brightness(1);
              }
              50% {
                filter: brightness(1.15);
              }
            }

            .animate-logo {
              animation: 
                logoEntrance 1.2s ease-out forwards,
                logoFloat 4s ease-in-out infinite,
                logoPulse 6s ease-in-out infinite;
            }

            @keyframes fadeIn {
              0% {
                opacity: 0;
                transform: translateY(-10px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .animate-fade-in {
              animation: fadeIn 0.3s ease-out forwards;
            }
          `
        }} />
      </div>
    </div>
  );
};

export default LoginPage;