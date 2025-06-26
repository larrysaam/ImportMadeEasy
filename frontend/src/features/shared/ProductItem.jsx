import React, { useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { Link } from 'react-router-dom'

const ProductItem = ({id, image, name, price, preorder}) => {
    const { currency } = useContext(ShopContext)

    return (
        <Link to={`/product/${id}`} className='text-gray-700 cursor-pointer group relative' >
            <div className='overflow-hidden rounded-xl relative'>
                <img 
                    src={image[0]} 
                    className='w-full aspect-square transition-all duration-300 ease-in-out group-hover:scale-[115%] object-cover'
                    alt=''
                />
                {preorder && (
                    <div className='absolute top-2 right-2 bg-black text-white px-3 py-1 rounded-full text-sm font-medium'>
                        Pre-order
                    </div>
                )}
                {console.log('preorder ', preorder)}
            </div> 
            <p className='pt-3 pb-1 text-lg'>{name}</p>
            <p className='text-lg font-medium'>{currency} {price?.toLocaleString('fr-CM')}</p>
        </Link>
    )
}

export default ProductItem