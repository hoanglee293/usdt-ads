/**
 * Format số tiền: nếu là số nguyên thì hiển thị số nguyên, nếu có phần thập phân thì hiển thị 2 chữ số
 * Ví dụ: 0.00 -> 0, 5.00 -> 5, 5.50 -> 5.50, 0.01 -> 0.01
 * @param amount - Số tiền cần format
 * @returns Chuỗi đã được format
 */
export const formatReward = (amount: number): string => {
    const rounded = Math.round(amount * 100) / 100
    if (rounded % 1 === 0) {
        return rounded.toString()
    }
    return rounded.toFixed(2)
}
