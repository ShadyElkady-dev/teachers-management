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

  // الأقسام الرئيسية مع الصلاحيات
  const mainSections = [
    {
      id: 'dashboard',
      name: 'لوحة التحكم',
      icon: '📊',
      path: '/dashboard',
      description: 'نظرة شاملة على النظام',
      permission: null, // متاح للجميع
      color: 'blue'
    },
    {
      id: 'teachers',
      name: 'المدرسين',
      icon: '👨‍🏫',
      path: '/teachers',
      description: 'إدارة المدرسين',
      permission: PERMISSIONS.VIEW_TEACHERS,
      color: 'indigo'
    },
    {
      id: 'operations',
      name: 'العمليات',
      icon: '📝',
      path: '/operations',
      description: 'إدارة العمليات',
      permission: PERMISSIONS.VIEW_OPERATIONS,
      color: 'green'
    },
    {
      id: 'accounts',
      name: 'الحسابات',
      icon: '💰',
      path: '/accounts',
      description: 'المدفوعات والديون',
      permission: PERMISSIONS.VIEW_PAYMENTS,
      color: 'purple'
    },
    {
      id: 'expenses',
      name: 'المصروفات',
      icon: '💸',
      path: '/expenses',
      description: 'المصروفات الخاصة',
      permission: PERMISSIONS.VIEW_EXPENSES,
      color: 'red'
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
    <nav className="h-full bg-white">
      <div className="p-6">
        
        {/* معلومات المستخدم */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0) || '👤'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">{user?.name}</h3>
              <p className="text-sm text-blue-700">
                {user?.role === 'admin' ? '👑 مدير النظام' : '📝 سكرتارية'}
              </p>
            </div>
          </div>
        </div>

        {/* الأقسام الرئيسية */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الأقسام الرئيسية</h3>
          
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
                    group block p-4 rounded-xl transition-all duration-200 border-2
                    ${isActive 
                      ? `bg-${section.color}-50 border-${section.color}-200 text-${section.color}-700` 
                      : 'hover:bg-gray-50 border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                        ${isActive 
                          ? `bg-${section.color}-100` 
                          : 'bg-gray-100 group-hover:bg-gray-200'
                        }
                      `}>
                        <span className="text-2xl">{section.icon}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{section.name}</div>
                        <div className="text-sm opacity-75">{section.description}</div>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      {alertCount && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mb-1">
                          {alertCount}
                        </div>
                      )}
                      <div className="text-sm font-semibold">{stats.count}</div>
                      <div className="text-xs opacity-75">{stats.info}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* الإجراءات السريعة */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
          
          <div className="space-y-2">
            {/* إضافة مدرس - للأدمن فقط */}
            <PermissionGate permission={PERMISSIONS.ADD_TEACHER}>
              <Link
                to="/teachers?action=add"
                onClick={onNavigate}
                className="group flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-lg">👨‍🏫</span>
                </div>
                <span className="font-medium text-gray-700 group-hover:text-blue-900">إضافة مدرس جديد</span>
              </Link>
            </PermissionGate>
            
            {/* إضافة عملية */}
            <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
              <Link
                to="/operations?action=add"
                onClick={onNavigate}
                className="group flex items-center gap-3 p-3 hover:bg-green-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <span className="text-lg">📝</span>
                </div>
                <span className="font-medium text-gray-700 group-hover:text-green-900">إضافة عملية جديدة</span>
              </Link>
            </PermissionGate>
            
            {/* تسجيل دفعة - للأدمن فقط */}
            <PermissionGate permission={PERMISSIONS.ADD_PAYMENT}>
              <Link
                to="/accounts?action=payment"
                onClick={onNavigate}
                className="group flex items-center gap-3 p-3 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <span className="text-lg">💳</span>
                </div>
                <span className="font-medium text-gray-700 group-hover:text-purple-900">تسجيل دفعة سريعة</span>
              </Link>
            </PermissionGate>
            
            {/* إضافة مصروف - للأدمن فقط */}
            <PermissionGate permission={PERMISSIONS.ADD_EXPENSE}>
              <Link
                to="/expenses?action=add"
                onClick={onNavigate}
                className="group flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <span className="text-lg">💸</span>
                </div>
                <span className="font-medium text-gray-700 group-hover:text-red-900">إضافة مصروف</span>
              </Link>
            </PermissionGate>

            {/* للسكرتارية: رسالة توجيهية */}
            <PermissionGate 
              permission={PERMISSIONS.ADD_OPERATION}
              fallback={null}
            >
              {!hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">💡</span>
                    <span className="text-sm text-yellow-800 font-medium">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الملخص المالي</h3>
            
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium">صافي الأرباح</div>
                    <div className="text-xl font-bold text-green-900">{formatCurrency(calculateTotalProfit())}</div>
                  </div>
                  <div className="text-2xl">📈</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">إجمالي الإيرادات</div>
                    <div className="text-xl font-bold text-blue-900">
                      {formatCurrency(state.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0))}
                    </div>
                  </div>
                  <div className="text-2xl">💰</div>
                </div>
              </div>
            </div>
          </div>
        </PermissionGate>

        {/* معلومات النظام */}
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center text-sm text-gray-500">
            <div className="mb-2">نظام إدارة المطبعة</div>
            <div className="mb-2">الإصدار 2.0.0</div>
            <div className="text-xs">
              تحديث: {new Date().toLocaleDateString('ar-EG')}
            </div>
            <div className="text-xs mt-2 text-blue-600">
              المستخدم: {user?.name} ({user?.role === 'admin' ? 'مدير' : 'سكرتارية'})
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navigation;