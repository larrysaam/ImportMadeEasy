import React from 'react'
import { useTranslation } from 'react-i18next';

const NewsletterBox = () => {
  const { t } = useTranslation();
  const onSubmitHandler = (event) => {
    event.preventDefault();
    
  }

  return (
    <div className="bg-gray-100 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-medium mb-4">{t('newsletter_title')}</h2>
        <p className="text-gray-600 mb-8">{t('newsletter_desc')}</p>
        <form onSubmit={onSubmitHandler} className='max-w-md mx-auto flex items-center gap-3 my-6 border pl-3'>
          <input className='w-full px-4 py-2 rounded-l outline-none' type='email' 
          placeholder={t('email_placeholder')} required/>
          <button type='submit' className='bg-black text-white text-xs px-6 py-2 rounded-r transistion-all duration-500 hover:bg-slate-700'>
            {t('subscribe')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewsletterBox