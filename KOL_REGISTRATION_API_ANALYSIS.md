# Phân Tích API KOL (Key Opinion Leader) Registration

## 📋 Tổng Quan

File documentation mô tả 2 API endpoints chính cho hệ thống đăng ký KOL:
- **POST /api/v1/users/register-kol** - Gửi yêu cầu đăng ký KOL
- **GET /users/check-register-kol** - Kiểm tra trạng thái đăng ký KOL

---

## 🔍 Phân Tích Chi Tiết Các API

### 1. **POST /api/v1/users/register-kol** - Register as KOL

#### Mục Đích
Gửi yêu cầu đăng ký trở thành KOL (Key Opinion Leader) với thông tin về các kênh social media và website.

#### Request Format
- **Method**: POST
- **Content-Type**: `application/json`
- **Endpoint**: `/api/v1/users/register-kol`
- **Body Parameters**:
  ```typescript
  {
    name: string;                    // required - Tên KOL
    facebook_url?: string;           // optional - Link Facebook
    x_url?: string;                  // optional - Link X (Twitter)
    group_telegram_url?: string;     // optional - Link Telegram group
    youtube_url?: string;            // optional - Link YouTube
    website_url?: string;            // optional - Link Website
  }
  ```

#### Response Success (201)
```typescript
{
  statusCode: 201,
  message: "KOL registration request submitted successfully",
  kol_register: {
    id: number,
    name: string,
    facebook_url: string | null,
    x_url: string | null,
    group_telegram_url: string | null,
    youtube_url: string | null,
    website_url: string | null,
    status: "pending"  // Trạng thái: pending (chờ duyệt)
  }
}
```

#### Error Cases

| Status Code | Error Message | Mô Tả |
|-------------|---------------|-------|
| 400 | Name is required | Thiếu trường name (bắt buộc) |
| 400 | At least one URL (facebook_url, x_url, group_telegram_url, youtube_url, or website_url) must be provided and cannot be empty | Phải cung cấp ít nhất một URL và không được để trống |
| 400 | User is already a KOL | User đã là KOL rồi (không cần đăng ký lại) |
| 400 | KOL registration request has already been submitted and is pending review | Đã có yêu cầu đăng ký KOL đang chờ duyệt |

#### Validation Rules
- **name**: Bắt buộc, không được để trống
- **URLs**: Ít nhất một trong các URL sau phải được cung cấp và không được để trống:
  - `facebook_url`
  - `x_url`
  - `group_telegram_url`
  - `youtube_url`
  - `website_url`
- **URL Format**: Cần validate format URL hợp lệ (nên kiểm tra trên frontend)

---

### 2. **GET /users/check-register-kol** - Check KOL Registration Status

#### Mục Đích
Kiểm tra trạng thái đăng ký KOL của user hiện tại.

#### Request Format
- **Method**: GET
- **Endpoint**: `/users/check-register-kol`
- **Headers**: Authentication required (cookies/tokens)

#### Response Success (200)
```typescript
{
  statusCode: 200,
  status: "success" | "pending" | "not-register"
}
```

**Giải thích các status:**
- `"success"`: User đã là KOL (đã được duyệt)
- `"pending"`: Đã gửi yêu cầu đăng ký, đang chờ duyệt
- `"not-register"`: Chưa đăng ký KOL

#### Error Cases

| Status Code | Error Message | Mô Tả |
|-------------|---------------|-------|
| 500 | User not found. This should not happen. Please contact support. | Lỗi server - User không tồn tại (lỗi hệ thống) |

---

## ⚠️ Vấn Đề Phát Hiện

### 1. **Inconsistency trong Endpoint Paths**
- **POST** endpoint: `/api/v1/users/register-kol` (có prefix `/api/v1`)
- **GET** endpoint: `/users/check-register-kol` (không có prefix `/api/v1`)
- ⚠️ **Vấn đề**: Cần xác nhận endpoint chính xác. Dựa vào `axiosClient.ts`, baseURL đã có `/api/v1`, nên:
  - POST: `/users/register-kol` (đúng)
  - GET: `/users/check-register-kol` (đúng)

### 2. **Thiếu Thông Tin**
- Không có API để **GET** thông tin chi tiết về KOL registration hiện tại (chỉ có status)
- Không có API để **UPDATE** thông tin KOL registration (nếu đang pending)
- Không có API để **CANCEL** yêu cầu đăng ký KOL (nếu đang pending)
- Không rõ format validation cho các URL fields
- Không rõ độ dài tối đa của `name` field

### 3. **Thiếu Validation Rules**
- Không rõ format URL được chấp nhận (http/https?)
- Không rõ có cần validate URL format không (ví dụ: phải là URL hợp lệ)
- Không rõ có giới hạn độ dài cho các URL fields không

