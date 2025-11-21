'use client'
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { Tabs, TabsList, TabsTrigger } from '@/ui/tabs'
import toast from 'react-hot-toast'

export default function MyProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading: profileLoading, error: profileError } = useProfile()
  const [activeTab, setActiveTab] = useState<'my-profile' | 'kyc'>('my-profile')

  // Determine active tab based on pathname
  useEffect(() => {
    if (pathname === '/my-profile/kyc') {
      setActiveTab('kyc')
    } else if (pathname === '/my-profile') {
      setActiveTab('my-profile')
    }
  }, [pathname])

  // Show error toast when profile error occurs
  useEffect(() => {
    if (profileError) {
      toast.error(profileError.message || 'Không thể tải thông tin profile')
    }
  }, [profileError])

  // Handle tab change and navigate
  const handleTabChange = (value: string) => {
    const tabValue = value as 'my-profile' | 'kyc'
    setActiveTab(tabValue)
    
    if (tabValue === 'kyc') {
      router.push('/my-profile/kyc')
    } else {
      router.push('/my-profile')
    }
  }

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
    <div className='w-full min-h-svh flex justify-center items-center p-6 bg-[#FFFCF9] flex-1 '>
      
        <Tabs value={activeTab} onValueChange={handleTabChange} className='decoration-theme-black'>
          <TabsList className='grid grid-cols-2 mb-6 bg-transparent p-0 gap-0 w-fit mx-auto'>
            <TabsTrigger 
              value='my-profile' 
              className='bg-transparent w-fit decoration-theme-black border-0 border-b-2 border-gray-300 data-[state=active]:border-gray-800 data-[state=active]:text-gray-900 data-[state=active]:font-semibold text-gray-500 rounded-none pb-3'
            >
              My Profile
            </TabsTrigger>
            <TabsTrigger 
              value='kyc' 
              className='bg-transparent w-fit decoration-theme-black border-0 border-b-2 border-gray-300 data-[state=active]:border-gray-800 data-[state=active]:text-gray-900 data-[state=active]:font-semibold text-gray-500 rounded-none pb-3'
            >
              KYC
            </TabsTrigger>
          </TabsList>
          <div className='w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 min-h-[470px]'>
            <div className='mt-0 w-full'>
            {children}
           </div>
          </div>
        </Tabs>
    </div>
  )
}

