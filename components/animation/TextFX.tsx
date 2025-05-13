"use client"

import { useRef, ElementType, ReactNode } from 'react'
import { useGSAP } from '@/components/gsap-provider'
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect'

interface TextFXProps {
  children: ReactNode
  as?: ElementType
  effect?: 'chars' | 'words' | 'lines'
  stagger?: number
  duration?: number
  delay?: number
  className?: string
  inView?: boolean
  disableOnMobile?: boolean
}

export function TextFX({
  children,
  as: Component = 'div',
  effect = 'chars',
  stagger = 0.03,
  duration = 0.5,
  delay = 0,
  className = '',
  inView = true,
  disableOnMobile = false,
}: TextFXProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { gsap } = useGSAP()
  
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return
    
    const element = ref.current

    // Kiểm tra nếu đang trên thiết bị di động
    const isMobile = window.innerWidth < 768 && disableOnMobile;
    if (isMobile) {
      // Hiển thị ngay tất cả phần tử mà không có animation
      gsap.set(element.children, {
        opacity: 1,
        y: 0,
      });
      return;
    }
    
    // Lấy từng phần tử con dựa vào loại hiệu ứng
    let elements: Element[] = []
    
    // Tối ưu: Chỉ thực hiện split một lần và lưu kết quả
    if (effect === 'chars') {
      // Chỉ tạo split chars nếu chưa được tạo
      if (!element.querySelector('span')) {
        // Tạo span cho từng ký tự
        const text = element.innerText
        element.innerHTML = ''
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i]
          const span = document.createElement('span')
          span.style.display = 'inline-block'
          span.innerText = char === ' ' ? '\u00A0' : char // Thay khoảng trắng bằng non-breaking space
          element.appendChild(span)
        }
      }
      
      elements = Array.from(element.children)
    } else if (effect === 'words') {
      // Chỉ tạo split words nếu chưa được tạo
      if (!element.querySelector('span')) {
        // Tạo span cho từng từ
        const text = element.innerText
        element.innerHTML = ''
        
        const words = text.split(' ')
        for (let i = 0; i < words.length; i++) {
          const span = document.createElement('span')
          span.style.display = 'inline-block'
          span.innerText = words[i]
          element.appendChild(span)
          
          if (i < words.length - 1) {
            element.appendChild(document.createTextNode(' '))
          }
        }
      }
      
      elements = Array.from(element.children).filter(el => el.nodeType === 1) // Chỉ lấy element node
    } else if (effect === 'lines') {
      // Sử dụng thẻ div đã có
      elements = Array.from(element.children)
    }
    
    // Thiết lập trạng thái ban đầu
    gsap.set(elements, { 
      opacity: 0,
      y: 20,
    })
    
    // Animation với các tùy chọn tối ưu hiệu suất
    const animation = gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration,
      delay,
      stagger,
      ease: 'power3.out',
      scrollTrigger: inView ? {
        trigger: element,
        start: 'top bottom-=10%',
        toggleActions: 'play none none none',
        once: true, // Chỉ chạy một lần sau khi hiện 
        fastScrollEnd: true,
        invalidateOnRefresh: false,
      } : undefined,
    })
    
    return () => {
      if (animation) {
        animation.kill();
      }
      if (animation.scrollTrigger) {
        animation.scrollTrigger.kill(true);
      }
    }
  }, [gsap, effect, stagger, duration, delay, inView, disableOnMobile])
  
  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  )
} 