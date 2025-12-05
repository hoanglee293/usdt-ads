'use client'
import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { useLang } from '@/lang/useLang'
import { Tabs, TabsList, TabsTrigger } from '@/ui/tabs'
import toast from 'react-hot-toast'

export default function MyProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useLang()
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
      toast.error(profileError.message || t('profile.loadError'))
    }
  }, [profileError, t])

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
      <div className='w-full min-h-screen flex justify-center items-center px-3 sm:px-4 md:px-6 py-4 sm:py-6'>
        <div className='text-center'>
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
          <p className='mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400'>{t('profile.loading')}</p>
        </div>
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className='w-full min-h-screen flex justify-center items-center px-3 sm:px-4 md:px-6 py-4 sm:py-6'>
        <div className='text-center'>
          <p className='text-sm sm:text-base md:text-lg text-red-600 dark:text-red-400'>
            {profileError?.message || t('profile.loadError')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-28 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] dark:bg-black flex-1'>
      <Tabs value={activeTab} onValueChange={handleTabChange} className='decoration-theme-black shadow-md rounded-lg px-4 sm:px-6 md:px-8 bg-transparent border-none w-full max-w-4xl mx-auto flex flex-col gap-[5vh]'>
        <TabsList className='grid grid-cols-2 mb-6 sm:mb-8 md:mb-10 bg-transparent p-0 gap-4 sm:gap-6 md:gap-10 w-full sm:w-fit mx-auto'>
          <TabsTrigger 
            value='my-profile' 
            className='bg-transparent w-full sm:w-fit text-base sm:text-lg md:text-xl decoration-theme-black border-0 border-b-2 border-gray-300 dark:border-gray-700 data-[state=active]:border-gray-800 dark:data-[state=active]:border-gray-200 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:font-semibold text-gray-500 dark:text-gray-400 rounded-none pb-2 sm:pb-3 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
          >
            {t('profile.myProfile')}
          </TabsTrigger>
          <TabsTrigger 
            value='kyc' 
            className='bg-transparent w-full sm:w-fit text-base sm:text-lg md:text-xl decoration-theme-black border-0 border-b-2 border-gray-300 dark:border-gray-700 data-[state=active]:border-gray-800 dark:data-[state=active]:border-gray-200 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:font-semibold text-gray-500 dark:text-gray-400 rounded-none pb-2 sm:pb-3 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
          >
            {t('profile.kyc')}
          </TabsTrigger>
        </TabsList>
        <div className='w-full max-w-4xl min-w-0 sm:min-w-[500px] md:min-w-[684.52px] min-h-[400px] mx-auto bg-transparent rounded-lg border border-gray-200 dark:border-[#FE645F] flex items-center justify-center'>
          <div className='mt-0 w-full px-2 sm:px-0'>
            {children}
          </div>
        </div>
      </Tabs>
    </div>
  )
}

