import { useNavigate } from 'react-router-dom';

const Banner = ({ settings }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (settings.link.productId) {
      navigate(`/product/${settings.link.productId}`);
    } else if (settings.link.category) {
      let url = `/collection?category=${settings.link.category}`;
      if (settings.link.subcategory) {
        url += `&subcategory=${settings.link.subcategory}`;
        if (settings.link.subsubcategory) {
          url += `&second=${settings.link.subsubcategory}`;
        }
      }
      navigate(url);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer relative"
    >
      {settings.images.banner && (
        <img
          src={settings.images.banner}
          alt={settings.text.banner}
          className="w-full h-auto"
        />
      )}
      {settings.text.banner && (
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-white text-2xl font-bold">
            {settings.text.banner}
          </h2>
        </div>
      )}
    </div>
  );
};

export default Banner;