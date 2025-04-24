import { useState, useEffect } from "react";
import API_BASE_URL from "../lib/api-config";

// Interface cho dữ liệu tác giả
interface Author {
  user_id: number;
  username: string;
  name: string;
  avatar: string | null;
}

// Interface cho danh mục
interface Category {
  id: number;
  name: string;
  slug: string;
}

// Interface cho dữ liệu từ API
interface ApiImageData {
  id: number;
  file: string; // URL của ảnh
  title: string;
  description: string;
  username: string;
  author: Author;
  created_at: string;
  time_since: string;
  is_public: boolean;
  likes: number;
  downloads: number;
  likes_count: number;
  downloads_count: number;
  categories: Category[];
  is_liked: boolean;
}

// Interface cho dữ liệu sau khi chuyển đổi để đảm bảo tương thích
// Đổi tên từ ImageData thành AppImageData để tránh xung đột
export interface AppImageData {
  id: number;
  file: string;       // URL từ API mới
  src: string;        // Tương thích ngược với code cũ
  alt: string;
  width: number;
  height: number;
  title: string;
  description?: string;
  username: string;
  author: Author;
  created_at: string;
  time_since: string;
  likes: number;
  downloads: number;
  likes_count: number;
  downloads_count: number;
  categories: Category[];
  is_liked: boolean;
  is_public: boolean;
}

interface ApiResponse {
  results: ApiImageData[];
  count: number;
}

const useFetchImages = (currentPage: number, limit: number = 12) => {
  const [images, setImages] = useState<AppImageData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/images/public_images/?page=${currentPage}&limit=${limit}`, {
          method: "GET"
        });
        if (!response.ok) {
          throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        console.log("Data fetched:", data);
        
        const formattedImages: AppImageData[] = data.results.map(img => ({
          id: img.id,
          file: img.file,
          src: img.file, // Đảm bảo tương thích ngược
          alt: img.title || "Image", 
          width: 500,  // Giá trị mặc định, API có thể không trả về
          height: 500, // Giá trị mặc định, API có thể không trả về
          title: img.title || "",
          description: img.description || "",
          username: img.username || "",
          // Đảm bảo có thông tin tác giả đầy đủ
          author: img.author || {
            user_id: 0,
            username: img.username || "user",
            name: img.title ? `Author of ${img.title}` : "Unknown",
            avatar: null
          },
          created_at: img.created_at,
          time_since: img.time_since || "Recently",
          likes: img.likes || 0,
          downloads: img.downloads || 0,
          likes_count: img.likes_count || img.likes || 0,
          downloads_count: img.downloads_count || img.downloads || 0,
          categories: img.categories || [],
          is_liked: img.is_liked,
          is_public: img.is_public
        }));
        
        console.log("Formatted images:", formattedImages);
        setImages(formattedImages);
        setTotalPages(Math.ceil(data.count / limit));
      } catch (error) {
        console.error("Lỗi khi fetch ảnh:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [currentPage, limit]);

  return { images, totalPages, isLoading };
};

export default useFetchImages;
export type { AppImageData as ImageData, Author, Category };