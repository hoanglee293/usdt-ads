'use client'
import React, { useState } from 'react'
import { Copy, Play, Wallet, ChevronUp, User } from 'lucide-react'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs'
import { toast } from 'sonner'

export default function SmartRefPage() {
    const [referralLink] = useState('https://memepump.vip/ref')
    const [showReferralStructure, setShowReferralStructure] = useState(true)
    const [activeTab, setActiveTab] = useState('level-referral')

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink)
            toast.success('Đã sao chép link giới thiệu')
        } catch (err) {
            toast.error('Không thể sao chép')
        }
    }

    const handleWithdraw = () => {
        // TODO: Implement withdraw functionality
        toast.info('Tính năng rút tiền đang được phát triển')
    }

    return (
        <div className='w-full min-h-svh flex pt-16 sm:pt-20 md:pt-24 justify-center items-start px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full max-w-7xl space-y-6'>
                {/* Title Section */}
                <div className='flex items-center justify-center gap-3 sm:gap-4 mb-6'>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center'>
                        <Play className='w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5' fill='white' />
                    </div>
                    <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-center'>
                        HOA HỒNG THU NHẬP
                    </h1>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center'>
                        <Play className='w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5' fill='white' />
                    </div>
                </div>

                {/* Your Referral Link Section */}
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6'>
                    <label className='block text-sm sm:text-base font-medium text-gray-700 mb-2'>
                        Your Referral Link
                    </label>
                    <div className='flex items-center gap-2'>
                        <Input
                            type='text'
                            value={referralLink}
                            readOnly
                            className='flex-1 bg-gray-50 text-sm sm:text-base'
                        />
                        <Button
                            onClick={handleCopyLink}
                            className='bg-gray-100 hover:bg-gray-200 text-gray-700 border-none'
                            size='icon'
                        >
                            <Copy className='w-4 h-4' />
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6'>
                    {/* Total Referrals Card */}
                    <div className='bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg p-4 sm:p-6 text-white shadow-lg'>
                        <h3 className='text-sm sm:text-base font-medium mb-2 opacity-90'>
                            Total Referrals
                        </h3>
                        <p className='text-2xl sm:text-3xl md:text-4xl font-bold'>32</p>
                    </div>

                    {/* Total Earnings Card */}
                    <div className='bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg p-4 sm:p-6 text-white shadow-lg'>
                        <h3 className='text-sm sm:text-base font-medium mb-2 opacity-90'>
                            Total Earnings
                        </h3>
                        <p className='text-2xl sm:text-3xl md:text-4xl font-bold mb-3'>$0.00000</p>
                        <Button
                            onClick={handleWithdraw}
                            className='w-full bg-white text-pink-600 hover:bg-gray-100 border-none font-medium'
                            size='sm'
                        >
                            <Wallet className='w-4 h-4 mr-2' />
                            Withdraw
                        </Button>
                    </div>

                    {/* Active Referrals Card */}
                    <div className='bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg p-4 sm:p-6 text-white shadow-lg'>
                        <h3 className='text-sm sm:text-base font-medium mb-2 opacity-90'>
                            Active Referrals
                        </h3>
                        <p className='text-2xl sm:text-3xl md:text-4xl font-bold'>0</p>
                    </div>
                </div>

                {/* Referral Structure Section */}
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6'>
                    <div className='flex items-center justify-between mb-4'>
                        <h2 className='text-lg sm:text-xl font-bold text-gray-800'>
                            Referral Structure
                        </h2>
                        <Button
                            onClick={() => setShowReferralStructure(!showReferralStructure)}
                            variant='ghost'
                            size='sm'
                            className='text-gray-600 hover:text-gray-800'
                        >
                            {showReferralStructure ? (
                                <>
                                    Hide <ChevronUp className='w-4 h-4 ml-1' />
                                </>
                            ) : (
                                'Show'
                            )}
                        </Button>
                    </div>
                    {showReferralStructure && (
                        <div className='flex flex-col items-center space-y-4 py-6'>
                            {/* Top Level */}
                            <div className='flex flex-col items-center'>
                                <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg'>
                                    <User className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
                                </div>
                                <p className='mt-2 text-sm sm:text-base font-semibold text-gray-700'>10%</p>
                            </div>

                            {/* Connection Lines */}
                            <div className='flex items-center justify-center space-x-8 sm:space-x-16'>
                                <div className='w-12 sm:w-16 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400'></div>
                                <div className='w-12 sm:w-16 h-0.5 bg-gradient-to-l from-pink-400 to-purple-400'></div>
                            </div>

                            {/* Bottom Level */}
                            <div className='flex items-center justify-center space-x-8 sm:space-x-16'>
                                <div className='flex flex-col items-center'>
                                    <div className='w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg'>
                                        <User className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
                                    </div>
                                    <p className='mt-2 text-sm font-semibold text-gray-700'>5%</p>
                                </div>
                                <div className='flex flex-col items-center'>
                                    <div className='w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg'>
                                        <User className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
                                    </div>
                                    <p className='mt-2 text-sm font-semibold text-gray-700'>5%</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Your Referrals Section */}
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6'>
                    <h2 className='text-lg sm:text-xl font-bold text-gray-800 mb-4'>
                        Your Referrals
                    </h2>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                        <TabsList className='grid w-full grid-cols-2 mb-4'>
                            <TabsTrigger value='referred-users' className='text-sm sm:text-base'>
                                Referred Users
                            </TabsTrigger>
                            <TabsTrigger value='level-referral' className='text-sm sm:text-base'>
                                Level Referral
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value='referred-users' className='mt-4'>
                            <div className='text-center py-8 text-gray-500'>
                                <p>No referred users yet</p>
                            </div>
                        </TabsContent>

                        <TabsContent value='level-referral' className='mt-4'>
                            {/* Table Header */}
                            <div className='grid grid-cols-3 gap-2 sm:gap-4 mb-4'>
                                <div className='bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-2 sm:p-3 text-center'>
                                    <p className='text-xs sm:text-sm font-semibold text-white'>
                                        Referral Count
                                    </p>
                                </div>
                                <div className='bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-2 sm:p-3 text-center'>
                                    <p className='text-xs sm:text-sm font-semibold text-white'>
                                        Claimable Volume
                                    </p>
                                </div>
                                <div className='bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-2 sm:p-3 text-center'>
                                    <p className='text-xs sm:text-sm font-semibold text-white'>
                                        Lifetime Volume
                                    </p>
                                </div>
                            </div>

                            {/* Level Referral Rows */}
                            <div className='space-y-4'>
                                {/* Level Referral 1 */}
                                <div className='grid grid-cols-4 gap-2 sm:gap-4 items-center'>
                                    <Button className='bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:opacity-90 text-xs sm:text-sm font-medium'>
                                        Level Referral 1
                                    </Button>
                                    <div className='bg-white border border-gray-200 rounded-lg p-2 sm:p-3 text-center'>
                                        <p className='text-xs sm:text-sm text-gray-700'>0</p>
                                    </div>
                                    <div className='bg-white border border-gray-200 rounded-lg p-2 sm:p-3 text-center'>
                                        <p className='text-xs sm:text-sm text-gray-700'>$0.00000</p>
                                    </div>
                                    <div className='bg-white border border-gray-200 rounded-lg p-2 sm:p-3 text-center'>
                                        <p className='text-xs sm:text-sm text-gray-700'>$0.00000</p>
                                    </div>
                                </div>

                                {/* Level Referral 2 */}
                                <div className='grid grid-cols-4 gap-2 sm:gap-4 items-center'>
                                    <Button className='bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:opacity-90 text-xs sm:text-sm font-medium'>
                                        Level Referral 2
                                    </Button>
                                    <div className='bg-white border border-gray-200 rounded-lg p-2 sm:p-3 text-center'>
                                        <p className='text-xs sm:text-sm text-gray-700'>0</p>
                                    </div>
                                    <div className='bg-white border border-gray-200 rounded-lg p-2 sm:p-3 text-center'>
                                        <p className='text-xs sm:text-sm text-gray-700'>$0.00000</p>
                                    </div>
                                    <div className='bg-white border border-gray-200 rounded-lg p-2 sm:p-3 text-center'>
                                        <p className='text-xs sm:text-sm text-gray-700'>$0.00000</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}