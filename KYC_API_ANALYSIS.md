# Phân Tích API KYC (Know Your Customer) Verification

## 📋 Tổng Quan

File documentation mô tả 2 API endpoints chính cho hệ thống xác thực KYC:
- **POST /users/kyc** - Gửi yêu cầu KYC lần đầu
- **POST /users/kyc-retry** - Gửi lại yêu cầu KYC khi bị từ chối

---

## 🔍 Phân Tích Chi Tiết Các API

### 1. **POST /users/kyc** - Submit KYC Verification

#### Mục Đích
Gửi thông tin xác thực KYC lần đầu tiên cho user.

#### Request Format
- **Method**: POST
- **Content-Type**: `multipart/form-data` (vì có file upload)
- **Body Parameters**:
  ```
  id_card_number: string (required)
  images[0]: File (required) - Ảnh mặt trước CMND/CCCD
  images[1]: File (required) - Ảnh mặt sau CMND/CCCD
  ```

#### Response Success (201)
```typescript
{
  statusCode: 201,
  message: "KYC verification submitted successfully",
  verification: {
    id: number,
    id_card_number: string,
    front_image: string,        // Path: "1/a1b2c3d4e5f6.jpg"
    backside_image: string,     // Path: "1/f6e5d4c3b2a1.jpg"
    status: "pedding"           // ⚠️ Lỗi chính tả: nên là "pending"
  }
}
```

#### Error Cases

| Status Code | Error Message | Mô Tả |
|-------------|---------------|-------|
| 400 | ID card number is required | Thiếu số CMND/CCCD |
| 400 | Please upload both front and backside images | Thiếu một trong hai ảnh |
| 400 | Files must be images | File không phải là ảnh |
| 401 | - | Chưa đăng nhập |
| 403 | - | Không có quyền truy cập |
| 409 | KYC verification already exists for this user. Cannot submit again | Đã có KYC verification, không thể submit lại |

---

### 2. **POST /users/kyc-retry** - Retry KYC Verification

#### Mục Đích
Gửi lại thông tin xác thực KYC khi bị từ chối (status = "retry").

#### Request Format
- **Method**: POST
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  ```
  id_card_number: string (required)
  images[0]: File (required) - Ảnh mặt trước CMND/CCCD
  images[1]: File (required) - Ảnh mặt sau CMND/CCCD
  ```

#### Response Success (200)
```typescript
{
  statusCode: 200,
  message: "KYC verification retry submitted successfully",
  verification: {
    id: number,
    id_card_number: string,
    front_image: string,
    backside_image: string,
    status: "pedding"  // ⚠️ Lỗi chính tả: nên là "pending"
  }
}
```

#### Error Cases

| Status Code | Error Message | Mô Tả |
|-------------|---------------|-------|
| 400 | ID card number is required | Thiếu số CMND/CCCD |
| 400 | Please upload both front and backside images | Thiếu một trong hai ảnh |
| 400 | Files must be images | File không phải là ảnh |
| 400 | No KYC verification with retry status found for this user | ⚠️ Có lỗi chính tả: "Bad Requestt" (2 chữ 't') |
| 401 | - | Chưa đăng nhập |
| 403 | - | Không có quyền truy cập |
| 409 | - | Conflict khác |

---

## ⚠️ Vấn Đề Phát Hiện

### 1. **Lỗi Chính Tả trong Response**
- `status: "pedding"` → Nên là `"pending"`
- Error message: `"Bad Requestt"` → Nên là `"Bad Request"` (dòng 61)

### 2. **Thiếu Thông Tin**
- Không có API để **GET** thông tin KYC hiện tại của user
- Không có API để **GET** danh sách các status có thể có (pending, approved, rejected, retry)
- Không rõ format của `id_card_number` (độ dài, pattern validation)

### 3. **Thiếu Validation Rules**
- Không rõ kích thước file tối đa
- Không rõ định dạng ảnh được chấp nhận (jpg, png, jpeg?)
- Không rõ độ phân giải tối thiểu

---

## 📝 Yêu Cầu Implementation

### 1. **Service Layer** (`src/services/AuthService.ts` hoặc tạo `KycService.ts`)

