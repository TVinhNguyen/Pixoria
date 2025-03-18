import { useState, useEffect } from "react";
import API_BASE_URL from "../lib/api-config";

// Interface cho dữ liệu từ API
interface ApiImageData {
  id: number;
  file: string; // URL của ảnh
  title: string;
  description: string;
  created_at: string;
  is_public: boolean;
  likes: number;
  downloads: number;
}

// Interface cho dữ liệu sau khi chuyển đổi
interface ImageData {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
  title: string;
  description?: string;
  created_at?: string;
  likes?: number;
  downloads?: number;
}

interface ApiResponse {
  results: ApiImageData[];
  count: number;
}

const useFetchImages = (currentPage: number, limit: number = 12) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/images/?page=${currentPage}&limit=${limit}`);
        if (!response.ok) {
          throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        console.log("Data fetched:", data);
        
        // Chuyển đổi từ cấu trúc API sang cấu trúc mà component cần
        const formattedImages: ImageData[] = data.results.map(img => ({
          id: img.id,
          src: img.file, // Sử dụng 'file' thay vì 'src'
          alt: img.title || "Image", // Sử dụng 'title' làm alt text
          width: 500, // Giá trị mặc định vì API không cung cấp kích thước
          height: 500, // Giá trị mặc định vì API không cung cấp kích thước
          title: img.title,
          description: img.description,
          created_at: img.created_at,
          likes: img.likes,
          downloads: img.downloads
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