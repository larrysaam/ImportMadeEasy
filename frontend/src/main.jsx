import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext.jsx'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './i18n/config';
import { registerServiceWorker, setupNetworkStatusHandling } from './utils/pwa.js';


const queryClient = new QueryClient();


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </QueryClientProvider>
  </BrowserRouter>,

)

// Initialize PWA features
if (typeof window !== 'undefined') {
  // Register service worker
  registerServiceWorker()

  // Setup network status handling
  setupNetworkStatusHandling()

  // Log PWA status
  console.log('PWA features initialized')
}
