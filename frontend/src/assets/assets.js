import burger from './burger.svg'
import hero from './hero.jpg'
import hero1 from './he1.jpg'
import hero2 from './he2.jpg'
import hero3 from './he3.jpg'
import hero4 from './he4.jpg'
import cart from './cart.svg'
import profile from './profile.svg'
import search from './search.svg'
import logo from './logo.png'
import deleteIcon from './bin_icon.png'
import Mastercard from './Mastercard.png'
import GPay from './GPay.png'
import Paypal from './Paypal.png'
import Visa from './Visa.png'
import ApplePay from './ApplePay.png'
import arrow from './arrow.svg'
import shirt1 from './shirt-1.png'
import shirt2 from './shirt-2.png'
import shirt3 from './shirt-3.png'
import star from './star.svg'
import halfStar from './half-star.svg'
import left from './left.svg'
import daytime from './24-7.svg'
import quality from './quality.svg'
import returnIcon from './return.svg'
import aboutImg from './about_img.png'
import contactImg from './contact_img.png'
import exchangeImg from './exchange_icon.png'
import qualityImg from './quality_icon.png'
import supportImg from './support_img.png'
import cross from './cross_icon.png'
import check from './check.svg'
import eyeIcon from './eye_icon.svg'
import stripe from './stripe_logo.png'
import IMELogo from './import.png'
import Nike1 from './nike1.jpg'
import Nike2 from './nike2.jpg'
import Picks from './picks.png'


export const assets = {
    burger,
    hero, hero1, hero2, hero3, hero4,
    logo,
    cart, profile, search,
    deleteIcon,
    halfStar, star,
    shirt3,shirt2,shirt1,
    arrow,
    Mastercard, GPay, Visa, ApplePay, Paypal,
    left, cross,
    returnIcon, quality,
    daytime,
    aboutImg, contactImg, 
    exchangeImg, qualityImg, supportImg,
    check, eyeIcon,
    stripe,
    IMELogo,
    Nike1, Nike2,
    Picks
}

export const products = [
    {
        id: '1',
        name: 'Women Round Neck Cotton Top',
        description: 'A lightweight, usually knitted, pullover shirt',
        price: 100,
        image: [hero,hero],
        category: "Women",
        subcategory: 'Topwear',
        sizes: ["S", "M", "L", "XL"],
        date: 1716634345448,
        bestseller: true
    },
    {
        id: '2',
        name: 'Men Round Neck Cotton Top',
        description: 'A lightweight, usually knitted, pullover shirt',
        price: 200,
        image: [hero],
        category: "Men",
        subcategory: 'Topwear',
        sizes: ["S", "M", "L", "XL"],
        date: 1716634345448,
        bestseller: false
    },
    {
        id: '3',
        name: 'Women Round Neck Silk Top',
        description: 'A lightweight, usually knitted, pullover shirt',
        price: 250,
        image: [shirt1],
        category: "Women",
        subcategory: 'Topwear',
        sizes: ["S", "M", "L", "XL"],
        date: 1716634345448,
        bestseller: false
    },
    {
        id: '4',
        name: 'Outwear coat',
        description: 'A lightweight, usually knitted, pullover shirt',
        price: 123,
        image: [shirt2,hero],
        category: "Men",
        subcategory: 'Winterwear',
        sizes: ["S", "M", "L", "XL"],
        date: 1716634345448,
        bestseller: true
    },
    {
        id: '5',
        name: 'Funny pants',
        description: 'A lightweight, usually knitted, pullover shirt',
        price: 190,
        image: [shirt3],
        category: "Kids",
        subcategory: 'Bottomwear',
        sizes: ["S", "M", "L", "XL"],
        date: 1716634345448,
        bestseller: true
    }
]
