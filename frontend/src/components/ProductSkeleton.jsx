import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"

export const ProductSkeleton = () => {
    return (
        <div className='mx-4 sm:mx-2 sm:mt-0 md:mx-8 lg:mx-16 xl:mx-24'>
            {/* ----------- Product Data ----------- */}
            <div className='min-h-[480px] flex gap-12 sm:gap-20 flex-col sm:flex-row '>

                {/* ----------- Product Images ----------- */}
                <div className='flex flex-col-reverse gap-3 sm:flex-row flex-1'>
                    <div className='flex sm:flex-col justify-between sm:justify-normal w-full sm:w-[30%]'>
                        {
                            [...Array(4)].map((item, index) => {
                                return <Skeleton key={index} className="w-[24%] sm:w-full aspect-square sm:mb-3 flex-shrink-0" />
                            })
                        }
                    </div>
                    <div className='w-full sm:w-[80%] h-1/2'>
                        <Skeleton className="w-full aspect-square" />
                    </div>
                </div>
                {/* ----------- Product Info ----------- */}
                <div className='flex-1'>
                    <Skeleton className="mt-2 h-12 w-1/2" />
                    <Skeleton className="mt-5 h-12 w-1/4" />
                    <Skeleton className="mt-5 h-20 w-full" />
                    <Skeleton className="my-8 h-20 w-3/4" />

                </div>
            </div>
            {/*  -----------Description and Review Section -----------*/}
            <div className='h-auto w-auto mt-5'>
            <Skeleton className="h-20 w-full" />
            </div>
            {/*  -----------Related products -----------*/}
            <div className='h-auto w-auto mt-20 '>
            <Skeleton className="h-80 w-full" />
            </div>
        </div>
    )
}
