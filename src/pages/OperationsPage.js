import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth, PERMISSIONS } from '../context/AuthContext';
import { PermissionGate } from '../components/Common/ProtectedRoute';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// Components
import OperationForm from '../components/Teachers/OperationForm';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';

// Enhanced OperationsList component
import OperationsList from '../components/Operations/OperationsList';

// Utils
import { searchInText, formatCurrency, formatDate, timeAgo, groupBy, isSmallScreen } from '../utils/helpers';
import { MESSAGES, OPERATION_TYPES } from '../utils/constants';

const OperationsPage = () => {
  const { state, operationActions, calculateTeacherDebt } = useAppContext();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // حالات المكونات
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [editingOperation, setEditingOperation] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, year
  const [sortBy, setSortBy] = useState('date'); // date, amount, teacher
  const [sortOrder, setSortOrder] = useState('desc');
  const [isMobile, setIsMobile] = useState(isSmallScreen());

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isSmallScreen());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // معالجة معاملات الـ URL
  useEffect(() => {
    const action = searchParams.get('action');
    const teacherId = searchParams.get('teacher');
    
    if (action === 'add') {
      if (teacherId) {
        const teacher = state.teachers.find(t => t.id === teacherId);
        setSelectedTeacher(teacher);
      }
      setShowOperationForm(true);
      setEditingOperation(null);
    }
  }, [searchParams, state.teachers]);

  // تصفية العمليات
  const getFilteredOperations = () => {
    return state.operations.filter(operation => {
      const teacher = state.teachers.find(t => t.id === operation.teacherId);
      
      // فلتر البحث
      const matchesSearch = !searchTerm.trim() || 
        searchInText(operation.description, searchTerm) ||
        searchInText(teacher?.name, searchTerm) ||
        searchInText(operation.type, searchTerm) ||
        searchInText(operation.notes, searchTerm);

      // فلتر النوع
      const matchesType = filterType === 'all' || operation.type === filterType;

      // فلتر المدرس
      const matchesTeacher = filterTeacher === 'all' || operation.teacherId === filterTeacher;

      // فلتر التاريخ
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const operationDate = operation.operationDate?.toDate ? operation.operationDate.toDate() : new Date(operation.operationDate);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = operationDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = operationDate >= weekAgo;
            break;
          case 'month':
            matchesDate = operationDate.getMonth() === now.getMonth() && 
                         operationDate.getFullYear() === now.getFullYear();
            break;
          case 'year':
            matchesDate = operationDate.getFullYear() === now.getFullYear();
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesType && matchesTeacher && matchesDate;
    });
  };

  const filteredOperations = getFilteredOperations()
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const aDate = a.operationDate?.toDate ? a.operationDate.toDate() : new Date(a.operationDate);
          const bDate = b.operationDate?.toDate ? b.operationDate.toDate() : new Date(b.operationDate);
          comparison = aDate - bDate;
          break;
        case 'amount':
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        case 'teacher':
          const teacherA = state.teachers.find(t => t.id === a.teacherId)?.name || '';
          const teacherB = state.teachers.find(t => t.id === b.teacherId)?.name || '';
          comparison = teacherA.localeCompare(teacherB, 'ar');
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type, 'ar');
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // حساب الإحصائيات
  const statistics = {
    totalOperations: state.operations.length,
    filteredOperations: filteredOperations.length,
    totalAmount: hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES_AFTER_SAVE) 
      ? filteredOperations.reduce((sum, operation) => sum + (operation.amount || 0), 0)
      : 0,
    averageAmount: hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES_AFTER_SAVE) && filteredOperations.length > 0
      ? filteredOperations.reduce((sum, operation) => sum + (operation.amount || 0), 0) / filteredOperations.length 
      : 0,
    todayOperations: filteredOperations.filter(operation => {
      const operationDate = operation.operationDate?.toDate ? operation.operationDate.toDate() : new Date(operation.operationDate);
      const now = new Date();
      return operationDate.toDateString() === now.toDateString();
    }).length,
    byType: groupBy(filteredOperations, 'type')
  };

  // إحصائيات حسب النوع
  const operationsByType = OPERATION_TYPES.map(type => {
    const typeOperations = filteredOperations.filter(operation => operation.type === type.value);
    const total = hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES_AFTER_SAVE) 
      ? typeOperations.reduce((sum, operation) => sum + (operation.amount || 0), 0)
      : 0;
    return {
      ...type,
      count: typeOperations.length,
      total,
      percentage: statistics.totalAmount > 0 ? (total / statistics.totalAmount) * 100 : 0
    };
  }).filter(type => type.count > 0);

  // وظائف التحكم في العمليات
  const handleAddOperation = (teacher = null) => {
    setSelectedTeacher(teacher);
    setEditingOperation(null);
    setShowOperationForm(true);
    setSearchParams({});
  };

  const handleEditOperation = (operation) => {
    const teacher = state.teachers.find(t => t.id === operation.teacherId);
    setSelectedTeacher(teacher);
    setEditingOperation(operation);
    setShowOperationForm(true);
  };

  const handleDeleteOperation = async (operation) => {
    if (window.confirm(MESSAGES.CONFIRM.DELETE_OPERATION)) {
      try {
        await operationActions.deleteOperation(operation.id);
        toast.success(MESSAGES.SUCCESS.OPERATION_DELETED);
      } catch (error) {
        toast.error(error.message || MESSAGES.ERROR.GENERAL);
      }
    }
  };

