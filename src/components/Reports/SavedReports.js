import React, { useState } from 'react';
import { FiEdit, FiTrash2, FiPlayCircle, FiCopy, FiSearch, FiFilter, FiMoreVertical } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';

const SavedReports = ({ savedReports, onLoad, onDelete, onGenerateFromSaved }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReports, setSelectedReports] = useState([]);

  // تصفية وترتيب التقارير
  const filteredAndSortedReports = savedReports
    .filter(report => {
      // تصفية حسب البحث
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.config.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      // تصفية حسب النوع
      const matchesType = filterType === 'all' || report.config.type === filterType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // الحصول على أنواع التقارير الفريدة
  const reportTypes = [...new Set(savedReports.map(report => report.config.type))];

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === filteredAndSortedReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredAndSortedReports.map(report => report.id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedReports.length} تقرير؟`)) {
      selectedReports.forEach(reportId => onDelete(reportId));
      setSelectedReports([]);
    }
  };

  const duplicateReport = (report) => {
    const duplicatedReport = {
      ...report,
      id: Date.now().toString(),
      name: `${report.name} - نسخة`,
      createdAt: new Date()
    };
    // هنا يجب إضافة دالة للحفظ
    console.log('Duplicate report:', duplicatedReport);
  };

  if (savedReports.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-md border">
        <div className="text-6xl mb-4 text-gray-300">📊</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">لا توجد تقارير محفوظة</h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          يمكنك حفظ إعدادات التقارير التي تنشئها بشكل متكرر للوصول إليها بسرعة وسهولة.
        </p>
        <div className="mt-6">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            إنشاء تقرير جديد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط البحث والفلاتر */}
      <div className="bg-white rounded-2xl shadow-md border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* البحث */}
          <div className="relative flex-grow max-w-md">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في التقارير..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* الفلاتر */}
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأنواع</option>
              {reportTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt-desc">الأحدث أولاً</option>
              <option value="createdAt-asc">الأقدم أولاً</option>
              <option value="name-asc">الاسم (أ-ي)</option>
              <option value="name-desc">الاسم (ي-أ)</option>
            </select>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              عرض {filteredAndSortedReports.length} من {savedReports.length} تقرير
            </span>
            {selectedReports.length > 0 && (
              <div className="flex items-center gap-3">
                <span>تم تحديد {selectedReports.length} تقرير</span>
                <button
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  حذف المحدد
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* قائمة التقارير */}
      <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
        {/* رأس الجدول */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedReports.length === filteredAndSortedReports.length && filteredAndSortedReports.length > 0}
              onChange={handleSelectAll}
              className="ml-4"
            />
            <h3 className="text-lg font-bold text-gray-800">
              قائمة التقارير المحفوظة ({filteredAndSortedReports.length})
            </h3>
          </div>
        </div>

        {/* محتوى الجدول */}
        <div className="divide-y divide-gray-100">
          {filteredAndSortedReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              isSelected={selectedReports.includes(report.id)}
              onSelect={() => handleSelectReport(report.id)}
              onLoad={() => onLoad(report)}
              onDelete={() => onDelete(report.id)}
              onGenerate={() => onGenerateFromSaved(report)}
              onDuplicate={() => duplicateReport(report)}
            />
          ))}
        </div>

        {filteredAndSortedReports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiSearch className="mx-auto text-4xl mb-2" />
            <p>لا توجد تقارير تطابق معايير البحث</p>
          </div>
        )}
      </div>
    </div>
  );
};

// مكون بطاقة التقرير
const ReportCard = ({ report, isSelected, onSelect, onLoad, onDelete, onGenerate, onDuplicate }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getReportTypeLabel = (type) => {
    const types = {
      'teacher_detailed': 'تقرير مفصل للمدرسين',
      'teacher_summary': 'ملخص المدرسين',
      'operations_summary': 'ملخص العمليات',
      'financial_report': 'التقرير المالي',
      'debts_report': 'تقرير المديونيات',
      'custom': 'تقرير مخصص'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'teacher_detailed': '👥',
      'teacher_summary': '📊',
      'operations_summary': '📈',
      'financial_report': '💰',
      'debts_report': '⚠️',
      'custom': '🔧'
    };
    return icons[type] || '📄';
  };

  const getTypeColor = (type) => {
    const colors = {
      'teacher_detailed': 'bg-blue-100 text-blue-800',
      'teacher_summary': 'bg-green-100 text-green-800',
      'operations_summary': 'bg-purple-100 text-purple-800',
      'financial_report': 'bg-yellow-100 text-yellow-800',
      'debts_report': 'bg-red-100 text-red-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}>
      <div className="flex items-center justify-between">
        {/* معلومات التقرير */}
        <div className="flex items-center gap-4 flex-grow">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="h-5 w-5"
          />
          
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg font-semibold text-gray-900">{report.name}</h4>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.config.type)}`}>
                <span>{getTypeIcon(report.config.type)}</span>
                {getReportTypeLabel(report.config.type)}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span>📅</span>
                تم الحفظ: {formatDate(report.createdAt)}
              </span>
              
              {report.config.selectedTeachers && (
                <span className="flex items-center gap-1">
                  <span>👥</span>
                  {report.config.selectedTeachers.length} مدرس
                </span>
              )}
              
              {report.config.dateRange?.from && (
                <span className="flex items-center gap-1">
                  <span>📊</span>
                  {formatDate(report.config.dateRange.from)} - {formatDate(report.config.dateRange.to)}
                </span>
              )}
            </div>

            {/* معاينة سريعة للإعدادات */}
            <div className="mt-2 flex flex-wrap gap-2">
              {report.config.includeOperations && (
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  العمليات
                </span>
              )}
              {report.config.includePayments && (
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  المدفوعات
                </span>
              )}
              {report.config.filters?.hasDebts && (
                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                  المديونيات فقط
                </span>
              )}
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGenerate}
            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="إنشاء فوري"
          >
            <FiPlayCircle size={18} />
            <span className="hidden md:inline">إنشاء</span>
          </button>
          
          <button
            onClick={onLoad}
            className="flex items-center gap-1 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
            title="تحميل للتعديل"
          >
            <FiEdit size={18} />
            <span className="hidden md:inline">تعديل</span>
          </button>

          {/* قائمة المزيد */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiMoreVertical size={18} />
            </button>
            
            {showMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiCopy size={16} />
                  إنشاء نسخة
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FiTrash2 size={16} />
                  حذف
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedReports;