import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import { isSmallScreen } from '../../utils/helpers';

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(isSmallScreen());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      const mobile = isSmallScreen();
      setIsMobile(mobile);
      
      // إغلاق الشريط الجانبي تلقائياً في الشاشات الصغيرة
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

  // منع التمرير في الخلفية عند فتح الشريط الجانبي
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // الحصول على ارتفاع الهيدر بناء على الشاشة
  const getHeaderHeight = () => {
    if (isMobile) {
      return '128px'; // هيدر + شريط الإحصائيات للموبايل
    }
    return '112px'; // هيدر عادي + شريط المستخدم
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* الهيدر المحسن */}
      <Header 
        onMenuClick={toggleSidebar}
        isMobile={isMobile}
      />

      <div className="flex">
        {/* الشريط الجانبي للشاشات الكبيرة */}
        {!isMobile && (
          <div 
            className="fixed right-0 w-72 bg-white shadow-2xl overflow-y-auto z-30 border-l-2 border-gray-200"
            style={{ 
              top: getHeaderHeight(), 
              height: `calc(100vh - ${getHeaderHeight()})` 
            }}
          >
            <Navigation />
          </div>
        )}

        {/* محتوى الصفحة الرئيسي */}
        <main 
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile ? 'mr-72' : 'mr-0'}
            min-h-screen
          `}
          style={{ paddingTop: getHeaderHeight() }}
        >
          <div className="container-mobile p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* الشريط الجانبي المنبثق للهواتف المحمولة */}
        {isMobile && (
          <>
            {/* الخلفية المظللة المحسنة */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-all duration-300 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* الشريط الجانبي المحسن */}
            <div 
              className={`
                fixed w-80 max-w-[90vw] bg-white shadow-2xl z-50 
                transition-all duration-300 ease-in-out border-l-2 border-gray-200
                ${sidebarOpen ? 'transform translate-x-0' : 'transform translate-x-full'}
                overflow-y-auto
              `}
              style={{ 
                top: getHeaderHeight(), 
                right: 0,
                height: `calc(100vh - ${getHeaderHeight()})` 
              }}
            >
              {/* عنوان الشريط الجانبي للموبايل */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 border-b-2 border-blue-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <h3 className="text-lg font-bold">قائمة التنقل</h3>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>
              </div>
              
              <Navigation onNavigate={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
      </div>

      {/* الملاحة السفلية المحسنة للهواتف المحمولة */}
      {isMobile && (
        <div className="bottom-navigation-enhanced">
          <div className="bg-white border-t-2 border-gray-200 shadow-2xl">
            <div className="flex justify-around items-center px-2 py-2">
              <BottomNavItem 
                icon="📊" 
                label="الرئيسية" 
                path="/dashboard"
                active={location.pathname === '/dashboard'}
                color="blue"
              />
              <BottomNavItem 
                icon="👨‍🏫" 
                label="المدرسين" 
                path="/teachers"
                active={location.pathname === '/teachers'}
                color="indigo"
              />
              <BottomNavItem 
                icon="📝" 
                label="العمليات" 
                path="/operations"
                active={location.pathname === '/operations'}
                color="green"
              />
              <BottomNavItem 
                icon="💰" 
                label="الحسابات" 
                path="/accounts"
                active={location.pathname === '/accounts'}
                color="purple"
              />
              <BottomNavItem 
                icon="☰" 
                label="القائمة" 
                onClick={toggleSidebar}
                active={sidebarOpen}
                color="gray"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون عنصر الملاحة السفلية المحسن
const BottomNavItem = ({ icon, label, path, onClick, active, color }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  const getColorClasses = () => {
    const colors = {
      blue: {
        active: 'bg-blue-100 text-blue-600 border-blue-300',
        inactive: 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
      },
      indigo: {
        active: 'bg-indigo-100 text-indigo-600 border-indigo-300',
        inactive: 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
      },
      green: {
        active: 'bg-green-100 text-green-600 border-green-300',
        inactive: 'text-gray-600 hover:bg-green-50 hover:text-green-600'
      },
      purple: {
        active: 'bg-purple-100 text-purple-600 border-purple-300',
        inactive: 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
      },
      gray: {
        active: 'bg-gray-100 text-gray-700 border-gray-300',
        inactive: 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
      }
    };
    return colors[color] || colors.gray;
  };

  const colorClasses = getColorClasses();

  return (
    <button
      onClick={handleClick}
      className={`
        nav-item-enhanced flex flex-col items-center justify-center p-3 rounded-2xl 
        transition-all duration-200 min-w-16 min-h-16 border-2 shadow-md
        ${active 
          ? `${colorClasses.active} shadow-lg transform scale-105` 
          : `border-transparent ${colorClasses.inactive} hover:shadow-md hover:transform hover:scale-105`
        }
      `}
    >
      <div className="nav-icon-enhanced text-2xl mb-1">{icon}</div>
      <div className="nav-label-enhanced text-xs font-bold">{label}</div>
      
      {/* مؤشر النشاط */}
      {active && (
        <div className="w-1 h-1 bg-current rounded-full mt-1 animate-pulse"></div>
      )}
    </button>
  );
};

export default Layout;