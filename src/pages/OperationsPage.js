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
  const [viewMode, setViewMode] = useState('cards'); // cards, table
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
    totalAmount: hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES) 
      ? filteredOperations.reduce((sum, operation) => sum + (operation.amount || 0), 0)
      : 0,
    averageAmount: hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES) && filteredOperations.length > 0
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
    const total = hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES) 
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

  const handleSaveOperation = async (operationData) => {
    try {
      if (editingOperation) {
        await operationActions.updateOperation(editingOperation.id, operationData);
        toast.success(MESSAGES.SUCCESS.OPERATION_UPDATED);
      } else {
        await operationActions.addOperation(selectedTeacher?.id, operationData);
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
    <div className="section-mobile">
      
      {/* رأس الصفحة */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة العمليات</h1>
            <p className="text-gray-600 mt-1">
              عرض وإدارة جميع العمليات المسجلة في النظام
            </p>
          </div>
          
          <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
            <button
              onClick={() => handleAddOperation()}
              className="btn-mobile btn-primary"
            >
              <span className="text-lg">➕</span>
              إضافة عملية جديدة
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium">إجمالي العمليات</div>
              <div className="text-2xl font-bold text-blue-900">{statistics.filteredOperations}</div>
              <div className="text-xs text-gray-500">من أصل {statistics.totalOperations}</div>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
        
        <PermissionGate 
          permission={PERMISSIONS.VIEW_OPERATION_PRICES}
          fallback={
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 font-medium">إجمالي المبالغ</div>
                  <div className="text-2xl font-bold text-gray-400">---</div>
                  <div className="text-xs text-gray-400">غير مصرح</div>
                </div>
                <div className="text-2xl">🔒</div>
              </div>
            </div>
          }
        >
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-600 font-medium">إجمالي المبالغ</div>
                <div className="text-2xl font-bold text-green-900">{formatCurrency(statistics.totalAmount)}</div>
                <div className="text-xs text-gray-500">متوسط: {formatCurrency(statistics.averageAmount)}</div>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </div>
        </PermissionGate>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-orange-600 font-medium">عمليات اليوم</div>
              <div className="text-2xl font-bold text-orange-900">{statistics.todayOperations}</div>
              <div className="text-xs text-gray-500">اليوم</div>
            </div>
            <div className="text-2xl">📅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-600 font-medium">أنواع العمليات</div>
              <div className="text-2xl font-bold text-purple-900">{operationsByType.length}</div>
              <div className="text-xs text-gray-500">نوع مختلف</div>
            </div>
            <div className="text-2xl">🏷️</div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والتصفية */}
      <div className="mb-6 space-y-4">
        
        {/* شريط البحث */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="البحث في العمليات (الوصف، المدرس، النوع...)"
        />

        {/* الفلاتر */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">البحث والتصفية</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* فلتر النوع */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية:</label>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">المدرس:</label>
              <select 
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="input text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">الفترة الزمنية:</label>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">ترتيب حسب:</label>
              <div className="flex gap-2">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input text-sm flex-1"
                >
                  <option value="date">التاريخ</option>
                  <option value="teacher">المدرس</option>
                  <option value="type">النوع</option>
                  {hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES) && (
                    <option value="amount">المبلغ</option>
                  )}
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="btn btn-secondary btn-sm px-3"
                  title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
                >
                  {sortOrder === 'asc' ? '📈' : '📉'}
                </button>
              </div>
            </div>
          </div>

          {/* أدوات التحكم */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">عرض:</span>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 text-sm ${
                    viewMode === 'cards' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  title="عرض البطاقات"
                >
                  ⊞ بطاقات
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-sm border-r border-gray-300 ${
                    viewMode === 'table' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  title="عرض الجدول"
                >
                  ☰ جدول
                </button>
              </div>
            </div>
            
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
                className="btn btn-secondary btn-sm"
              >
                مسح جميع الفلاتر
              </button>
              
              <span className="text-sm text-gray-600">
                عرض {filteredOperations.length} عملية
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* قائمة العمليات */}
      <div className="mb-6">
        {filteredOperations.length === 0 && searchTerm ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">لا توجد نتائج</div>
            <div className="empty-description">
              لم يتم العثور على عمليات مطابقة لكلمة البحث "{searchTerm}"
            </div>
          </div>
        ) : filteredOperations.length === 0 && (filterType !== 'all' || filterTeacher !== 'all' || dateFilter !== 'all') ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-title">لا توجد عمليات</div>
            <div className="empty-description">
              لا توجد عمليات مطابقة للفلاتر المحددة
            </div>
          </div>
        ) : filteredOperations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">لا توجد عمليات</div>
            <div className="empty-description">
              ابدأ بإضافة عملية جديدة لأحد المدرسين
            </div>
            <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
              <button
                onClick={() => handleAddOperation()}
                className="btn btn-primary mt-4"
              >
                إضافة عملية جديدة
              </button>
            </PermissionGate>
          </div>
        ) : viewMode === 'cards' ? (
          <OperationsCardsView 
            operations={filteredOperations}
            teachers={state.teachers}
            onEdit={handleEditOperation}
            onDelete={handleDeleteOperation}
            showPrices={hasPermission(PERMISSIONS.VIEW_OPERATION_PRICES)}
            canEdit={hasPermission(PERMISSIONS.EDIT_OPERATION)}
            canDelete={hasPermission(PERMISSIONS.DELETE_OPERATION)}
          />
        ) : (
          <OperationsTableView 
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
        title={editingOperation ? 'تعديل العملية' : `إضافة عملية جديدة${selectedTeacher ? ` - ${selectedTeacher.name}` : ''}`}
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
  );
};

// مكون عرض العمليات كبطاقات
const OperationsCardsView = ({ operations, teachers, onEdit, onDelete, showPrices, canEdit, canDelete }) => {
  return (
    <div className="grid-mobile">
      {operations.map(operation => (
        <OperationCard
          key={operation.id}
          operation={operation}
          teacher={teachers.find(t => t.id === operation.teacherId)}
          onEdit={onEdit}
          onDelete={onDelete}
          showPrices={showPrices}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
};

// مكون بطاقة العملية
const OperationCard = ({ operation, teacher, onEdit, onDelete, showPrices, canEdit, canDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const operationType = OPERATION_TYPES.find(type => type.value === operation.type);

  const handleMenuClick = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'edit':
        onEdit(operation);
        break;
      case 'delete':
        onDelete(operation);
        break;
    }
  };

  return (
    <div className="card-mobile border-l-4 border-blue-400 hover:shadow-lg transition-all duration-200">
      
      {/* رأس البطاقة */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* أيقونة نوع العملية */}
          <div className={`w-12 h-12 ${operationType?.color || 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
            <span className="text-2xl">
              {operation.type === 'printing' ? '🖨️' :
               operation.type === 'photocopying' ? '📄' :
               operation.type === 'lamination' ? '🛡️' :
               operation.type === 'binding' ? '📚' :
               operation.type === 'design' ? '🎨' :
               operation.type === 'scanning' ? '📷' :
               operation.type === 'cutting' ? '✂️' : '📝'}
            </span>
          </div>
          
          {/* معلومات أساسية */}
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {operationType?.label || operation.type}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              👨‍🏫 {teacher?.name || 'مدرس غير معروف'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📅 {formatDate(operation.operationDate)} • {timeAgo(operation.operationDate)}
            </p>
          </div>
        </div>

        {/* المبلغ */}
        {showPrices && (
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(operation.amount)}
            </div>
            <div className="text-xs text-gray-500">
              مبلغ العملية
            </div>
          </div>
        )}
      </div>

      {/* وصف العملية */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {operation.description}
        </p>
      </div>

      {/* تفاصيل إضافية */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge primary">
          الكمية: {operation.quantity || 1}
        </span>
        {operation.paperSize && (
          <span className="badge secondary">
            📄 {operation.paperSize}
          </span>
        )}
        {operation.printType && (
          <span className="badge secondary">
            🖨️ {operation.printType}
          </span>
        )}
        {showPrices && operation.unitPrice && (
          <span className="badge success">
            💰 {formatCurrency(operation.unitPrice)}/وحدة
          </span>
        )}
      </div>

      {/* الملاحظات */}
      {operation.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">ملاحظات: </span>
            {operation.notes}
          </div>
        </div>
      )}

      {/* أزرار التحكم */}
      {(canEdit || canDelete) && (
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => onEdit(operation)}
              className="flex-1 btn btn-secondary btn-sm"
            >
              <span className="ml-1">✏️</span>
              تعديل
            </button>
          )}

          {/* قائمة الخيارات */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn btn-secondary btn-sm px-3"
              title="المزيد"
            >
              ⋮
            </button>

            {showMenu && (
              <>
                {/* خلفية لإغلاق القائمة */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                
                {/* القائمة المنسدلة */}
                <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {canEdit && (
                    <button
                      onClick={() => handleMenuClick('edit')}
                      className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                    >
                      <span>✏️</span>
                      تعديل
                    </button>
                  )}
                  
                  {canEdit && canDelete && (
                    <div className="border-t border-gray-200"></div>
                  )}
                  
                  {canDelete && (
                    <button
                      onClick={() => handleMenuClick('delete')}
                      className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-lg"
                    >
                      <span>🗑️</span>
                      حذف
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// مكون عرض العمليات كجدول
const OperationsTableView = ({ operations, teachers, onEdit, onDelete, showPrices, canEdit, canDelete }) => {
  const [showActions, setShowActions] = useState({});

  const toggleActions = (operationId) => {
    setShowActions(prev => ({
      ...prev,
      [operationId]: !prev[operationId]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المدرس</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">النوع</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الوصف</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">الكمية</th>
              {showPrices && (
                <>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">سعر الوحدة</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">المبلغ الإجمالي</th>
                </>
              )}
              {(canEdit || canDelete) && (
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {operations.map(operation => {
              const teacher = teachers.find(t => t.id === operation.teacherId);
              const operationType = OPERATION_TYPES.find(t => t.value === operation.type);
              
              return (
                <tr key={operation.id} className="hover:bg-gray-50 transition-colors">
                  {/* التاريخ */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(operation.operationDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {timeAgo(operation.operationDate)}
                    </div>
                  </td>
                  
                  {/* المدرس */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-2">
                        <span className="text-blue-600 font-bold text-xs">
                          {teacher?.name?.charAt(0) || '؟'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {teacher?.name || 'غير معروف'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {teacher?.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* النوع */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ml-2 ${
                        operationType?.color?.replace('bg-', 'bg-') || 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {operationType?.label || operation.type}
                      </span>
                    </div>
                  </td>
                  
                  {/* الوصف */}
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-sm text-gray-900">
                      <div className="line-clamp-2" title={operation.description}>
                        {operation.description}
                      </div>
                    </div>
                    {operation.notes && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1" title={operation.notes}>
                        📝 {operation.notes}
                      </div>
                    )}
                  </td>
                  
                  {/* الكمية */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {operation.quantity || 1}
                    </span>
                  </td>
                  
                  {/* الأسعار - للأدمن فقط */}
                  {showPrices && (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(operation.unitPrice || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(operation.amount || 0)}
                        </span>
                      </td>
                    </>
                  )}
                  
                  {/* الإجراءات */}
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="relative">
                        <button
                          onClick={() => toggleActions(operation.id)}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                          title="المزيد"
                        >
                          <span className="text-lg">⋮</span>
                        </button>

                        {showActions[operation.id] && (
                          <>
                            {/* خلفية لإغلاق القائمة */}
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => toggleActions(operation.id)}
                            />
                            
                            {/* القائمة المنسدلة */}
                            <div className="absolute left-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    onEdit(operation);
                                    toggleActions(operation.id);
                                  }}
                                  className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                                >
                                  <span>✏️</span>
                                  تعديل العملية
                                </button>
                              )}
                              
                              {canEdit && canDelete && (
                                <div className="border-t border-gray-200"></div>
                              )}
                              
                              {canDelete && (
                                <button
                                  onClick={() => {
                                    onDelete(operation);
                                    toggleActions(operation.id);
                                  }}
                                  className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-lg"
                                >
                                  <span>🗑️</span>
                                  حذف العملية
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* معلومات الجدول */}
      {operations.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              عرض {operations.length} عملية
            </div>
            <PermissionGate permission={PERMISSIONS.VIEW_OPERATION_PRICES}>
              <div className="font-medium">
                الإجمالي: {formatCurrency(operations.reduce((sum, op) => sum + (op.amount || 0), 0))}
              </div>
            </PermissionGate>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsPage;