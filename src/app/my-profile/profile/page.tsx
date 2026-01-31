'use client'
import React, { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import CustomDateInput from '@/components/CustomDateInput'
import CustomSelect from '@/components/CustomSelect'
import Modal from '@/components/Modal'
import { Pencil, Check, X, User2, LockIcon, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lang/useLang'
import { changePassword } from '@/services/AuthService'

const ProfilePage = () => {
  const { profile, loading: profileLoading, error: profileError } = useProfile()
  const { updateProfile, isLoading: updateLoading, error: updateError } = useUpdateProfile()
  const { t } = useLang()

  const [displayName, setDisplayName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [sex, setSex] = useState<'man' | 'woman' | 'other'>('man')

  // Track which field is being edited
  const [editingField, setEditingField] = useState<'displayName' | 'birthday' | 'sex' | null>(null)

  // Temporary values for editing
  const [tempDisplayName, setTempDisplayName] = useState('')
  const [tempBirthday, setTempBirthday] = useState('')
  const [tempSex, setTempSex] = useState<'man' | 'woman' | 'other'>('man')

  // Change Password Modal State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      // Convert ISO date to YYYY-MM-DD format for date input
      if (profile.birthday) {
        const date = new Date(profile.birthday)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        setBirthday(`${year}-${month}-${day}`)
      } else {
        setBirthday('')
      }
      setSex(profile.sex || 'man')
    }
  }, [profile])

  // Show error toast when profile error occurs
  useEffect(() => {
    if (profileError) {
      toast.error(profileError.message || t('profile.loadError'))
    }
  }, [profileError, t])

  // Show error toast when update error occurs
  useEffect(() => {
    if (updateError) {
      const errorMessage = updateError.message || t('profile.updateError')

      // Handle specific error messages
      if (errorMessage.includes('Display name cannot be empty')) {
        toast.error(t('profile.displayNameCannotBeEmpty'))
        return
      }

      toast.error(errorMessage)
    }
  }, [updateError, t])

  // Handle edit field
  const handleEditField = (field: 'displayName' | 'birthday' | 'sex') => {
    setEditingField(field)

    if (field === 'displayName') {
      setTempDisplayName(displayName)
    } else if (field === 'birthday') {
      setTempBirthday(birthday)
    } else if (field === 'sex') {
      setTempSex(sex)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingField(null)
  }

  // Handle save field
  const handleSaveField = async (field: 'displayName' | 'birthday' | 'sex') => {
    try {
      // Always include display_name in update (required field)
      const updateData: { display_name: string; birthday?: string; sex?: 'man' | 'woman' | 'other' } = {
        display_name: displayName.trim(),
      }

      if (field === 'displayName') {
        const value = tempDisplayName.trim()
        if (!value) {
          toast.error(t('profile.displayNameCannotBeEmpty'))
          return
        }
        updateData.display_name = value
        setDisplayName(value)
      } else if (field === 'birthday') {
        updateData.birthday = tempBirthday || undefined
        setBirthday(tempBirthday)
      } else if (field === 'sex') {
        updateData.sex = tempSex
        setSex(tempSex)
      }

      await updateProfile(updateData)
      toast.success(t('profile.updateSuccess'))
      setEditingField(null)
    } catch (err: any) {
      const errorMessage = err?.message ||
        err?.response?.data?.message ||
        t('profile.updateError')

      // Handle specific error messages
      if (errorMessage.includes('Display name cannot be empty')) {
        toast.error(t('profile.displayNameCannotBeEmpty'))
        return
      }

      // Default error message
      toast.error(errorMessage)
    }
  }

  const sexOptions = [
    { value: 'man', label: t('profile.genderMale') },
    { value: 'woman', label: t('profile.genderFemale') },
    { value: 'other', label: t('profile.genderOther') },
  ]

  // Handle Change Password Modal
  const handleOpenChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const handleCloseChangePasswordModal = () => {
    setIsChangePasswordModalOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!currentPassword.trim()) {
      toast.error(t('changePassword.currentPasswordRequired') || 'Mật khẩu hiện tại là bắt buộc')
      return
    }

    if (!newPassword.trim()) {
      toast.error(t('changePassword.newPasswordRequired') || 'Mật khẩu mới là bắt buộc')
      return
    }

    if (newPassword.length < 6) {
      toast.error(t('changePassword.newPasswordMinLength') || 'Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('changePassword.passwordMismatch') || 'Mật khẩu xác nhận không khớp')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await changePassword({
        current_password: currentPassword,
        new_password: newPassword
      })

      if (response && response.statusCode === 200) {
        toast.success(t('changePassword.resetPasswordSuccess') || 'Đổi mật khẩu thành công!')
        handleCloseChangePasswordModal()
      }
    } catch (err: any) {
      const errorMessage = err?.message ||
        err?.response?.data?.message ||
        t('changePassword.currentPasswordIncorrect') ||
        'Có lỗi xảy ra khi đổi mật khẩu'

      // Handle specific error messages
      if (errorMessage.includes('Current password is required')) {
        toast.error(t('changePassword.currentPasswordRequired') || 'Mật khẩu hiện tại là bắt buộc')
      } else if (errorMessage.includes('New password is required')) {
        toast.error(t('changePassword.newPasswordRequired') || 'Mật khẩu mới là bắt buộc')
      } else if (errorMessage.includes('New password must be at least 6 characters long')) {
        toast.error(t('changePassword.newPasswordMinLength') || 'Mật khẩu mới phải có ít nhất 6 ký tự')
      } else if (errorMessage.includes('Current password is incorrect')) {
        toast.error(t('changePassword.currentPasswordIncorrect') || 'Mật khẩu hiện tại không đúng')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (profileLoading) {
    return (
      <div className='w-full flex justify-center items-center p-4 sm:p-6'>
        <div className='text-center'>
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
          <p className='mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400'>{t('profile.loadingInfo')}</p>
        </div>
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className='w-full flex justify-center items-center p-4 sm:p-6'>
        <div className='text-center'>
          <p className='text-sm sm:text-base md:text-lg text-red-600 dark:text-red-400'>
            {profileError?.message || t('profile.cannotLoadProfile')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex justify-center items-center bg-theme-gray-100 dark:bg-gray-800 rounded-full p-1.5 sm:p-2 w-16 h-16 sm:w-20 sm:h-20 mx-auto'>
        <User2 size={24} className='sm:w-8 sm:h-8 text-gray-700 dark:text-gray-300' />
      </div>
      {/* Display Name */}
      <div className='space-y-2'>
        <label htmlFor="display_name" className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
          {t('profile.displayName')} <span className='text-red-500 dark:text-red-400'>*</span>
        </label>
        <div className='relative'>
          {editingField === 'displayName' ? (
            <>
              <input
                id="display_name"
                type="text"
                value={tempDisplayName}
                onChange={(e) => setTempDisplayName(e.target.value)}
                placeholder={t('profile.displayNamePlaceholder')}
                disabled={updateLoading}
                className='w-full px-2 sm:px-4 sm:py-2 pr-20 sm:pr-24 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500'
                autoFocus
              />
              <div className='absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 flex gap-1.5 sm:gap-2'>
                <button
                  type="button"
                  onClick={() => handleSaveField('displayName')}
                  disabled={updateLoading}
                  className='h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center bg-green-500 dark:bg-green-600 text-white rounded-full border-none hover:bg-green-600 dark:hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                  title={t('common.save')}
                >
                  <Check size={18} className='sm:w-5 sm:h-5' />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={updateLoading}
                  className='h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center bg-red-500 dark:bg-red-600 text-white rounded-full border-none hover:bg-red-600 dark:hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                  title={t('common.cancel')}
                >
                  <X size={18} className='sm:w-5 sm:h-5' />
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                id="display_name"
                type="text"
                value={displayName}
                disabled
                className='w-full px-2 sm:px-4 sm:py-2 pr-10 sm:pr-12 border border-solid border-theme-gray-100 dark:border-gray-700 rounded-full outline-none bg-gray-50 dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-gray-300 cursor-not-allowed'
              />
              <button
                type="button"
                onClick={() => handleEditField('displayName')}
                disabled={updateLoading}
                className='absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 bg-transparent border-none rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                title={t('common.edit')}
              >
                <Pencil size={18} className='sm:w-5 sm:h-5' />
              </button>
            </>
          )}
        </div>
      </div>
      <div className='flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-6'>
        {/* Read-only fields */}
        <div className='space-y-2 flex-1'>
          <label className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
            {t('profile.email')}
          </label>
          <input
            type="email"
            value={profile.email || ''}
            disabled
            className='w-full px-2 sm:px-4 py-2 border border-solid border-theme-gray-100 dark:border-gray-700 rounded-full outline-none bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-600 dark:text-gray-400 cursor-not-allowed'
          />
        </div>

        <div className='space-y-2 flex-1'>
          <label className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
            {t('profile.username')}
          </label>
          <input
            type="text"
            value={profile.name || ''}
            disabled
            className='w-full px-2 sm:px-4 py-2 border border-solid border-theme-gray-100 dark:border-gray-700 rounded-full outline-none bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-600 dark:text-gray-400 cursor-not-allowed'
          />
        </div>
      </div>

      <div className='flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-6'>
        {/* Birthday */}
        <div className='space-y-2 flex-1'>
          <label htmlFor="birthday" className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
            {t('profile.birthday')}
          </label>
          <div className='relative'>
            {editingField === 'birthday' ? (
              <>
                <div className='pr-20 sm:pr-24'>
                  <CustomDateInput
                    id="birthday"
                    value={tempBirthday}
                    onChange={(e) => setTempBirthday(e.target.value)}
                    disabled={updateLoading}
                    placeholder={t('profile.birthdayPlaceholder')}
                    disableFuture={true}
                  />
                </div>
                <div className='absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 flex gap-1.5 sm:gap-2'>
                  <button
                    type="button"
                    onClick={() => handleSaveField('birthday')}
                    disabled={updateLoading}
                    className='h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center border-none bg-green-500 dark:bg-green-600 text-white rounded-full hover:bg-green-600 dark:hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    title={t('common.save')}
                  >
                    <Check size={16} className='sm:w-4 sm:h-4' />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={updateLoading}
                    className='h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center border-none bg-red-500 dark:bg-red-600 text-white rounded-full hover:bg-red-600 dark:hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    title={t('common.cancel')}
                  >
                    <X size={16} className='sm:w-4 sm:h-4' />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className='pr-10 sm:pr-12'>
                  <CustomDateInput
                    id="birthday"
                    value={birthday}
                    onChange={() => { }}
                    disabled={true}
                    placeholder={t('profile.birthdayPlaceholder')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleEditField('birthday')}
                  disabled={updateLoading}
                  className='absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10 border-none bg-transparent'
                  title={t('common.edit')}
                >
                  <Pencil size={18} className='sm:w-5 sm:h-5' />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sex */}
        <div className='space-y-2 flex-1'>
          <label htmlFor="sex" className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
            {t('profile.gender')}
          </label>
          <div className='relative'>
            {editingField === 'sex' ? (
              <>
                <div className='pr-20 sm:pr-24'>
                  <CustomSelect
                    id="sex"
                    value={tempSex}
                    onChange={(value) => setTempSex(value as 'man' | 'woman' | 'other')}
                    options={sexOptions}
                    disabled={updateLoading}
                  />
                </div>
                <div className='absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 flex gap-1.5 sm:gap-2'>
                  <button
                    type="button"
                    onClick={() => handleSaveField('sex')}
                    disabled={updateLoading}
                    className='h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center bg-green-500 dark:bg-green-600 text-white rounded-full border-none hover:bg-green-600 dark:hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    title={t('common.save')}
                  >
                    <Check size={18} className='sm:w-5 sm:h-5' />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={updateLoading}
                    className='h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center bg-red-500 dark:bg-red-600 text-white rounded-full hover:bg-red-600 dark:hover:bg-red-700 border-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    title={t('common.cancel')}
                  >
                    <X size={18} className='sm:w-5 sm:h-5' />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className='pr-10 sm:pr-12'>
                  <CustomSelect
                    id="sex"
                    value={sex}
                    onChange={() => { }}
                    options={sexOptions}
                    disabled={true}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleEditField('sex')}
                  disabled={updateLoading}
                  className='absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 bg-transparent border-none rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10'
                  title={t('common.edit')}
                >
                  <Pencil size={18} className='sm:w-5 sm:h-5' />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {profile.phone && (
        <div className='space-y-2'>
          <label className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
            {t('profile.phoneNumber')}
          </label>
          <input
            type="tel"
            value={profile.phone}
            disabled
            className='w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-solid border-theme-gray-100 dark:border-gray-700 rounded-full outline-none bg-gray-50 dark:bg-gray-800 text-sm sm:text-base text-gray-600 dark:text-gray-400 cursor-not-allowed'
          />
        </div>
      )}

      <div className='flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-6'>
        {/* Referral */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6'>
          <label htmlFor="sex" className='block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
            {t('profile.referral')}
          </label>
          <div className='relative text-sm sm:text-base'>
            <span className='text-gray-900 dark:text-gray-200 break-all'>{profile.ref}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenChangePasswordModal}
          className='out-line border-none px-6 py-2 bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm uppercase cursor-pointer'
          title={t('profile.changePasswordButton')}
        >
          {t('profile.changePasswordButton')}
        </button>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordModalOpen}
        onClose={handleCloseChangePasswordModal}
        title={t('changePassword.title') || 'Đổi mật khẩu'}
        maxWidth="max-w-md"
        showCloseButton={false}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('changePassword.currentPassword') || 'Mật khẩu hiện tại'} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('changePassword.currentPasswordPlaceholder') || 'Nhập mật khẩu hiện tại'}
                disabled={isChangingPassword}
                className="w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
              {currentPassword.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none cursor-pointer bg-transparent border-none"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('changePassword.newPassword') || 'Mật khẩu mới'} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('changePassword.newPasswordPlaceholder') || 'Nhập mật khẩu mới (ít nhất 6 ký tự)'}
                disabled={isChangingPassword}
                className="w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {newPassword.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none cursor-pointer bg-transparent border-none"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('changePassword.confirmPassword') || 'Xác nhận mật khẩu'} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('changePassword.confirmPasswordPlaceholder') || 'Nhập lại mật khẩu mới'}
                disabled={isChangingPassword}
                className="w-full px-4 py-3 border border-solid focus:border-gray-300 dark:focus:border-gray-600 border-theme-gray-100 dark:border-gray-700 rounded-full outline-none transition-all pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {confirmPassword.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none cursor-pointer bg-transparent border-none"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseChangePasswordModal}
              disabled={isChangingPassword}
              className="flex-1 px-4 py-2.5 border dark:border-gray-300 border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-full bg-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none border-solid hover:bg-theme-gray-100 dark:hover:bg-theme-gray-100/20 cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex-1 px-4 py-2.5 outline-none border-none bg-gradient-to-r from-[#fe645f] to-[#c68afe] text-white font-semibold rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {isChangingPassword ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('changePassword.resetting') || 'Đang đổi...'}
                </>
              ) : (
                t('changePassword.resetPassword') || 'Đổi mật khẩu'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProfilePage

