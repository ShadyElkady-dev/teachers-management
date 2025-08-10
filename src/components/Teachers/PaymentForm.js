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
    console.log('🔍 PaymentForm: useEffect triggered');
    console.log('  - payment:', payment);
    console.log('  - teacher:', teacher);
    
    if (payment) {
      try {
        const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
        
        // التحقق من صحة التاريخ
        const validDate = isNaN(paymentDate.getTime()) ? new Date() : paymentDate;
        
        const newFormData = {
          teacherId: payment.teacherId || teacher?.id || '',
          amount: payment.amount?.toString() || '',
          paymentMethod: payment.paymentMethod || 'cash',
          paymentDate: dateToInputValue(validDate),
          paymentTime: timeToInputValue(validDate),
          notes: payment.notes || '',
          reference: payment.reference || ''
        };
        
        console.log('✅ PaymentForm: Setting form data from payment:', newFormData);
        setFormData(newFormData);
      } catch (error) {
        console.error('Error processing payment data:', error);
        const now = new Date();
        setFormData({
          teacherId: payment.teacherId || teacher?.id || '',
          amount: payment.amount?.toString() || '',
          paymentMethod: payment.paymentMethod || 'cash',
          paymentDate: dateToInputValue(now),
          paymentTime: timeToInputValue(now),
          notes: payment.notes || '',
          reference: payment.reference || ''
        });
      }
    } else if (teacher) {
      // عند إضافة دفعة جديدة للمدرس المحدد
      const now = new Date();
      const newFormData = {
        teacherId: teacher.id,
        amount: '',
        paymentMethod: 'cash',
        paymentDate: dateToInputValue(now),
        paymentTime: timeToInputValue(now),
        notes: '',
        reference: ''
      };
      
      console.log('✅ PaymentForm: Setting form data for new payment:', newFormData);
      setFormData(newFormData);
    } else {
      // إعادة تعيين النموذج مع الوقت الحالي
      const now = new Date();
      setFormData({
        teacherId: '',
        amount: '',
        paymentMethod: 'cash',
        paymentDate: dateToInputValue(now),
        paymentTime: timeToInputValue(now),
        notes: '',
        reference: ''
      });
    }
  }, [payment, teacher]);

  // تحديث المدرس المحدد عند تغيير teacherId
  useEffect(() => {
    console.log('🔍 PaymentForm: teacherId changed:', formData.teacherId);
    
    if (formData.teacherId) {
      const foundTeacher = teachers.find(t => t.id === formData.teacherId);
      console.log('✅ PaymentForm: Found teacher:', foundTeacher);
      setSelectedTeacher(foundTeacher);
    } else {
      setSelectedTeacher(null);
    }
  }, [formData.teacherId, teachers]);

  // مراقبة تغييرات الحالة للتشخيص
  useEffect(() => {
    console.log('🔍 PaymentForm: State monitoring');
    console.log('  - formData.teacherId:', formData.teacherId);
    console.log('  - teacher prop:', teacher?.id);
    console.log('  - selectedTeacher:', selectedTeacher?.id);
  }, [formData.teacherId, teacher, selectedTeacher]);

  // حساب المديونية للمدرس المحدد
  const teacherDebt = selectedTeacher ? calculateTeacherDebt(selectedTeacher.id) : 0;

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};

    // المدرس - التحقق المحسن
    if (!formData.teacherId || formData.teacherId.trim() === '') {
      newErrors.teacherId = 'اختيار المدرس مطلوب';
    }

    // المبلغ
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
    } else if (parseFloat(formData.amount) > 999999) {
      newErrors.amount = 'المبلغ كبير جداً';
    }

    // طريقة الدفع
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'طريقة الدفع مطلوبة';
    }

    // تاريخ الدفع
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'تاريخ الدفع مطلوب';
    } else {
      const selectedDate = new Date(formData.paymentDate);
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      
      if (selectedDate > today) {
        newErrors.paymentDate = 'لا يمكن أن يكون تاريخ الدفع في المستقبل';
      } else if (selectedDate < oneYearAgo) {
        newErrors.paymentDate = 'تاريخ الدفع قديم جداً';
      }
    }

    // وقت الدفع
    if (!formData.paymentTime) {
      newErrors.paymentTime = 'وقت الدفع مطلوب';
    }

    // المرجع (اختياري ولكن إذا تم إدخاله يجب أن يكون صحيحاً)
    if (formData.reference && formData.reference.trim().length < 3) {
      newErrors.reference = 'المرجع يجب أن يكون أكثر من 3 أحرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // معالجة تغيير القيم
  const handleChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'amount') {
      processedValue = value.replace(/[^0-9.]/g, '');
    }

    console.log(`🔍 PaymentForm: Field ${field} changed to:`, processedValue);

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

    // تنظيف النص عند الخروج من الحقل
    if (field === 'notes' || field === 'reference') {
      setFormData(prev => ({
        ...prev,
        [field]: sanitizeText(prev[field])
      }));
    }
  };

  // معالجة إرسال النموذج - المحسن
  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('🔍 PaymentForm: Form submitted');
    console.log('🔍 PaymentForm: Current formData:', formData);
    console.log('🔍 PaymentForm: Teacher prop:', teacher);
    
    // تعيين جميع الحقول كـ touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (validateForm()) {
      // تحديد teacherId بوضوح
      let finalTeacherId = null;
      
      // جرب من formData أولاً
      if (formData.teacherId && formData.teacherId !== '') {
        finalTeacherId = formData.teacherId;
        console.log('✅ PaymentForm: Using teacherId from formData:', finalTeacherId);
      }
      // إذا لم يوجد، جرب من teacher prop
      else if (teacher?.id) {
        finalTeacherId = teacher.id;
        console.log('✅ PaymentForm: Using teacherId from teacher prop:', finalTeacherId);
      }
      
      console.log('🔍 PaymentForm: Final teacherId:', finalTeacherId);
      
      if (!finalTeacherId) {
        const error = 'لا يمكن تحديد المدرس المطلوب';
        console.error('❌ PaymentForm:', error);
        setErrors(prev => ({ 
          ...prev, 
          teacherId: error 
        }));
        return;
      }

      // دمج التاريخ والوقت
      let finalPaymentDate;
      
      if (formData.paymentTime) {
        const [hours, minutes] = formData.paymentTime.split(':');
        finalPaymentDate = new Date(formData.paymentDate);
        finalPaymentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        finalPaymentDate = new Date(formData.paymentDate);
      }

      // إنشاء البيانات النهائية - تنظيف من undefined
      const paymentData = {
        teacherId: finalTeacherId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentDate: finalPaymentDate
      };

      // إضافة البيانات الاختيارية فقط إذا كانت موجودة
      if (formData.notes && formData.notes.trim()) {
        paymentData.notes = formData.notes.trim();
      }

      if (formData.reference && formData.reference.trim()) {
        paymentData.reference = formData.reference.trim();
      }

      console.log('✅ PaymentForm: Sending payment data:', paymentData);
      
      // التحقق النهائي من عدم وجود undefined
      const hasUndefined = Object.entries(paymentData).some(([key, value]) => {
        if (value === undefined) {
          console.error(`❌ PaymentForm: ${key} is undefined!`);
          return true;
        }
        return false;
      });
      
      if (hasUndefined) {
        console.error('❌ PaymentForm: Payment data contains undefined values');
        return;
      }

      onSave(paymentData);
    } else {
      console.error('❌ PaymentForm: Form validation failed:', errors);
    }
  };

  // تحديد ما إذا كان الحقل يحتوي على خطأ
  const hasError = (field) => {
    return touched[field] && errors[field];
  };

  // دفع المبلغ الكامل للمديونية
  const handlePayFullDebt = () => {
    if (teacherDebt > 0) {
      handleChange('amount', teacherDebt.toString());
    }
  };

  // دفع نصف المبلغ
  const handlePayHalfDebt = () => {
    if (teacherDebt > 0) {
      const halfAmount = (teacherDebt / 2).toFixed(2);
      handleChange('amount', halfAmount);
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
          value={formData.teacherId}
          onChange={(e) => handleChange('teacherId', e.target.value)}
          onBlur={() => handleBlur('teacherId')}
          className={`input ${hasError('teacherId') ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={loading || (teacher && !payment)}
        >
          <option value="">اختر المدرس</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name} - {teacher.phone}
            </option>
          ))}
        </select>
        {hasError('teacherId') && (
          <p className="mt-1 text-sm text-red-600">{errors.teacherId}</p>
        )}
        
        {/* عرض معلومات إضافية للمطور */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-1 text-xs text-gray-500">
            Debug: teacherId = {formData.teacherId || 'undefined'}, teacher prop = {teacher?.id || 'undefined'}
          </div>
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

          {/* أزرار دفع سريع */}
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
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          onBlur={() => handleBlur('amount')}
          className={`input ${hasError('amount') ? 'border-red-500 focus:border-red-500' : ''} font-bold text-lg`}
          placeholder="0.00"
          disabled={loading}
          autoFocus
        />
        {hasError('amount') && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
        
        {/* معاينة الرصيد بعد الدفع */}
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
          value={formData.paymentMethod}
          onChange={(e) => handleChange('paymentMethod', e.target.value)}
          onBlur={() => handleBlur('paymentMethod')}
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
            value={formData.paymentDate}
            onChange={(e) => handleChange('paymentDate', e.target.value)}
            onBlur={() => handleBlur('paymentDate')}
            className={`input ${hasError('paymentDate') ? 'border-red-500 focus:border-red-500' : ''}`}
            disabled={loading}
          />
          {hasError('paymentDate') && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="paymentTime" className="block text-sm font-medium text-gray-700 mb-2">
            وقت الدفع <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="paymentTime"
            value={formData.paymentTime}
            onChange={(e) => handleChange('paymentTime', e.target.value)}
            onBlur={() => handleBlur('paymentTime')}
            className={`input ${hasError('paymentTime') ? 'border-red-500 focus:border-red-500' : ''}`}
            disabled={loading}
          />
          {hasError('paymentTime') && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentTime}</p>
          )}
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
          value={formData.reference}
          onChange={(e) => handleChange('reference', e.target.value)}
          onBlur={() => handleBlur('reference')}
          className={`input ${hasError('reference') ? 'border-red-500 focus:border-red-500' : ''}`}
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
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          onBlur={() => handleBlur('notes')}
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

      {/* معلومات مساعدة */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-lg">💡</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">نصائح:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• استخدم أزرار الدفع السريع لسداد المديونية كاملة أو جزئياً</li>
              <li>• تأكد من تسجيل طريقة الدفع الصحيحة للمتابعة</li>
              <li>• أضف رقم المرجع إذا كان لديك إيصال أو مرجع رسمي</li>
              <li>• يمكنك دفع أكثر من المديونية (دفع مقدم)</li>
              <li>• الوقت الحالي يُضاف تلقائياً ويمكن تعديله</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;