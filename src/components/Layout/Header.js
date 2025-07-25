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

  // الحصول على عنوان الصفحة الحالية
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'لوحة التحكم';
      case '/teachers':
        return 'إدارة المدرسين';
      case '/operations':
        return 'إدارة العمليات';
      case '/accounts':
        return 'إدارة الحسابات';
      case '/expenses':
        return 'المصروفات الخاصة';
      default:
        return 'نظام إدارة المطبعة';
    }
  };

  // حساب الإحصائيات السريعة (مع مراعاة الصلاحيات)
  const stats = {
    totalTeachers: state.teachers.length,
    // إظهار الأرباح فقط للأدمن
    totalProfit: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? calculateTotalProfit() : 0,
    // إظهار الديون فقط للأدمن
    totalDebts: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? state.teachers.reduce((total, teacher) => {
      return total + Math.max(0, state.operations
        .filter(op => op.teacherId === teacher.id)
        .reduce((sum, op) => sum + (op.amount || 0), 0) - 
        state.payments
        .filter(payment => payment.teacherId === teacher.id)
        .reduce((sum, payment) => sum + (payment.amount || 0), 0));
    }, 0) : 0
  };

  return (
    <header className="header-mobile bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center justify-between h-16 px-4">
        
        {/* الجهة اليمنى - العنوان والشعار */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🖨️</span>
            </div>
            {!isMobile && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">{APP_CONFIG.NAME}</h1>
                <p className="text-xs text-gray-500">الإصدار {APP_CONFIG.VERSION}</p>
              </div>
            )}
          </div>
        </div>

        {/* الوسط - عنوان الصفحة */}
        <div className="flex-1 text-center">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">
            {getPageTitle()}
          </h2>
          {!isMobile && (
            <p className="text-sm text-gray-500">
              {formatDate(currentTime, 'yyyy/MM/dd')} - {currentTime.toLocaleTimeString('ar-EG', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}
        </div>

        {/* الجهة اليسرى - الإحصائيات والقائمة */}
        <div className="flex items-center gap-2">
          
          {/* الإحصائيات السريعة للشاشات الكبيرة - مع مراعاة الصلاحيات */}
          {!isMobile && (
            <div className="flex items-center gap-4 mr-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-600">
                  {stats.totalTeachers}
                </div>
                <div className="text-xs text-gray-500">مدرس</div>
              </div>
              
              <div className="w-px h-8 bg-gray-300"></div>
              
              {/* إظهار الأرباح فقط للأدمن */}
              <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(stats.totalProfit)}
                  </div>
                  <div className="text-xs text-gray-500">الأرباح</div>
                </div>
                
                <div className="w-px h-8 bg-gray-300"></div>
                
                <div className="text-center">
                  <div className="text-sm font-semibold text-red-600">
                    {formatCurrency(stats.totalDebts)}
                  </div>
                  <div className="text-xs text-gray-500">الديون</div>
                </div>
              </PermissionGate>
            </div>
          )}

          {/* أيقونة الإشعارات - مع مراعاة الصلاحيات */}
          <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
            <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-xl">🔔</span>
              {stats.totalDebts > 0 && (
                <span className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          </PermissionGate>

          {/* ملف المستخدم */}
          <UserProfile />

          {/* زر القائمة للهواتف المحمولة */}
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="فتح القائمة"
            >
              <span className="text-xl">☰</span>
            </button>
          )}

          {/* قائمة الإعدادات للشاشات الكبيرة - للأدمن فقط */}
          {!isMobile && (
            <PermissionGate permission={PERMISSIONS.VIEW_SYSTEM_SETTINGS}>
              <SettingsDropdown />
            </PermissionGate>
          )}
        </div>
      </div>

      {/* شريط الإحصائيات للهواتف المحمولة */}
      {isMobile && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600">
                {stats.totalTeachers}
              </div>
              <div className="text-xs text-gray-500">مدرس</div>
            </div>
            
            {/* إظهار البيانات المالية فقط للأدمن */}
            <PermissionGate 
              permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
              fallback={
                <>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-400">---</div>
                    <div className="text-xs text-gray-400">أرباح</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-400">---</div>
                    <div className="text-xs text-gray-400">ديون</div>
                  </div>
                </>
              }
            >
              <div className="text-center">
                <div className="text-sm font-semibold text-green-600">
                  {formatCurrency(stats.totalProfit)}
                </div>
                <div className="text-xs text-gray-500">أرباح</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-semibold text-red-600">
                  {formatCurrency(stats.totalDebts)}
                </div>
                <div className="text-xs text-gray-500">ديون</div>
              </div>
            </PermissionGate>
            
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-600">
                {currentTime.toLocaleTimeString('ar-EG', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="text-xs text-gray-500">الوقت</div>
            </div>
          </div>
        </div>
      )}

      {/* شريط معلومات المستخدم الحالي */}
      {!isMobile && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-700">
              <span>{user?.role === 'admin' ? '👑' : '📝'}</span>
              <span>مرحباً، {user?.name}</span>
              <span className="text-blue-500">
                ({user?.role === 'admin' ? 'مدير النظام' : 'سكرتارية'})
              </span>
            </div>
            <div className="text-blue-600">
              {formatDate(currentTime, 'yyyy/MM/dd')}
            </div>
          </div>
        </div>
      )}
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
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
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