'use client';

import { useState } from 'react';

interface AddNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newsData: { url: string; category: string }) => Promise<void>;
  loading?: boolean;
}

const categories = [
  { value: 'military', label: 'Military' },
  { value: 'finance', label: 'Finance' }
];

export default function AddNewsModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: AddNewsModalProps) {
  const [formData, setFormData] = useState({
    url: '',
    category: ''
  });

  const [errors, setErrors] = useState<{
    url?: string;
    category?: string;
  }>({});


  const validateForm = () => {
    const newErrors: { url?: string; category?: string } = {};

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!/^https?:\/\/.+\..+/.test(formData.url.trim())) {
      newErrors.url = 'Please enter a valid URL (e.g., https://example.com/article)';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        url: formData.url.trim(),
        category: formData.category.trim()
      });

      // Reset form on successful submission
      setFormData({ url: '', category: '' });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClose = () => {
    setFormData({ url: '', category: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-200 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-heading-sm font-semibold text-gray-800">Add News Article</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* URL Field */}
              <div>
                <label htmlFor="url" className="block text-body-sm font-medium text-gray-700 mb-1">
                  Article URL *
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/news-article"
                />
                {errors.url && (
                  <p className="mt-1 text-body-sm text-red-600">{errors.url}</p>
                )}
              </div>

              {/* Category Field */}
              <div>
                <label htmlFor="category" className="block text-body-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-body-sm text-red-600">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-body-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-body-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Add News'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}