import React from 'react'
import Title from '@/components/Title'
import NewsletterBox from '@/features/shared/NewsletterBox'
import { assets } from '@/assets/assets'

const About = () => {
  return (
    <div className='px-4 sm:px-14 animate-fade animate-duration-500'>
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1='ABOUT' text2='US'/>
      </div>  

      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <div className='md:flex-1' >
          <img className='w-full aspect-square' src={assets.IMELogo} alt='about'/>
        </div>

        <div className='md:flex-1 flex flex-col justify-center gap-6 text-gray-600'>
          <p><b className='text-lg'>Welcome</b> to our Clothing Shop, your go-to destination for stylish and high-quality clothing! We are passionate about fashion and believe that everyone deserves to look and feel their best.</p>
          <p>Here, we offer a carefully curated selection of trendy apparel for men, women, and kids. Whether you're looking for casual wear, office outfits, or something special for an occasion, we've got you covered. Our collections are designed to combine comfort, quality, and the latest fashion trends at affordable prices.</p>
          <b className='text-gray-800'>Our Mission</b>
          <p>Our mission is to make fashion accessible to everyone by offering stylish, high-quality clothing at fair prices. We believe that confidence starts with how you dress, and we strive to provide outfits that make you look and feel great. Sustainability and ethical production are at the heart of our values, ensuring that every piece you wear is crafted with care and responsibility.</p>
        </div>
      </div>

      <div className='text-2xl py-4'>
        <Title text1='WHY' text2='CHOOSE US'/>
      </div>
      
      <div className='flex flex-col md:flex-row text-sm mb-20'>
        <div className='border px-10 md:px-12 py-6 sm:py-10 flex flex-col justify-start gap-5'>
          <div className='flex items-center'>
            <img className='w-10' src={assets.qualityImg} alt=''/>
            <b className='text-lg ml-2'>Quality Assurance:</b>
          </div>
          <p className='text-gray-600 pl-2'>We are committed to providing only the best quality clothing, using premium fabrics and precise craftsmanship. Every item in our collection is carefully selected and tested to meet our high standards, ensuring durability, comfort, and long-lasting style.</p>
        </div>
        <div className='border-x md:border-x-0 md:border-y px-10 md:px-12 py-6 sm:py-10 flex flex-col justify-start gap-5'>
          <div className='flex items-center'>
            <img className='w-10' src={assets.exchangeImg} alt=''/>
            <b className='text-lg ml-2'>Convenience:</b>
          </div>
          <p className='text-gray-600'>Shopping with us is simple, fast, and hassle-free. With an intuitive website, secure payment options, and quick delivery, you can browse and shop from the comfort of your home. Whether you're on your phone or laptop, we bring fashion straight to your doorstep.</p>
        </div>
        <div className='border px-10 md:px-12 py-6 sm:py-10 flex flex-col justify-start gap-5'>
          <div className='flex items-center'>
            <img className='w-10' src={assets.supportImg} alt=''/>
            <b className='text-lg ml-4'>Exceptional Service:</b>
          </div>
          <p className='text-gray-600'>Customer satisfaction is our top priority. Our dedicated support team is always ready to assist you with any inquiries, ensuring a seamless shopping experience. From easy returns to personalized recommendations, we go the extra mile to make your journey with us exceptional.</p>
        </div>
      </div>

      <NewsletterBox />
    </div>
  )
}

export default About