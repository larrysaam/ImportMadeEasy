import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'sonner'
import { BsTrash, BsPencil, BsPlus, BsChevronRight, BsChevronDown } from 'react-icons/bs'

const Categories = ({ token }) => {
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [selectedPath, setSelectedPath] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all categories
  useEffect(() => {
    fetchCategories()
  }, [token])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${backendUrl}/api/categories`, {
        headers: { token }
      })
      if (response.data.success) {
        setCategories(response.data.categories)
      }
    } catch (error) {
      toast.error('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }

  // Add category at any level
  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.trim()) {
      toast.error('Please enter a category name')
      return
    }

    setIsSubmitting(true)
    try {
      let response
      if (selectedPath.length === 0) {
        // Add main category
        response = await axios.post(
          `${backendUrl}/api/categories/addMain`,
          { name: newCategory },
          { headers: { token } }
        )
      } else if (selectedPath.length === 1) {
        // Add subcategory
        response = await axios.post(
          `${backendUrl}/api/categories/addSub`,
          {
            mainCategory: selectedPath[0],
            name: newCategory
          },
          { headers: { token } }
        )
      } else if (selectedPath.length === 2) {
        // Add second level subcategory
        response = await axios.post(
          `${backendUrl}/api/categories/addSubSub`,
          {
            mainCategory: selectedPath[0],
            subcategory: selectedPath[1],
            name: newCategory
          },
          { headers: { token } }
        )
      }

      if (response?.data.success) {
        toast.success('Category added successfully')
        setNewCategory('')
        fetchCategories()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete category
  const handleDelete = async (path) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await axios.delete(
        `${backendUrl}/api/categories/delete`,
        {
          headers: { token },
          data: { path }
        }
      )

      if (response.data.success) {
        toast.success('Category deleted successfully')
        fetchCategories()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category')
    }
  }

  // Render category tree
  const renderCategories = (items, level = 0, path = []) => {
    return items.map((item, index) => (
      <div key={`${item.name}-${index}`} className={`pl-${level * 2} sm:pl-${level * 4}`}>
        <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-b-0">
          <span className="font-medium text-sm sm:text-base flex-grow truncate">{item.name}</span>
          {level < 2 && (
            <button
              onClick={() => setSelectedPath([...path, item.name])}
              className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 whitespace-nowrap"
            >
              Add Sub
            </button>
          )}
          <button
            onClick={() => handleDelete([...path, item.name])}
            className="p-1 hover:text-red-600"
          >
            <BsTrash size={14} />
          </button>
        </div>
        {item.subcategories?.length > 0 && (
          <div className="ml-4 border-l pl-4">
            {renderCategories(item.subcategories, level + 1, [...path, item.name])}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="p-3 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Category Management</h1>

      {/* Add category form */}
      <form onSubmit={handleAddCategory} className="mb-6 bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
          {selectedPath.length === 0
            ? 'Add Main Category'
            : `Add Subcategory to ${selectedPath.join(' > ')}`}
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter category name"
            className="border rounded-md px-3 py-2 flex-1 text-sm sm:text-base"
            disabled={isSubmitting}
          />
          <div className="flex gap-2 sm:gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 flex-grow sm:flex-grow-0 text-sm sm:text-base"
            >
              <BsPlus size={18} />
              Add
            </button>
            {selectedPath.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedPath([])}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 flex-grow sm:flex-grow-0 text-sm sm:text-base"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Categories tree */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Category Structure</h2>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
          </div>
        ) : (
          renderCategories(categories)
        )}
      </div>
    </div>
  )
}

export default Categories