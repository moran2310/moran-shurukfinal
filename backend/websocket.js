const WebSocket = require('ws');
const db = require('./db');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ 
    server,
    handleProtocols: (protocols, request) => {
      // Handle protocol selection to prevent duplicate upgrades
      return protocols[0] || false;
    }
  });
  const clients = new Map();

  wss.on('connection', (ws, req) => {
    console.log('Client connected');
    
    // Extract user info from query params or headers
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const userRole = url.searchParams.get('role');
    
    // Store client info
    const clientInfo = {
      ws,
      userId,
      userRole,
      connectedAt: new Date()
    };
    clients.set(ws, clientInfo);

    // Send initial data
    sendInitialData(ws, userId, userRole);

    // Set up database change listeners
    setupDatabaseListeners(ws, userId, userRole);

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleClientMessage(ws, data, clients);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Add error handling for upgrade issues
    ws.on('unexpected-response', (request, response) => {
      console.error('WebSocket unexpected response:', response.statusCode);
    });
  });

  // Broadcast function for external use
  wss.broadcast = (data, filter = null) => {
    clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!filter || filter(clientInfo)) {
          ws.send(JSON.stringify(data));
        }
      }
    });
  };

  return wss;
}

async function sendInitialData(ws, userId, userRole) {
  try {
    // Get initial stats
    const stats = await getStats();
    ws.send(JSON.stringify({ type: 'stats', data: stats }));

    // Send role-specific data
    if (userRole === 'worker' && userId) {
      // Send suggested jobs for worker
      const suggestedJobs = await getSuggestedJobs(userId);
      ws.send(JSON.stringify({ type: 'suggested_jobs', data: suggestedJobs }));
      
      // Send application updates
      const applications = await getWorkerApplications(userId);
      ws.send(JSON.stringify({ type: 'applications', data: applications }));
    } else if (userRole === 'employer' && userId) {
      // Send employer job stats
      const employerStats = await getEmployerStats(userId);
      ws.send(JSON.stringify({ type: 'employer_stats', data: employerStats }));
      
      // Send recent applications
      const recentApplications = await getEmployerApplications(userId);
      ws.send(JSON.stringify({ type: 'recent_applications', data: recentApplications }));
    }

    // Send notifications
    if (userId) {
      const notifications = await getUserNotifications(userId);
      ws.send(JSON.stringify({ type: 'notifications', data: notifications }));
    }
  } catch (error) {
    console.error('Error sending initial data:', error);
  }
}

async function setupDatabaseListeners(ws, userId, userRole) {
  // Listen for job changes
  db.on('job_change', async (jobData) => {
    const stats = await getStats();
    ws.send(JSON.stringify({ type: 'stats', data: stats }));
    
    // Send new job notification to workers
    if (userRole === 'worker') {
      ws.send(JSON.stringify({ 
        type: 'new_job', 
        data: jobData,
        message: 'משרה חדשה התווספה!' 
      }));
    }
  });

  // Listen for application changes
  db.on('application_change', async (applicationData) => {
    if (userRole === 'employer' && applicationData.employer_id === userId) {
      ws.send(JSON.stringify({ 
        type: 'new_application', 
        data: applicationData,
        message: 'מועמד חדש הגיש מועמדות!' 
      }));
    } else if (userRole === 'worker' && applicationData.worker_id === userId) {
      ws.send(JSON.stringify({ 
        type: 'application_update', 
        data: applicationData,
        message: 'סטטוס המועמדות שלך עודכן!' 
      }));
    }
  });

  // Listen for placement changes
  db.on('placement_change', async (placementData) => {
    const stats = await getStats();
    ws.send(JSON.stringify({ type: 'stats', data: stats }));
    
    if (userRole === 'admin') {
      ws.send(JSON.stringify({ 
        type: 'placement_update', 
        data: placementData,
        message: 'השמה חדשה נוצרה!' 
      }));
    }
  });
}

// Handle client messages
function handleClientMessage(ws, data, clients) {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
      
    case 'subscribe_job_alerts':
      // Subscribe to job alerts for specific criteria
      const clientInfo = clients.get(ws);
      if (clientInfo) {
        clientInfo.jobAlerts = data.criteria;
      }
      break;
      
    case 'mark_notification_read':
      markNotificationRead(data.notificationId);
      break;
      
    default:
      console.log('Unknown message type:', data.type);
  }
}

// Helper functions for database queries
async function getSuggestedJobs(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT j.*, ep.company_name
      FROM jobs j
      LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
      LEFT JOIN worker_profiles wp ON wp.user_id = ?
      WHERE j.status = 'active'
        AND (wp.preferred_job_type IS NULL OR j.job_type LIKE CONCAT('%', wp.preferred_job_type, '%'))
        AND (wp.preferred_location IS NULL OR j.location LIKE CONCAT('%', wp.preferred_location, '%'))
      ORDER BY j.created_at DESC
      LIMIT 5
    `;
    db.query(query, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

async function getWorkerApplications(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT ja.*, j.title, j.company_name
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.worker_id = ?
      ORDER BY ja.applied_at DESC
      LIMIT 10
    `;
    db.query(query, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

async function getEmployerStats(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(j.id) as total_jobs,
        COUNT(CASE WHEN j.status = 'active' THEN 1 END) as active_jobs,
        COUNT(ja.id) as total_applications,
        COUNT(CASE WHEN ja.status = 'pending' THEN 1 END) as pending_applications
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      WHERE j.employer_id = ?
    `;
    db.query(query, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || {});
    });
  });
}

async function getEmployerApplications(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT ja.*, j.title, u.full_name as candidate_name
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN users u ON ja.worker_id = u.id
      WHERE j.employer_id = ? AND ja.status = 'pending'
      ORDER BY ja.applied_at DESC
      LIMIT 5
    `;
    db.query(query, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

async function getUserNotifications(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT n.*, j.title as job_title
      FROM notifications n
      LEFT JOIN jobs j ON n.job_id = j.id
      WHERE n.user_id = ? AND n.status != 'read'
      ORDER BY n.created_at DESC
      LIMIT 10
    `;
    db.query(query, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

async function markNotificationRead(notificationId) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE notifications SET status = "read" WHERE id = ?';
    db.query(query, [notificationId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function getStats() {
  const queries = {
    jobs: 'SELECT status, COUNT(*) as count FROM jobs GROUP BY status',
    candidates: 'SELECT COUNT(*) as count FROM candidate',
    placements: 'SELECT status, COUNT(*) as count FROM placements GROUP BY status',
    applications: 'SELECT status, COUNT(*) as count FROM job_applications GROUP BY status'
  };

  const results = {};
  
  for (const [key, query] of Object.entries(queries)) {
    try {
      const data = await new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
          if (err) reject(err);
          else resolve(results || []);
        });
      });
      results[key] = data;
    } catch (error) {
      console.error(`Error executing ${key} query:`, error);
      results[key] = [];
    }
  }

  return results;
}

module.exports = setupWebSocket;
