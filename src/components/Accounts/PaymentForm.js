import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { dateToInputValue, formatCurrency, sanitizeText } from '../../utils/helpers';
import { PAYMENT_METHODS } from '../../utils/constants';
import LoadingSpinner from '../Common/LoadingSpinner';

// دالة مساعدة لتحويل الوقت إلى تنسيق input time (محسنة)
const timeToInputValue = (date) => {
  if (!date) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error in timeToInputValue:', error);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};

const PaymentForm = ({ 
  payment = null, 
  teacher = null,
  teachers = [],
  onSave, 
  onCancel, 
  loading = false 
}) => {
  const { calculateTeacherDebt } = useAppContext();
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    teacherId: teacher?.id || '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: dateToInputValue(new Date()),
    paymentTime: timeToInputValue(new Date()),
    notes: '',
    reference: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedTeacher, setSelectedTeacher] = useState(teacher);

  // تعبئة النموذج عند التعديل
  useEffect(() => {
    if (payment) {
      try {
        const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
        const validDate = isNaN(paymentDate.getTime()) ? new Date() : paymentDate;
        
        setFormData({
          teacherId: payment.teacherId || teacher?.id || '',
          amount: payment.amount?.toString() || '',
          paymentMethod: payment.paymentMethod || 'cash',
          paymentDate: dateToInputValue(validDate),
          paymentTime: timeToInputValue(validDate),
          notes: payment.notes || '',
          reference: payment.reference || ''
        });
      } catch (error) {
        console.error('Error processing payment data:', error);
        const now = new Date();
        setFormData(prev => ({
            ...prev,
            paymentDate: dateToInputValue(now),
            paymentTime: timeToInputValue(now),
        }));
      }
    } else {
      const now = new Date();
      setFormData(prev => ({
        ...prev,
        teacherId: teacher?.id || '',
        paymentDate: dateToInputValue(now),
        paymentTime: timeToInputValue(now),
      }));
    }
  }, [payment, teacher]);

  // تحديث المدرس المحدد
  useEffect(() => {
    if (formData.teacherId) {
      const foundTeacher = teachers.find(t => t.id === formData.teacherId);
      setSelectedTeacher(foundTeacher);
    } else {
      setSelectedTeacher(null);
    }
  }, [formData.teacherId, teachers]);

  const teacherDebt = selectedTeacher ? calculateTeacherDebt(selectedTeacher.id) : 0;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.teacherId) newErrors.teacherId = 'اختيار المدرس مطلوب';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    if (parseFloat(formData.amount) > 999999) newErrors.amount = 'المبلغ كبير جداً';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'طريقة الدفع مطلوبة';
    if (!formData.paymentDate) newErrors.paymentDate = 'تاريخ الدفع مطلوب';
    if (!formData.paymentTime) newErrors.paymentTime = 'وقت الدفع مطلوب';

    if (formData.reference && formData.reference.trim().length < 3) {
      newErrors.reference = 'المرجع يجب أن يكون أكثر من 3 أحرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'amount' ? value.replace(/[^0-9.]/g, '') : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    if (name === 'notes' || name === 'reference') {
        setFormData(prev => ({ ...prev, [name]: sanitizeText(prev[name]) }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(Object.keys(formData).reduce((acc, key) => ({...acc, [key]: true}), {}));

    if (validateForm()) {
        const [hours, minutes] = formData.paymentTime.split(':');
        const finalPaymentDate = new Date(formData.paymentDate);
        finalPaymentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const dataToSave = {
            teacherId: formData.teacherId,
            amount: parseFloat(formData.amount),
            paymentMethod: formData.paymentMethod,
            paymentDate: finalPaymentDate,
            notes: formData.notes.trim(),
            reference: formData.reference.trim()
        };
        onSave(dataToSave);
    }
  };

  const hasError = (field) => touched[field] && errors[field];

  const handlePayFullDebt = () => {
    if (teacherDebt > 0) {
      setFormData(prev => ({...prev, amount: teacherDebt.toString()}));
    }
  };

  const handlePayHalfDebt = () => {
    if (teacherDebt > 0) {
      setFormData(prev => ({...prev, amount: (teacherDebt / 2).toFixed(2)}));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* اختيار المدرس */}
      <div>
        <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-2">
          المدرس <span className="text-red-500">*</span>
        </label>
        <select
          id="teacherId"
          name="teacherId"
          value={formData.teacherId}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`input ${hasError('teacherId') ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={loading || (teacher && !payment)}
        >
          <option value="">اختر المدرس</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} - {t.phone}
            </option>
          ))}
        </select>
        {hasError('teacherId') && (
          <p className="mt-1 text-sm text-red-600">{errors.teacherId}</p>
        )}
      </div>

      {/* معلومات المدرس المحدد */}
      {selectedTeacher && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{selectedTeacher.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">{selectedTeacher.name}</h3>
                <p className="text-sm text-blue-700">{selectedTeacher.phone}</p>
              </div>
            </div>
            
            <div className="text-left">
              <div className={`text-lg font-bold ${
                teacherDebt > 0 ? 'text-red-600' :
                teacherDebt === 0 ? 'text-green-600' : 'text-blue-600'
              }`}>
                {formatCurrency(Math.abs(teacherDebt))}
              </div>
              <div className="text-xs text-blue-600">
                {teacherDebt > 0 ? 'مديونية' :
                 teacherDebt === 0 ? 'مسدد' : 'دفع زائد'}
              </div>
            </div>
          </div>

          {teacherDebt > 0 && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={handlePayFullDebt}
                className="btn btn-success btn-sm"
              >
                دفع كامل ({formatCurrency(teacherDebt)})
              </button>
              <button
                type="button"
                onClick={handlePayHalfDebt}
                className="btn btn-warning btn-sm"
              >
                دفع نصف ({formatCurrency(teacherDebt / 2)})
              </button>
            </div>
          )}
        </div>
      )}

      {/* المبلغ */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          مبلغ الدفعة (جنيه) <span className="text-red-500">*</span>
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
          autoFocus
        />
        {hasError('amount') && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
        
        {selectedTeacher && formData.amount && (
          <div className="mt-2 p-2 bg-gray-50 rounded border">
            <div className="text-sm text-gray-600">
              الرصيد بعد الدفع: 
              <span className={`font-semibold mr-1 ${
                (teacherDebt - parseFloat(formData.amount)) > 0 ? 'text-red-600' :
                (teacherDebt - parseFloat(formData.amount)) === 0 ? 'text-green-600' : 'text-blue-600'
              }`}>
                {formatCurrency(Math.abs(teacherDebt - parseFloat(formData.amount)))}
                {teacherDebt - parseFloat(formData.amount) > 0 ? ' (مديونية)' :
                 teacherDebt - parseFloat(formData.amount) === 0 ? ' (مسدد)' : ' (دفع زائد)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* طريقة الدفع */}
      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
          طريقة الدفع <span className="text-red-500">*</span>
        </label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`input ${hasError('paymentMethod') ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={loading}
        >
          {PAYMENT_METHODS.map(method => (
            <option key={method.value} value={method.value}>
              {method.icon} {method.label}
            </option>
          ))}
        </select>
        {hasError('paymentMethod') && (
          <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
        )}
      </div>

      {/* حقلي التاريخ والوقت */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
            تاريخ الدفع <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="paymentDate"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input ${hasError('paymentDate') ? 'border-red-500' : ''}`}
            disabled={loading}
          />
          {hasError('paymentDate') && <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>}
        </div>

        <div>
          <label htmlFor="paymentTime" className="block text-sm font-medium text-gray-700 mb-2">
            وقت الدفع <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="paymentTime"
            name="paymentTime"
            value={formData.paymentTime}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input ${hasError('paymentTime') ? 'border-red-500' : ''}`}
            disabled={loading}
          />
          {hasError('paymentTime') && <p className="mt-1 text-sm text-red-600">{errors.paymentTime}</p>}
        </div>
      </div>

      {/* رقم المرجع */}
      <div>
        <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
          رقم المرجع
        </label>
        <input
          type="text"
          id="reference"
          name="reference"
          value={formData.reference}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`input ${hasError('reference') ? 'border-red-500' : ''}`}
          placeholder="رقم الإيصال أو المرجع"
          disabled={loading}
        />
        {hasError('reference') && (
          <p className="mt-1 text-sm text-red-600">{errors.reference}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          اختياري - يمكن إدخال رقم الإيصال أو أي مرجع آخر
        </p>
      </div>

      {/* ملاحظات */}
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
          placeholder="أي ملاحظات إضافية حول الدفعة"
          disabled={loading}
          rows="3"
        />
      </div>

      {/* ملخص الدفعة */}
      {formData.amount && selectedTeacher && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">ملخص الدفعة</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700">المدرس:</span>
              <span className="font-medium mr-2">{selectedTeacher.name}</span>
            </div>
            <div>
              <span className="text-green-700">طريقة الدفع:</span>
              <span className="font-medium mr-2">
                {PAYMENT_METHODS.find(m => m.value === formData.paymentMethod)?.label}
              </span>
            </div>
            <div>
              <span className="text-green-700">المبلغ:</span>
              <span className="font-bold text-lg mr-2 text-green-900">
                {formatCurrency(parseFloat(formData.amount) || 0)}
              </span>
            </div>
            <div>
              <span className="text-green-700">التاريخ والوقت:</span>
              <span className="font-medium mr-2">
                {new Date(formData.paymentDate + 'T' + formData.paymentTime).toLocaleString('ar-EG')}
              </span>
            </div>
          </div>
        </div>
      )}

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
          disabled={loading || !formData.teacherId || !formData.amount}
          className="flex-1 btn btn-primary"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <LoadingSpinner size="small" color="white" />
              {payment ? 'جاري التحديث...' : 'جاري الحفظ...'}
            </div>
          ) : (
            payment ? 'تحديث الدفعة' : 'تسجيل الدفعة'
          )}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;