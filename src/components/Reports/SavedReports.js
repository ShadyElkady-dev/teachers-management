import React, { useState } from 'react';
import { FiEdit, FiTrash2, FiPlayCircle, FiSearch, FiMoreVertical } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';

const SavedReports = ({ savedReports, onLoad, onDelete, onGenerateFromSaved }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // تصفية التقارير
  const filteredReports = savedReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.config.type === filterType;
    return matchesSearch && matchesType;
  });

  if (savedReports.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow border">
        <div className="text-5xl mb-3 text-gray-300">📊</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد تقارير محفوظة</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          يمكنك حفظ إعدادات التقارير للوصول إليها بسرعة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* شريط البحث */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="البحث في التقارير..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">جميع الأنواع</option>
            <option value="teacher_detailed">تقارير المدرسين</option>
            <option value="expenses_report">تقارير المصروفات</option>
          </select>
        </div>
        
        <div className="mt-3 text-xs text-gray-600">
          عرض {filteredReports.length} من {savedReports.length} تقرير
        </div>
      </div>

      {/* قائمة التقارير */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onLoad={() => onLoad(report)}
              onDelete={() => onDelete(report.id)}
              onGenerate={() => onGenerateFromSaved(report)}
            />
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiSearch className="mx-auto text-3xl mb-2" />
            <p className="text-sm">لا توجد تقارير تطابق البحث</p>
          </div>
        )}
      </div>
    </div>
  );
};

// بطاقة التقرير
const ReportCard = ({ report, onLoad, onDelete, onGenerate }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getTypeLabel = (type) => {
    const types = {
      'teacher_detailed': 'تقرير مفصل للمدرسين',
      'expenses_report': 'تقرير المصروفات'
    };
    return types[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'teacher_detailed': 'bg-blue-100 text-blue-800',
      'expenses_report': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900">{report.name}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(report.config.type)}`}>
              {getTypeLabel(report.config.type)}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>📅 {formatDate(report.createdAt)}</span>
            {report.config.selectedTeachers && (
              <span>👥 {report.config.selectedTeachers.length} مدرس</span>
            )}
            {report.config.dateRange?.from && (
              <span>📊 {formatDate(report.config.dateRange.from)} - {formatDate(report.config.dateRange.to)}</span>
            )}
          </div>

          {/* معاينة الإعدادات */}
          <div className="mt-2 flex flex-wrap gap-1">
            {(report.config.includedSections?.operations === true || 
              report.config.includedSections?.operations === undefined) && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">العمليات</span>
            )}
            {(report.config.includedSections?.payments === true || 
              report.config.includedSections?.payments === undefined) && (
              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded">المدفوعات</span>
            )}
            {(report.config.includedSections?.balance === true || 
              report.config.includedSections?.balance === undefined) && (
              <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">الرصيد</span>
            )}
            {report.config.filters?.hasDebts && (
              <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded">مديونيات</span>
            )}
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-1">
          <button
            onClick={onGenerate}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="إنشاء فوري"
          >
            <FiPlayCircle size={16} />
          </button>
          
          <button
            onClick={onLoad}
            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
            title="تحميل للتعديل"
          >
            <FiEdit size={16} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <FiMoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FiTrash2 size={14} />
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