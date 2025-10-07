import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import { UserContext } from './userContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Fetch notifications - always sorted by newest first, never oldest
  const fetchNotifications = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET_NOTIFICATIONS, {
        params: { page, limit }
      });
      
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    try {
      // Only fetch if user is logged in
      if (!user) {
        return;
      }
      
      const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET_UNREAD_COUNT);
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.NOTIFICATIONS.MARK_AS_READ(notificationId));
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await axiosInstance.patch(API_PATHS.NOTIFICATIONS.MARK_ALL_READ);
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            isRead: true, 
            readAt: new Date() 
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await axiosInstance.delete(API_PATHS.NOTIFICATIONS.DELETE(notificationId));
      if (response.data.success) {
        setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Toggle notification dropdown
  const toggleNotificationDropdown = () => {
    setShowNotificationDropdown(prev => !prev);
  };

  // Close notification dropdown
  const closeNotificationDropdown = () => {
    setShowNotificationDropdown(false);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconMap = {
      assignment_created: '📝',
      assignment_started: '▶️',
      assignment_completed: '✅',
      assignment_expired: '⏰',
      demo_submitted: '📤',
      demo_approved: '👍',
      demo_rejected: '👎',
      result_uploaded: '📊',
      result_available: '📈',
      system_announcement: '📢',
      deadline_reminder: '⏳',
      exam_scheduled: '📅',
      exam_starting_soon: '🚀',
      exam_completed: '🏁',
      feedback_received: '💬',
      status_update: '🔄'
    };
    return iconMap[type] || '🔔';
  };

  // Get notification priority color
  const getPriorityColor = (priority) => {
    const colorMap = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    return colorMap[priority] || 'text-blue-500';
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  // Auto-refresh notifications every 30 seconds (only when user is logged in)
  useEffect(() => {
    if (!user) {
      return;
    }
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    showNotificationDropdown,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleNotificationDropdown,
    closeNotificationDropdown,
    getNotificationIcon,
    getPriorityColor,
    formatNotificationTime
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
