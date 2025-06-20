import React from 'react';

const LookCard = ({ image, label }) => {
  return (
    <div className="relative group">
      <img
        src={image}
        alt={label}
        className="w-full h-[600px] object-cover rounded-lg hover:scale-105 transition-transform duration-300"
      />
      <button
        className="absolute bottom-4 left-4 bg-white text-black px-4 py-2 rounded-full flex items-center gap-2 opacity-100  transition-opacity duration-300"
      >
        <span className="material-icons"></span>
        {label}
      </button>
    </div>
  );
};

export default LookCard;