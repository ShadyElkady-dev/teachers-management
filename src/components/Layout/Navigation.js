import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth, PERMISSIONS } from '../../context/AuthContext';
import { PermissionGate } from '../Common/ProtectedRoute';
import { formatCurrency } from '../../utils/helpers';

const Navigation = ({ onNavigate }) => {
  const location = useLocation();
  const { state, calculateTotalProfit, calculateTeacherDebt } = useAppContext();
  const { user, hasPermission } = useAuth();

  // الأقسام الرئيسية مع الصلاحيات والألوان المحدثة
  const mainSections = [
    {
      id: 'dashboard',
      name: 'لوحة التحكم',
      icon: '📊',
      path: '/dashboard',
      description: 'نظرة شاملة على النظام',
      permission: null,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      hoverBg: 'hover:bg-blue-100'
    },
    {
      id: 'teachers',
      name: 'المدرسين',
      icon: '👨‍🏫',
      path: '/teachers',
      description: 'إدارة المدرسين',
      permission: PERMISSIONS.VIEW_TEACHERS,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      hoverBg: 'hover:bg-indigo-100'
    },
    {
      id: 'operations',
      name: 'العمليات',
      icon: '📝',
      path: '/operations',
      description: 'إدارة العمليات',
      permission: PERMISSIONS.VIEW_OPERATIONS,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      hoverBg: 'hover:bg-green-100'
    },
    {
      id: 'accounts',
      name: 'الحسابات',
      icon: '💰',
      path: '/accounts',
      description: 'المدفوعات والديون',
      permission: PERMISSIONS.VIEW_PAYMENTS,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      hoverBg: 'hover:bg-purple-100'
    },
    {
      id: 'expenses',
      name: 'المصروفات',
      icon: '💸',
      path: '/expenses',
      description: 'المصروفات الخاصة',
      permission: PERMISSIONS.VIEW_EXPENSES,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      hoverBg: 'hover:bg-red-100'
    }
  ];

  // تصفية الأقسام المتاحة
  const availableSections = mainSections.filter(section => 
    !section.permission || hasPermission(section.permission)
  );

  // حساب الإحصائيات لكل قسم
  const getSectionStats = (sectionId) => {
    switch (sectionId) {
      case 'dashboard':
        return {
          count: state.teachers.length + state.operations.length,
          info: 'عنصر في النظام'
        };
      case 'teachers':
        return {
          count: state.teachers.length,
          info: 'مدرس مسجل'
        };
      case 'operations':
        const todayOperations = state.operations.filter(op => {
          const today = new Date();
          const opDate = op.operationDate?.toDate ? op.operationDate.toDate() : new Date(op.operationDate);
          return opDate.toDateString() === today.toDateString();
        }).length;
        return {
          count: todayOperations,
          info: `من ${state.operations.length} عملية`
        };
      case 'accounts':
        if (!hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA)) {
          return { count: '---', info: 'محدود الوصول' };
        }
        const totalDebts = state.teachers.reduce((total, teacher) => {
          const debt = calculateTeacherDebt(teacher.id);
          return total + Math.max(0, debt);
        }, 0);
        return {
          count: formatCurrency(totalDebts),
          info: 'مديونيات'
        };
      case 'expenses':
        if (!hasPermission(PERMISSIONS.VIEW_EXPENSES)) {
          return { count: '---', info: 'محدود الوصول' };
        }
        const monthlyExpenses = state.expenses.filter(expense => {
          const expenseDate = expense.expenseDate?.toDate ? expense.expenseDate.toDate() : new Date(expense.expenseDate);
          const now = new Date();
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear();
        }).reduce((sum, expense) => sum + (expense.amount || 0), 0);
        return {
          count: formatCurrency(monthlyExpenses),
          info: 'هذا الشهر'
        };
      default:
        return { count: 0, info: '' };
    }
  };

  // التحقق من وجود تنبيهات
  const getAlerts = (sectionId) => {
    if (!hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA)) {
      return null;
    }

    switch (sectionId) {
      case 'accounts':
        const overdueCount = state.teachers.filter(teacher => {
          const debt = calculateTeacherDebt(teacher.id);
          return debt > 0;
        }).length;
        return overdueCount > 0 ? overdueCount : null;
      default:
        return null;
    }
  };

  return (
    <nav className="h-full bg-gradient-to-b from-gray-50 to-white">
      <div className="p-6">
        
        {/* معلومات المستخدم المحسنة */}
        <div className="mb-6 relative overflow-hidden">
          <div className={`bg-gradient-to-r ${user?.role === 'admin' ? 'from-purple-500 to-indigo-600' : 'from-blue-500 to-cyan-600'} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                <span className="text-white font-bold text-2xl">
                  {user?.name?.charAt(0) || '👤'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-white mb-1">{user?.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{user?.role === 'admin' ? '👑' : '📝'}</span>
                  <p className="text-white opacity-90 font-medium">
                    {user?.role === 'admin' ? 'مدير النظام' : 'سكرتارية'}
                  </p>
                </div>
              </div>
            </div>
            {/* تأثير بصري */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
          </div>
        </div>

        {/* الأقسام الرئيسية */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            الأقسام الرئيسية
          </h3>
          
          <div className="space-y-2">
            {availableSections.map((section) => {
              const isActive = location.pathname === section.path;
              const stats = getSectionStats(section.id);
              const alertCount = getAlerts(section.id);

              return (
                <Link
                  key={section.id}
                  to={section.path}
                  onClick={onNavigate}
                  className={`
                    group block p-4 rounded-2xl transition-all duration-300 border-2 shadow-md hover:shadow-lg transform hover:scale-105
                    ${isActive 
                      ? `bg-gradient-to-r ${section.gradient} border-transparent text-white shadow-lg` 
                      : `${section.bgColor} ${section.borderColor} ${section.textColor} ${section.hoverBg} hover:border-opacity-70`
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md
                        ${isActive 
                          ? 'bg-white bg-opacity-20 backdrop-blur-sm' 
                          : 'bg-white shadow-lg'
                        }
                      `}>
                        <span className={`text-2xl ${isActive ? 'text-white' : ''}`}>
                          {section.icon}
                        </span>
                      </div>
                      <div>
                        <div className={`font-bold text-lg ${isActive ? 'text-white' : section.textColor}`}>
                          {section.name}
                        </div>
                        <div className={`text-sm ${isActive ? 'text-white opacity-90' : 'text-gray-600'}`}>
                          {section.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      {alertCount && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mb-2 animate-pulse">
                          {alertCount}
                        </div>
                      )}
                      <div className={`text-sm font-bold ${isActive ? 'text-white' : section.textColor}`}>
                        {stats.count}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-white opacity-80' : 'text-gray-500'}`}>
                        {stats.info}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* الإجراءات السريعة */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            إجراءات سريعة
          </h3>
          
          <div className="space-y-3">
            {/* إضافة مدرس - للأدمن فقط */}
            <PermissionGate permission={PERMISSIONS.ADD_TEACHER}>
              <Link
                to="/teachers?action=add"
                onClick={onNavigate}
                className="group flex items-center gap-3 p-4 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-lg text-white">👨‍🏫</span>
                </div>
                <span className="font-bold text-blue-900 text-lg">إضافة مدرس جديد</span>
              </Link>
            </PermissionGate>
            
            {/* إضافة عملية */}
            <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
              <Link
                to="/operations?action=add"
                onClick={onNavigate}
                className="group flex items-center gap-3 p-4 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-lg text-white">📝</span>
                </div>
                <span className="font-bold text-green-900 text-lg">إضافة عملية جديدة</span>
              </Link>
            </PermissionGate>
            
            {/* تسجيل دفعة - للأدمن فقط */}
            <PermissionGate permission={PERMISSIONS.ADD_PAYMENT}>
              <Link
                to="/accounts?action=payment"
                onClick={onNavigate}
                className="group flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-lg text-white">💳</span>
                </div>
                <span className="font-bold text-purple-900 text-lg">تسجيل دفعة سريعة</span>
              </Link>
            </PermissionGate>
            
            {/* إضافة مصروف - للأدمن فقط */}
            <PermissionGate permission={PERMISSIONS.ADD_EXPENSE}>
              <Link
                to="/expenses?action=add"
                onClick={onNavigate}
                className="group flex items-center gap-3 p-4 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-lg text-white">💸</span>
                </div>
                <span className="font-bold text-red-900 text-lg">إضافة مصروف</span>
              </Link>
            </PermissionGate>

            {/* للسكرتارية: رسالة توجيهية */}
            <PermissionGate 
              permission={PERMISSIONS.ADD_OPERATION}
              fallback={null}
            >
              {!hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
                <div className="p-4 bg-gradient-to-r from-yellow-100 to-amber-200 border-2 border-yellow-300 rounded-2xl shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-600 text-2xl">💡</span>
                    <span className="text-sm text-yellow-800 font-bold">
                      يمكنك إضافة العمليات من صفحة العمليات
                    </span>
                  </div>
                </div>
              )}
            </PermissionGate>
          </div>
        </div>

        {/* الملخص المالي - للأدمن فقط */}
        <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              الملخص المالي
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl border border-green-300 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium opacity-90">صافي الأرباح</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(calculateTotalProfit())}</div>
                  </div>
                  <div className="text-3xl text-white opacity-80">📈</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-4 rounded-2xl border border-blue-300 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium opacity-90">إجمالي الإيرادات</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(state.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0))}
                    </div>
                  </div>
                  <div className="text-3xl text-white opacity-80">💰</div>
                </div>
              </div>
            </div>
          </div>
        </PermissionGate>

        {/* معلومات النظام */}
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-4 text-center">
            <div className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <span>🖨️</span>
              نظام إدارة حسابات المدرسين
            </div>
            <div className="text-sm text-gray-600 mb-2">الإصدار 2.0.0</div>
            <div className="text-xs text-gray-500 mb-3">
              تحديث: {new Date().toLocaleDateString('ar-EG')}
            </div>
            <div className="bg-white rounded-xl p-3 shadow-md">
              <div className="text-xs font-bold text-gray-700 mb-1">
                المستخدم الحالي
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{user?.role === 'admin' ? '👑' : '📝'}</span>
                <div className="text-sm">
                  <div className="font-bold text-gray-800">{user?.name}</div>
                  <div className="text-gray-600">
                    {user?.role === 'admin' ? 'مدير النظام' : 'سكرتارية'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navigation;