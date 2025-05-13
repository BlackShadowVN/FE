"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useCart } from "@/components/cart-provider"
import { useAuth } from "@/components/auth-provider"
import { useGSAP } from "@/components/gsap-provider"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Moon, Sun, ShoppingCart, Menu, Search, User, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

// Style cho underline animation
const underlineStyle = `
  .nav-link-underline {
    position: relative;
    overflow: hidden;
  }
  
  .nav-link-underline::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: currentColor;
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.3s ease;
  }
  
  .nav-link-underline:hover::after,
  .nav-link-underline.active::after {
    transform: scaleX(1);
    transform-origin: left;
  }
`;

interface Category {
  id: string
  name: string
  description: string
  total_products: string
}

interface HeaderProps {
  categories?: Category[]
}

export default function Header({ categories = [] }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { cart } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isHidden, setIsHidden] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const { gsap } = useGSAP()
  const [mounted, setMounted] = useState(false)

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)

  // Mounted state để tránh lỗi hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // GSAP animation cho header
  useIsomorphicLayoutEffect(() => {
    if (!headerRef.current) return

    // Thêm style cho underline animation vào document
    if (document.head && !document.getElementById('underline-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'underline-style';
      styleEl.innerHTML = underlineStyle;
      document.head.appendChild(styleEl);
    }

    // Kiểm tra nếu đang trên thiết bị di động - giảm animation để tối ưu hiệu suất
    const isMobile = window.innerWidth < 768;
    
    // Animation ban đầu với thời gian ngắn hơn để tối ưu hiệu suất
    gsap.fromTo(
      headerRef.current, 
      { 
        y: -100,
        opacity: 0,
      },
      { 
        y: 0,
        opacity: 1,
        duration: isMobile ? 0.4 : 0.5,
        ease: 'power2.out',
        clearProps: 'transform', // Giải phóng bộ nhớ sau khi animation hoàn thành
      }
    )

    // Logo animation - giảm độ phức tạp trên mobile
    const logo = headerRef.current.querySelector('.logo')
    if (logo) {
      gsap.fromTo(
        logo,
        { scale: 0.8, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: isMobile ? 0.5 : 0.7, 
          delay: isMobile ? 0.1 : 0.2, 
          ease: isMobile ? 'power2.out' : 'elastic.out(1, 0.75)',
          clearProps: 'transform', 
        }
      )
    }

    // Menu item animations - giảm stagger và độ trễ trên mobile
    const menuItems = headerRef.current.querySelectorAll('.menu-item')
    if (menuItems.length) {
      gsap.fromTo(
        menuItems,
        { y: -20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: isMobile ? 0.3 : 0.4, 
          stagger: isMobile ? 0.05 : 0.08, 
          delay: isMobile ? 0.2 : 0.3, 
          ease: 'power2.out',
          clearProps: 'transform',
        }
      )
    }

    // Tạo underline animation cho các nav link với phương pháp tối ưu
    const navLinks = headerRef.current.querySelectorAll('.nav-link');
    
    // Tối ưu hiệu suất bằng cách sử dụng batch
    if (!isMobile) {
      // Tạo một timeline cho tất cả hover effect
      const linkHoverTimeline = gsap.timeline({ paused: true });
      
      navLinks.forEach(link => {
        // Sử dụng CSS class thay vì tạo element mới
        if (link instanceof HTMLElement) {
          // Thêm class để xử lý với CSS thay vì JS
          link.classList.add('nav-link-underline');
          
          // Chỉ áp dụng GSAP cho hover nếu cần hiệu ứng phức tạp hơn
          const underline = link.querySelector('.link-underline');
          if (!underline) return;
          
          // Tối ưu bằng cách sử dụng biến thay vì tạo mới gsap.to mỗi lần hover
          link.addEventListener('mouseenter', () => {
            gsap.killTweensOf(underline);
            gsap.to(underline, {
              scaleX: 1,
              duration: 0.25,
              ease: 'power1.out'
            });
          });
          
          link.addEventListener('mouseleave', () => {
            gsap.killTweensOf(underline);
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

  // Scroll handler để ẩn/hiện header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const show = currentScrollY < lastScrollY || currentScrollY < 100
      
      if (show !== !isHidden) {
        setIsHidden(!show)
        
        if (headerRef.current) {
          gsap.to(headerRef.current, {
            y: show ? 0 : -100,
            duration: 0.3,
            ease: 'power2.inOut',
          })
        }
      }
      
      setLastScrollY(currentScrollY)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, isHidden, gsap])

  // Xác định biểu tượng theme hiện tại
  const ThemeIcon = () => {
    if (!mounted) return <div className="h-5 w-5" />;
    
    return theme === "dark" ? (
      <Sun className="h-5 w-5" />
    ) : (
      <Moon className="h-5 w-5" />
    );
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden transition-transform duration-300">
      <div className="container flex h-16 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Mở menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetTitle className="sr-only">Menu chính</SheetTitle>
            <nav className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                E-Shop
              </Link>
              <Link href="/" className="text-sm font-medium transition-colors hover:text-primary nav-link-underline">
                Trang chủ
              </Link>
              <Link href="/products" className="text-sm font-medium transition-colors hover:text-primary nav-link-underline">
                Tất cả sản phẩm
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="text-sm font-medium transition-colors hover:text-primary nav-link-underline"
                >
                  {category.name}
                </Link>
              ))}
              <Link href="/cart" className="text-sm font-medium transition-colors hover:text-primary nav-link-underline">
                Giỏ hàng
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="logo mr-6 hidden md:flex items-center gap-2 font-bold text-xl text-primary">
          E-Shop
        </Link>

        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} menu-item nav-link`}>Trang chủ</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="menu-item nav-link">Sản phẩm</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/products"
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/50 to-primary p-6 no-underline outline-none focus:shadow-md"
                        >
                          <div className="mt-4 mb-2 text-lg font-medium text-white">Tất cả sản phẩm</div>
                          <p className="text-sm leading-tight text-white/90">
                            Khám phá bộ sưu tập đầy đủ các sản phẩm của chúng tôi
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    {categories.slice(0, 5).map((category) => (
                      <li key={category.id}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={`/products?category=${category.id}`}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{category.name}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {category.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/cart" legacyBehavior passHref>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} menu-item nav-link`}>Giỏ hàng</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <form
            className="hidden md:flex items-center w-full max-w-sm menu-item"
            onSubmit={(e) => {
              e.preventDefault()
              window.location.href = `/products?search=${searchQuery}`
            }}
          >
            <Input
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" variant="ghost" size="icon">
              <Search className="h-5 w-5" />
              <span className="sr-only">Tìm kiếm</span>
            </Button>
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="menu-item">
                <User className="h-5 w-5" />
                <span className="sr-only">Menu người dùng</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem className="font-medium">{user?.fullname}</DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/profile" className="w-full nav-link-underline">
                      Tài khoản của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/orders" className="w-full nav-link-underline">
                      Đơn hàng của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem>
                    <Link href="/login" className="w-full nav-link-underline">
                      Đăng nhập
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/register" className="w-full nav-link-underline">
                      Đăng ký
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
            className="menu-item"
          >
            <ThemeIcon />
            <span className="sr-only">Thay đổi giao diện</span>
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative menu-item">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Giỏ hàng</span>
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center -translate-y-1/2 translate-x-1/2">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