Cần implement:
```typescript
// Types
export interface KycSubmitRequest {
  id_card_number: string;
  images: [File, File]; // [front, back]
}

export interface KycVerification {
  id: number;
  id_card_number: string;
  front_image: string;
  backside_image: string;
  status: "pending" | "approved" | "rejected" | "retry";
}

export interface KycSubmitResponse {
  statusCode: 201 | 200;
  message: string;
  verification: KycVerification;
}

export interface KycErrorResponse {
  statusCode: 400 | 401 | 403 | 409;
  message: string;
}

// Functions
export const submitKyc = async (data: KycSubmitRequest): Promise<KycSubmitResponse>
export const retryKyc = async (data: KycSubmitRequest): Promise<KycSubmitResponse>
```

### 2. **UI Component** (`src/app/my-profile/kyc/page.tsx`)

Hiện tại chỉ có placeholder. Cần implement:
- Form nhập `id_card_number`
- Upload 2 ảnh (mặt trước và mặt sau)
- Preview ảnh sau khi upload
- Hiển thị trạng thái KYC hiện tại (nếu có)
- Xử lý các trường hợp:
  - Chưa submit KYC → Hiển thị form submit
  - Đã submit (pending) → Hiển thị trạng thái chờ duyệt
  - Bị từ chối (rejected/retry) → Hiển thị form retry
  - Đã approved → Hiển thị thông báo đã xác thực

### 3. **File Upload Handling**

Cần sử dụng `FormData` để upload:
```typescript
const formData = new FormData();
formData.append('id_card_number', idCardNumber);
formData.append('images[0]', frontImage);
formData.append('images[1]', backImage);
```

### 4. **Error Handling**

Cần xử lý các error cases:
- Validation errors (400)
- Authentication errors (401)
- Permission errors (403)
- Conflict errors (409) - Đã có KYC verification

---

## 🔄 So Sánh Với Codebase Hiện Tại

### ✅ Đã Có
- `axiosClient` đã được setup với interceptors
- Error handling pattern đã được sử dụng trong `AuthService.ts`
- UI components (Input, Button, Card) từ shadcn/ui
- Toast notifications đã được sử dụng

### ❌ Chưa Có
- KYC service functions
- KYC page implementation (chỉ có placeholder)
- File upload handling
- KYC status management
- API để GET KYC status hiện tại

---

## 💡 Khuyến Nghị

### 1. **Backend API Cần Bổ Sung**
- **GET /users/kyc** - Lấy thông tin KYC hiện tại của user
- Response có thể là:
  ```typescript
  {
    statusCode: 200,
    verification: KycVerification | null
  }
  ```

### 2. **Frontend Implementation Priority**
1. ✅ Tạo KYC service với types và functions
2. ✅ Implement KYC page với form upload
3. ✅ Thêm validation cho file upload (size, type)
4. ✅ Xử lý các trạng thái KYC khác nhau
5. ✅ Thêm loading states và error handling

### 3. **UX Improvements**
- Preview ảnh trước khi submit
- Drag & drop để upload ảnh
- Crop/resize ảnh nếu cần
- Progress indicator khi upload
- Clear error messages cho từng trường hợp

### 4. **Security Considerations**
- Validate file type trên client (nhưng không tin tưởng hoàn toàn)
- Giới hạn kích thước file
- Sanitize `id_card_number` input
- Xử lý sensitive data cẩn thận

---

## 📌 Next Steps

1. **Tạo KYC Service** - Implement API calls với proper types
2. **Update KYC Page** - Build form với file upload
3. **Add Validation** - Client-side validation cho inputs
4. **Error Handling** - User-friendly error messages
5. **Testing** - Test các scenarios khác nhau

---

## 🔗 Related Files

- `src/app/my-profile/kyc/page.tsx` - KYC page (cần implement)
- `src/services/AuthService.ts` - Có thể thêm KYC functions hoặc tạo `KycService.ts`
- `src/utils/axiosClient.ts` - Đã có sẵn, hỗ trợ file upload
- `src/hooks/useProfile.ts` - Pattern để tạo `useKyc.ts` hook

---

**Tạo bởi:** Auto Analysis  
**Ngày:** $(date)  
**Version:** 1.0

