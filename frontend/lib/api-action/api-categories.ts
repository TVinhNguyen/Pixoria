import API_BASE_URL from "../api-config"

export async function handleGetImagesByCategory(categorySlug: string, page: number = 1, limit: number = 20) {
    try {
        const response = await fetch(`${API_BASE_URL}/images/category/${categorySlug}/?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        
        if (!response.ok) {
            throw new Error(`Failed to fetch images for category: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Return the complete data object which includes:
        // count, next, previous, and results (which contains category and images)
        return data
    } catch (error) {
        console.error("Error fetching category images:", error)
        throw error
    }
}

export async function handleGetCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        
        if (!response.ok) {
            throw new Error("Failed to fetch categories")
        }
        
        return await response.json()
    } catch (error) {
        console.error("Error fetching categories:", error)
        throw error
    }
}

export async function handleGetCategoryBySlug(categorySlug: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categorySlug}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        
        if (!response.ok) {
            throw new Error("Failed to fetch category")
        }
        
        return await response.json()
    } catch (error) {
        console.error("Error fetching category details:", error)
        throw error
    }
}