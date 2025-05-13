"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Avatar from 'react-avatar'

import { useAuth } from "@/components/auth-provider"
import { useGSAP } from "@/components/gsap-provider"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  KeyRound, 
  Mail, 
  UserRound, 
  ShieldCheck, 
  ShoppingBag, 
  LogOut,
  ChevronRight,
  RefreshCw,
  XCircle,
  Home,
  Bell,
  Settings,
  HelpCircle,
  Calendar
} from "lucide-react"

// Schema definition
const profileFormSchema = z.object({
  fullname: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Mật khẩu hiện tại phải có ít nhất 6 ký tự" }),
  newPassword: z.string().min(6, { message: "Mật khẩu mới phải có ít nhất 6 ký tự" }),
  confirmPassword: z.string().min(6, { message: "Xác nhận mật khẩu phải có ít nhất 6 ký tự" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
})

// Navigation menu item type
interface MenuItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

// Order interface
interface Order {
  id: number
  order_code: string
  user_id: number
  total_price: number | string
  total_amount: string | number
  status: string
  shipping_address: string
  payment_method: string
  created_at: string
  updated_at: string
}

// Helper functions
const translateOrderStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': 'Chờ xác nhận',
    'processing': 'Đang xử lý',
    'shipping': 'Đang giao hàng',
    'completed': 'Đã giao hàng',
    'cancelled': 'Đã hủy'
  }
  return statusMap[status] || status
}

const getStatusBadgeVariant = (status: string) => {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'pending': 'outline',
    'processing': 'secondary',
    'shipping': 'secondary',
    'completed': 'default',
    'cancelled': 'destructive'
  }
  return variantMap[status] || "outline"
}

