'use client'
import React, { useMemo, useRef } from 'react'
import { Copy, Wallet, Plus, Loader2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import {
    getWalletByNetwork,
    getTransactionHistory,
    type WalletByNetworkResponse,
    type TransactionHistoryResponse,
    type TransactionHistoryItem
} from '@/services/WalletService'
import { Skeleton } from '@/ui/skeleton'
import { useIsMobile } from '@/ui/use-mobile'
import { useLang } from '@/lang/useLang'
import { Button } from '@/ui/button'

interface DepositContentProps {
    networkId: string
    networkName?: string
    networkSymbol?: string
    coinSymbol?: string
    onCreateWallet?: (networkId: number) => void
    isCreatingWallet?: boolean
}

export default function DepositContent({
    networkId,
    networkName,
    networkSymbol,
    coinSymbol,
    onCreateWallet,
    isCreatingWallet = false
}: DepositContentProps) {
    const tableRef = useRef<HTMLDivElement>(null)
    const isMobile = useIsMobile()
    const { t, lang } = useLang()

    // Fetch wallet data
    const { data: walletResponse, isLoading, error } = useQuery<WalletByNetworkResponse>({
        queryKey: ['wallet-by-network', networkId],
        queryFn: async () => {
            if (!networkId) throw new Error('Network ID is required')
            return await getWalletByNetwork(Number(networkId))
        },
        enabled: !!networkId && networkId !== '',
        retry: false, // Don't retry on 404
    })

    // Check if error is 404 - Wallet not found
    const isWalletNotFound = useMemo(() => {
        if (!error) return false
        const axiosError = error as any
        const statusCode = axiosError?.response?.status || axiosError?.response?.data?.statusCode
        const message = (axiosError?.response?.data?.message || '').toLowerCase()
        return statusCode === 404 && (message.includes('wallet not found') || message.includes('not found'))
    }, [error])

    const handleCreateWallet = () => {
        if (!networkId || !onCreateWallet) return
        onCreateWallet(Number(networkId))
    }

    const handleCopy = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success(t('wallet.copied', { type }))
        } catch (err) {
            toast.error(t('wallet.copyError'))
        }
    }

    const formatAddress = (address: string) => {
        if (!address) return ''
        if (address.length <= 10) return address
        return `${address.substring(0, 4)}....${address.substring(address.length - 4)}`
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
        const locale = lang === 'kr' ? 'ko-KR' : lang === 'en' ? 'en-US' : 'vi-VN'
        return transactionHistoryResponse.data.map((transaction: TransactionHistoryItem) => {
            const date = new Date(transaction.created_at)
            const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            const dateStr = date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
            const formattedTime = `${time} ${dateStr}`
            const status = transaction.status === 'success' ? t('wallet.transactionStatus.complete') : t('wallet.transactionStatus.error')
            return {
                id: transaction.id,
                time: formattedTime,
                type: t('wallet.transactionTypes.deposit'),
                amount: `${transaction.amount} ${coinSymbol || 'USDT'}`,
                fromAddress: transaction.hash || '',
                toAddress: transaction.hash || '',
                transactionId: transaction.hash || '',
                status
            }
        })
    }, [transactionHistoryResponse, coinSymbol, t, lang])

    // Table styles
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 dark:text-[#FE645F] uppercase"
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 dark:text-gray-300 bg-white dark:bg-gray-800 border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    // Check if critical data is still loading
    const isInitialLoading = isLoading

    // Show loading screen before data is fully loaded
    if (isInitialLoading) {
        return (
            <div className="min-h-[20vh] flex items-center justify-center bg-theme-white-100 dark:bg-black">
                <div className="flex flex-col items-center gap-4 relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-x-pink-500 border-y-blue-600 border-double flex items-center justify-center absolute top-0 left-0 z-10 ml-[-8.5px] mt-[-9px]"></div>
                    <img src="/logo.png" alt="Loading" className="w-16 h-16" />
                </div>
            </div>
        )
    }

    return (
        <div className='w-full'>
            {/* Content */}
            <div className="flex flex-col items-center justify-center space-y-6 bg-transparent rounded-lg px-0 sm:px-8">
                {isLoading ? (
                    <>
                        <Skeleton className="w-64 h-64 rounded-lg" />
                        <Skeleton className="h-12 w-full max-w-sm" />
                    </>
                ) : isWalletNotFound ? (
                    // Show create wallet form when wallet not found (404)
                    <div className='w-full max-w-xl mx-auto p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700'>
                        <p className='text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 mb-2 sm:mb-3 text-center'>
                            {t('wallet.noWalletForNetwork', { name: networkName, symbol: networkSymbol })}
                        </p>
                        <Button
                            onClick={handleCreateWallet}
                            disabled={isCreatingWallet || !networkId}
                            className='w-full bg-gradient-to-r cursor-pointer from-fuchsia-600 via-rose-500 to-indigo-500 text-white rounded-full border-none h-10 sm:h-12 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {isCreatingWallet ? (
                                <>
                                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                    {t('wallet.creatingWallet')}
                                </>
                            ) : (
                                <>
                                    <Plus className='w-4 h-4 mr-2' />
                                    {t('wallet.createWalletFor', { symbol: networkSymbol })}
                                </>
                            )}
                        </Button>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-2">{t('wallet.loadNetworksError')}</p>
                        <p className="text-sm text-gray-500">
                            {error instanceof Error ? error.message : t('common.error')}
                        </p>
                    </div>
                ) : walletResponse?.data ? (
                    <>
                        {coinSymbol && networkSymbol && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                {t('wallet.deposit')} {coinSymbol} {t('wallet.onNetwork')} {networkSymbol}
                            </p>
                        )}
                        {/* QR Code */}
                        <div className="flex flex-col items-center">
                            <div className="bg-gray-300 dark:bg-gray-800 shadow-lg p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                                <img
                                    src={walletResponse.data.qr_code}
                                    alt="QR Code"
                                    className="w-48 md:w-64 h-48 md:h-64 object-contain"
                                />
                            </div>
                        </div>

                        {/* Public Key / Address */}
                        <div className="w-full space-y-2 md:max-w-xl mx-auto">
                            <div className="flex items-center md:gap-12 gap-2 p-3 bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                                <label className="text-xs md:text-sm font-medium text-theme-red-100 dark:text-[#FE645F] block">
                                    {t('wallet.walletAddress', { symbol: networkSymbol || '' })} :
                                </label>
                                <div className="text-xs md:text-sm text-yellow-600 dark:text-yellow-400 italic break-all font-mono flex items-center md:gap-2 gap-1">
                                    {formatAddress(walletResponse.data.public_key)}
                                    <button
                                        onClick={() => handleCopy(walletResponse.data.public_key, t('wallet.copyLabels.walletAddress'))}
                                        className="text-gray-400 cursor-pointer dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-none bg-transparent p-1"
                                        title={t('wallet.copyAddress')}
                                    >
                                        <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                </div>

                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">{t('wallet.loadNetworksError')}</p>
                    </div>
                )}
            </div>

            {/* Transaction History Section - Only show when wallet exists */}
            {walletResponse?.data && (
                <div className="w-full mt-8">
                <h3 className="text-base md:text-lg font-semibold text-theme-red-100 dark:text-[#FE645F] mb-4">
                    {t('wallet.transactionHistory')} - {t('wallet.transactionTypes.deposit')}
                </h3>
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
                            <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-gray-400 dark:text-gray-500 mb-2">
                                    <Wallet className="w-12 h-12 mx-auto" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('wallet.noTransactions')}
                                </p>
                            </div>
                        ) : (
                            transactions.map((transaction) => (
                                <div key={transaction.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md p-4">
                                    <div className="flex items-center justify-between md:mb-4 mb-2">
                                        <span className="text-sm text-black dark:text-white">#{transaction.id}</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`py-1 rounded-full text-xs px-1 flex justify-center font-medium ${transaction.status === t('wallet.transactionStatus.complete')
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                {transaction.status === t('wallet.transactionStatus.complete') ? <Check className='w-3.5 h-3.5' /> : <X className='w-3.5 h-3.5' />}
                                            </div>
                                            <div className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                                            {transaction.time}
                                        </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs md:text-base font-semibold text-black dark:text-white">
                                            {transaction.amount}
                                        </div>
                                        <div className="pt-0 md:pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-black dark:text-white min-w-[40px]">
                                                {t('wallet.addressLabels.txId')}:
                                            </span>
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                <span className="text-xs text-yellow-600 dark:text-yellow-400 italic break-all">
                                                    {formatAddress(transaction.transactionId)}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(transaction.transactionId, t('wallet.copyLabels.transactionId'))}
                                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition-colors border-none bg-transparent"
                                                    title={t('common.copy')}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
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
                                        <th className={`${tableHeaderStyles} w-[5%] text-left rounded-l-lg`}>{t('wallet.tableHeaders.stt')}</th>
                                        <th className={`${tableHeaderStyles} w-[12%]`}>{t('wallet.tableHeaders.time')}</th>
                                        <th className={`${tableHeaderStyles} w-[8%]`}>{t('wallet.tableHeaders.type')}</th>
                                        <th className={`${tableHeaderStyles} w-[10%]`}>{t('wallet.tableHeaders.amount')}</th>
                                        <th className={`${tableHeaderStyles} w-[12%]`}>{t('wallet.tableHeaders.transactionId')}</th>
                                        <th className={`${tableHeaderStyles} w-[11%] text-center rounded-r-lg`}>{t('wallet.tableHeaders.status')}</th>
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
                                            <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg border-solid">
                                                {t('wallet.noTransactions')}
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
                                                            {transaction.transactionId ? formatAddress(transaction.transactionId) : '-'}
                                                        </span>
                                                        {transaction.transactionId && (
                                                        <button
                                                            onClick={() => handleCopy(transaction.transactionId, t('wallet.copyLabels.transactionId'))}
                                                            className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-none bg-transparent mt-1.5'
                                                            title={t('wallet.copyAddress')}
                                                        >
                                                                <Copy className='w-3.5 h-3.5' />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={`${tableCellStyles} w-[11%] text-center rounded-r-lg border-l-0 border-theme-gray-100 border-solid`}>
                                                    <span
                                                        className={` px-1 font-medium flex justify-center items-center py-1.5 max-w-24 mx-auto rounded-full text-xs ${transaction.status === t('wallet.transactionStatus.complete')
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-red-500 text-white'
                                                            }`}
                                                    >
                                                        {transaction.status === t('wallet.transactionStatus.complete') ? t('common.success') : t('common.error')}
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
            )}
        </div>
    )
}

