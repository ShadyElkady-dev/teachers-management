import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// Components
import AccountsList from '../components/Accounts/AccountsList';
import PaymentForm from '../components/Accounts/PaymentForm';
import AccountDetails from '../components/Accounts/AccountDetails';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';

// Utils
import { searchInText, formatCurrency } from '../utils/helpers';
import { MESSAGES } from '../utils/constants';

const AccountsPage = () => {
  const { state, paymentActions, calculateTeacherDebt } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // حالات المكونات
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, debts, paid
  const [sortBy, setSortBy] = useState('debt'); // debt, name, lastPayment
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  // معالجة معاملات الـ URL
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'payment') {
      // فتح نافذة الدفع السريع
      setShowPaymentForm(true);
    }
  }, [searchParams]);

  // إعداد قائمة المدرسين مع حساب المديونيات
  const teachersWithDebts = state.teachers.map(teacher => {
    const debt = calculateTeacherDebt(teacher.id);
    const operations = state.operations.filter(op => op.teacherId === teacher.id);
    const payments = state.payments.filter(payment => payment.teacherId === teacher.id);
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
      lastPayment,
      status: debt > 0 ? 'debt' : debt === 0 ? 'clear' : 'overpaid'
    };
  });

  // تصفية المدرسين
  const filteredTeachers = teachersWithDebts
    .filter(teacher => {
      // فلتر البحث
      const matchesSearch = !searchTerm.trim() || 
        searchInText(teacher.name, searchTerm) ||
        searchInText(teacher.phone, searchTerm) ||
        searchInText(teacher.school, searchTerm);

      // فلتر النوع
      const matchesFilter = filterType === 'all' || 
        (filterType === 'debts' && teacher.debt > 0) ||
        (filterType === 'paid' && teacher.debt <= 0);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'debt':
          comparison = a.debt - b.debt;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ar');
          break;
        case 'lastPayment':
          const aDate = a.lastPayment?.paymentDate?.toDate() || new Date(0);
          const bDate = b.lastPayment?.paymentDate?.toDate() || new Date(0);
          comparison = aDate - bDate;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // حساب الإحصائيات
  const statistics = {
    totalTeachers: teachersWithDebts.length,
    teachersWithDebts: teachersWithDebts.filter(t => t.debt > 0).length,
    totalDebts: teachersWithDebts.reduce((sum, t) => sum + Math.max(0, t.debt), 0),
    totalPayments: teachersWithDebts.reduce((sum, t) => sum + t.totalPayments, 0),
    averageDebt: teachersWithDebts.length > 0 
      ? teachersWithDebts.reduce((sum, t) => sum + Math.max(0, t.debt), 0) / teachersWithDebts.length 
      : 0
  };

  // وظائف التحكم في المدفوعات
  const handleAddPayment = (teacher = null) => {
    setSelectedTeacher(teacher);
    setEditingPayment(null);
    setShowPaymentForm(true);
    setSearchParams({});
  };

  const handleEditPayment = (payment) => {
    const teacher = state.teachers.find(t => t.id === payment.teacherId);
    setSelectedTeacher(teacher);
    setEditingPayment(payment);
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm(MESSAGES.CONFIRM.DELETE_PAYMENT)) {
      try {
        await paymentActions.deletePayment(payment.id);
        toast.success(MESSAGES.SUCCESS.PAYMENT_DELETED);
      } catch (error) {
        toast.error(error.message || MESSAGES.ERROR.GENERAL);
      }
    }
  };

  const handleSavePayment = async (paymentData) => {
    try {
      if (editingPayment) {
        await paymentActions.updatePayment(editingPayment.id, paymentData);
        toast.success(MESSAGES.SUCCESS.PAYMENT_UPDATED);
      } else {
        await paymentActions.addPayment(selectedTeacher?.id, paymentData);
        toast.success(MESSAGES.SUCCESS.PAYMENT_ADDED);
      }
      
      setShowPaymentForm(false);
      setEditingPayment(null);
      setSelectedTeacher(null);
    } catch (error) {
      toast.error(error.message || MESSAGES.ERROR.GENERAL);
    }
  };

  // عرض تفاصيل الحساب
  const handleViewAccountDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setShowAccountDetails(true);
  };

  // إغلاق النوافذ
  const handleCloseModals = () => {
    setShowPaymentForm(false);
    setShowAccountDetails(false);
    setEditingPayment(null);
    setSelectedTeacher(null);
  };

  if (state.loading.teachers || state.loading.payments) {
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
            <h1 className="text-2xl font-bold text-gray-900">إدارة الحسابات</h1>
            <p className="text-gray-600 mt-1">
              متابعة المدفوعات والديون
            </p>
          </div>
          
          <button
            onClick={() => handleAddPayment()}
            className="btn-mobile btn-primary"
          >
            <span className="text-lg">💳</span>
            تسجيل دفعة جديدة
          </button>
        </div>
      </div>

      {/* الإحصائيات */}
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
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-600 font-medium">لديهم ديون</div>
              <div className="text-2xl font-bold text-red-900">{statistics.teachersWithDebts}</div>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-yellow-600 font-medium">إجمالي الديون</div>
              <div className="text-lg font-bold text-yellow-900">{formatCurrency(statistics.totalDebts)}</div>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-600 font-medium">إجمالي المدفوعات</div>
              <div className="text-lg font-bold text-green-900">{formatCurrency(statistics.totalPayments)}</div>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* أدوات التصفية والبحث */}
      <div className="mb-6 space-y-4">
        
        {/* شريط البحث */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="البحث في الحسابات (الاسم، الهاتف، المدرسة...)"
        />

        {/* الفلاتر */}
        <div className="flex flex-wrap gap-4 items-center">
          
          {/* فلتر النوع */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">عرض:</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input text-sm py-2"
            >
              <option value="all">الكل ({teachersWithDebts.length})</option>
              <option value="debts">لديهم ديون ({statistics.teachersWithDebts})</option>
              <option value="paid">مسددين ({statistics.totalTeachers - statistics.teachersWithDebts})</option>
            </select>
          </div>

          {/* الترتيب */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">ترتيب حسب:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input text-sm py-2"
            >
              <option value="debt">المديونية</option>
              <option value="name">الاسم</option>
              <option value="lastPayment">آخر دفعة</option>
            </select>
          </div>

          {/* اتجاه الترتيب */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary btn-sm"
          >
            {sortOrder === 'asc' ? '📈' : '📉'}
            {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
          </button>
        </div>
      </div>

      {/* قائمة الحسابات */}
      <div className="mb-6">
        {filteredTeachers.length === 0 && searchTerm ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">لا توجد نتائج</div>
            <div className="empty-description">
              لم يتم العثور على حسابات مطابقة لكلمة البحث "{searchTerm}"
            </div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <div className="empty-title">لا توجد حسابات</div>
            <div className="empty-description">
              لا توجد حسابات مطابقة للفلتر المحدد
            </div>
          </div>
        ) : (
          <AccountsList
            teachers={filteredTeachers}
            onAddPayment={handleAddPayment}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
            onViewDetails={handleViewAccountDetails}
          />
        )}
      </div>

      {/* النوافذ المنبثقة */}
      
      {/* نافذة إضافة/تعديل دفعة */}
      <Modal
        isOpen={showPaymentForm}
        onClose={handleCloseModals}
        title={editingPayment ? 'تعديل الدفعة' : `تسجيل دفعة جديدة${selectedTeacher ? ` - ${selectedTeacher.name}` : ''}`}
        size="medium"
      >
        <PaymentForm
          payment={editingPayment}
          teacher={selectedTeacher}
          teachers={state.teachers}
          onSave={handleSavePayment}
          onCancel={handleCloseModals}
          loading={state.loading.payments}
        />
      </Modal>

      {/* نافذة تفاصيل الحساب */}
      <Modal
        isOpen={showAccountDetails}
        onClose={handleCloseModals}
        title={`تفاصيل حساب - ${selectedTeacher?.name}`}
        size="xl"
      >
        <AccountDetails
          teacher={selectedTeacher}
          onAddPayment={() => {
            setShowAccountDetails(false);
            handleAddPayment(selectedTeacher);
          }}
          onEditPayment={(payment) => {
            setShowAccountDetails(false);
            handleEditPayment(payment);
          }}
          onDeletePayment={handleDeletePayment}
        />
      </Modal>
    </div>
  );
};

export default AccountsPage;