### 4. **Response Structure**
- Response của GET endpoint chỉ trả về `status`, không có thông tin chi tiết về KOL registration (như id, name, các URLs, ngày đăng ký, etc.)

---

## 📝 Yêu Cầu Implementation

### 1. **Service Layer** (`src/services/AuthService.ts` hoặc tạo `KolService.ts`)

Cần implement:
```typescript
// Types
export interface KolRegisterRequest {
  name: string;
  facebook_url?: string;
  x_url?: string;
  group_telegram_url?: string;
  youtube_url?: string;
  website_url?: string;
}

export interface KolRegister {
  id: number;
  name: string;
  facebook_url: string | null;
  x_url: string | null;
  group_telegram_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  status: "pending" | "approved" | "rejected"; // Có thể có thêm status khác
}

export interface KolRegisterResponse {
  statusCode: 201;
  message: string;
  kol_register: KolRegister;
}

export interface KolRegisterErrorResponse {
  statusCode: 400;
  message: string;
}

export interface KolStatusResponse {
  statusCode: 200;
  status: "success" | "pending" | "not-register";
}

export interface KolStatusErrorResponse {
  statusCode: 500;
  message: string;
}

// Functions
export const registerKol = async (data: KolRegisterRequest): Promise<KolRegisterResponse>
export const checkKolStatus = async (): Promise<KolStatusResponse>
```

### 2. **UI Component** (`src/app/referral/kol/page.tsx`)

Hiện tại page đã có nhưng chỉ hiển thị message khi user chưa có KOL permission. Cần implement:

#### Khi user chưa đăng ký KOL (`status: "not-register"`):
- Form đăng ký KOL với các fields:
  - **Name** (required): Input text
  - **Facebook URL** (optional): Input URL
  - **X (Twitter) URL** (optional): Input URL
  - **Telegram Group URL** (optional): Input URL
  - **YouTube URL** (optional): Input URL
  - **Website URL** (optional): Input URL
- Validation:
  - Name không được để trống
  - Ít nhất một URL phải được điền
  - Validate format URL (nếu có)
- Submit button
- Hiển thị loading state khi đang submit

#### Khi đang chờ duyệt (`status: "pending"`):
- Hiển thị thông báo "Yêu cầu đăng ký KOL của bạn đang chờ duyệt"
- Hiển thị thông tin đã submit (name, các URLs)
- Có thể có button "Hủy yêu cầu" (nếu API hỗ trợ)

#### Khi đã là KOL (`status: "success"`):
- Hiển thị nội dung KOL page hiện tại (Smart Referral)
- User có thể sử dụng các tính năng KOL

### 3. **Form Validation**

Cần validate:
```typescript
// Client-side validation
const validateKolForm = (data: KolRegisterRequest): string[] => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Name is required");
  }
  
  const urls = [
    data.facebook_url,
    data.x_url,
    data.group_telegram_url,
    data.youtube_url,
    data.website_url
  ].filter(url => url && url.trim().length > 0);
  
  if (urls.length === 0) {
    errors.push("At least one URL must be provided");
  }
  
  // Validate URL format
  const urlPattern = /^https?:\/\/.+/;
  urls.forEach(url => {
    if (url && !urlPattern.test(url)) {
      errors.push(`Invalid URL format: ${url}`);
    }
  });
  
  return errors;
};
```

### 4. **Error Handling**

Cần xử lý các error cases:
- **400 - Name is required**: Hiển thị lỗi ở field name
- **400 - At least one URL required**: Hiển thị lỗi tổng quát, highlight các URL fields
- **400 - User is already a KOL**: Redirect về KOL page hoặc hiển thị thông báo
- **400 - Already pending**: Hiển thị thông báo và chuyển sang view "pending"
- **500 - User not found**: Hiển thị lỗi hệ thống, yêu cầu liên hệ support

---

## 🔄 So Sánh Với Codebase Hiện Tại

### ✅ Đã Có
- `axiosClient` đã được setup với interceptors và baseURL `/api/v1`
- Error handling pattern đã được sử dụng trong `AuthService.ts`
- UI components (Input, Button, Card, Modal) từ shadcn/ui
- Toast notifications đã được sử dụng (`react-hot-toast`)
- Page `/referral/kol` đã tồn tại nhưng chỉ check `profile.kol`
- Translation system (`useLang`) đã có sẵn
- `UserProfile` interface đã có field `kol: boolean`

### ❌ Chưa Có
- KOL registration service functions
- KOL registration form component
- KOL status checking logic
- API integration cho KOL registration
- Validation cho URL fields
- UI để hiển thị trạng thái pending

