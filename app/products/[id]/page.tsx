import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import ProductDetailView from "@/components/product-detail-view"
import { ArrowLeft } from "lucide-react"

// Update to use the new API endpoint for product details
async function getProduct(id: string) {
  try {
    // Use the new API endpoint that provides detailed product information
    const res = await fetch(`https://thanhbinhnguyen.id.vn/restful/products/${id}`, {
      // Lấy dữ liệu mới khi reload nhưng vẫn cache nếu page không reload
      cache: "no-store",
      next: { revalidate: 3600 }, // Vẫn tự động cập nhật sau 1 giờ
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      console.error("Failed to fetch product:", res.status, res.statusText)
      return null
    }

    const text = await res.text()

    try {
      const data = JSON.parse(text)
      return data.status === "success" ? data.data : null
    } catch (parseError) {
      console.error("Error parsing product JSON:", parseError, "Response text:", text.substring(0, 100))
      return null
    }
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

// Get related products by category
async function getRelatedProducts(categoryId: string, currentProductId: string) {
  try {
    const res = await fetch(`https://thanhbinhnguyen.id.vn/restful/products?page=1&limit=9999`, {
      // Lấy dữ liệu mới khi reload nhưng vẫn cache nếu page không reload
      cache: "no-store",
      next: { revalidate: 3600 }, // Vẫn tự động cập nhật sau 1 giờ
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      console.error("Failed to fetch related products:", res.status, res.statusText)
      return []
    }

    const text = await res.text()

    try {
      const data = JSON.parse(text)

      if (data.status === "success") {
        return data.data.products
          .filter(
            (p: any) => p.category_id.toString() === categoryId.toString() && p.id.toString() !== currentProductId,
          )
          .slice(0, 4)
      }

      return []
    } catch (parseError) {
      console.error("Error parsing related products JSON:", parseError, "Response text:", text.substring(0, 100))
      return []
    }
  } catch (error) {
    console.error("Error fetching related products:", error)
    return []
  }
}

function ProductSkeleton() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

function RelatedProductsSkeleton() {
  return (
    <div className="container py-8 space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-40 rounded-t-lg" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function RelatedProducts({ products }: { products: any[] }) {
  if (!products.length) {
    return null
  }

  return (
    <div className="container py-8 space-y-6">
      <h2 className="text-2xl font-bold">Sản phẩm liên quan</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="h-full">
            <div className="relative h-40 w-full">
              <Image
                src={product.main_image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium line-clamp-1">{product.name}</h3>
              <p className="text-primary font-bold mt-1">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                  Number.parseFloat(product.base_price),
                )}
              </p>
              <Button variant="outline" className="w-full mt-3" asChild>
                <Link href={`/products/${product.id}`}>Xem chi tiết</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetailsLoader id={params.id} />
      </Suspense>

      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProductsLoader id={params.id} />
      </Suspense>
    </>
  )
}

async function ProductDetailsLoader({ id }: { id: string }) {
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link href="/products" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách sản phẩm
        </Link>
      </div>

      <ProductDetailView product={product} />
    </div>
  )
}

async function RelatedProductsLoader({ id }: { id: string }) {
  const product = await getProduct(id)

  if (!product) {
    return null
  }

  const relatedProducts = await getRelatedProducts(product.category_id, id)
  return <RelatedProducts products={relatedProducts} />
}
