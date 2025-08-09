// أنواع العمليات
export const OPERATION_TYPES = [
  { value: 'printing', label: 'طباعة', color: 'bg-blue-500' },
  { value: 'photocopying', label: 'تصوير', color: 'bg-green-500' },
  { value: 'lamination', label: 'تغليف', color: 'bg-yellow-500' },
  { value: 'binding', label: 'تجليد', color: 'bg-purple-500' },
  { value: 'design', label: 'تصميم', color: 'bg-pink-500' },
  { value: 'scanning', label: 'مسح ضوئي', color: 'bg-indigo-500' },
  { value: 'cutting', label: 'قص', color: 'bg-red-500' },
  { value: 'other', label: 'أخرى', color: 'bg-gray-500' }
];

// أنواع المصروفات
export const EXPENSE_TYPES = [
  { value: 'paper', label: 'ورق', color: 'bg-blue-100' },
  { value: 'ink', label: 'أحبار', color: 'bg-purple-100' },
  { value: 'maintenance', label: 'صيانة', color: 'bg-red-100' },
  { value: 'rent', label: 'إيجار', color: 'bg-green-100' },
  { value: 'supplies', label: 'مستلزمات', color: 'bg-indigo-100' },
  { value: 'other', label: 'أخرى', color: 'bg-gray-100' }
];

// حالات الدفع
export const PAYMENT_STATUS = [
  { value: 'pending', label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'مكتمل', color: 'bg-green-100 text-green-800' },
  { value: 'partial', label: 'جزئي', color: 'bg-blue-100 text-blue-800' },
  { value: 'overdue', label: 'متأخر', color: 'bg-red-100 text-red-800' }
];

// طرق الدفع
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي', icon: '💵' },
  { value: 'bank_transfer', label: 'تحويل بنكي', icon: '🏦' },
  { value: 'mobile_wallet', label: 'محفظة إلكترونية', icon: '📱' },
  { value: 'check', label: 'شيك', icon: '📋' },
  { value: 'credit_card', label: 'بطاقة ائتمان', icon: '💳' }
];

// أحجام الورق
export const PAPER_SIZES = [
  { value: 'A4', label: 'A4', price: 0.5 },
  { value: 'A3', label: 'A3', price: 1.0 },
  { value: 'A5', label: 'A5', price: 0.25 },
  { value: 'Letter', label: 'Letter', price: 0.5 },
  { value: 'Legal', label: 'Legal', price: 0.75 }
];

// أنواع الطباعة
export const PRINT_TYPES = [
  { value: 'black_white', label: 'أبيض وأسود', multiplier: 1 },
  { value: 'color', label: 'ملون', multiplier: 3 },
  { value: 'photo', label: 'صور', multiplier: 5 }
];

// التنبيهات والرسائل
export const MESSAGES = {
  SUCCESS: {
    TEACHER_ADDED: 'تم إضافة المدرس بنجاح',
    TEACHER_UPDATED: 'تم تحديث بيانات المدرس بنجاح',
    TEACHER_DELETED: 'تم حذف المدرس بنجاح',
    OPERATION_ADDED: 'تم إضافة العملية بنجاح',
    OPERATION_UPDATED: 'تم تحديث العملية بنجاح',
    OPERATION_DELETED: 'تم حذف العملية بنجاح',
    PAYMENT_ADDED: 'تم تسجيل الدفعة بنجاح',
    PAYMENT_UPDATED: 'تم تحديث الدفعة بنجاح',
    PAYMENT_DELETED: 'تم حذف الدفعة بنجاح',
    EXPENSE_ADDED: 'تم إضافة المصروف بنجاح',
    EXPENSE_UPDATED: 'تم تحديث المصروف بنجاح',
    EXPENSE_DELETED: 'تم حذف المصروف بنجاح',
    DATA_COPIED: 'تم نسخ البيانات بنجاح',
    DATA_EXPORTED: 'تم تصدير البيانات بنجاح'
  },
  ERROR: {
    GENERAL: 'حدث خطأ غير متوقع',
    NETWORK: 'خطأ في الاتصال بالإنترنت',
    VALIDATION: 'يرجى التحقق من البيانات المدخلة',
    UNAUTHORIZED: 'غير مصرح لك بهذا الإجراء',
    NOT_FOUND: 'البيانات غير موجودة',
    SERVER_ERROR: 'خطأ في الخادم'
  },
  CONFIRM: {
    DELETE_TEACHER: 'هل أنت متأكد من حذف هذا المدرس؟ سيتم حذف جميع العمليات والمدفوعات المرتبطة به.',
    DELETE_OPERATION: 'هل أنت متأكد من حذف هذه العملية؟',
    DELETE_PAYMENT: 'هل أنت متأكد من حذف هذه الدفعة؟',
    DELETE_EXPENSE: 'هل أنت متأكد من حذف هذا المصروف؟',
    CLEAR_ALL: 'هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.'
  }
};

