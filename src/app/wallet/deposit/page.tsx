'use client'
import React, { Suspense, useMemo, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Copy, ArrowLeft, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { 
    getWalletByNetwork, 
    getBalance, 
    getTransactionHistory,
    type WalletByNetworkResponse, 
    type BalanceResponse,
    type TransactionHistoryResponse,
    type TransactionHistoryItem
} from '@/services/WalletService'
import { Skeleton } from '@/ui/skeleton'
import { Button } from '@/ui/button'
import { useIsMobile } from '@/ui/use-mobile'

function DepositPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const tableRef = useRef<HTMLDivElement>(null)
    const isMobile = useIsMobile()

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
        if (!address) return ''
        if (address.length <= 10) return address
        return `${address.substring(0, 6)}....${address.substring(address.length - 4)}`
    }

    // Fetch transaction history filtered by deposit type
    const { data: transactionHistoryResponse, isLoading: isLoadingTransactionHistory } = useQuery<TransactionHistoryResponse>({
        queryKey: ['transaction-history', 'deposit', coinSymbol, networkSymbol],
        queryFn: async () => {
            const params: any = { type: 'deposit' }
            if (coinSymbol) {
                params.coin = coinSymbol
            }
            if (networkSymbol) {
                params.network = networkSymbol
            }
            return await getTransactionHistory(params)
        },
        enabled: true
    })

    // Map transactions to UI format
    const transactions = useMemo(() => {
        if (!transactionHistoryResponse?.data) return []
        return transactionHistoryResponse.data.map((t: TransactionHistoryItem) => {
            const date = new Date(t.created_at)
            const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const formattedTime = `${time} ${dateStr}`
            const status = t.status === 'success' ? 'Complete' : 'Lỗi'
            return {
                id: t.id,
                time: formattedTime,
                type: 'Nạp',
                amount: `${t.amount} ${coinSymbol || 'USDT'}`,
                fromAddress: t.hash || '',
                toAddress: t.hash || '',
                transactionId: t.hash || '',
                status
            }
        })
    }, [transactionHistoryResponse, coinSymbol])

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

    // Table styles
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 uppercase "
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 bg-white border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    return (
        <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full container mx-auto'>
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
                                    <span className='text-2xl font-bold text-center text-pink-500  '>
                                        Số dư: {formatBalance(balanceResponse.data.balance)} {coinSymbol || 'USDT'}
                                    </span>
                                    {(balanceResponse.data.balance_gift > 0 || balanceResponse.data.balance_reward > 0) && (
                                        <span className='text-sm text-gray-600 mt-1'>
                                            (Quà: {formatBalance(balanceResponse.data.balance_gift)} | Thưởng: {formatBalance(balanceResponse.data.balance_reward)})
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className='text-2xl font-bold text-center text-pink-500  '>
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

                {/* Transaction History Section */}
                <div className="w-full mt-8">
                    <h3 className="text-lg font-semibold text-theme-red-100 mb-4">Lịch sử nạp tiền</h3>
                    {isMobile ? (
                        // Mobile: Card Layout
                        <div className="w-full space-y-3">
                            {isLoadingTransactionHistory ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-12 px-4 bg-white rounded-lg border border-gray-200">
                                    <div className="text-gray-400 mb-2">
                                        <Wallet className="w-12 h-12 mx-auto" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Chưa có giao dịch nạp tiền nào
                                    </p>
                                </div>
                            ) : (
                                transactions.map((transaction) => (
                                    <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-500">#{transaction.id}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="py-1 rounded-full text-xs min-w-20 flex justify-center font-medium bg-blue-100 text-blue-700">
                                                    {transaction.type}
                                                </div>
                                                <div className={`py-1 rounded-full text-xs min-w-20 flex justify-center font-medium ${
                                                    transaction.status === 'Complete'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {transaction.status}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="text-base font-semibold text-red-500">
                                                {transaction.amount}
                                            </div>
                                            <div className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                                                {transaction.time}
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-600 min-w-[60px]">TX ID:</span>
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    <span className="text-xs text-yellow-600 dark:text-yellow-400 italic break-all">
                                                        {formatAddress(transaction.transactionId)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(transaction.transactionId, 'mã giao dịch')}
                                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors border-none bg-transparent"
                                                        title="Sao chép mã giao dịch"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // Desktop: Table Layout
                        <div className="block overflow-hidden rounded-md bg-transparent border border-none">
                            {/* Fixed Header */}
                            <div className="overflow-hidden rounded-t-md">
                                <table className={tableStyles}>
                                    <thead>
                                        <tr>
                                            <th className={`${tableHeaderStyles} w-[5%] text-left rounded-l-lg`}>STT</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>THỜI GIAN</th>
                                            <th className={`${tableHeaderStyles} w-[8%]`}>TYPE</th>
                                            <th className={`${tableHeaderStyles} w-[10%]`}>SỐ TIỀN</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>FROM ADDRESS</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>TO ADDRESS</th>
                                            <th className={`${tableHeaderStyles} w-[12%]`}>TRANSACTION ID</th>
                                            <th className={`${tableHeaderStyles} w-[11%] text-center rounded-r-lg`}>STATUS</th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>

                            {/* Scrollable Body */}
                            <div className={tableContainerStyles} ref={tableRef}>
                                <table className={tableStyles}>
                                    <tbody>
                                        {isLoadingTransactionHistory ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8">
                                                    <Skeleton className="h-8 w-full" />
                                                </td>
                                            </tr>
                                        ) : transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8 text-gray-500 bg-white shadow-lg border border-gray-200 rounded-lg border-solid">
                                                    Chưa có giao dịch rút tiền nào
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map((transaction) => (
                                                <tr key={transaction.id} className="group transition-colors">
                                                    <td className={`${tableCellStyles} w-[5%] text-left !pl-4 rounded-l-lg border-l border-r-0 border-theme-gray-100 border-solid`}>
                                                        {transaction.id}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        {transaction.time}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[8%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        {transaction.type}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[10%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        {transaction.amount}
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-xs sm:text-sm lg:text-base text-yellow-500 dark:text-yellow-400 italic min-w-20'>
                                                                {formatAddress(transaction.fromAddress)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(transaction.fromAddress, 'địa chỉ gửi')}
                                                                className='text-gray-400 hover:text-gray-200 transition-colors border-none bg-transparent mt-1.5'
                                                                title='Sao chép địa chỉ'
                                                            >
                                                                <Copy className='w-3.5 h-3.5' />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-xs sm:text-sm lg:text-base text-yellow-500 dark:text-yellow-400 italic min-w-20'>
                                                                {formatAddress(transaction.toAddress)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(transaction.toAddress, 'địa chỉ nhận')}
                                                                className='text-gray-400 hover:text-gray-200 transition-colors border-none bg-transparent mt-1.5'
                                                                title='Sao chép địa chỉ'
                                                            >
                                                                <Copy className='w-3.5 h-3.5' />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[12%] border-x-0 border-theme-gray-100 border-solid`}>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-xs sm:text-sm lg:text-base text-yellow-500 dark:text-yellow-400 italic min-w-20'>
                                                                {formatAddress(transaction.transactionId)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(transaction.transactionId, 'mã giao dịch')}
                                                                className='text-gray-400 hover:text-gray-200 transition-colors border-none bg-transparent mt-1.5'
                                                                title='Sao chép mã giao dịch'
                                                            >
                                                                <Copy className='w-3.5 h-3.5' />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className={`${tableCellStyles} w-[11%] text-center rounded-r-lg border-l-0 border-theme-gray-100 border-solid`}>
                                                        <span
                                                            className={` px-1 font-medium flex justify-center items-center py-1.5 max-w-24 mx-auto rounded-full text-xs ${transaction.status === 'Complete'
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-red-500 text-white'
                                                                }`}
                                                        >
                                                            {transaction.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function DepositPage() {
    return (
        <Suspense fallback={
            <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
                <div className='w-full container mx-auto'>
                    <Skeleton className="h-10 w-32 mb-4" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        }>
            <DepositPageContent />
        </Suspense>
    )
}

