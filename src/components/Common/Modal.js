import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer = null
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // أحجام مختلفة للنوافذ
  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-none mx-4'
  };

  // معالجة فتح/إغلاق النافذة
  useEffect(() => {
    if (isOpen) {
      // حفظ العنصر المركز عليه حالياً
      previousFocusRef.current = document.activeElement;
      
      // منع التمرير في الخلفية
      document.body.style.overflow = 'hidden';
      
      // التركيز على النافذة
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else {
      // استعادة التمرير
      document.body.style.overflow = 'unset';
      
      // استعادة التركيز
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // معالجة الضغط على ESC
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // معالجة النقر على الخلفية
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

const handleKeyDown = (event) => {
  // 🛑 تجاهل المعالجة لو المستخدم بيكتب في input أو textarea أو عنصر قابل للتحرير
  const tag = event.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) {
    return;
  }

  if (event.key === 'Tab') {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
};

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`
          modal-content relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} 
          max-h-[90vh] overflow-hidden animate-fade-in
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        
        {/* رأس النافذة */}
        {(title || showCloseButton) && (
          <div className={`
            flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50
            ${headerClassName}
          `}>
            {title && (
              <h2 
                id="modal-title"
                className="text-xl font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                  rounded-lg transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
                aria-label="إغلاق النافذة"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* محتوى النافذة */}
        <div className={`
          overflow-y-auto max-h-[calc(90vh-8rem)]
          ${bodyClassName}
        `}>
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* ذيل النافذة */}
        {footer && (
          <div className={`
            border-t border-gray-200 bg-gray-50 px-6 py-4
            ${footerClassName}
          `}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // استخدام Portal لعرض النافذة في نهاية الـ body
  return createPortal(modalContent, document.body);
};

// مكونات مساعدة للنوافذ المخصصة

// نافذة تأكيد
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'تأكيد العملية',
  message = 'هل أنت متأكد من هذا الإجراء؟',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'warning' // warning, danger, info
}) => {
  const typeStyles = {
    warning: {
      icon: '⚠️',
      confirmClass: 'btn-warning',
      iconColor: 'text-yellow-600'
    },
    danger: {
      icon: '🗑️',
      confirmClass: 'btn-error',
      iconColor: 'text-red-600'
    },
    info: {
      icon: 'ℹ️',
      confirmClass: 'btn-primary',
      iconColor: 'text-blue-600'
    }
  };

  const style = typeStyles[type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      closeOnOverlayClick={false}
    >
      <div className="text-center">
        <div className={`text-6xl mb-4 ${style.iconColor}`}>
          {style.icon}
        </div>
        
        <p className="text-gray-700 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="btn btn-secondary px-6"
          >
            {cancelText}
          </button>
          
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`btn ${style.confirmClass} px-6`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// نافذة معلومات
export const InfoModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message,
  type = 'info'
}) => {
  const typeStyles = {
    success: { icon: '✅', color: 'text-green-600' },
    error: { icon: '❌', color: 'text-red-600' },
    warning: { icon: '⚠️', color: 'text-yellow-600' },
    info: { icon: 'ℹ️', color: 'text-blue-600' }
  };

  const style = typeStyles[type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
    >
      <div className="text-center">
        <div className={`text-6xl mb-4 ${style.color}`}>
          {style.icon}
        </div>
        
        <p className="text-gray-700 mb-6 leading-relaxed">
          {message}
        </p>
        
        <button
          onClick={onClose}
          className="btn btn-primary px-8"
        >
          حسناً
        </button>
      </div>
    </Modal>
  );
};

// نافذة تحميل
export const LoadingModal = ({ 
  isOpen, 
  message = 'جاري المعالجة...',
  subMessage = 'يرجى الانتظار'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // لا يمكن إغلاقها
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="small"
    >
      <div className="text-center py-8">
        <div className="loading-spinner mb-4"></div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {message}
        </h3>
        
        <p className="text-gray-600">
          {subMessage}
        </p>
      </div>
    </Modal>
  );
};

// نافذة ملء الشاشة
export const FullScreenModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  showCloseButton = true
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      showCloseButton={showCloseButton}
      className="h-screen max-h-screen rounded-none"
      headerClassName="bg-white border-b"
      bodyClassName="h-[calc(100vh-5rem)]"
    >
      {children}
    </Modal>
  );
};

export default Modal;