"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/components/cart-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleQuantityChange = (id: number, newQuantity: number, variantId?: number) => {
    if (newQuantity < 1) return
    setIsUpdating(true)
    updateQuantity(id, newQuantity, variantId)
    setTimeout(() => setIsUpdating(false), 500)
  }

  const handleCheckout = () => {
    router.push("/checkout")
  }

  if (cart.length === 0) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="bg-muted rounded-full p-6">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Giỏ hàng của bạn đang trống</h1>
          <p className="text-muted-foreground">Có vẻ như bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng.</p>
          <Button asChild>
            <Link href="/products">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Giỏ hàng</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="hidden md:grid grid-cols-12 gap-4 py-2 font-medium">
            <div className="col-span-6">Sản phẩm</div>
            <div className="col-span-2 text-center">Giá</div>
            <div className="col-span-2 text-center">Số lượng</div>
            <div className="col-span-2 text-right">Tổng</div>
          </div>

          <Separator />

          {cart.map((item) => (
            <div key={`${item.id}-${item.variantId || 0}`} className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="col-span-6 flex gap-4 items-center">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div>
                    <Link href={`/products/${item.id}`} className="font-medium hover:text-primary">
                      {item.name}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground p-0 h-auto mt-1"
                      onClick={() => removeFromCart(item.id, item.variantId)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>

                <div className="col-span-2 text-center">
                  <div className="md:hidden text-sm text-muted-foreground mb-1">Giá</div>
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price)}
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <div className="md:hidden text-sm text-muted-foreground mb-1">Số lượng</div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.variantId)}
                      disabled={item.quantity <= 1 || isUpdating}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.id, Number.parseInt(e.target.value) || 1, item.variantId)
                      }
                      className="w-12 h-8 mx-1 text-center"
                      disabled={isUpdating}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.variantId)}
                      disabled={isUpdating}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  <div className="md:hidden text-sm text-muted-foreground mb-1">Tổng</div>
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    item.price * item.quantity,
                  )}
                </div>
              </div>
              <Separator className="mt-4" />
            </div>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => clearCart()}>
              Xóa giỏ hàng
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-muted rounded-lg p-6 space-y-4">
            <h2 className="font-bold text-lg">Tóm tắt đơn hàng</h2>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalPrice)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleCheckout}>
              Thanh toán <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
