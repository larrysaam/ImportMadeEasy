import { useState, useEffect } from 'react'
import { FaStar, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { useContext } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShopContext } from '@/context/ShopContext'
import axios from 'axios'
import { toast } from 'sonner'

const ReviewSection = ({ productId }) => {
  const { token, backendUrl, user } = useContext(ShopContext)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/reviews/product/${productId}`
      )
      if (response.data.success) {
        setReviews(response.data.reviews)
        setAverageRating(response.data.averageRating)
        setTotalReviews(response.data.totalReviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      toast.error('Please login to submit a review')
      return
    }
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    if (!comment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post(
        `${backendUrl}/api/reviews/add`,
        {
          productId,
          rating,
          comment,
        },
        {
          headers: { token }
        }
      )

      if (response.data.success) {
        toast.success('Review added successfully')
        setRating(0)
        setComment('')
        fetchReviews()
      }
    } catch (error) {
      // Check specifically for 400 status code
      if (error.response.status === 400) {
        toast.error('You have already reviewed this product')
      } else {
        toast.error(error.response?.data?.message || 'Failed to add review')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border-t mt-8">
      {/* Reviews Header - Always visible */}
      <div 
        className="py-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Reviews</span>
          <span className="text-gray-500">({totalReviews})</span>
        </div>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="pb-6 space-y-6 animate-slideDown">
          {/* Average Rating */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">{averageRating}</span>
            <div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={star <= averageRating ? 'text-yellow-400' : 'text-gray-300'}
                    size={16}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">Based on {totalReviews} reviews</span>
            </div>
          </div>

          {/* Latest 3 Reviews */}
          <div className="space-y-4">
            {reviews.slice(0, 3).map((review) => (
              <div key={review._id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{review.userName}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                          size={12}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
              </div>
            ))}
          </div>

          {/* View All Reviews Button */}
          {totalReviews > 3 && (
            <button
              onClick={() => setShowAllReviews(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all {totalReviews} reviews
            </button>
          )}

          {/* Add Review Section */}
          {token ? (
            <form onSubmit={handleSubmit} className="pt-4 border-t">
              <h4 className="font-medium mb-2">Write a review</h4>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`cursor-pointer ${
                      (hover || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    size={20}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  />
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-2 border rounded-md text-sm mb-3 min-h-[80px]"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">
              Please <a href="/login" className="text-blue-600 hover:underline">login</a> to write a review
            </p>
          )}
        </div>
      )}

      {/* All Reviews Dialog */}
      <Dialog open={showAllReviews} onOpenChange={setShowAllReviews}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Reviews ({totalReviews})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {reviews.map((review) => (
              <div key={review._id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{review.userName}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                          size={14}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReviewSection