import PropTypes from "prop-types";
import Masonry from "react-masonry-css";
import ImageCard from "../ImageCard/ImageCard";

const MasonryGrid = ({ images }) => {
  const breakpointColumns = {
    default: 4,
    1280: 3,
    1024: 2,
    640: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="flex -ml-4 w-auto"
      columnClassName="pl-4 bg-clip-padding"
    >
      {images.map((image) => (
        <div key={image.id} className="mb-4">
          <ImageCard image={image} />
        </div>
      ))}
    </Masonry>
  );
};

// ✅ Thêm prop validation
MasonryGrid.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      url: PropTypes.string.isRequired,
      title: PropTypes.string,
      author: PropTypes.string,
    })
  ).isRequired,
};

export default MasonryGrid;
