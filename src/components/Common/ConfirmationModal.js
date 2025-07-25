import React from 'react';
import Modal from './Modal';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    loading = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="py-4">
                <p className="text-gray-600">{message}</p>
            </div>
            <div className="flex justify-end items-center gap-4 pt-4 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    disabled={loading}
                >
                    {cancelText}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className="btn btn-danger"
                    disabled={loading}
                >
                    {loading ? 'جاري الحذف...' : confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;