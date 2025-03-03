import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import LazyImage from "../../ui/LazyImage/LazyImage";

const ImageCard = ({ image }) => {
  return (
    <div className="relative group overflow-hidden rounded-lg">
      <Link to={`/image/${image.id}`}>
        <LazyImage
          src={image.url}
          alt={image.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="text-white text-lg font-semibold">{image.title}</h3>
          <p className="text-white/80 text-sm">{image.author}</p>
        </div>
      </Link>
    </div>
  );
};

// ✅ Khai báo PropTypes để tránh lỗi ESLint
ImageCard.propTypes = {
  image: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
  }).isRequired,
};

export default ImageCard;
