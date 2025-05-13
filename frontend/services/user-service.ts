// User service for handling user data interactions with the backend API
import API_BASE_URL from "../lib/api-config";

export interface UserProfile {
  id: string
  username: string
  displayName: string
  bio: string
  avatarUrl: string
  coverImageUrl: string
  followers: number
  following: number
  totalPhotos: number
  totalCollections: number
  joinedDate: string
  socialLink:string
}

export interface UserPhoto {
  id: string
  imageUrl: string
  title: string
  likes: number
  views: number
  uploadedAt: string
  width: number
  height: number
}

export interface Collection {
  id: string
  name: string
  description: string
  is_public: boolean
  cover_image: string
  images: number[]
  created_at: string
  owner: string
}

// Get user profile data from API
export async function getUserProfile(username: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/get-profile/?username=${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Map API response to UserProfile interface
    const profile: UserProfile = {
      id: data.id,
      username: data.user.username,
      displayName: data.display_name || data.user.username,
      bio: data.bio || "",
      avatarUrl: data.avatar || "/placeholder-user.jpg",
      coverImageUrl: data.cover_image || "/placeholder.jpg",
      followers: data.followers_count || 0,
      following: data.following_count || 0,
      totalPhotos: data.photos_count || 0,
      totalCollections: data.collections_count || 0,
      joinedDate: new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      socialLink:data.social_link
    };
    
    localStorage.setItem("profile_id", data.id);
    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
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

// Get popular users
export async function getPopularUsers(limit = 5): Promise<UserProfile[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/popular-users/?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    // Map API response to UserProfile interface
    return data.map((user: any) => ({
      id: user.id,
      username: user.user.username,
      displayName: user.display_name || user.user.username,
      bio: user.bio || "",
      avatarUrl: user.avatar || "/placeholder-user.jpg",
      coverImageUrl: user.cover_image || "/placeholder.jpg",
      followers: user.followers_count || 0,
      following: user.following_count || 0,
      totalPhotos: user.photos_count || 0,
      totalCollections: user.collections_count || 0,
      joinedDate: new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      socialLinks: {
        website: user.social_link?.website,
        twitter: user.social_link?.twitter,
        instagram: user.social_link?.instagram,
      }
    }));
  } catch (error) {
    console.error("Error fetching popular users:", error);
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
