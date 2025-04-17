import API_BASE_URL from "../api-config"

// Response interfaces to match the API structure
interface FollowResponse {
  count: number
  next: string | null
  previous: string | null
  results: FollowResult[]
}

interface FollowResult {
  id: number
  follower: number
  following: number
  created_at: string
  follower_details: UserDetails
  following_details: UserDetails
}

interface UserDetails {
  id: number
  user_id: number
  username: string
  avatar: string
}

// Function to check if the current user follows the target user
export async function checkFollowStatus(targetUserId: number): Promise<boolean> {
    try {
        const token = localStorage.getItem("token")
        if (!token) {
            return false
        }

        const currentUserId = localStorage.getItem("user_id")
        if (!currentUserId) {
            return false
        }

        // Get the current user's follow data
        const response = await fetch(`${API_BASE_URL}/follows/?follower=${currentUserId}&following=${targetUserId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (response.ok) {
            const data: FollowResponse = await response.json()
            return data.results.length > 0
        }
        return false
    } catch (error) {
        console.error("Error checking follow status:", error)
        return false
    }
}

// Function to toggle follow/unfollow
export async function toggleFollow(targetUserId: number) {
    try {
        const token = localStorage.getItem("token")
        if (!token) {
            throw new Error("Authentication required")
        }

        const response = await fetch(`${API_BASE_URL}/follows/toggle/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                following: targetUserId
            }),
        })

        const data = await response.json()
        if (response.ok) {
            return {
                success: true,
                action: data.action, // 'follow' or 'unfollow'
                message: data.message
            }
        } else {
            throw new Error(data.error || "Failed to toggle follow status")
        }
    } catch (error: any) {
        console.error("Error toggling follow:", error)
        return {
            success: false,
            error: error?.message || "An error occurred while toggling follow"
        }
    }
}

// Get followers count
export async function getFollowersCount(userId: number): Promise<number> {
    try {
        const response = await fetch(`${API_BASE_URL}/follows/?following=${userId}`, {
            method: "GET",
        })
        
        if (response.ok) {
            const data: FollowResponse = await response.json()
            return data.count
        }
        return 0
    } catch (error) {
        console.error("Error getting followers count:", error)
        return 0
    }
}

// Get following count
export async function getFollowingCount(userId: number): Promise<number> {
    try {
        const response = await fetch(`${API_BASE_URL}/follows/?follower=${userId}`, {
            method: "GET",
        })
        
        if (response.ok) {
            const data: FollowResponse = await response.json()
            return data.count
        }
        return 0
    } catch (error) {
        console.error("Error getting following count:", error)
        return 0
    }
}

// Get user followers
export async function getUserFollowers(userId: number, page = 1, pageSize = 10) {
    try {
        const response = await fetch(`${API_BASE_URL}/follows/?following=${userId}&page=${page}&page_size=${pageSize}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        })
        
        if (response.ok) {
            const data: FollowResponse = await response.json()
            return {
                total: data.count,
                followers: data.results.map(item => item.follower_details),
                next: data.next,
                previous: data.previous
            }
        }
        return { total: 0, followers: [], next: null, previous: null }
    } catch (error) {
        console.error("Error getting user followers:", error)
        return { total: 0, followers: [], next: null, previous: null }
    }
}

// Get user following
export async function getUserFollowing(userId: number, page = 1, pageSize = 10) {
    try {
        const response = await fetch(`${API_BASE_URL}/follows/?follower=${userId}&page=${page}&page_size=${pageSize}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        })
        
        if (response.ok) {
            const data: FollowResponse = await response.json()
            return {
                total: data.count,
                following: data.results.map(item => item.following_details),
                next: data.next,
                previous: data.previous
            }
        }
        return { total: 0, following: [], next: null, previous: null }
    } catch (error) {
        console.error("Error getting user following:", error)
        return { total: 0, following: [], next: null, previous: null }
    }
}