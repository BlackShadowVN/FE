import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight } from "lucide-react"
import { BannerCarousel } from "./components/BannerCarousel"
import { FadeInView, TextFX, BatchFadeIn } from "@/components/animation"

// Fallback data for when the API fails
const FALLBACK_CATEGORIES = [
  {
    id: "14",
    name: "Aether Tools",
    description: "Công cụ Aether sẽ nâng cấp vũ khí bạn đang cầm",
    total_products: "4",
  },
  {
    id: "15",
    name: "Aetherium",
    description: "Tinh thể Aetherium thô sẽ giúp vũ khí hiện tại của bạn lên Cấp độ I/II/III",
    total_products: "2",
  },
  {
    id: "17",
    name: "Ammo Mods",
    description:
      "Ammo Mods nhìn chung khá đơn giản, nhưng lưu ý chính là bạn chỉ có thể trang bị một Ammo Mods trên một vũ khí tại một thời điểm.",
    total_products: "5",
  },
  {
    id: "19",
    name: "Classified Schematics",
    description:
      "Classified Schematics là sơ đồ Acquisition cấp cao có thể khá khó kiếm nhưng rất đáng công sức tìm kiếm.",
    total_products: "8",
  },
]

// Update the getBanners function to handle potential CORS issues
async function getBanners() {
  try {
    // Use the correct API URL with https
    const res = await fetch("https://thanhbinhnguyen.id.vn/restful/banners", {
      // Chỉ sử dụng một cách revalidate để tránh lỗi khi build
      next: { revalidate: 1 }, // Tự động cập nhật sau 1s
      // Add headers to help with CORS issues
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      console.error("Failed to fetch banners:", res.status, res.statusText)
      return []
    }

    const text = await res.text() // Get response as text first

    try {
      // Try to parse the text as JSON
      const data = JSON.parse(text)
      return data.status === "success" ? data.data : []
    } catch (parseError) {
      console.error("Error parsing banners JSON:", parseError, "Response text:", text.substring(0, 100))
      return []
    }
  } catch (error) {
    console.error("Error fetching banners:", error)
    return []
  }
}

// Update the getCategories function to handle fetch failures
async function getCategories() {
  try {
    // Try to fetch from the API with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const res = await fetch("https://thanhbinhnguyen.id.vn/restful/categories", {
      signal: controller.signal,
      // Chỉ sử dụng một cách revalidate để tránh lỗi khi build
      next: { revalidate: 3600 }, // Tự động cập nhật sau 1 giờ
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      console.error("Failed to fetch categories:", res.status, res.statusText)
      console.log("Using fallback categories data")
      return FALLBACK_CATEGORIES
    }

    const text = await res.text()

    try {
      const data = JSON.parse(text)
      return data.status === "success" ? data.data : FALLBACK_CATEGORIES
    } catch (parseError) {
      console.error("Error parsing categories JSON:", parseError, "Response text:", text.substring(0, 100))
      console.log("Using fallback categories data")
      return FALLBACK_CATEGORIES
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
    console.log("Using fallback categories data")
    return FALLBACK_CATEGORIES
  }
}

// Update the getFeaturedProducts function to handle potential CORS issues
async function getFeaturedProducts() {
  try {
    // Use the correct API URL with https
    const res = await fetch("https://thanhbinhnguyen.id.vn/restful/products?page=1&limit=8", {
      // Chỉ sử dụng một cách revalidate để tránh lỗi khi build
      next: { revalidate: 3600 }, // Tự động cập nhật sau 1 giờ
      // Add headers to help with CORS issues
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      console.error("Failed to fetch products:", res.status, res.statusText)
      return []
    }

    const text = await res.text() // Get response as text first

    try {
      // Try to parse the text as JSON
      const data = JSON.parse(text)
      return data.status === "success" ? data.data.products : []
    } catch (parseError) {
      console.error("Error parsing products JSON:", parseError, "Response text:", text.substring(0, 100))
      return []
    }
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

function BannerSkeleton() {
  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
  )
}

function ProductSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="p-0">
        <Skeleton className="h-48 w-full rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}

function CategorySkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  )
}

function FeaturedProducts({ products }: { products: any[] }) {
  if (!products.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không có sản phẩm</p>
      </div>
    )
  }

  return (
    <BatchFadeIn 
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      stagger={0.03}
      duration={0.5}
      distance={30}
      direction="up"
    >
      {products.map((product) => (
        <Card key={product.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
          <CardHeader className="p-0">
            <div className="relative h-48 w-full overflow-hidden group">
              <Image
                src={product.main_image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover rounded-t-lg transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
            <p className="text-primary font-bold mt-2">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                Number.parseFloat(product.base_price),
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Link href={`/products/${product.id}`} className="w-full">
              <Button variant="default" className="w-full">
                Xem chi tiết
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </BatchFadeIn>
  )
}

function CategoryGrid({ categories }: { categories: any[] }) {
  return (
    <BatchFadeIn 
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      stagger={0.03}
      duration={0.5}
      distance={30}
      direction="up"
    >
      {categories.map((category) => (
        <Link key={category.id} href={`/products?category=${category.id}`}>
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-medium">{category.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{category.total_products} sản phẩm</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </BatchFadeIn>
  )
}

// Tách riêng các async components ra ngoài
async function BannerSection() {
  const banners = await getBanners()
  return <BannerCarousel banners={banners} />
}

async function CategoriesSection() {
  const categories = await getCategories()
  return <CategoryGrid categories={categories} />
}

async function FeaturedProductsSection() {
  const products = await getFeaturedProducts()
  return <FeaturedProducts products={products} />
}

export default function Home() {
  return (
    <div className="container px-4 py-8 md:py-12 mx-auto">
      <Suspense fallback={<BannerSkeleton />}>
        <BannerSection />
      </Suspense>

      <section className="mt-8 md:mt-16">
        <div className="flex items-center justify-between mb-6">
          <TextFX 
            as="h2" 
            effect="words" 
            className="text-2xl md:text-3xl font-bold" 
            disableOnMobile={true} // Tắt animation trên mobile
          >
            Danh mục sản phẩm
          </TextFX>
          <Link
            href="/products"
            className="flex items-center text-sm text-primary hover:underline group"
          >
            Tất cả danh mục<ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <CategorySkeleton key={i} />)}</div>}>
          <CategoriesSection />
        </Suspense>
      </section>

      <section className="mt-12 md:mt-24">
        <div className="flex items-center justify-between mb-6">
          <TextFX 
            as="h2" 
            effect="words"
            className="text-2xl md:text-3xl font-bold"
            disableOnMobile={true} // Tắt animation trên mobile
          >
            Sản phẩm nổi bật
          </TextFX>
          <Link
            href="/products"
            className="flex items-center text-sm text-primary hover:underline group"
          >
            Xem tất cả<ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}</div>}>
          <FeaturedProductsSection />
        </Suspense>
      </section>
    </div>
  )
}
