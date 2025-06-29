"use client"

import type React from "react"

import { useState, useEffect, Suspense, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { Eye, EyeOff } from "lucide-react"
import { useGSAP } from "@/components/gsap-provider"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"

// Component dùng useSearchParams bọc trong Suspense
function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullname: "",
    email: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, isAuthenticated } = useAuth()
  const { gsap } = useGSAP()

  const formRef = useRef<HTMLFormElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Animation cho form
  useIsomorphicLayoutEffect(() => {
    if (!formRef.current) return
    
    const formElements = formRef.current.querySelectorAll('.form-element')
    
    // Animate form elements
    gsap.fromTo(
      formElements,
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.5, 
        stagger: 0.1, 
        ease: "power2.out"
      }
    )
  }, [gsap])

  // Lấy callbackUrl từ query parameters (nếu có)
  const callbackUrl = searchParams?.get('callbackUrl') || '/profile'

  // Nếu đã đăng nhập, chuyển hướng đến trang chủ
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl)
    }
  }, [isAuthenticated, router, callbackUrl])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      // Animation khi mật khẩu không khớp
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { x: 0 },
          { 
            x: [-10, 10, -10, 10, 0] as any, 
            duration: 0.5, 
            ease: "power2.inOut" 
          }
        )
      }
      alert("Mật khẩu không khớp. Vui lòng kiểm tra lại.")
      return
    }

    setIsLoading(true)

    // Animation cho button khi submit
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        onComplete: () => {
          gsap.to(buttonRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.3)"
          })
        }
      })
    }

    try {
      const success = await register(formData.username, formData.password, formData.fullname, formData.email)
      if (success) {
        // Animation phải kết thúc trước khi chuyển trang
        if (formRef.current) {
          gsap.to(formRef.current, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => {
              router.push("/login?registered=true")
            }
          })
        } else {
          router.push("/login?registered=true")
        }
      } else {
        // Animation khi đăng ký thất bại
        if (formRef.current) {
          gsap.fromTo(
            formRef.current,
            { x: 0 },
            { 
              x: [-10, 10, -10, 10, 0] as any, 
              duration: 0.5, 
              ease: "power2.inOut" 
            }
          )
        }
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Register error:", error)
      // Animation khi đăng ký thất bại
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { x: 0 },
          { 
            x: [-10, 10, -10, 10, 0] as any, 
            duration: 0.5, 
            ease: "power2.inOut" 
          }
        )
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2 form-element">
            <Label htmlFor="fullname">Họ tên</Label>
            <Input
              id="fullname"
              name="fullname"
              placeholder="Nhập họ tên của bạn"
              type="text"
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect="off"
              value={formData.fullname}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="grid gap-2 form-element">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid gap-2 form-element">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              name="username"
              placeholder="Tạo tên đăng nhập"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="grid gap-2 form-element">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                placeholder="Tạo mật khẩu"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</span>
              </Button>
            </div>
          </div>
          
          <div className="grid gap-2 form-element">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <Button ref={buttonRef} type="submit" disabled={isLoading} className="form-element">
            {isLoading ? "Đang xử lý..." : "Đăng ký tài khoản"}
          </Button>
        </div>
      </form>
      <div className="relative form-element">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
        </div>
      </div>
      <div className="text-center text-sm form-element">
        Đã có tài khoản?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
          Đăng nhập
        </Link>
      </div>
    </div>
  )
}

// Loading UI
function RegisterLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid gap-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
            <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
          </div>
        ))}
        <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
      </div>
    </div>
  )
}

// Trang chính
export default function RegisterPage() {
  const { gsap } = useGSAP()
  const leftSideRef = useRef<HTMLDivElement>(null)
  const rightSideRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  // Animation cho header và layout
  useIsomorphicLayoutEffect(() => {
    // Animation cho phần bên trái
    if (leftSideRef.current) {
      gsap.fromTo(
        leftSideRef.current,
        { x: -100, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: "power3.out" 
        }
      )
    }
    
    // Animation cho phần bên phải
    if (rightSideRef.current) {
      gsap.fromTo(
        rightSideRef.current,
        { x: 100, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: "power3.out" 
        }
      )
    }
    
    // Animation cho tiêu đề và phụ đề
    if (headerRef.current && subtitleRef.current) {
      const tl = gsap.timeline()
      
      tl.fromTo(
        headerRef.current,
        { y: -20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          ease: "back.out(1.7)" 
        }
      ).fromTo(
        subtitleRef.current,
        { y: -10, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          ease: "power2.out" 
        },
        "-=0.3" // Bắt đầu trước khi animation trước đó kết thúc 0.3s
      )
    }
  }, [gsap])

  return (
    <div className="container relative min-h-[calc(100vh-4rem)] flex-col items-center justify-center grid lg:grid-cols-2 lg:px-0">
      <div ref={leftSideRef} className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          E-Shop
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Nền tảng mua sắm trực tuyến đáng tin cậy với sản phẩm đa dạng và dịch vụ chất lượng.&rdquo;
            </p>
            <footer className="text-sm">E-Shop Team</footer>
          </blockquote>
        </div>
      </div>
      <div ref={rightSideRef} className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 ref={headerRef} className="text-2xl font-semibold tracking-tight">Tạo tài khoản mới</h1>
            <p ref={subtitleRef} className="text-sm text-muted-foreground">Nhập thông tin đăng ký của bạn dưới đây</p>
          </div>

          <Suspense fallback={<RegisterLoading />}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
