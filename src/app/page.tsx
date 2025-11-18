'use client'

import React from 'react'
import Link from 'next/link'
import { Network, Box, Users, Smartphone } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen container mx-auto overflow-hidden bg-white">
      {/* Background Gradient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full "

        >
          <img src="/bg-main.png" alt="bg-main" className='w-full h-full object-contain' />
        </div>
        {/* <div
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(254, 100, 95, 0.2) 0%, rgba(255, 165, 0, 0.1) 50%, transparent 100%)'
          }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(255, 165, 0, 0.15) 0%, rgba(255, 182, 193, 0.1) 50%, transparent 100%)'
          }}
        ></div> */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20 md:py-48">
        {/* Top Section - Logo, Title, Subtitle, CTA */}
        <div className="flex flex-col items-center text-center mb-16 md:mb-32 max-w-4xl">
          {/* Logo */}
          <div className="mb-6 md:mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 relative">
              <img
                src="/logo.png"
                alt="USDA Logo"
                className="relative w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-gradient-secondary leading-tight overflow-visible">
            Kiếm tiền dễ dàng với USDA
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base lg:text-lg text-theme-black-100 mb-8 md:mb-10 font-medium max-w-2xl">
            Xem video quảng cáo – Nhận thưởng tự động – Minh bạch nhờ Blockchain
          </p>

          {/* CTA Button */}
          <Link href="/register">
            <button className="px-8 md:px-12 border-none outline-none py-2 md:py-3 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-indigo-500 text-white font-bold text-sm md:text-base lg:text-lg rounded-full hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-orbitron uppercase tracking-wide">
              THAM GIA NGAY
            </button>
          </Link>
        </div>

        {/* Central Section with Features */}
        <div className="relative w-full">
          {/* Features Grid - Arranged around center */}
          <div className="relative grid grid-cols-3 grid-rows-3 gap-6 md:gap-8 lg:gap-10">
            {/* Feature 1: Công nghệ - Top Right */}
            <div className="col-start-2 row-start-1 flex flex-col items-center gap-4 md:gap-6 ">
              <div className="flex-shrink-0 w-24 h-24 md:w-36 md:h-36  ">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src="/block-chain.png" alt="tech" className='w-24 h-24 md:w-36 md:h-36 object-contain' />
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#fe645f] to-[#c68afe] rounded-full px-6 py-2 text-white shadow-lg justify-start items-startmax-w-lg">
                <span className="font-bold text-sm md:text-base font-orbitron underline underline-offset-4">Công nghệ</span>
                <span className="text-sm md:text-base font-inter leading-relaxed">
                  : Ứng dụng AI theo dõi sở thích để hiển thị quảng cáo phù hợp.
                </span>
              </div>
            </div>

            {/* Feature 2: Blockchain - Middle Right */}
            <div className="col-start-1 row-start-2 flex flex-col items-center gap-4 md:gap-6">
              <div className="flex-shrink-0 w-24 h-24 md:w-36 md:h-36 ">
                <img src="/phone.png" alt="tech" className='w-24 h-24 md:w-36 md:h-36 object-contain' />
              </div>
              <div className="bg-gradient-to-br from-[#fe645f] to-[#c68afe] rounded-full px-6 py-2 text-white shadow-lg max-w-lg">
                <span className="font-bold text-sm md:text-base font-orbitron underline underline-offset-4">Thiết bị</span>
                <span className="text-sm md:text-base font-inter leading-relaxed">
                  : Mỗi người tham gia có thể điều khiển hàng trăm điện thoại xem quảng cáo cùng lúc.
                </span>

              </div>
            </div>

            <div className="text-center col-start-2 row-start-2 flex justify-center items-center w-full ">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gradient-secondary max-w-80">
                Giới thiệu USDA
              </h2>
            </div>

            {/* Feature 3: Cộng đồng - Bottom Center */}
            <div className="col-start-3 row-start-2 flex flex-col items-center gap-4 md:gap-6 justify-center">
              <div className="flex-shrink-0 w-24 h-24 md:w-36 md:h-36 ">
                <div className="relative">
                  <img src="/ai-block-chain.png" alt="tech" className='w-24 h-24 md:w-36 md:h-36 object-contain' />
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#fe645f] to-[#c68afe] rounded-full px-6 py-2 text-white shadow-lg max-w-lg">
                <span className="font-bold text-sm md:text-base font-orbitron underline underline-offset-4">Blockchain</span>
                <span className="text-sm md:text-base font-inter leading-relaxed">
                  : Ghi nhận lịch sử nhiệm vụ và thu nhập minh bạch.
                </span>
              </div>
            </div>

            {/* Feature 4: Thiết bị - Middle Left */}
            <div className="col-start-2 row-start-3 flex flex-col items-center gap-4 md:gap-6">
              <div className="flex-shrink-0 w-24 h-24 md:w-36 md:h-36 ">
                <img src="/socical.png" alt="tech" className='w-24 h-24 md:w-36 md:h-36 object-contain' />
              </div>
              <div className="bg-gradient-to-br from-[#fe645f] to-[#c68afe] rounded-full px-6 py-2 text-white shadow-lg max-w-lg">
                <span className="font-bold text-sm md:text-base font-orbitron underline underline-offset-4">Cộng đồng</span>
                <span className="text-sm md:text-base font-inter leading-relaxed">
                  : Mỗi người góp phần vào mạng lưới cùng phát triển thu nhập chung.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}