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
    totalProfit: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? calculateTotalProfit() : 0,
    teachersWithDebts: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA)
      ? state.teachers.filter(teacher => calculateTeacherDebt(teacher.id) > 0).length
      : 0
  };

  // أكثر المدرسين نشاطاً (أول 3 فقط)
  const topActiveTeachers = state.teachers
    .map(teacher => ({
      ...teacher,
      operationsCount: state.operations.filter(op => op.teacherId === teacher.id).length,
      debt: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) ? calculateTeacherDebt(teacher.id) : 0
    }))
    .sort((a, b) => b.operationsCount - a.operationsCount)
    .slice(0, 3);

  // العمليات الأخيرة (أول 3 فقط)
  const recentOperations = state.operations
    .sort((a, b) => {
      const aDate = a.operationDate?.toDate ? a.operationDate.toDate() : new Date(a.operationDate);
      const bDate = b.operationDate?.toDate ? b.operationDate.toDate() : new Date(b.operationDate);
      return bDate - aDate;
    })
    .slice(0, 3);

  if (state.loading.teachers || state.loading.operations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* ترحيب شخصي */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
                  مرحباً، {user?.name} {user?.role === 'admin' ? '👑' : '📝'}
                </h1>
                <p className="text-blue-700 text-lg">
                  {formatDate(currentTime, 'EEEE, dd MMMM yyyy')}
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  {user?.role === 'admin' ? 'مدير النظام - جميع الصلاحيات' : 'سكرتارية - العمليات والمدرسين'}
                </p>
              </div>
              {!isMobile && (
                <div className="text-6xl opacity-50">
                  {user?.role === 'admin' ? '👑' : '📝'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* المدرسين */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">المدرسين</div>
                <div className="text-3xl font-bold">{statistics.totalTeachers}</div>
                <div className="text-xs opacity-80">مسجل</div>
              </div>
              <div className="text-4xl opacity-80">👨‍🏫</div>
            </div>
          </div>

          {/* العمليات اليوم */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">عمليات اليوم</div>
                <div className="text-3xl font-bold">{statistics.todayOperations}</div>
                <div className="text-xs opacity-80">من {statistics.totalOperations}</div>
              </div>
              <div className="text-4xl opacity-80">📊</div>
            </div>
          </div>

          {/* الإيرادات - للأدمن فقط */}
          <PermissionGate 
            permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
            fallback={
              <div className="bg-gradient-to-br from-gray-400 to-gray-500 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium opacity-90">الإيرادات</div>
                    <div className="text-2xl font-bold">---</div>
                    <div className="text-xs opacity-80">مخفي</div>
                  </div>
                  <div className="text-4xl opacity-80">🔒</div>
                </div>
              </div>
            }
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90">الإيرادات</div>
                  <div className="text-xl font-bold">{formatCurrency(statistics.totalRevenue)}</div>
                  <div className="text-xs opacity-80">إجمالي</div>
                </div>
                <div className="text-4xl opacity-80">💰</div>
              </div>
            </div>
          </PermissionGate>

          {/* الأرباح - للأدمن فقط */}
          <PermissionGate 
            permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
            fallback={
              <div className="bg-gradient-to-br from-gray-400 to-gray-500 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium opacity-90">الأرباح</div>
                    <div className="text-2xl font-bold">---</div>
                    <div className="text-xs opacity-80">مخفي</div>
                  </div>
                  <div className="text-4xl opacity-80">🔒</div>
                </div>
              </div>
            }
          >
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90">صافي الأرباح</div>
                  <div className={`text-xl font-bold ${statistics.totalProfit >= 0 ? '' : 'text-red-200'}`}>
                    {formatCurrency(statistics.totalProfit)}
                  </div>
                  <div className="text-xs opacity-80">بعد المصروفات</div>
                </div>
                <div className="text-4xl opacity-80">📈</div>
              </div>
            </div>
          </PermissionGate>
        </div>

       

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* الإجراءات السريعة */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                الإجراءات السريعة
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                
                <PermissionGate permission={PERMISSIONS.ADD_TEACHER}>
                  <Link
                    to="/teachers?action=add"
                    className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 group"
                  >
                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">👨‍🏫</span>
                    <span className="font-bold text-blue-900">إضافة مدرس</span>
                  </Link>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
                  <Link
                    to="/teachers"
                    className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-300 border-2 border-green-200 hover:border-green-300 group"
                  >
                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">📝</span>
                    <span className="font-bold text-green-900">عملية جديدة</span>
                  </Link>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ADD_PAYMENT}>
                  <Link
                    to="/accounts?action=payment"
                    className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 group"
                  >
                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">💳</span>
                    <span className="font-bold text-purple-900">تسجيل دفعة</span>
                  </Link>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.ADD_EXPENSE}>
                  <Link
                    to="/expenses?action=add"
                    className="flex flex-col items-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl hover:from-red-100 hover:to-red-200 transition-all duration-300 border-2 border-red-200 hover:border-red-300 group"
                  >
                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">💸</span>
                    <span className="font-bold text-red-900">إضافة مصروف</span>
                  </Link>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* أكثر المدرسين نشاطاً */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                أكثر المدرسين نشاطاً
              </h3>
            </div>
            <div className="p-6">
              {topActiveTeachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">👨‍🏫</div>
                  <p>لا توجد بيانات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topActiveTeachers.map((teacher, index) => (
                    <div key={teacher.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{teacher.name}</div>
                          <div className="text-sm text-gray-600">{teacher.operationsCount} عملية</div>
                        </div>
                      </div>
                      
                      <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                        {teacher.debt > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
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
        </div>

        {/* العمليات الأخيرة */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                العمليات الأخيرة
              </h3>
              <Link 
                to="/operations" 
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                عرض الكل ←
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentOperations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>لا توجد عمليات حديثة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOperations.map(operation => {
                  const teacher = state.teachers.find(t => t.id === operation.teacherId);
                  return (
                    <div key={operation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm">
                            {teacher?.name?.charAt(0) || '؟'}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{operation.description}</div>
                          <div className="text-sm text-gray-600">
                            {teacher?.name || 'مدرس غير معروف'} • {formatDate(operation.operationDate)}
                          </div>
                        </div>
                      </div>
                      
                      <PermissionGate permission={PERMISSIONS.VIEW_OPERATION_PRICES}>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(operation.amount)}</div>
                        </div>
                      </PermissionGate>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* نصائح للسكرتارية */}
        <PermissionGate 
          permission={PERMISSIONS.ADD_OPERATION}
          fallback={null}
        >
          {!hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
            <div className="mt-8">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-100 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <span className="text-yellow-500 text-3xl">💡</span>
                  <div>
                    <h4 className="font-bold text-yellow-900 text-lg mb-3">نصائح لك كسكرتارية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <span>✅</span>
                          <span>سجل العمليات بدقة ووضوح</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>📏</span>
                          <span>تأكد من الكميات الصحيحة</span>
                        </li>
                      </ul>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <span>📝</span>
                          <span>أضف وصف واضح لكل عملية</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>⏰</span>
                          <span>سجل العمليات في نفس اليوم</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PermissionGate>
      </div>
    </div>
  );
};

export default DashboardPage;