import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import { formatDateTime } from '../../utils/helpers';
import { FiCamera, FiUser, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const UserProfile = () => {
  const { user, logout, updateUserProfile, USER_ROLES } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // تحميل الصورة من Firestore عند تحميل المكون
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (user?.id) {
        try {
          // أولاً نحاول جلب الصورة من Firestore
          const userDoc = await getDoc(doc(db, 'users', user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.avatar) {
              setProfileImage(userData.avatar);
              // حفظ نسخة في localStorage كـ cache
              localStorage.setItem(`userAvatar_${user.id}`, userData.avatar);
            }
          } else {
            // إذا لم توجد في Firestore، نجرب localStorage
            const savedImage = localStorage.getItem(`userAvatar_${user.id}`);
            if (savedImage) {
              setProfileImage(savedImage);
              // رفعها إلى Firestore
              await saveAvatarToFirestore(savedImage);
            }
          }
        } catch (error) {
          console.error('خطأ في تحميل الصورة:', error);
          // في حالة الخطأ، نستخدم localStorage كـ fallback
          const savedImage = localStorage.getItem(`userAvatar_${user.id}`);
          if (savedImage) {
            setProfileImage(savedImage);
          }
        }
      }
    };

    loadUserAvatar();
  }, [user?.id]);

  // حفظ الصورة في Firestore
  const saveAvatarToFirestore = async (base64String) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // التحقق من حجم البيانات (Firestore limit is 1MB per field)
      const sizeInBytes = new Blob([base64String]).size;
      if (sizeInBytes > 900000) { // 900KB للأمان
        toast.error('حجم الصورة كبير جداً، يرجى اختيار صورة أصغر');
        return false;
      }

      // حفظ في Firestore
      await updateDoc(doc(db, 'users', user.id), {
        avatar: base64String,
        avatarUpdatedAt: new Date().toISOString()
      });

      // حفظ نسخة محلية كـ cache
      localStorage.setItem(`userAvatar_${user.id}`, base64String);
      
      return true;
    } catch (error) {
      console.error('خطأ في حفظ الصورة:', error);
      toast.error('حدث خطأ في حفظ الصورة');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // حذف الصورة من Firestore
  const removeAvatarFromFirestore = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      await updateDoc(doc(db, 'users', user.id), {
        avatar: null,
        avatarUpdatedAt: new Date().toISOString()
      });

      localStorage.removeItem(`userAvatar_${user.id}`);
      return true;
    } catch (error) {
      console.error('خطأ في حذف الصورة:', error);
      toast.error('حدث خطأ في حذف الصورة');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  // ضغط الصورة قبل الحفظ
  const compressImage = (base64String, maxWidth = 300, maxHeight = 300, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64String;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // حساب الأبعاد الجديدة مع الحفاظ على النسبة
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // تحويل إلى base64 مع ضغط الجودة
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = reject;
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast.error('يرجى اختيار ملف صورة صحيح');
        return;
      }

      // التحقق من حجم الملف (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // ضغط الصورة
          const compressedImage = await compressImage(reader.result);
          
          // حفظ في Firestore
          const saved = await saveAvatarToFirestore(compressedImage);
          
          if (saved) {
            setProfileImage(compressedImage);
            toast.success('تم تحديث الصورة الشخصية بنجاح');
            setIsEditingImage(false);
            
            // تحديث معلومات المستخدم إذا كانت الدالة متاحة
            if (updateUserProfile) {
              updateUserProfile({ ...user, avatar: compressedImage });
            }
          }
        } catch (error) {
          console.error('خطأ في معالجة الصورة:', error);
          toast.error('حدث خطأ في معالجة الصورة');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    const removed = await removeAvatarFromFirestore();
    
    if (removed) {
      setProfileImage(null);
      toast.success('تم حذف الصورة الشخصية');
      setIsEditingImage(false);
      
      // تحديث معلومات المستخدم إذا كانت الدالة متاحة
      if (updateUserProfile) {
        updateUserProfile({ ...user, avatar: null });
      }
    }
  };

  const getUserRoleLabel = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'مدير النظام';
      case USER_ROLES.SECRETARY:
        return 'سكرتارية';
      default:
        return 'مستخدم';
    }
  };

  const getUserRoleIcon = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return '👑';
      case USER_ROLES.SECRETARY:
        return '📝';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case USER_ROLES.SECRETARY:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // مكون الأفاتار
  const Avatar = ({ size = 'small', showEditButton = false }) => {
    const sizeClasses = {
      small: 'w-8 h-8 text-sm',
      medium: 'w-16 h-16 text-xl',
      large: 'w-24 h-24 text-3xl'
    };

    return (
      <div className="relative inline-block">
        {profileImage ? (
          <img
            src={profileImage}
            alt={user?.name}
            className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-md`}
          />
        ) : (
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md`}>
            {user?.name?.charAt(0) || <FiUser />}
          </div>
        )}
        
        {showEditButton && !isLoading && (
          <button
            onClick={() => setIsEditingImage(true)}
            className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
            title="تغيير الصورة"
          >
            <FiCamera size={14} />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* زر الملف الشخصي */}
      <div className="relative">
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="الملف الشخصي"
        >
          <Avatar size="small" />

          <div className="hidden sm:block text-right text-white">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs text-white">{getUserRoleLabel(user?.role)}</div>
          </div>
        </button>
      </div>

      {/* نافذة الملف الشخصي */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setIsEditingImage(false);
        }}
        title="الملف الشخصي"
        size="medium"
      >
        <div className="space-y-6">
          {/* معلومات المستخدم الأساسية */}
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <Avatar size="large" showEditButton={!isEditingImage} />
            </div>
            
            {/* خيارات تعديل الصورة */}
            {isEditingImage && (
              <div className="mt-4 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiCamera size={16} />
                    {isLoading ? 'جاري الرفع...' : 'اختيار صورة'}
                  </button>
                  
                  {profileImage && (
                    <button
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiTrash2 size={16} />
                      حذف الصورة
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsEditingImage(false)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إلغاء
                  </button>
                </div>
                
                <p className="text-xs text-gray-500">
                  الحد الأقصى لحجم الصورة: 2 ميجابايت | الصيغ المدعومة: JPG, PNG, GIF
                  <br />
                  <span className="text-blue-600">سيتم ضغط الصورة تلقائياً للحصول على أفضل أداء</span>
                </p>
              </div>
            )}
            
            <h2 className="text-xl font-semibold text-gray-900 mt-2">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>

          {/* نوع الحساب */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{getUserRoleIcon(user?.role)}</span>
              <div className={`px-4 py-2 rounded-full border ${getRoleColor(user?.role)}`}>
                <span className="font-medium">{getUserRoleLabel(user?.role)}</span>
              </div>
            </div>
          </div>

          {/* تفاصيل الحساب */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">اسم المستخدم:</span>
                <div className="font-medium">{user?.username}</div>
              </div>
              <div>
                <span className="text-gray-500">معرف المستخدم:</span>
                <div className="font-medium font-mono text-xs">{user?.id}</div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">وقت تسجيل الدخول:</span>
                <div className="font-medium">
                  {user?.loginTime ? formatDateTime(user.loginTime) : 'غير محدد'}
                </div>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowProfileModal(false);
                setIsEditingImage(false);
              }}
              className="flex-1 btn btn-secondary"
            >
              إغلاق
            </button>
            <button
              onClick={() => {
                setShowProfileModal(false);
                setShowLogoutConfirm(true);
              }}
              className="flex-1 btn btn-error"
            >
              <span className="ml-2">🚪</span>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </Modal>

      {/* نافذة تأكيد تسجيل الخروج */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="تأكيد تسجيل الخروج"
        size="small"
      >
        <div className="text-center py-4">
          <div className="text-4xl mb-4">🚪</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            هل أنت متأكد من تسجيل الخروج؟
          </h3>
          <p className="text-gray-600 mb-6">
            سيتم إنهاء جلسة العمل الحالية وستحتاج لتسجيل الدخول مرة أخرى
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 btn btn-secondary"
            >
              إلغاء
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 btn btn-error"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserProfile;