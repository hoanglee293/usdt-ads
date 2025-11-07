'use client'
import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Copy, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { getWalletByNetwork, getBalance, type WalletByNetworkResponse, type BalanceResponse } from '@/services/WalletService'
import { Skeleton } from '@/ui/skeleton'
import { Button } from '@/ui/button'

export default function DepositPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const networkId = searchParams.get('networkId')
    const networkName = searchParams.get('networkName')
    const networkSymbol = searchParams.get('networkSymbol')
    const coinSymbol = searchParams.get('coinSymbol')
    const coinId = searchParams.get('coinId')

    // Fetch wallet data when page loads and networkId is available
    const { data: walletResponse, isLoading, error } = useQuery<WalletByNetworkResponse>({
        queryKey: ['wallet-by-network', networkId],
        queryFn: async () => {
            if (!networkId) throw new Error('Network ID is required')
            return await getWalletByNetwork(Number(networkId))
        },
        enabled: !!networkId && networkId !== '',
    })

    // Fetch balance when coinId is available
    const { data: balanceResponse, isLoading: isLoadingBalance } = useQuery<BalanceResponse>({
        queryKey: ['balance', coinId],
        queryFn: async () => {
            if (!coinId) return null as any
            return await getBalance(Number(coinId))
        },
        enabled: !!coinId && coinId !== '',
    })

    const handleCopy = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success(`Đã sao chép ${type}`)
        } catch (err) {
            toast.error('Không thể sao chép')
        }
    }

    const formatAddress = (address: string) => {
        if (address.length <= 10) return address
        return `${address.substring(0, 6)}....${address.substring(address.length - 4)}`
    }

    const handleBack = () => {
        router.back()
    }

    // Format balance number
    const formatBalance = (balance: number) => {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(balance)
    }

    return (
        <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full max-w-2xl'>
                {/* Back Button */}
                <Button
                    onClick={handleBack}
                    variant="ghost"
                    className="mb-4 text-gray-600 cursor-pointer border-none bg-transparent hover:text-pink-500"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>

                {/* Header */}
                <div className="text-center mb-8">
                    {/* Balance Section */}
                    <div className='flex items-end justify-center mb-6'>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                        <div className='flex flex-col items-center mx-4'>
                            {isLoadingBalance ? (
                                <Skeleton className="h-8 w-48" />
                            ) : balanceResponse?.data ? (
                                <div className='flex flex-col items-center'>
                                    <span className='text-2xl font-bold text-center text-pink-500 font-orbitron'>
                                        Số dư: {formatBalance(balanceResponse.data.balance)} {coinSymbol || 'USDT'}
                                    </span>
                                    {(balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                        <span className='text-sm text-gray-600 mt-1'>
                                            (Quà: {formatBalance(balanceResponse.data.balance_gift)} | Thưởng: {formatBalance(balanceResponse.data.balance_reward)})
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className='text-2xl font-bold text-center text-pink-500 font-orbitron'>
                                    Số dư: 0.00 {coinSymbol || 'USDT'}
                                </span>
                            )}
                        </div>
                        <img src="/logo.png" alt="logo" className='w-10 h-10 object-cover pt-2' />
                    </div>
                    {networkName && networkSymbol && (
                        <p className="text-sm text-gray-600 mb-1">
                            Mạng lưới: <span className="font-semibold">{networkName} ({networkSymbol})</span>
                        </p>
                    )}
                    {coinSymbol && (
                        <p className="text-sm text-gray-600">
                            Coin: <span className="font-semibold">{coinSymbol}</span>
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center py-6 space-y-6 bg-transparent rounded-lg p-8">
                    {isLoading ? (
                        <>
                            <Skeleton className="w-64 h-64 rounded-lg" />
                            <Skeleton className="h-12 w-full max-w-sm" />
                        </>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-500 mb-2">Không thể tải thông tin ví</p>
                            <p className="text-sm text-gray-500">
                                {error instanceof Error ? error.message : 'Đã xảy ra lỗi'}
                            </p>
                        </div>
                    ) : walletResponse?.data ? (
                        <>
                            {/* QR Code */}
                            <div className="flex flex-col items-center">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                    Quét mã QR để nạp tiền
                                </p>
                                <div className="bg-white shadow-md p-4 rounded-lg border-2 border-gray-200">
                                    <img
                                        src={walletResponse.data.qr_code}
                                        alt="QR Code"
                                        className="w-64 h-64 object-contain"
                                    />
                                </div>
                            </div>

                            {/* Public Key / Address */}
                            <div className="w-full space-y-2">
                                <div className="flex items-center gap-2 p-3 bg-theme-pink-100/40 rounded-lg border border-gray-200 shadow-md">
                                    <label className="text-sm font-medium text-theme-red-100 block">
                                        Địa chỉ ví:
                                    </label>
                                    <span className="text-sm text-yellow-600 dark:text-yellow-400 italic break-all font-mono">
                                        {formatAddress(walletResponse.data.public_key)}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(walletResponse.data.public_key, 'địa chỉ ví')}
                                        className="text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent p-1"
                                        title="Sao chép địa chỉ"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    Chỉ gửi {coinSymbol || 'coin'} trên mạng {networkSymbol || 'network'} đến địa chỉ này
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Không có dữ liệu ví</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

