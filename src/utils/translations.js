// src/utils/translations.js

// ترجمة أنواع العمليات (حسب مشروعك)
export const translateOperationType = (type) => {
  const translations = {
    // أنواع العمليات في مشروعك
    'printing': 'طباعة',
    'photocopying': 'تصوير',
    'lamination': 'تغليف',
    'binding': 'تجليد',
    'design': 'تصميم',
    'scanning': 'مسح ضوئي',
    'cutting': 'قص',
    'other': 'أخرى',
    
    // أنواع إضافية قد تكون موجودة
    'teaching': 'تدريس',
    'tutoring': 'تدريس خصوصي',
    'supervision': 'إشراف',
    'exam_supervision': 'مراقبة امتحانات',
    'correction': 'تصحيح',
    'preparation': 'تحضير',
    'meeting': 'اجتماع',
    'training': 'تدريب',
    'consultation': 'استشارة',
    'research': 'بحث',
    'workshop': 'ورشة عمل',
    'lecture': 'محاضرة',
    'lab': 'معمل',
    'practical': 'عملي',
    'theoretical': 'نظري',
    'field_work': 'عمل ميداني',
    'administrative': 'إداري',
    'evaluation': 'تقييم',
    'review': 'مراجعة',
    'extra_hours': 'ساعات إضافية',
    'substitute': 'بديل',
    'overtime': 'وقت إضافي',
    'bonus': 'مكافأة',
    'incentive': 'حافز',
    'allowance': 'بدل',
    'transport': 'مواصلات',
    'meal': 'وجبة',
    'accommodation': 'إقامة',
    'course': 'دورة',
    'seminar': 'ندوة',
    'conference': 'مؤتمر',
    'project': 'مشروع',
    'assignment': 'مهمة'
  };
  
  return translations[type] || type || '-';
};

// ترجمة طرق الدفع (حسب مشروعك)
export const translatePaymentMethod = (method) => {
  const translations = {
    // طرق الدفع في مشروعك
    'cash': 'نقدي',
    'bank_transfer': 'تحويل بنكي',
    'mobile_wallet': 'محفظة إلكترونية',
    'check': 'شيك',
    'credit_card': 'بطاقة ائتمان',
    
    // طرق دفع إضافية
    'cheque': 'شيك',
    'debit_card': 'بطاقة خصم',
    'electronic': 'إلكتروني',
    'online': 'أونلاين',
    'mobile_payment': 'دفع محمول',
    'wallet': 'محفظة إلكترونية',
    'paypal': 'باي بال',
    'fawry': 'فوري',
    'vodafone_cash': 'فودافون كاش',
    'orange_money': 'أورانج موني',
    'etisalat_cash': 'اتصالات كاش',
    'instapay': 'إنستاباي',
    'meeza': 'ميزة',
    'direct_deposit': 'إيداع مباشر',
    'wire_transfer': 'حوالة بنكية',
    'money_order': 'حوالة مالية',
    'postal_order': 'حوالة بريدية',
    'installment': 'قسط',
    'partial': 'جزئي',
    'advance': 'مقدم',
    'salary_deduction': 'خصم من الراتب',
    'bonus': 'مكافأة',
    'compensation': 'تعويض',
    'refund': 'استرداد',
    'adjustment': 'تسوية',
    'other': 'أخرى'
  };
  
  return translations[method] || method || '-';
};

// ترجمة حالة العملية (حسب مشروعك)
export const translateOperationStatus = (status) => {
  const translations = {
    'pending': 'في الانتظار',
    'completed': 'مكتمل',
    'approved': 'معتمد',
    'rejected': 'مرفوض',
    'cancelled': 'ملغي',
    'in_progress': 'قيد التنفيذ',
    'on_hold': 'في الانتظار',
    'draft': 'مسودة',
    'submitted': 'مرسل',
    'reviewed': 'تم المراجعة',
    'verified': 'تم التحقق',
    'paid': 'تم الدفع',
    'unpaid': 'غير مدفوع',
    'partial': 'جزئي',
    'overdue': 'متأخر'
  };
  
  return translations[status] || status || '-';
};

// ترجمة أحجام الورق
export const translatePaperSize = (size) => {
  const translations = {
    'A4': 'A4',
    'A3': 'A3', 
    'A5': 'A5',
    'Letter': 'رسالة',
    'Legal': 'قانوني'
  };
  
  return translations[size] || size || '-';
};

// ترجمة أنواع الطباعة
export const translatePrintType = (type) => {
  const translations = {
    'black_white': 'أبيض وأسود',
    'color': 'ملون',
    'photo': 'صور'
  };
  
  return translations[type] || type || '-';
};

// ترجمة حالة الدفع (حسب مشروعك)
export const translatePaymentStatus = (status) => {
  const translations = {
    // حالات الدفع في مشروعك
    'pending': 'في الانتظار',
    'completed': 'مكتمل',
    'partial': 'جزئي',
    'overdue': 'متأخر',
    
    // حالات إضافية
    'processed': 'تم المعالجة',
    'failed': 'فشل',
    'cancelled': 'ملغي',
    'refunded': 'تم الاسترداد',
    'authorized': 'مصرح',
    'captured': 'تم الاستلام',
    'settled': 'تم التسوية',
    'disputed': 'متنازع عليه',
    'chargeback': 'استرداد إجباري',
    'expired': 'منتهي الصلاحية',
    'declined': 'مرفوض',
    'voided': 'ملغي'
  };
  
  return translations[status] || status || '-';
};

// ترجمة نوع المصروف (حسب مشروعك)
export const translateExpenseType = (type) => {
  const translations = {
    // أنواع المصروفات في مشروعك
    'paper': 'ورق',
    'ink': 'أحبار',
    'maintenance': 'صيانة',
    'rent': 'إيجار',
    'supplies': 'مستلزمات',
    'other': 'أخرى',
    
    // أنواع مصروفات إضافية
    'office_supplies': 'مستلزمات مكتبية',
    'equipment': 'معدات',
    'software': 'برمجيات',
    'utilities': 'مرافق',
    'insurance': 'تأمين',
    'marketing': 'تسويق',
    'advertising': 'إعلان',
    'travel': 'سفر',
    'meals': 'وجبات',
    'training': 'تدريب',
    'conference': 'مؤتمر',
    'subscription': 'اشتراك',
    'license': 'ترخيص',
    'legal': 'قانوني',
    'accounting': 'محاسبة',
    'consulting': 'استشارة',
    'printing': 'طباعة',
    'shipping': 'شحن',
    'communication': 'اتصالات',
    'internet': 'إنترنت',
    'phone': 'هاتف',
    'cleaning': 'نظافة',
    'security': 'أمن',
    'fuel': 'وقود',
    'parking': 'مواقف',
    'tolls': 'رسوم طرق',
    'entertainment': 'ترفيه',
    'gifts': 'هدايا',
    'donations': 'تبرعات',
    'taxes': 'ضرائب',
    'fees': 'رسوم',
    'penalties': 'غرامات',
    'interest': 'فوائد',
    'depreciation': 'إهلاك',
    'amortization': 'استهلاك',
    'bad_debt': 'ديون معدومة',
    'miscellaneous': 'متنوع'
  };
  
  return translations[type] || type || '-';
};

// دالة عامة للترجمة مع التعامل مع القيم الفارغة
export const safeTranslate = (value, translationFunction) => {
  if (!value || value === '' || value === null || value === undefined) {
    return '-';
  }
  
  // إذا كانت القيمة بالعربية بالفعل، أرجعها كما هي
  if (/[\u0600-\u06FF]/.test(value)) {
    return value;
  }
  
  return translationFunction(value);
};

// تنظيف وتوحيد النصوص
export const normalizeText = (text) => {
  if (!text) return '-';
  
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, '_'); // توحيد الفواصل
};

// ترجمة ديناميكية للحقول
export const translateField = (value, fieldType) => {
  if (!value) return '-';
  
  const normalizedValue = normalizeText(value);
  
  switch (fieldType) {
    case 'operation_type':
      return safeTranslate(normalizedValue, translateOperationType);
    case 'payment_method':
      return safeTranslate(normalizedValue, translatePaymentMethod);
    case 'operation_status':
      return safeTranslate(normalizedValue, translateOperationStatus);
    case 'payment_status':
      return safeTranslate(normalizedValue, translatePaymentStatus);
    case 'expense_type':
      return safeTranslate(normalizedValue, translateExpenseType);
    case 'paper_size':
      return safeTranslate(normalizedValue, translatePaperSize);
    case 'print_type':
      return safeTranslate(normalizedValue, translatePrintType);
    default:
      return value || '-';
  }
};

// دالة شاملة للحصول على النص المترجم من constants
export const getTranslatedLabel = (value, constantsArray) => {
  if (!value || !constantsArray) return value || '-';
  
  const item = constantsArray.find(item => item.value === value);
  return item ? item.label : value;
};

// دالة للحصول على لون العنصر من constants
export const getItemColor = (value, constantsArray) => {
  if (!value || !constantsArray) return 'bg-gray-100';
  
  const item = constantsArray.find(item => item.value === value);
  return item ? item.color : 'bg-gray-100';
};

// دالة للحصول على أيقونة العنصر من constants
export const getItemIcon = (value, constantsArray) => {
  if (!value || !constantsArray) return '';
  
  const item = constantsArray.find(item => item.value === value);
  return item ? item.icon : '';
};