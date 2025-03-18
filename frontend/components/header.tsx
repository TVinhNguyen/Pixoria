"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Moon, Sun, Upload, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

import ProfileModal from "./modal/profile-modal"
import LoginModal from "./modal/login-modal"
import NotificationModal from "./modal/notification-modal"

import { ProfileData } from "./modal/profile-modal"
import { handleProfileClick } from "@/lib/api-action/api-profile"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const {theme, toggleTheme} = useTheme()

  const [profileUser, setProfileUser] = useState<ProfileData | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    fetchProfileData();
  }, []);
  
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
              href="/explore"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/license"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              License
            </Link>
            <Button variant="ghost" size="icon">
              <Upload className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNotification}>
              <Bell className="h-5 w-5" />
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