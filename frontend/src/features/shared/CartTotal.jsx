import React, { useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import Title from '@/components/Title'
import NumberFlow from '@number-flow/react'

const CartTotal = () => {

const { deliveryFee, getCartAmount, cartItems, products } = useContext(ShopContext)

// Bulk discount configuration from environment variables
const bulkDiscountPercentage = Number(import.meta.env.VITE_BULK_DISCOUNT_PERCENTAGE) || 5;
const bulkDiscountMinQuantity = Number(import.meta.env.VITE_BULK_DISCOUNT_MIN_QUANTITY) || 10;

// Calculate total savings from bulk discounts
const calculateTotalSavings = () => {
  return Object.entries(cartItems).reduce((totalSavings, [itemId, cartKeys]) => {
    const itemInfo = products.find((product) => product._id === itemId);
    if (!itemInfo) return totalSavings;

    return totalSavings + Object.values(cartKeys).reduce((savings, qty) => {
      if (qty >= bulkDiscountMinQuantity) {
        const discountAmount = itemInfo.price * qty * (bulkDiscountPercentage / 100);
        return savings + discountAmount;
      }
      return savings;
    }, 0);
  }, 0);
};

// Calculate original total (without discounts)
const getOriginalCartAmount = () => {
  return Object.entries(cartItems).reduce((totalAmount, [itemId, cartKeys]) => {
    const itemInfo = products.find((product) => product._id === itemId);
    if (!itemInfo) return totalAmount;
    return (
      totalAmount +
      Object.values(cartKeys).reduce(
        (sum, qty) => sum + itemInfo.price * qty,
        0
      )
    );
  }, 0);
};

  return (
    <div className='w-full'>
        <div className='text-2xl'>
            <Title text1='CART' text2='TOTAL'/>
        </div>

        <div className='flex flex-col gap-2 mt-2 text-base'>
            {/* Show original subtotal if there are bulk discounts */}
            {calculateTotalSavings() > 0 && (
              <>
                <div className='flex justify-between'>
                    <p>Original Subtotal</p>
                    <span className='text-gray-400 line-through'>
                      <NumberFlow
                          value={getOriginalCartAmount()}
                          format={{
                              style: 'currency',
                              currency: import.meta.env.VITE_CURRENCY || 'XAF',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                          }}
                      />
                    </span>
                </div>
                <div className='flex justify-between'>
                    <p className='text-green-600 font-medium'>Bulk Discount (-{bulkDiscountPercentage}%)</p>
                    <span className='text-green-600 font-medium'>
                      -<NumberFlow
                          value={calculateTotalSavings()}
                          format={{
                              style: 'currency',
                              currency: import.meta.env.VITE_CURRENCY || 'XAF',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                          }}
                      />
                    </span>
                </div>
              </>
            )}

            <div className='flex justify-between'>
                <p>Subtotal</p>
                <NumberFlow
                    value={getCartAmount() ? getCartAmount() : 0}
                    format={{
                        style: 'currency',
                        currency: import.meta.env.VITE_CURRENCY || 'XAF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }}
                />
            </div>
            <hr/>
            <div className='flex justify-between'>
                <p>Shipping fee</p>
                <div className='flex flex-col items-end'>
                    <NumberFlow
                        value={deliveryFee ? deliveryFee : 0}
                        format={{
                            style: 'currency',
                            currency: import.meta.env.VITE_CURRENCY || 'XAF',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }}
                    />
                    <p className='text-xs text-orange-600 font-medium'>Pay on delivery</p>
                </div>
            </div>
            <div className='text-xs text-gray-500 flex justify-end'>
                <p>Estimated delivery: 9 days</p>
            </div>
            <hr/>
            <div className='text-lg flex justify-between'>
                <b>Total (excluding delivery)</b>
                <NumberFlow
                    className='font-semibold'
                    value={getCartAmount() === 0 ? 0 : getCartAmount()}
                    format={{
                        style: 'currency',
                        currency: import.meta.env.VITE_CURRENCY || 'XAF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }}
                />
            </div>

            {/* Show total savings summary */}
            {calculateTotalSavings() > 0 && (
              <div className='bg-green-50 border border-green-200 rounded-lg p-3 mt-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className='text-sm font-medium text-green-800'>You saved:</span>
                  </div>
                  <span className='text-sm font-bold text-green-800'>
                    <NumberFlow
                        value={calculateTotalSavings()}
                        format={{
                            style: 'currency',
                            currency: import.meta.env.VITE_CURRENCY || 'XAF',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }}
                    />
                  </span>
                </div>
                <p className='text-xs text-green-700 mt-1'>
                  Thanks to bulk discounts on items with {bulkDiscountMinQuantity}+ quantity!
                </p>
              </div>
            )}
        </div>
    </div>
  )
}

export default CartTotal
