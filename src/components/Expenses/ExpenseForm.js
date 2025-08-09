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

    if (!formData.type) {
      newErrors.type = 'نوع المصروف مطلوب';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'وصف المصروف مطلوب';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'وصف المصروف يجب أن يكون أكثر من 3 أحرف';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    } else if (parseFloat(formData.amount) > 999999) {
      newErrors.amount = 'المبلغ كبير جداً';
    }
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

  // معالجة تغيير القيم (تم التعديل هنا)
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
        setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9.]/g, '') }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // معالجة التركيز على الحقل (تم التعديل هنا)
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // تنظيف النص عند الخروج من الحقل فقط
    if (name === 'description' || name === 'notes') {
        setFormData(prev => ({
            ...prev,
            [name]: sanitizeText(prev[name])
        }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const allTouched = Object.keys(formData).reduce((acc, key) => ({...acc, [key]: true}), {});
    setTouched(allTouched);

    if (validateForm()) {
      onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate)
      });
    }
  };

  const hasError = (field) => touched[field] && errors[field];
  const selectedExpenseType = EXPENSE_TYPES.find(type => type.value === formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          نوع المصروف <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          onBlur={handleBlur}
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

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          وصف المصروف <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`input ${hasError('description') ? 'border-red-500 focus:border-red-500' : ''}`}
          placeholder="وصف تفصيلي للمصروف"
          disabled={loading}
          rows="3"
        />
        {hasError('description') && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          المبلغ (جنيه) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`input ${hasError('amount') ? 'border-red-500 focus:border-red-500' : ''} font-bold text-lg`}
          placeholder="0.00"
          disabled={loading}
        />
        {hasError('amount') && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
      </div>

      <div>
        <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-2">
          تاريخ المصروف <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="expenseDate"
          name="expenseDate"
          value={formData.expenseDate}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`input ${hasError('expenseDate') ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={loading}
        />
        {hasError('expenseDate') && (
          <p className="mt-1 text-sm text-red-600">{errors.expenseDate}</p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          ملاحظات
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          className="input min-h-[80px] resize-y"
          placeholder="أي ملاحظات إضافية حول المصروف"
          disabled={loading}
          rows="3"
        />
      </div>

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
    </form>
  );
};

export default ExpenseForm;