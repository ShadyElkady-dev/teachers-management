import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth, PERMISSIONS } from '../context/AuthContext';
import { PermissionGate } from '../components/Common/ProtectedRoute';
import { formatCurrency, formatDate, isSmallScreen } from '../utils/helpers';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const DashboardPage = () => {
  const { state, calculateTotalProfit, calculateTeacherDebt } = useAppContext();
  const { user, hasPermission } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(isSmallScreen());

  // تحديث الوقت كل دقيقة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isSmallScreen());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // حساب الإحصائيات العامة
  const statistics = {
    totalTeachers: state.teachers.length,
    totalOperations: state.operations.length,
    totalPayments: state.payments.length,
    totalExpenses: state.expenses.length,
    todayOperations: state.operations.filter(op => {
      const today = new Date();
      const opDate = op.operationDate?.toDate ? op.operationDate.toDate() : new Date(op.operationDate);
      return opDate.toDateString() === today.toDateString();
    }).length,
    totalRevenue: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) 
      ? state.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      : 0,
    totalDebts: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA)
      ? state.teachers.reduce((total, teacher) => {
          const debt = calculateTeacherDebt(teacher.id);
          return total + Math.max(0, debt);
        }, 0)
      : 0,
    totalProfit: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? calculateTotalProfit() : 0
  };

  // أكثر المدرسين نشاطاً
  const activeTeachers = state.teachers
    .map(teacher => ({
      ...teacher,
      operationsCount: state.operations.filter(op => op.teacherId === teacher.id).length,
      debt: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? calculateTeacherDebt(teacher.id) : 0
    }))
    .sort((a, b) => b.operationsCount - a.operationsCount)
    .slice(0, 5);

  // العمليات الأخيرة
  const recentOperations = state.operations
    .sort((a, b) => {
      const aDate = a.operationDate?.toDate ? a.operationDate.toDate() : new Date(a.operationDate);
      const bDate = b.operationDate?.toDate ? b.operationDate.toDate() : new Date(b.operationDate);
      return bDate - aDate;
    })
    .slice(0, 5);

  if (state.loading.teachers || state.loading.operations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="section-mobile space-y-6">
      
      {/* ترحيب شخصي */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 mb-2">
              مرحباً، {user?.name} {user?.role === 'admin' ? '👑' : '📝'}
            </h1>
            <p className="text-blue-700">
              {formatDate(currentTime, 'EEEE, dd MMMM yyyy')} • {currentTime.toLocaleTimeString('ar-EG', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              {user?.role === 'admin' ? 'مدير النظام - جميع الصلاحيات' : 'سكرتارية - صلاحيات محدودة'}
            </p>
          </div>
          {!isMobile && (
            <div className="text-6xl opacity-50">
              {user?.role === 'admin' ? '👑' : '📝'}
            </div>
          )}
        </div>
      </div>

      {/* البطاقات الإحصائية الرئيسية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* المدرسين */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">إجمالي المدرسين</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.totalTeachers}</p>
              <p className="text-xs text-gray-500 mt-1">مسجل في النظام</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl md:text-2xl">👨‍🏫</span>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/teachers" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              عرض جميع المدرسين ←
            </Link>
          </div>
        </div>

        {/* العمليات اليوم */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">عمليات اليوم</p>
              <p className="text-2xl font-bold text-green-600">{statistics.todayOperations}</p>
              <p className="text-xs text-gray-500 mt-1">من أصل {statistics.totalOperations} عملية</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl md:text-2xl">📊</span>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/operations" 
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              عرض العمليات ←
            </Link>
          </div>
        </div>

        {/* الإيرادات - للأدمن فقط */}
        <PermissionGate 
          permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
          fallback={
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">الإيرادات</p>
                  <p className="text-2xl font-bold text-gray-400">---</p>
                  <p className="text-xs text-gray-400 mt-1">غير مصرح</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl md:text-2xl">🔒</span>
                </div>
              </div>
            </div>
          }
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(statistics.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">من {statistics.totalPayments} دفعة</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl md:text-2xl">💰</span>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to="/accounts" 
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                عرض الحسابات ←
              </Link>
            </div>
          </div>
        </PermissionGate>

        {/* الأرباح - للأدمن فقط */}
        <PermissionGate 
          permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
          fallback={
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">صافي الأرباح</p>
                  <p className="text-2xl font-bold text-gray-400">---</p>
                  <p className="text-xs text-gray-400 mt-1">غير مصرح</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl md:text-2xl">🔒</span>
                </div>
              </div>
            </div>
          }
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">صافي الأرباح</p>
                <p className={`text-2xl font-bold ${statistics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(statistics.totalProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">بعد المصروفات</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl md:text-2xl">📈</span>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                to="/expenses" 
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                عرض المصروفات ←
              </Link>
            </div>
          </div>
        </PermissionGate>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* العمود الأيسر - العمليات الأخيرة */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* العمليات الأخيرة */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">العمليات الأخيرة</h3>
                <Link 
                  to="/operations" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  عرض الكل
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentOperations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-500">لا توجد عمليات حديثة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOperations.map(operation => {
                    const teacher = state.teachers.find(t => t.id === operation.teacherId);
                    return (
                      <div key={operation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {teacher?.name?.charAt(0) || '؟'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{operation.description}</p>
                            <p className="text-sm text-gray-600">{teacher?.name || 'مدرس غير معروف'}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(operation.operationDate)} • الكمية: {operation.quantity || 1}
                            </p>
                          </div>
                        </div>
                        <PermissionGate permission={PERMISSIONS.VIEW_OPERATION_PRICES}>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">{formatCurrency(operation.amount)}</p>
                          </div>
                        </PermissionGate>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* الإجراءات السريعة */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">الإجراءات السريعة</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <PermissionGate permission={PERMISSIONS.ADD_TEACHER}>
                  <Link
                    to="/teachers?action=add"
                    className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-2xl mb-2">👨‍🏫</span>
                    <span className="text-sm font-medium text-blue-900">إضافة مدرس</span>
                  </Link>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
                  <Link
                    to="/teachers"
                    className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <span className="text-2xl mb-2">📝</span>
                    <span className="text-sm font-medium text-green-900">عملية جديدة</span>
                  </Link>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ADD_PAYMENT}>
                  <Link
                    to="/accounts?action=payment"
                    className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <span className="text-2xl mb-2">💳</span>
                    <span className="text-sm font-medium text-purple-900">تسجيل دفعة</span>
                  </Link>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ADD_EXPENSE}>
                  <Link
                    to="/expenses?action=add"
                    className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <span className="text-2xl mb-2">💸</span>
                    <span className="text-sm font-medium text-red-900">إضافة مصروف</span>
                  </Link>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>

        {/* العمود الأيمن - معلومات جانبية */}
        <div className="space-y-6">
          
          {/* أكثر المدرسين نشاطاً */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">أكثر المدرسين نشاطاً</h3>
            </div>
            <div className="p-6">
              {activeTeachers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">لا توجد بيانات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTeachers.map((teacher, index) => (
                    <div key={teacher.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{teacher.name}</p>
                          <p className="text-xs text-gray-500">{teacher.operationsCount} عملية</p>
                        </div>
                      </div>
                      <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                        {teacher.debt > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            {formatCurrency(teacher.debt)}
                          </span>
                        )}
                      </PermissionGate>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* التنبيهات - للأدمن فقط */}
          <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">التنبيهات</h3>
              </div>
              <div className="p-6">
                {statistics.totalDebts > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 space-x-reverse p-3 bg-red-50 rounded-lg">
                      <span className="text-red-500 text-lg">⚠️</span>
                      <div>
                        <p className="text-sm font-medium text-red-900">مديونيات عالية</p>
                        <p className="text-xs text-red-600">إجمالي: {formatCurrency(statistics.totalDebts)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="text-4xl mb-2 block">✅</span>
                    <p className="text-green-600 text-sm font-medium">لا توجد مديونيات</p>
                  </div>
                )}
              </div>
            </div>
          </PermissionGate>

          {/* نصائح للسكرتارية */}
          <PermissionGate 
            permission={PERMISSIONS.ADD_OPERATION}
            fallback={null}
          >
            {!hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <span className="text-yellow-500 text-lg">💡</span>
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-2">نصائح لك</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• سجل العمليات بدقة</li>
                      <li>• تأكد من الكميات الصحيحة</li>
                      <li>• أضف وصف واضح لكل عملية</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </PermissionGate>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;