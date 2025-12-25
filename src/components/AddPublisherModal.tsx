'use client';

import { useState } from 'react';

interface AddPublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (publisherData: { name: string; domain: string; description?: string }) => Promise<void>;
  loading?: boolean;
}

export default function AddPublisherModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: AddPublisherModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: ''
  });

  const [errors, setErrors] = useState<{
    name?: string;
    domain?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { name?: string; domain?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.domain.trim()) {
      newErrors.domain = 'Domain is required';
    } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.domain)) {
      newErrors.domain = 'Please enter a valid domain (e.g., example.com)';
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
        name: formData.name.trim(),
        domain: formData.domain.trim(),
        description: formData.description.trim() || undefined
      });

      // Reset form on successful submission
      setFormData({ name: '', domain: '', description: '' });
      setErrors({});
      onClose();
    } catch (error) {
      // Error handling is done in parent component
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClose = () => {
    setFormData({ name: '', domain: '', description: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-heading-sm font-semibold text-gray-800">Add New Publisher</h2>
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
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-body-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter publisher name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Domain Field */}
              <div>
                <label htmlFor="domain" className="block text-body-sm font-medium text-gray-700 mb-1">
                  Domain *
                </label>
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.domain ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example.com"
                />
                {errors.domain && (
                  <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-body-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Brief description of the publisher"
                />
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
                {loading ? 'Creating...' : 'Create Publisher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}