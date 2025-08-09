import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// تنسيق التاريخ
export const formatDate = (date, formatStr = 'yyyy/MM/dd') => {
  if (!date) return '';
  
  // التعامل مع Timestamp من Firebase
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  return format(dateObj, formatStr, { locale: ar });
};

// تنسيق التاريخ والوقت
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  return format(dateObj, 'yyyy/MM/dd HH:mm', { locale: ar });
};

// حساب المدة منذ التاريخ
export const timeAgo = (date) => {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: ar 
  });
};

// تنسيق الأرقام بالفاصلة العشرية
export const formatNumber = (number, decimals = 2) => {
  if (isNaN(number)) return '0';
  
  return Number(number).toLocaleString('ar-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// تنسيق العملة
export const formatCurrency = (amount, currency = 'EGP') => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount || 0);
};

// التحقق من صحة البريد الإلكتروني
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// التحقق من صحة رقم الهاتف المصري
export const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') return true; // اختياري، يسمح بتركه فارغًا
  const phoneRegex = /^(010|011|012|015)\d{8}$/;
  return phoneRegex.test(phone);
};

// إنشاء ID عشوائي
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// تنظيف النص
export const sanitizeText = (text) => {
  if (!text) return '';
  
  return text
    .split('\n') // قسم السطور
    .map(line => line.trim()) // شيل المسافات الزايدة من أول وآخر كل سطر
    .join('\n'); // رجّعها زي ما كانت
};
// تحويل التاريخ إلى ISO string للإدخال
export const dateToInputValue = (date) => {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  return dateObj.toISOString().split('T')[0];
};

// تحويل التاريخ والوقت إلى datetime-local input
export const dateTimeToInputValue = (date) => {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  return dateObj.toISOString().slice(0, 16);
};

// البحث في النصوص باللغة العربية
export const searchInText = (text, searchTerm) => {
  if (!text || !searchTerm) return false;
  
  const normalizedText = text.toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return normalizedText.includes(normalizedSearch);
};

// ترتيب المصفوفات حسب خاصية معينة
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

// تجميع المصفوفات حسب خاصية معينة
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

// حساب مجموع قيم في مصفوفة
export const sumBy = (array, key) => {
  return array.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
};

// التحقق من كون الجهاز محمول
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// التحقق من كون الشاشة صغيرة
export const isSmallScreen = () => {
  return window.innerWidth < 768;
};

// حفظ في التخزين المحلي
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// قراءة من التخزين المحلي
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// حذف من التخزين المحلي
export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// تأخير التنفيذ
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// نسخ النص إلى الحافظة
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback للمتصفحات القديمة
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

// التحقق من الاتصال بالإنترنت
export const isOnline = () => {
  return navigator.onLine;
};