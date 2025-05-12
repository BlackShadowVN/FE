"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import Cookies from 'js-cookie'

interface User {
  id: number
  username: string
  fullname: string
  email: string
  role: string
  phone?: string
  address?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, fullname: string, email: string) => Promise<boolean>
  logout: () => void
  updateUserInfo: (fullname: string, email: string, phone?: string, address?: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Thời hạn của cookie (2 ngày)
const COOKIE_EXPIRY_DAYS = 2
const AUTH_COOKIE_NAME = 'auth_data'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  })
  const { toast } = useToast()

  // Load auth state from cookies on initial render
  useEffect(() => {
    const savedAuth = Cookies.get(AUTH_COOKIE_NAME)
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth)
        setAuthState(parsedAuth)
      } catch (error) {
        console.error("Failed to parse auth from cookies:", error)
        Cookies.remove(AUTH_COOKIE_NAME)
      }
    }
  }, [])

  // Save auth state to cookies whenever it changes
  useEffect(() => {
    if (authState.isAuthenticated) {
      Cookies.set(AUTH_COOKIE_NAME, JSON.stringify(authState), { 
        expires: COOKIE_EXPIRY_DAYS, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    } else {
      Cookies.remove(AUTH_COOKIE_NAME)
    }
  }, [authState])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("https://thanhbinhnguyen.id.vn/restful/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          username,
          password,
        }),
      })

      const data = await response.json()

      if (data.status === "success") {
        const newAuthState = {
          user: data.data.user,
          token: data.data.token,
          isAuthenticated: true,
        }
        
        setAuthState(newAuthState)
        
        // Lưu vào cookies với thời hạn 2 ngày
        Cookies.set(AUTH_COOKIE_NAME, JSON.stringify(newAuthState), { 
          expires: COOKIE_EXPIRY_DAYS,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })

        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại!",
        })

        return true
      } else {
        toast({
          title: "Đăng nhập thất bại",
          description: data.message || "Tên đăng nhập hoặc mật khẩu không đúng",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Đăng nhập thất bại",
        description: "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.",
        variant: "destructive",
      })
      return false
    }
  }

  const register = async (username: string, password: string, fullname: string, email: string): Promise<boolean> => {
    try {
      const response = await fetch("https://thanhbinhnguyen.id.vn/restful/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          username,
          password,
          fullname,
          email,
        }),
      })

      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Đăng ký thành công",
          description: "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
        })
        return true
      } else {
        toast({
          title: "Đăng ký thất bại",
          description: data.message || "Không thể đăng ký tài khoản. Vui lòng thử lại.",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Register error:", error)
      toast({
        title: "Đăng ký thất bại",
        description: "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.",
        variant: "destructive",
      })
      return false
    }
  }

  const logout = () => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
    
    // Xóa cookie khi đăng xuất
    Cookies.remove(AUTH_COOKIE_NAME)
    
    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi tài khoản.",
    })
  }

  const updateUserInfo = (fullname: string, email: string, phone?: string, address?: string) => {
    if (!authState.user) return

    const updatedUser = {
      ...authState.user,
      fullname,
      email,
      phone,
      address
    }

    const updatedState = {
      ...authState,
      user: updatedUser
    }
    
    setAuthState(updatedState)
    
    // Cập nhật thông tin trong cookie
    Cookies.set(AUTH_COOKIE_NAME, JSON.stringify(updatedState), { 
      expires: COOKIE_EXPIRY_DAYS,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateUserInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
