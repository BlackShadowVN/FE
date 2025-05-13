"use client"

import { useRef, ReactNode } from 'react'
import { useGSAP } from '@/components/gsap-provider'
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect'

interface ParallaxProps {
  children: ReactNode
  speed?: number
  className?: string
  disableOnMobile?: boolean
}

export function Parallax({
  children,
  speed = 0.5,
  className = '',
  disableOnMobile = true,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { gsap } = useGSAP()

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) return

    const isMobile = window.innerWidth < 768 && disableOnMobile;
    if (isMobile) return;

    const element = ref.current
    
    const animation = gsap.to(element, {
      y: () => {
        const screenMultiplier = window.innerWidth < 1024 ? 0.7 : 1;
        return window.innerHeight * speed * -1 * screenMultiplier;
      },
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.5,
        invalidateOnRefresh: false,
        fastScrollEnd: true,
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
  }, [gsap, speed, disableOnMobile])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
} 