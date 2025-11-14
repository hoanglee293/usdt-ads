'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserIcon, X, Mail, Phone, MessageCircle, Copy, CheckCircle, Calendar, User, Shield, Award, Clock } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { handleLogout } from '@/services/AuthService';
import { useRouter } from 'next/navigation';

const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { profile, loading, error } = useProfile();
  const { logout } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const onLogoutClick = async () => {
    await handleLogout();
    setIsOpen(false);
    logout();
  }

  if (loading) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-pink-100 transition-colors border-none"
        >
          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="text-center text-gray-500">Đang tải...</div>
          </div>
        )}
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-pink-100 transition-colors border-none"
        >
          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="text-center text-red-500">Không thể tải thông tin người dùng</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-pink-100 transition-colors border-none"
        aria-label="User menu"
      >
        <UserIcon className="w-5 h-4 sm:w-6 sm:h-5 text-pink-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* Content */}
          <div className="p-2 max-h-96 overflow-y-auto">
            {/* Email */}
            <div className="flex items-center gap-4 cursor-pointer hover:bg-theme-gray-100 p-2 rounded-lg" onClick={() => {router.push('/my-profile'); setIsOpen(false)}}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.display_name}
                  className="w-16 h-16 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-theme-gray-100">
                  <User className="w-8 h-8" />
                  
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-lg">{profile.display_name}</p>
                <p className="text-sm opacity-90 text-gray-500">{profile.email}</p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="p-2 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => onLogoutClick()}
              className="w-full py-2 px-4 bg-pink-500 text-white border-none rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;

