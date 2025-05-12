import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-background print:hidden">
      <div className="container px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary">E-Shop</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Cửa hàng trực tuyến với đầy đủ các sản phẩm. Sản phẩm chất lượng với giá cả phải chăng.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Mua sắm</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-primary">
                    Tất cả sản phẩm
                  </Link>
                </li>
                <li>
                  <Link href="/products?featured=true" className="text-muted-foreground hover:text-primary">
                    Sản phẩm nổi bật
                  </Link>
                </li>
                <li>
                  <Link href="/products?new=true" className="text-muted-foreground hover:text-primary">
                    Sản phẩm mới
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Tài khoản</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary">
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-primary">
                    Đăng ký
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="text-muted-foreground hover:text-primary">
                    Đơn hàng
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Liên hệ</h3>
            <address className="not-italic text-sm text-muted-foreground">
              <p>123 Đường Chính</p>
              <p>Quận 1, TP.HCM</p>
              <p>Việt Nam</p>
            </address>
            <p className="text-sm text-muted-foreground">
              <a href="mailto:info@eshop.com" className="hover:text-primary">
                info@eshop.com
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              <a href="tel:+84123456789" className="hover:text-primary">
                +84 123 456 789
              </a>
            </p>
          </div>
        </div>
        <div className="mt-12 border-t pt-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} E-Shop. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  )
}