export default function ProfilePage() {
  const { user, isAuthenticated, token, updateUserInfo, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { gsap } = useGSAP()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // Refs for animation
  const profileHeaderRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const profileFormRef = useRef<HTMLFormElement>(null)
  const passwordFormRef = useRef<HTMLFormElement>(null)
  const ordersListRef = useRef<HTMLDivElement>(null)
  const submitBtnRef = useRef<HTMLButtonElement>(null)

  // Navigation menu
  const menuItems: MenuItem[] = [
    {
      label: "Thông tin cá nhân",
      value: "profile",
      icon: <UserRound className="h-4 w-4" />,
      description: "Cập nhật thông tin cá nhân của bạn"
    },
    {
      label: "Bảo mật",
      value: "password",
      icon: <KeyRound className="h-4 w-4" />,
      description: "Cập nhật mật khẩu để bảo vệ tài khoản"
    },
    {
      label: "Đơn hàng",
      value: "orders",
      icon: <ShoppingBag className="h-4 w-4" />,
      description: "Xem và quản lý đơn hàng của bạn"
    }
  ]

  // Animations for UI components
  useIsomorphicLayoutEffect(() => {
    if (!isAuthenticated) return;
    
    // Kiểm tra nếu đang trên thiết bị di động để tối ưu hiệu suất
    const isMobile = window.innerWidth < 768;
    
    // Giảm stagger và duration trên mobile để tối ưu hiệu suất
    const staggerTime = isMobile ? 0.03 : 0.05;
    const animDuration = isMobile ? 0.3 : 0.4;
    
    // Timeline for animations
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: {
          ease: "power2.out",
          duration: animDuration,
          clearProps: "transform" // Giải phóng bộ nhớ sau khi animation hoàn thành
        }
      });
      
      // Header animation
      if (profileHeaderRef.current) {
        tl.fromTo(
          profileHeaderRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1 }
        );
      }
      
      // Sidebar animation
      if (sidebarRef.current) {
        const menuItems = sidebarRef.current.querySelectorAll('.menu-item');
        tl.fromTo(
          menuItems,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, stagger: staggerTime },
          "-=0.2"
        );
      }
      
      // Content animation
      if (contentRef.current) {
        tl.fromTo(
          contentRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0 },
          "-=0.2"
        );
      }
    });
    
    // Cleanup function
    return () => ctx.revert();
  }, [isAuthenticated, gsap]);

  // Animate tab content when active tab changes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Tạo context GSAP để theo dõi và hủy tất cả animations khi unmount
    const ctx = gsap.context(() => {
      // Kiểm tra nếu đang trên thiết bị di động để tối ưu hiệu suất
      const isMobile = window.innerWidth < 768;
      const duration = isMobile ? 0.3 : 0.4;
      const staggerTime = isMobile ? 0.03 : 0.07;
      
      // Đặt timeout để đảm bảo DOM đã cập nhật trước khi chạy animation
      setTimeout(() => {
        animateTabContent();
        
        // Animation cho button
        if (submitBtnRef.current) {
          gsap.fromTo(
            submitBtnRef.current,
            { scale: 0.95, opacity: 0 },
            { 
              scale: 1, 
              opacity: 1, 
              duration: duration, 
              ease: "back.out(1.7)",
              clearProps: "transform" // Giải phóng bộ nhớ sau khi animation hoàn thành
            }
          );
        }
      }, 50);
    });
    
    // Cleanup function
    return () => ctx.revert();
  }, [activeTab, isAuthenticated, gsap]);

  // Function to handle tab animation
  const animateTabContent = () => {
    // Kiểm tra nếu đang trên thiết bị di động để tối ưu hiệu suất
    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 0.3 : 0.4;
    const staggerTime = isMobile ? 0.03 : 0.07;
    
    if (activeTab === 'profile' && profileFormRef.current) {
      const formElements = profileFormRef.current.querySelectorAll('.animate-item');
      gsap.fromTo(
        formElements,
        { x: -30, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: duration, 
          stagger: staggerTime,
          ease: "power2.out",
          clearProps: "transform" 
        }
      );
    } else if (activeTab === 'password' && passwordFormRef.current) {
      const formElements = passwordFormRef.current.querySelectorAll('.animate-item');
      gsap.fromTo(
        formElements,
        { x: -30, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: duration, 
          stagger: staggerTime,
          ease: "power2.out",
          clearProps: "transform"
        }
      );
    } else if (activeTab === 'orders' && ordersListRef.current) {
      const orderItems = ordersListRef.current.querySelectorAll('.order-item');
      gsap.fromTo(
        orderItems,
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: duration, 
          stagger: staggerTime,
          ease: "power2.out",
          clearProps: "transform" 
        }
      );
    }
  };

  // Form initialization
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullname: user?.fullname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Update default values when user changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullname: user.fullname,
        email: user.email,
        phone: user?.phone || "",
        address: user?.address || "",
      })
    }
  }, [user, profileForm])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  // Get order list
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !token) return

      try {
        setLoadingOrders(true)
        // Create URL with query params
        const url = new URL(`https://thanhbinhnguyen.id.vn/restful/orders`);
        url.searchParams.append('user_id', user.id.toString());
        url.searchParams.append('limit', '8'); // Hiển thị 8 đơn hàng gần nhất
        url.searchParams.append('order_by', 'created_at'); // Sắp xếp theo thời gian tạo
        url.searchParams.append('sort', 'desc'); // Sắp xếp giảm dần (mới nhất trước)

        const response = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          cache: "no-store"
        })

        const data = await response.json()

        if (data.status === "success") {
          // Get data that matches API structure
          const orders = Array.isArray(data.data) ? data.data : (data.data?.orders || []);
          setOrders(orders)
        } else {
          console.error("Cannot load orders", data.message)
        }
      } catch (error) {
        console.error("Fetch orders error:", error)
      } finally {
        setLoadingOrders(false)
      }
    }

    if (isAuthenticated && activeTab === "orders") {
      fetchOrders()
    }
  }, [user, token, isAuthenticated, activeTab])

  // Handle profile update
  const onUpdateProfile = async (data: z.infer<typeof profileFormSchema>) => {
    if (!user || !token) return

    // Add animation for submit button
    if (submitBtnRef.current) {
      gsap.to(submitBtnRef.current, {
        scale: 0.95,
        duration: 0.1,
        onComplete: () => {
          gsap.to(submitBtnRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.3)"
          })
        }
      })
    }

    setIsLoading(true)

    try {
      const response = await fetch(`https://thanhbinhnguyen.id.vn/restful/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullname: data.fullname,
          email: data.email,
          phone: data.phone,
          address: data.address
        }),
      })

      const result = await response.json()

      if (result.status === "success") {
        // Update user info in AuthProvider
        updateUserInfo(data.fullname, data.email, data.phone, data.address)
        
        toast({
          title: "Update successful",
          description: "Your personal information has been updated",
        })
      } else {
        toast({
          title: "Update failed",
          description: result.message || "An error occurred while updating information",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update profile error:", error)
      toast({
        title: "Update failed",
        description: "An error occurred while updating information. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password change
  const onChangePassword = async (data: z.infer<typeof passwordFormSchema>) => {
    if (!user || !token) return

    // If confirm password does not match
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Error",
        description: "Confirm password does not match new password",
        variant: "destructive",
      })
      return
    }

    // Add animation for form when submit
    if (passwordFormRef.current) {
      gsap.to(passwordFormRef.current, {
        scale: 0.99,
        duration: 0.1,
        onComplete: () => {
          gsap.to(passwordFormRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          })
        }
      })
    }

    setIsLoading(true)

    try {
      const response = await fetch("https://thanhbinhnguyen.id.vn/restful/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          current_password: data.currentPassword,
          new_password: data.newPassword
        }),
      })

      const result = await response.json()

      if (result.status === "success") {
        toast({
          title: "Password changed successfully",
          description: "Your password has been updated",
        })
        passwordForm.reset()
      } else {
        toast({
          title: "Password change failed",
          description: result.message || "An error occurred while changing password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Change password error:", error)
      toast({
        title: "Password change failed",
        description: "An error occurred while changing password. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle logout and redirect to home page
  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Handle order cancellation
  const cancelOrder = async (orderId: number) => {
    if (!user || !token) return

    try {
      const response = await fetch(`https://thanhbinhnguyen.id.vn/restful/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "cancelled"
        })
      })

      const data = await response.json()

      if (data.status === "success") {
        // Update order status in state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          )
        )

        toast({
          title: "Order cancellation successful",
          description: "Your order has been cancelled",
        })
      } else {
        toast({
          title: "Order cancellation failed",
          description: data.message || "Cannot cancel this order",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Cancel order error:", error)
      toast({
        title: "Order cancellation failed",
        description: "An error occurred while cancelling order. Please try again later.",
        variant: "destructive",
      })
    }
  }

  // Function to handle tab animation
  const animateTab = (tab: string) => {
    setActiveTab(tab);
    
    // Use setTimeout to wait for UI to render before running animation
    setTimeout(() => {
      animateTabContent();
    }, 50);
  }

  if (!isAuthenticated) {
    return null // Will redirect by useEffect
  }

  return (
    <div className="container py-8">
      {/* Page header */}
      <div ref={profileHeaderRef} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tài khoản của bạn</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin cá nhân, bảo mật và đơn hàng của bạn
        </p>
        <Separator className="mt-6" />
      </div>

      {/* Main content with sidebar layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="md:col-span-1">
          <div ref={sidebarRef} className="space-y-1 sticky top-6">
            {menuItems.map((item) => (
              <Button
                key={item.value}
                variant={activeTab === item.value ? "default" : "ghost"}
                className={`w-full justify-start text-left mb-1 menu-item ${
                  activeTab === item.value ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => animateTab(item.value)}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Button>
            ))}
            <Separator className="my-4" />
            <Button 
              variant="ghost" 
              className="w-full justify-start text-left text-destructive hover:text-destructive hover:bg-destructive/10 menu-item"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* Right content */}
        <div ref={contentRef} className="md:col-span-3">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form ref={profileFormRef} onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                    <div className="animate-item flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
                      <Avatar 
                        name={user?.fullname || "User"}
                        size="80" 
                        round={true} 
                        className="border" 
                      />
                      <div>
                        <h3 className="text-lg font-medium">{user?.fullname}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">{user?.username}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="fullname"
                        render={({ field }) => (
                          <FormItem className="animate-item">
                            <FormLabel>Họ và tên</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nhập họ và tên của bạn"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="animate-item">
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="name@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="animate-item">
                            <FormLabel>Số điện thoại</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nhập số điện thoại của bạn"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="animate-item">
                            <FormLabel>Địa chỉ</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nhập địa chỉ của bạn"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="animate-item">
                      <Button ref={submitBtnRef} type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Đang cập nhật
                          </>
                        ) : (
                          "Cập nhật thông tin"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "password" && (
            <Card>
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
                <CardDescription>
                  Cập nhật mật khẩu mới để bảo vệ tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form ref={passwordFormRef} onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem className="animate-item">
                          <FormLabel>Mật khẩu hiện tại</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem className="animate-item">
                            <FormLabel>Mật khẩu mới</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                            <FormDescription>
                              Mật khẩu phải có ít nhất 6 ký tự
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="animate-item">
                            <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="animate-item">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý
                          </>
                        ) : (
                          "Đổi mật khẩu"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "orders" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Đơn hàng của bạn</CardTitle>
                  <CardDescription>
                    Xem và quản lý các đơn hàng của bạn
                  </CardDescription>
                </div>
                <Button variant="outline" asChild size="sm">
                  <Link href="/orders" className="flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Xem tất cả
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="py-8 flex justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Bạn chưa có đơn hàng nào</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Hãy mua sắm để tạo đơn hàng đầu tiên
                    </p>
                    <Button asChild>
                      <Link href="/products">Mua sắm ngay</Link>
                    </Button>
                  </div>
                ) : (
                  <div ref={ordersListRef} className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 order-item hover:shadow-md transition-shadow">
                        <div className="flex flex-col space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getStatusBadgeVariant(order.status)}>
                                  {translateOrderStatus(order.status)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <p className="font-medium">Đơn hàng #{order.id}</p>
                              <p className="text-sm text-muted-foreground">Mã đơn: {order.order_code}</p>
                            </div>
                            <div className="font-medium text-right">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                                Number(order.total_price || order.total_amount || 0)
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="font-medium mb-1">Địa chỉ giao hàng</p>
                              <p className="text-muted-foreground">{order.shipping_address}</p>
                            </div>
                            <div>
                              <p className="font-medium mb-1">Phương thức thanh toán</p>
                              <p className="text-muted-foreground">
                                {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán qua thẻ'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-end gap-3 pt-2">
                            {order.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
                                    cancelOrder(order.id)
                                  }
                                }}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Hủy đơn
                              </Button>
                            )}
                            <Button asChild size="sm">
                              <Link href={`/orders/${order.id}`}>
                                Chi tiết
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 