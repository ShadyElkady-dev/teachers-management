import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Components
import ReportBuilder from '../components/Reports/ReportBuilder';
import ReportPreview from '../components/Reports/ReportPreview';
import SavedReports from '../components/Reports/SavedReports';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';

// Utils
import { formatCurrency, formatDate, isSmallScreen } from '../utils/helpers';

const ReportsPage = () => {
  const { state, calculateTeacherDebt } = useAppContext();
  const { user, hasPermission } = useAuth();
  const [currentReport, setCurrentReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedReports, setSavedReports] = useState([]);

  // الإعدادات الافتراضية المبسطة
  const getDefaultConfig = () => ({
    type: 'teacher_detailed',
    title: 'تقرير مفصل للمدرسين',
    selectedTeachers: [],
    dateRange: {
      from: '',
      to: ''
    },
    // تحديد واضح لما يتم تضمينه
    includeOperations: true,
    includePayments: true,
    includeExpenses: false,  // المصروفات غير مفعلة افتراضياً
    includeFinancialSummary: true,
    includeStatistics: true,
    sortBy: 'name',
    filters: {
      expenseCategory: '',
      expensePaymentMethod: '',
      minAmount: '',
      maxAmount: '',
      hasDebts: false,
      hasOperations: false,
      onlyLargeExpenses: false
    },
    formatting: {
      pageSize: 'A4',
      orientation: 'portrait',
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      includeLogo: true,
      fontSize: 'medium',
      separatePages: true  // افتراضياً كل مدرس في صفحة منفصلة
    }
  });

  const [reportConfig, setReportConfig] = useState(getDefaultConfig);

  // تحميل التقارير المحفوظة
  useEffect(() => {
    try {
      const saved = localStorage.getItem('saved_reports');
      if (saved) {
        const parsedReports = JSON.parse(saved);
        setSavedReports(Array.isArray(parsedReports) ? parsedReports : []);
      }
    } catch (error) {
      console.error('Error loading saved reports:', error);
      setSavedReports([]);
    }
  }, []);

  // حفظ التقارير في Local Storage
  const saveReportsToStorage = useCallback((reports) => {
    try {
      localStorage.setItem('saved_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving reports:', error);
      toast.error('حدث خطأ في حفظ التقارير');
    }
  }, []);

  // تحديث إعدادات التقرير
  const updateReportConfig = useCallback((key, value) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // تحديث الفلاتر
  const updateFilters = useCallback((filterKey, value) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterKey]: value
      }
    }));
  }, []);

  // تحديث إعدادات التنسيق
  const updateFormatting = useCallback((formatKey, value) => {
    setReportConfig(prev => ({
      ...prev,
      formatting: {
        ...prev.formatting,
        [formatKey]: value
      }
    }));
  }, []);

  // تطبيق الفلاتر على البيانات - مبسط ومصحح
  const applyFilters = useCallback(() => {
    try {
      // التحقق من نوع التقرير أولاً
      const isExpenseOnlyReport = ['expenses_report', 'expenses_detailed'].includes(reportConfig.type);
      
      let filteredTeachers = [];
      let filteredOperations = [];
      let filteredPayments = [];
      let filteredExpenses = [];

      // للتقارير العادية
      if (!isExpenseOnlyReport) {
        // فلترة المدرسين المختارين
        filteredTeachers = state.teachers.filter(teacher => 
          reportConfig.selectedTeachers.includes(teacher.id)
        );

        // فلترة العمليات
        filteredOperations = state.operations.filter(operation => {
          if (!reportConfig.selectedTeachers.includes(operation.teacherId)) return false;

          // تأكد من وجود البيانات الأساسية
          if (!operation.description && !operation.type) return false;

          // فلترة حسب التاريخ
          if (reportConfig.dateRange.from) {
            const operationDate = operation.operationDate?.toDate ? 
              operation.operationDate.toDate() : 
              new Date(operation.operationDate);
            const fromDate = new Date(reportConfig.dateRange.from);
            if (operationDate < fromDate) return false;
          }
          
          if (reportConfig.dateRange.to) {
            const operationDate = operation.operationDate?.toDate ? 
              operation.operationDate.toDate() : 
              new Date(operation.operationDate);
            const toDate = new Date(reportConfig.dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if (operationDate > toDate) return false;
          }

          // فلترة حسب المبلغ
          if (reportConfig.filters.minAmount && operation.amount < parseFloat(reportConfig.filters.minAmount)) return false;
          if (reportConfig.filters.maxAmount && operation.amount > parseFloat(reportConfig.filters.maxAmount)) return false;

          return true;
        });

        // فلترة المدفوعات
        filteredPayments = state.payments.filter(payment => {
          if (!reportConfig.selectedTeachers.includes(payment.teacherId)) return false;

          // فلترة حسب التاريخ
          if (reportConfig.dateRange.from) {
            const paymentDate = payment.paymentDate?.toDate ? 
              payment.paymentDate.toDate() : 
              new Date(payment.paymentDate);
            const fromDate = new Date(reportConfig.dateRange.from);
            if (paymentDate < fromDate) return false;
          }
          
          if (reportConfig.dateRange.to) {
            const paymentDate = payment.paymentDate?.toDate ? 
              payment.paymentDate.toDate() : 
              new Date(payment.paymentDate);
            const toDate = new Date(reportConfig.dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if (paymentDate > toDate) return false;
          }

          return true;
        });

        // تطبيق فلاتر إضافية على المدرسين
        if (reportConfig.filters.hasDebts) {
          filteredTeachers = filteredTeachers.filter(teacher => {
            const debt = calculateTeacherDebt(teacher.id);
            return debt > 0;
          });
        }

        if (reportConfig.filters.hasOperations) {
          filteredTeachers = filteredTeachers.filter(teacher => {
            return filteredOperations.some(op => op.teacherId === teacher.id);
          });
        }
      }

      // فلترة المصروفات فقط إذا كان مطلوب أو نوع التقرير مصروفات
      if (reportConfig.includeExpenses || isExpenseOnlyReport) {
        if (state.expenses && Array.isArray(state.expenses)) {
          filteredExpenses = state.expenses.filter(expense => {
            // فلترة حسب التاريخ
            if (reportConfig.dateRange.from) {
              const expenseDate = expense.expenseDate?.toDate ? 
                expense.expenseDate.toDate() : 
                new Date(expense.expenseDate);
              const fromDate = new Date(reportConfig.dateRange.from);
              if (expenseDate < fromDate) return false;
            }
            
            if (reportConfig.dateRange.to) {
              const expenseDate = expense.expenseDate?.toDate ? 
                expense.expenseDate.toDate() : 
                new Date(expense.expenseDate);
              const toDate = new Date(reportConfig.dateRange.to);
              toDate.setHours(23, 59, 59, 999);
              if (expenseDate > toDate) return false;
            }

            // فلترة حسب فئة المصروف
            if (reportConfig.filters.expenseCategory && expense.category !== reportConfig.filters.expenseCategory) {
              return false;
            }

            // فلترة حسب طريقة الدفع
            if (reportConfig.filters.expensePaymentMethod && expense.paymentMethod !== reportConfig.filters.expensePaymentMethod) {
              return false;
            }

            // فلترة المصروفات الكبيرة
            if (reportConfig.filters.onlyLargeExpenses && expense.amount < 1000) {
              return false;
            }

            // فلترة حسب المبلغ
            if (reportConfig.filters.minAmount && expense.amount < parseFloat(reportConfig.filters.minAmount)) return false;
            if (reportConfig.filters.maxAmount && expense.amount > parseFloat(reportConfig.filters.maxAmount)) return false;

            return true;
          });
        }
      }

      // ترتيب المدرسين
      filteredTeachers.sort((a, b) => {
        let aValue, bValue;
        
        switch (reportConfig.sortBy) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'debt':
            aValue = calculateTeacherDebt(a.id);
            bValue = calculateTeacherDebt(b.id);
            break;
          case 'operations_count':
            aValue = filteredOperations.filter(op => op.teacherId === a.id).length;
            bValue = filteredOperations.filter(op => op.teacherId === b.id).length;
            break;
          case 'total_amount':
            aValue = filteredOperations
              .filter(op => op.teacherId === a.id)
              .reduce((sum, op) => sum + (op.amount || 0), 0);
            bValue = filteredOperations
              .filter(op => op.teacherId === b.id)
              .reduce((sum, op) => sum + (op.amount || 0), 0);
            break;
          default:
            aValue = a.name || '';
            bValue = b.name || '';
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        return aValue > bValue ? 1 : -1;
      });

      return {
        teachers: filteredTeachers,
        operations: filteredOperations,
        payments: filteredPayments,
        expenses: filteredExpenses  // فقط إذا كان مطلوب
      };
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('حدث خطأ في تطبيق الفلاتر');
      return {
        teachers: [],
        operations: [],
        payments: [],
        expenses: []
      };
    }
  }, [state.teachers, state.operations, state.payments, state.expenses, reportConfig, calculateTeacherDebt]);

  // إنشاء التقرير - مبسط ومصحح
  const generateReport = async () => {
    const isExpenseOnlyReport = ['expenses_report', 'expenses_detailed'].includes(reportConfig.type);
    
    // التحقق من المتطلبات
    if (!isExpenseOnlyReport && (!reportConfig.selectedTeachers || reportConfig.selectedTeachers.length === 0)) {
      toast.error('يرجى اختيار مدرس واحد على الأقل');
      return;
    }

    setIsGenerating(true);
    
    try {
      // تطبيق الفلاتر على البيانات
      const filteredData = applyFilters();
      
      // التحقق من وجود بيانات
      if (!isExpenseOnlyReport && filteredData.teachers.length === 0) {
        toast.error('لا توجد بيانات تطابق المعايير المحددة');
        setIsGenerating(false);
        return;
      }

      if (isExpenseOnlyReport && (!filteredData.expenses || filteredData.expenses.length === 0)) {
        toast.error('لا توجد مصروفات تطابق المعايير المحددة');
        setIsGenerating(false);
        return;
      }

      // إنشاء بيانات التقرير
      const reportData = {
        config: reportConfig,
        data: filteredData,
        metadata: {
          generatedAt: new Date(),
          generatedBy: user?.name || 'مجهول',
          totalTeachers: filteredData.teachers?.length || 0,
          totalOperations: filteredData.operations?.length || 0,
          totalPayments: filteredData.payments?.length || 0,
          totalExpenses: filteredData.expenses?.length || 0,
          totalAmount: filteredData.operations?.reduce((sum, op) => sum + (op.amount || 0), 0) || 0,
          totalPaid: filteredData.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0,
          totalExpensesAmount: filteredData.expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0
        }
      };

      setCurrentReport(reportData);
      setShowPreview(true);
      
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في إنشاء التقرير');
      console.error('Report generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // حفظ التقرير
  const saveReport = useCallback((reportName) => {
    try {
      const reportToSave = {
        id: Date.now().toString(),
        name: reportName.trim(),
        config: { ...reportConfig },
        createdAt: new Date().toISOString(),
        type: reportConfig.type
      };

      const updatedSavedReports = [...savedReports, reportToSave];
      setSavedReports(updatedSavedReports);
      saveReportsToStorage(updatedSavedReports);
      
      toast.success('تم حفظ التقرير بنجاح');
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('حدث خطأ في حفظ التقرير');
    }
  }, [reportConfig, savedReports, saveReportsToStorage]);

  // تحميل تقرير محفوظ
  const loadSavedReport = useCallback((savedReport) => {
    try {
      setReportConfig(savedReport.config);
      toast.success('تم تحميل التقرير المحفوظ');
    } catch (error) {
      console.error('Error loading saved report:', error);
      toast.error('حدث خطأ في تحميل التقرير');
    }
  }, []);

  // حذف تقرير محفوظ
  const deleteSavedReport = useCallback((reportId) => {
    try {
      const updatedReports = savedReports.filter(report => report.id !== reportId);
      setSavedReports(updatedReports);
      saveReportsToStorage(updatedReports);
      toast.success('تم حذف التقرير');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('حدث خطأ في حذف التقرير');
    }
  }, [savedReports, saveReportsToStorage]);

  // إنشاء تقرير من المحفوظ مباشرة
  const generateFromSaved = useCallback(async (report) => {
    try {
      setReportConfig(report.config);
      
      setTimeout(() => {
        generateReport();
      }, 100);
      
      toast.success('جاري إنشاء التقرير...');
    } catch (error) {
      console.error('Error generating from saved report:', error);
      toast.error('حدث خطأ في إنشاء التقرير');
    }
  }, []);

  if (state.loading.teachers || state.loading.operations || state.loading.payments) {
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              📊 إدارة التقارير
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              إنشاء تقارير PDF مخصصة ومفصلة
            </p>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
              <div className="text-2xl font-bold text-blue-600">{state.teachers?.length || 0}</div>
              <div className="text-sm text-gray-600">المدرسين</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
              <div className="text-2xl font-bold text-green-600">{state.operations?.length || 0}</div>
              <div className="text-sm text-gray-600">العمليات</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
              <div className="text-2xl font-bold text-purple-600">{state.payments?.length || 0}</div>
              <div className="text-sm text-gray-600">المدفوعات</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
              <div className="text-2xl font-bold text-red-600">{state.expenses?.length || 0}</div>
              <div className="text-sm text-gray-600">المصروفات</div>
            </div>
          </div>
        </div>

        {/* محتوى الصفحة */}
        <ReportBuilder
          reportConfig={reportConfig}
          teachers={state.teachers}
          operations={state.operations}
          payments={state.payments}
          onConfigUpdate={updateReportConfig}
          onFiltersUpdate={updateFilters}
          onFormattingUpdate={updateFormatting}
          onGenerate={generateReport}
          onSave={saveReport}
          isGenerating={isGenerating}
          hasPermission={hasPermission}
        />

        {/* التقارير المحفوظة */}
        {savedReports.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 التقارير المحفوظة</h2>
            <SavedReports
              savedReports={savedReports}
              onLoad={loadSavedReport}
              onDelete={deleteSavedReport}
              onGenerateFromSaved={generateFromSaved}
            />
          </div>
        )}

        {/* نافذة معاينة التقرير */}
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title=""
          size="full"
          showCloseButton={false}
        >
          {currentReport && (
            <ReportPreview
              reportData={currentReport}
              onDownloadPDF={() => {
                toast.success('تم تنزيل التقرير بنجاح');
                setShowPreview(false);
              }}
              onClose={() => setShowPreview(false)}
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ReportsPage;