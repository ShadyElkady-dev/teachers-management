import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '../utils/helpers';
import { db } from '../services/firebase'; // <-- (1) استيراد قاعدة البيانات
import { doc, setDoc } from 'firebase/firestore'; // <-- (2) استيراد دوال Firestore

// أنواع المستخدمين
export const USER_ROLES = {
  ADMIN: 'admin',
  SECRETARY: 'secretary'
};

// الصلاحيات
export const PERMISSIONS = {
  // صلاحيات المدرسين
  VIEW_TEACHERS: 'view_teachers',
  ADD_TEACHER: 'add_teacher',
  EDIT_TEACHER: 'edit_teacher',
  DELETE_TEACHER: 'delete_teacher',
  
  // صلاحيات العمليات
  VIEW_OPERATIONS: 'view_operations',
  ADD_OPERATION: 'add_operation',
  EDIT_OPERATION: 'edit_operation',
  DELETE_OPERATION: 'delete_operation',
  VIEW_OPERATION_PRICES: 'view_operation_prices',
  
  // صلاحيات المدفوعات
  VIEW_PAYMENTS: 'view_payments',
  ADD_PAYMENT: 'add_payment',
  EDIT_PAYMENT: 'edit_payment',
  DELETE_PAYMENT: 'delete_payment',
  
  // صلاحيات المصروفات
  VIEW_EXPENSES: 'view_expenses',
  ADD_EXPENSE: 'add_expense',
  EDIT_EXPENSE: 'edit_expense',
  DELETE_EXPENSE: 'delete_expense',
  
  // صلاحيات التقارير والحسابات
  VIEW_REPORTS: 'view_reports',
  VIEW_FINANCIAL_DATA: 'view_financial_data',
  EXPORT_DATA: 'export_data',
  
  // صلاحيات إدارية
  MANAGE_USERS: 'manage_users',
  VIEW_SYSTEM_SETTINGS: 'view_system_settings'
};

// إعداد الصلاحيات لكل دور
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS), // الأدمن يملك كل الصلاحيات
  [USER_ROLES.SECRETARY]: [
    PERMISSIONS.VIEW_TEACHERS,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.ADD_OPERATION,
    PERMISSIONS.EDIT_OPERATION,
    PERMISSIONS.DELETE_OPERATION,
    PERMISSIONS.VIEW_OPERATION_PRICES
  ]
};

// حسابات المستخدمين المحددة مسبقاً
const PREDEFINED_USERS = [
  {
    id: 'admin_001',
    username: 'admin',
    password: 'admin123',
    role: USER_ROLES.ADMIN,
    name: 'شادى الأدمن',
    email: 'admin@example.com'
  },
  {
    id: 'secretary_001',
    username: 'secretary',
    password: 'secretary123',
    role: USER_ROLES.SECRETARY,
    name: 'حساب السكرتير',
    email: 'secretary@example.com'
  }
];

// إنشاء Context
const AuthContext = createContext();

// الحالة الأولية
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // يبدأ التحميل من البداية
  error: null
};

// Actions
const ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  INITIALIZE: 'INITIALIZE' // أكشن جديد للتهيئة
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.INITIALIZE:
      return {
          ...state,
          user: action.payload,
          isAuthenticated: !!action.payload,
          isLoading: false
      };
    case ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
    case ACTIONS.LOGIN_SUCCESS:
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, error: null };
    case ACTIONS.LOGIN_ERROR:
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: action.payload };
    case ACTIONS.LOGOUT:
      return { ...state, user: null, isAuthenticated: false, isLoading: false, error: null };
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

// Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const savedUser = getFromLocalStorage('auth_user');
    dispatch({ type: ACTIONS.INITIALIZE, payload: savedUser });
  }, []);

  // دالة تسجيل الدخول (تم التعديل هنا)
  const login = async (username, password) => {
    dispatch({ type: ACTIONS.LOGIN_START });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = PREDEFINED_USERS.find(u => u.username === username && u.password === password);

      if (!user) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }

      const userData = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        loginTime: new Date().toISOString()
      };
      
      // <-- (3) بداية التعديل الجديد
      // إنشاء أو تحديث سجل المستخدم في Firestore
      await setDoc(doc(db, "users", user.id), {
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username
      }, { merge: true }); // merge: true تمنع الكتابة فوق البيانات الموجودة مثل الصورة
      // <-- نهاية التعديل الجديد

      saveToLocalStorage('auth_user', userData);
      dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: userData });
      return userData;
    } catch (error) {
      dispatch({ type: ACTIONS.LOGIN_ERROR, payload: error.message });
      throw error;
    }
  };

  const logout = () => {
    removeFromLocalStorage('auth_user');
    dispatch({ type: ACTIONS.LOGOUT });
  };

  const hasPermission = (permission) => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  };

  const hasRole = (role) => {
    if (!state.user) return false;
    return state.user.role === role;
  };
  
  const isAdmin = () => hasRole(USER_ROLES.ADMIN);
  const isSecretary = () => hasRole(USER_ROLES.SECRETARY);
  const clearError = () => dispatch({ type: ACTIONS.CLEAR_ERROR });

  const value = {
    ...state,
    login,
    logout,
    hasPermission,
    hasRole,
    isAdmin,
    isSecretary,
    clearError,
    USER_ROLES,
    PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook لاستخدام Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;