"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Avatar from 'react-avatar'

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  KeyRound, 
  Mail, 
  UserRound, 
  ShieldCheck, 
  ShoppingBag, 
  LogOut,
  ChevronRight,
  RefreshCw,
  XCircle
} from "lucide-react"

// Äá»‹nh nghÄ©a schema xĂ¡c thá»±c cho form cáº­p nháº­t thĂ´ng tin
const profileFormSchema = z.object({
  fullname: z.string().min(2, { message: "Há» tĂªn pháº£i cĂ³ Ă­t nháº¥t 2 kĂ½ tá»±" }),
  email: z.string().email({ message: "Email khĂ´ng há»£p lá»‡" }),
  phone: z.string().optional(),
  address: z.string().optional(),
})

// Äá»‹nh nghÄ©a schema xĂ¡c thá»±c cho form Ä‘á»•i máº­t kháº©u
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Máº­t kháº©u hiá»‡n táº¡i pháº£i cĂ³ Ă­t nháº¥t 6 kĂ½ tá»±" }),
  newPassword: z.string().min(6, { message: "Máº­t kháº©u má»›i pháº£i cĂ³ Ă­t nháº¥t 6 kĂ½ tá»±" }),
  confirmPassword: z.string().min(6, { message: "XĂ¡c nháº­n máº­t kháº©u pháº£i cĂ³ Ă­t nháº¥t 6 kĂ½ tá»±" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Máº­t kháº©u xĂ¡c nháº­n khĂ´ng khá»›p",
  path: ["confirmPassword"],
})

// Interface cho Ä‘Æ¡n hĂ ng
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

// HĂ m chuyá»ƒn Ä‘á»•i tráº¡ng thĂ¡i Ä‘Æ¡n hĂ ng sang tiáº¿ng Viá»‡t
const translateOrderStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': 'Chá» xĂ¡c nháº­n',
    'processing': 'Äang xá»­ lĂ½',
    'shipping': 'Äang giao hĂ ng',
    'completed': 'ÄĂ£ giao hĂ ng',
    'cancelled': 'ÄĂ£ há»§y'
  }
  return statusMap[status] || status
}

// Láº¥y mĂ u cho badge tráº¡ng thĂ¡i
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

