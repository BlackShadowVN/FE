"use client"

import { useRef } from "react"
import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"
import { useGSAP } from "@/components/gsap-provider"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const { gsap } = useGSAP()

  useIsomorphicLayoutEffect(() => {
    if (!footerRef.current) return

    // Kiểm tra nếu đang trên thiết bị di động
    const isMobile = window.innerWidth < 768;
    
    // ScrollTrigger animation cho footer - giảm stagger và thời lượng trên mobile
    const sections = footerRef.current.querySelectorAll('.footer-section')
    
    gsap.fromTo(
      sections,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: isMobile ? 0.5 : 0.7,
        stagger: isMobile ? 0.05 : 0.08,
        ease: 'power2.out',
        clearProps: 'transform', // Giải phóng bộ nhớ sau khi animation hoàn thành
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top bottom-=100',
          toggleActions: 'play none none none',
          once: true, // Chỉ chạy một lần để tối ưu hiệu suất
          fastScrollEnd: true,
        }
      }
    )
    
    // Animation cho các link mạng xã hội - bỏ qua trên mobile
    if (!isMobile) {
      const socialLinks = footerRef.current.querySelectorAll('.social-link')
      
      gsap.fromTo(
        socialLinks,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.3,
          ease: 'back.out(1.7)',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top bottom-=100',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      )
    } else {
      // Trên mobile, chỉ hiển thị ngay các link mạng xã hội mà không có animation
      const socialLinks = footerRef.current.querySelectorAll('.social-link')
      gsap.set(socialLinks, { opacity: 1, scale: 1 });
    }
    
    // Animation cho copyright
    const copyright = footerRef.current.querySelector('.copyright')
    
    if (copyright) {
      gsap.fromTo(
        copyright,
        { opacity: 0 },
        {
          opacity: 1,
          duration: isMobile ? 0.6 : 0.8,
          delay: isMobile ? 0.5 : 0.8,
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top bottom-=100',
            toggleActions: 'play none none none',
            once: true,
          }
        }
      )
    }

    // Thêm underline animation cho các link với CSS
    const footerLinks = footerRef.current.querySelectorAll('.footer-link');
    
    // Thêm style cho underline animation vào document nếu chưa tồn tại
    if (document.head && !document.getElementById('footer-underline-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'footer-underline-style';
      styleEl.innerHTML = `
        .footer-link-underline {
          position: relative;
          overflow: hidden;
        }
        
        .footer-link-underline::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background-color: currentColor;
          opacity: 0.7;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        
        .footer-link-underline:hover::after {
          transform: scaleX(1);
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    // Tối ưu hiệu suất bằng cách sử dụng CSS thay vì JavaScript
    footerLinks.forEach(link => {
      if (link instanceof HTMLElement) {
        link.classList.add('footer-link-underline');
      }
    });
    
    // Chỉ áp dụng GSAP cho hover nếu không phải mobile
    if (!isMobile) {
      footerLinks.forEach(link => {
        if (link instanceof HTMLElement) {
          // Tìm underline element nếu đã được tạo từ trước
          let underline = link.querySelector('.link-underline');
          
          // Nếu chưa có, tạo mới
          if (!underline) {
            underline = document.createElement('span');
            underline.className = 'link-underline';
            (underline as HTMLElement).style.position = 'absolute';
            (underline as HTMLElement).style.bottom = '0';
            (underline as HTMLElement).style.left = '0';
            (underline as HTMLElement).style.width = '100%';
            (underline as HTMLElement).style.height = '1px';
            (underline as HTMLElement).style.backgroundColor = 'currentColor';
            (underline as HTMLElement).style.opacity = '0.7';
            (underline as HTMLElement).style.transformOrigin = 'left';
            (underline as HTMLElement).style.transform = 'scaleX(0)';
            
            if (!link.style.position) {
              link.style.position = 'relative';
            }
            link.appendChild(underline);
          }
          
          // Tối ưu hover animation
          link.addEventListener('mouseenter', () => {
            gsap.killTweensOf(underline); // Hủy animation hiện tại
            gsap.to(underline, {
              scaleX: 1,
              duration: 0.25,
              ease: 'power1.out'
            });
          });
          
          link.addEventListener('mouseleave', () => {
            gsap.killTweensOf(underline); // Hủy animation hiện tại
            gsap.to(underline, {
              scaleX: 0,
              duration: 0.25,
              ease: 'power1.in'
            });
          });
        }
      });
    }
  }, [gsap])

  return (
    <footer ref={footerRef} className="border-t bg-background print:hidden overflow-hidden">
      <div className="container px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4 footer-section">
            <h3 className="text-lg font-medium text-primary">E-Shop</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Cửa hàng trực tuyến với đầy đủ các sản phẩm. Sản phẩm chất lượng với giá cả phải chăng.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary social-link">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary social-link">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary social-link">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4 footer-section">
              <h3 className="text-sm font-medium">Mua sắm</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-primary footer-link">
                    Tất cả sản phẩm
                  </Link>
                </li>
                <li>
                  <Link href="/products?featured=true" className="text-muted-foreground hover:text-primary footer-link">
                    Sản phẩm nổi bật
                  </Link>
                </li>
                <li>
                  <Link href="/products?new=true" className="text-muted-foreground hover:text-primary footer-link">
                    Sản phẩm mới
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4 footer-section">
              <h3 className="text-sm font-medium">Tài khoản</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary footer-link">
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-primary footer-link">
                    Đăng ký
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="text-muted-foreground hover:text-primary footer-link">
                    Đơn hàng
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="space-y-4 footer-section">
            <h3 className="text-sm font-medium">Liên hệ</h3>
            <address className="not-italic text-sm text-muted-foreground">
              <p>123 Đường Chính</p>
              <p>Quận 1, TP.HCM</p>
              <p>Việt Nam</p>
            </address>
            <p className="text-sm text-muted-foreground">
              <a href="mailto:info@eshop.com" className="hover:text-primary footer-link">
                info@eshop.com
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              <a href="tel:+84123456789" className="hover:text-primary footer-link">
                +84 123 456 789
              </a>
            </p>
          </div>
        </div>
        <div className="mt-12 border-t pt-6">
          <p className="text-center text-xs text-muted-foreground copyright">
            &copy; {new Date().getFullYear()} E-Shop. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  )
}
