"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Moon, Sun, Upload, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

import ProfileModal from "./modal/profile-modal"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const {theme, toggleTheme} = useTheme()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(false)
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQxMzYwNTIzLCJpYXQiOjE3NDEyNzQxMjMsImp0aSI6IjkwZWJiYzQzNjFiZTRiMDFhZTkyYjk3OWJhZjM3MjBmIiwidXNlcl9pZCI6Mn0.Uk5SFujobPMhbUztkaajZrKsqQzVWqpV1WJ9G5ES-Lo"

  const handleOpenProfile = async () => {
    setIsProfileOpen(true)
    if (!profileData) {
        setLoading(true)
        try {
            const result = await fetch("http://127.0.0.1:8000/profile/2/", {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            })
            console.log(result)
            if (!result.ok) throw new Error("Failed to fetch profile data!")
            const data = await result.json()
            setProfileData(data)
        } catch (error) {
            console.error("Error fetching profile:", error)
        } finally {
            setLoading(false)
        }
    }
  }

  return (
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
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleOpenProfile}>
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className={`h-5 w-5 transition-all ${theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`} />
            ) : (
              <Moon className={`h-5 w-5 transition-all ${theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"}`} />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
      
      {isProfileOpen && (
        <ProfileModal 
          data={profileData} 
          loading={false} 
          onClose={() => setIsProfileOpen(false)} 
        />
      )}
    </header>
  )
}