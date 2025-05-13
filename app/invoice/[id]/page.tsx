"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { 
  User, 
  ShoppingBag, 
  PackageCheck, 
  ArrowLeft, 
  RefreshCw,
  Printer,
  Building,
  Phone
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
  user_info?: {
    name: string
    email: string
    phone?: string
  }
}

// Lấy trạng thái đơn hàng bằng tiếng Việt
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

export default function InvoicePage() {
  const params = useParams();
  const orderId = params?.id as string || "";
  
  const { user, isAuthenticated, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

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
          // Thêm thông tin người dùng vào đơn hàng
          const orderWithUserInfo = {
            ...data.data,
            user_info: {
              name: user.fullname || 'Khách hàng',
              email: user.email,
              phone: user.phone || 'Chưa cập nhật'
            }
          }
          setOrder(orderWithUserInfo)
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

  // Hàm in hóa đơn
  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 300)
  }

  if (!isAuthenticated) {
    return null // Sẽ chuyển hướng bởi useEffect
  }

  return (
    <>
      {/* Header và nút in - ẩn khi in */}
      <div className={`container py-6 print:hidden ${isPrinting ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="outline" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <h1 className="text-3xl font-bold">Hóa đơn</h1>
          </div>
          <Button onClick={handlePrint} disabled={order?.status === 'cancelled'}>
            <Printer className="mr-2 h-4 w-4" />
            In hóa đơn
          </Button>
        </div>
      </div>
      
      {/* Nội dung hóa đơn */}
      <div 
        ref={invoiceRef} 
        className={`container py-6 ${isPrinting ? 'bg-white text-black' : ''} print:py-0`}
      >
        <div className="space-y-8 max-w-4xl mx-auto bg-white text-black dark:text-black p-8 rounded-lg shadow-sm print:shadow-none">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-black">
              <RefreshCw className="h-10 w-10 animate-spin text-gray-500 mb-4" />
              <p className="text-gray-500">Đang tải thông tin hóa đơn...</p>
            </div>
          ) : !order ? (
            <Card className="text-black">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Không tìm thấy đơn hàng</h3>
                <p className="text-gray-500 mb-4">Đơn hàng này không tồn tại hoặc bạn không có quyền xem</p>
                <Button asChild className="print:hidden">
                  <Link href="/orders">
                    Quay lại danh sách đơn hàng
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tiêu đề hóa đơn */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">HÓA ĐƠN BÁN HÀNG</h1>
                <p className="text-muted-foreground print:text-gray-600">Mã đơn hàng: #{order.id}</p>
                <p className="text-muted-foreground print:text-gray-600">Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                {order.status === 'cancelled' && (
                  <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md border border-red-200 dark:border-red-800">
                    Đơn hàng này đã bị hủy
                  </div>
                )}
              </div>

              {/* Thông tin người bán */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Thông tin người bán
                </h2>
                <div className="space-y-1 ml-7">
                  <p className="font-medium">Shadow Company</p>
                  <p>Địa chỉ: 123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh</p>
                  <p>Số điện thoại: (028) 1234 5678</p>
                  <p>Email: contact@shadowcompany.com</p>
                  <p>Mã số thuế: 0123456789</p>
                </div>
              </div>

              {/* Thông tin người mua */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Thông tin người mua
                </h2>
                <div className="space-y-1 ml-7">
                  <p className="font-medium">{order.user_info?.name}</p>
                  <p>Địa chỉ: {order.shipping_address}</p>
                  <p>Email: {order.user_info?.email}</p>
                  <p>Số điện thoại: {order.user_info?.phone}</p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Thông tin đơn hàng */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <PackageCheck className="mr-2 h-5 w-5" />
                  Chi tiết đơn hàng
                </h2>

                {order.items && order.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">STT</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Phiên bản</TableHead>
                        <TableHead className="text-center">Số lượng</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>{item.variant_name || "Mặc định"}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</TableCell>
                          <TableCell className="text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4 print:text-gray-700">Không có thông tin chi tiết về sản phẩm</p>
                )}
              </div>

              <div className="mt-8">
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex justify-between w-72">
                    <span className="font-medium">Tổng tiền hàng:</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(order.total_amount?.toString() || order.total_price?.toString() || '0'))}</span>
                  </div>
                  <div className="flex justify-between w-72">
                    <span className="font-medium">Phí vận chuyển:</span>
                    <span>0 ₫</span>
                  </div>
                  <div className="flex justify-between w-72">
                    <span className="font-medium">Giảm giá:</span>
                    <span>0 ₫</span>
                  </div>
                  <Separator className="my-2 w-72" />
                  <div className="flex justify-between w-72 text-lg font-bold">
                    <span>Tổng thanh toán:</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(order.total_amount?.toString() || order.total_price?.toString() || '0'))}</span>
                  </div>
                  <div className="flex justify-between w-72 text-sm text-muted-foreground print:text-gray-600">
                    <span>Phương thức thanh toán:</span>
                    <span>{order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán qua thẻ'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="font-semibold mb-20">Người mua hàng</p>
                  <p>(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-semibold mb-20">Người bán hàng</p>
                  <p>(Ký, đóng dấu)</p>
                </div>
              </div>

              <div className="mt-16 text-center text-sm text-muted-foreground print:text-gray-600">
                <p>Cảm ơn quý khách đã mua hàng tại Shadow Company!</p>
                <p>Hotline hỗ trợ: (028) 1234 5678 - Email: support@shadowcompany.com</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
} 