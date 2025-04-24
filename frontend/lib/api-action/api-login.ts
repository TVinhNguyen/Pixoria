import API_BASE_URL from "../api-config"

export async function handleLoginClick(username: string, password: string) {
    const formData = new FormData()
    formData.append("username", username)
    formData.append("password", password)
    const response_token = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        body: formData,
    })
    const data_token = await response_token.json()
    if (response_token.ok) {
        localStorage.setItem("token", data_token.access)
        localStorage.setItem("username", username)
        return data_token
    }
    return null
}

export async function handleLogout() {
    try {
        // Log before clearing to check what's stored
        console.log("Before logout - localStorage items:", {
            token: !!localStorage.getItem("token"),
            username: localStorage.getItem("username"),
            profile_id: localStorage.getItem("profile_id"),
            user_id: localStorage.getItem("user_id")
        });
        
        const token = localStorage.getItem("token");
        
        // Only call the backend if we have a token
        if (token) {
            try {
                await fetch(`${API_BASE_URL}/auth/logout/`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
            } catch (apiError) {
                console.error("Backend logout failed:", apiError);
                // Continue with client-side logout even if API call fails
            }
        }
    } catch (error) {
        console.error("Logout process error:", error);
    } finally {
        // Clear ALL possible auth-related items
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("userProfile");
        localStorage.removeItem("profile_id");
        localStorage.removeItem("user_id");
        localStorage.removeItem("theme"); // Only if theme is user-specific
        
        // Additional items found in your localStorage dump
        localStorage.removeItem("ally-supports-cache");
        
        // Log after clearing to verify
        console.log("After logout - localStorage items:", {
            token: !!localStorage.getItem("token"),
            username: localStorage.getItem("username"),
            profile_id: localStorage.getItem("profile_id"),
            user_id: localStorage.getItem("user_id")
        });
        
        // Force redirect to ensure all components re-render in logged-out state
        window.location.href = "/login"; // or your home page
    }
    
    return true;
}