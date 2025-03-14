"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, ImageIcon, Download, Grid, Bookmark, Edit, Share2, LinkIcon } from "lucide-react"
import { getProfile } from "@/components/modal/profile-modal"

export default function Profile() {
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const username = localStorage.getItem("username") || "guest"
        const data = await getProfile(username)
        setProfileData(data)
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-background">
            <Image
              src={profileData?.avatar || "/placeholder.svg?height=128&width=128"}
              alt="Profile picture"
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
            <button className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 shadow-md">
              <Edit className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col items-center justify-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold">{profileData?.fullName || "User"}</h1>
          <p className="text-muted-foreground">@{profileData?.username || "username"}</p>

          <p className="text-center max-w-md mt-2">{profileData?.bio || "No bio yet"}</p>

          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm">
              <LinkIcon className="h-4 w-4 mr-2" />
              Website
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                {profileData?.photos || 0}
              </p>
              <p className="text-sm text-muted-foreground">Photos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                {profileData?.followers?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                {profileData?.following || 0}
              </p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="photos">
              <ImageIcon className="mr-2 h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="collections">
              <Grid className="mr-2 h-4 w-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="mr-2 h-4 w-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="downloads">
              <Download className="mr-2 h-4 w-4" />
              Downloads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={`/placeholder.svg?height=300&width=400`}
                    alt={`Photo ${i + 1}`}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="text-sm font-medium text-white">Photo {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white/20 text-white backdrop-blur-sm"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="collections" className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="group relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={`/placeholder.svg?height=300&width=500`}
                    alt={`Collection ${i + 1}`}
                    width={500}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white">Collection {i + 1}</h3>
                    <p className="text-sm text-gray-300">{12 + i} photos</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={`/placeholder.svg?height=300&width=400`}
                    alt={`Saved photo ${i + 1}`}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="text-sm font-medium text-white">Saved {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white/20 text-white backdrop-blur-sm"
                    >
                      <Bookmark className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="downloads" className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={`/placeholder.svg?height=300&width=400`}
                    alt={`Downloaded photo ${i + 1}`}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="text-sm font-medium text-white">Downloaded {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white/20 text-white backdrop-blur-sm"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

