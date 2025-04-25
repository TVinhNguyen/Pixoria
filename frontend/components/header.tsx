"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Moon, Sun, Upload, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { useToast } from "@/hooks/use-toast"
import { useNotificationSocket } from "@/hooks/use-notification-socket"

import ProfileModal from "./modal/profile-modal"
import LoginModal from "./modal/login-modal"
import NotificationModal from "./modal/notification-modal"

import { ProfileData } from "./modal/profile-modal"
import { handleProfileClick } from "@/lib/api-action/api-profile"
import { getUnreadNotificationCount } from "@/lib/api-action/api-notification"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const {theme, toggleTheme} = useTheme()
  const { toast } = useToast()

  const [profileUser, setProfileUser] = useState<ProfileData | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  
  // Sử dụng custom hook để quản lý WebSocket
  const { 
    isConnected, 
    hasNewNotification, 
    newNotificationCount, 
    latestNotification,
    resetNewNotificationFlag 
  } = useNotificationSocket()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    fetchProfileData();
    fetchNotificationCount();
    
    // Đặt polling làm backup cho WebSocket
    const intervalId = setInterval(() => {
      fetchNotificationCount();
    }, 60000); // Kiểm tra mỗi 60 giây

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Effect để xử lý khi có thông báo mới từ WebSocket
  useEffect(() => {
    if (hasNewNotification && latestNotification) {
      // Cập nhật số lượng thông báo chưa đọc
      setUnreadNotificationCount(prev => prev + newNotificationCount);
      
      // Hiển thị toast thông báo
      try {
        const notifData = typeof latestNotification === 'string' 
          ? JSON.parse(latestNotification) 
          : latestNotification;
        
        toast({
          title: "Thông báo mới",
          description: `@${notifData.sender_username} ${notifData.content}`,
          variant: "default",
        });
      } catch (e) {
        console.error("Error parsing notification:", e);
      }
      
      // Reset flag sau khi đã xử lý
      resetNewNotificationFlag();
    }
  }, [hasNewNotification, latestNotification, newNotificationCount, toast, resetNewNotificationFlag]);
  
  const fetchProfileData = async () => {
    try {
      const username = localStorage.getItem("username");
      if (username) {
        const data = await handleProfileClick(username);
        setProfileUser(data);
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("token");
  
      if (!token) {
        console.log("Người dùng chưa đăng nhập, không gọi API.");
        return;
      }
  
      const count = await getUnreadNotificationCount();
      setUnreadNotificationCount(count);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.warn("Token không hợp lệ hoặc đã hết hạn.");
      } else {
        console.error("Lỗi khi fetch số thông báo:", error);
      }
    }
  };
  
  
  const handleUpload = () => {
    window.location.href = "/upload";
  };
  
  const handleClickUser = async () => {
    if (!profileUser) {
      setIsLoginModalOpen(true);
    } else {
      await fetchProfileData();
      setIsProfileModalOpen(true);
    }
  };

  const handleNotification = async () => {
    setIsNotificationModalOpen(true);
    // Reset notification count when opening the notification modal
    setUnreadNotificationCount(0);
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text"
          >
            ModernPexels
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/about-us"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              About us
            </Link>
            <Link
              href="/license"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              License
            </Link>
            <Button variant="ghost" size="icon" onClick={handleUpload}>
              <Upload className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNotification} className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClickUser}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="h-5 w-5 transition-all rotate-0 scale-100" />
              ) : (
                <Moon className="h-5 w-5 transition-all rotate-0 scale-100" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </nav>
        </div>
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={(user, pass) => console.log(user, pass)} />
      {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} data={profileUser} />}
      {isNotificationModalOpen && <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} />}
    </>
  )
}