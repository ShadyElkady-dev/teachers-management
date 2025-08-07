import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { teachersService, operationsService, paymentsService, expensesService } from '../services/firebase';

// إنشاء Context
const AppContext = createContext();

// الحالة الأولية
const initialState = {
  teachers: [],
  operations: [],
  payments: [],
  expenses: [],
  selectedTeacher: null,
  loading: {
    teachers: false,
    operations: false,
    payments: false,
    expenses: false
  },
  error: null
};

// Actions
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_TEACHERS: 'SET_TEACHERS',
  SET_OPERATIONS: 'SET_OPERATIONS',
  SET_PAYMENTS: 'SET_PAYMENTS',
  SET_EXPENSES: 'SET_EXPENSES',
  SET_SELECTED_TEACHER: 'SET_SELECTED_TEACHER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.value
        }
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: {
          teachers: false,
          operations: false,
          payments: false,
          expenses: false
        }
      };
    
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case ACTIONS.SET_TEACHERS:
      return {
        ...state,
        teachers: action.payload,
        loading: {
          ...state.loading,
          teachers: false
        }
      };
    
    case ACTIONS.SET_OPERATIONS:
      return {
        ...state,
        operations: action.payload,
        loading: {
          ...state.loading,
          operations: false
        }
      };
    
    case ACTIONS.SET_PAYMENTS:
      return {
        ...state,
        payments: action.payload,
        loading: {
          ...state.loading,
          payments: false
        }
      };
    
    case ACTIONS.SET_EXPENSES:
      return {
        ...state,
        expenses: action.payload,
        loading: {
          ...state.loading,
          expenses: false
        }
      };
    
    case ACTIONS.SET_SELECTED_TEACHER:
      return {
        ...state,
        selectedTeacher: action.payload
      };
    
    default:
      return state;
  }
};

