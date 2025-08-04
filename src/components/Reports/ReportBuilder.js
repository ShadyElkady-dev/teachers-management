import React, { useState, useMemo } from 'react';
import { FiFilter, FiSettings, FiFileText, FiSave, FiEye, FiLoader, FiCalendar, FiUsers, FiTrendingUp, FiChevronDown, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

// مكون متعدد الاختيار مبسط
const MultiSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const selectAll = () => {
    onChange(options.map(opt => opt.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition text-right flex items-center justify-between bg-white"
      >
        <span className="text-gray-700 truncate">
          {value.length === 0 ? placeholder : `تم اختيار ${value.length} عنصر`}
        </span>
        <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              تحديد الكل
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              إلغاء التحديد
            </button>
          </div>
          {options.map(option => (
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
      )}
      
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {value.slice(0, 3).map(val => {
            const option = options.find(opt => opt.value === val);
            return option ? (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {option.label}
                <button
                  type="button"
                  onClick={() => toggleOption(val)}
                  className="hover:text-blue-600"
                >
                  <FiX size={12} />
                </button>
              </span>
            ) : null;
          })}
          {value.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{value.length - 3} أخرى
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const Section = ({ title, icon, children, isCollapsed, onToggle }) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6 overflow-hidden">
    <div 
      className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center">
        <div className="text-xl text-blue-600 ml-3">{icon}</div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      <FiChevronDown className={`transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
    </div>
    {!isCollapsed && (
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
      </div>
    )}
  </div>
);

const REPORT_TYPES = [
  { value: 'teacher_detailed', label: 'تقرير مفصل للمدرسين' },
  { value: 'expenses_report', label: 'تقرير المصروفات الخاصة' },
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

  const handleQuickSelect = (type) => {
    switch (type) {
      case 'all':
        onConfigUpdate('selectedTeachers', teachers.map(t => t.id));
        break;
      case 'none':
        onConfigUpdate('selectedTeachers', []);
        break;
      case 'first10':
        onConfigUpdate('selectedTeachers', teachers.slice(0, 10).map(t => t.id));
        break;
      default:
        break;
    }
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
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        from = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
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
    <div className="space-y-8">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">إجمالي المدرسين</h3>
              <p className="text-2xl font-bold">{teachers.length}</p>
            </div>
            <FiUsers className="text-3xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">المدرسين المختارين</h3>
              <p className="text-2xl font-bold">{reportConfig.selectedTeachers?.length || 0}</p>
            </div>
            <FiTrendingUp className="text-3xl opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">نوع التقرير</h3>
              <p className="text-lg font-bold truncate">
                {REPORT_TYPES.find(t => t.value === reportConfig.type)?.label || 'غير محدد'}
              </p>
            </div>
            <FiFileText className="text-3xl opacity-80" />
          </div>
        </div>
      </div>

      {/* القسم الأول: إعدادات التقرير الأساسية */}
      <Section 
        title="إعدادات التقرير الأساسية" 
        icon={<FiFileText />}
        isCollapsed={collapsedSections.basic}
        onToggle={() => toggleSection('basic')}
      >
        {/* نوع التقرير */}
        <div>
          <label className="font-semibold text-gray-700 mb-2 block">نوع التقرير</label>
          <select
            value={reportConfig.type || 'teacher_detailed'}
            onChange={(e) => onConfigUpdate('type', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
          >
            {REPORT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        {/* عنوان التقرير */}
        <div>
          <label className="font-semibold text-gray-700 mb-2 block">عنوان التقرير</label>
          <input
            type="text"
            placeholder="مثال: التقرير المالي للربع الأول"
            value={reportConfig.title || ''}
            onChange={(e) => onConfigUpdate('title', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* اختيار المدرسين - مخفي لتقارير المصروفات */}
        {!['expenses_report', 'expenses_detailed'].includes(reportConfig.type) && (
          <div className="md:col-span-2">
            <label className="font-semibold text-gray-700 mb-2 block">تحديد المدرسين</label>
            
            {/* أزرار الاختيار السريع */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleQuickSelect('all')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
              >
                تحديد الكل ({teachers.length})
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('none')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
              >
                إلغاء التحديد
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('first10')}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
              >
                أول 10 مدرسين
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

        {/* رسالة للمصروفات */}
        {['expenses_report', 'expenses_detailed'].includes(reportConfig.type) && (
          <div className="md:col-span-2 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💰</span>
              <div>
                <h4 className="font-bold text-orange-800">تقرير المصروفات الخاصة</h4>
                <p className="text-sm text-orange-700">
                  هذا التقرير يعرض المصروفات الخاصة بالنظام ولا يحتاج لتحديد مدرسين معينين.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* نطاق التاريخ */}
        <div className="md:col-span-2">
          <label className="font-semibold text-gray-700 mb-2 block">
            <FiCalendar className="inline ml-1" />
            نطاق التاريخ
          </label>
          
          {/* أزرار الفترات السريعة */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => setDateRange('week')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
            >
              آخر أسبوع
            </button>
            <button
              type="button"
              onClick={() => setDateRange('month')}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition"
            >
              هذا الشهر
            </button>
            <button
              type="button"
              onClick={() => setDateRange('quarter')}
              className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition"
            >
              هذا الربع
            </button>
            <button
              type="button"
              onClick={() => setDateRange('year')}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition"
            >
              هذا العام
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">من تاريخ</label>
              <input
                type="date"
                value={reportConfig.dateRange?.from || ''}
                onChange={(e) => onConfigUpdate('dateRange', { 
                  ...reportConfig.dateRange, 
                  from: e.target.value 
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">إلى تاريخ</label>
              <input
                type="date"
                value={reportConfig.dateRange?.to || ''}
                onChange={(e) => onConfigUpdate('dateRange', { 
                  ...reportConfig.dateRange, 
                  to: e.target.value 
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* القسم الثاني: خيارات التصفية */}
      <Section 
        title="خيارات التصفية المتقدمة" 
        icon={<FiFilter />}
        isCollapsed={collapsedSections.filters}
        onToggle={() => toggleSection('filters')}
      >
        {/* تضمين البيانات */}
        <div className="md:col-span-2">
          <label className="font-semibold text-gray-700 mb-3 block">تضمين البيانات</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeOperations"
                checked={reportConfig.includeOperations !== false}
                onChange={(e) => onConfigUpdate('includeOperations', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeOperations" className="mr-3 text-gray-700">
                العمليات والمعاملات
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includePayments"
                checked={reportConfig.includePayments !== false}
                onChange={(e) => onConfigUpdate('includePayments', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includePayments" className="mr-3 text-gray-700">
                المدفوعات
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeExpenses"
                checked={reportConfig.includeExpenses === true}
                onChange={(e) => onConfigUpdate('includeExpenses', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeExpenses" className="mr-3 text-gray-700">
                المصروفات الخاصة
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeFinancialSummary"
                checked={reportConfig.includeFinancialSummary !== false}
                onChange={(e) => onConfigUpdate('includeFinancialSummary', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeFinancialSummary" className="mr-3 text-gray-700">
                الملخص المالي
              </label>
            </div>
          </div>
        </div>

        {/* فلاتر المصروفات */}
        {(reportConfig.type === 'expenses_report' || reportConfig.includeExpenses) && (
          <div className="md:col-span-2">
            <label className="font-semibold text-gray-700 mb-3 block">
              🏷️ فلاتر المصروفات
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">فئة المصروف</label>
                <select
                  value={reportConfig.filters?.expenseCategory || ''}
                  onChange={(e) => onFiltersUpdate('expenseCategory', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع الفئات</option>
                  <option value="office_supplies">مستلزمات مكتبية</option>
                  <option value="utilities">فواتير وخدمات</option>
                  <option value="maintenance">صيانة</option>
                  <option value="transportation">مواصلات</option>
                  <option value="marketing">تسويق</option>
                  <option value="equipment">معدات</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">طريقة الدفع</label>
                <select
                  value={reportConfig.filters?.expensePaymentMethod || ''}
                  onChange={(e) => onFiltersUpdate('expensePaymentMethod', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع الطرق</option>
                  <option value="cash">نقدي</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit_card">بطاقة ائتمان</option>
                  <option value="check">شيك</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onlyLargeExpenses"
                  checked={reportConfig.filters?.onlyLargeExpenses || false}
                  onChange={(e) => onFiltersUpdate('onlyLargeExpenses', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="onlyLargeExpenses" className="mr-3 text-gray-700">
                  المصروفات الكبيرة فقط (أكثر من 1000)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* فلاتر إضافية */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasDebts"
            checked={reportConfig.filters?.hasDebts || false}
            onChange={(e) => onFiltersUpdate('hasDebts', e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="hasDebts" className="mr-3 text-gray-700">
            المدرسين أصحاب المديونيات فقط
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasOperations"
            checked={reportConfig.filters?.hasOperations || false}
            onChange={(e) => onFiltersUpdate('hasOperations', e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="hasOperations" className="mr-3 text-gray-700">
            المدرسين الذين لديهم عمليات فقط
          </label>
        </div>

        {/* نطاق المبلغ */}
        <div>
          <label className="font-semibold text-gray-700 mb-2 block">الحد الأدنى للمبلغ</label>
          <input
            type="number"
            placeholder="0"
            value={reportConfig.filters?.minAmount || ''}
            onChange={(e) => onFiltersUpdate('minAmount', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="font-semibold text-gray-700 mb-2 block">الحد الأقصى للمبلغ</label>
          <input
            type="number"
            placeholder="لا يوجد حد أقصى"
            value={reportConfig.filters?.maxAmount || ''}
            onChange={(e) => onFiltersUpdate('maxAmount', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Section>

      {/* القسم الثالث: إعدادات التنسيق */}
      <Section 
        title="إعدادات التنسيق والعرض" 
        icon={<FiSettings />}
        isCollapsed={collapsedSections.formatting}
        onToggle={() => toggleSection('formatting')}
      >
        {/* حجم الصفحة */}
        <div>
          <label className="font-semibold text-gray-700 mb-2 block">حجم الصفحة</label>
          <select 
            value={reportConfig.formatting?.pageSize || 'A4'}
            onChange={(e) => onFormattingUpdate('pageSize', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="A3">A3</option>
          </select>
        </div>
        
        {/* اتجاه الصفحة */}
        <div>
          <label className="font-semibold text-gray-700 mb-2 block">اتجاه الصفحة</label>
          <select 
            value={reportConfig.formatting?.orientation || 'portrait'}
            onChange={(e) => onFormattingUpdate('orientation', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="portrait">طولي</option>
            <option value="landscape">عرضي</option>
          </select>
        </div>

        {/* حجم الخط */}
        <div>
          <label className="font-semibold text-gray-700 mb-2 block">حجم الخط</label>
          <select 
            value={reportConfig.formatting?.fontSize || 'medium'}
            onChange={(e) => onFormattingUpdate('fontSize', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="small">صغير</option>
            <option value="medium">متوسط</option>
            <option value="large">كبير</option>
          </select>
        </div>

        {/* ترتيب البيانات */}
        <div>
          <label className="font-semibold text-gray-700 mb-2 block">ترتيب حسب</label>
          <select 
            value={reportConfig.sortBy || 'name'}
            onChange={(e) => onConfigUpdate('sortBy', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">الاسم</option>
            <option value="debt">المديونية</option>
            <option value="operations_count">عدد العمليات</option>
            <option value="total_amount">إجمالي المبلغ</option>
          </select>
        </div>
      </Section>

      {/* أزرار الإجراءات */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mt-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* زر الإنشاء */}
          <div className="flex-grow">
            <button
              onClick={onGenerate}
              disabled={isGenerating || (!reportConfig.selectedTeachers?.length && !['expenses_report', 'expenses_detailed'].includes(reportConfig.type))}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {isGenerating ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>جاري الإنشاء...</span>
                </>
              ) : (
                <>
                  <FiEye />
                  <span>إنشاء ومعاينة التقرير</span>
                </>
              )}
            </button>
            
            {/* رسائل التحقق */}
            {!['expenses_report', 'expenses_detailed'].includes(reportConfig.type) && !reportConfig.selectedTeachers?.length && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span>
                يرجى اختيار مدرس واحد على الأقل لإنشاء التقرير
              </p>
            )}
            
            {!['expenses_report', 'expenses_detailed'].includes(reportConfig.type) && reportConfig.selectedTeachers?.length > 0 && (
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <span>✅</span>
                تم اختيار {reportConfig.selectedTeachers.length} مدرس
              </p>
            )}

            {['expenses_report', 'expenses_detailed'].includes(reportConfig.type) && (
              <p className="text-blue-600 text-sm mt-2 flex items-center gap-1">
                <span>💰</span>
                تقرير المصروفات جاهز للإنشاء
              </p>
            )}
          </div>

          {/* حفظ الإعدادات */}
          {hasPermission && hasPermission('MANAGE_REPORTS') && (
            <div className="flex-grow flex flex-col lg:flex-row items-center gap-2 border-t lg:border-t-0 lg:border-r border-gray-200 pt-4 lg:pt-0 lg:pr-4">
              <input
                type="text"
                placeholder="اسم إعدادات التقرير للحفظ"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 transition-all"
              />
              <button
                onClick={handleSaveClick}
                disabled={!saveName.trim()}
                className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <FiSave />
                <span>حفظ الإعدادات</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;