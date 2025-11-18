# Phân Tích API Mission Now (Xem Video)

## 📋 Tổng Quan

API này cung cấp thông tin chi tiết về tiến độ nhiệm vụ xem video của user trong gói staking đang active. Khác với API `GET /incomes/join-now` (chỉ trả về thông tin gói staking), API này trả về **tiến độ thực tế** của việc xem video.

---

## 🔍 Phân Tích Chi Tiết

### **GET /incomes/mission-now** - Lấy Thông Tin Tiến Độ Nhiệm Vụ Xem Video

#### Mục Đích
- Hiển thị số video đã xem (`turn_day`) so với số video cần xem (`turn_setting`)
- Hiển thị thời gian xem video mới nhất
- Hiển thị khoảng thời gian giữa các lần xem (để user biết khi nào có thể xem tiếp)
- Hiển thị số thiết bị cho phép

#### Request
- **Method**: GET
- **Endpoint**: `/incomes/mission-now`
- **Headers**: Cần authentication token
- **Body**: Không có

#### Response Success (200)

**Trường hợp 1: User đã xem ít nhất 1 video**
```typescript
{
  statusCode: 200,
  message: "Get mission now successfully",
  data: {
    turn_setting: number,        // Số video cần xem (từ gói staking)
    devices: number,              // Số thiết bị cho phép (từ gói staking)
    turn_day: number,             // Số video đã xem trong ngày (tiến độ)
    time_watch_new: string,       // ISO 8601: Thời gian xem video mới nhất
    time_gap: number              // Khoảng thời gian giữa các lần xem (phút)
  }
}
```

**Trường hợp 2: User chưa xem video nào**
```typescript
{
  statusCode: 200,
  message: "Get mission now successfully",
  data: {
    turn_setting: number,
    devices: number,
    turn_day: 0,                  // Chưa xem video nào
    time_watch_new: null,         // Chưa có thời gian xem
    time_gap: number
  }
}
```

#### Error Cases (400/401)

| Status | Message | Mô Tả |
|--------|---------|-------|
| 400 | User does not have a running staking lock | User chưa tham gia gói staking nào hoặc gói đã kết thúc |
| 401 | Unauthorized | Chưa đăng nhập hoặc token không hợp lệ |

---

## 📊 So Sánh Với API Hiện Tại

### API `GET /incomes/join-now` (Đã có)
- Trả về thông tin **gói staking** (settings)
- Bao gồm: `turn_setting`, `devices_setting` (số lượng cần hoàn thành)
- Không có thông tin về **tiến độ thực tế**

### API `GET /incomes/mission-now` (Mới)
- Trả về thông tin **tiến độ nhiệm vụ** (progress)
- Bao gồm: `turn_day` (số video đã xem), `time_watch_new` (thời gian xem gần nhất)
- Có thông tin về timing: `time_gap` (khoảng cách giữa các lần xem)

---

## 🎯 Use Cases

1. **Hiển thị Progress Bar**: 
   - `turn_day / turn_setting * 100%` để hiển thị % hoàn thành

2. **Hiển thị Countdown Timer**:
   - Tính thời gian còn lại trước khi có thể xem video tiếp theo
   - Formula: `time_watch_new + time_gap minutes - current_time`

3. **Disable/Enable Button Xem Video**:
   - Disable nếu `turn_day >= turn_setting` (đã xem đủ)
   - Disable nếu chưa đủ `time_gap` kể từ lần xem cuối

4. **Hiển thị Thông Tin Chi Tiết**:
   - "Đã xem: 4/10 video"
   - "Còn lại: 6 video"
   - "Có thể xem tiếp sau: 5 phút"

---

## 💻 Implementation Suggestions

### 1. Thêm Interface vào StakingService.ts

```typescript
export interface MissionNowResponse {
  statusCode: 200;
  message: string;
  data: {
    turn_setting: number;        // Số video cần xem
    devices: number;              // Số thiết bị cho phép
    turn_day: number;             // Số video đã xem
    time_watch_new: string | null; // Thời gian xem video mới nhất (ISO 8601)
    time_gap: number;             // Khoảng thời gian giữa các lần xem (phút)
  };
}
```

