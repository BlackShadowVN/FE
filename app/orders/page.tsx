"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { useAuth } from "@/components/auth-provider"
import { useGSAP } from "@/components/gsap-provider"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { 
  User, 
  KeyRound, 
  ShoppingBag, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft
} from "lucide-react"

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

export default function OrdersPage() {
  const { user, isAuthenticated, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { gsap } = useGSAP()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Refs for animation
  const headerRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const ordersListRef = useRef<HTMLDivElement>(null)

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
      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1 }
        );
      }
      
      // Filter animation
      if (filterRef.current) {
        tl.fromTo(
          filterRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1 },
          "-=0.2"
        );
      }
      
      // Orders list animation
      if (!isLoading && ordersListRef.current) {
        const orderItems = ordersListRef.current.querySelectorAll('.order-item');
        tl.fromTo(
          orderItems,
          { y: 20, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            stagger: staggerTime,
            clearProps: "transform"
          },
          "-=0.2"
        );
      }
    });
    
    // Cleanup function
    return () => ctx.revert();
  }, [isAuthenticated, isLoading, gsap]);

  // Animate when filter changes
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const ctx = gsap.context(() => {
      if (ordersListRef.current) {
        const orderItems = ordersListRef.current.querySelectorAll('.order-item');
        
        // Kiểm tra nếu đang trên thiết bị di động để tối ưu hiệu suất
        const isMobile = window.innerWidth < 768;
        const staggerTime = isMobile ? 0.02 : 0.04;
        const animDuration = isMobile ? 0.25 : 0.35;
        
        gsap.fromTo(
          orderItems,
          { y: 10, opacity: 0.6 },
          { 
            y: 0, 
            opacity: 1, 
            duration: animDuration,
            stagger: staggerTime,
            ease: "power2.out",
            clearProps: "transform"
          }
        );
      }
    });
    
    return () => ctx.revert();
  }, [activeFilter, searchTerm, orders, isAuthenticated, isLoading, gsap]);

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
        setIsLoading(true)
        // Tạo URL với query params
        const url = new URL(`https://thanhbinhnguyen.id.vn/restful/orders`);
        url.searchParams.append('user_id', user.id.toString());
        url.searchParams.append('limit', '50');
        url.searchParams.append('order_by', 'created_at');
        url.searchParams.append('sort', 'desc');

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
          toast({
            title: "Không thể tải đơn hàng",
            description: data.message || "Đã xảy ra lỗi khi tải danh sách đơn hàng",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Fetch orders error:", error)
        toast({
          title: "Không thể tải đơn hàng",
          description: "Đã xảy ra lỗi khi tải danh sách đơn hàng. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchOrders()
    }
  }, [user, token, isAuthenticated, toast])

  // Hủy đơn hàng
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

  // Lọc đơn hàng
  const getFilteredOrders = () => {
    // Đầu tiên, lọc theo trạng thái
    let filteredOrders = orders;
    if (activeFilter !== "all") {
      filteredOrders = orders.filter(order => order.status === activeFilter);
    }
    
    // Sau đó, lọc theo từ khóa tìm kiếm
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.order_code.toLowerCase().includes(searchLower) ||
        order.shipping_address.toLowerCase().includes(searchLower) ||
        order.id.toString().includes(searchLower)
      );
    }
    
    return filteredOrders;
  }

  if (!isAuthenticated) {
    return null // Sẽ chuyển hướng bởi useEffect
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="container py-8">
      {/* Page header */}
      <div ref={headerRef} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Đơn hàng của bạn</h1>
            <p className="text-muted-foreground">
              Xem và quản lý tất cả đơn hàng của bạn
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/profile")} className="mt-3 sm:mt-0 self-start sm:self-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại trang cá nhân
          </Button>
        </div>
        <Separator className="my-4" />
      </div>
      
      {/* Filter and Search */}
      <div ref={filterRef} className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Tìm kiếm đơn hàng..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className="flex-1 sm:flex-none"
            >
              Tất cả
            </Button>
            <Button 
              variant={activeFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("pending")}
              className="flex-1 sm:flex-none"
            >
              Đang chờ
            </Button>
            <Button 
              variant={activeFilter === "processing" || activeFilter === "shipping" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("processing")}
              className="flex-1 sm:flex-none"
            >
              Đang xử lý
            </Button>
            <Button 
              variant={activeFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("completed")}
              className="flex-1 sm:flex-none"
            >
              Hoàn thành
            </Button>
          </div>
        </div>
      </div>
      
      {/* Orders list */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Bạn chưa có đơn hàng nào</h3>
              <p className="text-muted-foreground mb-4">Hãy mua sắm để thấy đơn hàng ở đây</p>
              <Button asChild>
                <Link href="/products">
                  Bắt đầu mua sắm
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy đơn hàng</h3>
              <p className="text-muted-foreground mb-4">Không có đơn hàng nào phù hợp với bộ lọc hiện tại</p>
              <Button variant="outline" onClick={() => {setActiveFilter("all"); setSearchTerm("")}}>
                Xóa bộ lọc
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div ref={ordersListRef} className="space-y-4">
            {filteredOrders.map(order => (
              <Card key={order.id} className="order-item hover:shadow-sm transition-shadow">
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
                      <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Phương thức thanh toán</p>
                      <p className="text-sm text-muted-foreground">
                        {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán qua thẻ'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
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
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Hủy đơn
                      </Button>
                    )}
                    <Button size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        Chi tiết
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 