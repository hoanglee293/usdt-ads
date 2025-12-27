# Phân Tích API Staking Calculator

## 📋 Tổng Quan

API này dùng để **tính toán ước tính** các thông số của gói staking trước khi người dùng quyết định tham gia. Đây là API **preview/calculator** giúp người dùng xem trước thông tin trước khi commit.

---

## 🔍 Phân Tích Chi Tiết API

### **POST /incomes/calculator** - Tính Toán Gói Staking

#### Mục Đích
Tính toán và trả về các thông số ước tính của gói staking dựa trên `type` và `amount` mà người dùng muốn tham gia.

#### Request Body
```typescript
{
  type: "1d" | "7d" | "30d",  // Loại gói staking
  amount: number               // Số tiền muốn tham gia
}
```

#### Response Success (200)
```typescript
{
  statusCode: 200,
  message: "Calculate staking successfully",
  data: {
    devices: number,              // Số thiết bị cho phép
    videos_per_day: number,       // Số video cần xem mỗi ngày
    time_gap: number,             // Khoảng thời gian giữa các lần xem (phút)
    estimated_reward: number      // Phần thưởng ước tính
  }
}
```

**Ví dụ Response:**
```json
{
  "statusCode": 200,
  "message": "Calculate staking successfully",
  "data": {
    "devices": 20,
    "videos_per_day": 10,
    "time_gap": 15,
    "estimated_reward": 1200
  }
}
```

#### Error Cases (400)
```typescript
{
  statusCode: 400,
  message: string  // Error message
}
```

**Error Messages:**
- `"Type must be one of: 1d, 7d, 30d"` - Loại gói không hợp lệ
- Có thể có các error khác về validation `amount` (chưa được mô tả trong spec)

---

## 🔄 So Sánh Với API Hiện Tại

### 1. **POST /incomes/join-staking** (Đã có)
- **Mục đích**: Thực sự tham gia gói staking (commit transaction)
- **Request**: Giống nhau (`type`, `amount`)
- **Response**: Trả về `StakingPackage` object với đầy đủ thông tin
- **Side effects**: Trừ tiền từ ví, tạo staking record

### 2. **POST /incomes/calculator** (Chưa có)
- **Mục đích**: Chỉ tính toán preview, không commit
- **Request**: Giống nhau (`type`, `amount`)
- **Response**: Chỉ trả về các thông số ước tính
- **Side effects**: Không có (read-only operation)

### 3. **GET /incomes/mission-now** (Đã có)
- **Mục đích**: Lấy thông tin nhiệm vụ hiện tại của gói đang chạy
- **Response**: Có `devices`, `turn_setting` (tương đương `videos_per_day`), `time_gap`
- **Khác biệt**: API này chỉ dùng khi đã có staking active, còn calculator dùng trước khi tham gia

---

## 📊 Phân Tích Các Trường Response

### 1. `devices` (number)
- **Mô tả**: Số thiết bị cho phép sử dụng để xem video
- **Ví dụ**: 20
- **So sánh**: Tương ứng với `devices_setting` trong `StakingPackage`

### 2. `videos_per_day` (number)
- **Mô tả**: Số video cần xem mỗi ngày để hoàn thành nhiệm vụ
- **Ví dụ**: 10
- **So sánh**: Tương ứng với `turn_setting` trong `StakingPackage`

### 3. `time_gap` (number)
- **Mô tả**: Khoảng thời gian giữa các lần xem video (đơn vị: phút)
- **Ví dụ**: 15 (nghĩa là phải đợi 15 phút giữa mỗi lần xem)
- **So sánh**: Tương ứng với `time_gap` trong `MissionNowResponse`

### 4. `estimated_reward` (number)
- **Mô tả**: Phần thưởng ước tính (có thể là USD hoặc token)
- **Ví dụ**: 1200
- **So sánh**: Tương ứng với `estimated_reward` trong `StakingPackage` (từ API join-now)

---

## 🎯 Use Cases

### 1. **Preview Trước Khi Tham Gia**
Người dùng nhập `type` và `amount` vào form, gọi API calculator để xem:
- Sẽ có bao nhiêu thiết bị được phép?
- Mỗi ngày cần xem bao nhiêu video?
- Khoảng thời gian giữa các lần xem là bao lâu?
- Phần thưởng ước tính là bao nhiêu?

### 2. **Real-time Calculation**
Khi người dùng thay đổi `amount` trong input, có thể gọi API calculator để cập nhật preview ngay lập tức (với debounce để tránh spam API).

### 3. **Validation & UX**
Hiển thị thông tin trước khi người dùng click "Confirm" để tham gia, giúp họ đưa ra quyết định sáng suốt hơn.

---

## 💻 Implementation Recommendations

### 1. **Thêm Interface vào StakingService.ts**

```typescript
// Request interface
export interface CalculateStakingRequest {
  type: "1d" | "7d" | "30d";
  amount: number;
}

// Response interface
export interface CalculateStakingResponse {
  statusCode: 200;
  message: string;
  data: {
    devices: number;
    videos_per_day: number;
    time_gap: number;
    estimated_reward: number;
  };
}

// Error response (đã có sẵn StakingErrorResponse)
```

