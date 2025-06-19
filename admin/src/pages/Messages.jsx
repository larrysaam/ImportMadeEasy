import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from "sonner";
import { BsTrash, BsStarFill } from 'react-icons/bs';

const Messages = ({ token }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductFilter, setSelectedProductFilter] = useState('All');
  const reviewsPerPage = 10;

  const uniqueProducts = reviews.reduce((acc, review) => {
    if (!acc.find(p => p.productId === review.productId)) {
      acc.push({ productId: review.productId, productName: review.productName });
    }
    return acc;
  }, []).sort((a, b) => a.productName.localeCompare(b.productName));

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/product/reviews/all`, {
        headers: { token }
      });
      if (response.data.success) {
        setReviews(response.data.reviews);
      } else {
        toast.error(response.data.message || "Failed to fetch reviews.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred while fetching reviews.");
      console.error("Fetch reviews error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReviews();
    }
  }, [token]);

  const handleDeleteReview = async (productId, reviewId) => {
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`${backendUrl}/api/product/${productId}/reviews/${reviewId}`, {
          headers: { token }
        });
        if (response.data.success) {
          toast.success("Review deleted successfully.");
          fetchReviews(); // Refresh the list
        } else {
          toast.error(response.data.message || "Failed to delete review.");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred while deleting the review.");
        console.error("Delete review error:", error);
      }
    }
  };

  // Pagination logic
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;

  const filteredReviews = selectedProductFilter === 'All'
    ? reviews
    : reviews.filter(review => review.productId === selectedProductFilter);

  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedProductFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-lg">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Product Reviews (Messages)</h1>

      <div className="mb-6">
        <label htmlFor="productFilter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Product:
        </label>
        <select
          id="productFilter"
          value={selectedProductFilter}
          onChange={(e) => setSelectedProductFilter(e.target.value)}
          className="w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          <option value="All">All Products</option>
          {uniqueProducts.map(product => (
            <option key={product.productId} value={product.productId}>{product.productName}</option>
          ))}
        </select>
      </div>

      {currentReviews.length === 0 ? (
        <p className="text-center text-gray-500">No reviews found.</p>
      ) : (
        <div className="space-y-4">
          {currentReviews.map((review) => (
            <div key={review._id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                <div>
                  <p className="font-semibold text-sm text-gray-500">
                    Product: <span className="text-blue-600">{review.productName}</span>
                  </p>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <BsStarFill key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({review.rating})</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteReview(review.productId, review._id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors self-start sm:self-center"
                  title="Delete Review"
                >
                  <BsTrash size={16} />
                </button>
              </div>
              <p className="mt-2 text-gray-700 text-sm">{review.comment}</p>
              <div className="mt-3 text-xs text-gray-400 flex flex-col sm:flex-row sm:justify-between">
                <span>By: {review.userName}</span>
                <span>Date: {new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-100"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`px-4 py-2 text-sm border rounded-md ${currentPage === i + 1 ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Messages;