const handleSaveOperation = async (teacherIdOrData, operationData) => {
  try {
    if (editingOperation) {
      // في حالة التعديل، البيانات في المعاملة الأولى
      const updateData = typeof teacherIdOrData === 'string' ? operationData : teacherIdOrData;
      await operationActions.updateOperation(editingOperation.id, updateData);
      toast.success(MESSAGES.SUCCESS.OPERATION_UPDATED);
    } else {
      // في حالة الإضافة، تحديد teacherId والبيانات
      let teacherId, data;
      
      if (typeof teacherIdOrData === 'string') {
        // تم تمرير teacherId منفصل
        teacherId = teacherIdOrData;
        data = operationData;
      } else {
        // تم تمرير البيانات مع teacherId داخلها (الطريقة القديمة)
        teacherId = selectedTeacher?.id;
        data = teacherIdOrData;
      }

      if (!teacherId) {
        toast.error('يجب اختيار مدرس');
        return;
      }

      await operationActions.addOperation(teacherId, data);
      toast.success(MESSAGES.SUCCESS.OPERATION_ADDED);
    }
    
    setShowOperationForm(false);
    setEditingOperation(null);
    setSelectedTeacher(null);
  } catch (error) {
    toast.error(error.message || MESSAGES.ERROR.GENERAL);
  }
};

  // إغلاق النوافذ
  const handleCloseModals = () => {
    setShowOperationForm(false);
    setEditingOperation(null);
    setSelectedTeacher(null);
  };

  if (state.loading.operations || state.loading.teachers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* رأس الصفحة */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">📝 إدارة العمليات</h1>
            <p className="text-gray-600 text-lg">
              عرض وإدارة جميع العمليات المسجلة في النظام
            </p>
            
            <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
              <button
                onClick={() => handleAddOperation()}
                className="mt-6 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                <span className="text-2xl ml-2">➕</span>
                إضافة عملية جديدة
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">إجمالي العمليات</div>
                <div className="text-3xl font-bold">{statistics.filteredOperations}</div>
                <div className="text-xs opacity-80">من أصل {statistics.totalOperations}</div>
              </div>
              <div className="text-4xl opacity-80">📊</div>
            </div>
          </div>
          
          {/* 🔥 تعديل: استخدام الصلاحية الجديدة لإخفاء المبالغ عن السكرتيرة */}
          <PermissionGate 
            permission={PERMISSIONS.VIEW_OPERATION_PRICES_AFTER_SAVE}
            fallback={
              <div className="bg-gradient-to-br from-gray-400 to-gray-500 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium opacity-90">إجمالي المبالغ</div>
                    <div className="text-3xl font-bold">---</div>
                    <div className="text-xs opacity-80">غير مصرح</div>
                  </div>
                  <div className="text-4xl opacity-80">🔒</div>
                </div>
              </div>
            }
          >
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90">إجمالي المبالغ</div>
                  <div className="text-2xl font-bold">{formatCurrency(statistics.totalAmount)}</div>
                  <div className="text-xs opacity-80">متوسط: {formatCurrency(statistics.averageAmount)}</div>
                </div>
                <div className="text-4xl opacity-80">💰</div>
              </div>
            </div>
          </PermissionGate>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">عمليات اليوم</div>
                <div className="text-3xl font-bold">{statistics.todayOperations}</div>
                <div className="text-xs opacity-80">اليوم</div>
              </div>
              <div className="text-4xl opacity-80">📅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">أنواع العمليات</div>
                <div className="text-3xl font-bold">{operationsByType.length}</div>
                <div className="text-xs opacity-80">نوع مختلف</div>
              </div>
              <div className="text-4xl opacity-80">🏷️</div>
            </div>
          </div>
        </div>

        {/* إحصائيات حسب النوع - مع إخفاء المبالغ عن السكرتيرة */}
        {operationsByType.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📈 العمليات حسب النوع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {operationsByType.map((type) => (
                <div key={type.value} className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${type.color}`}></div>
                      <div className="font-bold text-gray-900">{type.label}</div>
                    </div>
                    <div className="text-sm text-gray-600">{type.count} عملية</div>
                  </div>
                  {/* 🔥 إخفاء المبالغ عن السكرتيرة */}
                  <PermissionGate permission={PERMISSIONS.VIEW_OPERATION_PRICES_AFTER_SAVE}>
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {formatCurrency(type.total)}
                    </div>
                  </PermissionGate>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(type.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES_AFTER_SAVE) 
                      ? `${type.percentage.toFixed(1)}% من الإجمالي`
                      : `${((type.count / filteredOperations.length) * 100).toFixed(1)}% من العدد`
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أدوات البحث والتصفية */}
        <div className="mb-6 space-y-4">
          
          {/* شريط البحث */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="🔍 البحث في العمليات (الوصف، المدرس، النوع...)"
            className="text-lg"
          />

          {/* الفلاتر */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-gray-900">🔍 البحث والتصفية المتقدمة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* فلتر النوع */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع العملية:</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="all">جميع الأنواع</option>
                  {OPERATION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* فلتر المدرس */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المدرس:</label>
                <select 
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="all">جميع المدرسين</option>
                  {state.teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* فلتر التاريخ */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الفترة الزمنية:</label>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="all">كل الأوقات</option>
                  <option value="today">اليوم</option>
                  <option value="week">آخر أسبوع</option>
                  <option value="month">هذا الشهر</option>
                  <option value="year">هذا العام</option>
                </select>
              </div>

              {/* الترتيب */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ترتيب حسب:</label>
                <div className="flex gap-2">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  >
                    <option value="date">التاريخ</option>
                    <option value="teacher">المدرس</option>
                    <option value="type">النوع</option>
                    {hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES_AFTER_SAVE) && (
                      <option value="amount">المبلغ</option>
                    )}
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all duration-200"
                    title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
                  >
                    {sortOrder === 'asc' ? '📈' : '📉'}
                  </button>
                </div>
              </div>
            </div>

            {/* أدوات التحكم */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterTeacher('all');
                    setDateFilter('all');
                    setSortBy('date');
                    setSortOrder('desc');
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-200"
                >
                  مسح جميع الفلاتر
                </button>
              </div>
              
              <div className="bg-blue-50 px-4 py-2 rounded-xl">
                <span className="text-sm font-bold text-blue-800">
                  عرض {filteredOperations.length} عملية
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* قائمة العمليات */}
        <div className="mb-6">
          {filteredOperations.length === 0 && searchTerm ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد نتائج</div>
              <div className="text-gray-500 text-lg">
                لم يتم العثور على عمليات مطابقة لكلمة البحث "{searchTerm}"
              </div>
            </div>
          ) : filteredOperations.length === 0 && (filterType !== 'all' || filterTeacher !== 'all' || dateFilter !== 'all') ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد عمليات</div>
              <div className="text-gray-500 text-lg">
                لا توجد عمليات مطابقة للفلاتر المحددة
              </div>
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد عمليات</div>
              <div className="text-gray-500 text-lg mb-6">
                ابدأ بإضافة عملية جديدة لأحد المدرسين
              </div>
              <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
                <button
                  onClick={() => handleAddOperation()}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                >
                  <span className="text-2xl ml-2">➕</span>
                  إضافة عملية جديدة
                </button>
              </PermissionGate>
            </div>
          ) : (
            <OperationsList
              operations={filteredOperations}
              teachers={state.teachers}
              onEdit={handleEditOperation}
              onDelete={handleDeleteOperation}
              showPrices={hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES)}
              canEdit={hasPermission(PERMISSIONS.EDIT_OPERATION)}
              canDelete={hasPermission(PERMISSIONS.DELETE_OPERATION)}
            />
          )}
        </div>

        {/* نافذة إضافة/تعديل عملية */}
        <Modal
          isOpen={showOperationForm}
          onClose={handleCloseModals}
          title={editingOperation ? '✏️ تعديل العملية' : `➕ إضافة عملية جديدة${selectedTeacher ? ` - ${selectedTeacher.name}` : ''}`}
          size="large"
        >
         <OperationForm
  operation={editingOperation}
  teacher={selectedTeacher}
  teachers={state.teachers}
  onSave={handleSaveOperation}
  onCancel={handleCloseModals}
  loading={state.loading.operations}
/>
        </Modal>
      </div>
    </div>
  );
};

export default OperationsPage;