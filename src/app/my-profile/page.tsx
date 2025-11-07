'use client'
import React, { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import CustomDateInput from '@/components/CustomDateInput'
import CustomSelect from '@/components/CustomSelect'
import { UserProfile } from '@/services/AuthService'
import { Pencil, Check, X, User2 } from 'lucide-react'

const page = () => {
  const { profile, loading: profileLoading, error: profileError } = useProfile()
  const { updateProfile, isLoading: updateLoading, error: updateError } = useUpdateProfile()

  const [displayName, setDisplayName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [sex, setSex] = useState<'man' | 'woman' | 'other'>('man')

  // Track which field is being edited
  const [editingField, setEditingField] = useState<'displayName' | 'birthday' | 'sex' | null>(null)

  // Temporary values for editing
  const [tempDisplayName, setTempDisplayName] = useState('')
  const [tempBirthday, setTempBirthday] = useState('')
  const [tempSex, setTempSex] = useState<'man' | 'woman' | 'other'>('man')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  // Handle edit field
  const handleEditField = (field: 'displayName' | 'birthday' | 'sex') => {
    setEditingField(field)
    setError('')
    setSuccess('')

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
    setError('')
    setSuccess('')
  }

  // Handle save field
  const handleSaveField = async (field: 'displayName' | 'birthday' | 'sex') => {
    setError('')
    setSuccess('')

    try {
      // Always include display_name in update (required field)
      const updateData: { display_name: string; birthday?: string; sex?: 'man' | 'woman' | 'other' } = {
        display_name: displayName.trim(),
      }

      if (field === 'displayName') {
        const value = tempDisplayName.trim()
        if (!value) {
          setError('Tên hiển thị không được để trống')
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
      setSuccess('Cập nhật thông tin thành công!')
      setEditingField(null)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('')
      }, 3000)
    } catch (err: any) {
      const errorMessage = err?.message ||
        err?.response?.data?.message ||
        'Không thể cập nhật thông tin. Vui lòng thử lại.'
      setError(errorMessage)
    }
  }

  const sexOptions = [
    { value: 'man', label: 'Nam' },
    { value: 'woman', label: 'Nữ' },
    { value: 'other', label: 'Khác' },
  ]

  if (profileLoading) {
    return (
      <div className='w-full min-h-screen flex justify-center items-center p-6'>
        <div className='text-center'>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className='mt-4 text-gray-600'>Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className='w-full min-h-screen flex justify-center items-center p-6'>
        <div className='text-center'>
          <p className='text-red-600 text-lg'>
            {profileError?.message || 'Không thể tải thông tin profile'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full min-h-svh flex justify-center items-center p-6 bg-[#FFFCF9] flex-1'>
      <div className='w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8'>
        {error && (
          <div className='w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
            {error}
          </div>
        )}

        {success && (
          <div className='w-full mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm'>
            {success}
          </div>
        )}

        {updateError && (
          <div className='w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm'>
            {updateError.message || 'Có lỗi xảy ra khi cập nhật'}
          </div>
        )}

        <div className='space-y-6'>
          <div className='flex justify-center items-center bg-theme-gray-100 rounded-full p-2 w-20 h-20 mx-auto'>
            <User2 size={32} />
          </div>
          {/* Display Name */}
          <div className='space-y-2'>
            <label htmlFor="display_name" className='block text-sm font-semibold text-gray-700'>
              Tên hiển thị <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              {editingField === 'displayName' ? (
                <>
                  <input
                    id="display_name"
                    type="text"
                    value={tempDisplayName}
                    onChange={(e) => setTempDisplayName(e.target.value)}
                    placeholder='Nhập tên hiển thị'
                    disabled={updateLoading}
                    className='w-full px-4 py-3 pr-24 border border-solid focus:border-gray-300 border-theme-gray-100 rounded-full outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    autoFocus
                  />
                  <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2'>
                    <button
                      type="button"
                      onClick={() => handleSaveField('displayName')}
                      disabled={updateLoading}
                      className='h-9 w-9 flex items-center justify-center bg-green-500 text-white rounded-full border-none hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      title='Lưu'
                    >
                      <Check size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={updateLoading}
                      className='h-9 w-9 flex items-center justify-center bg-red-500 text-white rounded-full border-none hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      title='Hủy'
                    >
                      <X size={20} />
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
                    className='w-full px-4 py-3 pr-12 border border-solid border-theme-gray-100 rounded-full outline-none bg-gray-50 text-gray-900 cursor-not-allowed'
                  />
                  <button
                    type="button"
                    onClick={() => handleEditField('displayName')}
                    disabled={updateLoading}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 bg-transparent border-none rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    title='Chỉnh sửa'
                  >
                    <Pencil size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className='flex justify-between items-center gap-6'>
            {/* Read-only fields */}
            <div className='space-y-2 flex-1'>
              <label className='block text-sm font-semibold text-gray-700'>
                Email
              </label>
              <input
                type="email"
                value={profile.email || ''}
                disabled
                className='w-full px-4 py-3 border border-solid border-theme-gray-100 rounded-full outline-none bg-white text-gray-600 cursor-not-allowed'
              />
            </div>

            <div className='space-y-2 flex-1'>
              <label className='block text-sm font-semibold text-gray-700'>
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={profile.name || ''}
                disabled
                className='w-full px-4 py-3 border border-solid border-theme-gray-100 rounded-full outline-none bg-white text-gray-600 cursor-not-allowed'
              />
            </div>
          </div>

          <div className='flex justify-between items-center gap-6'>
            {/* Birthday */}
            <div className='space-y-2 flex-1'>
              <label htmlFor="birthday" className='block text-sm font-semibold text-gray-700'>
                Ngày sinh
              </label>
              <div className='relative'>
                {editingField === 'birthday' ? (
                  <>
                    <div className='pr-24'>
                      <CustomDateInput
                        id="birthday"
                        value={tempBirthday}
                        onChange={(e) => setTempBirthday(e.target.value)}
                        disabled={updateLoading}
                        placeholder='Chọn ngày sinh'
                      />
                    </div>
                    <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2'>
                      <button
                        type="button"
                        onClick={() => handleSaveField('birthday')}
                        disabled={updateLoading}
                        className='h-9 w-9 flex items-center justify-center border-none bg-green-500 text-white rounded-full hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                        title='Lưu'
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={updateLoading}
                        className='h-9 w-9 flex items-center justify-center border-none bg-red-500 text-white rounded-full hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                        title='Hủy'
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='pr-12'>
                      <CustomDateInput
                        id="birthday"
                        value={birthday}
                        onChange={() => { }}
                        disabled={true}
                        placeholder='Chọn ngày sinh'
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditField('birthday')}
                      disabled={updateLoading}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10 border-none bg-transparent'
                      title='Chỉnh sửa'
                    >
                      <Pencil size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sex */}
            <div className='space-y-2 flex-1'>
              <label htmlFor="sex" className='block text-sm font-semibold text-gray-700'>
                Giới tính
              </label>
              <div className='relative'>
                {editingField === 'sex' ? (
                  <>
                    <div className='pr-24'>
                      <CustomSelect
                        id="sex"
                        value={tempSex}
                        onChange={(e) => setTempSex(e.target.value as 'man' | 'woman' | 'other')}
                        options={sexOptions}
                        disabled={updateLoading}
                      />
                    </div>
                    <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2'>
                      <button
                        type="button"
                        onClick={() => handleSaveField('sex')}
                        disabled={updateLoading}
                        className='h-9 w-9 flex items-center justify-center bg-green-500 text-white rounded-full border-none hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                        title='Lưu'
                      >
                        <Check size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={updateLoading}
                        className='h-9 w-9 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 border-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                        title='Hủy'
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='pr-12'>
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
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 bg-transparent border-none rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10'
                      title='Chỉnh sửa'
                    >
                      <Pencil size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {profile.phone && (
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Số điện thoại
              </label>
              <input
                type="tel"
                value={profile.phone}
                disabled
                className='w-full px-4 py-3 border border-solid border-theme-gray-100 rounded-full outline-none bg-gray-50 text-gray-600 cursor-not-allowed'
              />
            </div>
          )}

          {/* Sex */}
          <div className='flex items-center gap-6'>
            <label htmlFor="sex" className='block text-sm font-semibold text-gray-700'>
              Referral:
            </label>
            <div className='relative text-sm'>
              <span>{profile.ref}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page
