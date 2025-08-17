import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import UserProfile from '../Common/UserProfile';
import SessionTimer from '../Common/SessionTimer';
import { formatCurrency, formatDate, isSmallScreen } from '../../utils/helpers';
import { APP_CONFIG } from '../../utils/constants';

const Header = ({ onMenuClick, isMobile }) => {
  const location = useLocation();
  const { state, calculateTotalProfit, refreshData } = useAppContext();
  const { user, hasPermission } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // تحديث الوقت كل دقيقة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // دالة الريفريش
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    try {
      // تشغيل الهزة في الهواتف
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
      
      // استدعاء دالة التحديث من السياق
      if (refreshData) {
        await refreshData();
      }
      
      // محاكاة تحديث البيانات
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // هزة تأكيد
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }
      
      console.log('تم تحديث البيانات بنجاح!');
      
    } catch (error) {
      console.error('فشل في التحديث:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // الحصول على عنوان الصفحة الحالية مع الأيقونة واللون
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'لوحة التحكم', icon: '📊', color: 'from-blue-500 to-blue-600' };
      case '/teachers':
        return { title: 'إدارة المدرسين', icon: '👨‍🏫', color: 'from-indigo-500 to-indigo-600' };
      case '/operations':
        return { title: 'إدارة العمليات', icon: '📝', color: 'from-green-500 to-green-600' };
      case '/accounts':
        return { title: 'إدارة الحسابات', icon: '💰', color: 'from-purple-500 to-purple-600' };
      case '/expenses':
        return { title: 'المصروفات الخاصة', icon: '💸', color: 'from-red-500 to-red-600' };
      default:
        return { title: 'التقارير', icon: '🖨️', color: 'from-gray-500 to-gray-600' };
    }
  };

  // حساب الإحصائيات السريعة (مع مراعاة الصلاحيات)
  const stats = {
    totalTeachers: state.teachers.length,
    totalProfit: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? calculateTotalProfit() : 0,
    totalDebts: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? state.teachers.reduce((total, teacher) => {
      return total + Math.max(0, state.operations
        .filter(op => op.teacherId === teacher.id)
        .reduce((sum, op) => sum + (op.amount || 0), 0) - 
        state.payments
        .filter(payment => payment.teacherId === teacher.id)
        .reduce((sum, payment) => sum + (payment.amount || 0), 0));
    }, 0) : 0
  };

  const pageInfo = getPageInfo();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 shadow-lg">
      {/* الهيدر الرئيسي بخلفية متدرجة */}
      <div className={`bg-gradient-to-r ${pageInfo.color} text-white`}>
        <div className="flex items-center justify-between h-16 px-4">
          
          {/* الجهة اليمنى - العنوان والشعار مع زرار الريفريش */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm overflow-hidden">
                <img
                  src="https://i.postimg.cc/G3KMTwC4/logo.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>

              {/* زرار الريفريش الجديد */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`
                  w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center 
                  shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30
                  ${refreshing ? 'cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
                `}
                title="تحديث البيانات"
              >
                <span 
                  className={`text-xl transition-transform duration-500 ${
                    refreshing ? 'animate-spin' : 'hover:rotate-180'
                  }`}
                >
                  {refreshing ? '⟳' : '🔄'}
                </span>
              </button>

              {!isMobile && (
                <div>
                  <h1 className="text-lg font-bold text-white">{APP_CONFIG.NAME}</h1>
                  <p className="text-xs text-white opacity-80">
                    الاصدار الثانى
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* الوسط - عنوان الصفحة */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{pageInfo.icon}</span>
              <h2 className="text-base md:text-xl font-bold text-white">
                {pageInfo.title}
              </h2>
            </div>
            {!isMobile && (
              <p className="text-sm text-white opacity-80 mt-1">
                {formatDate(currentTime, 'yyyy/MM/dd')} - {currentTime.toLocaleTimeString('ar-EG', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            )}
          </div>

          {/* الجهة اليسرى - الإحصائيات والقائمة */}
          <div className="flex items-center gap-2">
            
            {/* الإحصائيات السريعة للشاشات الكبيرة */}
            {!isMobile && (
              <div className="flex items-center gap-4 mr-4">
                <div className="text-center bg-white bg-opacity-20 rounded-xl px-3 py-2 backdrop-blur-sm">
                  <div className="text-sm font-bold text-white">
                    {stats.totalTeachers}
                  </div>
                  <div className="text-xs text-white opacity-80">مدرس</div>
                </div>
                
                <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                  <div className="text-center bg-white bg-opacity-20 rounded-xl px-3 py-2 backdrop-blur-sm">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(stats.totalProfit)}
                    </div>
                    <div className="text-xs text-white opacity-80">أرباح</div>
                  </div>
                  
                  <div className="text-center bg-white bg-opacity-20 rounded-xl px-3 py-2 backdrop-blur-sm">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(stats.totalDebts)}
                    </div>
                    <div className="text-xs text-white opacity-80">ديون</div>
                  </div>
                </PermissionGate>
              </div>
            )}

            {/* ⏰ مؤقت الجلسة */}
            <SessionTimer />

            {/* ملف المستخدم */}
            <div className="bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <UserProfile />
            </div>

            {/* زر القائمة للهواتف المحمولة */}
            {isMobile && (
              <button
                onClick={onMenuClick}
                className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                aria-label="فتح القائمة"
              >
                <span className="text-xl">☰</span>
              </button>
            )}
          </div>
        </div>

        {/* شريط الإحصائيات للهواتف المحمولة مع زرار الريفريش */}
        {isMobile && (
          <div className="bg-black bg-opacity-20 backdrop-blur-sm px-4 py-3 border-t border-white border-opacity-20">
            <div className="flex justify-around items-center">
              <div className="text-center">
                <div className="text-sm font-bold text-white">
                  {stats.totalTeachers}
                </div>
                <div className="text-xs text-white opacity-80">مدرس</div>
              </div>
              
              <PermissionGate 
                permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
                fallback={
                  <>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white opacity-50">---</div>
                      <div className="text-xs text-white opacity-50">أرباح</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white opacity-50">---</div>
                      <div className="text-xs text-white opacity-50">ديون</div>
                    </div>
                  </>
                }
              >
                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(stats.totalProfit)}
                  </div>
                  <div className="text-xs text-white opacity-80">أرباح</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(stats.totalDebts)}
                  </div>
                  <div className="text-xs text-white opacity-80">ديون</div>
                </div>
              </PermissionGate>

              {/* زرار الريفريش للموبايل */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`
                  text-center p-2 rounded-lg transition-all duration-300
                  ${refreshing 
                    ? 'bg-white bg-opacity-10 cursor-not-allowed' 
                    : 'hover:bg-white hover:bg-opacity-20 active:scale-95'
                  }
                `}
              >
                <div className={`text-sm font-bold text-white transition-transform duration-500 ${
                  refreshing ? 'animate-spin' : ''
                }`}>
                  {refreshing ? '⟳' : '🔄'}
                </div>
                <div className="text-xs text-white opacity-80">
                  {refreshing ? 'تحديث' : 'ريفريش'}
                </div>
              </button>
              
              <div className="text-center">
                <div className="text-sm font-bold text-white">
                  {currentTime.toLocaleTimeString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-xs text-white opacity-80">الوقت</div>
              </div>
            </div>
          </div>
        )}

        {/* شريط معلومات المستخدم الحالي */}
        {!isMobile && (
          <div className="bg-black bg-opacity-20 backdrop-blur-sm px-4 py-2 border-t border-white border-opacity-20">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white">
                <span className="text-lg">{user?.role === 'admin' ? '👑' : '📝'}</span>
                <span className="font-medium">مرحباً، {user?.name}</span>
                <span className="text-white opacity-70">
                  ({user?.role === 'admin' ? 'مدير النظام' : 'سكرتارية'})
                </span>
                
                {/* إظهار حالة التحديث */}
                {refreshing && (
                  <span className="flex items-center gap-1 text-yellow-200 animate-pulse">
                    <span className="animate-spin">⟳</span>
                    جاري التحديث...
                  </span>
                )}
              </div>
              <div className="text-white opacity-80 font-medium">
                {formatDate(currentTime, 'yyyy/MM/dd')}
              </div>
            </div>
          </div>
        )}

        {/* مؤشر التحديث (شريط علوي) */}
        {refreshing && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white bg-opacity-30 overflow-hidden">
            <div className="h-full bg-white bg-opacity-70 animate-pulse"></div>
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
              style={{
                width: '30%',
                animation: 'shimmer 1.5s ease-in-out infinite'
              }}
            ></div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </header>
  );
};

export default Header;