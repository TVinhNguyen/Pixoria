import API_BASE_URL from "../api-config"

export interface Category {
    id: number;
    name: string;
    slug: string;
}

/**
 * Tải danh sách categories từ máy chủ
 */
export async function fetchCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    })
    
    if (!response.ok) {
        throw new Error("Failed to fetch categories")
    }
    
    const data = await response.json()
    
    // Ensure we always return an array of categories
    if (Array.isArray(data)) {
        return data
    } else if (data && typeof data === 'object' && data.results && Array.isArray(data.results)) {
        // Handle case where API returns { results: [...categories] }
        return data.results
    } else if (data && typeof data === 'object') {
        // Handle unexpected API response format by extracting values or returning empty array
        console.warn('Unexpected categories API response format:', data)
        const possibleCategories = Object.values(data).find(val => Array.isArray(val))
        return Array.isArray(possibleCategories) ? possibleCategories : []
    }
    
    return []
}

/**
 * Upload một hoặc nhiều ảnh lên server với thông tin và categories
 */
export async function uploadImages(
    files: File[], 
    title: string, 
    description: string, 
    categories: number[],
    isPublic: boolean = true,
    tags?: string
) {
    const formData = new FormData()
    
    // Thêm thông tin cơ bản
    formData.append("title", title)
    formData.append("description", description)
    formData.append("is_public", String(isPublic))
    
    // Thêm từng file ảnh
    files.forEach(file => {
        formData.append("file", file)
    })
    
    // Thêm các category
    categories.forEach(categoryId => {
        formData.append("categories", categoryId.toString())
    })
    
    // Thêm tags nếu có
    if (tags) {
        formData.append("tags", tags)
    }
      const response = await fetch(`${API_BASE_URL}/images/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("token") : ''}`,
        },
        body: formData,
    })
    
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
}
