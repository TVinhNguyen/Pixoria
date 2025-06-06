"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Globe, Facebook, Instagram, Calendar, Grid, Bookmark, Heart, Eye, Lock, Loader2, ChevronDown, Trash } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Masonry from "react-masonry-css"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

// Import the original API functions instead of the service functions
import { handleProfileClick } from "@/lib/api-action/api-profile"
import { handleGetCollectionByUsername } from "@/lib/api-action/api-collection"
import { getPopularUsers, type UserProfile } from "@/services/user-service"
import API_BASE_URL from "@/lib/api-config"
import { checkFollowStatus, toggleFollow } from "@/lib/api-action/api-follow"
import { useToast } from "@/hooks/use-toast"
import CollectionImagesModal from "@/components/modal/collections/collection-images-modal"

// Define UserPhoto interface
interface UserPhoto {
  id: string
  imageUrl: string
  title: string
  likes: number
  views: number
  uploadedAt: string
  width: number
  height: number
}

// Define Collection interface
interface Collection {
  id: string
  name: string
  user: string
  description: string
  is_public: boolean
  cover_image: string
  images: number[]
  created_at: string
}

// Constants for pagination
const PHOTOS_PER_PAGE = 15;
const COLLECTIONS_PER_PAGE = 9;

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const { toast } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [photos, setPhotos] = useState<UserPhoto[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [suggestedProfiles, setSuggestedProfiles] = useState<UserProfile[]>([])
  
  // Separate loading states
  const [profileLoading, setProfileLoading] = useState(true)
  const [photosLoading, setPhotosLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null)
  const [isCollectionImagesOpen, setIsCollectionImagesOpen] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<any>(null)
  
  // Pagination states
  const [photoPage, setPhotoPage] = useState(1)
  const [collectionPage, setCollectionPage] = useState(1)
  const [hasMorePhotos, setHasMorePhotos] = useState(true)
  const [hasMoreCollections, setHasMoreCollections] = useState(true)
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false)
  const [loadingMoreCollections, setLoadingMoreCollections] = useState(false)
  const [totalPhotoCount, setTotalPhotoCount] = useState(0)

  // State for delete photo confirmation dialog
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Function to fetch user photos with pagination
  const fetchUserPhotos = useCallback(async (username: string, page: number = 1): Promise<{photos: UserPhoto[], hasMore: boolean, total: number}> => {
    try {
      const response = await fetch(`${API_BASE_URL}/images/user/${username}/?page=${page}&page_size=${PHOTOS_PER_PAGE}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        return { photos: [], hasMore: false, total: 0 };
      }
      
      const data = await response.json();
      const results = data.results || data;
      const total = data.count || results.length;
      const hasMore = data.next !== null;
      
      // Convert API response to UserPhoto format
      const formattedPhotos = results.map((photo: any) => ({
        id: photo.id.toString(),
        imageUrl: photo.file || photo.image,
        title: photo.title || "Untitled",
        likes: photo.likes_count || 0,
        views: photo.views_count || 0,
        uploadedAt: new Date(photo.uploaded_at).toLocaleDateString(),
        width: photo.width || 400,
        height: photo.height || 300,
      }));
      
      return { 
        photos: formattedPhotos, 
        hasMore,
        total
      };
    } catch (error) {
      console.error("Error fetching user photos:", error);
      return { photos: [], hasMore: false, total: 0 };
    }
  }, []);

  // Function to fetch collections with pagination
  const fetchUserCollections = useCallback(async (username: string, page: number = 1): Promise<{collections: Collection[], hasMore: boolean}> => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${username}/collections/?page=${page}&page_size=${COLLECTIONS_PER_PAGE}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        return { collections: [], hasMore: false };
      }
      
      const data = await response.json();
      const results = data.results || data;
      const hasMore = data.next !== null;
      
      return { 
        collections: results, 
        hasMore
      };
    } catch (error) {
      console.error("Error fetching user collections:", error);
      return { collections: [], hasMore: false };
    }
  }, []);

  // Load more photos
  const loadMorePhotos = async () => {
    if (!hasMorePhotos || loadingMorePhotos) return;
    
    setLoadingMorePhotos(true);
    try {
      const nextPage = photoPage + 1;
      const { photos: newPhotos, hasMore } = await fetchUserPhotos(username, nextPage);
      
      setPhotos((prev: UserPhoto[]) => [...prev, ...newPhotos]);
      setPhotoPage(nextPage);
      setHasMorePhotos(hasMore);
    } catch (error) {
      console.error("Error loading more photos:", error);
    } finally {
      setLoadingMorePhotos(false);
    }
  };

  // Load more collections
  const loadMoreCollections = async () => {
    if (!hasMoreCollections || loadingMoreCollections) return;
    
    setLoadingMoreCollections(true);
    try {
      const nextPage = collectionPage + 1;
      const { collections: newCollections, hasMore } = await fetchUserCollections(username, nextPage);
      
      setCollections((prev: Collection[]) => [...prev, ...newCollections]);
      setCollectionPage(nextPage);
      setHasMoreCollections(hasMore);
    } catch (error) {
      console.error("Error loading more collections:", error);
    } finally {
      setLoadingMoreCollections(false);
    }
  };

  useEffect(() => {
    async function loadProfileData() {
      setProfileLoading(true)
      setPhotosLoading(true)
      setCollectionsLoading(true)
      setError(null)

      try {
        // Get the current user's username from localStorage
        const currentUser = localStorage.getItem("username")
        setCurrentUserUsername(currentUser)

        // Parallel data fetching for better performance
        const [profileDataPromise, photosDataPromise, collectionsDataPromise] = [
          handleProfileClick(username),
          fetchUserPhotos(username),
          fetchUserCollections(username)
        ]

        // Load profile data
        const profileData = await profileDataPromise
        
        if (!profileData) {
          setError("User not found")
          return
        }        // Convert API response to UserProfile format
        setProfile({
          id: localStorage.getItem("profile_id") || "",
          username: profileData.username,
          displayName: profileData.display_name || profileData.username,
          bio: profileData.bio || "",
          avatarUrl: profileData.avatar || "/images/avatar.jpg",
          coverImageUrl: "/images/background.jpg",
          followers: profileData.followers || 0,
          following: profileData.following || 0,
          totalPhotos: profileData.photos || 0,
          totalCollections: 0, // Will be updated when collections are loaded
          joinedDate: new Date(profileData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          socialLink: profileData.social_link || null
        })
        setProfileLoading(false)

        // Check if the current user is following this profile
        if (currentUser && currentUser !== username && localStorage.getItem("profile_id")) {
          checkFollowStatus(parseInt(localStorage.getItem("profile_id") || "0"))
            .then(followStatus => setIsFollowing(followStatus))
            .catch(error => console.error("Error checking follow status:", error))
        }

        // Load user photos with pagination
        const { photos: photosData, hasMore: hasMorePhotos, total } = await photosDataPromise
        setPhotos(photosData)
        setHasMorePhotos(hasMorePhotos)
        setTotalPhotoCount(total)
        setPhotosLoading(false)
        
        // Load user collections with pagination
        const { collections: collectionsData, hasMore: hasMoreCollections } = await collectionsDataPromise
        setCollections(collectionsData)
        setHasMoreCollections(hasMoreCollections)
        
        // Update total collections count in profile
        if (profile) {
          setProfile((prev: UserProfile | null) => prev ? {
            ...prev,
            totalPhotos: profileData.photos || 0
          } : null)
        }
        setCollectionsLoading(false)

      } catch (err) {
        console.error("Error loading profile:", err)
        setError("Failed to load profile data")
        setProfileLoading(false)
        setPhotosLoading(false)
        setCollectionsLoading(false)
      }
    }

    loadProfileData()
  }, [username, fetchUserPhotos, fetchUserCollections])

  // Handle follow/unfollow action
  const handleFollowAction = async () => {
    // Don't allow following if not logged in
    if (!localStorage.getItem("token")) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive"
      })
      router.push("/login")
      return
    }

    // Don't allow following yourself
    if (currentUserUsername === username) {
      toast({
        title: "Can't follow yourself",
        description: "You cannot follow your own profile",
        variant: "destructive"
      })
      return
    }

    setFollowLoading(true)
    try {
      const profileId = parseInt(localStorage.getItem("profile_id") || "0")
      if (profileId === 0) {
        throw new Error("Invalid profile ID")
      }

      const result = await toggleFollow(profileId)
      
      if (result.success) {
        setIsFollowing(!isFollowing)
        
        // Update the followers count
        if (profile) {
          setProfile({
            ...profile,
            followers: isFollowing ? profile.followers - 1 : profile.followers + 1
          })
        }
        
        toast({
          title: result.action === "follow" ? "Followed" : "Unfollowed",
          description: result.message,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(false)
    }
  }

  // Hàm mở dialog xác nhận xóa
  const confirmDeletePhoto = (photoId: string) => {
    setDeletePhotoId(photoId);
    setIsDeleteDialogOpen(true);
  };

  // Hàm thực hiện xóa khi xác nhận
  const handleDeletePhoto = async () => {
    if (!deletePhotoId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/images/${deletePhotoId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        const { photos: newPhotos, total } = await fetchUserPhotos(username, 1);
        setPhotos(newPhotos);
        setTotalPhotoCount(total);
        setPhotoPage(1);
        setHasMorePhotos(newPhotos.length >= PHOTOS_PER_PAGE);
        const profileData = await handleProfileClick(username);
        if (profileData) {
          setProfile((prev: UserProfile | null) => prev ? {
            ...prev,
            totalPhotos: profileData.photos || 0
          } : null);
        }
        toast({ title: "Đã xóa ảnh", description: "Ảnh đã được xóa thành công." });
      } else {
        toast({ title: "Lỗi", description: "Không thể xóa ảnh.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Lỗi", description: "Có lỗi xảy ra khi xóa ảnh.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletePhotoId(null);
    }
  };

  // Handle profile not found or error
  if (!profileLoading && (error || !profile)) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto max-w-4xl text-center py-16">
            <h1 className="text-3xl font-bold mb-4">{error || "User not found"}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The profile you're looking for doesn't exist or couldn't be loaded.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.back()}>Go Back</Button>
              <Button variant="outline" asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
        {/* Cover Image */}
        <div className="relative w-full h-64 md:h-80 overflow-hidden">
          {profileLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <Image
              src={profile?.coverImageUrl || "/placeholder.svg?height=400&width=1200&text=Cover+Image"}
              alt={`${profile?.displayName}'s cover`}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            {/* Avatar */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg mx-auto md:mx-0">
              {profileLoading ? (
                <Skeleton className="w-full h-full rounded-full" />
              ) : (
                <Image
                  src={profile?.avatarUrl || "/placeholder.svg?height=200&width=200&text=Avatar"}
                  alt={`${profile?.displayName}'s avatar`}
                  fill
                  className="object-cover"
                  priority
                />
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1 text-center md:text-left pt-4 md:pt-20">
              {profileLoading ? (
                <>
                  <Skeleton className="h-8 w-48 mb-2 mx-auto md:mx-0" />
                  <Skeleton className="h-4 w-72 mb-4 mx-auto md:mx-0" />
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{profile?.displayName}</h1>
                  <p className="text-gray-600 dark:text-gray-400">@{profile?.username}</p>
                </>
              )}
            </div>

            {/* Follow Button */}
            <div className="flex justify-center md:justify-end items-start pt-4 md:pt-20">
              {profileLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : currentUserUsername && currentUserUsername !== username ? (
                <Button 
                  className={isFollowing ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" : "bg-purple-600 hover:bg-purple-700"}
                  onClick={handleFollowAction}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isFollowing ? "Unfollowing..." : "Following..."}
                    </>
                  ) : (
                    isFollowing ? "Following" : "Follow"
                  )}
                </Button>
              ) : currentUserUsername === username ? (
                <Button 
                  variant="outline"
                  onClick={() => router.push("/profile")}
                >
                  Edit Profile
                </Button>
              ) : null}
            </div>
          </div>

          {/* Bio and Stats */}
          <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {profileLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </>
              ) : (
                <>
                  <p className="text-gray-800 dark:text-gray-200 mb-4">{profile?.bio}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                   
                    {profile?.socialLink && (
                      <a
                        href={profile.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-purple-600"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {profile?.joinedDate}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              {profileLoading ? (
                <>
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold">{profile?.followers.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold">{profile?.following.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold">{profile?.totalPhotos.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Photos</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold">{collections.length.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Collections</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs for Photos and Collections */}
          <div className="mt-12">
            <Tabs defaultValue="photos">
              <TabsList className="w-full max-w-md mx-auto">
                <TabsTrigger value="photos" className="flex-1">
                  <Grid className="h-4 w-4 mr-2" />
                  Photos
                </TabsTrigger>
                <TabsTrigger value="collections" className="flex-1">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Collections
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photos" className="mt-6">
                {photosLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="w-full h-64 rounded-lg" />
                    ))}
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No photos yet</p>
                  </div>
                ) : (
                  <>
                    <Masonry
                      breakpointCols={{
                        default: 3,
                        1100: 3,
                        700: 2,
                        500: 1,
                      }}
                      className="flex w-auto"
                      columnClassName="bg-clip-padding px-2"
                    >
                      {photos.map((photo: UserPhoto) => (
                        <div key={photo.id} className="mb-4 group relative overflow-hidden rounded-lg">
                          <Image
                            src={photo.imageUrl || "/placeholder.svg"}
                            width={photo.width}
                            height={photo.height}
                            alt={photo.title}
                            className="w-full h-auto rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100">
                            <h3 className="text-white font-medium">{photo.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-white text-sm">
                              <span className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {photo.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {photo.views}
                              </span>
                              <button
                                className="ml-auto bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition"
                                title="Xóa ảnh"
                                onClick={() => confirmDeletePhoto(photo.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Masonry>
                    
                    {hasMorePhotos && (
                      <div className="mt-8 text-center">
                        <Button 
                          variant="outline" 
                          onClick={loadMorePhotos}
                          disabled={loadingMorePhotos}
                          className="mx-auto"
                        >
                          {loadingMorePhotos ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-2 h-4 w-4" />
                              Load More Photos
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="collections" className="mt-6">
                {collectionsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="w-full h-48 rounded-lg" />
                    ))}
                  </div>
                ) : collections.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No collections yet</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {collections.map((collection) => (
                        <div 
                          key={collection.id} 
                          className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer" 
                          onClick={() => {
                            setIsCollectionImagesOpen(true)
                            setSelectedCollectionId(collection.id)
                          }}
                        >
                          <Image
                            src={collection.cover_image || `/placeholder.svg?height=300&width=500`}
                            alt={collection.name}
                            width={500}
                            height={300}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-lg font-bold text-white">{collection.name}</h3>
                            <p className="text-sm text-gray-300">{collection.images.length} photos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {hasMoreCollections && (
                      <div className="mt-8 text-center">
                        <Button 
                          variant="outline" 
                          onClick={loadMoreCollections}
                          disabled={loadingMoreCollections}
                          className="mx-auto"
                        >
                          {loadingMoreCollections ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-2 h-4 w-4" />
                              Load More Collections
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
      
      {isCollectionImagesOpen && selectedCollectionId && (
        <CollectionImagesModal
          isOpen={isCollectionImagesOpen}
          onClose={() => setIsCollectionImagesOpen(false)}
          username={username}
          collectionId={selectedCollectionId}
        />
      )}

      {/* Popup xác nhận xóa ảnh */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogTitle>Xác nhận xóa ảnh</DialogTitle>
          <DialogDescription>Bạn có chắc chắn muốn xóa ảnh này không? Hành động này không thể hoàn tác.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeletePhoto}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
