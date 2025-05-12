"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/cart-provider"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, CreditCard, Banknote, ShoppingBag } from "lucide-react"

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart()
  const { user, isAuthenticated, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    country: "Vietnam",
    paymentMethod: "cod",
    notes: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push("/login?redirect=/checkout")
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để tiếp tục thanh toán.",
        variant: "destructive",
      })
    }
  }, [isAuthenticated, user, router, toast])

  // Điền sẵn thông tin từ user nếu có
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullname || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.",
        variant: "destructive",
      })
      return
    }

    if (!isAuthenticated || !token) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để tiếp tục thanh toán.",
        variant: "destructive",
      })
      router.push("/login?redirect=/checkout")
      return
    }

    // Tạo địa chỉ giao hàng đầy đủ
    const shippingAddress = `${formData.address}, ${formData.city}, ${formData.province}, ${formData.country}`

    // Chuẩn bị dữ liệu đơn hàng theo cấu trúc API
    const orderData = {
      items: cart.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity
      })),
      shipping_address: shippingAddress,
      phone: formData.phone,
      payment_method: formData.paymentMethod,
      notes: formData.notes || ""
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("https://thanhbinhnguyen.id.vn/restful/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Đặt hàng thành công!",
          description: "Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được tiếp nhận.",
        })
        clearCart()
        
        // Chuyển hướng đến trang chi tiết đơn hàng nếu có id, nếu không thì đến trang danh sách đơn hàng
        if (data.data && data.data.id) {
          router.push(`/orders/${data.data.id}`)
        } else {
          router.push("/orders")
        }
      } else {
        toast({
          title: "Đặt hàng thất bại",
          description: data.message || "Đã có lỗi xảy ra khi đặt hàng",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Order creation error:", error)
      toast({
        title: "Đặt hàng thất bại",
        description: "Đã có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Đang chuyển hướng</h1>
          <p className="text-muted-foreground">Vui lòng đăng nhập để tiếp tục thanh toán.</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Giỏ hàng của bạn đang trống</h1>
          <p className="text-muted-foreground">Bạn cần thêm sản phẩm vào giỏ hàng trước khi tiến hành thanh toán.</p>
          <Button asChild>
            <Link href="/products">Xem sản phẩm</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link href="/cart" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Quay lại giỏ hàng
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Thông tin liên hệ</h2>

              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Địa chỉ giao hàng</h2>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Quận/Huyện</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Tỉnh/Thành phố</Label>
                  <Input id="province" name="province" value={formData.province} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Quốc gia</Label>
                  <Select value={formData.country} onValueChange={(value) => handleSelectChange("country", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quốc gia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vietnam">Việt Nam</SelectItem>
                      <SelectItem value="United States">Hoa Kỳ</SelectItem>
                      <SelectItem value="Other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Phương thức thanh toán</h2>

              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 rounded-md border p-3">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                    <Banknote className="h-5 w-5 text-muted-foreground" />
                    Thanh toán khi nhận hàng (COD)
                  </Label>
                </div>

                <div className="flex items-center space-x-3 rounded-md border p-3">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    Thanh toán qua thẻ
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú đơn hàng (Tùy chọn)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Yêu cầu đặc biệt khi giao hàng"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
            </Button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-muted rounded-lg p-6 space-y-4 sticky top-20">
            <h2 className="font-bold text-lg">Tóm tắt đơn hàng</h2>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={`${item.id}-${item.variantId}`} className="flex gap-3">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{item.name}</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {item.quantity} ×{" "}
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price)}
                      </span>
                      <span>
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                          item.price * item.quantity,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-bold">
              <span>Tổng cộng</span>
              <span>
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
