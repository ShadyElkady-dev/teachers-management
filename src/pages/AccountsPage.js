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
import { searchInText, formatCurrency, isSmallScreen } from '../utils/helpers';
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
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
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
    if (action === 'payment') {
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
      const matchesSearch = !searchTerm.trim() || 
        searchInText(teacher.name, searchTerm) ||
        searchInText(teacher.phone, searchTerm) ||
        searchInText(teacher.school, searchTerm);

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
      : 0,
    paidTeachers: teachersWithDebts.filter(t => t.debt <= 0).length
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

  // ========== بداية التعديل الرئيسي ==========
  const handleSavePayment = async (paymentData) => {
    try {
      if (editingPayment) {
        await paymentActions.updatePayment(editingPayment.id, paymentData);
        toast.success(MESSAGES.SUCCESS.PAYMENT_UPDATED);
      } else {
        // تم التعديل هنا: نرسل paymentData مباشرة
        await paymentActions.addPayment(paymentData);
        toast.success(MESSAGES.SUCCESS.PAYMENT_ADDED);
      }
      
      setShowPaymentForm(false);
      setEditingPayment(null);
      setSelectedTeacher(null);
    } catch (error) {
      toast.error(error.message || MESSAGES.ERROR.GENERAL);
    }
  };
  // ========== نهاية التعديل الرئيسي ==========

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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* رأس الصفحة */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">💰 إدارة الحسابات</h1>
            <p className="text-gray-600 text-lg mb-6">
              متابعة المدفوعات والديون للمدرسين
            </p>
            
            <button
              onClick={() => handleAddPayment()}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
            >
              <span className="text-2xl ml-2">💳</span>
              تسجيل دفعة جديدة
            </button>
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium opacity-90">إجمالي المدرسين</div>
                    <div className="text-3xl font-bold">{statistics.totalTeachers}</div>
                    <div className="text-xs opacity-80">في النظام</div>
                </div>
                <div className="text-4xl opacity-80">👥</div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium opacity-90">لديهم ديون</div>
                    <div className="text-3xl font-bold">{statistics.teachersWithDebts}</div>
                    <div className="text-xs opacity-80">مدرس</div>
                </div>
                <div className="text-4xl opacity-80">⚠️</div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium opacity-90">إجمالي الديون</div>
                    <div className="text-lg font-bold">{formatCurrency(statistics.totalDebts)}</div>
                    <div className="text-xs opacity-80">مستحق الدفع</div>
                </div>
                <div className="text-4xl opacity-80">💸</div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium opacity-90">إجمالي المدفوعات</div>
                    <div className="text-lg font-bold">{formatCurrency(statistics.totalPayments)}</div>
                    <div className="text-xs opacity-80">تم تحصيلها</div>
                </div>
                <div className="text-4xl opacity-80">✅</div>
                </div>
            </div>
        </div>

        {/* أدوات التصفية والبحث */}
        <div className="mb-6 space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="🔍 البحث في الحسابات (الاسم، الهاتف، المدرسة...)"
            className="text-lg"
          />

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-gray-900">🔍 البحث والتصفية المتقدمة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عرض:</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="all">الكل ({teachersWithDebts.length})</option>
                  <option value="debts">لديهم ديون ({statistics.teachersWithDebts})</option>
                  <option value="paid">مسددين ({statistics.paidTeachers})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ترتيب حسب:</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base font-medium bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="debt">المديونية</option>
                  <option value="name">الاسم</option>
                  <option value="lastPayment">آخر دفعة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الاتجاه:</label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">{sortOrder === 'asc' ? '📈' : '📉'}</span>
                  {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setSortBy('name');
                    setSortOrder('asc');
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all duration-200"
                >
                  مسح جميع الفلاتر
                </button>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-xl">
                <span className="text-sm font-bold text-blue-800">
                  عرض {filteredTeachers.length} حساب
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* قائمة الحسابات */}
        <div className="mb-6">
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">💰</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">لا توجد حسابات</div>
              <div className="text-gray-500 text-lg">
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

        {/* نافذة إضافة/تعديل دفعة */}
        <Modal
          isOpen={showPaymentForm}
          onClose={handleCloseModals}
          title={editingPayment ? '✏️ تعديل الدفعة' : `💳 تسجيل دفعة جديدة${selectedTeacher ? ` - ${selectedTeacher.name}` : ''}`}
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
          title={`📊 تفاصيل حساب - ${selectedTeacher?.name}`}
          size="7xl"
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
    </div>
  );
};

export default AccountsPage;