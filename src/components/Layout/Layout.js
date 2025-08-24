import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import { isSmallScreen } from '../../utils/helpers';
import { PERMISSIONS, useAuth } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(isSmallScreen());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarAnimating, setSidebarAnimating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      const mobile = isSmallScreen();
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // إغلاق الشريط الجانبي عند تغيير المسار
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // منع التمرير في الخلفية وإدارة الأنيميشن
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
      setSidebarAnimating(true);
    } else {
      document.body.style.overflow = 'unset';
      if (sidebarAnimating) {
        // تأخير إزالة الأنيميشن
        const timer = setTimeout(() => setSidebarAnimating(false), 300);
        return () => clearTimeout(timer);
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen, sidebarAnimating]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getHeaderHeight = () => {
    if (isMobile) {
      return '128px'; // الارتفاع الصحيح للهيدر + شريط الإحصائيات للموبايل
    }
    return '120px'; // الارتفاع الصحيح للشاشات الكبيرة (هيدر 64px + شريط المستخدم 56px)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* خلفية ديناميكية للتطبيق */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-green-200/30 to-teal-200/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* الشريط الجانبي المنبثق للهواتف المحمولة - يأتي قبل الهيدر في DOM */}
      {isMobile && (
        <>
          {/* خلفية مظلمة */}
          {(sidebarOpen || sidebarAnimating) && (
            <div 
              className={`
                fixed inset-0 z-50 transition-all duration-300 backdrop-blur-sm
                ${sidebarOpen 
                  ? 'bg-black/60 opacity-100' 
                  : 'bg-black/60 opacity-0 pointer-events-none'
                }
              `}
              onClick={() => setSidebarOpen(false)}
              style={{ backdropFilter: 'blur(8px)' }}
            />
          )}
          
          {/* الشريط الجانبي */}
          <div 
            className={`
              fixed top-0 right-0 h-full w-80 max-w-[85vw] z-60
              transition-all duration-300 ease-out
              ${sidebarOpen ? 'transform translate-x-0' : 'transform translate-x-full'}
            `}
          >
            {/* خلفية الشريط الجانبي */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-purple-50/30"></div>
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* هيدر الشريط الجانبي */}
              <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 text-white p-4 relative overflow-hidden">
                {/* خلفية ديناميكية */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent"></div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/25 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-lg">
                      <span className="text-lg">📱</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">قائمة التنقل</h3>
                      <p className="text-white/80 text-sm font-medium">اختر القسم المطلوب</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="group p-2 bg-white/20 rounded-xl backdrop-blur-xl border border-white/30 shadow-lg hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* محتوى الشريط الجانبي */}
              <div className="flex-grow overflow-y-auto">
                <Navigation onNavigate={() => setSidebarOpen(false)} />
              </div>
            </div>
          </div>
        </>
      )}

      <Header 
        onMenuClick={toggleSidebar}
        isMobile={isMobile}
      />

      <div className="flex relative z-10">
        {/* الشريط الجانبي للشاشات الكبيرة */}
        {!isMobile && (
          <div 
            className="fixed right-0 w-72 bg-white/90 backdrop-blur-xl shadow-2xl overflow-y-auto z-30 border-l border-gray-200/50"
            style={{ 
              top: getHeaderHeight(), 
              height: `calc(100vh - ${getHeaderHeight()})` 
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 to-white/80"></div>
            <div className="relative z-10">
              <Navigation />
            </div>
          </div>
        )}

        {/* محتوى الصفحة الرئيسي */}
        <main 
          className={`
            flex-1 transition-all duration-500 ease-in-out relative z-20
            ${!isMobile ? 'mr-72' : 'mr-0'}
            min-h-screen
          `}
          style={{ paddingTop: getHeaderHeight() }}
        >
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 relative">
            {/* خلفية متدرجة للمحتوى */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-3xl blur-3xl -z-10"></div>
            
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* الملاحة السفلية المحسنة للهواتف المحمولة */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">{/* إرجاع القيم الأصلية */}
          <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl">
            {/* خلفية متدرجة */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/98 to-white/90"></div>
            
            <div className="relative z-10 px-2 py-2">
              <div className="flex justify-around items-center gap-1">
                <BottomNavItem 
                  icon="👨‍🏫" 
                  label="المدرسين" 
                  path="/teachers"
                  active={location.pathname === '/teachers'}
                  gradient="from-indigo-500 to-indigo-600"
                />
                
                <PermissionGate permission={PERMISSIONS.VIEW_OPERATIONS}>
                  <BottomNavItem 
                    icon="📝" 
                    label="العمليات" 
                    path="/operations"
                    active={location.pathname === '/operations'}
                    gradient="from-green-500 to-green-600"
                  />
                </PermissionGate>
                
                <PermissionGate permission={PERMISSIONS.VIEW_PAYMENTS}>
                  <BottomNavItem 
                    icon="💰" 
                    label="الحسابات" 
                    path="/accounts"
                    active={location.pathname === '/accounts'}
                    gradient="from-purple-500 to-purple-600"
                  />
                </PermissionGate>
                
                <PermissionGate permission={PERMISSIONS.VIEW_EXPENSES}>
                  <BottomNavItem 
                    icon="💸" 
                    label="المصروفات" 
                    path="/expenses"
                    active={location.pathname === '/expenses'}
                    gradient="from-red-500 to-red-600"
                  />
                </PermissionGate>
                
                <BottomNavItem 
                  icon="☰" 
                  label="القائمة" 
                  onClick={toggleSidebar}
                  active={sidebarOpen}
                  gradient="from-gray-500 to-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* الأنماط المخصصة */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 8s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

const BottomNavItem = ({ icon, label, path, onClick, active, gradient }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-center p-2 rounded-2xl 
        transition-all duration-300 min-w-14 min-h-14 group overflow-hidden flex-1 max-w-16
        ${active 
          ? `bg-gradient-to-br ${gradient} shadow-lg transform scale-105` 
          : 'hover:bg-gray-100/80 hover:scale-105'
        }
      `}
    >
      {/* خلفية ديناميكية للعنصر النشط */}
      {active && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white/10 rounded-full blur-lg animate-pulse"></div>
        </>
      )}
      
      {/* تأثير النقر */}
      <div className="absolute inset-0 rounded-2xl transition-all duration-300 group-active:bg-black/10"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className={`text-xl mb-0.5 transition-all duration-300 ${
          active ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
        }`}>
          {icon}
        </div>
        <div className={`text-xs font-semibold transition-all duration-300 leading-tight text-center ${
          active ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
        }`}>
          {label}
        </div>
      </div>
    </button>
  );
};

export default Layout;