import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_BASE_URL } from '../config';

export const useWebSocket = (endpoint = '', options = {}) => {
  // Construct the full WebSocket URL
  const url = endpoint ? `${WS_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}` : null;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  
  const { 
    userId = null, 
    userRole = null, 
    onMessage = null,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const connect = useCallback(() => {
    // If no URL is provided, do not attempt to establish a WebSocket
    // connection.  This allows consumers to disable WebSocket
    // functionality by passing a falsy value (e.g. null or '') for
    // the URL.  Without this guard, the hook would try to open a
    // connection to "null" which results in confusing errors.
    if (!url) {
      // No URL means WS is disabled; keep state consistent and exit.
      setIsConnected(false);
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = userId && userRole 
        ? `${url}?userId=${userId}&role=${userRole}`
        : url;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          switch (message.type) {
            case 'stats':
              setData(message.data);
              break;
            case 'new_job':
            case 'new_application':
            case 'application_update':
            case 'placement_update':
            case 'application_status_update':
              // Add to notifications
              setNotifications(prev => [{
                id: Date.now(),
                type: message.type,
                message: message.message,
                data: message.data,
                timestamp: new Date(),
                read: false
              }, ...prev.slice(0, 49)]); // Keep only last 50 notifications
              break;
            case 'suggested_jobs':
            case 'applications':
            case 'employer_stats':
            case 'recent_applications':
            case 'notifications':
              setData(prev => ({ ...prev, [message.type]: message.data }));
              break;
            case 'pong':
              // Handle ping response
              break;
            default:
              console.log('Unknown message type:', message.type);
          }
          
          // Call custom message handler if provided
          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error('WebSocket message parsing error:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error occurred');
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure and under max attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setError('Failed to connect');
    }
  }, [url, userId, userRole, onMessage, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket not connected, message not sent:', message);
    return false;
  }, []);

  const markNotificationRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    
    // Send to server if it's a server notification
    sendMessage({
      type: 'mark_notification_read',
      notificationId
    });
  }, [sendMessage]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const subscribeToJobAlerts = useCallback((criteria) => {
    sendMessage({
      type: 'subscribe_job_alerts',
      criteria
    });
  }, [sendMessage]);

  useEffect(() => {
    // Only initiate the connection effect when a URL is provided.
    if (url) {
      connect();
      return () => {
        disconnect();
      };
    }
    // If no URL, no cleanup is necessary
    return undefined;
  }, [connect, disconnect, url]);

  return { 
    data, 
    error, 
    isConnected, 
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    sendMessage,
    markNotificationRead,
    clearNotifications,
    subscribeToJobAlerts,
    reconnect: connect,
    disconnect
  };
}
