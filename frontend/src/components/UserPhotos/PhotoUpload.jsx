import { useState, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../../context/ShopContext';
import { toast } from 'sonner';

const PhotoUpload = ({ productId, onPhotoAdded }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const { token, backendUrl } = useContext(ShopContext);

  const handleFileUpload = async (e) => {
    try {
      setError(null);
      setLoading(true);
      
      if (!file) {
        throw new Error('Please select a file');
      }

      const formData = new FormData();
      formData.append('photo', file);

      const response = await axios.post(`${backendUrl}/api/photos/user/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          token: token, // Include token for authentication
        },
      });

      if (response.data.success) {
        onPhotoAdded();
        setFile(null);
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      setError(error.message || 'Error uploading photo');
      console.error('Error uploading photo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <input
        type="file"
        onChange={(e) => {
          setError(null);
          setFile(e.target.files[0]);
        }}
        accept="image/*"
        className="hidden"
        id="photo-upload"
      />
      <label
        htmlFor="photo-upload"
        className="inline-block px-6 py-2 border-2 border-gray-300 rounded-full cursor-pointer hover:border-gray-400"
      >
        {file ? file.name : 'Upload Your Photo'}
      </label>
      {file && (
        <button
          onClick={handleFileUpload}
          disabled={loading}
          className="ml-4 px-6 py-2 bg-black text-white rounded-full disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Submit'}
        </button>
      )}
      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default PhotoUpload;