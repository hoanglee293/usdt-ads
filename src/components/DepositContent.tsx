'use client'
import React, { useMemo, useRef } from 'react'
import { Copy, Wallet } from 'lucide-react'
import { toast } from 'sonner'
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

interface DepositContentProps {
    networkId: string
    networkName?: string
    networkSymbol?: string
    coinSymbol?: string
}

export default function DepositContent({
    networkId,
    networkName,
    networkSymbol,
    coinSymbol
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
    })

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

    return (
        <div className='w-full'>
            {/* Content */}
            <div className="flex flex-col items-center justify-center space-y-6 bg-transparent rounded-lg px-4 sm:px-8">
                {isLoading ? (
                    <>
                        <Skeleton className="w-64 h-64 rounded-lg" />
                        <Skeleton className="h-12 w-full max-w-sm" />
                    </>
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
                                {t('wallet.deposit')} {coinSymbol} trên mạng {networkSymbol}
                            </p>
                        )}
                        {/* QR Code */}
                        <div className="flex flex-col items-center">
                            <div className="bg-white dark:bg-gray-800 shadow-md p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                                <img
                                    src={walletResponse.data.qr_code}
                                    alt="QR Code"
                                    className="w-64 h-64 object-contain"
                                />
                            </div>
                        </div>

                        {/* Public Key / Address */}
                        <div className="w-full space-y-2 max-w-xl mx-auto">
                            <div className="flex items-center gap-12 p-3 bg-theme-pink-100/40 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
                                <label className="text-sm font-medium text-theme-red-100 dark:text-[#FE645F] block">
                                    {t('wallet.walletAddress', { symbol: networkSymbol || '' })} :
                                </label>
                                <div className="text-sm text-yellow-600 dark:text-yellow-400 italic break-all font-mono flex items-center gap-2">
                                    {formatAddress(walletResponse.data.public_key)}
                                    <button
                                        onClick={() => handleCopy(walletResponse.data.public_key, t('wallet.copyLabels.walletAddress'))}
                                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-none bg-transparent p-1"
                                        title={t('wallet.copyAddress')}
                                    >
                                        <Copy className="w-4 h-4" />
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

            {/* Transaction History Section */}
            <div className="w-full mt-8">
                <h3 className="text-lg font-semibold text-theme-red-100 dark:text-[#FE645F] mb-4">
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
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">#{transaction.id}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="py-1 rounded-full text-xs min-w-20 flex justify-center font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                {transaction.type}
                                            </div>
                                            <div className={`py-1 rounded-full text-xs min-w-20 flex justify-center font-medium ${transaction.status === t('wallet.transactionStatus.complete')
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                {transaction.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="text-base font-semibold text-red-500 dark:text-[#FE645F]">
                                            {transaction.amount}
                                        </div>
                                        <div className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                                            {transaction.time}
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[60px]">
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
                                        <th className={`${tableHeaderStyles} w-[12%]`}>{t('wallet.tableHeaders.fromAddress')}</th>
                                        <th className={`${tableHeaderStyles} w-[12%]`}>{t('wallet.tableHeaders.toAddress')}</th>
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
                                                            {formatAddress(transaction.fromAddress)}
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopy(transaction.fromAddress, t('wallet.copyLabels.fromAddress'))}
                                                            className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-none bg-transparent mt-1.5'
                                                            title={t('wallet.copyAddress')}
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
                                                            onClick={() => handleCopy(transaction.toAddress, t('wallet.copyLabels.toAddress'))}
                                                            className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-none bg-transparent mt-1.5'
                                                            title={t('wallet.copyAddress')}
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
                                                            onClick={() => handleCopy(transaction.transactionId, t('wallet.copyLabels.transactionId'))}
                                                            className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border-none bg-transparent mt-1.5'
                                                            title={t('wallet.copyAddress')}
                                                        >
                                                            <Copy className='w-3.5 h-3.5' />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className={`${tableCellStyles} w-[11%] text-center rounded-r-lg border-l-0 border-theme-gray-100 border-solid`}>
                                                    <span
                                                        className={` px-1 font-medium flex justify-center items-center py-1.5 max-w-24 mx-auto rounded-full text-xs ${transaction.status === t('wallet.transactionStatus.complete')
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
    )
}

