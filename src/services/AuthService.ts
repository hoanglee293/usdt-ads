import axiosClient from "@/utils/axiosClient";

export interface RegisterData {
  uname: string;
  uemail: string;
  upassword: string;
  ufulllname: string;
  ref_code: string;
  usex?: "man" | "woman" | "other";
  uphone?: string;
  utelegram?: string;
  ubirthday?: string; // Format: "YYYY-MM-DD"
}

export interface VerifyEmailData {
  code: string;
}

// Login API Types
export interface LoginRequest {
  email: string; // Can be username or email
  password: string;
}

export interface LoginUser {
  id: number;
  name: string;
  email: string;
  display_name: string;
}

export interface LoginSuccessResponse {
  statusCode: 200;
  message: "Login successful";
  user: LoginUser;
}

export interface LoginErrorResponse {
  statusCode: 400 | 401 | 403;
  message: string;
}

// User Profile API Types
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  telegram: string;
  ref: string;
  display_name: string;
  avatar: string;
  birthday: string; // Format: "YYYY-MM-DD"
  sex: "man" | "woman" | "other";
  active_email: boolean;
  active_ggauth: boolean;
  verify: boolean;
  level: number;
  kol: boolean;
  status: "active" | "inactive";
  created_at: string; // ISO 8601 format
}

export interface ProfileResponse {
  statusCode: 200;
  user: UserProfile;
}

// Reset Password API Types
export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordSuccessResponse {
  statusCode: 200;
  message: "If the email exists, a password reset link has been sent";
}

export interface SetNewPasswordRequest {
  code: string;
  password: string;
}

export interface SetNewPasswordSuccessResponse {
  statusCode: 200;
  message: "Password has been reset successfully";
}

export interface ResetPasswordErrorResponse {
  statusCode: 400;
  message: string;
}

// Update Profile API Types
export interface UpdateProfileRequest {
  display_name: string;
  birthday?: string; // Format: "YYYY-MM-DD"
  sex?: "man" | "woman" | "other";
}

export interface UpdateProfileSuccessResponse {
  statusCode: 200;
  message: "Profile updated successfully";
  user: {
    id: number;
    display_name: string;
    birthday: string; // ISO 8601 format
    sex: "man" | "woman" | "other";
  };
}

export interface UpdateProfileErrorResponse {
  statusCode: 400;
  message: string;
}

// KYC API Types
export interface KycVerification {
  id: number;
  id_card_number: string;
  front_image: string;
  backside_image: string;
  status: "pending" | "pedding" | "approved" | "rejected" | "retry"; // "pedding" is typo from API
}

export interface KycSubmitRequest {
  id_card_number: string;
  images: [File, File]; // [front, back]
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

export const loginPassword = async (email: string, password: string): Promise<LoginSuccessResponse> => {
  try {
    const response = await axiosClient.post<LoginSuccessResponse>('/users/login', { 
      email, // Can be username or email as per API spec
      password 
    });
    return response.data;
  } catch (error: any) {
    // API returns error response with statusCode and message
    if (error.response?.data) {
      throw error.response.data as LoginErrorResponse;
    }
    console.error(error);
    throw error;
  }
}

export const registerPassword = async (data: RegisterData) => {
  try {
    const response = await axiosClient.post('/users/register', data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const verifyEmail = async (data: VerifyEmailData) => {
  try {
    const response = await axiosClient.post('/users/verify-email', data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const generateCodeVerifyEmail = async () => {
  try {
    const response = await axiosClient.post('/users/generate-code-verify-email');
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const getProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await axiosClient.get<ProfileResponse>('/users/me');
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const handleLogout = async () => {
  try {
    const response = await axiosClient.post('/users/logout');
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const resetPasswordRequest = async (email: string): Promise<ResetPasswordSuccessResponse> => {
  try {
    const response = await axiosClient.post<ResetPasswordSuccessResponse>('/users/reset-password', { 
      email 
    });
    return response.data;
  } catch (error: any) {
    // API returns error response with statusCode and message
    if (error.response?.data) {
      throw error.response.data as ResetPasswordErrorResponse;
    }
    console.error(error);
    throw error;
  }
}

export const setNewPassword = async (code: string, password: string): Promise<SetNewPasswordSuccessResponse> => {
  try {
    const response = await axiosClient.post<SetNewPasswordSuccessResponse>('/users/set-new-password', { 
      code,
      password 
    });
    return response.data;
  } catch (error: any) {
    // API returns error response with statusCode and message
    if (error.response?.data) {
      throw error.response.data as ResetPasswordErrorResponse;
    }
    console.error(error);
    throw error;
  }
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<UpdateProfileSuccessResponse> => {
  try {
    const response = await axiosClient.post<UpdateProfileSuccessResponse>('/users/update-profile', data);
    return response.data;
  } catch (error: any) {
    // API returns error response with statusCode and message
    if (error.response?.data) {
      throw error.response.data as UpdateProfileErrorResponse;
    }
    console.error(error);
    throw error;
  }
}

// KYC API Functions
export const submitKyc = async (data: KycSubmitRequest): Promise<KycSubmitResponse> => {
  try {
    const formData = new FormData();
    formData.append('id_card_number', data.id_card_number);
    
    // Gửi cùng field name 'images' cho cả 2 files
    // Multer sẽ tự động tạo array từ các files có cùng field name
    formData.append('images', data.images[0]);
    formData.append('images', data.images[1]);

    // Không set Content-Type header - để axios tự động set với boundary
    const response = await axiosClient.post<KycSubmitResponse>('/users/kyc', formData);
    return response.data;
  } catch (error: any) {
    // API returns error response with statusCode and message
    if (error.response?.data) {
      throw error.response.data as KycErrorResponse;
    }
    console.error(error);
    throw error;
  }
}

export const retryKyc = async (data: KycSubmitRequest): Promise<KycSubmitResponse> => {
  try {
    const formData = new FormData();
    formData.append('id_card_number', data.id_card_number);
    
    // Gửi cùng field name 'images' cho cả 2 files
    // Multer sẽ tự động tạo array từ các files có cùng field name
    formData.append('images', data.images[0]);
    formData.append('images', data.images[1]);

    // Không set Content-Type header - để axios tự động set với boundary
    const response = await axiosClient.post<KycSubmitResponse>('/users/kyc-retry', formData);
    return response.data;
  } catch (error: any) {
    // API returns error response with statusCode and message
    if (error.response?.data) {
      throw error.response.data as KycErrorResponse;
    }
    console.error(error);
    throw error;
  }
}
  