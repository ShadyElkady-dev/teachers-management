import React, { useState, useMemo } from 'react';
import { FiFilter, FiSettings, FiFileText, FiSave, FiEye, FiLoader, FiCalendar, FiUsers, FiTrendingUp, FiChevronDown, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

// مكون متعدد الاختيار
// مكون متعدد الاختيار المطور مع شريط بحث
const MultiSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition text-right flex items-center justify-between bg-white"
      >
        <span className="text-gray-700 truncate">
          {value.length === 0 ? placeholder : `تم اختيار ${value.length} مدرس`}
        </span>
        <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="ابحث عن مدرس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.map(option => (
              <label
                key={option.value}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="ml-2"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          <div className="p-2 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={() => onChange(options.map(opt => opt.value))}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              تحديد الكل
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


// مكون القسم
const Section = ({ title, icon, children, isCollapsed, onToggle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
    <div 
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center">
        <div className="text-lg text-blue-600 ml-3">{icon}</div>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      <FiChevronDown className={`transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
    </div>
    {!isCollapsed && (
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
      </div>
    )}
  </div>
);

const REPORT_TYPES = [
  { value: 'teacher_detailed', label: 'تقرير مفصل للمدرسين' },
  { value: 'expenses_report', label: 'تقرير المصروفات الخاصة' },
];

const REPORT_SECTIONS = [
  { value: 'operations', label: 'العمليات', icon: '📋' },
  { value: 'payments', label: 'المدفوعات', icon: '💰' },
  { value: 'balance', label: 'الرصيد', icon: '📊' },
];

const ReportBuilder = ({
  reportConfig,
  teachers = [],
  onConfigUpdate,
  onFiltersUpdate,
  onFormattingUpdate,
  onGenerate,
  onSave,
  isGenerating,
  hasPermission,
}) => {
  const [saveName, setSaveName] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    basic: false,
    filters: true,
    formatting: true
  });

  const teacherOptions = useMemo(() => 
    teachers.map(t => ({ label: t.name || `مدرس ${t.id}`, value: t.id })),
    [teachers]
  );

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSaveClick = () => {
    if (!saveName.trim()) {
      toast.error('يرجى إدخال اسم لإعدادات التقرير');
      return;
    }
    onSave(saveName);
    setSaveName('');
    toast.success('تم حفظ إعدادات التقرير بنجاح');
  };

  const setDateRange = (range) => {
    const today = new Date();
    let from, to;
    
    switch (range) {
      case 'today':
        from = to = today.toISOString().split('T')[0];
        break;
      case 'week':
        from = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        to = new Date().toISOString().split('T')[0];
        break;
      case 'month':
        from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        to = new Date().toISOString().split('T')[0];
        break;
      case 'year':
        from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        to = new Date().toISOString().split('T')[0];
        break;
      default:
        return;
    }
    
    onConfigUpdate('dateRange', { from, to });
  };

  return (
    <div className="space-y-4">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-blue-500 text-white p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs opacity-90">إجمالي المدرسين</h3>
              <p className="text-xl font-bold">{teachers.length}</p>
            </div>
            <FiUsers className="text-2xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-green-500 text-white p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs opacity-90">المدرسين المختارين</h3>
              <p className="text-xl font-bold">{reportConfig.selectedTeachers?.length || 0}</p>
            </div>
            <FiTrendingUp className="text-2xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-purple-500 text-white p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs opacity-90">نوع التقرير</h3>
              <p className="text-sm font-bold truncate">
                {REPORT_TYPES.find(t => t.value === reportConfig.type)?.label || 'غير محدد'}
              </p>
            </div>
            <FiFileText className="text-2xl opacity-80" />
          </div>
        </div>
      </div>

      {/* القسم الأساسي */}
      <Section 
        title="إعدادات التقرير الأساسية" 
        icon={<FiFileText />}
        isCollapsed={collapsedSections.basic}
        onToggle={() => toggleSection('basic')}
      >
        <div>
          <label className="font-medium text-gray-700 mb-2 block text-sm">نوع التقرير</label>
          <select
            value={reportConfig.type || 'teacher_detailed'}
            onChange={(e) => onConfigUpdate('type', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {REPORT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="font-medium text-gray-700 mb-2 block text-sm">عنوان التقرير</label>
          <input
            type="text"
            placeholder="مثال: التقرير الشهري"
            value={reportConfig.title || ''}
            onChange={(e) => onConfigUpdate('title', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* اختيار الأقسام المطلوبة */}
        <div className="md:col-span-2">
          <label className="font-medium text-gray-700 mb-2 block text-sm">الأقسام المطلوبة في التقرير</label>
          <div className="grid grid-cols-3 gap-3">
            {REPORT_SECTIONS.map(section => (
              <label key={section.value} className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.includedSections?.[section.value] === true || 
                          (reportConfig.includedSections?.[section.value] === undefined && true)}
                  onChange={(e) => {
                    const newSections = {
                      ...reportConfig.includedSections,
                      [section.value]: e.target.checked
                    };
                    onConfigUpdate('includedSections', newSections);
                  }}
                  className="ml-2"
                />
                <span className="text-sm">{section.icon} {section.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* اختيار المدرسين */}
        {reportConfig.type !== 'expenses_report' && (
          <div className="md:col-span-2">
            <label className="font-medium text-gray-700 mb-2 block text-sm">تحديد المدرسين</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => onConfigUpdate('selectedTeachers', teachers.map(t => t.id))}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={() => onConfigUpdate('selectedTeachers', [])}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                إلغاء التحديد
              </button>
            </div>
            <MultiSelect
              options={teacherOptions}
              value={reportConfig.selectedTeachers || []}
              onChange={(selected) => onConfigUpdate('selectedTeachers', selected)}
              placeholder="اختر المدرسين..."
            />
          </div>
        )}

        {/* نطاق التاريخ */}
        <div className="md:col-span-2">
          <label className="font-medium text-gray-700 mb-2 block text-sm">
            <FiCalendar className="inline ml-1" />
            نطاق التاريخ
          </label>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {['today', 'week', 'month', 'year'].map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {range === 'today' ? 'اليوم' : 
                 range === 'week' ? 'آخر أسبوع' : 
                 range === 'month' ? 'هذا الشهر' : 'هذا العام'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={reportConfig.dateRange?.from || ''}
              onChange={(e) => onConfigUpdate('dateRange', { 
                ...reportConfig.dateRange, 
                from: e.target.value 
              })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="date"
              value={reportConfig.dateRange?.to || ''}
              onChange={(e) => onConfigUpdate('dateRange', { 
                ...reportConfig.dateRange, 
                to: e.target.value 
              })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </Section>

      {/* القسم الثاني: الفلاتر */}
      <Section 
        title="خيارات التصفية" 
        icon={<FiFilter />}
        isCollapsed={collapsedSections.filters}
        onToggle={() => toggleSection('filters')}
      >
        <div>
          <label className="font-medium text-gray-700 mb-2 block text-sm">الحد الأدنى للمبلغ</label>
          <input
            type="number"
            placeholder="0"
            value={reportConfig.filters?.minAmount || ''}
            onChange={(e) => onFiltersUpdate('minAmount', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        
        <div>
          <label className="font-medium text-gray-700 mb-2 block text-sm">الحد الأقصى للمبلغ</label>
          <input
            type="number"
            placeholder="لا يوجد حد"
            value={reportConfig.filters?.maxAmount || ''}
            onChange={(e) => onFiltersUpdate('maxAmount', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={reportConfig.filters?.hasOperations || false}
            onChange={(e) => onFiltersUpdate('hasOperations', e.target.checked)}
            className="ml-2"
          />
          <span className="text-sm">المدرسين الذين لديهم عمليات فقط</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={reportConfig.filters?.hasDebts || false}
            onChange={(e) => onFiltersUpdate('hasDebts', e.target.checked)}
            className="ml-2"
          />
          <span className="text-sm">المدرسين أصحاب المديونيات فقط</span>
        </label>
      </Section>

      {/* القسم الثالث: التنسيق */}
      <Section 
        title="إعدادات العرض والطباعة" 
        icon={<FiSettings />}
        isCollapsed={collapsedSections.formatting}
        onToggle={() => toggleSection('formatting')}
      >
        <div>
          <label className="font-medium text-gray-700 mb-2 block text-sm">حجم الصفحة</label>
          <select 
            value={reportConfig.formatting?.pageSize || 'A4'}
            onChange={(e) => onFormattingUpdate('pageSize', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </div>
        
        <div>
          <label className="font-medium text-gray-700 mb-2 block text-sm">ترتيب حسب</label>
          <select 
            value={reportConfig.sortBy || 'name'}
            onChange={(e) => onConfigUpdate('sortBy', e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="name">الاسم</option>
            <option value="debt">المديونية</option>
            <option value="operations_count">عدد العمليات</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="font-medium text-gray-700 mb-2 block text-sm">تخطيط الطباعة</label>
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={reportConfig.formatting?.separatePages !== false}
                onChange={(e) => onFormattingUpdate('separatePages', e.target.checked)}
                className="ml-2 mt-1"
              />
              <div>
                <span className="text-sm font-medium">كل مدرس في صفحة منفصلة</span>
                <p className="text-xs text-gray-500 mt-1">
                  عند التفعيل، سيظهر كل مدرس في صفحة منفصلة عند الطباعة. مفيد للتقارير التي تحتوي على عدة مدرسين.
                </p>
              </div>
            </label>
            
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border-l-4 border-blue-200">
              💡 <strong>نصيحة:</strong> استخدم هذا الخيار عندما تريد طباعة تقرير منفصل لكل مدرس أو عند إرسال التقارير بشكل فردي.
            </div>
          </div>
        </div>
      </Section>

      {/* أزرار الإجراءات */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <button
            onClick={onGenerate}
            disabled={isGenerating || (!reportConfig.selectedTeachers?.length && reportConfig.type !== 'expenses_report')}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <FiLoader className="animate-spin" />
                <span>جاري الإنشاء...</span>
              </>
            ) : (
              <>
                <FiEye />
                <span>إنشاء التقرير</span>
              </>
            )}
          </button>

          {hasPermission && hasPermission('MANAGE_REPORTS') && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="اسم التقرير للحفظ"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
              />
              <button
                onClick={handleSaveClick}
                disabled={!saveName.trim()}
                className="flex items-center gap-2 bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-green-700 transition-all disabled:bg-gray-400"
              >
                <FiSave />
                <span>حفظ</span>
              </button>
            </div>
          )}
        </div>
        
        {/* معلومات إضافية */}
        <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
          <div className="flex flex-wrap gap-4">
            <span>📄 المدرسين المختارين: {reportConfig.selectedTeachers?.length || 0}</span>
            <span>📅 النطاق الزمني: {reportConfig.dateRange?.from && reportConfig.dateRange?.to ? 
              `${reportConfig.dateRange.from} إلى ${reportConfig.dateRange.to}` : 'غير محدد'}</span>
            <span>🖨️ تخطيط الطباعة: {reportConfig.formatting?.separatePages !== false ? 'صفحات منفصلة' : 'صفحة واحدة'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;