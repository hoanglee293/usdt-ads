# Phân Tích API GET /incomes/join-now

## 📋 Tổng Quan

API này được sử dụng để lấy thông tin gói staking đang tham gia (active) của user hiện tại.

**Endpoint:** `GET /incomes/join-now`

---

## 📥 Response Structure

### ✅ Success Response (200)

```typescript
{
  "statusCode": 200,
  "message": "Get current staking successfully",
  "data": {
    "id": 123,                          // ID của gói staking
    "type": "base" | "1d" | "7d" | "30d",  // Loại gói
    "date_start": "2024-01-15T10:30:00.000Z",  // Thời gian bắt đầu (ISO 8601)
    "date_end": "2024-01-16T10:30:00.000Z",    // Thời gian kết thúc (ISO 8601)
    "amount": 100.5,                    // Số tiền tham gia
    "total_usd": 100.5,                 // Tổng giá trị USD
    "turn_setting": 10,                 // Số lượt xem video cần hoàn thành
    "devices_setting": 20,              // Số thiết bị cho phép
    "estimated_reward": 100,            // Phần thưởng ước tính
    "real_reward": 71.43,               // Phần thưởng thực tế
    "status": "running" | "pending-claim"  // Trạng thái gói
  }
}
```

### ❌ Error Response

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "No active staking lock found"
}
```
**Ý nghĩa:** User chưa có gói staking nào đang active. Đây là trường hợp bình thường, không phải lỗi.

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "<error message>"
}
```
**Ý nghĩa:** User chưa đăng nhập hoặc token không hợp lệ.

---

## 🔍 So Sánh Với Implementation Hiện Tại

### 1. TypeScript Interface

**File:** `src/services/StakingService.ts`

```typescript
export interface StakingPackage {
  id: number;
  user_id: number;  // ⚠️ Không có trong response của Untitled-1
  type: "base" | "1d" | "7d" | "30d";
  date_start: string;
  date_end: string;
  amount: number;
  total_usd: number;
  turn_setting: number;
  devices_setting: number;
  status: "running" | "pending-claim" | "ended";  // ⚠️ Có thêm "ended"
  // ⚠️ Thiếu: estimated_reward, real_reward
}
```

**⚠️ Khác biệt:**
- Response thực tế có `estimated_reward` và `real_reward` nhưng interface hiện tại không có
- Interface có `user_id` và `ended` status nhưng response không có
- Cần cập nhật interface để khớp với API response

### 2. Service Function

**File:** `src/services/StakingService.ts` (dòng 131-143)

```typescript
export const getCurrentStaking = async (): Promise<CurrentStakingResponse> => {
  try {
    const response = await axiosClient.get('/incomes/join-now');
    return response.data;
  } catch (error: any) {
    // 404 is expected when no active staking exists
    if (error?.response?.status === 404) {
      throw error;
    }
    console.error('Error fetching current staking:', error);
    throw error;
  }
}
```

**✅ Implementation đúng:** Xử lý 404 như một trường hợp hợp lệ (không có staking active).

### 3. Usage trong Component

**File:** `src/app/make-money/page.tsx` (dòng 72-78)

```typescript
const { data: currentStakingResponse, isLoading: isLoadingCurrentStaking, refetch: refetchCurrentStaking } = useQuery<CurrentStakingResponse>({
    queryKey: ['current-staking'],
    queryFn: getCurrentStaking,
    retry: false, // Don't retry on 404
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // Cache 1 phút
})
```

**✅ Implementation tốt:**
- `retry: false` - Không retry khi 404 (đúng vì 404 là trường hợp hợp lệ)
- Cache 1 phút phù hợp
- Sử dụng React Query để quản lý state

---

## 📊 Phân Tích Chi Tiết Các Trường

### 1. `id` (number)
- ID duy nhất của gói staking
- Dùng để track và reference gói

### 2. `type` ("base" | "1d" | "7d" | "30d")
- **"base"**: Gói base (cho user có số dư < $10)
- **"1d"**: Gói staking 1 ngày
- **"7d"**: Gói staking 7 ngày
- **"30d"**: Gói staking 30 ngày

