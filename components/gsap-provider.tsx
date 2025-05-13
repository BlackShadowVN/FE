"use client";

import { ReactNode, createContext, useContext } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect';

// Đăng ký plugin ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Tạo context
type GSAPContextValue = {
  gsap: typeof gsap;
};

const GSAPContext = createContext<GSAPContextValue | null>(null);

// Hook để sử dụng GSAP
export const useGSAP = () => {
  const context = useContext(GSAPContext);
  if (!context) {
    throw new Error('useGSAP phải được sử dụng trong GSAPProvider');
  }
  return context;
};

// Provider component
interface GSAPProviderProps {
  children: ReactNode;
}

export const GSAPProvider = ({ children }: GSAPProviderProps) => {
  // Thiết lập các cấu hình mặc định
  useIsomorphicLayoutEffect(() => {
    // Thiết lập các cấu hình mặc định cho GSAP để tối ưu hiệu suất
    gsap.config({
      nullTargetWarn: false,
      autoSleep: 60, // Giảm xuống để cải thiện hiệu suất
      force3D: "auto", // Để GSAP tự quyết định khi nào sử dụng 3D transforms
    });

    // Thiết lập tùy chọn mặc định cho gsap với batch để giảm reflows/repaints
    gsap.defaults({
      ease: "power2.out",
      overwrite: "auto", // Giúp tránh xung đột animation
      lazy: true, // Tối ưu hiệu suất render
    });

    // Thiết lập các tùy chọn mặc định cho ScrollTrigger
    ScrollTrigger.config({
      ignoreMobileResize: true, // Bỏ qua resize trên mobile để tránh flickering
      limitCallbacks: true, // Giới hạn callback để tối ưu hiệu suất
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load", // Giảm số lượng sự kiện refresh
    });
    
    // Tối ưu ScrollTrigger cho hiệu suất tốt hơn
    ScrollTrigger.defaults({
      markers: false,
      fastScrollEnd: true, // Cải thiện hiệu suất khi scroll nhanh
      preventOverlaps: true,
      toggleActions: "play none none reverse", // Mặc định xử lý tốt nhất cho hiệu suất
    });

    // Xử lý visibility change (khi user chuyển tab)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        // Đảm bảo tất cả ScrollTriggers được cập nhật khi tab hoạt động trở lại
        if (document.visibilityState === 'visible') {
          ScrollTrigger.refresh();
        } else {
          // Khi tab không hiển thị, tạm dừng các animation để tiết kiệm tài nguyên
          ScrollTrigger.getAll().forEach(trigger => {
            const animation = trigger.animation;
            if (animation && !animation.paused()) {
              animation.pause();
            }
          });
        }
      });
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <GSAPContext.Provider value={{ gsap }}>
      {children}
    </GSAPContext.Provider>
  );
}; 