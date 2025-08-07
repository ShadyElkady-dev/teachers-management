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
  apiKey: "AIzaSyAFSaPKX-UK79gwZpm-sGSp47dOJvzlvEw",
  authDomain: "teachersmanagement-6afeb.firebaseapp.com",
  projectId: "teachersmanagement-6afeb",
  storageBucket: "teachersmanagement-6afeb.firebasestorage.app",
  messagingSenderId: "643695842583",
  appId: "1:643695842583:web:2b77c28056891b2dbc9352",
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// خدمات المدرسين
export const teachersService = {
  // إضافة مدرس جديد
  addTeacher: async (teacherData) => {
    try {
      const docRef = await addDoc(collection(db, 'teachers'), {
        ...teacherData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding teacher:', error);
      throw error;
    }
  },

  // تحديث بيانات مدرس
  updateTeacher: async (teacherId, updateData) => {
    try {
      const teacherRef = doc(db, 'teachers', teacherId);
      await updateDoc(teacherRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },

  // حذف مدرس
  deleteTeacher: async (teacherId) => {
    try {
      await deleteDoc(doc(db, 'teachers', teacherId));
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  },

  // الاستماع لتغييرات المدرسين
  subscribeToTeachers: (callback) => {
    const q = query(collection(db, 'teachers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, callback, (error) => {
      console.error('Error listening to teachers:', error);
    });
  }
};

// خدمات العمليات
export const operationsService = {
  // إضافة عملية جديدة
addOperation: async (teacherId, operationData) => {
  try {
    // التحقق من البيانات المطلوبة
    if (!teacherId) {
      throw new Error('معرف المدرس مطلوب');
    }

    if (!operationData || typeof operationData !== 'object') {
      throw new Error('بيانات العملية مطلوبة');
    }

    // تنظيف البيانات من القيم undefined
    const cleanData = {};
    Object.keys(operationData).forEach(key => {
      const value = operationData[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanData[key] = value;
      }
    });

    // إضافة البيانات الأساسية
    const finalData = {
      ...cleanData,
      teacherId: teacherId, // التأكد من إضافة teacherId
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'operations'), finalData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding operation:', error);
    throw new Error(`فشل في إضافة العملية: ${error.message}`);
  }
},

  // تحديث عملية
  updateOperation: async (operationId, updateData) => {
    try {
      const operationRef = doc(db, 'operations', operationId);
      await updateDoc(operationRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating operation:', error);
      throw error;
    }
  },

  // حذف عملية
  deleteOperation: async (operationId) => {
    try {
      await deleteDoc(doc(db, 'operations', operationId));
    } catch (error) {
      console.error('Error deleting operation:', error);
      throw error;
    }
  },

  // الاستماع لجميع العمليات
  subscribeToOperations: (callback) => {
    const q = query(collection(db, 'operations'), orderBy('operationDate', 'desc'));
    return onSnapshot(q, callback, (error) => {
      console.error('Error listening to operations:', error);
    });
  },

  // الاستماع لعمليات مدرس معين
  subscribeToTeacherOperations: (teacherId, callback) => {
    const q = query(
      collection(db, 'operations'), 
      where('teacherId', '==', teacherId),
      orderBy('operationDate', 'desc')
    );
    return onSnapshot(q, callback, (error) => {
      console.error('Error listening to teacher operations:', error);
    });
  }
};

// خدمات المدفوعات
export const paymentsService = {
  // إضافة دفعة جديدة
  addPayment: async (teacherId, paymentData) => {
    try {
      const docRef = await addDoc(collection(db, 'payments'), {
        ...paymentData,
        teacherId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  },

  // تحديث دفعة
  updatePayment: async (paymentId, updateData) => {
    try {
      const paymentRef = doc(db, 'payments', paymentId);
      await updateDoc(paymentRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // حذف دفعة
  deletePayment: async (paymentId) => {
    try {
      await deleteDoc(doc(db, 'payments', paymentId));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  // الاستماع لجميع المدفوعات
  subscribeToPayments: (callback) => {
    const q = query(collection(db, 'payments'), orderBy('paymentDate', 'desc'));
    return onSnapshot(q, callback, (error) => {
      console.error('Error listening to payments:', error);
    });
  },

  // الاستماع لمدفوعات مدرس معين
  subscribeToTeacherPayments: (teacherId, callback) => {
    const q = query(
      collection(db, 'payments'), 
      where('teacherId', '==', teacherId),
      orderBy('paymentDate', 'desc')
    );
    return onSnapshot(q, callback, (error) => {
      console.error('Error listening to teacher payments:', error);
    });
  }
};

// خدمات المصروفات الخاصة
export const expensesService = {
  // إضافة مصروف جديد
  addExpense: async (expenseData) => {
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  },

  // تحديث مصروف
  updateExpense: async (expenseId, updateData) => {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // حذف مصروف
  deleteExpense: async (expenseId) => {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // الاستماع لتغييرات المصروفات
  subscribeToExpenses: (callback) => {
    const q = query(collection(db, 'expenses'), orderBy('expenseDate', 'desc'));
    return onSnapshot(q, callback, (error) => {
      console.error('Error listening to expenses:', error);
    });
  }
};

export { db };