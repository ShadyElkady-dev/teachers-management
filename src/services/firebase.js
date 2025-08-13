import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5oxzCvdD70oZJW3LfsokgzofaMMI9Hf0",
  authDomain: "teachers-management-syst-7e866.firebaseapp.com",
  projectId: "teachers-management-syst-7e866",
  storageBucket: "teachers-management-syst-7e866.firebasestorage.app",
  messagingSenderId: "995554251925",
  appId: "1:995554251925:web:6ced0edd2325e7b79d779c",
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// دالة مساعدة لتنظيف البيانات من undefined values
const cleanData = (data) => {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const cleaned = {};
  Object.entries(data).forEach(([key, value]) => {
    // إزالة القيم التي هي undefined أو null أو string فارغ
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// دالة مساعدة للتعامل مع الأخطاء
const handleFirestoreError = (error, operation) => {
  console.error(`❌ Firebase Error in ${operation}:`, error);
  
  if (error.code === 'permission-denied') {
    throw new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
  } else if (error.code === 'unavailable') {
    throw new Error('الخدمة غير متاحة حالياً، يرجى المحاولة لاحقاً');
  } else if (error.code === 'invalid-argument') {
    throw new Error('البيانات المدخلة غير صحيحة');
  } else if (error.code === 'not-found') {
    throw new Error('العنصر المطلوب غير موجود');
  } else {
    throw new Error(`حدث خطأ في ${operation}: ${error.message}`);
  }
};

// خدمات المدرسين
export const teachersService = {
  // إضافة مدرس جديد
  addTeacher: async (teacherData) => {
    try {
      console.log('🔍 Firebase: Adding teacher:', teacherData);
      
      const cleanedData = cleanData({
        ...teacherData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Firebase: Clean teacher data:', cleanedData);
      
      const docRef = await addDoc(collection(db, 'teachers'), cleanedData);
      console.log('✅ Firebase: Teacher added with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, 'إضافة المدرس');
    }
  },

  // تحديث بيانات مدرس
  updateTeacher: async (teacherId, updateData) => {
    try {
      console.log('🔄 Firebase: Updating teacher:', teacherId, updateData);
      
      const cleanedData = cleanData({
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      const teacherRef = doc(db, 'teachers', teacherId);
      await updateDoc(teacherRef, cleanedData);
      
      console.log('✅ Firebase: Teacher updated:', teacherId);
    } catch (error) {
      handleFirestoreError(error, 'تحديث المدرس');
    }
  },

  // حذف مدرس
  deleteTeacher: async (teacherId) => {
    try {
      console.log('🗑️ Firebase: Deleting teacher:', teacherId);
      
      await deleteDoc(doc(db, 'teachers', teacherId));
      
      console.log('✅ Firebase: Teacher deleted:', teacherId);
    } catch (error) {
      handleFirestoreError(error, 'حذف المدرس');
    }
  },

  // الاستماع لتغييرات المدرسين
  subscribeToTeachers: (callback) => {
    try {
      const q = query(collection(db, 'teachers'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, callback, (error) => {
        console.error('❌ Firebase: Error listening to teachers:', error);
      });
    } catch (error) {
      handleFirestoreError(error, 'الاستماع للمدرسين');
    }
  }
};

// خدمات العمليات
export const operationsService = {
  // إضافة عملية جديدة
  addOperation: async (teacherId, operationData) => {
    try {
      console.log('🔍 Firebase: Adding operation for teacher:', teacherId);
      console.log('🔍 Firebase: Operation data:', operationData);
      
      // التحقق من البيانات المطلوبة
      if (!teacherId) {
        throw new Error('معرف المدرس مطلوب');
      }

      if (!operationData || typeof operationData !== 'object') {
        throw new Error('بيانات العملية مطلوبة');
      }

      // تنظيف البيانات من القيم undefined
      const cleanedData = cleanData(operationData);

      // إضافة البيانات الأساسية
      const finalData = {
        ...cleanedData,
        teacherId: teacherId, // التأكد من إضافة teacherId
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('✅ Firebase: Final operation data:', finalData);

      const docRef = await addDoc(collection(db, 'operations'), finalData);
      console.log('✅ Firebase: Operation added with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase: Error adding operation:', error);
      throw new Error(`فشل في إضافة العملية: ${error.message}`);
    }
  },

  // تحديث عملية
  updateOperation: async (operationId, updateData) => {
    try {
      console.log('🔄 Firebase: Updating operation:', operationId, updateData);
      
      const cleanedData = cleanData({
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      const operationRef = doc(db, 'operations', operationId);
      await updateDoc(operationRef, cleanedData);
      
      console.log('✅ Firebase: Operation updated:', operationId);
    } catch (error) {
      handleFirestoreError(error, 'تحديث العملية');
    }
  },

  // حذف عملية
  deleteOperation: async (operationId) => {
    try {
      console.log('🗑️ Firebase: Deleting operation:', operationId);
      
      await deleteDoc(doc(db, 'operations', operationId));
      
      console.log('✅ Firebase: Operation deleted:', operationId);
    } catch (error) {
      handleFirestoreError(error, 'حذف العملية');
    }
  },

  // الاستماع لجميع العمليات
  subscribeToOperations: (callback) => {
    try {
      const q = query(collection(db, 'operations'), orderBy('operationDate', 'desc'));
      return onSnapshot(q, callback, (error) => {
        console.error('❌ Firebase: Error listening to operations:', error);
      });
    } catch (error) {
      handleFirestoreError(error, 'الاستماع للعمليات');
    }
  },

  // الاستماع لعمليات مدرس معين
  subscribeToTeacherOperations: (teacherId, callback) => {
    try {
      if (!teacherId) {
        console.error('❌ Firebase: teacherId is required for subscribeToTeacherOperations');
        return () => {}; // return empty unsubscribe function
      }
      
      const q = query(
        collection(db, 'operations'), 
        where('teacherId', '==', teacherId),
        orderBy('operationDate', 'desc')
      );
      return onSnapshot(q, callback, (error) => {
        console.error('❌ Firebase: Error listening to teacher operations:', error);
      });
    } catch (error) {
      console.error('❌ Firebase: Error in subscribeToTeacherOperations:', error);
      handleFirestoreError(error, 'الاستماع لعمليات المدرس');
    }
  }
};

// خدمات المدفوعات - محسنة لحل مشكلة teacherId undefined
export const paymentsService = {
  // إضافة دفعة جديدة - الطريقة الجديدة
  addPayment: async (paymentData) => {
    try {
      console.log('🔍 Firebase: Adding payment with data:', paymentData);
      
      // التحقق من البيانات المطلوبة
      if (!paymentData || !paymentData.teacherId) {
        console.error('❌ Firebase: teacherId is missing from payment data');
        throw new Error('معرف المدرس مطلوب');
      }
      
      // التأكد من عدم وجود undefined values
      const cleanedData = cleanData({
        ...paymentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // التحقق مرة أخيرة من عدم وجود undefined values
      const hasUndefined = Object.entries(cleanedData).some(([key, value]) => {
        if (value === undefined) {
          console.error(`❌ Firebase: ${key} is undefined in cleaned data!`);
          return true;
        }
        return false;
      });
      
      if (hasUndefined) {
        throw new Error('البيانات تحتوي على قيم غير صحيحة');
      }
      
      console.log('✅ Firebase: Clean payment data to be saved:', cleanedData);
      
      const docRef = await addDoc(collection(db, 'payments'), cleanedData);
      console.log('✅ Firebase: Payment document written with ID:', docRef.id);
      
      return docRef;
    } catch (error) {
      console.error('❌ Firebase: Error adding payment:', error);
      handleFirestoreError(error, 'إضافة الدفعة');
    }
  },

  // الطريقة القديمة للتوافق العكسي
  addPaymentOld: async (teacherId, paymentData) => {
    try {
      console.log('🔍 Firebase: Adding payment (old method) for teacher:', teacherId);
      console.log('🔍 Firebase: Payment data:', paymentData);
      
      if (!teacherId) {
        throw new Error('معرف المدرس مطلوب');
      }
      
      const cleanedData = cleanData({
        ...paymentData,
        teacherId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Firebase: Clean payment data (old method):', cleanedData);
      
      const docRef = await addDoc(collection(db, 'payments'), cleanedData);
      console.log('✅ Firebase: Payment added with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase: Error adding payment (old method):', error);
      handleFirestoreError(error, 'إضافة الدفعة');
    }
  },

  // تحديث دفعة
  updatePayment: async (paymentId, updateData) => {
    try {
      console.log('🔄 Firebase: Updating payment:', paymentId, updateData);
      
      const cleanedData = cleanData({
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      const paymentRef = doc(db, 'payments', paymentId);
      await updateDoc(paymentRef, cleanedData);
      
      console.log('✅ Firebase: Payment updated:', paymentId);
    } catch (error) {
      console.error('❌ Firebase: Error updating payment:', error);
      handleFirestoreError(error, 'تحديث الدفعة');
    }
  },

  // حذف دفعة
  deletePayment: async (paymentId) => {
    try {
      console.log('🗑️ Firebase: Deleting payment:', paymentId);
      
      await deleteDoc(doc(db, 'payments', paymentId));
      
      console.log('✅ Firebase: Payment deleted:', paymentId);
    } catch (error) {
      handleFirestoreError(error, 'حذف الدفعة');
    }
  },

  // الاستماع لجميع المدفوعات
  subscribeToPayments: (callback) => {
    try {
      const q = query(collection(db, 'payments'), orderBy('paymentDate', 'desc'));
      return onSnapshot(q, callback, (error) => {
        console.error('❌ Firebase: Error listening to payments:', error);
      });
    } catch (error) {
      handleFirestoreError(error, 'الاستماع للمدفوعات');
    }
  },

  // الاستماع لمدفوعات مدرس معين
  subscribeToTeacherPayments: (teacherId, callback) => {
    try {
      if (!teacherId) {
        console.error('❌ Firebase: teacherId is required for subscribeToTeacherPayments');
        return () => {}; // return empty unsubscribe function
      }
      
      const q = query(
        collection(db, 'payments'), 
        where('teacherId', '==', teacherId),
        orderBy('paymentDate', 'desc')
      );
      return onSnapshot(q, callback, (error) => {
        console.error('❌ Firebase: Error listening to teacher payments:', error);
      });
    } catch (error) {
      console.error('❌ Firebase: Error in subscribeToTeacherPayments:', error);
      handleFirestoreError(error, 'الاستماع لمدفوعات المدرس');
    }
  }
};

// خدمات المصروفات الخاصة
export const expensesService = {
  // إضافة مصروف جديد
  addExpense: async (expenseData) => {
    try {
      console.log('🔍 Firebase: Adding expense:', expenseData);
      
      const cleanedData = cleanData({
        ...expenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Firebase: Clean expense data:', cleanedData);
      
      const docRef = await addDoc(collection(db, 'expenses'), cleanedData);
      console.log('✅ Firebase: Expense added with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, 'إضافة المصروف');
    }
  },

  // تحديث مصروف
  updateExpense: async (expenseId, updateData) => {
    try {
      console.log('🔄 Firebase: Updating expense:', expenseId, updateData);
      
      const cleanedData = cleanData({
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, cleanedData);
      
      console.log('✅ Firebase: Expense updated:', expenseId);
    } catch (error) {
      handleFirestoreError(error, 'تحديث المصروف');
    }
  },

  // حذف مصروف
  deleteExpense: async (expenseId) => {
    try {
      console.log('🗑️ Firebase: Deleting expense:', expenseId);
      
      await deleteDoc(doc(db, 'expenses', expenseId));
      
      console.log('✅ Firebase: Expense deleted:', expenseId);
    } catch (error) {
      handleFirestoreError(error, 'حذف المصروف');
    }
  },

  // الاستماع لتغييرات المصروفات
  subscribeToExpenses: (callback) => {
    try {
      const q = query(collection(db, 'expenses'), orderBy('expenseDate', 'desc'));
      return onSnapshot(q, callback, (error) => {
        console.error('❌ Firebase: Error listening to expenses:', error);
      });
    } catch (error) {
      handleFirestoreError(error, 'الاستماع للمصروفات');
    }
  }
};

// تصدير قاعدة البيانات للاستخدام المباشر إذا لزم الأمر
export { db };

// التصدير الافتراضي للتوافق
export default {
  teachersService,
  operationsService,
  paymentsService,
  expensesService,
  db
};