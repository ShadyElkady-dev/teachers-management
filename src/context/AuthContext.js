import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '../utils/helpers';

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

// إعداد الصلاحيات لكل دور - تم تحديث صلاحيات السكرتارية
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // جميع الصلاحيات للأدمن
    PERMISSIONS.VIEW_TEACHERS,
    PERMISSIONS.ADD_TEACHER,
    PERMISSIONS.EDIT_TEACHER,
    PERMISSIONS.DELETE_TEACHER,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.ADD_OPERATION,
    PERMISSIONS.EDIT_OPERATION,
    PERMISSIONS.DELETE_OPERATION,
    PERMISSIONS.VIEW_OPERATION_PRICES,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.ADD_PAYMENT,
    PERMISSIONS.EDIT_PAYMENT,
    PERMISSIONS.DELETE_PAYMENT,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.ADD_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.DELETE_EXPENSE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_SYSTEM_SETTINGS
  ],
  [USER_ROLES.SECRETARY]: [
    // صلاحيات محدودة جداً للسكرتارية
    PERMISSIONS.VIEW_TEACHERS,        // عرض المدرسين فقط
    PERMISSIONS.VIEW_OPERATIONS,      // عرض العمليات فقط
    PERMISSIONS.ADD_OPERATION,        // إضافة العمليات فقط
    // لا يمكن للسكرتارية:
    // - إضافة أو تعديل أو حذف المدرسين
    // - تعديل أو حذف العمليات
    // - رؤية الأسعار والمبالغ
    // - الوصول للمدفوعات أو المصروفات أو التقارير المالية
  ]
};

// حسابات المستخدمين المحددة مسبقاً
const PREDEFINED_USERS = [
  {
    id: 'admin_001',
    username: 'admin',
    password: 'admin123', // في التطبيق الحقيقي يجب تشفير كلمة المرور
    role: USER_ROLES.ADMIN,
    name: 'شادى الأدمن',
  },
  {
    id: 'secretary_001',
    username: 'secretary',
    password: 'secretary123',
    role: USER_ROLES.SECRETARY,
    name: 'حساب السكرتير',
  }
];

// إنشاء Context
const AuthContext = createContext();

// الحالة الأولية
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Actions
const ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // التحقق من وجود جلسة مسبقة عند تحميل التطبيق
  useEffect(() => {
    const savedUser = getFromLocalStorage('auth_user');
    if (savedUser) {
      dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: savedUser });
    }
  }, []);

  // دالة تسجيل الدخول
  const login = async (username, password) => {
    dispatch({ type: ACTIONS.LOGIN_START });

    try {
      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1000));

      // البحث عن المستخدم
      const user = PREDEFINED_USERS.find(
        u => u.username === username && u.password === password
      );

      if (!user) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }

      // إنشاء بيانات المستخدم (بدون كلمة المرور)
      const userData = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        loginTime: new Date().toISOString()
      };

      // حفظ في التخزين المحلي
      saveToLocalStorage('auth_user', userData);

      dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: userData });
      
      return userData;
    } catch (error) {
      dispatch({ type: ACTIONS.LOGIN_ERROR, payload: error.message });
      throw error;
    }
  };

  // دالة تسجيل الخروج
  const logout = () => {
    removeFromLocalStorage('auth_user');
    dispatch({ type: ACTIONS.LOGOUT });
  };

  // دالة التحقق من الصلاحية
  const hasPermission = (permission) => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  };

  // دالة التحقق من الدور
  const hasRole = (role) => {
    if (!state.user) return false;
    return state.user.role === role;
  };

  // دالة التحقق من كون المستخدم أدمن
  const isAdmin = () => {
    return hasRole(USER_ROLES.ADMIN);
  };

  // دالة التحقق من كون المستخدم سكرتارية
  const isSecretary = () => {
    return hasRole(USER_ROLES.SECRETARY);
  };

  // دالة مسح الأخطاء
  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

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