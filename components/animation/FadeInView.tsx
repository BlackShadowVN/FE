"use client"

import { useRef, ReactNode, useEffect } from 'react'
import { useGSAP } from '@/components/gsap-provider'
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect'

interface FadeInViewProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  threshold?: number
  className?: string
  disableOnMobile?: boolean
  batch?: boolean 
}

export function FadeInView({
  children,
  delay = 0,
  duration = 0.8,
  direction = 'up',
  distance = 50,
  threshold = 0.1,
  className = '',
  disableOnMobile = false,
  batch = false,
}: FadeInViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { gsap } = useGSAP()
  
  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return
    
    const isMobile = window.innerWidth < 768 && disableOnMobile;
    if (isMobile) {
      gsap.set(ref.current, {
        opacity: 1,
        x: 0,
        y: 0,
      });
      return;
    }
    
    const xFrom = direction === 'left' ? -distance : direction === 'right' ? distance : 0
    const yFrom = direction === 'up' ? distance : direction === 'down' ? -distance : 0
    
    gsap.set(ref.current, {
      opacity: 0,
      x: xFrom,
      y: yFrom,
    })
    
    const animation = gsap.to(ref.current, {
      opacity: 1,
      x: 0,
      y: 0,
      duration: duration,
      delay: delay,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: `top bottom-=${threshold * 100}%`,
        toggleActions: 'play none none none',
        fastScrollEnd: true,
        invalidateOnRefresh: false,
        once: true,
      },
    })
    
    return () => {
      if (animation) {
        animation.kill();
      }
      if (animation.scrollTrigger) {
        animation.scrollTrigger.kill(true);
      }
    }
  }, [gsap, delay, duration, direction, distance, threshold, disableOnMobile])
  
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
} 