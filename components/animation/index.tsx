"use client";

export * from './FadeInView';
export * from './Parallax';
export * from './TextFX';

import { useRef, ReactNode } from 'react';
import { useGSAP } from '@/components/gsap-provider';
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect';

interface BatchFadeInProps {
  children: ReactNode;
  stagger?: number;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  threshold?: number;
  className?: string;
  disableOnMobile?: boolean;
}

/**
 * BatchFadeIn - Tối ưu hiệu năng bằng cách nhóm nhiều phần tử animation thành một nhóm
 * Sử dụng component này cho các danh sách dài có cùng hiệu ứng xuất hiện
 */
export function BatchFadeIn({
  children,
  stagger = 0.03,
  duration = 0.5,
  delay = 0,
  direction = 'up',
  distance = 30,
  threshold = 0.1,
  className = '',
  disableOnMobile = false,
}: BatchFadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { gsap } = useGSAP();
  
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return;
    
    const container = ref.current;
    const childElements = Array.from(container.children);
    
    if (!childElements.length) return;
    
    // Kiểm tra nếu đang trên thiết bị di động
    const isMobile = window.innerWidth < 768 && disableOnMobile;
    if (isMobile) {
      // Hiển thị ngay tất cả phần tử mà không có animation
      gsap.set(childElements, {
        opacity: 1,
        y: 0,
        x: 0,
      });
      return;
    }
    
    // Xác định giá trị ban đầu dựa trên hướng animation
    const xFrom = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
    const yFrom = direction === 'up' ? distance : direction === 'down' ? -distance : 0;
    
    // Thiết lập trạng thái ban đầu
    gsap.set(childElements, {
      opacity: 0,
      x: xFrom,
      y: yFrom,
    });
    
    // Tạo animation với ScrollTrigger
    const animation = gsap.to(childElements, {
      opacity: 1,
      x: 0,
      y: 0,
      duration: duration,
      delay: delay,
      stagger: stagger,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container,
        start: `top bottom-=${threshold * 100}%`,
        toggleActions: 'play none none none',
        fastScrollEnd: true,
        invalidateOnRefresh: false,
        once: true,
      },
    });
    
    return () => {
      if (animation) {
        animation.kill();
      }
      if (animation.scrollTrigger) {
        animation.scrollTrigger.kill(true);
      }
    };
  }, [gsap, stagger, duration, delay, direction, distance, threshold, disableOnMobile]);
  
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
} 