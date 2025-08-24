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
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // تحديث الوقت كل دقيقة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // دالة الريفريش المحسنة
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
      
      // حالة النجاح
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 600);
      
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

  // الحصول على معلومات الصفحة الحالية
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { 
          title: 'لوحة التحكم', 
          icon: '📊', 
          gradient: 'from-blue-500 via-blue-600 to-indigo-700',
          iconBg: 'from-blue-400 to-blue-500'
        };
      case '/teachers':
        return { 
          title: 'إدارة المدرسين', 
          icon: '👨‍🏫', 
          gradient: 'from-indigo-500 via-indigo-600 to-purple-700',
          iconBg: 'from-indigo-400 to-indigo-500'
        };
      case '/operations':
        return { 
          title: 'إدارة العمليات', 
          icon: '📝', 
          gradient: 'from-green-500 via-green-600 to-emerald-700',
          iconBg: 'from-green-400 to-green-500'
        };
      case '/accounts':
        return { 
          title: 'إدارة الحسابات', 
          icon: '💰', 
          gradient: 'from-purple-500 via-purple-600 to-pink-700',
          iconBg: 'from-purple-400 to-purple-500'
        };
      case '/expenses':
        return { 
          title: 'المصروفات الخاصة', 
          icon: '💸', 
          gradient: 'from-red-500 via-red-600 to-rose-700',
          iconBg: 'from-red-400 to-red-500'
        };
      default:
        return { 
          title: 'التقارير', 
          icon: '📄', 
          gradient: 'from-teal-500 via-teal-600 to-cyan-700',
          iconBg: 'from-teal-400 to-teal-500'
        };
    }
  };

  // حساب الإحصائيات
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
    <>
      <header className="fixed top-0 left-0 right-0 z-40">{/* إرجاع z-index للقيم الأصلية */}
        {/* الهيدر الرئيسي بتصميم حديث ومضغوط */}
        <div className={`bg-gradient-to-r ${pageInfo.gradient} text-white relative overflow-hidden`}>
          {/* خلفية متحركة مخففة */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          </div>
          
          {/* المحتوى الأساسي */}
          <div className="relative z-10">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              
              {/* الجهة اليمنى - الشعار والعنوان */}
              <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                {/* شعار النظام مصغر */}
                <div className="relative group">
                  <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-white/25 to-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/30 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <img
                      src="https://i.postimg.cc/G3KMTwC4/logo.png"
                      alt="Logo"
                      className="w-6 h-6 lg:w-7 lg:h-7 object-contain"
                    />
                  </div>
                </div>

                {/* زرار الريفريش مصغر */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`
                    relative w-10 h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-white/25 to-white/15 backdrop-blur-xl rounded-xl 
                    flex items-center justify-center shadow-lg border border-white/30 
                    transition-all duration-300 group overflow-hidden
                    ${refreshing ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                    ${refreshSuccess ? 'refresh-success' : ''}
                  `}
                  title="تحديث البيانات"
                >
                  <span 
                    className={`
                      text-lg lg:text-xl transition-all duration-500 z-10
                      ${refreshing ? 'animate-spin text-white' : 'text-white/90 hover:text-white'}
                    `}
                  >
                    {refreshing ? '⟳' : '🔄'}
                  </span>
                </button>

                {/* معلومات النظام للشاشات الكبيرة */}
                {!isMobile && (
                  <div className="ml-1">
                    <h1 className="text-lg font-bold text-white tracking-wide leading-tight">
                      {APP_CONFIG.NAME}
                    </h1>
                    <p className="text-xs text-white/80 font-medium -mt-0.5">
                      الإصدار الثاني
                    </p>
                  </div>
                )}
              </div>

              {/* الوسط - عنوان الصفحة */}
              <div className="flex-1 text-center mx-4">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br ${pageInfo.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
                    <span className="text-lg lg:text-xl">{pageInfo.icon}</span>
                  </div>
                  <h2 className="text-base lg:text-xl font-bold text-white drop-shadow-sm">
                    {pageInfo.title}
                  </h2>
                </div>
                {!isMobile && (
                  <div className="flex items-center justify-center gap-2 text-xs text-white/80">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span>{formatDate(currentTime, 'yyyy/MM/dd')}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {currentTime.toLocaleTimeString('ar-EG', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* الجهة اليسرى - الأدوات */}
              <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
                
                {/* الإحصائيات المصغرة للشاشات الكبيرة */}
                {!isMobile && (
                  <div className="hidden xl:flex items-center gap-2">
                    <StatCardCompact 
                      value={stats.totalTeachers} 
                      label="مدرس" 
                      icon="👥" 
                    />
                    
                    <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                      <StatCardCompact 
                        value={formatCurrency(stats.totalProfit)} 
                        label="أرباح" 
                        icon="💰" 
                      />
                    </PermissionGate>
                  </div>
                )}

                {/* مؤقت الجلسة مصغر */}
                <div className="bg-gradient-to-br from-white/25 to-white/15 backdrop-blur-xl rounded-xl border border-white/30">
                  <SessionTimer />
                </div>

                {/* ملف المستخدم مصغر */}
                <div className="bg-gradient-to-br from-white/25 to-white/15 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg">
                  <UserProfile />
                </div>

                {/* زر القائمة للهواتف المحمولة */}
                {isMobile && (
                  <button
                    onClick={onMenuClick}
                    className="group p-2.5 bg-gradient-to-br from-white/25 to-white/15 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
                    aria-label="فتح القائمة"
                  >
                    <div className="w-5 h-5 flex flex-col justify-center items-center gap-0.5">
                      <div className="w-4 h-0.5 bg-white rounded-full"></div>
                      <div className="w-3 h-0.5 bg-white rounded-full"></div>
                      <div className="w-4 h-0.5 bg-white rounded-full"></div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* شريط الإحصائيات للهواتف المحمولة */}
            {isMobile && (
              <div className="bg-black/20 backdrop-blur-sm px-3 py-2 border-t border-white/10">
                <div className="grid grid-cols-5 gap-2">
                  <StatCardMobile value={stats.totalTeachers} label="مدرس" icon="👥" />
                  
                  <PermissionGate 
                    permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
                    fallback={
                      <>
                        <StatCardMobile value="--" label="أرباح" icon="💰" disabled />
                        <StatCardMobile value="--" label="ديون" icon="📊" disabled />
                      </>
                    }
                  >
                    <StatCardMobile 
                      value={formatCurrency(stats.totalProfit).replace('ج.م', '').trim()} 
                      label="أرباح" 
                      icon="💰" 
                    />
                    <StatCardMobile 
                      value={formatCurrency(stats.totalDebts).replace('ج.م', '').trim()} 
                      label="ديون" 
                      icon="📊" 
                    />
                  </PermissionGate>

                  {/* زرار الريفريش للموبايل */}
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`
                      flex flex-col items-center justify-center py-1.5 px-1 rounded-lg 
                      transition-all duration-300 bg-white/15 backdrop-blur-sm border border-white/20
                      ${refreshing 
                        ? 'cursor-not-allowed opacity-70' 
                        : 'hover:bg-white/25 active:scale-95'
                      }
                    `}
                  >
                    <div className={`text-base mb-0.5 transition-transform duration-500 ${
                      refreshing ? 'animate-spin' : ''
                    }`}>
                      {refreshing ? '⟳' : '🔄'}
                    </div>
                    <div className="text-xs text-white font-medium leading-tight">
                      {refreshing ? 'تحديث' : 'ريفريش'}
                    </div>
                  </button>
                  
                  <div className="flex flex-col items-center justify-center py-1.5 px-1">
                    <div className="text-sm font-bold text-white mb-0.5 leading-tight">
                      {currentTime.toLocaleTimeString('ar-EG', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="text-xs text-white/80 font-medium">الوقت</div>
                  </div>
                </div>
              </div>
            )}

            {/* شريط معلومات المستخدم للشاشات الكبيرة */}
            {!isMobile && (
              <div className="bg-black/20 backdrop-blur-sm px-4 py-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 bg-gradient-to-br ${user?.role === 'admin' ? 'from-yellow-400 to-orange-500' : 'from-blue-400 to-indigo-500'} rounded-lg flex items-center justify-center shadow-md`}>
                        <span className="text-sm">{user?.role === 'admin' ? '👑' : '📝'}</span>
                      </div>
                      <div>
                        <span className="text-white font-semibold text-sm">مرحباً، {user?.name}</span>
                        <span className="text-white/70 font-medium mr-2 text-xs">
                          ({user?.role === 'admin' ? 'مدير النظام' : 'سكرتارية'})
                        </span>
                      </div>
                    </div>
                    
                    {/* مؤشر حالة التحديث */}
                    {refreshing && (
                      <div className="flex items-center gap-2 text-yellow-200">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></div>
                        <span className="text-xs font-medium">جاري التحديث...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/90 font-medium text-sm">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span>{formatDate(currentTime, 'yyyy/MM/dd')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* شريط التقدم أثناء التحديث */}
          {refreshing && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-progress-slide"></div>
            </div>
          )}
        </div>
      </header>

      {/* إضافة الأنماط المخصصة */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }

        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(15px, -25px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
        }

        @keyframes progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animate-progress-slide {
          animation: progress-slide 1.5s ease-in-out infinite;
        }

        .refresh-success {
          animation: refreshSuccess 0.6s ease-out;
        }

        @keyframes refreshSuccess {
          0% { transform: scale(1); background-color: rgba(255, 255, 255, 0.15); }
          50% { transform: scale(1.1); background-color: rgba(34, 197, 94, 0.3); }
          100% { transform: scale(1); background-color: rgba(255, 255, 255, 0.15); }
        }
      `}</style>
    </>
  );
};

// مكون بطاقة الإحصائيات المصغرة للشاشات الكبيرة
const StatCardCompact = ({ value, label, icon }) => (
  <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-lg px-2 py-1.5 border border-white/20 shadow-md hover:scale-105 transition-all duration-300">
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{icon}</span>
      <div>
        <div className="text-xs font-bold text-white leading-tight">
          {value}
        </div>
        <div className="text-xs text-white/80 font-medium leading-tight">{label}</div>
      </div>
    </div>
  </div>
);

// مكون بطاقة الإحصائيات للهواتف المحمولة
const StatCardMobile = ({ value, label, icon, disabled = false }) => (
  <div className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 ${disabled ? 'opacity-50' : ''}`}>
    <div className="text-sm mb-0.5">{icon}</div>
    <div className="text-xs font-bold text-white text-center leading-tight">
      {value}
    </div>
    <div className="text-xs text-white/80 font-medium leading-tight">{label}</div>
  </div>
);

export default Header;