import API_BASE_URL from "@/lib/api-config";
import clientCache from "@/lib/client-cache";

// Define Types
export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverImageUrl: string;
  followers: number;
  following: number;
  totalPhotos: number;
  totalCollections: number;
  joinedDate: string;
  socialLink: string | null;
};

export interface UserPhoto {
  id: string;
  imageUrl: string;
  title: string;
  likes: number;
  views: number;
  uploadedAt: string;
  width: number;
  height: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  cover_image: string;
  images: number[];
  created_at: string;
  owner: string;
}

// Cache keys
const CACHE_KEYS = {
  POPULAR_USERS: 'popular_users',
  USER_PROFILE: (username: string) => `user_profile_${username}`,
};

// Get profile information for a specific user
export async function getUserProfile(username: string): Promise<UserProfile | null> {
  // Check cache first
  const cacheKey = CACHE_KEYS.USER_PROFILE(username);
  const cachedProfile = clientCache.get<UserProfile>(cacheKey);
  
  if (cachedProfile) {
    console.log('Using cached profile data for:', username);
    return cachedProfile;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/profile/get-profile/?username=${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const data = await response.json();
    
    const profileData: UserProfile = {
      id: data.id,
      username: data.user.username,
      displayName: data.display_name || data.user.username,
      bio: data.bio || "",
      avatarUrl: data.avatar || "/placeholder-user.jpg",
      coverImageUrl: "/placeholder.jpg",
      followers: data.followers_count || 0,
      following: data.following_count || 0,
      totalPhotos: data.photos_count || 0,
      totalCollections: 0, // Will be updated elsewhere
      joinedDate: new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      socialLink: data.social_link || null
    };
    
    // Store in cache
    clientCache.set(cacheKey, profileData);
    
    return profileData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Get user photos from API
export async function getUserPhotos(username: string): Promise<UserPhoto[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/images/user/${username}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    // Map API response to UserPhoto interface
    return data.map((photo: any) => ({
      id: photo.id.toString(),
      imageUrl: photo.image,
      title: photo.title || "Untitled",
      likes: photo.likes_count || 0,
      views: photo.views_count || 0,
      uploadedAt: new Date(photo.uploaded_at).toLocaleDateString(),
      width: photo.width || 400,
      height: photo.height || 300,
    }));
  } catch (error) {
    console.error("Error fetching user photos:", error);
    return [];
  }
}

// Get popular/suggested users
export async function getPopularUsers(limit: number = 5): Promise<UserProfile[]> {
  // Check cache first
  const cacheKey = CACHE_KEYS.POPULAR_USERS;
  const cachedUsers = clientCache.get<UserProfile[]>(cacheKey);
  
  if (cachedUsers) {
    console.log('Using cached popular users data');
    return cachedUsers;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/profile/popular/?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch popular users');
    }
    
    const data = await response.json();
    
    const profiles = data.map((item: any) => ({
      id: item.id,
      username: item.user.username,
      displayName: item.display_name || item.user.username,
      bio: item.bio || "",
      avatarUrl: item.avatar || "/placeholder-user.jpg",
      coverImageUrl: "/placeholder.jpg",
      followers: item.followers_count || 0,
      following: item.following_count || 0,
      totalPhotos: item.photos_count || 0,
      totalCollections: 0,
      joinedDate: new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      socialLink: item.social_link || null
    }));
    
    // Store in cache
    clientCache.set(cacheKey, profiles, { expiryTime: 15 * 60 * 1000 }); // 15 minutes cache
    
    return profiles;
  } catch (error) {
    console.error('Error fetching popular users:', error);
    return [];
  }
}

// Get user collections
export async function getUserCollections(username?: string): Promise<Collection[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch collections");
    }
    
    const data = await response.json();
    
    // If username is provided, filter collections by owner
    if (username) {
      return data.filter((collection: any) => collection.owner === username);
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching user collections:", error);
    return [];
  }
}

// Get collection by ID
export async function getCollectionById(collectionId: string): Promise<Collection | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch collection");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching collection:", error);
    return null;
  }
}

// Get images from a collection
export async function getImagesFromCollection(collectionId: string): Promise<UserPhoto[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch collection");
    }
    
    const data = await response.json();
    const imageIds = data.images;
    
    const imageDetails = await Promise.all(
      imageIds.map(async (imageId: number) => {
        const imageResponse = await fetch(`${API_BASE_URL}/images/${imageId}/?public=true`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (!imageResponse.ok) {
          throw new Error("Failed to fetch image details");
        }
        
        const photo = await imageResponse.json();
        
        return {
          id: photo.id.toString(),
          imageUrl: photo.image,
          title: photo.title || "Untitled",
          likes: photo.likes_count || 0,
          views: photo.views_count || 0,
          uploadedAt: new Date(photo.uploaded_at).toLocaleDateString(),
          width: photo.width || 400,
          height: photo.height || 300,
        };
      })
    );
    
    return imageDetails;
  } catch (error) {
    console.error("Error fetching images from collection:", error);
    return [];
  }
}

// Function to invalidate cache when data changes
export function invalidateProfileCache(username: string): void {
  clientCache.delete(CACHE_KEYS.USER_PROFILE(username));
}

// Function to invalidate popular users cache
export function invalidatePopularUsersCache(): void {
  clientCache.delete(CACHE_KEYS.POPULAR_USERS);
}
