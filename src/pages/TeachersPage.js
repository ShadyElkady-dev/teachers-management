import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth, PERMISSIONS } from '../context/AuthContext';
import { PermissionGate } from '../components/Common/ProtectedRoute';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// Components
import TeacherCard from '../components/Teachers/TeacherCard';
import TeacherForm from '../components/Teachers/TeacherForm';
import OperationForm from '../components/Teachers/OperationForm';
import TeacherDetails from '../components/Teachers/TeacherDetails';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';

// Utils
import { searchInText, formatCurrency, isSmallScreen } from '../utils/helpers';
import { MESSAGES } from '../utils/constants';

const TeachersPage = () => {
  const { state, teacherActions, operationActions, calculateTeacherDebt } = useAppContext();
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // حالات المكونات
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingOperation, setEditingOperation] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [isMobile, setIsMobile] = useState(isSmallScreen());

  // مراقبة تغيير حجم الشاشة
 useEffect(() => {
  const handleResize = () => {
    const small = isSmallScreen();
    setIsMobile(small);
    setViewMode(small ? 'cards' : 'list');
  };

  handleResize(); // شغلها أول مرة عند التحميل
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  // معالجة معاملات الـ URL
  useEffect(() => {
    const action = searchParams.get('action');
    const teacherId = searchParams.get('teacher');
    
    if (action === 'add') {
      setShowTeacherForm(true);
      setEditingTeacher(null);
    } else if (action === 'operation' && teacherId) {
      const teacher = state.teachers.find(t => t.id === teacherId);
      setSelectedTeacher(teacher);
      setShowOperationForm(true);
    }
  }, [searchParams, state.teachers]);

  // إعداد قائمة المدرسين مع حساب المديونيات
  const teachersWithData = state.teachers.map(teacher => {
    const operations = state.operations.filter(op => op.teacherId === teacher.id);
    const payments = state.payments.filter(payment => payment.teacherId === teacher.id);
    const debt = calculateTeacherDebt(teacher.id);
    const lastOperation = operations.length > 0 
      ? operations.sort((a, b) => b.operationDate?.toDate() - a.operationDate?.toDate())[0]
      : null;
    const lastPayment = payments.length > 0 
      ? payments.sort((a, b) => b.paymentDate?.toDate() - a.paymentDate?.toDate())[0]
      : null;

    return {
      ...teacher,
      debt,
      totalOperations: operations.reduce((sum, op) => sum + (op.amount || 0), 0),
      totalPayments: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      operationsCount: operations.length,
      paymentsCount: payments.length,
      lastOperation,
      lastPayment
    };
  });

  // تصفية المدرسين
  const filteredTeachers = teachersWithData.filter(teacher => {
    if (!searchTerm.trim()) return true;
    
    return searchInText(teacher.name, searchTerm) ||
           searchInText(teacher.phone, searchTerm) ||
           searchInText(teacher.school, searchTerm) ||
           searchInText(teacher.email, searchTerm);
  });

  // حساب الإحصائيات
  const statistics = {
    totalTeachers: teachersWithData.length,
    activeTeachers: teachersWithData.filter(t => t.operationsCount > 0).length,
    teachersWithDebts: hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) 
      ? teachersWithData.filter(t => t.debt > 0).length 
      : '---',
    totalOperations: state.operations.length,
    averageOperations: teachersWithData.length > 0 
      ? Math.round(state.operations.length / teachersWithData.length)
      : 0
  };

  // وظائف التحكم في المدرسين
  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setShowTeacherForm(true);
    setSearchParams({});
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setShowTeacherForm(true);
  };

  const handleDeleteTeacher = async (teacher) => {
    if (window.confirm(MESSAGES.CONFIRM.DELETE_TEACHER)) {
      try {
        await teacherActions.deleteTeacher(teacher.id);
        toast.success(MESSAGES.SUCCESS.TEACHER_DELETED);
        if (selectedTeacher?.id === teacher.id) {
          setSelectedTeacher(null);
        }
      } catch (error) {
        toast.error(error.message || MESSAGES.ERROR.GENERAL);
      }
    }
  };

  const handleSaveTeacher = async (teacherData) => {
    try {
      if (editingTeacher) {
        await teacherActions.updateTeacher(editingTeacher.id, teacherData);
        toast.success(MESSAGES.SUCCESS.TEACHER_UPDATED);
      } else {
        await teacherActions.addTeacher(teacherData);
        toast.success(MESSAGES.SUCCESS.TEACHER_ADDED);
      }
      
      setShowTeacherForm(false);
      setEditingTeacher(null);
    } catch (error) {
      toast.error(error.message || MESSAGES.ERROR.GENERAL);
    }
  };

  // وظائف العمليات
  const handleAddOperation = (teacher) => {
    setSelectedTeacher(teacher);
    setEditingOperation(null);
    setShowOperationForm(true);
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

  // عرض تفاصيل المدرس
  const handleViewDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setShowTeacherDetails(true);
  };

  // إغلاق النوافذ
  const handleCloseModals = () => {
    setShowTeacherForm(false);
    setShowOperationForm(false);
    setShowTeacherDetails(false);
    setEditingTeacher(null);
    setEditingOperation(null);
    setSelectedTeacher(null);
  };

  if (state.loading.teachers) {
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
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">👨‍🏫 إدارة المدرسين</h1>
              <p className="text-gray-600 text-lg">
                عرض وإدارة المدرسين وتسجيل عملياتهم
              </p>
            </div>
            
            <PermissionGate permission={PERMISSIONS.ADD_TEACHER}>
              <button
                onClick={handleAddTeacher}
                className="w-full md:w-auto mx-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                <span className="text-2xl ml-2">👨‍🏫</span>
                إضافة مدرس جديد
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">إجمالي المدرسين</div>
                <div className="text-3xl font-bold">{statistics.totalTeachers}</div>
              </div>
              <div className="text-4xl opacity-80">👥</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">المدرسين النشطين</div>
                <div className="text-3xl font-bold">{statistics.activeTeachers}</div>
              </div>
              <div className="text-4xl opacity-80">✅</div>
            </div>
          </div>
          
          <PermissionGate 
            permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
            fallback={
              <div className="bg-gradient-to-br from-gray-400 to-gray-500 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium opacity-90">لديهم ديون</div>
                    <div className="text-3xl font-bold">---</div>
                  </div>
                  <div className="text-4xl opacity-80">🔒</div>
                </div>
              </div>
            }
          >
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90">لديهم ديون</div>
                  <div className="text-3xl font-bold">{statistics.teachersWithDebts}</div>
                </div>
                <div className="text-4xl opacity-80">⚠️</div>
              </div>
            </div>
          </PermissionGate>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90">متوسط العمليات</div>
                <div className="text-3xl font-bold">{statistics.averageOperations}</div>
              </div>
              <div className="text-4xl opacity-80">📊</div>
            </div>
          </div>
        </div>

        {/* شريط البحث */}
        <div className="mb-6">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="🔍 البحث في المدرسين (الاسم، الهاتف، المدرسة...)"
            className="text-lg"
          />
        </div>

        {/* عرض النتائج */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📋 قائمة المدرسين ({filteredTeachers.length})
            </h2>
            
            {!isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">عرض:</span>
                <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'cards' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ⊞ بطاقات
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 text-sm font-medium border-r-2 border-gray-300 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ☰ قائمة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* قائمة المدرسين */}
        <div className="mb-8">
          {filteredTeachers.length === 0 && searchTerm ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد نتائج</div>
              <div className="text-gray-500 text-lg">
                لم يتم العثور على مدرسين مطابقين لكلمة البحث "{searchTerm}"
              </div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا يوجد مدرسين</div>
              <div className="text-gray-500 text-lg mb-6">
                ابدأ بإضافة مدرس جديد لبدء استخدام النظام
              </div>
              <PermissionGate permission={PERMISSIONS.ADD_TEACHER}>
                <button
                  onClick={handleAddTeacher}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                >
                  <span className="text-2xl ml-2">➕</span>
                  إضافة مدرس جديد
                </button>
              </PermissionGate>
            </div>
          ) : viewMode === 'cards' || isMobile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTeachers.map(teacher => (
                <TeacherCardMobile
                  key={teacher.id}
                  teacher={teacher}
                  onEdit={handleEditTeacher}
                  onDelete={handleDeleteTeacher}
                  onAddOperation={handleAddOperation}
                  onViewDetails={handleViewDetails}
                  hasPermission={hasPermission}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المدرس</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">العمليات</th>
                      <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">المديونية</th>
                      </PermissionGate>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTeachers.map(teacher => (
                      <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ml-3 shadow-lg">
                              <span className="text-white font-bold">
                                {teacher.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{teacher.name}</div>
                              <div className="text-sm text-gray-600">📞 {teacher.phone}</div>
                              {teacher.school && (
                                <div className="text-xs text-gray-500">🏫 {teacher.school}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <div className="bg-blue-100 rounded-full px-3 py-1 inline-block">
                            <div className="text-sm font-bold text-blue-800">{teacher.operationsCount}</div>
                            <div className="text-xs text-blue-600">عملية</div>
                          </div>
                        </td>
                        
                        <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                          <td className="px-6 py-4 text-center">
                            <div className={`rounded-full px-3 py-1 inline-block ${
                              teacher.debt > 0 ? 'bg-red-100' : 
                              teacher.debt === 0 ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                              <div className={`text-sm font-bold ${
                                teacher.debt > 0 ? 'text-red-800' :
                                teacher.debt === 0 ? 'text-green-800' : 'text-blue-800'
                              }`}>
                                {formatCurrency(Math.abs(teacher.debt))}
                              </div>
                              <div className={`text-xs ${
                                teacher.debt > 0 ? 'text-red-600' :
                                teacher.debt === 0 ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {teacher.debt > 0 ? 'دين' :
                                 teacher.debt === 0 ? 'مسدد' : 'زائد'}
                              </div>
                            </div>
                          </td>
                        </PermissionGate>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
                              <button
                                onClick={() => handleAddOperation(teacher)}
                                className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded-lg transition-colors"
                                title="إضافة عملية"
                              >
                                ➕
                              </button>
                            </PermissionGate>
                            
                            <button
                              onClick={() => handleViewDetails(teacher)}
                              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              👁️
                            </button>
                            
                            <PermissionGate permission={PERMISSIONS.EDIT_TEACHER}>
                              <button
                                onClick={() => handleEditTeacher(teacher)}
                                className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-lg transition-colors"
                                title="تعديل"
                              >
                                ✏️
                              </button>
                            </PermissionGate>
                            
                            <PermissionGate permission={PERMISSIONS.DELETE_TEACHER}>
                              <button
                                onClick={() => handleDeleteTeacher(teacher)}
                                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg transition-colors"
                                title="حذف"
                              >
                                🗑️
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* النوافذ المنبثقة */}
        
        {/* نافذة إضافة/تعديل مدرس */}
        <Modal
          isOpen={showTeacherForm}
          onClose={handleCloseModals}
          title={editingTeacher ? '✏️ تعديل بيانات المدرس' : '➕ إضافة مدرس جديد'}
          size="medium"
        >
          <TeacherForm
            teacher={editingTeacher}
            onSave={handleSaveTeacher}
            onCancel={handleCloseModals}
            loading={state.loading.teachers}
          />
        </Modal>

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
  teachers={state.teachers} // إضافة هذا السطر
  onSave={handleSaveOperation}
  onCancel={handleCloseModals}
  loading={state.loading.operations}
/>
        </Modal>

        {/* نافذة تفاصيل المدرس */}
        <Modal
          isOpen={showTeacherDetails}
          onClose={handleCloseModals}
          title={`📊 تفاصيل حساب - ${selectedTeacher?.name}`}
          size="7xl"
        >
          <TeacherDetails
            teacher={selectedTeacher}
            onAddOperation={handleAddOperation}
            onEditOperation={handleEditOperation}
            onDeleteOperation={handleDeleteOperation}
          />
        </Modal>
      </div>
    </div>
  );
};

// مكون بطاقة المدرس المحسنة للهواتف المحمولة
const TeacherCardMobile = ({ 
  teacher, 
  onEdit, 
  onDelete, 
  onAddOperation, 
  onViewDetails,
  hasPermission
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = () => {
    if (teacher.debt > 0) return 'from-red-500 to-red-600';
    if (teacher.debt === 0) return 'from-green-500 to-green-600';
    return 'from-blue-500 to-blue-600';
  };

  const getStatusIcon = () => {
    if (teacher.debt > 0) return '⚠️';
    if (teacher.debt === 0) return '✅';
    return '💰';
  };
  
  const handleMenuClick = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'edit':
        onEdit(teacher);
        break;
      case 'delete':
        onDelete(teacher);
        break;
      case 'addOperation':
        onAddOperation(teacher);
        break;
      case 'viewDetails':
        onViewDetails(teacher);
        break;
    }
  };

  return (
<div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-visible border-2 border-gray-100">
      
      {/* رأس البطاقة مع الخلفية المتدرجة */}
      <div className={`bg-gradient-to-r ${getStatusColor()} p-6 text-white relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {teacher.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div>
              <h3 className="font-bold text-xl leading-tight mb-1">
                {teacher.name}
              </h3>
              <p className="text-sm opacity-90 mb-1">
                📞 {teacher.phone}
              </p>
              {teacher.school && (
                <p className="text-xs opacity-80">
                  🏫 {teacher.school}
                </p>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-1">{getStatusIcon()}</div>
            {hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
              <div className="text-sm font-bold">
                {formatCurrency(Math.abs(teacher.debt))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* محتوى البطاقة */}
      <div className="p-6">
        
        {/* الإحصائيات */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{teacher.operationsCount}</div>
            <div className="text-sm text-blue-600 font-medium">عمليات</div>
            {hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
              <div className="text-xs text-blue-500 mt-1">
                {formatCurrency(teacher.totalOperations)}
              </div>
            )}
          </div>
          
          {hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && (
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-700">{teacher.paymentsCount}</div>
              <div className="text-sm text-green-600 font-medium">دفعات</div>
              <div className="text-xs text-green-500 mt-1">
                {formatCurrency(teacher.totalPayments)}
              </div>
            </div>
          )}
        </div>

        {/* معلومات إضافية */}
        {(teacher.email || teacher.address) && (
          <div className="mb-6 space-y-2">
            {teacher.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📧</span>
                <span className="truncate">{teacher.email}</span>
              </div>
            )}
            {teacher.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📍</span>
                <span className="truncate">{teacher.address}</span>
              </div>
            )}
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-3">
          <button
            onClick={() => onAddOperation(teacher)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <span className="text-lg ml-1">➕</span>
            إضافة عملية
          </button>

<button
  onClick={() => onViewDetails(teacher)}
  className="w-12 h-12 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-xl transition-all duration-200"
  title="عرض التفاصيل"
>
  👁️
</button>
          {/* قائمة الخيارات */}
          <div className="relative">
           <button
  onClick={() => setShowMenu(!showMenu)}
  className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-200"
  title="المزيد"
>
  ⋮
</button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                
                <div className="absolute left-0 mt-2 w-48 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-20">
                  <button
                    onClick={() => handleMenuClick('edit')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-blue-50 flex items-center gap-3 font-medium text-blue-700 rounded-t-xl transition-colors"
                  >
                    <span className="text-lg">✏️</span>
                    تعديل البيانات
                  </button>
                  
                  <button
                    onClick={() => handleMenuClick('viewDetails')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 font-medium text-gray-700 border-t border-gray-200 transition-colors"
                  >
                    <span className="text-lg">📊</span>
                    التفاصيل الكاملة
                  </button>
                  
                  <button
                    onClick={() => handleMenuClick('addOperation')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-green-50 flex items-center gap-3 font-medium text-green-700 border-t border-gray-200 transition-colors"
                  >
                    <span className="text-lg">➕</span>
                    عملية جديدة
                  </button>
                  
                  <div className="border-t border-gray-200"></div>
                  
                  <button
                    onClick={() => handleMenuClick('delete')}
                    className="w-full text-right px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 font-medium rounded-b-xl transition-colors"
                  >
                    <span className="text-lg">🗑️</span>
                    حذف المدرس
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* مؤشرات حالة */}
      {hasPermission(PERMISSIONS.VIEW_FINANCIAL_DATA) && teacher.debt > 1000 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
          مديونية عالية
        </div>
      )}
    </div>
  );
};

export default TeachersPage;