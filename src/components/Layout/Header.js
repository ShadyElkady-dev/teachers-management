import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import UserProfile from '../Common/UserProfile';
import { formatCurrency, formatDate, isSmallScreen } from '../../utils/helpers';
import { APP_CONFIG } from '../../utils/constants';

const Header = ({ onMenuClick, isMobile }) => {
  const location = useLocation();
  const { state, calculateTotalProfit } = useAppContext();
  const { user, hasPermission } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // تحديث الوقت كل دقيقة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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
        return { title: 'نظام إدارة المطبعة', icon: '🖨️', color: 'from-gray-500 to-gray-600' };
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
          
          {/* الجهة اليمنى - العنوان والشعار */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                <span className="text-white text-2xl">{pageInfo.icon}</span>
              </div>
              {!isMobile && (
                <div>
                  <h1 className="text-lg font-bold text-white">{APP_CONFIG.NAME}</h1>
                  <p className="text-xs text-white opacity-80">الإصدار {APP_CONFIG.VERSION}</p>
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

            {/* أيقونة الإشعارات */}
            <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
              <button className="relative p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 backdrop-blur-sm">
                <span className="text-xl">🔔</span>
                {stats.totalDebts > 0 && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-xs text-white font-bold">!</span>
                  </span>
                )}
              </button>
            </PermissionGate>

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

            {/* قائمة الإعدادات للشاشات الكبيرة */}
            {!isMobile && (
              <PermissionGate permission={PERMISSIONS.VIEW_SYSTEM_SETTINGS}>
                <div className="bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <SettingsDropdown />
                </div>
              </PermissionGate>
            )}
          </div>
        </div>

        {/* شريط الإحصائيات للهواتف المحمولة */}
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
              </div>
              <div className="text-white opacity-80 font-medium">
                {formatDate(currentTime, 'yyyy/MM/dd')}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// مكون قائمة الإعدادات المنسدلة - للأدمن فقط
const SettingsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (action) => {
    setIsOpen(false);
    
    switch (action) {
      case 'export':
        // تصدير البيانات
        console.log('تصدير البيانات');
        break;
      case 'backup':
        // نسخ احتياطي
        console.log('إنشاء نسخة احتياطية');
        break;
      case 'settings':
        // الإعدادات
        console.log('فتح الإعدادات');
        break;
      case 'help':
        // المساعدة
        console.log('فتح المساعدة');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
        aria-label="الإعدادات"
      >
        <span className="text-xl">⚙️</span>
      </button>

      {isOpen && (
        <>
          {/* خلفية شفافة لإغلاق القائمة */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* القائمة المنسدلة */}
          <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-2">
              <button
                onClick={() => handleItemClick('export')}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <span>📊</span>
                تصدير البيانات
              </button>
              
              <button
                onClick={() => handleItemClick('backup')}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <span>💾</span>
                نسخة احتياطية
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                onClick={() => handleItemClick('settings')}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <span>⚙️</span>
                الإعدادات
              </button>
              
              <button
                onClick={() => handleItemClick('help')}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <span>❓</span>
                المساعدة
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Header;