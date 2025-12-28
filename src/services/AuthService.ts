import axiosClient from "@/utils/axiosClient";

export interface RegisterData {
  uname: string;
  email: string;
  password: string;
  display_name: string;
  ref_code: string;
  sex?: "man" | "woman" | "other";
  phone?: string;
  telegram?: string;
  birthday?: string; // Format: "YYYY-MM-DD"
}

export interface RegisterUser {
  id: number;
  name: string;
  email: string;
  display_name: string;
}

export interface RegisterSuccessResponse {
  statusCode: 201;
  message: "User registered successfully";
  user: RegisterUser;
}

export interface RegisterErrorResponse {
  statusCode: 400 | 409;
  message: string;
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

// Change Password API Types
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordSuccessResponse {
  statusCode: 200;
  message: "Password has been changed successfully";
}

export interface ChangePasswordErrorResponse {
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

// KYC Status API Types
export interface KycStatusResponse {
  statusCode: 200;
  status: "verify" | "retry" | "pending" | "not-verified";
}

export interface KycStatusErrorResponse {
  statusCode: 401 | 403;
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

export const registerPassword = async (
  data: RegisterData
): Promise<RegisterSuccessResponse> => {
  try {
    const response = await axiosClient.post<RegisterSuccessResponse>('/users/register', data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data as RegisterErrorResponse;
    }
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

export const changePassword = async (data: ChangePasswordRequest): Promise<ChangePasswordSuccessResponse> => {
  try {
    const response = await axiosClient.post<ChangePasswordSuccessResponse>('/users/change-password', {
      current_password: data.current_password,
      new_password: data.new_password
    });
    return response.data;
  } catch (error: any) {
    // API returns error response with statusCode and message
    if (error.response?.data) {
      throw error.response.data as ChangePasswordErrorResponse;
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

export const getKycStatus = async (): Promise<KycStatusResponse> => {
  try {
    const response = await axiosClient.get<KycStatusResponse>('/users/kyc-status');
    return response.data;
  } catch (error: any) {
    // API returns error response with statusCode and message
    if (error.response?.data) {
      throw error.response.data as KycStatusErrorResponse;
    }
    console.error(error);
    throw error;
  }
}

// KOL Registration API Types
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
  status: "pending" | "approved" | "rejected";
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

// KOL Registration API Functions
export const registerKol = async (data: KolRegisterRequest): Promise<KolRegisterResponse> => {
  try {
    const response = await axiosClient.post<KolRegisterResponse>('/users/register-kol', data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data as KolRegisterErrorResponse;
    }
    console.error(error);
    throw error;
  }
}

export const checkKolStatus = async (): Promise<KolStatusResponse> => {
  try {
    const response = await axiosClient.get<KolStatusResponse>('/users/check-register-kol');
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data as KolStatusErrorResponse;
    }
    console.error(error);
    throw error;
  }
}
  