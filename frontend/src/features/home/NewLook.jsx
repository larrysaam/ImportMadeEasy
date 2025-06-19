import React from 'react';
import { assets } from '@/assets/assets'
import LookCard from '@/components/LookCard';

const NewLook = () => {
  const looks = [
    {
      id: 1,
      image: assets.hero1,
      label: 'Shop the Look',
    },
    {
      id: 2,
      image: assets.Nike1,
      label: 'Shop the Look',
    },
    {
      id: 3,
      image: assets.Nike2,
      label: 'Shop the Look',
    },
  ];

  return (
    <div className="my-10 pr-2 pl-2 sm:pr-10 sm:pl-10 lg:pr-16 lg:pl-16">   
      <div className="text-center py-8 text-3xl">
        <h2 className="font-bold">NEW LOOKS</h2>
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Discover the latest styles and trends curated just for you.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {looks.map((look) => (
          <LookCard key={look.id} image={look.image} label={look.label} />
        ))}
      </div>
    </div>
  );
};

export default NewLook;