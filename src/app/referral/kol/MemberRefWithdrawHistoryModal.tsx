"use client"

import { useQuery } from "@tanstack/react-query";
import { getMemberRefWithdrawHistory, GetMemberRefWithdrawHistoryResponse } from "@/services/RefService";
import Modal from "@/components/Modal";
import { useLang } from "@/lang";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface MemberRefWithdrawHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MemberRefWithdrawHistoryModal({ isOpen, onClose }: MemberRefWithdrawHistoryModalProps) {
    const { t } = useLang();

    const { data: historyData, isLoading } = useQuery<GetMemberRefWithdrawHistoryResponse>({
        queryKey: ["memberRefWithdrawHistory"],
        queryFn: getMemberRefWithdrawHistory,
        enabled: isOpen,
    });

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm");
        } catch (e) {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "withdrawn":
            case "success":
                return "text-green-600 dark:text-green-400";
            case "pending":
            case "processing":
                return "text-yellow-600 dark:text-yellow-400";
            case "rejected":
            case "failed":
                return "text-red-600 dark:text-red-400";
            default:
                return "text-gray-600 dark:text-gray-400";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "withdrawn":
                return t('ref.statusWithdrawn') || 'Withdrawn';
            case "pending":
                return t('common.pending') || 'Pending';
            case "rejected":
                return t('common.rejected') || 'Rejected';
            default:
                return status;
        }
    }

    // Table styles (matching wallet page)
    const tableContainerStyles = "max-h-[60vh] sm:max-h-[65.5vh] overflow-y-auto overflow-x-auto -mx-3 sm:mx-0";
    const tableStyles = "w-full table-fixed border-separate border-spacing-y-1";
    const tableHeaderStyles = "px-2 py-2 sm:px-3 text-left text-xs sm:text-sm lg:text-base font-semibold text-theme-red-100 uppercase bg-transparent";
    const tableCellStyles = "px-2 py-3 sm:px-3 text-xs sm:text-sm lg:text-base text-theme-gray-200 dark:text-gray-300 bg-transparent border-y border-black dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 font-light";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('ref.withdrawHistory') || 'Lịch sử rút thưởng'}
            showCloseButton={true}
            maxWidth="max-w-4xl"
        >
            <div className="min-h-[300px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-[200px]">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                ) : historyData?.data && historyData.data.length > 0 ? (
                    <>
                        {/* Mobile List View */}
                        <div className="block sm:hidden space-y-3 max-h-[60vh] overflow-y-auto rounded-md bg-gray-50 dark:bg-gray-700/50 p-3">
                            {historyData.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-transparent rounded-lg border border-gray-100 dark:border-gray-800 flex justify-between items-start"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatDate(item.date)}
                                        </p>
                                        <p className={`text-xs mt-[2px] capitalize ${getStatusColor(item.status)}`}>
                                            {getStatusText(item.status)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-500 text-sm md:text-base">
                                            ${item.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-hidden rounded-md bg-transparent border border-none">
                            {/* Fixed Header */}
                            <div className="overflow-hidden rounded-t-md">
                                <table className={tableStyles}>
                                    <thead>
                                        <tr>
                                            <th className={`${tableHeaderStyles} w-[10%] text-left rounded-l-lg`}>
                                                {t('wallet.tableHeaders.stt') || '#'}
                                            </th>
                                            <th className={`${tableHeaderStyles} w-[25%]`}>
                                                {t('makeMoney.date') || 'Date'}
                                            </th>
                                            <th className={`${tableHeaderStyles} w-[20%] text-right`}>
                                                {t('common.amount') || 'Amount'}
                                            </th>
                                            <th className={`${tableHeaderStyles} w-[25%] text-right rounded-r-lg`}>
                                                {t('makeMoney.statusColumn') || 'Status'}
                                            </th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>

                            {/* Scrollable Body */}
                            <div className={tableContainerStyles}>
                                <table className={tableStyles}>
                                    <tbody>
                                        {historyData.data.map((item, index) => (
                                            <tr key={item.id} className="group transition-colors">
                                                <td className={`${tableCellStyles} w-[10%] text-left !pl-4 rounded-l-lg border-l border-r-0 border-theme-gray-100 border-solid`}>
                                                    {index + 1}
                                                </td>
                                                <td className={`${tableCellStyles} w-[25%] border-x-0 border-theme-gray-100 border-solid`}>
                                                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-white">
                                                        {formatDate(item.date)}
                                                    </span>
                                                </td>
                                                <td className={`${tableCellStyles} w-[20%] border-x-0 border-theme-gray-100 border-solid text-right`}>
                                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        ${item.amount.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className={`${tableCellStyles} w-[25%] border-x-0 border-r text-right rounded-r-lg border-theme-gray-100 border-solid`}>
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <span className={`text-xs md:text-sm capitalize ${getStatusColor(item.status)}`}>
                                                            {getStatusText(item.status)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col justify-center items-center h-[200px] text-gray-500 dark:text-gray-400">
                        <p>{t('common.noData') || 'Không có dữ liệu'}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
