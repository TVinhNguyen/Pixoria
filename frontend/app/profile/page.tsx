"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, ImageIcon, Download, Grid, Bookmark, Edit, Share2, LinkIcon } from "lucide-react"
import {
  handleProfileClick,
  loadAllUploadedImages,
  loadAllLikedImages,
  loadAllDownloadedImages,
} from "@/lib/api-action/api-profile"
import { handleGetCollections } from "@/lib/api-action/api-collection"
import ProfileEditModal from "@/components/modal/edit-profile-modal"
import EditCollectionModal from "@/components/modal/collections/edit-collection-modal"
import CollectionImagesModal from "@/components/modal/collections/collection-images-modal"

export default function Profile() {
  const router = useRouter()
  const tabParams = useSearchParams()
  const defaultTab = tabParams.get("tab") || "photos"
  const [tab, setTab] = useState(defaultTab)

  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [userImages, setUserImages] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [likedImages, setLikedImages] = useState<any[]>([])
  const [downloadedImages, setDownloadedImages] = useState<any[]>([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [likedImagesLoading, setLikedImagesLoading] = useState(false)
  const [downloadedImagesLoading, setDownloadedImagesLoading] = useState(false)

  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null)
  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] = useState(false)
  const [isCollectionImagesOpen, setIsCollectionImagesOpen] = useState(false)

  const fetchProfile = async () => {
    try {
      const username = localStorage.getItem("username") || "guest"
      const data = await handleProfileClick(username)
      setProfileData(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserImages = async () => {
    try {
      setImagesLoading(true)
      const data = await loadAllUploadedImages()
      setUserImages(data)
    } catch (error) {
      console.error("Error fetching user images:", error)
    } finally {
      setImagesLoading(false)
    }
  }

  const fetchCollections = async () => {
    try {
      const data = await handleGetCollections()
      setCollections(data.results)
    } catch (error) {
      console.error("Error fetching user collections:", error)
    } finally {
      setCollectionsLoading(false)
    }
  }

  const fetchUserLikedImages = async () => {
    try {
      setLikedImagesLoading(true)
      const data = await loadAllLikedImages()
      setLikedImages(data)
    } catch (error) {
      console.error("Error fetching user liked images:", error)
    } finally {
      setLikedImagesLoading(false)
    }
  }

  const fetchUserDownloadedImages = async () => {
    try {
      setDownloadedImagesLoading(true)
      const data = await loadAllDownloadedImages()
      setDownloadedImages(data)
    } catch (error) {
      console.error("Error fetching user downloaded images:", error)
    } finally {
      setDownloadedImagesLoading(false)
    }
  }

  useEffect(() => {
    setTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    fetchProfile()
    fetchUserImages()
    fetchCollections()
    fetchUserLikedImages()
    fetchUserDownloadedImages()
  }, [])

  useEffect(() => {
    if (!isEditModalOpen) {
      fetchProfile()
    }
  }, [isEditModalOpen])

  useEffect(() => {
    if (!isEditCollectionModalOpen) {
      fetchCollections()
    }
  }, [isEditCollectionModalOpen])

  useEffect(() => {
    if (!isCollectionImagesOpen) {
      fetchCollections()
    }
  }, [isCollectionImagesOpen])

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading profile...</div>
      </div>
    )
  }

  const handleTabChange = (value: string) => {
    if (value === "photos") {
      fetchUserImages()
    } else if (value === "likes") {
      fetchUserLikedImages()
    } else if (value === "downloads") {
      fetchUserDownloadedImages()
    } else if (value === "collections") {
      fetchCollections()
    }
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
            <button
              className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 shadow-md"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col items-center justify-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold">{profileData?.display_name || "User"}</h1>
          <p className="text-muted-foreground">@{profileData?.username || "username"}</p>

          <p className="text-center max-w-md mt-2">{profileData?.bio || "No bio yet"}</p>

          <div className="flex items-center gap-2 mt-2">
            {profileData?.social_link && (
              <Button variant="outline" size="sm" asChild>
                <a href={profileData.social_link} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => setIsEditModalOpen(true)}
            >
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

        <Tabs value={tab} className="w-full" onValueChange={(value) => {
          setTab(value)
          router.push(`/profile?tab=${value}`)
          handleTabChange(value)
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="photos">
              <ImageIcon className="mr-2 h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="collections">
              <Grid className="mr-2 h-4 w-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="likes">
              <Bookmark className="mr-2 h-4 w-4" />
              Likes
            </TabsTrigger>
            <TabsTrigger value="downloads">
              <Download className="mr-2 h-4 w-4" />
              Downloads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-6">
            {imagesLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-pulse text-primary">Loading images...</div>
              </div>
            ) : userImages.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {userImages.map((image, i) => (
                  <div key={image.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Image
                      src={image.file || `/placeholder.svg?height=300&width=400`}
                      alt={image.title || `Photo ${i + 1}`}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="text-sm font-medium text-white">{image.title || `Photo ${i + 1}`}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/20 text-white backdrop-blur-sm"
                      >
                        <Heart className="h-4 w-4" />
                        {image.likes > 0 && <span className="sr-only">{image.likes} likes</span>}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No photos uploaded yet</p>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Upload Your First Photo
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="mt-6">
            { collectionsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-pulse text-primary">Loading collections...</div>
              </div>
              ) : collections.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-pulse text-primary">No collections yet</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {collections.map((collection) => (
                    <div key={collection.id} className="group relative aspect-video overflow-hidden rounded-lg" onClick={() => {
                      setIsCollectionImagesOpen(true)
                      setSelectedCollectionId(collection.id)
                    }}>
                      <Image
                        src={collection.cover_image || `/placeholder.svg?height=300&width=500`}
                        alt={collection.name}
                        width={500}
                        height={300}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-bold text-white">{collection.name}</h3>
                        <p className="text-sm text-gray-300">{collection.images.length} photos</p>
                      </div>
                      <Button onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCollectionId(collection.id)
                          setIsEditCollectionModalOpen(true)
                        }} variant="ghost" size="sm" className="absolute right-2 top-2 bg-black/30 hover:bg-black/50 text-white">
                        <Edit className="h-4 w-4 mr-1" />
                          Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )
            }
          </TabsContent>

          <TabsContent value="likes" className="mt-6">
            {likedImagesLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-pulse text-primary">Loading liked images...</div>
              </div>
            ) : likedImages.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {likedImages.map((image, i) => (
                  <div key={image.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Image
                      src={image.file || `/placeholder.svg?height=300&width=400`}
                      alt={image.title || `Saved photo ${i + 1}`}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="text-sm font-medium text-white">{image.title || `Saved ${i + 1}`}</span>
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
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No liked photos yet</p>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Browse Photos to Like
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="downloads" className="mt-6">
            {downloadedImagesLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-pulse text-primary">Loading downloaded images...</div>
              </div>
            ) : downloadedImages.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {downloadedImages.map((image, i) => (
                  <div key={image.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg">
                    <Image
                      src={image.file || `/placeholder.svg?height=300&width=400`}
                      alt={image.title || `Downloaded photo ${i + 1}`}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{image.title || `Downloaded ${i + 1}`}</span>
                        {image.downloaded_at && (
                          <span className="text-xs text-white/70">
                            Downloaded on {new Date(image.downloaded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
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
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No downloaded photos yet</p>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Browse Photos to Download
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {profileData && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={{
            username: profileData.username || "",
            display_name: profileData.display_name || "",
            avatar: profileData.avatar || "",
            bio: profileData.bio || "",
            followers: profileData.followers || 0,
            following: profileData.following || 0,
            photos: profileData.photos || 0,
            social_link: profileData.social_link || "",
          }}
        />
      )}
      
      { isEditCollectionModalOpen && selectedCollectionId != null && (
        <EditCollectionModal
          isOpen={isEditCollectionModalOpen}
          onClose={() => setIsEditCollectionModalOpen(false)}
          collectionId = {selectedCollectionId}
        />
      )}

      { isCollectionImagesOpen && selectedCollectionId != null && (
        <CollectionImagesModal
          isOpen={isCollectionImagesOpen}
          onClose={() => setIsCollectionImagesOpen(false)}
          collectionId={selectedCollectionId}
        />
      )}
    </div>
  )
}