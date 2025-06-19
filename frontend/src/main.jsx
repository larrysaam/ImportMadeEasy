import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext.jsx'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './i18n/config';


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
