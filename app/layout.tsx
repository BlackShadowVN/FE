import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { CartProvider } from "@/components/cart-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Shadow Company",
  description: "Nơi mua sắm tất cả các sản phẩm",
    generator: 'v0.dev'
}

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fetch categories on the server
  const categories = await getCategories()

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              <div className="flex min-h-screen flex-col">
                <Header categories={categories} />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
