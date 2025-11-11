# Phân Tích API Staking/Income System

## 📋 Tổng Quan

Hệ thống API này quản lý việc tham gia các gói staking để kiếm thu nhập. Có 2 loại gói chính:
- **Base Package**: Dành cho người dùng có số dư < $10
- **Staking Package**: Dành cho người dùng có số dư >= $10 (có 3 loại: 1d, 7d, 30d)

---

## 🔍 Phân Tích Chi Tiết Các API

### 1. **POST /incomes/join-base** - Tham Gia Gói Base

#### Điều Kiện
- ✅ Chỉ gọi được khi `uw_balance < $10`
- ✅ User không có staking đang active (status: `running` hoặc `pending-claim`)

#### Request
- **Method**: POST
- **Body**: Không có (hoặc có thể có nhưng không được mô tả)
- **Headers**: Cần authentication token

#### Response Success (201)
```typescript
{
  statusCode: 201,
  message: "Joined base staking successfully",
  data: {
    id: number,
    user_id: number,
    type: "base",
    date_start: string,      // ISO 8601 format
    date_end: string,        // ISO 8601 format
    amount: number,          // Số tiền tham gia
    total_usd: number,       // Tổng giá trị USD
    turn_setting: number,    // Số lượt xem video (mặc định: 10)
    devices_setting: number, // Số thiết bị (mặc định: 20)
    status: "running"
  }
}
```

#### Error Cases (400/401)
| Status | Message | Mô Tả |
|--------|---------|-------|
| 400 | User already has an active staking lock | Đã có staking đang chạy |
| 400 | USDT coin not found | Không tìm thấy coin USDT |
| 400 | USDT wallet not found for user | User chưa có ví USDT |
| 400 | USDT balance must be less than $10 | Số dư phải < $10 |
| 400 | Failed to join base staking | Lỗi khác khi tham gia |

---

### 2. **POST /incomes/join-staking** - Tham Gia Gói Staking

#### Điều Kiện
- ✅ Chỉ gọi được khi `uw_balance >= $10`
- ✅ User không có staking đang active
- ✅ Có cơ chế tăng nhiệm vụ dựa trên mốc tiền tham gia
- ✅ Mặc định: 10 lượt xem video + 20 thiết bị

#### Request Body
```typescript
{
  type: "1d" | "7d" | "30d",  // Loại gói staking
  amount: number               // Số tiền tham gia (phải > 0 và <= 3500)
}
```

#### Response Success (201)
```typescript
{
  statusCode: 201,
  message: "Joined staking successfully",
  data: {
    id: number,
    user_id: number,
    type: "1d" | "7d" | "30d",
    date_start: string,
    date_end: string,
    amount: number,
    total_usd: number,
    turn_setting: number,      // Số lượt xem video (tăng theo amount)
    devices_setting: number,   // Số thiết bị (tăng theo amount)
    status: "running"
  }
}
```

#### Error Cases (400/401)
| Status | Message | Mô Tả |
|--------|---------|-------|
| 400 | Type must be one of: 1d, 7d, 30d | Loại gói không hợp lệ |
| 400 | Amount must be greater than 0 | Số tiền phải > 0 |
| 400 | Amount must not exceed 3500 | Số tiền tối đa là $3500 |
| 400 | User already has an active staking lock | Đã có staking đang chạy |
| 400 | USDT coin not found | Không tìm thấy coin USDT |
| 400 | USDT balance must be greater than or equal to $10 | Số dư phải >= $10 |
| 400 | Insufficient balance. Available: X, Required: Y | Không đủ số dư |
| 400 | Invalid staking type | Loại staking không hợp lệ |
| 400 | Failed to join staking | Lỗi khác khi tham gia |

---

### 3. **GET /incomes/join-now** - Lấy Thông Tin Gói Đang Tham Gia

#### Mục Đích
Lấy thông tin gói staking hiện tại đang active của user

#### Response Success (200)
```typescript
{
  statusCode: 200,
  message: "Get current staking successfully",
  data: {
    id: number,
    type: "base" | "1d" | "7d" | "30d",
    date_start: string,
    date_end: string,
    amount: number,
    total_usd: number,
    turn_setting: number,
    devices_setting: number,
    status: "running" | "pending-claim"
  }
}
```

