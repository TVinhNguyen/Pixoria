import { useState, useEffect } from "react";
import SearchBar from "../../components/common/SearchBar/SearchBar";
import MasonryGrid from "../../components/common/SearchBar/MasonryGrid";
import { getImages } from "../../services/imageService";

const HomePage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null); // Reset lỗi trước khi tải lại

    try {
      const data = await getImages();
      setImages(data);
    } catch (error) {
      console.error("Error fetching images:", error);
      setError("Không thể tải ảnh, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchImages}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SearchBar />
      <div className="mt-8">
        {images.length > 0 ? (
          <MasonryGrid images={images} />
        ) : (
          <p className="text-center text-gray-500">Không có ảnh nào.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
