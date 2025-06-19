import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      'all_products': 'All Products',
      'men': 'Men',
      'women': 'Women',
      'kids': 'Kids',
      'collection': 'Collection',
      'preorder_now': 'Pre-Order Now',
      'about': 'About',
      'contact': 'Contact',
      'home': 'Home',
      'my_profile': 'My Profile',
      'orders': 'Orders',
      'logout': 'Logout',
      'go_back': 'Go Back',

      // Product Page
      'add_to_cart': 'ADD TO CART',
      'out_of_stock': 'OUT OF STOCK',
      'select_size': 'Select size',
      'items_available': 'items available',
      'original_product': '100% Original Product',
      'cod_available': 'Cash on delivery is available on this product',
      'return_policy': 'Easy return and exchange policy within 7 days',

      // Cart
      'cart_empty': 'Your cart is empty',
      'total': 'Total',
      'checkout': 'Checkout',

      // Auth
      'login': 'Login',
      'register': 'Register',
      'email': 'Email',
      'password': 'Password',

      // Messages
      'success_logout': 'Successfully logged out',
      'not_implemented': 'Sorry, this page was not yet implemented!',

      // Home Page
      'latest_collections': 'LATEST COLLECTIONS',
      'bestsellers': 'BESTSELLERS',
      'our_picks': 'OUR PICKS',
      'newsletter_title': 'Subscribe to our newsletter',
      'newsletter_desc': 'Get updates on our latest collections and special offers',
      'subscribe': 'Subscribe',
      'email_placeholder': 'Enter your email',
      'new_look': 'NEW LOOK',
      'shop_now': 'SHOP NOW'
    }
  },
  fr: {
    translation: {
      // Navigation
      'all_products': 'Tous les Produits',
      'men': 'Hommes',
      'women': 'Femmes',
      'kids': 'Enfants',
      'collection': 'Collection',
      'preorder_now': 'Pré-commander',
      'about': 'À Propos',
      'contact': 'Contact',
      'home': 'Accueil',
      'my_profile': 'Mon Profil',
      'orders': 'Commandes',
      'logout': 'Déconnexion',
      'go_back': 'Retour',

      // Product Page
      'add_to_cart': 'AJOUTER AU PANIER',
      'out_of_stock': 'RUPTURE DE STOCK',
      'select_size': 'Sélectionnez la taille',
      'items_available': 'articles disponibles',
      'original_product': 'Produit 100% Original',
      'cod_available': 'Paiement à la livraison disponible',
      'return_policy': 'Retours et échanges faciles sous 7 jours',

      // Cart
      'cart_empty': 'Votre panier est vide',
      'total': 'Total',
      'checkout': 'Commander',

      // Auth
      'login': 'Connexion',
      'register': 'Inscription',
      'email': 'Email',
      'password': 'Mot de passe',

      // Messages
      'success_logout': 'Déconnexion réussie',
      'not_implemented': 'Désolé, cette page n\'est pas encore implémentée !',

      // Home Page
      'latest_collections': 'DERNIÈRES COLLECTIONS',
      'bestsellers': 'MEILLEURES VENTES',
      'our_picks': 'NOS SÉLECTIONS',
      'newsletter_title': 'Abonnez-vous à notre newsletter',
      'newsletter_desc': 'Recevez nos dernières collections et offres spéciales',
      'subscribe': 'S\'abonner',
      'email_placeholder': 'Entrez votre email',
      'new_look': 'NOUVEAU STYLE',
      'shop_now': 'ACHETER'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;