# Phân tích API Documentation - Chuyển tiền từ ví Reward sang ví Main

## 📋 Tổng quan

File documentation mô tả 2 API endpoints chính cho tính năng chuyển tiền từ ví Reward sang ví Main:

1. **GET /api/v1/wallets/transfer-rewards** - Lấy lịch sử chuyển tiền
2. **POST /api/v1/wallets/transfer-reward** - Thực hiện chuyển tiền

---

## 1. GET /api/v1/wallets/transfer-rewards - Lịch sử chuyển tiền

### Mục đích
Lấy lịch sử các giao dịch chuyển tiền từ ví Reward sang ví Main của user.

### Request

**Endpoint**: `GET /api/v1/wallets/transfer-rewards`

**Query Parameters** (có thể có):
- `status` (optional): Lọc theo trạng thái - có thể là `"pending"`, `"success"`, `"error"`

**Ví dụ**:
```
GET /api/v1/wallets/transfer-rewards
GET /api/v1/wallets/transfer-rewards?status=success
GET /api/v1/wallets/transfer-rewards?status=pending
```

### Response Success (200)

```typescript
{
  "statusCode": 200,
  "message": "Get transfer rewards history successfully",
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "from": "reward",
      "to": "main",
      "amount": 150.75,
      "status": "success",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "user_id": 123,
      "from": "reward",
      "to": "main",
      "amount": 200.50,
      "status": "success",
      "created_at": "2024-01-14T09:20:00.000Z",
      "updated_at": "2024-01-14T09:20:00.000Z"
    }
  ]
}
```

### Response Error

```typescript
{
  "statusCode": 400 | 401 | 404,
  "message": "<error_message>"
}
```

**Error Messages**:
- `400 Bad Request: status must be one of the following values: pending, success, error` - Giá trị status không hợp lệ
- `404 Not Found: Not Found` - Không tìm thấy
- `401 Unauthorized` - Chưa đăng nhập hoặc token hết hạn

---

## 2. POST /api/v1/wallets/transfer-reward - Chuyển tiền

### Mục đích
Chuyển tiền từ ví Reward sang ví Main của user.

### Request

**Endpoint**: `POST /api/v1/wallets/transfer-reward`

**Request Body**: 
- Không có body (API tự động chuyển toàn bộ số dư Reward sang Main)

**Lưu ý**:
- API tự động tính toán và chuyển toàn bộ số dư từ ví Reward sang ví Main
- Không cần truyền `amount` trong request body

### Response Success (200)

```typescript
{
  "statusCode": 200,
  "message": "Reward transferred to main balance successfully",
  "data": {
    "new_balance_reward": 100.5,
    "updated_coins": [1, 2, 3]
  }
}
```

**Response Data**:
- `new_balance_reward`: Số dư Reward mới sau khi chuyển (có thể là 0 nếu chuyển hết)
- `updated_coins`: Mảng các coin_id đã được cập nhật

### Response Error

```typescript
{
  "statusCode": 400 | 401 | 404,
  "message": "<error_message>"
}
```

**Error Messages**:
- `400 Bad Request: Cannot transfer reward: calculated balance is 0 (must be > 0)` - Số dư Reward = 0, không thể chuyển
- `400 Bad Request: User has no wallets` - User chưa có ví
- `404 Not Found: Not Found` - Không tìm thấy
- `401 Unauthorized` - Chưa đăng nhập hoặc token hết hạn

---

## 🔍 So sánh với Implementation hiện tại

### ❌ Chưa implement:

1. **GET /wallets/transfer-rewards** - Chưa có function trong `WalletService.ts`
   - Chưa có UI để hiển thị lịch sử chuyển tiền
   - Cần implement function để lấy lịch sử

2. **POST /wallets/transfer-reward** - Chưa có function trong `WalletService.ts`
   - Trang `/wallet/page.tsx` có UI element (dòng 593): "Chuyển đổi tiền ví Reward đến ví Main"
   - Nhưng chỉ là static div, chưa có chức năng
   - Cần implement function và thêm handler cho button

### ⚠️ Lưu ý về Endpoint Path:

**Quan trọng**: `axiosClient` đã có `baseURL: ${apiUrl}/api/v1`

- ✅ **Transfer History**: Dùng `/wallets/transfer-rewards` (axiosClient sẽ tự thêm `/api/v1`)
- ✅ **Transfer Reward**: Dùng `/wallets/transfer-reward` (axiosClient sẽ tự thêm `/api/v1`)

**Lưu ý**: Endpoint GET là `/transfer-rewards` (số nhiều), POST là `/transfer-reward` (số ít)

---

## 📊 Cấu trúc dữ liệu cần implement

### TypeScript Interfaces

```typescript
// Transfer Reward History Item
export interface TransferRewardHistoryItem {
  id: number;
  user_id: number;
  from: "reward";
  to: "main";
  amount: number;
  status: "pending" | "success" | "error";
  created_at: string;
  updated_at: string;
}

// Transfer Reward History Response
export interface TransferRewardHistoryResponse {
  statusCode: 200;
  message: "Get transfer rewards history successfully";
  data: TransferRewardHistoryItem[];
}

// Transfer Reward History Query Params
export interface TransferRewardHistoryParams {
  status?: "pending" | "success" | "error";
}

// Transfer Reward Request (no body needed, but we'll create empty interface for consistency)
export interface TransferRewardRequest {
  // Empty - API doesn't require body
}

// Transfer Reward Response
export interface TransferRewardResponse {
  statusCode: 200;
  message: "Reward transferred to main balance successfully";
  data: {
    new_balance_reward: number;
    updated_coins: number[];
  };
}
```