export default function ProfilePage() {
  const { user, isAuthenticated, token, updateUserInfo, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [avatarColor, setAvatarColor] = useState("#0ea5e9")

  // Danh sĂ¡ch cĂ¡c mĂ u dĂ nh cho avatar
  const avatarColors = [
    "#0ea5e9", // Sky blue
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#64748b", // Slate
  ]

  // Khá»Ÿi táº¡o form cáº­p nháº­t thĂ´ng tin
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullname: user?.fullname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    },
  })

  // Khá»Ÿi táº¡o form Ä‘á»•i máº­t kháº©u
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Cáº­p nháº­t giĂ¡ trá»‹ máº·c Ä‘á»‹nh khi user thay Ä‘á»•i
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullname: user.fullname,
        email: user.email,
        phone: user?.phone || "",
        address: user?.address || "",
      })
    }
  }, [user, profileForm])

  // Chuyá»ƒn hÆ°á»›ng náº¿u chÆ°a Ä‘Äƒng nháº­p
  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  // Láº¥y danh sĂ¡ch Ä‘Æ¡n hĂ ng
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !token) return

      try {
        setLoadingOrders(true)
        // Táº¡o URL vá»›i query params
        const url = new URL(`https://thanhbinhnguyen.id.vn/restful/orders`);
        url.searchParams.append('user_id', user.id.toString());
        url.searchParams.append('limit', '5'); // Chá»‰ láº¥y 5 Ä‘Æ¡n hĂ ng gáº§n nháº¥t

        const response = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          cache: "no-store"
        })

        const data = await response.json()

        if (data.status === "success") {
          // Láº¥y dá»¯ liá»‡u phĂ¹ há»£p vá»›i cáº¥u trĂºc API
          const orders = Array.isArray(data.data) ? data.data : (data.data?.orders || []);
          setOrders(orders)
        } else {
          console.error("KhĂ´ng thá»ƒ táº£i Ä‘Æ¡n hĂ ng", data.message)
        }
      } catch (error) {
        console.error("Fetch orders error:", error)
      } finally {
        setLoadingOrders(false)
      }
    }

    if (isAuthenticated && activeTab === "orders") {
      fetchOrders()
    }
  }, [user, token, isAuthenticated, activeTab])

  // Xá»­ lĂ½ cáº­p nháº­t thĂ´ng tin
  const onUpdateProfile = async (data: z.infer<typeof profileFormSchema>) => {
    if (!user || !token) return

    setIsLoading(true)

    try {
      const response = await fetch(`https://thanhbinhnguyen.id.vn/restful/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullname: data.fullname,
          email: data.email,
          phone: data.phone,
          address: data.address
        }),
      })

      const result = await response.json()

      if (result.status === "success") {
        // Cáº­p nháº­t thĂ´ng tin ngÆ°á»i dĂ¹ng trong AuthProvider
        updateUserInfo(data.fullname, data.email, data.phone, data.address)
        
        toast({
          title: "Cáº­p nháº­t thĂ nh cĂ´ng",
          description: "ThĂ´ng tin cĂ¡ nhĂ¢n cá»§a báº¡n Ä‘Ă£ Ä‘Æ°á»£c cáº­p nháº­t",
        })
      } else {
        toast({
          title: "Cáº­p nháº­t tháº¥t báº¡i",
          description: result.message || "ÄĂ£ xáº£y ra lá»—i khi cáº­p nháº­t thĂ´ng tin",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update profile error:", error)
      toast({
        title: "Cáº­p nháº­t tháº¥t báº¡i",
        description: "ÄĂ£ xáº£y ra lá»—i khi cáº­p nháº­t thĂ´ng tin. Vui lĂ²ng thá»­ láº¡i sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Xá»­ lĂ½ Ä‘á»•i máº­t kháº©u
  const onChangePassword = async (data: z.infer<typeof passwordFormSchema>) => {
    if (!user || !token) return

    setIsLoading(true)

    try {
      const response = await fetch("https://thanhbinhnguyen.id.vn/restful/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          current_password: data.currentPassword,
          new_password: data.newPassword
        }),
      })

      const result = await response.json()

      if (result.status === "success") {
        toast({
          title: "Äá»•i máº­t kháº©u thĂ nh cĂ´ng",
          description: "Máº­t kháº©u cá»§a báº¡n Ä‘Ă£ Ä‘Æ°á»£c cáº­p nháº­t",
        })
        passwordForm.reset()
      } else {
        toast({
          title: "Äá»•i máº­t kháº©u tháº¥t báº¡i",
          description: result.message || "ÄĂ£ xáº£y ra lá»—i khi Ä‘á»•i máº­t kháº©u",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Change password error:", error)
      toast({
        title: "Äá»•i máº­t kháº©u tháº¥t báº¡i",
        description: "ÄĂ£ xáº£y ra lá»—i khi Ä‘á»•i máº­t kháº©u. Vui lĂ²ng thá»­ láº¡i sau.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Xá»­ lĂ½ Ä‘Äƒng xuáº¥t vĂ  chuyá»ƒn hÆ°á»›ng vá» trang chá»§
  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Xá»­ lĂ½ há»§y Ä‘Æ¡n hĂ ng
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
        // Cáº­p nháº­t tráº¡ng thĂ¡i Ä‘Æ¡n hĂ ng trong state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          )
        )

        toast({
          title: "Há»§y Ä‘Æ¡n hĂ ng thĂ nh cĂ´ng",
          description: "ÄÆ¡n hĂ ng cá»§a báº¡n Ä‘Ă£ Ä‘Æ°á»£c há»§y",
        })
      } else {
        toast({
          title: "Há»§y Ä‘Æ¡n hĂ ng tháº¥t báº¡i",
          description: data.message || "KhĂ´ng thá»ƒ há»§y Ä‘Æ¡n hĂ ng nĂ y",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Cancel order error:", error)
      toast({
        title: "Há»§y Ä‘Æ¡n hĂ ng tháº¥t báº¡i",
        description: "ÄĂ£ xáº£y ra lá»—i khi há»§y Ä‘Æ¡n hĂ ng. Vui lĂ²ng thá»­ láº¡i sau.",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return null // Sáº½ chuyá»ƒn hÆ°á»›ng bá»Ÿi useEffect
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">TĂ i khoáº£n cá»§a tĂ´i</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-primary/10 overflow-hidden ${user?.role === "admin" ? "border-4 border-[#6A1B9A]" : "border border-sidebar-border"}`}>
                  <UserRound className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="font-medium text-lg">{user?.fullname}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {user?.phone && (
                    <p className="text-sm text-muted-foreground mt-1">{user.phone}</p>
                  )}
                  {user?.role === "admin" && (
                    <Badge variant="default" className="mt-2 bg-[#6A1B9A] hover:bg-[#6A1B9A]/90">Admin</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button 
              variant={activeTab === "profile" ? "default" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab("profile")}
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>ThĂ´ng tin cĂ¡ nhĂ¢n</span>
              </div>
            </Button>
            <Button 
              variant={activeTab === "orders" ? "default" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab("orders")}
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4" />
                <span>ÄÆ¡n hĂ ng cá»§a tĂ´i</span>
              </div>
            </Button>
            <Button 
              variant={activeTab === "security" ? "default" : "ghost"} 
              className="w-full justify-start" 
              onClick={() => setActiveTab("security")}
            >
              <div className="flex items-center space-x-2">
                <KeyRound className="h-4 w-4" />
                <span>Äá»•i máº­t kháº©u</span>
              </div>
            </Button>

            <Separator className="my-2" />

            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" 
              onClick={handleLogout}
            >
              <div className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>ÄÄƒng xuáº¥t</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {activeTab === "profile" && (
            <div>
              <CardHeader>
                <CardTitle>ThĂ´ng tin cĂ¡ nhĂ¢n</CardTitle>
                <CardDescription>
                  Cáº­p nháº­t thĂ´ng tin cĂ¡ nhĂ¢n cá»§a báº¡n
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <Avatar 
                    name={profileForm.watch('fullname') || user?.fullname}
                    size="100"
                    round={true}
                    className={`${user?.role === "admin" ? "border-4 border-blue-500" : "border border-sidebar-border"} mb-3`}
                    color={avatarColor}
                  />
                  <div className="text-sm text-muted-foreground mb-3">
                    Avatar Ä‘Æ°á»£c táº¡o tá»± Ä‘á»™ng tá»« tĂªn cá»§a báº¡n
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    {avatarColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full cursor-pointer ${avatarColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setAvatarColor(color)}
                        aria-label={`Chá»n mĂ u ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="fullname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Há» vĂ  tĂªn</FormLabel>
                          <FormControl>
                            <Input placeholder="Nguyá»…n VÄƒn A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="example@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sá»‘ Ä‘iá»‡n thoáº¡i</FormLabel>
                          <FormControl>
                            <Input placeholder="0901234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Äá»‹a chá»‰</FormLabel>
                          <FormControl>
                            <Input placeholder="123 ÄÆ°á»ng ABC, Quáº­n XYZ, TP. HCM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Äang cáº­p nháº­t..." : "Cáº­p nháº­t thĂ´ng tin"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <CardHeader>
                <CardTitle>ÄÆ¡n hĂ ng cá»§a tĂ´i</CardTitle>
                <CardDescription>
                  Xem vĂ  quáº£n lĂ½ cĂ¡c Ä‘Æ¡n hĂ ng Ä‘Ă£ Ä‘áº·t
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {loadingOrders ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Äang táº£i Ä‘Æ¡n hĂ ng...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Báº¡n chÆ°a cĂ³ Ä‘Æ¡n hĂ ng nĂ o</h3>
                      <p className="text-muted-foreground mb-4">HĂ£y mua sáº¯m Ä‘á»ƒ tháº¥y Ä‘Æ¡n hĂ ng á»Ÿ Ä‘Ă¢y</p>
                      <Button asChild>
                        <Link href="/products">
                          Báº¯t Ä‘áº§u mua sáº¯m
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <Card key={order.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">ÄÆ¡n hĂ ng #{order.id}</CardTitle>
                                <CardDescription>
                                  Äáº·t ngĂ y {new Date(order.created_at).toLocaleDateString('vi-VN')}
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
                                <p className="text-sm font-medium mb-1">Äá»‹a chá»‰ giao hĂ ng</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{order.shipping_address}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">PhÆ°Æ¡ng thá»©c thanh toĂ¡n</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.payment_method === 'cod' ? 'Thanh toĂ¡n khi nháº­n hĂ ng' : 'Thanh toĂ¡n qua tháº»'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2 border-t bg-muted/50">
                            <div className="font-medium">
                              Tá»•ng tiá»n: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(order.total_amount?.toString() || order.total_price?.toString() || '0'))}
                            </div>
                            <div className="flex space-x-2">
                              {order.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm("Báº¡n cĂ³ cháº¯c cháº¯n muá»‘n há»§y Ä‘Æ¡n hĂ ng nĂ y khĂ´ng?")) {
                                      cancelOrder(order.id)
                                    }
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Há»§y
                                </Button>
                              )}
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => router.push(`/orders/${order.id}`)}
                              >
                                Chi tiáº¿t
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                      
                      {orders.length > 0 && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="outline"
                            onClick={() => router.push('/orders')}
                          >
                            Xem táº¥t cáº£ Ä‘Æ¡n hĂ ng
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <CardHeader>
                <CardTitle>Äá»•i máº­t kháº©u</CardTitle>
                <CardDescription>
                  Äá»•i máº­t kháº©u Ä‘Äƒng nháº­p cá»§a báº¡n
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máº­t kháº©u hiá»‡n táº¡i</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máº­t kháº©u má»›i</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>XĂ¡c nháº­n máº­t kháº©u má»›i</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Äang cáº­p nháº­t..." : "Äá»•i máº­t kháº©u"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
} 
