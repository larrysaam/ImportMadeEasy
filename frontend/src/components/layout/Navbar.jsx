import React, { useContext, useState, useEffect } from 'react'
import { MdOutlineArrowRightAlt, MdOutlineKeyboardBackspace } from "react-icons/md";
import { Link, NavLink } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { assets } from '@/assets/assets'
import { ShopContext } from '@/context/ShopContext'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false) // State to toggle sidebar
  const [showNavbar, setShowNavbar] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [categories, setCategories] = useState({
    'All Products': {
      subcategories: ['']
    },
    Men: { subcategories: [] },
    Women: { subcategories: [] },
    Kids: { subcategories: [] }
  })
  const [isLoading, setIsLoading] = useState(true)
  const { showSearch, setShowSearch, search, setSearch, getCartCount, navigate, token, setToken } = useContext(ShopContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    navigate('/')
    toast.success('Successfully logged out')
  }

  const location = useLocation()

  // Check if navbar should be visible on mobile (only homepage and collection page)
  const shouldShowOnMobile = location.pathname === '/' || location.pathname.includes('/collection')

  // Enable search functionality when on collection page
  useEffect(() => {
    if (location.pathname.includes('collection')) {
      setShowSearch(true)
    } else {
      setShowSearch(false)
      setSearch('')
    }
  }, [location.pathname, setShowSearch, setSearch])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY) {
        setShowNavbar(false) // Hide navbar when scrolling down
      } else {
        setShowNavbar(true) // Show navbar when scrolling up
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/categories/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        }
      })
      const data = await response.json()

      console.log('Fetched categories:', data)

      if (data.success) {
        // Transform backend data to match our structure
        const formattedCategories = {
          'All Products': categories['All Products'],
          ...Object.keys(data.categories).reduce((acc, mainCat) => {
            acc[mainCat] = {
              subcategories: data.categories[mainCat].subcategories.map(sub => ({
                name: sub.name,
                subcategories: sub.subcategories || []
              }))
            };
            return acc;
          }, {})
        };
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
  };

  const renderSubcategories = (category) => {
    if (category === 'All Products') return null;
    
    return (
      <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 
                    transition-all duration-300 left-1/2 -translate-x-1/2 pt-5 w-screen bg-white shadow-lg">
        <div className="container mx-auto px-16 py-8">
          <div className="grid grid-cols-4 gap-8">
            {categories[category].subcategories.map((firstLevel) => (
              <div key={firstLevel.name} className="flex flex-col gap-4">
                {/* First level subcategory as heading */}
                <Link 
                  to={`/collection?category=${category}&subcategory=${firstLevel.name}`}
                  className="font-medium text-black hover:text-gray-700"
                >
                  {firstLevel.name}
                </Link>
                {/* Second level subcategories */}
                <div className="flex flex-col gap-2">
                  {firstLevel.subcategories.map((secondLevel) => (
                    <Link
                      key={secondLevel}
                      to={`/collection?category=${category}&subcategory=${firstLevel.name}&second=${secondLevel}`}
                      className="text-gray-600 hover:text-black text-sm"
                    >
                      {secondLevel}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Add a spacer div to prevent the navbar from overlapping the content */}
      <div className={`h-[80px] ${shouldShowOnMobile ? '' : 'sm:block hidden'}`}></div> {/* Adjust the height to match the navbar's height */}
      <div
        id="google_translate_element"
        className={`fixed top-0 left-0 w-full pl-2 pr-2 sm:pl-16 sm:pr-16 z-50 bg-white transition-transform duration-300 ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
        } ${shouldShowOnMobile ? '' : 'sm:block hidden'}`}
      >
        {/* Desktop Navbar */}
        <div className='hidden sm:flex items-center justify-between py-5 font-medium'>
          <Link to='/' className='cursor-pointer'>
            <img src={assets.IMELogo} alt='logo' className='w-16 sm:w-18' />
          </Link>

          <ul className='flex gap-5 text-sm text-black'>
            {Object.keys(categories).map((category) => (
              <div key={category} className="group relative">
                <NavLink 
                  to={category === 'All Products' ? '/collection' : '#'} 
                  className='flex flex-col text-[16px] items-center gap-1'
                  onClick={(e) => {
                    if (category !== 'All Products') {
                      e.preventDefault();
                    }
                  }}
                >
                  <p>{category}</p>
                  <hr className='w-3/4 border-none h-[2px] bg-brand scale-0 transition-all duration-500 group-hover:scale-100' />
                </NavLink>
                {renderSubcategories(category)}
              </div>
            ))}
          </ul>

          <div className='flex items-center gap-6'>
            {/* Language toggle button */}
            <button 
              onClick={toggleLanguage}
              className='px-2 py-1 text-sm border border-brand text-brand rounded hover:bg-brand hover:text-white transition-colors'
            >
              {i18n.language === 'en' ? 'FR' : 'EN'}
            </button>

            {/* pre-order button */}
            {/* <button className='w-40 h-8 hidden sm:block rounded-full bg-brand text-white text-sm hover:bg-brand-dark transition-colors'>
              <Link to="/collection?preorder=true">
                <span>{t('preorder_now')}</span>
                <MdOutlineArrowRightAlt className='inline-block ml-2 bg-white text-brand rounded-full w-5 h-5' />
              </Link>
            </button> */}
           

            {/* Search icon - only visible on collection page */}
            {location.pathname.includes('collection') && (
              <img
                src={assets.search}
                alt='search-icon'
                className='w-5 cursor-pointer transition-all duration-300 hover:scale-[125%]'
                onClick={() => {
                  showSearch ? setShowSearch(!showSearch) : setTimeout(() => setShowSearch(!showSearch), 200)
                }}
              />
            )}
            <div className='group relative'>
              <img
                onClick={() => (token ? null : navigate('/login'))}
                src={assets.profile}
                alt='profileIcon'
                className='w-5 cursor-pointer transition-all duration-300 group-hover:scale-[125%]'
              />
              {/* Dropdown Menu */}
              {token && (
                <div
                  className='absolute right-0 pt-4 
                      transition-all duration-300 ease-in-out 
                      opacity-0 group-hover:opacity-100 
                      translate-y-[-10px] group-hover:translate-y-0 z-10
                      invisible group-hover:visible'
                >
                  <div
                    className='flex flex-col w-32 border bg-white
                          text-gray-600'
                  >
                    <p
                      onClick={() => (token ? navigate('/profile'): navigate('/login'))}
                      className='cursor-pointer hover:text-black hover:bg-gray-100 duration-300 py-2 px-5'
                    >
                      {t('my_profile')}
                    </p>
                    <p
                      onClick={() => navigate('/orders')}
                      className='cursor-pointer hover:text-black hover:bg-gray-100 duration-300 py-2 px-5'
                    >
                      {t('orders')}
                    </p>
                    <p
                      className='cursor-pointer hover:text-black py-2 px-5 hover:bg-gray-100 duration-300'
                      onClick={logout}
                    >
                      {t('logout')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => (navigate('/cart'))}
              className='relative transition-all duration-300 hover:scale-[125%]'
            >
              <img src={assets.cart} alt='cartIcon' className='w-5 min-w-5 ' />
              <p
                className='absolute -right-[5px] -bottom-[5px] w-4 text-center
                  leading-4 bg-brand text-white aspect-square rounded-full text-[10px]'
              >
                {getCartCount()}
              </p>
            </button>
            <img
              src={assets.burger}
              onClick={() => setVisible(true)}
              alt='menu-icon'
              className='w-5 cursor-pointer'
            />
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className='sm:hidden flex items-center justify-between py-3 px-4 font-medium'>
          {/* Logo */}
          <Link to='/' className='cursor-pointer flex-shrink-0'>
            <img src={assets.IMELogo} alt='logo' className='w-12' />
          </Link>

          {/* Search Input - Always visible on mobile */}
          <div className='flex-1 mx-3'>
            <div className='flex items-center justify-center border border-gray-300
              px-3 py-2 bg-gray-50 rounded-full relative'>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  // Enable search functionality when user types on collection page
                  if (location.pathname.includes('collection')) {
                    setShowSearch(true)
                  }
                }}
                type='text'
                placeholder='Search by name or keywords...'
                className='flex-1 outline-none bg-inherit text-sm placeholder-gray-500'
              />
              {search && (
                <img
                  onClick={() => {
                    setSearch('')
                    setShowSearch(false)
                  }}
                  src={assets.cross}
                  alt='clear-search'
                  className='w-3 cursor-pointer ml-2'
                />
              )}
            </div>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => (navigate('/cart'))}
            className='relative transition-all duration-300 hover:scale-[125%] flex-shrink-0'
          >
            <img src={assets.cart} alt='cartIcon' className='w-5 min-w-5' />
            <p
              className='absolute -right-[5px] -bottom-[5px] w-4 text-center
                leading-4 bg-brand text-white aspect-square rounded-full text-[10px]'
            >
              {getCartCount()}
            </p>
          </button>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 right-0 w-full h-full bg-white z-50 transition-transform duration-300 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='p-5'>
          <button
            onClick={() => setVisible(false)}
            className='flex items-center justify-center text-brand text-lg font-bold'
          >
            <MdOutlineKeyboardBackspace className='size-6 mx-2'/> 
            <span>{t('go_back')}</span>
          </button>
          <ul className='mt-5 flex flex-col gap-4'>
            <NavLink to='/' onClick={() => setVisible(false)} className='py-2 pl-6 border-t hover:text-brand'>
              {t('home')}
            </NavLink>
            <NavLink to='/collection' onClick={() => setVisible(false)} className='py-2 pl-6 border-t hover:text-brand'>
              {t('collection')}
            </NavLink>
            <NavLink to='/about' onClick={() => setVisible(false)} className='py-2 pl-6 border-t hover:text-brand'>
              {t('about')}
            </NavLink>
            <NavLink to='/contact' onClick={() => setVisible(false)} className='py-2 pl-6 border-t hover:text-brand'>
              {t('contact')}
            </NavLink>
          </ul>
        </div>
      </div>
    </>
  )
}

export default Navbar
