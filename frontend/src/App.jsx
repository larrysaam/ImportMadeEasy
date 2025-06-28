import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from '@/pages/Home';
import Collection from '@/pages/Collection';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Product from '@/pages/Product';
import Cart from '@/pages/Cart';
import Login from "@/pages/Login";
import Placeorder from "@/pages/Placeorder";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsAndConditions from "@/pages/TermsAndConditions";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/layout/SearchBar";
import BottomNavbar from "@/components/layout/BottomNavbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Toaster } from 'sonner'
import Verify from "@/pages/Verify";
import NotFound from '@/components/NotFound'
import Signup from "@/pages/Signup";
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import OrderSuccess from '@/pages/OrderSuccess';
import DeliveryOptions from '@/pages/DeliveryOptions';
import Affiliate from '@/pages/Affiliate';
import AffiliateDashboard from '@/pages/AffiliateDashboard';
import ReferralBanner from '@/components/ReferralBanner';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import PWADebugger from '@/components/PWADebugger';

const App = () => {
  const { pathname } = useLocation();


  //scroll to top of the page on location changes
  useEffect(() => {
      window.scrollTo({top: 0, left: 0, behavior: 'smooth' });
}, [pathname]);

  return (
    <div className="">
      <Toaster richColors closeButton/>
        <OfflineIndicator />
        <ReferralBanner />
        <Navbar />
        <SearchBar />
          <Routes>
            <Route path='/' element={<Home/>} />
            <Route path='/collection' element={<Collection/>} />
            <Route path='/about' element={<About/>} />
            <Route path='/contact' element={<Contact/>} />
            <Route path='/product/:productId' element={<Product/>} />
            <Route path='/cart' element={<Cart/>} />
            <Route path='/login' element={<Login/>} />
            <Route path='/signup' element={<Signup/>} />
            <Route path='/place-order' element={<Placeorder/>} />
            <Route path='/orders' element={<Orders/>} />
            <Route path='/profile' element={<Profile/>} />
            <Route path='/privacy-policy' element={<PrivacyPolicy/>} />
            <Route path='/terms-and-conditions' element={<TermsAndConditions/>} />
            <Route path='/verify' element={<Verify/>} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/delivery-options" element={<DeliveryOptions />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
            <Route path='*' element={<NotFound/>} />
          </Routes>
        <Footer/>
        <BottomNavbar />
        <WhatsAppButton />
        <PWAInstallPrompt />
        <PWADebugger />
    </div>
  )
}

export default App