---

## 💡 Khuyến Nghị

### 1. **Backend API Cần Bổ Sung**
- **GET /users/kol-registration** - Lấy thông tin chi tiết về KOL registration hiện tại
  ```typescript
  {
    statusCode: 200,
    kol_register: KolRegister | null
  }
  ```
- **DELETE /users/kol-registration** - Hủy yêu cầu đăng ký KOL (nếu đang pending)
- **PUT /users/kol-registration** - Cập nhật thông tin KOL registration (nếu đang pending)

### 2. **Frontend Implementation Priority**
1. ✅ Tạo KOL service với types và functions
2. ✅ Implement KOL registration form trong page `/referral/kol`
3. ✅ Thêm validation cho form (name, URLs)
4. ✅ Integrate với API `check-register-kol` để check status
5. ✅ Xử lý các trạng thái khác nhau (not-register, pending, success)
6. ✅ Thêm loading states và error handling
7. ✅ Update UI để hiển thị form khi chưa đăng ký

### 3. **UX Improvements**
- Clear form layout với labels và placeholders
- Real-time validation khi user nhập
- URL format validation với regex
- Disable submit button khi form invalid
- Success message sau khi submit thành công
- Auto-check status sau khi submit (polling hoặc refetch)
- Show submitted information khi đang pending

### 4. **Integration với Existing Code**
- Sử dụng `useProfile` hook để check `profile.kol`
- Nếu `profile.kol === true`, không cần check status, hiển thị KOL page
- Nếu `profile.kol === false`, gọi `checkKolStatus()` để xác định:
  - `not-register`: Hiển thị form đăng ký
  - `pending`: Hiển thị thông báo chờ duyệt
  - `success`: Có thể cần refresh profile hoặc redirect

### 5. **Security Considerations**
- Validate URL format trên client (nhưng không tin tưởng hoàn toàn)
- Sanitize input để tránh XSS
- Rate limiting cho API calls (nếu backend hỗ trợ)
- Xử lý sensitive data cẩn thận

---

## 📌 Next Steps

1. **Tạo KOL Service** - Implement API calls với proper types trong `AuthService.ts` hoặc tạo `KolService.ts`
2. **Update KOL Page** - Build form đăng ký KOL với validation
3. **Add Status Checking** - Integrate `checkKolStatus` API
4. **Error Handling** - User-friendly error messages với translation
5. **Testing** - Test các scenarios:
   - Submit form với đầy đủ thông tin
   - Submit form thiếu name
   - Submit form không có URL nào
   - Submit form với URL không hợp lệ
   - Check status khi đã đăng ký
   - Check status khi đang pending
   - Check status khi chưa đăng ký

---

## 🔗 Related Files

- `src/app/referral/kol/page.tsx` - KOL page (cần update để thêm form đăng ký)
- `src/services/AuthService.ts` - Có thể thêm KOL functions hoặc tạo `KolService.ts`
- `src/utils/axiosClient.ts` - Đã có sẵn, baseURL đã setup `/api/v1`
- `src/hooks/useProfile.ts` - Pattern để tạo `useKol.ts` hook (nếu cần)
- `src/lang/locales/*.json` - Cần thêm translations cho KOL registration

---

## 📝 Translation Keys Cần Thêm

Cần thêm vào các file locale (`en.json`, `vi.json`, `ja.json`, `kr.json`, `zh.json`):

```json
{
  "kol": {
    "registerTitle": "Register as KOL",
    "registerDescription": "Fill in your information to become a Key Opinion Leader",
    "name": "Name",
    "nameRequired": "Name is required",
    "namePlaceholder": "Enter your name",
    "facebookUrl": "Facebook URL",
    "xUrl": "X (Twitter) URL",
    "telegramUrl": "Telegram Group URL",
    "youtubeUrl": "YouTube URL",
    "websiteUrl": "Website URL",
    "urlPlaceholder": "https://...",
    "atLeastOneUrlRequired": "At least one URL must be provided",
    "invalidUrlFormat": "Invalid URL format",
    "submit": "Submit Registration",
    "submitting": "Submitting...",
    "registerSuccess": "KOL registration request submitted successfully",
    "registerError": "Failed to submit KOL registration",
    "alreadyKol": "You are already a KOL",
    "alreadyPending": "Your KOL registration request is pending review",
    "pendingTitle": "Registration Pending",
    "pendingMessage": "Your KOL registration request is being reviewed. Please wait for approval.",
    "notRegistered": "You have not registered as KOL yet"
  }
}
```

---

**Tạo bởi:** Auto Analysis  
**Ngày:** 2024  
**Version:** 1.0