### 2. Thêm API Function

```typescript
/**
 * Lấy thông tin tiến độ nhiệm vụ xem video
 * @returns Promise<MissionNowResponse>
 */
export const getMissionNow = async (): Promise<MissionNowResponse> => {
  try {
    const response = await axiosClient.get('/incomes/mission-now');
    return response.data;
  } catch (error: any) {
    // 400 is expected when no active staking exists
    if (error?.response?.status === 400) {
      throw error;
    }
    console.error('Error fetching mission now:', error);
    throw error;
  }
}
```

### 3. Sử dụng trong Make Money Page

```typescript
// Thêm query để lấy mission progress
const { data: missionNowResponse, isLoading: isLoadingMission } = useQuery<MissionNowResponse>({
  queryKey: ['mission-now'],
  queryFn: getMissionNow,
  enabled: !!currentStaking, // Chỉ query khi có staking active
  refetchInterval: 30000, // Refetch mỗi 30 giây để cập nhật countdown
  retry: false,
});

const missionProgress = useMemo(() => {
  if (!missionNowResponse?.data) return null;
  
  const { turn_setting, turn_day, time_watch_new, time_gap } = missionNowResponse.data;
  
  return {
    completed: turn_day,
    total: turn_setting,
    progress: (turn_day / turn_setting) * 100,
    canWatchNext: calculateCanWatchNext(time_watch_new, time_gap),
    nextWatchTime: calculateNextWatchTime(time_watch_new, time_gap),
  };
}, [missionNowResponse]);
```

### 4. UI Components Cần Thêm

- **Progress Bar**: Hiển thị `turn_day / turn_setting`
- **Countdown Timer**: Hiển thị thời gian còn lại trước khi xem tiếp
- **Video Watch Button**: Enable/disable dựa trên `canWatchNext`
- **Mission Status Card**: Hiển thị thông tin chi tiết về nhiệm vụ

---

## ⚠️ Lưu Ý Quan Trọng

1. **Điều Kiện Gọi API**:
   - API này chỉ hoạt động khi user có staking đang `running`
   - Nếu không có staking active → 400 error: "User does not have a running staking lock"

2. **Time Gap Logic**:
   - `time_gap` là số phút cần chờ giữa các lần xem video
   - Cần tính toán: `nextWatchTime = time_watch_new + time_gap minutes`
   - Nếu `current_time < nextWatchTime` → chưa thể xem tiếp

3. **Turn Day Reset**:
   - `turn_day` có thể reset theo ngày (cần xác nhận với backend)
   - Hoặc tích lũy trong suốt thời gian staking

4. **Null Handling**:
   - `time_watch_new` có thể là `null` khi chưa xem video nào
   - Cần xử lý case này trong UI

---

## 🔄 Flow Hoàn Chỉnh

1. User tham gia gói staking → `POST /incomes/join-staking` hoặc `POST /incomes/join-base`
2. Lấy thông tin gói → `GET /incomes/join-now`
3. Lấy tiến độ nhiệm vụ → `GET /incomes/mission-now` (mới)
4. User xem video → `POST /incomes/mission-watch` (có thể cần API này)
5. Cập nhật tiến độ → Refetch `GET /incomes/mission-now`
6. Khi hoàn thành → Gói chuyển sang `pending-claim`
7. User claim reward → `POST /incomes/mission-claim`

---

## 📝 Next Steps

1. ✅ Phân tích API (đã hoàn thành)
2. ⏳ Thêm interface và function vào `StakingService.ts`
3. ⏳ Tích hợp vào `make-money/page.tsx` để hiển thị progress
4. ⏳ Tạo UI components cho progress bar và countdown timer
5. ⏳ Xử lý error cases (400 khi không có staking)
6. ⏳ Test với các trường hợp: chưa xem, đã xem một phần, đã xem đủ

