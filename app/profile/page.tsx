"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Avatar from 'react-avatar'

import { useAuth } from "@/components/auth-provider"
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
  XCircle
} from "lucide-react"

// Định nghĩa schema xác thực cho form cập nhật thông tin
const profileFormSchema = z.object({
  fullname: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  phone: z.string().optional(),
  address: z.string().optional(),
})

// Định nghĩa schema xác thực cho form đổi mật khẩu
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Mật khẩu hiện tại phải có ít nhất 6 ký tự" }),
  newPassword: z.string().min(6, { message: "Mật khẩu mới phải có ít nhất 6 ký tự" }),
  confirmPassword: z.string().min(6, { message: "Xác nhận mật khẩu phải có ít nhất 6 ký tự" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
})

// Interface cho đơn hàng
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

// Hàm chuyển đổi trạng thái đơn hàng sang tiếng Việt
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

// Lấy màu cho badge trạng thái
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
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // Khởi tạo form cập nhật thông tin
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullname: user?.fullname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    },
  })

  // Khởi tạo form đổi mật khẩu
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Cập nhật giá trị mặc định khi user thay đổi
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

  // Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  // Lấy danh sách đơn hàng
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !token) return

      try {
        setLoadingOrders(true)
        // Tạo URL với query params
        const url = new URL(`https://thanhbinhnguyen.id.vn/restful/orders`);
        url.searchParams.append('user_id', user.id.toString());
        url.searchParams.append('limit', '5'); // Chỉ lấy 5 đơn hàng gần nhất

        const response = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          cache: "no-store"
        })

        const data = await response.json()

        if (data.status === "success") {
          // Lấy dữ liệu phù hợp với cấu trúc API
          const orders = Array.isArray(data.data) ? data.data : (data.data?.orders || []);
          setOrders(orders)
        } else {
          console.error("Không thể tải đơn hàng", data.message)
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

  // Xử lý cập nhật thông tin
  const onUpdateProfile = async (data: z.infer<typeof profileFormSchema>) => {
    if (!user || !token) return

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
        // Cập nhật thông tin người dùng trong AuthProvider
        updateUserInfo(data.fullname, data.email, data.phone, data.address)
        
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin cá nhân của bạn đã được cập nhật",
        })
      } else {
        toast({
          title: "Cập nhật thất bại",
          description: result.message || "Đã xảy ra lỗi khi cập nhật thông tin",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update profile error:", error)
      toast({
        title: "Cập nhật thất bại",
        description: "Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý đổi mật khẩu
  const onChangePassword = async (data: z.infer<typeof passwordFormSchema>) => {
    if (!user || !token) return

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
          title: "Đổi mật khẩu thành công",
          description: "Mật khẩu của bạn đã được cập nhật",
        })
        passwordForm.reset()
      } else {
        toast({
          title: "Đổi mật khẩu thất bại",
          description: result.message || "Đã xảy ra lỗi khi đổi mật khẩu",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Change password error:", error)
      toast({
        title: "Đổi mật khẩu thất bại",
        description: "Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý đăng xuất và chuyển hướng về trang chủ
  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Xử lý hủy đơn hàng
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
        // Cập nhật trạng thái đơn hàng trong state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          )
        )

        toast({
          title: "Hủy đơn hàng thành công",
          description: "Đơn hàng của bạn đã được hủy",
        })
      } else {
        toast({
          title: "Hủy đơn hàng thất bại",
          description: data.message || "Không thể hủy đơn hàng này",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Cancel order error:", error)
      toast({
        title: "Hủy đơn hàng thất bại",
        description: "Đã xảy ra lỗi khi hủy đơn hàng. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return null // Sẽ chuyển hướng bởi useEffect
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Tài khoản của tôi</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div>
                  <Avatar 
                    name={user?.fullname}
                    size="80"
                    round={true}
                  />
                </div>
                <div className="text-center">
                  <h2 className="font-medium text-lg">{user?.fullname}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {user?.phone && (
                    <p className="text-sm text-muted-foreground mt-1">{user.phone}</p>
                  )}
                  {user?.role === "admin" && (
                    <Badge variant="default" className="mt-2 bg-[#000080] hover:bg-[#000080]/90">Admin</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button 
              variant={activeTab === "profile" ? "default" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab("profile")}
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Thông tin cá nhân</span>
              </div>
            </Button>
            <Button 
              variant={activeTab === "orders" ? "default" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab("orders")}
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Đơn hàng của tôi</span>
              </div>
            </Button>
            <Button 
              variant={activeTab === "security" ? "default" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab("security")}
            >
              <div className="flex items-center space-x-2">
                <KeyRound className="h-4 w-4" />
                <span>Đổi mật khẩu</span>
              </div>
            </Button>

            <Separator className="my-2" />

            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" 
              onClick={handleLogout}
            >
              <div className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {activeTab === "profile" && (
            <div>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <div className="mb-3">
                    <Avatar 
                      name={profileForm.watch('fullname') || user?.fullname}
                      size="100"
                      round={true}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground mb-6">
                    Avatar được tạo tự động từ tên của bạn
                  </div>
                </div>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="fullname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <Input placeholder="Nguyễn Văn A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="example@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="0901234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa chỉ</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Đường ABC, Quận XYZ, TP. HCM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <CardHeader>
                <CardTitle>Đơn hàng của tôi</CardTitle>
                <CardDescription>
                  Xem và quản lý các đơn hàng đã đặt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {loadingOrders ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Đang tải đơn hàng...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Bạn chưa có đơn hàng nào</h3>
                      <p className="text-muted-foreground mb-4">Hãy mua sắm để thấy đơn hàng ở đây</p>
                      <Button asChild>
                        <Link href="/products">
                          Bắt đầu mua sắm
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <Card key={order.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">Đơn hàng #{order.id}</CardTitle>
                                <CardDescription>
                                  Đặt ngày {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                </CardDescription>
                              </div>
                              <Badge variant={getStatusBadgeVariant(order.status)}>
                                {translateOrderStatus(order.status)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium mb-1">Địa chỉ giao hàng</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{order.shipping_address}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">Phương thức thanh toán</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán qua thẻ'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2 border-t bg-muted/50">
                            <div className="font-medium">
                              Tổng tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(order.total_amount?.toString() || order.total_price?.toString() || '0'))}
                            </div>
                            <div className="flex space-x-2">
                              {order.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
                                      cancelOrder(order.id)
                                    }
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Hủy
                                </Button>
                              )}
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => router.push(`/orders/${order.id}`)}
                              >
                                Chi tiết
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                      
                      {orders.length > 0 && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="outline"
                            onClick={() => router.push('/orders')}
                          >
                            Xem tất cả đơn hàng
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
                <CardDescription>
                  Đổi mật khẩu đăng nhập của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu hiện tại</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu mới</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
} 