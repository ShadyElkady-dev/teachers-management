import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { isSmallScreen } from '../utils/helpers';
import toast from 'react-hot-toast';

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
    if (error) {
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
    
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    try {
      await login(formData.username, formData.password);
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (error) {
      toast.error(error.message);
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
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl">🖨️</span>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
                />
                تذكرني
              </label>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                <div className="flex items-center gap-2">
                  <span>❌</span>
                  {error}
                </div>
              </div>
            )}

            {/* زر تسجيل الدخول */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-mobile btn-primary w-full"
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

          {/* الحسابات التجريبية */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">
              حسابات تجريبية للاختبار
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">👑</span>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">حساب المدير</div>
                    <div className="text-sm text-gray-500">admin / admin123</div>
                  </div>
                </div>
                <span className="text-blue-500 text-sm">جميع الصلاحيات</span>
              </button>
              
              <button
                type="button"
                onClick={() => fillDemoAccount('secretary')}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📝</span>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">حساب السكرتارية</div>
                    <div className="text-sm text-gray-500">secretary / secretary123</div>
                  </div>
                </div>
                <span className="text-green-500 text-sm">صلاحيات محدودة</span>
              </button>
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>ادارة حسابات المدرسين</p>
            <p className="mt-1">تم البرمجة والتطوير بواسطة شادى القاضى</p>
          </div>
        </div>

        {/* تحسينات للهواتف المحمولة */}
        {isMobile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-blue-600 text-sm">
              <span className="font-medium">💡 نصيحة:</span> استخدم الحسابات التجريبية أعلاه للوصول السريع
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;