### 3. `date_start` & `date_end` (ISO 8601 string)
- Thời gian bắt đầu và kết thúc của gói
- Format: `"2024-01-15T10:30:00.000Z"`
- Dùng để tính tiến độ và thời gian còn lại

### 4. `amount` (number)
- Số tiền user đã tham gia vào gói
- Đơn vị: USDT

### 5. `total_usd` (number)
- Tổng giá trị USD (thường bằng `amount`)

### 6. `turn_setting` (number)
- Số lượt xem video cần hoàn thành
- Mặc định: 10 (cho base package)
- Tăng theo `amount` (cho staking package)

### 7. `devices_setting` (number)
- Số thiết bị cho phép xem video
- Mặc định: 20

### 8. `estimated_reward` (number)
- Phần thưởng ước tính ban đầu
- ⚠️ **Chưa có trong interface hiện tại**

### 9. `real_reward` (number)
- Phần thưởng thực tế (có thể khác `estimated_reward`)
- ⚠️ **Chưa có trong interface hiện tại**

### 10. `status` ("running" | "pending-claim")
- **"running"**: Gói đang chạy, user cần hoàn thành nhiệm vụ
- **"pending-claim"**: Đã hoàn thành, chờ claim phần thưởng
- ⚠️ Interface hiện tại có thêm `"ended"` nhưng response không có

---

## 🔄 Flow Sử Dụng

```
1. User vào trang Make Money
   ↓
2. Component gọi GET /incomes/join-now
   ↓
3. Nếu có data (200):
   → Hiển thị thông tin gói đang chạy
   → Hiển thị tiến độ (date_start → date_end)
   → Hiển thị nhiệm vụ (turn_setting, devices_setting)
   → Gọi GET /incomes/mission-now để lấy tiến độ nhiệm vụ
   ↓
4. Nếu không có (404):
   → Hiển thị form tham gia gói mới
   → Gọi GET /incomes/join-histories để hiển thị lịch sử
```

---

## ⚠️ Vấn Đề Cần Sửa

### 1. Interface không khớp với API Response

**Cần cập nhật `StakingPackage` interface:**

```typescript
export interface StakingPackage {
  id: number;
  // ❌ Xóa: user_id (không có trong response)
  type: "base" | "1d" | "7d" | "30d";
  date_start: string;
  date_end: string;
  amount: number;
  total_usd: number;
  turn_setting: number;
  devices_setting: number;
  estimated_reward: number;  // ✅ Thêm
  real_reward: number;       // ✅ Thêm
  status: "running" | "pending-claim";  // ❌ Xóa "ended"
}
```

### 2. Component chưa sử dụng `estimated_reward` và `real_reward`

Hiện tại component tính phần thưởng bằng công thức:
```typescript
currentStaking.amount * 0.3  // 30% của số tiền tham gia
```

Nên sử dụng `real_reward` từ API thay vì tính toán:
```typescript
currentStaking.real_reward || currentStaking.amount * 0.3
```

---

## ✅ Recommendations

1. **Cập nhật TypeScript Interface** để khớp với API response
2. **Sử dụng `real_reward`** thay vì tính toán phần thưởng
3. **Hiển thị `estimated_reward` vs `real_reward`** để user biết phần thưởng thực tế
4. **Xử lý 404 đúng cách** (đã làm tốt) - không coi là lỗi
5. **Cache strategy** (đã làm tốt) - cache 1 phút phù hợp

---

## 📝 Notes

- API này chỉ trả về gói staking **đang active** (status: `running` hoặc `pending-claim`)
- Nếu user không có gói active, API trả về 404 (đây là behavior bình thường)
- Cần kết hợp với `GET /incomes/mission-now` để lấy tiến độ nhiệm vụ chi tiết
- Cần kết hợp với `GET /incomes/join-histories` để lấy lịch sử các gói đã tham gia

