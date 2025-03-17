import API_BASE_URL from "../api-config"

const fetchImages = async (page: number, perPage: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/images/?page=${page}&limit=${perPage}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch images")
    }

    const data = await response.json()

    return data.map((image: any) => ({
      id: image.id,
      src: image.url, // Giả sử API trả về đường dẫn ảnh
      alt: image.alt || `Image ${image.id}`,
      width: image.width || 300, // Giá trị mặc định nếu API không trả về
      height: image.height || 250,
    }))
  } catch (error) {
    console.error("Error fetching images:", error)
    return []
  }
}
