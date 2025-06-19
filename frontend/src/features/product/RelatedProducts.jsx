import React, { useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import Title from '@/components/Title'
import ProductItem from '@/features/shared/ProductItem'

const RelatedProducts = ({ category, subcategory, id }) => {
    const { products } = useContext(ShopContext)

    const relatedProducts = products
        .filter((item) => item.category === category && item.subcategory === subcategory && item._id !== id)
        .slice(0, 5)

    return (
        <div className='my-24'>
            <div className='text-center text-3xl py-2'>
                <Title text1='RELATED' text2='PRODUCTS' />
            </div>
            {relatedProducts.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                    {relatedProducts.map((item) => (
                        <ProductItem key={item._id} id={item._id} image={item.image} name={item.name} price={item.price} />
                    ))}
                </div>
            ) : (
                <div className='w-full text-center mt-8'>
                    Sorry, seems you are looking at a unique product! There are no related products.
                </div>
            )}
        </div>
    )
}

export default RelatedProducts
