"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { LangProvider } from "@/lang/LangProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { useTheme } from "@/theme/useTheme";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

interface ClientLayoutProps {
  children: React.ReactNode;
}

function ThemeAwareToaster() {
  const { theme } = useTheme();
  
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme === 'dark' ? '#1E1E1E' : '#fff',
          color: theme === 'dark' ? '#E0E0E0' : '#333',
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
  );
}

function ClientLayoutContent({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuth, login, logout } = useAuth();
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [emailVerifyMessage, setEmailVerifyMessage] = useState(
    "Email is not activated. Please activate your email to continue."
  );

  // Check if current page is login
  const isLoginPage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/change-password" ||
    pathname === "/reset-password" ||
    pathname === "/register" ||
    pathname === "/verify-mail";

  const { error: profileError } = useProfile({ enabled: isAuth && !isLoginPage });

  // Handle authentication redirects
  useEffect(() => {

    if (!isAuth && !isLoginPage) {
      router.push("/login");
      return;
    }
    // Nếu đã login mà đang ở trang login thì chuyển hướng đến /
    if (isAuth && isLoginPage && pathname !== "/verify-mail") {
      router.push("/");
    }
  }, [isAuth, isLoginPage, pathname, router]);

  useEffect(() => {
    if (!isAuth || isLoginPage || !profileError) return;

    const status = (profileError as any)?.response?.status || (profileError as any)?.statusCode;
    const message =
      (profileError as any)?.response?.data?.message ||
      (profileError as any)?.message ||
      "Email is not activated. Please activate your email to continue.";

    if (status === 403 && message?.toLowerCase().includes("email is not activated") && pathname !== "/verify-mail") {
      setEmailVerifyMessage(message);
      setShowEmailVerifyModal(true);
    }
  }, [isAuth, isLoginPage, pathname, profileError]);

  // Hiển thị loading cho đến khi hoàn thành việc check auth và cập nhật state
  // Điều này đảm bảo không có flash của content không đúng
  // if (!isAuthInitialized) {
  //   return (
  //     <div className="min-h-svh flex items-center justify-center bg-theme-white-100">
  //       <div className="flex flex-col items-center gap-4 relative">
  //         <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-pink-500 border-solid flex items-center justify-center absolute top-0 left-0 z-10"></div>
  //         <img src="/logo.png" alt="Loading" className="w-24 h-24" />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      {!isLoginPage && <Header />}
      {showEmailVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white px-8 py-6 shadow-2xl dark:bg-neutral-900 border border-theme-orange-100 dark:border-solid">
            <div className="mb-4 text-2xl uppercase font-orbitron font-semibold text-yellow-500">
              Cảnh báo
            </div>
            <p className="mb-6 text-base text-gray-700 dark:text-gray-300">{emailVerifyMessage}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.push("/verify-mail")}
                className="rounded-lg bg-pink-500 cursor-pointer px-4 py-2 border-none outline-none text-base font-semibold text-white hover:bg-pink-600"
              >
                Xác thực ngay
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 min-h-screen font-inter bg-theme-white-100 dark:bg-black">{children}</main>
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
      <ThemeProvider>
        <LangProvider>
          <ClientLayoutContent>{children}</ClientLayoutContent>
          <ThemeAwareToaster />
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
