'use client'
import CustomSelect from '@/components/CustomSelect'
import React, { useState, useRef } from 'react'
import { Copy, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/ui/button'

const networkOptions = [
    { value: 'TRC20', label: 'TRC20 (Tron)' },
    { value: 'ERC20', label: 'ERC20 (Ethereum)' },
    { value: 'BEP20', label: 'BEP20 (Binance Smart Chain)' },
    { value: 'POLYGON', label: 'Polygon' },
    { value: 'ARBITRUM', label: 'Arbitrum' },
]

interface Transaction {
    id: number
    time: string
    type: string
    amount: string
    fromAddress: string
    toAddress: string
    transactionId: string
    status: 'Complete' | 'Lỗi'
}

const fakeTransactions: Transaction[] = [
    {
        id: 1,
        time: '11:23:45 24/02/2025',
        type: 'Nạp',
        amount: '100 USDT',
        fromAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        toAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        transactionId: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        status: 'Complete'
    },
    {
        id: 2,
        time: '11:23:45 24/02/2025',
        type: 'Nạp',
        amount: '100 USDT',
        fromAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        toAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        transactionId: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        status: 'Lỗi'
    },
    {
        id: 3,
        time: '11:23:45 24/02/2025',
        type: 'Nạp',
        amount: '100 USDT',
        fromAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        toAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        transactionId: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        status: 'Lỗi'
    },
    {
        id: 4,
        time: '11:23:45 24/02/2025',
        type: 'Nạp',
        amount: '100 USDT',
        fromAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        toAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        transactionId: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        status: 'Complete'
    },
    {
        id: 5,
        time: '11:23:45 24/02/2025',
        type: 'Nạp',
        amount: '100 USDT',
        fromAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        toAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        transactionId: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        status: 'Complete'
    },
    {
        id: 6,
        time: '11:23:45 24/02/2025',
        type: 'Nạp',
        amount: '100 USDT',
        fromAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        toAddress: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        transactionId: '9BB6F8A3C2D1E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9pump',
        status: 'Lỗi'
    }
   
]

export default function WalletPage() {
    const [selectedNetwork, setSelectedNetwork] = useState<string>('')
    const tableRef = useRef<HTMLDivElement>(null)

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedNetwork(e.target.value)
    }

    const formatAddress = (address: string) => {
        if (address.length <= 10) return address
        // Extract "pump" from the end if it exists, otherwise use last 4 characters
        const endsWithPump = address.toLowerCase().endsWith('pump')
        if (endsWithPump) {
            return `${address.substring(0, 4)}....pump`
        }
        return `${address.substring(0, 4)}....${address.substring(address.length - 4)}`
    }

    const handleCopy = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success(`Đã sao chép ${type}`)
        } catch (err) {
            toast.error('Không thể sao chép')
        }
    }

    // Table styles from Untitled-2
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0"
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1"
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 uppercase "
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 bg-white border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light"

    return (
        <div className='w-full min-h-svh flex pt-24 justify-center items-start p-6 bg-[#FFFCF9] flex-1'>
            <div className='w-full max-w-7xl'>
                <div className='flex items-center justify-center mb-3'>
                    <img src="/logo.png" alt="logo" className='w-16 h-16 object-cover' />
                    <span className='text-2xl font-bold text-center text-pink-500 font-orbitron mx-4'>Số dư: 1000 USDT</span>
                    <img src="/logo.png" alt="logo" className='w-16 h-16 object-cover' />
                </div>
                <div className=' mb-6 flex flex-col items-center justify-center'>
                    <label htmlFor="network" className='block mb-2 text-sm font-medium text-theme-red-100'>
                        Chọn mạng lưới
                    </label>
                    <CustomSelect
                        id="network"
                        value={selectedNetwork}
                        onChange={handleNetworkChange}
                        options={networkOptions}
                        placeholder="Chọn mạng lưới"
                        disabled={false}
                        className="w-full max-w-56"
                    />
                </div>
                <div className='flex items-center justify-center gap-4 mb-10'>
                    <Button className='w-full cursor-pointer font-semibold uppercase max-w-56 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 inline-flex text-white rounded-full border-none h-12 text-lg hover:bg-theme-pink-100/80'>
                        Nạp
                    </Button>
                    <Button className='w-full cursor-pointer font-semibold uppercase max-w-56 bg-theme-pink-100 inline-flex text-pink-500 rounded-full border-pink-500 border-solid border h-12 text-lg hover:bg-theme-pink-100/80'>
                        Rút
                    </Button>
                </div>
                <div className="hidden sm:block overflow-hidden rounded-md">
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
                                {fakeTransactions.map((transaction) => (
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
                                                className={` px-1 font-medium flex justify-center items-center py-1.5 max-w-24 mx-auto rounded-full text-xs ${
                                                    transaction.status === 'Complete'
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-red-500 text-white'
                                                }`}
                                            >
                                                {transaction.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}