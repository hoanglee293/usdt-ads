# Calendar Component Documentation

## 📋 Tổng Quan

Calendar component này được thiết kế để hiển thị lịch với khả năng:
- Hiển thị một tháng tại một thời điểm
- Điều hướng tự do giữa các tháng (trước/sau)
- Highlight các ngày trong một khoảng thời gian cụ thể (date range)
- Hiển thị trạng thái và dữ liệu cho từng ngày (missions, rewards, etc.)
- Hỗ trợ dark mode
- Responsive design cho mobile và desktop

## 🏗️ Cấu Trúc và Dependencies

### Imports Cần Thiết

```typescript
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
```

### State Management

```typescript
// State để quản lý tháng hiện tại đang hiển thị
// currentMonthIndex = 0: tháng của startDate
// currentMonthIndex < 0: các tháng trước
// currentMonthIndex > 0: các tháng sau
const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0)
```

### Props/Data Cần Thiết

```typescript
interface CalendarProps {
  startDate: string | Date      // Ngày bắt đầu của range
  endDate: string | Date          // Ngày kết thúc của range
  dataList?: Array<{              // Dữ liệu cho từng ngày (optional)
    date: string                  // Format: YYYY-MM-DD
    status?: string               // Trạng thái (success, out, etc.)
    reward?: number               // Giá trị reward
    [key: string]: any            // Các field khác
  }>
  monthNames?: string[]           // Tên các tháng (optional, có thể dùng i18n)
  dayNames?: string[]             // Tên các ngày trong tuần (optional)
}
```

## 🔧 Logic Xử Lý Ngày Tháng

### 1. Normalize Dates

```typescript
// Chuyển đổi date về dạng chỉ có ngày (loại bỏ time)
const startDate = new Date(currentStaking.date_start)
const endDate = new Date(currentStaking.date_end)

const startDateOnly = new Date(
  startDate.getFullYear(), 
  startDate.getMonth(), 
  startDate.getDate()
)
const endDateOnly = new Date(
  endDate.getFullYear(), 
  endDate.getMonth(), 
  endDate.getDate()
)
```

### 2. Tính Toán Tháng Hiện Tại

```typescript
// Tính toán tháng cần hiển thị dựa trên startDate và currentMonthIndex
const displayDate = new Date(startDateOnly)
displayDate.setMonth(displayDate.getMonth() + currentMonthIndex)

const year = displayDate.getFullYear()
const month = displayDate.getMonth()
```

**Giải thích:**
- `currentMonthIndex = 0`: Hiển thị tháng của `startDate`
- `currentMonthIndex = -1`: Hiển thị tháng trước đó
- `currentMonthIndex = 1`: Hiển thị tháng sau đó
- Có thể điều hướng tự do, không giới hạn

### 3. Tạo Calendar Days Array

```typescript
// Lấy thông tin về tháng
const firstDay = new Date(year, month, 1)
const lastDay = new Date(year, month + 1, 0)
const daysInMonth = lastDay.getDate()
const startingDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.

// Tạo mảng các ngày trong calendar
const calendarDays: (number | null)[] = []

// Thêm các ô trống cho các ngày trước khi tháng bắt đầu
for (let i = 0; i < startingDayOfWeek; i++) {
  calendarDays.push(null)
}

// Thêm tất cả các ngày trong tháng
for (let day = 1; day <= daysInMonth; day++) {
  calendarDays.push(day)
}
```

## 🛠️ Helper Functions

### 1. Format Date String

```typescript
// Chuyển đổi year, month, day thành format YYYY-MM-DD
const formatDateString = (y: number, m: number, d: number): string => {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
```

### 2. Check Date In Range

```typescript
// Kiểm tra xem một ngày có nằm trong khoảng startDate - endDate không
const isDateInRange = (day: number): boolean => {
  const currentDate = new Date(year, month, day)
  return currentDate >= startDateOnly && currentDate <= endDateOnly
}
```

### 3. Find Data By Date

```typescript
// Tìm dữ liệu (mission) cho một ngày cụ thể
const findMissionByDate = (day: number): Mission | undefined => {
  const dateString = formatDateString(year, month, day)
  return missionsList.find(mission => mission.date === dateString)
}
```

### 4. Check Start/End Date

```typescript
// Kiểm tra xem ngày có phải là ngày bắt đầu không
const isStartDate = (day: number): boolean => {
  return year === startDateOnly.getFullYear() &&
    month === startDateOnly.getMonth() &&
    day === startDateOnly.getDate()
}

// Kiểm tra xem ngày có phải là ngày kết thúc không
const isEndDate = (day: number): boolean => {
  return year === endDateOnly.getFullYear() &&
    month === endDateOnly.getMonth() &&
    day === endDateOnly.getDate()
}
```

