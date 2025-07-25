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
  const [viewMode, setViewMode] = useState('list'); // cards, list
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
    <div className="section-mobile">
      
      {/* رأس الصفحة */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المدرسين</h1>
            <p className="text-gray-600 mt-1">
              عرض وإدارة المدرسين وتسجيل عملياتهم
            </p>
          </div>
          
          <PermissionGate permission={PERMISSIONS.ADD_TEACHER}>
            <button
              onClick={handleAddTeacher}
              className="btn-mobile btn-primary"
            >
              <span className="text-lg">👨‍🏫</span>
              إضافة مدرس جديد
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium">إجمالي المدرسين</div>
              <div className="text-2xl font-bold text-blue-900">{statistics.totalTeachers}</div>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-600 font-medium">المدرسين النشطين</div>
              <div className="text-2xl font-bold text-green-900">{statistics.activeTeachers}</div>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        
        <PermissionGate 
          permission={PERMISSIONS.VIEW_FINANCIAL_DATA}
          fallback={
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 font-medium">لديهم ديون</div>
                  <div className="text-2xl font-bold text-gray-400">---</div>
                </div>
                <div className="text-2xl">🔒</div>
              </div>
            </div>
          }
        >
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-600 font-medium">لديهم ديون</div>
                <div className="text-2xl font-bold text-red-900">{statistics.teachersWithDebts}</div>
              </div>
              <div className="text-2xl">⚠️</div>
            </div>
          </div>
        </PermissionGate>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-600 font-medium">متوسط العمليات</div>
              <div className="text-2xl font-bold text-purple-900">{statistics.averageOperations}</div>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والتحكم */}
      <div className="mb-6 space-y-4">
        
        {/* شريط البحث */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="البحث في المدرسين (الاسم، الهاتف، المدرسة...)"
        />

        {/* أدوات التحكم في العرض */}
        <div className="flex items-center justify-between">
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
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm border-r border-gray-300 ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title="عرض القائمة"
              >
                ☰ قائمة
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            عرض {filteredTeachers.length} مدرس
          </div>
        </div>
      </div>

      {/* قائمة المدرسين */}
      <div className="mb-6">
        {filteredTeachers.length === 0 && searchTerm ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">لا توجد نتائج</div>
            <div className="empty-description">
              لم يتم العثور على مدرسين مطابقين لكلمة البحث "{searchTerm}"
            </div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👨‍🏫</div>
            <div className="empty-title">لا يوجد مدرسين</div>
            <div className="empty-description">
              ابدأ بإضافة مدرس جديد لبدء استخدام النظام
            </div>
            <PermissionGate permission={PERMISSIONS.ADD_TEACHER}>
              <button
                onClick={handleAddTeacher}
                className="btn btn-primary mt-4"
              >
                إضافة مدرس جديد
              </button>
            </PermissionGate>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid-mobile">
            {filteredTeachers.map(teacher => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onEdit={handleEditTeacher}
                onDelete={handleDeleteTeacher}
                onAddOperation={handleAddOperation}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">المدرس</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">العمليات</th>
                    <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">المديونية</th>
                    </PermissionGate>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTeachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ml-3">
                            <span className="text-white font-bold text-sm">
                              {teacher.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                            <div className="text-sm text-gray-500">📞 {teacher.phone}</div>
                            {teacher.school && (
                              <div className="text-xs text-gray-400">🏫 {teacher.school}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-blue-600">{teacher.operationsCount}</div>
                        <div className="text-xs text-gray-500">عملية</div>
                      </td>
                      
                      <PermissionGate permission={PERMISSIONS.VIEW_FINANCIAL_DATA}>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className={`text-sm font-bold ${
                            teacher.debt > 0 ? 'text-red-600' :
                            teacher.debt === 0 ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {formatCurrency(Math.abs(teacher.debt))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {teacher.debt > 0 ? 'دين' :
                             teacher.debt === 0 ? 'مسدد' : 'زائد'}
                          </div>
                        </td>
                      </PermissionGate>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <PermissionGate permission={PERMISSIONS.ADD_OPERATION}>
                            <button
                              onClick={() => handleAddOperation(teacher)}
                              className="btn btn-primary btn-sm"
                              title="إضافة عملية"
                            >
                              ➕
                            </button>
                          </PermissionGate>
                          
                          <button
                            onClick={() => handleViewDetails(teacher)}
                            className="btn btn-secondary btn-sm"
                            title="عرض التفاصيل"
                          >
                            👁️
                          </button>
                          
                          <PermissionGate permission={PERMISSIONS.EDIT_TEACHER}>
                            <button
                              onClick={() => handleEditTeacher(teacher)}
                              className="btn btn-warning btn-sm"
                              title="تعديل"
                            >
                              ✏️
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
        title={editingTeacher ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}
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
        title={editingOperation ? 'تعديل العملية' : `إضافة عملية جديدة${selectedTeacher ? ` - ${selectedTeacher.name}` : ''}`}
        size="large"
      >
        <OperationForm
          operation={editingOperation}
          teacher={selectedTeacher}
          onSave={handleSaveOperation}
          onCancel={handleCloseModals}
          loading={state.loading.operations}
        />
      </Modal>

      {/* نافذة تفاصيل المدرس */}
      <Modal
        isOpen={showTeacherDetails}
        onClose={handleCloseModals}
        title={`تفاصيل حساب - ${selectedTeacher?.name}`}
        size="xl"
      >
        <TeacherDetails
          teacher={selectedTeacher}
          onAddOperation={handleAddOperation}
          onEditOperation={handleEditOperation}
          onDeleteOperation={handleDeleteOperation}
        />
      </Modal>
    </div>
  );
};

export default TeachersPage;