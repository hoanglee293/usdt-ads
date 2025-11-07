"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { LangProvider } from "@/lang/LangProvider";
import Header from "@/components/Header";
import { getProfile, UserProfile } from "@/services/AuthService";
import { Toaster } from "react-hot-toast";

interface ClientLayoutProps {
  children: React.ReactNode;
}

function ClientLayoutContent({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuth, login, logout } = useAuth();
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Check if current page is login
  const isLoginPage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/change-password" ||
    pathname === "/reset-password" ||
    pathname === "/register" ||
    pathname === "/verify-mail";

  // Gọi API để kiểm tra authentication status
  const { data: userProfile, isLoading: isCheckingAuth, error } = useQuery<UserProfile>({
    queryKey: ['auth-check'],
    queryFn: async () => {
      const response = await getProfile();
      return response.user;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Cập nhật auth state dựa trên kết quả API
  useEffect(() => {
    if (isCheckingAuth) return;

    if (userProfile) {
      // Nếu API thành công, user đã đăng nhập
      login({
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        display_name: userProfile.display_name,
      });
    } else if (error) {
      // Nếu API lỗi (401, 403, etc), user chưa đăng nhập
      logout();
    }

    // Đánh dấu đã hoàn thành việc check auth
    setIsAuthInitialized(true);
  }, [userProfile, error, isCheckingAuth, login, logout]);

  // Handle authentication redirects
  useEffect(() => {
    // Chỉ redirect khi đã check xong auth status và đã init
    if (!isAuthInitialized) return;

    if (!isAuth && !isLoginPage) {
      router.push("/login");
      return;
    }
    // Nếu đã login mà đang ở trang login thì chuyển hướng đến /
    if (isAuth && isLoginPage && pathname !== "/verify-mail") {
      router.push("/");
    }
  }, [isAuth, isLoginPage, pathname, router, isAuthInitialized]);

  console.log(isAuth)

  // Hiển thị loading cho đến khi hoàn thành việc check auth và cập nhật state
  // Điều này đảm bảo không có flash của content không đúng
  if (!isAuthInitialized) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-theme-white-100">
        <div className="flex flex-col items-center gap-4 relative">
          <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-pink-500 border-solid flex items-center justify-center absolute top-0 left-0 z-10"></div>
          <img src="/logo.png" alt="Loading" className="w-24 h-24" />
        </div>
      </div>
    );
  }

  return (
    <>
      {!isLoginPage && <Header />}
      <main className="flex-1 min-h-screen font-inter">{children}</main>
    </>
  );
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnMount: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <ClientLayoutContent>{children}</ClientLayoutContent>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '8px',
              padding: '16px 12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </LangProvider>
    </QueryClientProvider>
  );
}
