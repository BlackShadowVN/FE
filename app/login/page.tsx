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
function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated } = useAuth()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const success = await login(username, password)
      if (success) {
        // Animation phải kết thúc trước khi chuyển trang
        if (formRef.current) {
          gsap.to(formRef.current, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => {
              router.push(callbackUrl)
            }
          })
        } else {
          router.push(callbackUrl)
        }
      } else {
        // Animation khi đăng nhập thất bại
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
      console.error("Login error:", error)
      // Animation khi đăng nhập thất bại
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
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              placeholder="Nhập tên đăng nhập"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2 form-element">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="Nhập mật khẩu"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
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
          <Button ref={buttonRef} type="submit" disabled={isLoading} className="form-element">
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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
        Chưa có tài khoản?{" "}
        <Link href="/register" className="underline underline-offset-4 hover:text-primary">
          Đăng ký
        </Link>
      </div>
    </div>
  )
}

// Loading UI
function LoginLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid gap-2">
          <div className="h-4 w-20 bg-muted rounded animate-pulse mb-1"></div>
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
      </div>
    </div>
  )
}

// Trang chính
export default function LoginPage() {
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
            <h1 ref={headerRef} className="text-2xl font-semibold tracking-tight">Đăng nhập vào tài khoản</h1>
            <p ref={subtitleRef} className="text-sm text-muted-foreground">Nhập thông tin đăng nhập của bạn dưới đây</p>
          </div>

          <Suspense fallback={<LoginLoading />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