// إعدادات التطبيق
export const APP_CONFIG = {
  NAME: 'إدارة حسابات المدرسين',
  VERSION: '2.0.0',
  AUTHOR: 'شادي القاضى',
  CURRENCY: 'جنيه مصري',
  CURRENCY_SYMBOL: 'ج.م',
  LANGUAGE: 'ar',
  DIRECTION: 'rtl',
  THEME: {
    PRIMARY: 'blue',
    SECONDARY: 'gray',
    SUCCESS: 'green',
    WARNING: 'yellow',
    ERROR: 'red',
    INFO: 'indigo'
  }
};

// إعدادات الصفحات
export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

// إعدادات التصدير
export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'excel', label: 'Excel', icon: '📊' },
  { value: 'csv', label: 'CSV', icon: '📋' }
];

// أقسام التطبيق المُحدثة
export const APP_SECTIONS = [
  {
    id: 'dashboard',
    name: 'لوحة التحكم',
    icon: '📊',
    path: '/dashboard',
    description: 'نظرة شاملة على النظام',
    color: 'blue'
  },
  {
    id: 'teachers',
    name: 'المدرسين',
    icon: '👨‍🏫',
    path: '/teachers',
    description: 'إدارة المدرسين',
    color: 'indigo'
  },
  {
    id: 'operations',
    name: 'العمليات',
    icon: '📝',
    path: '/operations',
    description: 'إدارة العمليات',
    color: 'green'
  },
  {
    id: 'accounts',
    name: 'الحسابات',
    icon: '💰',
    path: '/accounts',
    description: 'المدفوعات والديون',
    color: 'purple'
  },
  {
    id: 'expenses',
    name: 'المصروفات',
    icon: '💸',
    path: '/expenses',
    description: 'المصروفات الخاصة',
    color: 'red'
  }
];

// إعدادات الإشعارات
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// أنواع التقارير
export const REPORT_TYPES = [
  { value: 'teacher_detailed', label: 'تقرير مفصل للمدرس' },
  { value: 'teacher_summary', label: 'ملخص حسابات المدرسين' },
  { value: 'operations_summary', label: 'ملخص العمليات' },
  { value: 'financial_report', label: 'تقرير مالي شامل' },
];

// قوالب التقارير
export const REPORT_TEMPLATES = {
  TEACHER_DETAILED: 'teacher_detailed',
  FINANCIAL_SUMMARY: 'financial_summary',
};

// حدود التطبيق
export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_TEACHERS: 1000,
  MAX_OPERATIONS_PER_TEACHER: 10000,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999.99
};

// أنماط التاريخ
export const DATE_FORMATS = {
  DISPLAY: 'yyyy/MM/dd',
  DISPLAY_WITH_TIME: 'yyyy/MM/dd HH:mm',
  INPUT: 'yyyy-MM-dd',
  INPUT_WITH_TIME: 'yyyy-MM-ddTHH:mm',
  EXPORT: 'yyyy-MM-dd_HH-mm-ss'
};

// إعدادات الشبكة
export const NETWORK_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// حالات التحميل
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// أولويات المهام
export const TASK_PRIORITIES = [
  { value: 'low', label: 'منخفضة', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'متوسطة', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'عالية', color: 'bg-red-100 text-red-800' },
  { value: 'urgent', label: 'عاجلة', color: 'bg-purple-100 text-purple-800' }
];

// إعدادات الرسوم البيانية
export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
  '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

// إعدادات الملاحة السفلية للجوال
export const MOBILE_NAV_ITEMS = [
  { 
    id: 'dashboard', 
    icon: '📊', 
    label: 'الرئيسية', 
    path: '/dashboard' 
  },
  { 
    id: 'teachers', 
    icon: '👨‍🏫', 
    label: 'المدرسين', 
    path: '/teachers' 
  },
  { 
    id: 'operations', 
    icon: '📝', 
    label: 'العمليات', 
    path: '/operations' 
  },
  { 
    id: 'accounts', 
    icon: '💰', 
    label: 'الحسابات', 
    path: '/accounts',
    adminOnly: true 
  },
  { 
    id: 'expenses', 
    icon: '💸', 
    label: 'المصروفات', 
    path: '/expenses',
    adminOnly: true 
  }
];

// إعدادات البحث
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  SEARCH_DEBOUNCE: 300, // milliseconds
  MAX_SUGGESTIONS: 10
};

// إعدادات التنبيهات
export const ALERT_THRESHOLDS = {
  HIGH_DEBT: 1000, // الدين العالي
  LOW_OPERATIONS: 5, // عدد العمليات المنخفض
  OLD_PAYMENT: 30 // عدد الأيام للدفعة القديمة
};

export default {
  OPERATION_TYPES,
  EXPENSE_TYPES,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PAPER_SIZES,
  PRINT_TYPES,
  MESSAGES,
  APP_CONFIG,
  PAGE_SIZES,
  DEFAULT_PAGE_SIZE,
  EXPORT_FORMATS,
  APP_SECTIONS,
  NOTIFICATION_TYPES,
  LIMITS,
  DATE_FORMATS,
  NETWORK_CONFIG,
  LOADING_STATES,
  TASK_PRIORITIES,
  CHART_COLORS,
  MOBILE_NAV_ITEMS,
  SEARCH_CONFIG,
  ALERT_THRESHOLDS
};