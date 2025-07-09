import React, { useState } from 'react';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import communityAPI from '../../services/communityAPI';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ReportModal = ({ isOpen, onClose, linkId, linkUrl }) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const reportReasons = [
    { value: 'fake_news', label: 'Tin giả', description: 'Thông tin sai lệch hoặc không chính xác' },
    { value: 'scam', label: 'Lừa đảo', description: 'Trang web lừa đảo hoặc chiếm đoạt thông tin' },
    { value: 'malicious_content', label: 'Nội dung độc hại', description: 'Virus, malware hoặc nội dung có hại' },
    { value: 'spam', label: 'Spam', description: 'Nội dung spam hoặc quảng cáo rác' },
    { value: 'inappropriate', label: 'Không phù hợp', description: 'Nội dung không phù hợp hoặc vi phạm quy định' },
    { value: 'other', label: 'Khác', description: 'Lý do khác (vui lòng mô tả chi tiết)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vui lòng đăng nhập để báo cáo');
      return;
    }

    if (!reason) {
      setError('Vui lòng chọn lý do báo cáo');
      return;
    }

    if (!description.trim()) {
      setError('Vui lòng mô tả chi tiết về vấn đề');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await communityAPI.submitReport(linkId, reason, description.trim(), linkUrl);
      setSuccess(true);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Submit report error:', error);
      setError(error.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {success ? (
            // Success State
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <FlagIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                  Báo cáo đã được gửi
                </h3>
                <p className="text-sm text-gray-500">
                  Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.
                </p>
              </div>
            </div>
          ) : (
            // Report Form
            <>
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Báo cáo link
                      </h3>
                      <p className="text-sm text-gray-500">
                        Báo cáo nội dung vi phạm hoặc có vấn đề
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Link Info */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Link được báo cáo:</p>
                  <p className="text-sm font-medium text-gray-900 break-all">{linkUrl}</p>
                </div>

                {/* Report Form */}
                <form onSubmit={handleSubmit}>
                  {/* Reason Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lý do báo cáo *
                    </label>
                    <div className="space-y-2">
                      {reportReasons.map((reasonOption) => (
                        <label key={reasonOption.value} className="flex items-start">
                          <input
                            type="radio"
                            name="reason"
                            value={reasonOption.value}
                            checked={reason === reasonOption.value}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {reasonOption.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {reasonOption.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả chi tiết *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Vui lòng mô tả chi tiết về vấn đề bạn gặp phải với link này..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      disabled={submitting}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        Tối thiểu 10 ký tự
                      </span>
                      <span className="text-xs text-gray-500">
                        {description.length}/500 ký tự
                      </span>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!reason || !description.trim() || description.trim().length < 10 || submitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