// Provider Component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // وظائف مساعدة
  const setLoading = (type, value) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { type, value } });
  };

  const setError = (error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

  // وظائف المدرسين
  const teacherActions = {
    addTeacher: async (teacherData) => {
      try {
        setLoading('teachers', true);
        await teachersService.addTeacher(teacherData);
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    updateTeacher: async (teacherId, updateData) => {
      try {
        setLoading('teachers', true);
        await teachersService.updateTeacher(teacherId, updateData);
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    deleteTeacher: async (teacherId) => {
      try {
        setLoading('teachers', true);
        await teachersService.deleteTeacher(teacherId);
        
        // حذف العمليات والمدفوعات المرتبطة
        const teacherOperations = state.operations.filter(op => op.teacherId === teacherId);
        const teacherPayments = state.payments.filter(payment => payment.teacherId === teacherId);
        
        for (const op of teacherOperations) {
          await operationsService.deleteOperation(op.id);
        }
        
        for (const payment of teacherPayments) {
          await paymentsService.deletePayment(payment.id);
        }
        
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    selectTeacher: (teacher) => {
      dispatch({ type: ACTIONS.SET_SELECTED_TEACHER, payload: teacher });
    }
  };

  // وظائف العمليات
  const operationActions = {
addOperation: async (teacherId, operationData) => {
  try {
    setLoading('operations', true);
    
    // التأكد من وجود teacherId والبيانات
    if (!teacherId) {
      throw new Error('معرف المدرس مطلوب');
    }
    
    if (!operationData || typeof operationData !== 'object') {
      throw new Error('بيانات العملية غير صحيحة');
    }

    // تنظيف البيانات من القيم undefined
    const cleanData = {};
    Object.keys(operationData).forEach(key => {
      if (operationData[key] !== undefined && operationData[key] !== null) {
        cleanData[key] = operationData[key];
      }
    });

    await operationsService.addOperation(teacherId, cleanData);
    clearError();
  } catch (error) {
    setError(error.message);
    throw error;
  }
},
  };

  // وظائف المدفوعات
  const paymentActions = {
    addPayment: async (teacherId, paymentData) => {
      try {
        setLoading('payments', true);
        await paymentsService.addPayment(teacherId, paymentData);
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    updatePayment: async (paymentId, updateData) => {
      try {
        setLoading('payments', true);
        await paymentsService.updatePayment(paymentId, updateData);
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    deletePayment: async (paymentId) => {
      try {
        setLoading('payments', true);
        await paymentsService.deletePayment(paymentId);
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    }
  };

  // وظائف المصروفات
  const expenseActions = {
    addExpense: async (expenseData) => {
      try {
        setLoading('expenses', true);
        await expensesService.addExpense(expenseData);
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    updateExpense: async (expenseId, updateData) => {
      try {
        setLoading('expenses', true);
        await expensesService.updateExpense(expenseId, updateData);
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    deleteExpense: async (expenseId) => {
      try {
        setLoading('expenses', true);
        await expensesService.deleteExpense(expenseId);
        clearError();
      } catch (error) {
        setError(error.message);
        throw error;
      }
    }
  };

  // إعداد المستمعين لـ Firebase
  useEffect(() => {
    let unsubscribeTeachers;
    let unsubscribeOperations;
    let unsubscribePayments;
    let unsubscribeExpenses;

    const setupListeners = async () => {
      try {
        // الاستماع للمدرسين
        unsubscribeTeachers = teachersService.subscribeToTeachers((snapshot) => {
          const teachersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          dispatch({ type: ACTIONS.SET_TEACHERS, payload: teachersData });
        });

        // الاستماع للعمليات
        unsubscribeOperations = operationsService.subscribeToOperations((snapshot) => {
          const operationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          dispatch({ type: ACTIONS.SET_OPERATIONS, payload: operationsData });
        });

        // الاستماع للمدفوعات
        unsubscribePayments = paymentsService.subscribeToPayments((snapshot) => {
          const paymentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          dispatch({ type: ACTIONS.SET_PAYMENTS, payload: paymentsData });
        });

        // الاستماع للمصروفات
        unsubscribeExpenses = expensesService.subscribeToExpenses((snapshot) => {
          const expensesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          dispatch({ type: ACTIONS.SET_EXPENSES, payload: expensesData });
        });
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setError(error.message);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeTeachers) unsubscribeTeachers();
      if (unsubscribeOperations) unsubscribeOperations();
      if (unsubscribePayments) unsubscribePayments();
      if (unsubscribeExpenses) unsubscribeExpenses();
    };
  }, []);

  // حساب إجمالي المديونية لمدرس معين
  const calculateTeacherDebt = (teacherId) => {
    const teacherOperations = state.operations.filter(op => op.teacherId === teacherId);
    const teacherPayments = state.payments.filter(payment => payment.teacherId === teacherId);
    
    const totalOperations = teacherOperations.reduce((sum, op) => sum + (op.amount || 0), 0);
    const totalPayments = teacherPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    return totalOperations - totalPayments;
  };

  // حساب إجمالي الأرباح
//  const calculateTotalProfit = () => {
  //  const totalRevenue = state.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
 //   const totalExpenses = state.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
  //  return totalRevenue - totalExpenses;
 // };
const calculateTotalProfit = () => {
  const totalRevenue = state.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const totalExpenses = state.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  // إضافة تكلفة العمليات (إذا كانت موجودة)
  const operationsCost = state.operations.reduce((sum, op) => sum + ((op.cost || 0)), 0);
  
  return totalRevenue - totalExpenses - operationsCost;
};

  const value = {
    state,
    teacherActions,
    operationActions,
    paymentActions,
    expenseActions,
    calculateTeacherDebt,
    calculateTotalProfit,
    clearError,
    // إضافة الخدمات للوصول المباشر
    operationsService,
    paymentsService,
    teachersService,
    expensesService
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook لاستخدام Context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default AppContext;