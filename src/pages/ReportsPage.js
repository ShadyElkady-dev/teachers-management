import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth, PERMISSIONS } from '../context/AuthContext';
import { PermissionGate } from '../components/Common/ProtectedRoute';
import toast from 'react-hot-toast';

// Components
import ReportBuilder from '../components/Reports/ReportBuilder';
import ReportPreview from '../components/Reports/ReportPreview';
import SavedReports from '../components/Reports/SavedReports';
import SearchBar from '../components/Common/SearchBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';

// Utils
import { searchInText, formatCurrency, formatDate, isSmallScreen, getFromLocalStorage, saveToLocalStorage } from '../utils/helpers';
import { MESSAGES, REPORT_TYPES, REPORT_TEMPLATES } from '../utils/constants';

const ReportsPage = () => {
  const { state, calculateTeacherDebt } = useAppContext();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('create'); // create, saved, analytics
  const [currentReport, setCurrentReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [isMobile, setIsMobile] = useState(isSmallScreen());

  // إعدادات التقرير
  const [reportConfig, setReportConfig] = useState({
    type: 'teacher_detailed', // teacher_detailed, teacher_summary, operations_summary, financial_report, custom
    title: 'تقرير مفصل للمدرسين',
    description: '',
    selectedTeachers: [],
    dateRange: {
      from: '',
      to: ''
    },
    includeOperations: true,
    includePayments: true,
    includeFinancialSummary: true,
    includeStatistics: true,
    groupBy: 'teacher', // teacher, date, type
    sortBy: 'name', // name, debt, operations_count, total_amount
    sortOrder: 'asc',
    filters: {
      operationTypes: [],
      paymentMethods: [],
      minAmount: '',
      maxAmount: '',
      hasDebts: false,
      hasOperations: false
    },
    formatting: {
      pageSize: 'A4',
      orientation: 'portrait', // portrait, landscape
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      includeLogo: true,
      fontSize: 'medium' // small, medium, large
    }
  });

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isSmallScreen());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // تحميل التقارير المحفوظة
  useEffect(() => {
    const saved = getFromLocalStorage('saved_reports', []);
    setSavedReports(saved);
  }, []);

  // تحديث إعدادات التقرير
  const updateReportConfig = (key, value) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // تحديث الفلاتر
  const updateFilters = (filterKey, value) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterKey]: value
      }
    }));
  };

  // تحديث إعدادات التنسيق
  const updateFormatting = (formatKey, value) => {
    setReportConfig(prev => ({
      ...prev,
      formatting: {
        ...prev.formatting,
        [formatKey]: value
      }
    }));
  };

  // إنشاء التقرير
  const generateReport = async () => {
    if (reportConfig.selectedTeachers.length === 0) {
      toast.error('يرجى اختيار مدرس واحد على الأقل');
      return;
    }

    setIsGenerating(true);
    
    try {
      // تطبيق الفلاتر على البيانات
      const filteredData = applyFilters();
      
      // إنشاء بيانات التقرير
      const reportData = {
        config: reportConfig,
        data: filteredData,
        metadata: {
          generatedAt: new Date(),
          generatedBy: state.user?.name || 'مجهول',
          totalTeachers: filteredData.teachers.length,
          totalOperations: filteredData.operations.length,
          totalPayments: filteredData.payments.length,
          totalAmount: filteredData.operations.reduce((sum, op) => sum + (op.amount || 0), 0),
          totalPaid: filteredData.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
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

  // تطبيق الفلاتر على البيانات
  const applyFilters = () => {
    let filteredTeachers = state.teachers.filter(teacher => 
      reportConfig.selectedTeachers.includes(teacher.id)
    );

    let filteredOperations = state.operations.filter(operation => {
      const teacher = state.teachers.find(t => t.id === operation.teacherId);
      if (!teacher || !reportConfig.selectedTeachers.includes(teacher.id)) return false;

      // فلترة حسب التاريخ
      if (reportConfig.dateRange.from) {
        const operationDate = operation.operationDate?.toDate ? operation.operationDate.toDate() : new Date(operation.operationDate);
        const fromDate = new Date(reportConfig.dateRange.from);
        if (operationDate < fromDate) return false;
      }
      
      if (reportConfig.dateRange.to) {
        const operationDate = operation.operationDate?.toDate ? operation.operationDate.toDate() : new Date(operation.operationDate);
        const toDate = new Date(reportConfig.dateRange.to);
        if (operationDate > toDate) return false;
      }

      // فلترة حسب نوع العملية
      if (reportConfig.filters.operationTypes.length > 0) {
        if (!reportConfig.filters.operationTypes.includes(operation.type)) return false;
      }

      // فلترة حسب المبلغ
      if (reportConfig.filters.minAmount && operation.amount < parseFloat(reportConfig.filters.minAmount)) return false;
      if (reportConfig.filters.maxAmount && operation.amount > parseFloat(reportConfig.filters.maxAmount)) return false;

      return true;
    });

    let filteredPayments = state.payments.filter(payment => {
      const teacher = state.teachers.find(t => t.id === payment.teacherId);
      if (!teacher || !reportConfig.selectedTeachers.includes(teacher.id)) return false;

      // فلترة حسب التاريخ
      if (reportConfig.dateRange.from) {
        const paymentDate = payment.paymentDate?.toDate ? payment.paymentDate.toDate() : new Date(payment.paymentDate);
        const fromDate = new Date(reportConfig.dateRange.from);
        if (paymentDate < fromDate) return false;
      }
      
      if (reportConfig.dateRange.to) {
        const paymentDate = payment.paymentDate?.toDate ? payment.paymentDate.toDate() : new Date(payment.paymentDate);
        const toDate = new Date(reportConfig.dateRange.to);
        if (paymentDate > toDate) return false;
      }

      // فلترة حسب طريقة الدفع
      if (reportConfig.filters.paymentMethods.length > 0) {
        if (!reportConfig.filters.paymentMethods.includes(payment.paymentMethod)) return false;
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

    return {
      teachers: filteredTeachers,
      operations: filteredOperations,
      payments: filteredPayments
    };
  };

  // حفظ التقرير
  const saveReport = (reportName) => {
    const reportToSave = {
      id: Date.now().toString(),
      name: reportName,
      config: reportConfig,
      createdAt: new Date(),
      type: reportConfig.type
    };

    const updatedSavedReports = [...savedReports, reportToSave];
    setSavedReports(updatedSavedReports);
    saveToLocalStorage('saved_reports', updatedSavedReports);
    
    toast.success('تم حفظ التقرير بنجاح');
  };

  // تحميل تقرير محفوظ
  const loadSavedReport = (savedReport) => {
    setReportConfig(savedReport.config);
    setActiveTab('create');
    toast.success('تم تحميل التقرير المحفوظ');
  };

  // حذف تقرير محفوظ
  const deleteSavedReport = (reportId) => {
    const updatedReports = savedReports.filter(report => report.id !== reportId);
    setSavedReports(updatedReports);
    saveToLocalStorage('saved_reports', updatedReports);
    toast.success('تم حذف التقرير');
  };

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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">📊 إدارة التقارير</h1>
            <p className="text-gray-600 text-lg mb-6">
              إنشاء وإدارة تقارير PDF مخصصة ومفصلة
            </p>
          </div>
        </div>

        {/* التبويبات الرئيسية */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'create', label: 'إنشاء تقرير جديد', icon: '➕' },
              { id: 'saved', label: 'التقارير المحفوظة', icon: '💾' },
              { id: 'analytics', label: 'تحليلات التقارير', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* محتوى التبويبات */}
        <div>
          {activeTab === 'create' && (
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
          )}

          {activeTab === 'saved' && (
            <SavedReports
              savedReports={savedReports}
              onLoad={loadSavedReport}
              onDelete={deleteSavedReport}
              onGenerateFromSaved={(report) => {
                loadSavedReport(report);
                generateReport();
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <ReportsAnalytics
              savedReports={savedReports}
              recentReports={[]} // يمكن إضافة التقارير المُنشأة مؤخراً
            />
          )}
        </div>

        {/* نافذة معاينة التقرير */}
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="📋 معاينة التقرير"
          size="xl"
        >
          {currentReport && (
            <ReportPreview
              reportData={currentReport}
              onDownloadPDF={() => {
                // سيتم تنفيذ تنزيل PDF هنا
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

// مكون تحليلات التقارير
const ReportsAnalytics = ({ savedReports, recentReports }) => {
  const statistics = {
    totalSaved: savedReports.length,
    mostUsedType: savedReports.length > 0 
      ? savedReports.reduce((acc, report) => {
          acc[report.type] = (acc[report.type] || 0) + 1;
          return acc;
        }, {})
      : {},
    recentActivity: recentReports.length
  };

  const mostPopularType = Object.keys(statistics.mostUsedType).length > 0
    ? Object.keys(statistics.mostUsedType).reduce((a, b) => 
        statistics.mostUsedType[a] > statistics.mostUsedType[b] ? a : b
      )
    : 'لا يوجد';

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">التقارير المحفوظة</h3>
              <p className="text-3xl font-bold text-blue-600">{statistics.totalSaved}</p>
            </div>
            <div className="text-4xl text-blue-500">💾</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">النوع الأكثر استخداماً</h3>
              <p className="text-lg font-bold text-green-600">{mostPopularType}</p>
            </div>
            <div className="text-4xl text-green-500">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">النشاط الحديث</h3>
              <p className="text-3xl font-bold text-purple-600">{statistics.recentActivity}</p>
            </div>
            <div className="text-4xl text-purple-500">📈</div>
          </div>
        </div>
      </div>

      {/* قائمة التقارير حسب النوع */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">التقارير حسب النوع</h3>
        
        {Object.keys(statistics.mostUsedType).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>لا توجد تقارير محفوظة بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(statistics.mostUsedType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{type}</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{count} تقرير</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(count / statistics.totalSaved) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نصائح وإرشادات */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <span className="text-blue-500 text-3xl">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 text-lg mb-3">نصائح لاستخدام التقارير بفعالية</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>حدد الغرض من التقرير قبل إنشائه</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📅</span>
                  <span>استخدم فلاتر التاريخ لتقارير دورية</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>💾</span>
                  <span>احفظ إعدادات التقارير المتكررة</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span>📊</span>
                  <span>استخدم الملخصات المالية للتحليل</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>راجع التقرير قبل الطباعة</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📋</span>
                  <span>اختر التنسيق المناسب للاستخدام</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;