### 2. **Thêm Function vào StakingService.ts**

```typescript
/**
 * Tính toán ước tính các thông số của gói staking
 * @param data - Dữ liệu tính toán (type và amount)
 * @returns Promise<CalculateStakingResponse>
 */
export const calculateStaking = async (
  data: CalculateStakingRequest
): Promise<CalculateStakingResponse> => {
  try {
    // Validation
    if (!data.type || !['1d', '7d', '30d'].includes(data.type)) {
      throw new Error('Type must be one of: 1d, 7d, 30d');
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    // Có thể thêm validation amount <= 3500 nếu cần

    const response = await axiosClient.post('/incomes/calculator', data);
    return response.data;
  } catch (error) {
    console.error('Error calculating staking:', error);
    throw error;
  }
}
```

### 3. **Sử Dụng trong make-money/page.tsx**

#### Option A: Real-time Preview (với debounce)
```typescript
import { useDebouncedValue } from '@/hooks/useDebounce' // Cần tạo hook này

const [stakingAmount, setStakingAmount] = useState<string>('')
const debouncedAmount = useDebouncedValue(stakingAmount, 500) // Debounce 500ms

// Query calculator khi có đủ thông tin
const { data: calculatorResponse, isLoading: isLoadingCalculator } = useQuery<CalculateStakingResponse>({
  queryKey: ['staking-calculator', stakingType, debouncedAmount],
  queryFn: () => calculateStaking({
    type: stakingType,
    amount: Number(debouncedAmount)
  }),
  enabled: !!debouncedAmount && Number(debouncedAmount) > 0,
  staleTime: 30 * 1000, // Cache 30 giây
})
```

#### Option B: Manual Trigger (khi click button "Preview")
```typescript
const [previewData, setPreviewData] = useState<CalculateStakingResponse['data'] | null>(null)

const handlePreview = async () => {
  try {
    const response = await calculateStaking({
      type: stakingType,
      amount: Number(stakingAmount)
    })
    setPreviewData(response.data)
  } catch (error) {
    toast.error('Failed to calculate staking')
  }
}
```

### 4. **UI Component để Hiển Thị Preview**

```typescript
{calculatorResponse?.data && (
  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
    <h3 className="font-semibold mb-2">Preview Information</h3>
    <div className="space-y-2">
      <p>Devices: {calculatorResponse.data.devices}</p>
      <p>Videos per day: {calculatorResponse.data.videos_per_day}</p>
      <p>Time gap: {calculatorResponse.data.time_gap} minutes</p>
      <p>Estimated reward: ${calculatorResponse.data.estimated_reward}</p>
    </div>
  </div>
)}
```

---

## ⚠️ Validation Rules

### Request Validation
- ✅ `type` phải là: `"1d"` | `"7d"` | `"30d"`
- ✅ `amount` phải là số > 0
- ⚠️ Có thể cần validate `amount <= 3500` (giống như join-staking)
- ⚠️ Có thể cần validate số dư đủ (nhưng API này chỉ tính toán, không check balance)

### Error Handling
- **400 Bad Request**: Type không hợp lệ hoặc amount không hợp lệ
- **401 Unauthorized**: Chưa đăng nhập
- Cần handle error và hiển thị message phù hợp

---

## 🔗 Integration Flow

```
1. User nhập type và amount vào form
   ↓
2. (Optional) Debounce input → Gọi POST /incomes/calculator
   ↓
3. Hiển thị preview information:
   - devices
   - videos_per_day
   - time_gap
   - estimated_reward
   ↓
4. User xem preview và quyết định
   ↓
5. Nếu đồng ý → Click "Join" → Gọi POST /incomes/join-staking
   ↓
6. Sau khi join thành công → Refresh current staking
```

---

## 📝 Notes

1. **API này là read-only**: Không có side effects, chỉ tính toán và trả về thông tin
2. **Có thể cache**: Vì là read-only, có thể cache kết quả với cùng `type` và `amount`
3. **Debounce recommended**: Nếu dùng real-time preview, nên debounce để tránh spam API
4. **Optional feature**: Có thể không bắt buộc phải implement, nhưng sẽ cải thiện UX đáng kể
5. **Error messages**: Cần kiểm tra thêm các error messages khác từ backend (ngoài type validation)

---

## ✅ Checklist Implementation

- [ ] Thêm `CalculateStakingRequest` interface
- [ ] Thêm `CalculateStakingResponse` interface  
- [ ] Thêm `calculateStaking` function vào `StakingService.ts`
- [ ] Tạo hook `useDebounce` (nếu dùng real-time preview)
- [ ] Integrate vào `make-money/page.tsx`
- [ ] Tạo UI component để hiển thị preview
- [ ] Handle error cases
- [ ] Test với các giá trị khác nhau của `type` và `amount`
- [ ] Verify response data structure khớp với spec

