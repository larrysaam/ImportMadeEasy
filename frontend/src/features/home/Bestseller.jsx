import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '@/context/ShopContext'
import Title from '@/components/Title'
import ProductItem from '@/features/shared/ProductItem'
import { useTranslation } from 'react-i18next';

const Bestseller = () => {
    const { t } = useTranslation();
    const { products } = useContext(ShopContext)
    const [ bestSeller, setBestSeller ] = useState([])

    useEffect(() => {
        const bestProduct = products.filter((item) => (item.bestseller));
        setBestSeller(bestProduct.slice(0,8))
    },[products])


  return (
    <div className='my-10 mx-2 sm:mx-10 lg:mx-16 '>
        <div className='text-center text-3xl py-8'>
            <Title text1={t('bestsellers')} />
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
            {
                bestSeller.map((item, index) => {
                return (
                    <ProductItem key={index} id={item._id} name={item.name} image={item.image} price={item.price} />
                )})
            }
        </div>
    </div>
  )
}

export default Bestseller