import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FlagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import communityAPI from '../services/communityAPI';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedReason, setSelectedReason] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0
  });

  useEffect(() => {
    loadAdminData();
  }, [selectedStatus, selectedReason, pagination?.currentPage]);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Load reports with fallback pagination
      const reportsResponse = await communityAPI.getAllReports(
        pagination?.currentPage || 1,
        20,
        selectedStatus === 'all' ? null : selectedStatus,
        selectedReason === 'all' ? null : selectedReason
      );

      
      // Handle response safely
      if (reportsResponse && reportsResponse.data.reports) {
        setReports(reportsResponse.data.reports);
        console.log('Reports response:', reportsResponse);
        setPagination(reportsResponse.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalReports: 0
        });
      } else if (Array.isArray(reportsResponse)) {
        // Handle legacy array format
        setReports(reportsResponse);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalReports: reportsResponse.length
        });
      } else {
        // Fallback for empty/failed response
        setReports([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalReports: 0
        });
      }

      // Load statistics with error handling
      try {
        const statsResponse = await communityAPI.getReportStatistics();
        console.log('Statistics response:', statsResponse);
        setStatistics(statsResponse?.data?.byStatus || {
          pending: 0,
          reviewed: 0,
          resolved: 0,
          dismissed: 0
        });
      } catch (statsError) {
        console.error('Failed to load statistics:', statsError);
        setStatistics({
          pending: 0,
          reviewed: 0,
          resolved: 0,
          dismissed: 0
        });
      }

      // Load notifications with error handling
      // try {
      //   const notificationsResponse = await communityAPI.getAdminNotifications();
      //   setNotifications(notificationsResponse?.notifications || []);
      // } catch (notifError) {
      //   console.error('Failed to load notifications:', notifError);
      //   setNotifications([]);
      // }

    } catch (error) {
      console.error('Load admin data error:', error);
      toast.error('Không thể tải dữ liệu admin');
      
      // Set safe fallback states on error
      setReports([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalReports: 0
      });
      setStatistics({
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0
      });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus, adminNotes = '') => {
    try {
      await communityAPI.updateReportStatus(reportId, newStatus, adminNotes);
      toast.success('Cập nhật trạng thái thành công');
      await loadAdminData();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'reviewed':
        return <EyeIcon className="w-5 h-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'dismissed':
        return <XCircleIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !reports.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Quản lý báo cáo và hoạt động cộng đồng
          </p>
        </motion.div>

        {/* Statistics Cards */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Chờ xử lý</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.pending || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <EyeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Đã xem</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.reviewed || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Đã giải quyết</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.resolved || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <FlagIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tổng báo cáo</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(statistics.pending || 0) + (statistics.reviewed || 0) + (statistics.resolved || 0) + (statistics.dismissed || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="reviewed">Đã xem</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="dismissed">Đã bỏ qua</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lý do
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">Tất cả</option>
                    <option value="fake_news">Tin giả</option>
                    <option value="scam">Lừa đảo</option>
                    <option value="malicious_content">Nội dung độc hại</option>
                    <option value="spam">Spam</option>
                    <option value="inappropriate">Không phù hợp</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <FlagIcon className="w-5 h-5 mr-2" />
                Báo cáo từ người dùng ({pagination?.totalReports || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FlagIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Không có báo cáo nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(report.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {communityAPI.getReportReasonDisplay ? communityAPI.getReportReasonDisplay(report.reason) : report.reason}
                            </span>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {report.linkInfo?.url || 'URL không xác định'}
                          </p>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {report.description}
                          </p>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Báo cáo bởi: {report.reporter?.displayName || report.reporter?.email || 'Người dùng ẩn danh'}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          {report.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                Đánh dấu đã xem
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(report.id, 'resolved')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Giải quyết
                              </Button>
                            </>
                          )}
                          
                          {report.status === 'reviewed' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(report.id, 'resolved')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Giải quyết
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(report.id, 'dismissed')}
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                Bỏ qua
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    variant="outline"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={!pagination || pagination.currentPage === 1}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Trang trước
                  </Button>
                  
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Trang {pagination?.currentPage || 1} / {pagination?.totalPages || 1}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={!pagination || pagination.currentPage === pagination.totalPages}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Trang sau
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