---

## 🎯 Action Items để implement

### 1. Thêm functions vào `WalletService.ts`

```typescript
/**
 * Lấy lịch sử chuyển tiền từ ví Reward sang ví Main
 * @param params - Query parameters (optional)
 * @returns Promise<TransferRewardHistoryResponse>
 */
export const getTransferRewardHistory = async (
  params?: TransferRewardHistoryParams
): Promise<TransferRewardHistoryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.status) {
      queryParams.append('status', params.status);
    }

    const queryString = queryParams.toString();
    const url = `/wallets/transfer-rewards${queryString ? `?${queryString}` : ''}`;
    
    const response = await axiosClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching transfer reward history:', error);
    throw error;
  }
}

/**
 * Chuyển tiền từ ví Reward sang ví Main
 * @returns Promise<TransferRewardResponse>
 */
export const transferRewardToMain = async (): Promise<TransferRewardResponse> => {
  try {
    const response = await axiosClient.post('/wallets/transfer-reward', {});
    return response.data;
  } catch (error) {
    console.error('Error transferring reward to main:', error);
    throw error;
  }
}
```

### 2. Cập nhật UI trong `/wallet/page.tsx`

**Hiện tại** (dòng 593):
```tsx
<div className='text-sm text-yellow-500 cursor-pointer font-semibold bg-yellow-500/10 rounded-full px-4 py-2 mt-4'>
  Chuyển đổi tiền ví Reward đến ví Main
</div>
```

**Cần thay đổi thành**:
- Thêm button với handler
- Hiển thị loading state
- Hiển thị confirmation dialog (optional)
- Refresh balance sau khi chuyển thành công
- Hiển thị error messages

### 3. Thêm translation keys

Cần thêm các keys sau vào các file locale:
- `wallet.transferReward`: "Transfer Reward"
- `wallet.transferRewardToMain`: "Transfer Reward to Main"
- `wallet.transferRewardSuccess`: "Reward transferred successfully!"
- `wallet.transferRewardError`: "Failed to transfer reward"
- `wallet.transferRewardNoBalance`: "No reward balance to transfer"
- `wallet.transferRewardConfirm`: "Are you sure you want to transfer all reward balance to main wallet?"
- `wallet.transferRewardHistory`: "Transfer History"
- `wallet.transferRewardHistoryEmpty`: "No transfer history"

### 4. Tạo component hoặc section để hiển thị lịch sử chuyển tiền (optional)

Có thể thêm một section mới trong wallet page để hiển thị lịch sử chuyển tiền từ Reward sang Main, tương tự như transaction history hiện tại.

---

## 🔄 Flow hoạt động

### Flow chuyển tiền:

1. User click button "Chuyển đổi tiền ví Reward đến ví Main"
2. (Optional) Hiển thị confirmation dialog
3. Gọi API `POST /wallets/transfer-reward`
4. Nếu thành công:
   - Hiển thị toast success
   - Refresh balance data (refetch balance query)
   - Có thể hiển thị số dư Reward mới
5. Nếu lỗi:
   - Hiển thị error message từ API
   - Giữ nguyên UI state

### Flow xem lịch sử:

1. User vào trang wallet
2. (Optional) Có thể thêm tab/section "Transfer History"
3. Gọi API `GET /wallets/transfer-rewards`
4. Hiển thị danh sách các giao dịch chuyển tiền
5. Có thể filter theo status (pending, success, error)

---

## 📝 Notes

1. **API không yêu cầu amount**: API tự động chuyển toàn bộ số dư Reward, không cần user nhập số tiền
2. **Response trả về updated_coins**: Có thể dùng để refresh balance cho các coin cụ thể
3. **Status values**: Chỉ có 3 giá trị hợp lệ: `pending`, `success`, `error`
4. **UI hiện tại**: Đã có placeholder UI ở dòng 593, chỉ cần thêm functionality
5. **Balance refresh**: Sau khi chuyển thành công, cần refresh balance để hiển thị số dư mới

---

## ✅ Checklist Implementation

- [ ] Thêm TypeScript interfaces vào `WalletService.ts`
- [ ] Thêm function `getTransferRewardHistory` vào `WalletService.ts`
- [ ] Thêm function `transferRewardToMain` vào `WalletService.ts`
- [ ] Cập nhật UI button trong `/wallet/page.tsx` (dòng 593)
- [ ] Thêm mutation handler cho transfer action
- [ ] Thêm error handling và validation
- [ ] Thêm translation keys cho tất cả ngôn ngữ
- [ ] Test API integration
- [ ] (Optional) Thêm confirmation dialog
- [ ] (Optional) Thêm section hiển thị lịch sử chuyển tiền
- [ ] (Optional) Thêm filter theo status cho lịch sử