## 🎨 UI Components

### 1. Month Navigation

```tsx
<div className='flex items-center justify-between mb-4'>
  <button
    onClick={() => setCurrentMonthIndex(currentMonthIndex - 1)}
    className='flex items-center justify-center w-10 h-10 rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer'
  >
    <ChevronLeft className='w-5 h-5' />
  </button>
  
  <h3 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200'>
    {monthNames[month]} {year}
  </h3>
  
  <button
    onClick={() => setCurrentMonthIndex(currentMonthIndex + 1)}
    className='flex items-center justify-center w-10 h-10 rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer'
  >
    <ChevronRight className='w-5 h-5' />
  </button>
</div>
```

### 2. Calendar Table

```tsx
<div className='overflow-x-auto'>
  <table className='w-full border-collapse'>
    <thead>
      <tr>
        {dayNames.map((day, index) => (
          <th
            key={index}
            className='px-1 py-2 sm:px-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
          >
            {day}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
        <tr key={weekIndex}>
          {Array.from({ length: 7 }, (_, dayIndex) => {
            const day = calendarDays[weekIndex * 7 + dayIndex]
            // ... render logic
          })}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 3. Day Cell Logic

```tsx
{Array.from({ length: 7 }, (_, dayIndex) => {
  const day = calendarDays[weekIndex * 7 + dayIndex]
  const mission = day !== null ? findMissionByDate(day) : undefined
  const isStart = day !== null && isStartDate(day)
  const isEnd = day !== null && isEndDate(day)
  const inRange = day !== null && isDateInRange(day)

  // Determine background color
  const getBackgroundColor = () => {
    if (day === null) return 'bg-gray-50 dark:bg-gray-800/30'
    if (isStart || isEnd) return 'bg-gray-400 dark:bg-gray-500'
    if (inRange) return 'bg-gray-400 dark:bg-gray-500'
    return 'bg-white dark:bg-gray-800'
  }

  // Determine text color
  const getTextColor = () => {
    if (isStart || isEnd) return 'dark:text-white text-theme-black-100'
    if (hasMission) {
      return isSuccess
        ? 'text-green-700 dark:text-green-300'
        : 'text-orange-700 dark:text-orange-300'
    }
    if (inRange) return 'dark:text-white text-theme-black-100'
    return 'text-gray-700 dark:text-gray-300'
  }

  return (
    <td className='px-[1px] py-1 sm:px-2 h-12 text-center border align-top'>
      {day !== null ? (
        <div className={`flex py-1 flex-col h-full justify-center items-center gap-0.5 sm:gap-1 ${bgColor} ${mission?.status === 'success' ? 'border-green-500 border-solid' : mission?.status === 'out' ? 'border-red-500 border-solid' : ''} rounded-lg`}>
          <span className={`text-xs sm:text-sm font-semibold ${textColor}`}>
            {day}
          </span>
          {mission && (
            <div className='text-[9px] sm:text-[10px] leading-tight'>
              {mission.reward !== undefined && (
                <div className={`mt-0.5 font-semibold ${isSuccess ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  + ${mission.reward.toFixed(0)}
                </div>
              )}
            </div>
          )}
        </div>
      ) : ''}
    </td>
  )
})}
```

## 🎯 Tính Năng Chính

### 1. Điều Hướng Tháng Tự Do
- Không giới hạn việc chuyển tháng
- Có thể xem các tháng trước/sau khoảng thời gian chính
- Sử dụng `currentMonthIndex` để điều hướng

### 2. Highlight Date Range
- Các ngày trong `startDate` - `endDate` được highlight
- Ngày bắt đầu và kết thúc có style đặc biệt
- Sử dụng `isDateInRange()` để kiểm tra

### 3. Hiển Thị Dữ Liệu Theo Ngày
- Mỗi ngày có thể có dữ liệu riêng (mission, reward, status)
- Tìm kiếm dữ liệu bằng `formatDateString()` và so sánh với `date` field
- Hiển thị reward, status với màu sắc tương ứng

### 4. Responsive Design
- Sử dụng Tailwind responsive classes (`sm:`, `md:`, etc.)
- Text size và padding thay đổi theo màn hình
- Overflow scroll cho mobile

### 5. Dark Mode Support
- Tất cả colors đều có dark mode variants
- Sử dụng `dark:` prefix trong Tailwind

## 🔄 Reset State Khi Data Thay Đổi

```typescript
// Reset currentMonthIndex về 0 khi data thay đổi
useEffect(() => {
  setCurrentMonthIndex(0)
}, [currentStaking?.id]) // Hoặc dependency phù hợp với data của bạn
```

## 📝 Ví Dụ Sử Dụng Đầy Đủ

```tsx
'use client'
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarExample() {
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0)
  
  // Example data
  const startDate = new Date('2024-01-28')
  const endDate = new Date('2024-02-04')
  const dataList = [
    { date: '2024-01-28', status: 'success', reward: 100 },
    { date: '2024-01-29', status: 'out', reward: 50 },
    // ...
  ]

  // Normalize dates
  const startDateOnly = new Date(
    startDate.getFullYear(), 
    startDate.getMonth(), 
    startDate.getDate()
  )
  const endDateOnly = new Date(
    endDate.getFullYear(), 
    endDate.getMonth(), 
    endDate.getDate()
  )

  // Day and month names
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ]

  // Calculate current month
  const displayDate = new Date(startDateOnly)
  displayDate.setMonth(displayDate.getMonth() + currentMonthIndex)
  const year = displayDate.getFullYear()
  const month = displayDate.getMonth()

  // Helper functions
  const formatDateString = (y: number, m: number, d: number): string => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const isDateInRange = (day: number): boolean => {
    const currentDate = new Date(year, month, day)
    return currentDate >= startDateOnly && currentDate <= endDateOnly
  }

  const findDataByDate = (day: number) => {
    const dateString = formatDateString(year, month, day)
    return dataList.find(item => item.date === dateString)
  }

  // Calendar days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className='max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-4 sm:p-6 shadow-md'>
      {/* Navigation */}
      <div className='flex items-center justify-between mb-4'>
        <button
          onClick={() => setCurrentMonthIndex(currentMonthIndex - 1)}
          className='flex items-center justify-center w-10 h-10 rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer'
        >
          <ChevronLeft className='w-5 h-5' />
        </button>
        <h3 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200'>
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={() => setCurrentMonthIndex(currentMonthIndex + 1)}
          className='flex items-center justify-center w-10 h-10 rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer'
        >
          <ChevronRight className='w-5 h-5' />
        </button>
      </div>

      {/* Calendar */}
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr>
              {dayNames.map((day, index) => (
                <th
                  key={index}
                  className='px-1 py-2 sm:px-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
              <tr key={weekIndex}>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const day = calendarDays[weekIndex * 7 + dayIndex]
                  const data = day !== null ? findDataByDate(day) : undefined
                  const inRange = day !== null && isDateInRange(day)

                  const bgColor = day === null 
                    ? 'bg-gray-50 dark:bg-gray-800/30'
                    : inRange 
                      ? 'bg-gray-400 dark:bg-gray-500'
                      : 'bg-white dark:bg-gray-800'

                  return (
                    <td
                      key={dayIndex}
                      className='px-[1px] py-1 sm:px-2 h-12 text-center border align-top'
                    >
                      {day !== null ? (
                        <div className={`flex py-1 flex-col h-full justify-center items-center gap-0.5 sm:gap-1 ${bgColor} rounded-lg`}>
                          <span className='text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300'>
                            {day}
                          </span>
                          {data && (
                            <div className='text-[9px] sm:text-[10px] leading-tight'>
                              {data.reward !== undefined && (
                                <div className='mt-0.5 font-semibold text-green-600 dark:text-green-400'>
                                  + ${data.reward.toFixed(0)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

## 🎨 Customization

### Thay Đổi Màu Sắc

```typescript
// Background colors
const bgColor = isInRange 
  ? 'bg-blue-400 dark:bg-blue-500'  // Thay đổi màu cho range
  : 'bg-white dark:bg-gray-800'

// Text colors
const textColor = hasData
  ? 'text-green-700 dark:text-green-300'  // Thay đổi màu cho data
  : 'text-gray-700 dark:text-gray-300'
```

### Thay Đổi Day Names

```typescript
// Vietnamese
const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// English
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
```

### Thêm Click Handler Cho Ngày

```tsx
<div
  onClick={() => day !== null && handleDayClick(day)}
  className={`... ${day !== null ? 'cursor-pointer' : ''}`}
>
  {/* ... */}
</div>
```

## 📌 Lưu Ý Quan Trọng

1. **Date Normalization**: Luôn normalize dates để loại bỏ time component
2. **Month Calculation**: Sử dụng `setMonth()` để tính toán tháng, JavaScript tự động xử lý overflow (tháng 13 → tháng 1 năm sau)
3. **Starting Day**: `getDay()` trả về 0-6 (0 = Sunday), điều chỉnh nếu cần Monday = 0
4. **Performance**: Component sử dụng IIFE để tính toán, có thể tối ưu bằng useMemo nếu cần
5. **Responsive**: Luôn test trên mobile và desktop

## 🔗 Liên Kết

- File gốc: `src/app/make-money/page.tsx` (dòng 957-1176)
- Icons: `lucide-react`
- Styling: Tailwind CSS với dark mode support

