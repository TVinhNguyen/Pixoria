import API_BASE_URL from "../api-config";

// Cải thiện interface VisualSearchResult để tương thích với ImageData trong ImageGrid
export interface VisualSearchResult {
    id: string | number;  // Có thể là string hoặc number để linh hoạt hơn
    url: string;
    src?: string;
    title: string;
    alt?: string;
    similarity: number;
    width?: number;
    height?: number;
    description?: string;
    likes?: number;
    downloads?: number;
    user?: string;
    created_at?: string;
}

export async function searchByImage(imageFile: File): Promise<VisualSearchResult[]> {
  try {
    // Lấy token xác thực từ localStorage nếu có
    const token = localStorage.getItem("token");
    
    // Chuẩn bị form data với file ảnh
    const formData = new FormData();
    formData.append("image_file", imageFile);
    formData.append("top_k", "20"); // Số lượng kết quả mong muốn
    
    // Chuẩn bị headers
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Gọi API
    const response = await fetch(`${API_BASE_URL}/image-search/upload/`, {
      method: "POST",
      headers,
      body: formData,
    });
    
    // Kiểm tra response
    if (!response.ok) {
      // Xử lý lỗi từ server
      const errorText = await response.text();
      let errorMessage = "Có lỗi xảy ra khi tìm kiếm ảnh tương tự";
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Nếu response không phải JSON, sử dụng errorText
        errorMessage = errorText || errorMessage;
      }
      
      console.error("Search API error:", errorText);
      throw new Error(errorMessage);
    }
    
    // Phân tích kết quả trả về
    const data = await response.json();
    
    console.log("Raw API response:", data);
    
    // Chuyển đổi kết quả từ API thành định dạng VisualSearchResult
    const results: VisualSearchResult[] = data.results.map((item: any) => {
      // Kiểm tra nếu item.id đã là số
      const itemId = typeof item.id === 'number' 
          ? item.id 
          : item.id 
              ? item.id.toString() 
              : `temp-${Math.random().toString(36).substring(2, 11)}`;
      
      return {
        id: itemId,
        url: item.file, // URL của ảnh
        src: item.file, // Thêm src để phù hợp với ImageGrid
        alt: item.title || "Search result image",
        title: item.title || "",
        width: item.width || 500, // Giá trị mặc định
        height: item.height || 500, // Giá trị mặc định
        description: item.description || "",
        similarity: item.similarity || 0,
        likes: item.likes || 0,
        downloads: item.downloads || 0,
        user: item.user || "",
        created_at: item.created_at || null,
      };
    });
    
    console.log("Processed search results:", results);
    return results;
  } catch (error) {
    console.error("Error in searchByImage:", error);
    throw error;
  }
}

export async function searchByImageUrl(imageUrl: string): Promise<VisualSearchResult[]> {
  try {
    // Lấy token xác thực từ localStorage nếu có
    const token = localStorage.getItem("token");
    
    // Chuẩn bị headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Gọi API
    const response = await fetch(`${API_BASE_URL}/image-search/url/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        image_url: imageUrl,
        top_k: 20,
      }),
    });
    
    // Kiểm tra response
    if (!response.ok) {
      // Xử lý lỗi từ server
      const errorText = await response.text();
      let errorMessage = "Có lỗi xảy ra khi tìm kiếm ảnh tương tự";
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      console.error("Search API error:", errorText);
      throw new Error(errorMessage);
    }
    
    // Phân tích kết quả trả về
    const data = await response.json();
    
    // Chuyển đổi kết quả từ API thành định dạng VisualSearchResult
    const results: VisualSearchResult[] = data.results.map((item: any) => {
      // Kiểm tra nếu item.id đã là số
      const itemId = typeof item.id === 'number' 
          ? item.id 
          : item.id 
              ? item.id.toString() 
              : `temp-${Math.random().toString(36).substring(2, 11)}`;
      
      return {
        id: itemId,
        url: item.file, // URL của ảnh
        src: item.file, // Thêm src để phù hợp với ImageGrid
        alt: item.title || "Search result image",
        title: item.title || "Ảnh không có tiêu đề",
        width: item.width || 500, // Giá trị mặc định
        height: item.height || 500, // Giá trị mặc định
        description: item.description || "",
        similarity: item.similarity || 0,
        likes: item.likes || 0,
        downloads: item.downloads || 0,
        user: item.user || "unknown",
        created_at: item.created_at || null,
      };
    });
    
    return results;
  } catch (error) {
    console.error("Error in searchByImageUrl:", error);
    throw error;
  }
}

export async function searchByText(query: string): Promise<VisualSearchResult[]> {
  try {
    const token = localStorage.getItem("token");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/image-search/text/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: query,
        top_k: 20,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Có lỗi xảy ra khi tìm kiếm với từ khóa "${query}"`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }

      console.error("Text search API error:", errorText);
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const results: VisualSearchResult[] = data.results.map((item: any) => {
        const itemId = typeof item.id === 'number'
          ? item.id
          : item.id
            ? item.id.toString()
            : `temp-${Math.random().toString(36).substring(2, 11)}`;

        return {
          id: itemId,
          url: item.file,
          src: item.file,
          alt: item.title || `Kết quả tìm kiếm cho "${query}"`,
          title: item.title || `Kết quả cho "${query}"`,
          width: item.width || 500,
          height: item.height || 500,
          description: item.description || "",
          similarity: item.similarity || 0,
          likes: item.likes || 0,
          downloads: item.downloads || 0,
          user: item.user || "",
          created_at: item.created_at || null,
        };
      });

      return results;
    }

    // ✅ Fix thiếu return
    return [];
  } catch (error) {
    console.error("Error in searchByText:", error);
    throw error;
  }
}
