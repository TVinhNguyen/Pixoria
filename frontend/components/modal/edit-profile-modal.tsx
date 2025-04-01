"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import { handleProfileEdit, handleProfileClick } from "@/lib/api-action/api-profile"

const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(155, 155, 155, 0.5);
      border-radius: 20px;
    }
  `

interface ProfileData {
  username: string
  display_name: string
  avatar: string
  bio: string
  followers: number
  following: number
  photos: number
  social_link: string
}

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  profile: ProfileData
}

export default function ProfileEditModal({ isOpen, onClose, profile }: ProfileEditModalProps) {
  const [formData, setFormData] = useState<ProfileData | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showBottomFade, setShowBottomFade] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen) {
        setIsLoading(true)
        try {
          const data = await handleProfileClick(profile.username)
          setFormData(data)
          setPreviewAvatar(null)
        } catch (error) {
          console.error("Error fetching profile data:", error)
          // Fallback to the profile prop if API call fails
          setFormData(profile)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchData()
  }, [isOpen, profile])

  useEffect(() => {
    const checkScroll = () => {
      if (contentRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = contentRef.current
        const isScrollable = scrollHeight > clientHeight
        const isNotAtBottom = scrollTop + clientHeight < scrollHeight - 10
        setShowBottomFade(isScrollable && isNotAtBottom)
      }
    }

    checkScroll()

    const currentRef = contentRef.current
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll)
      window.addEventListener("resize", checkScroll)
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", checkScroll)
      }
      window.removeEventListener("resize", checkScroll)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        [name]: value,
      }
    })
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setIsSubmitting(true)
    try {
      const updatedData = new FormData()
      updatedData.append("display_name", formData.display_name)
      updatedData.append("bio", formData.bio || "")
      updatedData.append("social_link", formData.social_link || "")

      if (fileInputRef.current?.files?.[0]) {
        updatedData.append("avatar", fileInputRef.current.files[0])
      }

      await handleProfileEdit(updatedData)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] border-none">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!formData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] border-none">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-destructive mb-4">Failed to load profile data</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <style jsx global>
        {scrollbarStyles}
      </style>
      <DialogContent className="sm:max-w-[500px] max-h-[95vh] overflow-hidden border-none">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div
          ref={contentRef}
          className={`custom-scrollbar overflow-y-auto pr-2 scroll-fade-bottom ${showBottomFade ? "fade-active" : ""}`}
          style={{ maxHeight: "calc(90vh - 140px)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-4">
              <div
                className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary cursor-pointer group shadow-md"
                onClick={handleAvatarClick}
              >
                <Image
                  src={previewAvatar || formData.avatar || "/placeholder.svg?height=96&width=96"}
                  alt="Profile avatar"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAvatarClick}
                className="transition-all hover:shadow-md"
              >
                <Upload className="mr-2 h-4 w-4" />
                Change Avatar
              </Button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-sm font-medium">
                  Display Name
                </Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="focus-visible:ring-primary transition-shadow hover:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  rows={4}
                  className="focus-visible:ring-primary resize-none transition-shadow hover:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_link" className="text-sm font-medium">
                  Social Link
                </Label>
                <Input
                  id="social_link"
                  name="social_link"
                  value={formData.social_link || ""}
                  onChange={handleChange}
                  className="focus-visible:ring-primary transition-shadow hover:border-primary/50"
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Account Information</Label>
                <div className="p-4 rounded-md bg-muted/30 border backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Username</p>
                      <p className="text-sm font-medium">@{profile.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Followers</p>
                      <p className="text-sm font-medium">{profile.followers?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Following</p>
                      <p className="text-sm font-medium">{profile.following?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Photos</p>
                      <p className="text-sm font-medium">{profile.photos?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="sm:justify-between mt-4 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="transition-all hover:shadow-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all hover:shadow-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}