#### Error Cases (404/401)
| Status | Message | Mô Tả |
|--------|---------|-------|
| 404 | No active staking lock found | Không có staking nào đang active |

---

### 4. **GET /incomes/join-histories** - Lịch Sử Tham Gia

#### Mục Đích
Lấy toàn bộ lịch sử các gói staking đã tham gia (bao gồm cả đã kết thúc)

#### Response Success (200)
```typescript
{
  statusCode: 200,
  message: "Get staking histories successfully",
  data: [
    {
      id: number,
      type: "base" | "1d" | "7d" | "30d",
      date_start: string,
      date_end: string,
      amount: number,
      total_usd: number,
      turn_setting: number,
      devices_setting: number,
      status: "running" | "pending-claim" | "ended"
    },
    // ... more items
  ]
}
```

**Lưu ý**: Có thể trả về mảng rỗng `[]` nếu chưa có lịch sử

---

## 📊 Data Models

### Staking Package Interface
```typescript
interface StakingPackage {
  id: number;
  user_id: number;
  type: "base" | "1d" | "7d" | "30d";
  date_start: string;        // ISO 8601 datetime
  date_end: string;          // ISO 8601 datetime
  amount: number;            // Số tiền tham gia
  total_usd: number;         // Tổng giá trị USD
  turn_setting: number;      // Số lượt xem video cần hoàn thành
  devices_setting: number;   // Số thiết bị cần hoàn thành
  status: "running" | "pending-claim" | "ended";
}
```

### API Response Standard
```typescript
interface ApiResponse<T> {
  statusCode: 200 | 201 | 400 | 401 | 404;
  message: string;
  data: T;
}
```

---

## 🔄 Business Logic Flow

### Flow Tham Gia Staking

```
1. User vào trang Make Money
   ↓
2. Kiểm tra số dư hiện tại (uw_balance)
   ↓
3. Nếu balance < $10:
   → Hiển thị nút "Tham gia gói Base"
   → Gọi POST /incomes/join-base
   ↓
4. Nếu balance >= $10:
   → Hiển thị form chọn gói (1d/7d/30d) và nhập amount
   → Validate: amount > 0 và <= 3500
   → Gọi POST /incomes/join-staking
   ↓
5. Sau khi tham gia thành công:
   → Refresh thông tin gói hiện tại (GET /incomes/join-now)
   → Hiển thị thông tin gói và tiến độ
```

### Flow Kiểm Tra Trạng Thái

```
1. Load trang Make Money
   ↓
2. Gọi GET /incomes/join-now
   ↓
3. Nếu có data (status 200):
   → Hiển thị thông tin gói đang chạy
   → Hiển thị tiến độ (date_start → date_end)
   → Hiển thị nhiệm vụ (turn_setting, devices_setting)
   ↓
4. Nếu không có (status 404):
   → Hiển thị form tham gia gói mới
   → Gọi GET /incomes/join-histories để hiển thị lịch sử
```

---

## ⚠️ Validation Rules

### Join Base Package
- ✅ `uw_balance < $10`
- ✅ Không có staking active (`running` hoặc `pending-claim`)
- ✅ Có ví USDT
- ✅ Coin USDT tồn tại

### Join Staking Package
- ✅ `uw_balance >= $10`
- ✅ `type` phải là: `"1d"` | `"7d"` | `"30d"`
- ✅ `amount > 0`
- ✅ `amount <= 3500`
- ✅ `uw_balance >= amount` (đủ số dư)
- ✅ Không có staking active

---

## 🎯 Implementation Recommendations

### 1. Tạo IncomeService.ts
Tạo service tương tự `WalletService.ts` để quản lý các API calls:

```typescript
// src/services/IncomeService.ts
import axiosClient from "@/utils/axiosClient";

// Types
export interface StakingPackage {
  id: number;
  user_id: number;
  type: "base" | "1d" | "7d" | "30d";
  date_start: string;
  date_end: string;
  amount: number;
  total_usd: number;
  turn_setting: number;
  devices_setting: number;
  status: "running" | "pending-claim" | "ended";
}

export interface JoinBaseResponse {
  statusCode: 201;
  message: string;
  data: StakingPackage;
}

export interface JoinStakingRequest {
  type: "1d" | "7d" | "30d";
  amount: number;
}

export interface JoinStakingResponse {
  statusCode: 201;
  message: string;
  data: StakingPackage;
}

export interface CurrentStakingResponse {
  statusCode: 200;
  message: string;
  data: StakingPackage;
}

export interface StakingHistoriesResponse {
  statusCode: 200;
  message: string;
  data: StakingPackage[];
}

// API Functions
export const joinBasePackage = async (): Promise<JoinBaseResponse> => {
  const response = await axiosClient.post('/incomes/join-base');
  return response.data;
}

export const joinStakingPackage = async (
  data: JoinStakingRequest
): Promise<JoinStakingResponse> => {
  const response = await axiosClient.post('/incomes/join-staking', data);
  return response.data;
}

export const getCurrentStaking = async (): Promise<CurrentStakingResponse> => {
  const response = await axiosClient.get('/incomes/join-now');
  return response.data;
}

export const getStakingHistories = async (): Promise<StakingHistoriesResponse> => {
  const response = await axiosClient.get('/incomes/join-histories');
  return response.data;
}
```

### 2. Tạo Custom Hook useStaking
```typescript
// src/hooks/useStaking.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentStaking,
  getStakingHistories,
  joinBasePackage,
  joinStakingPackage,
  type JoinStakingRequest
} from '@/services/IncomeService';

export const useCurrentStaking = () => {
  return useQuery({
    queryKey: ['current-staking'],
    queryFn: getCurrentStaking,
    retry: false, // Không retry nếu 404
  });
}

export const useStakingHistories = () => {
  return useQuery({
    queryKey: ['staking-histories'],
    queryFn: getStakingHistories,
  });
}

export const useJoinBase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: joinBasePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-staking'] });
      queryClient.invalidateQueries({ queryKey: ['staking-histories'] });
    },
  });
}

export const useJoinStaking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: JoinStakingRequest) => joinStakingPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-staking'] });
      queryClient.invalidateQueries({ queryKey: ['staking-histories'] });
    },
  });
}
```

### 3. Cập Nhật Make Money Page
- Hiển thị thông tin gói đang chạy (nếu có)
- Form tham gia gói mới (nếu chưa có)
- Hiển thị lịch sử tham gia
- Validation số dư và điều kiện tham gia

### 4. Error Handling
- Xử lý các error messages từ API
- Hiển thị toast notifications phù hợp
- Disable button khi đang có staking active
- Validate form trước khi submit

---

## 📝 Notes & Considerations

1. **Số dư (uw_balance)**: Cần lấy từ API balance, có thể từ `WalletService.getBalance()` với coin_id của USDT

2. **Status Flow**: 
   - `running` → Đang chạy, user đang làm nhiệm vụ
   - `pending-claim` → Đã hoàn thành, chờ claim reward
   - `ended` → Đã kết thúc và đã claim

3. **Turn Setting & Devices Setting**: 
   - Mặc định: 10 lượt xem + 20 thiết bị
   - Tăng theo mốc tiền tham gia (logic này cần xác nhận với backend)

4. **Date Calculation**:
   - Base: 1 ngày (date_end = date_start + 1 day)
   - 1d: 1 ngày
   - 7d: 7 ngày
   - 30d: 30 ngày

5. **Concurrent Staking**: 
   - User chỉ có thể có 1 staking active tại một thời điểm
   - Phải kết thúc hoặc claim gói hiện tại mới tham gia gói mới

---

## 🚀 Next Steps

1. ✅ Tạo `IncomeService.ts` với các API functions
2. ✅ Tạo `useStaking.ts` hook với React Query
3. ✅ Cập nhật `make-money/page.tsx` với UI đầy đủ
4. ✅ Tích hợp với `WalletService` để lấy số dư USDT
5. ✅ Thêm error handling và validation
6. ✅ Thêm loading states và skeleton UI
7. ✅ Thêm toast notifications cho success/error

