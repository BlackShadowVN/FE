"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/components/cart-provider"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ProductVariant {
  id: number
  product_id: number
  name: string
  price: string
  stock: number
  images: string[]
}

interface ProductImage {
  image_path: string
}

interface Product {
  id: number
  name: string
  description: string
  base_price: string
  category_id: number
  category_name: string
  variants: ProductVariant[]
  images: ProductImage[]
}

export default function ProductDetailView({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null,
  )

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { addToCart } = useCart()
  const { toast } = useToast()

  // Combine product images and variant images for the gallery
  const allImages = [...(product.images?.map((img) => img.image_path) || []), ...(selectedVariant?.images || [])]

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  const handleAddToCart = () => {
    const itemToAdd = {
      id: product.id,
      name: product.name + (selectedVariant ? ` - ${selectedVariant.name}` : ""),
      price: Number.parseFloat(selectedVariant?.price || product.base_price),
      image: allImages[0] || "/placeholder.svg",
      quantity: 1,
      variantId: selectedVariant?.id || 0,
    }

    addToCart(itemToAdd)

    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${itemToAdd.name} đã được thêm vào giỏ hàng của bạn.`,
    })
  }

  const price = selectedVariant ? selectedVariant.price : product.base_price
  const formattedPrice = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number.parseFloat(price),
  )

  const isInStock = selectedVariant ? selectedVariant.stock > 0 : true

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        <div className="relative aspect-square rounded-lg overflow-hidden border">
          {allImages.length > 0 ? (
            <>
              <Image
                src={allImages[currentImageIndex] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />

              {allImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 rounded-full"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 rounded-full"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </>
          ) : (
            <Image src="/placeholder.svg" alt={product.name} fill className="object-cover" priority />
          )}
        </div>

        {/* Thumbnail Gallery */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {allImages.map((image, index) => (
              <button
                key={index}
                className={`relative aspect-square rounded-md overflow-hidden border ${
                  index === currentImageIndex ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} - thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Danh mục: {product.category_name}</p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-primary">{formattedPrice}</p>
          {isInStock ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Còn hàng {selectedVariant && `(${selectedVariant.stock} sản phẩm)`}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              Hết hàng
            </Badge>
          )}
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Phiên bản</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {product.variants.map((variant) => (
                <Button
                  key={variant.id}
                  variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setSelectedVariant(variant)}
                  disabled={variant.stock <= 0}
                >
                  <div className="flex flex-col items-start">
                    <span>{variant.name}</span>
                    <span className="text-sm">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        Number.parseFloat(variant.price),
                      )}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="description" className="flex-1">
              Mô tả
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-1">
              Chi tiết
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            <div className="prose prose-sm dark:prose-invert">
              <p>{product.description}</p>
            </div>
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Mã sản phẩm</div>
              <div>{product.id}</div>
              <div className="font-medium">Danh mục</div>
              <div>{product.category_name}</div>
              {selectedVariant && (
                <>
                  <div className="font-medium">Phiên bản</div>
                  <div>{selectedVariant.name}</div>
                  <div className="font-medium">Số lượng</div>
                  <div>{selectedVariant.stock} sản phẩm</div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleAddToCart} className="w-full" size="lg" disabled={!isInStock}>
          {isInStock ? "Thêm vào giỏ hàng" : "Hết hàng"}
        </Button>
      </div>
    </div>
  )
}
