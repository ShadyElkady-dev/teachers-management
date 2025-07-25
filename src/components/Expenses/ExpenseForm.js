import React, { useState, useEffect } from 'react';
import { dateToInputValue, sanitizeText } from '../../utils/helpers';
import { EXPENSE_TYPES } from '../../utils/constants';
import LoadingSpinner from '../Common/LoadingSpinner';

const ExpenseForm = ({ 
  expense = null, 
  onSave, 
  onCancel, 
  loading = false 
}) => {
  // حالة النموذج
  const [formData, setFormData] = useState({
    type: 'paper',
    description: '',
    amount: '',
    expenseDate: dateToInputValue(new Date()),
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // تعبئة النموذج عند التعديل
  useEffect(() => {
    if (expense) {
      setFormData({
        type: expense.type || 'paper',
        description: expense.description || '',
        amount: expense.amount?.toString() || '',
        expenseDate: dateToInputValue(expense.expenseDate),
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};

    // نوع المصروف
    if (!formData.type) {
      newErrors.type = 'نوع المصروف مطلوب';
    }

    // وصف المصروف
    if (!formData.description.trim()) {
      newErrors.description = 'وصف المصروف مطلوب';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'وصف المصروف يجب أن يكون أكثر من 3 أحرف';
    }

    // المبلغ
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    } else if (parseFloat(formData.amount) > 999999) {
      newErrors.amount = 'المبلغ كبير جداً';
    }

    // تاريخ المصروف
    if (!formData.expenseDate) {
      newErrors.expenseDate = 'تاريخ المصروف مطلوب';
    } else {
      const selectedDate = new Date(formData.expenseDate);
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      
      if (selectedDate > today) {
        newErrors.expenseDate = 'لا يمكن أن يكون تاريخ المصروف في المستقبل';
      } else if (selectedDate < oneYearAgo) {
        newErrors.expenseDate = 'تاريخ المصروف قديم جداً';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // معالجة تغيير القيم
  const handleChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'description' || field === 'notes') {
      processedValue = sanitizeText(value);
    } else if (field === 'amount') {
      processedValue = Math.max(0, parseFloat(value) || 0);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // إزالة الخطأ عند تعديل الحقل
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // معالجة التركيز على الحقل
  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // معالجة إرسال النموذج
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // تعيين جميع الحقول كـ touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (validateForm()) {
      onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate)
      });
    }
  };

  // تحديد ما إذا كان الحقل يحتوي على خطأ
  const hasError = (field) => {
    return touched[field] && errors[field];
  };

  // الحصول على نوع المصروف المحدد
  const selectedExpenseType = EXPENSE_TYPES.find(type => type.value === formData.type);

  // اقتراحات سريعة للوصف حسب النوع
  const getDescriptionSuggestions = () => {
    switch (formData.type) {
      case 'paper':
        return ['ورق A4 أبيض', 'ورق A3', 'ورق ملون', 'ورق كرتون'];
      case 'ink':
        return ['حبر أسود', 'حبر ملون', 'حبر طابعة ليزر', 'حبر طابعة نفث'];
      case 'toner':
        return ['تونر أسود', 'تونر ملون', 'درام يونيت', 'فيوزر'];
      case 'maintenance':
        return ['صيانة طابعة', 'قطع غيار', 'تنظيف الآلات', 'إصلاح عطل'];
      case 'electricity':
        return ['فاتورة كهرباء', 'رسوم استهلاك', 'فاتورة شهرية'];
      case 'rent':
        return ['إيجار المحل', 'إيجار شهري', 'رسوم إدارية'];
      case 'supplies':
        return ['مستلزمات مكتبية', 'ملفات وأقلام', 'شرائط لاصقة', 'دباسة وكراسات'];
      default:
        return ['مصروف متنوع', 'مشتريات عامة'];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* نوع المصروف */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          نوع المصروف <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          onBlur={() => handleBlur('type')}
          className={`input ${hasError('type') ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={loading}
        >
          {EXPENSE_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {hasError('type') && (
          <p className="mt-1 text-sm text-red-600">{errors.type}</p>
        )}
      </div>

      {/* وصف المصروف */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          وصف المصروف <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          className={`input ${hasError('description') ? 'border-red-500 focus:border-red-500' : ''}`}
          placeholder={`مثال: ${getDescriptionSuggestions()[0]}`}
          disabled={loading}
          autoFocus
        />
        {hasError('description') && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        
        {/* اقتراحات سريعة */}
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">اقتراحات سريعة:</div>
          <div className="flex flex-wrap gap-1">
            {getDescriptionSuggestions().slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleChange('description', suggestion)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* المبلغ */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          المبلغ (جنيه) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="amount"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          onBlur={() => handleBlur('amount')}
          className={`input ${hasError('amount') ? 'border-red-500 focus:border-red-500' : ''} font-bold text-lg`}
          placeholder="0.00"
          min="0"
          step="0.01"
          disabled={loading}
        />
        {hasError('amount') && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
        
        {/* أزرار مبالغ سريعة */}
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">مبالغ شائعة:</div>
          <div className="flex flex-wrap gap-1">
            {[50, 100, 200, 500].map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => handleChange('amount', amount.toString())}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                disabled={loading}
              >
                {amount} جنيه
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* تاريخ المصروف */}
      <div>
        <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-2">
          تاريخ المصروف <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="expenseDate"
          value={formData.expenseDate}
          onChange={(e) => handleChange('expenseDate', e.target.value)}
          onBlur={() => handleBlur('expenseDate')}
          className={`input ${hasError('expenseDate') ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={loading}
        />
        {hasError('expenseDate') && (
          <p className="mt-1 text-sm text-red-600">{errors.expenseDate}</p>
        )}
        
        {/* أزرار تاريخ سريع */}
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">تواريخ سريعة:</div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => handleChange('expenseDate', dateToInputValue(new Date()))}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
              disabled={loading}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                handleChange('expenseDate', dateToInputValue(yesterday));
              }}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded transition-colors"
              disabled={loading}
            >
              أمس
            </button>
          </div>
        </div>
      </div>

      {/* ملاحظات */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          ملاحظات
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          onBlur={() => handleBlur('notes')}
          className="input min-h-[80px] resize-y"
          placeholder="أي ملاحظات إضافية حول المصروف"
          disabled={loading}
          rows="3"
        />
      </div>

      {/* ملخص المصروف */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-900 mb-3">ملخص المصروف</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-red-700">النوع:</span>
            <span className="font-medium mr-2">{selectedExpenseType?.label}</span>
          </div>
          <div>
            <span className="text-red-700">التاريخ:</span>
            <span className="font-medium mr-2">
              {formData.expenseDate ? new Date(formData.expenseDate).toLocaleDateString('ar-EG') : '-'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-red-700">المبلغ:</span>
            <span className="font-bold text-lg mr-2 text-red-900">
              {formData.amount ? `${parseFloat(formData.amount).toFixed(2)} جنيه` : '0.00 جنيه'}
            </span>
          </div>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 btn btn-secondary"
        >
          إلغاء
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn btn-primary"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <LoadingSpinner size="small" color="white" />
              {expense ? 'جاري التحديث...' : 'جاري الحفظ...'}
            </div>
          ) : (
            expense ? 'تحديث المصروف' : 'حفظ المصروف'
          )}
        </button>
      </div>

      {/* معلومات مساعدة */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-lg">💡</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">نصائح:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• استخدم الاقتراحات السريعة لتوفير الوقت</li>
              <li>• احرص على إدخال وصف واضح ومفصل للمصروف</li>
              <li>• استخدم المبالغ الشائعة للمصروفات المتكررة</li>
              <li>• أضف ملاحظات مفيدة للمراجعة المستقبلية</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ExpenseForm;