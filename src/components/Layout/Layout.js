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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* الهيدر */}
      <Header 
        onMenuClick={toggleSidebar}
        isMobile={isMobile}
      />

      <div className="flex">
        {/* الشريط الجانبي للشاشات الكبيرة */}
        {!isMobile && (
          <div className="fixed top-20 right-0 h-[calc(100vh-5rem)] w-64 bg-white border-l border-gray-200 shadow-sm overflow-y-auto z-30">
            <Navigation />
          </div>
        )}

        {/* محتوى الصفحة الرئيسي */}
        <main 
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile ? 'mr-64' : 'mr-0'}
            pt-20
            min-h-screen
          `}
        >
          <div className="container-mobile p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* الشريط الجانبي المنبثق للهواتف المحمولة */}
        {isMobile && (
          <>
            {/* الخلفية المظللة */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* الشريط الجانبي */}
            <div 
              className={`
                fixed top-20 right-0 h-[calc(100vh-5rem)] w-80 max-w-[85vw] 
                bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'transform translate-x-0' : 'transform translate-x-full'}
                overflow-y-auto
              `}
            >
              <Navigation onNavigate={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
      </div>

      {/* الملاحة السفلية للهواتف المحمولة */}
      {isMobile && (
        <div className="bottom-navigation">
          <div className="flex justify-around items-center px-4">
            <BottomNavItem 
              icon="📊" 
              label="الرئيسية" 
              path="/dashboard"
              active={location.pathname === '/dashboard'}
            />
            <BottomNavItem 
              icon="👨‍🏫" 
              label="المدرسين" 
              path="/teachers"
              active={location.pathname === '/teachers'}
            />
            <BottomNavItem 
              icon="📝" 
              label="العمليات" 
              path="/operations"
              active={location.pathname === '/operations'}
            />
            <BottomNavItem 
              icon="💰" 
              label="الحسابات" 
              path="/accounts"
              active={location.pathname === '/accounts'}
            />
            <BottomNavItem 
              icon="☰" 
              label="القائمة" 
              onClick={toggleSidebar}
              active={sidebarOpen}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// مكون عنصر الملاحة السفلية
const BottomNavItem = ({ icon, label, path, onClick, active }) => {
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
      className={`nav-item ${active ? 'active' : ''}`}
    >
      <div className="nav-icon emoji">{icon}</div>
      <div className="nav-label">{label}</div>
    </button>
  );
};

export default Layout;