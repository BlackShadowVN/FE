"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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
  RefreshCw
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
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        // Tạo URL với query params
        const url = new URL(`https://thanhbinhnguyen.id.vn/restful/orders`);
        url.searchParams.append('user_id', user.id.toString());
        url.searchParams.append('limit', '50');

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

  if (!isAuthenticated) {
    return null // Sẽ chuyển hướng bởi useEffect
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Đơn hàng của tôi</h1>
        <Button variant="outline" onClick={() => router.push("/profile")}>
          <User className="mr-2 h-4 w-4" />
          Quay lại trang cá nhân
        </Button>
      </div>
      
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
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
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
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Hủy đơn
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
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