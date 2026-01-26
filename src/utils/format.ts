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
    return parseFloat(rounded.toFixed(2)).toString()
}

/**
 * Format số dư: nếu là số nguyên thì hiển thị số nguyên, nếu có phần thập phân thì hiển thị và loại bỏ số 0 ở cuối
 * Ví dụ: 0.00 -> 0, 5.00 -> 5, 5.50 -> 5.5, 1076.10 -> 1076.1, 0.01 -> 0.01
 * @param balance - Số dư cần format
 * @returns Chuỗi đã được format
 */
export const formatBalance = (balance: number): string => {
    const rounded = Math.round(balance * 100) / 100
    if (rounded % 1 === 0) {
        return rounded.toString()
    }
    // Loại bỏ số 0 ở cuối phần thập phân
    return parseFloat(rounded.toFixed(2)).toString()
}
