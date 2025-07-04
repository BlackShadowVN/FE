"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useGSAP } from "@/components/gsap-provider"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"

interface Banner {
  id: string
  title: string
  image: string
  link: string
  order: string
  status: string
  created_at: string
  updated_at: string
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { gsap } = useGSAP();
  
  // Kiểm tra nếu đang ở thiết bị di động
  const isMobile = useRef(false);
  useEffect(() => {
    isMobile.current = window.innerWidth < 768;
  }, []);
  
  // Auto scroll every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const startAutoScroll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        const newIndex = (activeIndex + 1) % banners.length;
        setActiveIndex(newIndex);
        
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            left: newIndex * scrollRef.current.offsetWidth,
            behavior: 'smooth'
          });
        }
      }, 5000);
    };
    
    const stopAutoScroll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    // Chỉ bắt đầu auto scroll sau khi trang đã tải xong
    if (isInitialized) {
      startAutoScroll();
    }
    
    // Pause auto scroll when user interacts with the carousel
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseenter', stopAutoScroll);
      container.addEventListener('mouseleave', startAutoScroll);
      
      // Clean up
      return () => {
        stopAutoScroll();
        container.removeEventListener('mouseenter', stopAutoScroll);
        container.removeEventListener('mouseleave', startAutoScroll);
      };
    }
    
    return () => {
      stopAutoScroll();
    };
  }, [activeIndex, banners.length, isInitialized]);
  
  // GSAP animations for banner text content - tối ưu hiệu suất
  useIsomorphicLayoutEffect(() => {
    if (banners.length <= 0) return;
    setIsInitialized(true);
    
    // Bỏ qua animation phức tạp trên thiết bị di động
    if (isMobile.current) {
      // Chỉ đặt tất cả các phần tử về trạng thái hiển thị ngay lập tức
      banners.forEach((_, index) => {
        const textContent = textRefs.current[index];
        if (textContent) {
          gsap.set([
            textContent.querySelector('.banner-badge'),
            textContent.querySelector('.banner-title'),
            textContent.querySelector('.banner-date')
          ], {
            opacity: 1,
            y: 0
          });
        }
      });
      return;
    }
    
    // Animate text content for current banner with performance optimization
    const textContent = textRefs.current[activeIndex];
    if (textContent) {
      // Reset opacity and position for animation
      gsap.set([
        textContent.querySelector('.banner-badge'),
        textContent.querySelector('.banner-title'),
        textContent.querySelector('.banner-date')
      ], { 
        opacity: 0, 
        y: 20,
        overwrite: true // Tránh xung đột animation
      });
      
      // Create animation timeline - sử dụng single timeline thay vì nhiều animation
      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out",
          overwrite: true, // Tránh xung đột animation
        }
      });
      
      tl.to(textContent.querySelector('.banner-badge'), {
        opacity: 1,
        y: 0,
        duration: 0.4, // Giảm thời gian
      })
      .to(textContent.querySelector('.banner-title'), {
        opacity: 1,
        y: 0,
        duration: 0.5, // Giảm thời gian
      }, "-=0.2") // Giảm overlap
      .to(textContent.querySelector('.banner-date'), {
        opacity: 1,
        y: 0,
        duration: 0.4, // Giảm thời gian
      }, "-=0.3"); // Giảm overlap
    }
  }, [activeIndex, banners.length, gsap]);

  // Scroll to the next slide
  const nextSlide = () => {
    if (banners.length <= 1) return;
    
    const newIndex = (activeIndex + 1) % banners.length;
    setActiveIndex(newIndex);
    
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: newIndex * scrollRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };
  
  // Scroll to the previous slide
  const prevSlide = () => {
    if (banners.length <= 1) return;
    
    const newIndex = (activeIndex - 1 + banners.length) % banners.length;
    setActiveIndex(newIndex);
    
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: newIndex * scrollRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };
  
  // Handle scroll event to update active index - thêm throttle để tránh quá nhiều lần gọi
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    // Không cập nhật nếu đang scroll bởi code
    if (scrollRef.current.scrollLeft % scrollRef.current.offsetWidth !== 0) return;
    
    const scrollPosition = scrollRef.current.scrollLeft;
    const slideWidth = scrollRef.current.offsetWidth;
    const newIndex = Math.round(scrollPosition / slideWidth);
    
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < banners.length) {
      setActiveIndex(newIndex);
    }
  };

  if (!banners.length) {
    return (
      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Không có banner</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden group" ref={containerRef}>
      {/* Hiển thị tất cả banner */}
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide" 
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {banners.map((banner, index) => (
          <Link 
            key={banner.id} 
            href={banner.link || "#"} 
            className="flex-none w-full h-full snap-center"
          >
            <div className="relative h-full w-full">
              <Image
                src={banner.image || "/placeholder.svg"}
                alt={banner.title || "Banner"}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 flex flex-col justify-end">
                <div 
                  className="p-6 md:p-8 lg:p-10 text-white"
                  ref={(el) => { textRefs.current[index] = el; }}
                >
                  <div className="max-w-3xl">
                    <div className="bg-primary/80 inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 banner-badge">
                      Banner #{index + 1}
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-md banner-title">
                      {banner.title}
                    </h2>
                    <p className="text-sm md:text-base opacity-90 drop-shadow-md banner-date">
                      Cập nhật: {new Date(banner.updated_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Chỉ số banner */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {banners.map((banner, index) => (
          <button
            key={`dot-${banner.id}`} 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? 'bg-white scale-125' : 'bg-white/50'
            }`}
            onClick={() => {
              setActiveIndex(index);
              if (scrollRef.current) {
                scrollRef.current.scrollTo({
                  left: index * scrollRef.current.offsetWidth,
                  behavior: 'smooth'
                });
              }
            }}
            aria-label={`Hiển thị banner ${index + 1}: ${banner.title}`}
          />
        ))}
      </div>
      
      {/* Nút điều hướng */}
      {banners.length > 1 && (
        <>
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-black/50 transition-all"
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            aria-label="Banner trước đó"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-black/50 transition-all"
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            aria-label="Banner tiếp theo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  )
}