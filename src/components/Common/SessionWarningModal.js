import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';

const SessionWarningModal = () => {
  const { 
    showSessionWarning, 
    sessionTimeLeft, 
    extendSession, 
    logout,
    formatTimeLeft 
  } = useAuth();
  
  const [countdown, setCountdown] = useState(5 * 60); // 5 دقائق بالثواني

  useEffect(() => {
    if (showSessionWarning) {
      const timer = setInterval(() => {
        const remainingSeconds = Math.floor(sessionTimeLeft / 1000);
        setCountdown(remainingSeconds);
        
        if (remainingSeconds <= 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showSessionWarning, sessionTimeLeft]);

  const handleExtendSession = () => {
    extendSession();
  };

  const handleLogout = () => {
    logout();
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showSessionWarning) {
    return null;
  }

  return (
    <Modal
      isOpen={showSessionWarning}
      onClose={() => {}} // لا يمكن إغلاقها بالنقر خارجها
      title="⚠️ تحذير انتهاء الجلسة"
      size="medium"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className="text-center py-6">
        {/* أيقونة التحذير */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <span className="text-4xl">⏰</span>
          </div>
        </div>

        {/* رسالة التحذير */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ستنتهي جلستك قريباً!
          </h3>
          <p className="text-gray-600 mb-4">
            ستنتهي صلاحية جلستك خلال:
          </p>
          
          {/* العداد التنازلي */}
          <div className="inline-flex items-center justify-center bg-orange-100 rounded-xl px-6 py-3 mb-4">
            <span className="text-3xl font-bold text-orange-600">
              {formatCountdown(countdown)}
            </span>
          </div>
          
          <p className="text-sm text-gray-500">
            اختر إما تمديد الجلسة أو تسجيل الخروج الآن
          </p>
        </div>

        {/* الأزرار */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors duration-200"
          >
            <span className="text-lg ml-2">🚪</span>
            تسجيل الخروج
          </button>
          
          <button
            onClick={handleExtendSession}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg"
          >
            <span className="text-lg ml-2">🔄</span>
            تمديد الجلسة (30 دقيقة)
          </button>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-blue-500 text-lg">💡</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">لماذا تنتهي الجلسة؟</p>
              <p className="text-blue-700">
                لحماية بياناتك وضمان الأمان، تنتهي صلاحية الجلسة تلقائياً بعد 30 دقيقة من عدم النشاط.
                يمكنك تمديد الجلسة لمدة 30 دقيقة إضافية.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SessionWarningModal;