import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { getFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '../utils/helpers';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

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
  VIEW_OPERATION_PRICES_AFTER_SAVE: 'view_operation_prices_after_save',
  VIEW_ALL_OPERATIONS: 'view_all_operations',
  
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
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.SECRETARY]: [
    PERMISSIONS.VIEW_TEACHERS,
    PERMISSIONS.ADD_OPERATION,
    PERMISSIONS.VIEW_OPERATION_PRICES,
  ]
};

// حسابات المستخدمين المحددة مسبقاً
const PREDEFINED_USERS = [
  {
    id: 'admin_001',
    username: 'mody',
    password: '2810',
    role: USER_ROLES.ADMIN,
    name: 'محمد مختار',
    email: 'modyasdw15@gmail.com'
  },
  {
    id: 'secretary_001',
    username: 'as',
    password: '3091999',
    role: USER_ROLES.SECRETARY,
    name: 'اسماء',
    email: ''
  }
];

// ⏰ إعدادات انتهاء الجلسة
const SESSION_CONFIG = {
  DURATION: 30 * 60 * 1000, // 30 دقيقة بالميلي ثانية
  WARNING_TIME: 5 * 60 * 1000, // تحذير قبل 5 دقائق من انتهاء الجلسة
  CHECK_INTERVAL: 60 * 1000, // فحص كل دقيقة
  STORAGE_KEY: 'auth_session_timestamp'
};

// إنشاء Context
const AuthContext = createContext();

// الحالة الأولية
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  sessionTimeLeft: 0,
  showSessionWarning: false
};

// Actions
const ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  CLEAR_ERROR: 'CLEAR_ERROR',
  INITIALIZE: 'INITIALIZE',
  UPDATE_SESSION_TIME: 'UPDATE_SESSION_TIME',
  SHOW_SESSION_WARNING: 'SHOW_SESSION_WARNING',
  HIDE_SESSION_WARNING: 'HIDE_SESSION_WARNING',
  EXTEND_SESSION: 'EXTEND_SESSION'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.INITIALIZE:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        sessionTimeLeft: action.payload.timeLeft,
        isLoading: false
      };
    case ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
    case ACTIONS.LOGIN_SUCCESS:
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null,
        sessionTimeLeft: SESSION_CONFIG.DURATION,
        showSessionWarning: false
      };
    case ACTIONS.LOGIN_ERROR:
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: action.payload,
        sessionTimeLeft: 0,
        showSessionWarning: false
      };
    case ACTIONS.LOGOUT:
    case ACTIONS.SESSION_EXPIRED:
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: null,
        sessionTimeLeft: 0,
        showSessionWarning: false
      };
    case ACTIONS.UPDATE_SESSION_TIME:
      return {
        ...state,
        sessionTimeLeft: action.payload
      };
    case ACTIONS.SHOW_SESSION_WARNING:
      return {
        ...state,
        showSessionWarning: true
      };
    case ACTIONS.HIDE_SESSION_WARNING:
      return {
        ...state,
        showSessionWarning: false
      };
    case ACTIONS.EXTEND_SESSION:
      return {
        ...state,
        sessionTimeLeft: SESSION_CONFIG.DURATION,
        showSessionWarning: false
      };
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

// Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const sessionIntervalRef = useRef(null);
  const warningShownRef = useRef(false);

  // ⏰ دالة للحصول على وقت انتهاء الجلسة
  const getSessionExpiration = () => {
    const timestamp = getFromLocalStorage(SESSION_CONFIG.STORAGE_KEY);
    return timestamp ? new Date(timestamp) : null;
  };

  // ⏰ دالة لحفظ وقت انتهاء الجلسة
  const setSessionExpiration = () => {
    const expirationTime = new Date(Date.now() + SESSION_CONFIG.DURATION);
    saveToLocalStorage(SESSION_CONFIG.STORAGE_KEY, expirationTime.toISOString());
    return expirationTime;
  };

  // ⏰ دالة لحساب الوقت المتبقي في الجلسة
  const calculateTimeLeft = () => {
    const expiration = getSessionExpiration();
    if (!expiration) return 0;
    
    const now = new Date();
    const timeLeft = expiration.getTime() - now.getTime();
    return Math.max(0, timeLeft);
  };

  // ⏰ دالة تسجيل الخروج بسبب انتهاء الجلسة
  const handleSessionExpired = () => {
    console.log('🔒 الجلسة انتهت - تسجيل خروج تلقائي');
    
    // إيقاف المؤقت
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
    
    // مسح البيانات
    removeFromLocalStorage('auth_user');
    removeFromLocalStorage(SESSION_CONFIG.STORAGE_KEY);
    
    // تحديث الحالة
    dispatch({ type: ACTIONS.SESSION_EXPIRED });
    
    // إظهار رسالة
    toast.error('انتهت مدة الجلسة، يرجى تسجيل الدخول مرة أخرى', {
      duration: 5000,
      position: 'top-center'
    });
  };

  // ⏰ دالة إظهار تحذير انتهاء الجلسة
  const showSessionWarning = () => {
    if (warningShownRef.current) return;
    
    warningShownRef.current = true;
    dispatch({ type: ACTIONS.SHOW_SESSION_WARNING });
    
    toast((t) => (
      <div className="text-center">
        <div className="font-bold text-orange-600 mb-2">⚠️ تحذير انتهاء الجلسة</div>
        <div className="text-sm text-gray-700 mb-3">
          ستنتهي جلستك خلال 5 دقائق. هل تريد تمديد الجلسة؟
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              extendSession();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium"
          >
            تمديد الجلسة
          </button>
          <button
            onClick={() => {
              handleSessionExpired();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm font-medium"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center'
    });
  };

  // ⏰ دالة تمديد الجلسة
  const extendSession = () => {
      console.log('تمديد الجلسة تم تعطيله');
  };

  // ⏰ دالة فحص الجلسة
  const checkSession = () => {
    if (!state.isAuthenticated) return;
    
    const timeLeft = calculateTimeLeft();
    
    if (timeLeft <= 0) {
      handleSessionExpired();
      return;
    }
    
    dispatch({ type: ACTIONS.UPDATE_SESSION_TIME, payload: timeLeft });
    
    // إظهار التحذير قبل 5 دقائق من انتهاء الجلسة
    if (timeLeft <= SESSION_CONFIG.WARNING_TIME && !warningShownRef.current) {
      showSessionWarning();
    }
  };

  // ⏰ بدء مراقبة الجلسة
  const startSessionMonitoring = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
    
    sessionIntervalRef.current = setInterval(checkSession, SESSION_CONFIG.CHECK_INTERVAL);
    console.log('🕐 بدء مراقبة الجلسة - فحص كل دقيقة');
  };

  // ⏰ إيقاف مراقبة الجلسة
  const stopSessionMonitoring = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
      console.log('⏹️ إيقاف مراقبة الجلسة');
    }
  };

  // ⏰ التهيئة عند تحميل المكون
  useEffect(() => {
    const savedUser = getFromLocalStorage('auth_user');
    let timeLeft = 0;
    
    if (savedUser) {
      timeLeft = calculateTimeLeft();
      
      if (timeLeft <= 0) {
        // الجلسة منتهية
        removeFromLocalStorage('auth_user');
        removeFromLocalStorage(SESSION_CONFIG.STORAGE_KEY);
        dispatch({ type: ACTIONS.INITIALIZE, payload: { user: null, timeLeft: 0 } });
        return;
      }
    }
    
    dispatch({ type: ACTIONS.INITIALIZE, payload: { user: savedUser, timeLeft } });
  }, []);

  // ⏰ بدء/إيقاف مراقبة الجلسة حسب حالة المصادقة
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      startSessionMonitoring();
    } else {
      stopSessionMonitoring();
      warningShownRef.current = false;
    }
    
    return () => stopSessionMonitoring();
  }, [state.isAuthenticated, state.user]);

  // دالة تسجيل الدخول (محدثة)
  const login = async (username, password) => {
    dispatch({ type: ACTIONS.LOGIN_START });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = PREDEFINED_USERS.find(u => u.username === username && u.password === password);

if (!user) {
  dispatch({ type: ACTIONS.LOGIN_ERROR, payload: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  return; // مهم عشان يوقف التنفيذ هنا
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
      
      // إنشاء أو تحديث سجل المستخدم في Firestore
      await setDoc(doc(db, "users", user.id), {
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username
      }, { merge: true });

      // ⏰ حفظ بيانات المستخدم ووقت انتهاء الجلسة
      saveToLocalStorage('auth_user', userData);
      setSessionExpiration();
      
      dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: userData });
      
      toast.success(`مرحباً ${userData.name}! تم تسجيل الدخول بنجاح`, {
        duration: 3000,
        position: 'top-center'
      });
      
      return userData;
    } catch (error) {
      dispatch({ type: ACTIONS.LOGIN_ERROR, payload: error.message });
      throw error;
    }
  };

  // دالة تسجيل الخروج (محدثة)
  const logout = () => {
    console.log('🚪 تسجيل خروج يدوي');
    
    stopSessionMonitoring();
    removeFromLocalStorage('auth_user');
    removeFromLocalStorage(SESSION_CONFIG.STORAGE_KEY);
    
    dispatch({ type: ACTIONS.LOGOUT });
    
    toast.success('تم تسجيل الخروج بنجاح', {
      duration: 3000,
      position: 'top-center'
    });
  };

  // ⏰ دالة تنسيق الوقت المتبقي للعرض
  const formatTimeLeft = () => {
    const minutes = Math.floor(state.sessionTimeLeft / (60 * 1000));
    const seconds = Math.floor((state.sessionTimeLeft % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
    // ⏰ إضافة وظائف الجلسة
    extendSession,
    formatTimeLeft,
    sessionTimeLeft: state.sessionTimeLeft,
    showSessionWarning: state.showSessionWarning,
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