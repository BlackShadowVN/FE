"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { 
  User, 
  ShoppingBag, 
  PackageCheck, 
  Clock, 
  ArrowLeft, 
  RefreshCw,
  XCircle,
  Truck,
  ReceiptText,
  FileText
} from "lucide-react"

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  variant_id: number
  quantity: number
  price: number
  product_name: string
  variant_name: string
  product_image?: string
}

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
  items?: OrderItem[]
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

export default function OrderDetailPage() {
  // Sử dụng useParams() thay vì use(params)
  const params = useParams();
  const orderId = params?.id as string || "";
  
  const { user, isAuthenticated, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  // Lấy chi tiết đơn hàng
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!user || !token || !orderId) return

      try {
        const response = await fetch(`https://thanhbinhnguyen.id.vn/restful/orders/${orderId}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          cache: "no-store"
        })

        const data = await response.json()

        if (data.status === "success") {
          setOrder(data.data)
        } else {
          toast({
            title: "Không thể tải thông tin đơn hàng",
            description: data.message || "Đã xảy ra lỗi khi tải thông tin đơn hàng",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Fetch order detail error:", error)
        toast({
          title: "Không thể tải thông tin đơn hàng",
          description: "Đã xảy ra lỗi khi tải thông tin đơn hàng. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchOrderDetail()
    }
  }, [user, token, isAuthenticated, orderId, toast])

  // Hủy đơn hàng
  const cancelOrder = async () => {
    if (!user || !token || !order) return

    try {
      const response = await fetch(`https://thanhbinhnguyen.id.vn/restful/orders/${order.id}`, {
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
        setOrder({...order, status: 'cancelled'})

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
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => router.push("/orders")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold">Chi tiết đơn hàng</h1>
      </div>
      
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Đang tải thông tin đơn hàng...</p>
          </div>
        ) : !order ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy đơn hàng</h3>
              <p className="text-muted-foreground mb-4">Đơn hàng này không tồn tại hoặc bạn không có quyền xem</p>
              <Button asChild>
                <Link href="/orders">
                  Quay lại danh sách đơn hàng
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Thông tin chung về đơn hàng */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Đơn hàng #{order.id}</CardTitle>
                    <CardDescription>
                      Đặt ngày {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {translateOrderStatus(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Thông tin giao hàng
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Địa chỉ giao hàng:</span> {order.shipping_address}</p>
                      <p><span className="text-muted-foreground">Trạng thái:</span> {translateOrderStatus(order.status)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <ReceiptText className="h-4 w-4 mr-2" />
                      Thông tin thanh toán
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Phương thức thanh toán:</span> {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán qua thẻ'}</p>
                      <p><span className="text-muted-foreground">Tổng tiền:</span> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(order.total_amount?.toString() || order.total_price?.toString() || '0'))}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium mb-4 flex items-center">
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Sản phẩm trong đơn hàng
                  </h3>

                  {order.items && order.items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Phiên bản</TableHead>
                          <TableHead className="text-center">Số lượng</TableHead>
                          <TableHead className="text-right">Đơn giá</TableHead>
                          <TableHead className="text-right">Thành tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {item.product_image && (
                                  <div className="mr-2 h-10 w-10 overflow-hidden rounded-md">
                                    <Image
                                      src={item.product_image}
                                      alt={item.product_name}
                                      width={40}
                                      height={40}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <span>{item.product_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{item.variant_name || "Mặc định"}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</TableCell>
                            <TableCell className="text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Không có thông tin chi tiết về sản phẩm</p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="font-medium text-lg">
                    Tổng cộng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(order.total_amount?.toString() || order.total_price?.toString() || '0'))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/invoice/${order.id}`)}
                      disabled={order.status === 'cancelled'}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Xem hóa đơn
                    </Button>
                    
                    {order.status === 'pending' && (
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
                            cancelOrder()
                          }
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Hủy đơn hàng
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lịch sử đơn hàng - có thể thêm nếu API hỗ trợ */}
          </>
        )}
      </div>
    </div>
  )
} 