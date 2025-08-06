import React, { useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { Link } from 'react-router-dom'

const ProductItem = ({id, image, name, price, strikethrough_price, preorder}) => {
    const { currency } = useContext(ShopContext)

    return (
        <Link to={`/product/${id}`} className='text-gray-700 cursor-pointer group relative block' >
            <div className='overflow-hidden rounded-xl relative'>
                <img 
                    src={image[0]} 
                    className='w-full aspect-square transition-all duration-300 ease-in-out group-hover:scale-[115%] object-cover'
                    alt=''
                />
                {preorder && (
                    <div className='absolute top-2 right-2 bg-black text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium'>
                        Pre-order
                    </div>
                )}
                {console.log('preorder ', preorder)}
            </div>
            <p className='pt-2 sm:pt-3 pb-1 text-sm sm:text-base lg:text-lg leading-snug'>{name}</p>
                        <div>
                <p className='text-sm sm:text-base lg:text-lg font-medium text-brand'>{currency} {price?.toLocaleString('fr-CM')}</p>
                {strikethrough_price && (
                    <p className='text-xs sm:text-xs lg:text-sm font-light text-gray-500 line-through'>
                        {currency} {strikethrough_price?.toLocaleString('fr-CM')}
                    </p>
                )}
            </div>
        </Link>
    )
}

export default ProductItem