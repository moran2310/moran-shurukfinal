const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { transporter } = require('./emailConfig');

// Register user
const register = (req, res) => {
  console.log('Register function called with:', req.body);
  const { fullName, email, password, role = 'worker' } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'כל השדות נדרשים' });
  }

  if (!['admin', 'employer', 'worker'].includes(role)) {
    return res.status(400).json({ message: 'תפקיד לא תקין' });
  }

  // Get role_id from roles table
  const getRoleIdQuery = 'SELECT role_id FROM roles WHERE role_name = ?';
  db.query(getRoleIdQuery, [role], (err, roleResults) => {
    if (err) {
      console.error('Error getting role_id:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (roleResults.length === 0) {
      return res.status(400).json({ message: 'תפקיד לא נמצא' });
    }
    
    const roleId = roleResults[0].role_id;

  // Check if user already exists
  const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkUserQuery, [email], async (err, results) => {
    if (err) {
      console.error('Database error in register:', err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'משתמש כבר קיים עם האימייל הזה' });
    }

    try {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const insertUserQuery = 'INSERT INTO users (full_name, email, password, role_id) VALUES (?, ?, ?, ?)';
      db.query(insertUserQuery, [fullName, email, hashedPassword, roleId], (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: results.insertId, email: email },
          'your-hardcoded-jwt-secret-key-2024',
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'משתמש נרשם בהצלחה',
          token: token,
          user: {
            id: results.insertId,
            fullName: fullName,
            email: email,
            // Include the role in the response so that the frontend
            // can determine which dashboard to redirect to.  The
            // original implementation omitted this field, causing
            // undefined values in the client.
            role: role
          }
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'שגיאה בהצפנת הסיסמה' });
    }
  });
  }); // Close the getRoleIdQuery callback
};

// Login user
const login = (req, res) => {
  const { email, password } = req.body;

  const query = `
    SELECT u.*, r.role_name 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.role_id 
    WHERE u.email = ?
  `;
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    const user = results[0];

    try {
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        'your-hardcoded-jwt-secret-key-2024',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'התחברות בוצעה בהצלחה',
        token: token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role_name
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'שגיאה בבדיקת הסיסמה' });
    }
  });
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'אין הרשאה - לא נמצא טוקן' });
  }

  try {
    const decoded = jwt.verify(token, 'your-hardcoded-jwt-secret-key-2024');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'טוקן לא תקין' });
  }
};

// Request password reset
const requestPasswordReset = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'נא להזין אימייל' });
  }

  console.log('Password reset requested for email:', email);
  
  // Check if user exists
  const userQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(userQuery, [email], async (err, results) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ error: 'שגיאה בבדיקת המשתמש' });
    }
    
    console.log('User query results:', results.length > 0 ? 'User found' : 'User not found');

    if (results.length === 0) {
      // For security, don't reveal if the email exists or not
      return res.status(200).json({ message: 'אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה' });
    }

    const user = results[0];
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    
    console.log('Generated token:', token);
    console.log('Token expires at:', expiresAt);

    // Save token to database
    const insertTokenQuery = 'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)';
    console.log('Executing query:', insertTokenQuery, 'with params:', [user.id, token, expiresAt]);
    
    db.query(insertTokenQuery, [user.id, token, expiresAt], async (err, result) => {
      if (err) {
        console.error('Error saving reset token:', err);
        return res.status(500).json({ error: 'שגיאה בשמירת טוקן איפוס' });
      }
      
      console.log('Token saved to database. Insert ID:', result.insertId);

      // Send email with reset link
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      console.log('Sending email to:', user.email);
      console.log('Reset link:', resetLink);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'איפוס סיסמה - אתר הדרושים',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
            <h2>איפוס סיסמה</h2>
            <p>שלום ${user.full_name},</p>
            <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור הבא כדי להגדיר סיסמה חדשה:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                אפס סיסמה
              </a>
            </p>
            <p>אם לא ביקשת לאפס את הסיסמה, תוכל להתעלם מהודעה זו.</p>
            <p>קישור זה תקף לשעה אחת בלבד.</p>
            <p>בברכה,<br>צוות אתר הדרושים</p>
          </div>
        `
      };

      console.log('Attempting to send email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          if (error.responseCode) {
            console.error('SMTP Error Code:', error.responseCode);
          }
          if (error.response) {
            console.error('SMTP Response:', error.response);
          }
          return res.status(500).json({ 
            error: 'שגיאה בשליחת אימייל איפוס',
            debug: process.env.NODE_ENV !== 'production' ? error.message : undefined
          });
        }
        
        console.log('Email sent successfully:', info.response);
        console.log('Message ID:', info.messageId);
        
        res.status(200).json({ 
          message: 'נשלח קישור לאיפוס סיסמה לכתובת האימייל שלך',
          debug: process.env.NODE_ENV !== 'production' ? { 
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
          } : undefined
        });
      });
    });
  });
};

// Reset password
const resetPassword = (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'נדרשים טוקן וסיסמה חדשה' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
  }

  // Check if token is valid and not expired
  const tokenQuery = `
    SELECT * FROM password_reset_tokens 
    WHERE token = ? AND used = FALSE AND expires_at > NOW()
    ORDER BY created_at DESC 
    LIMIT 1`;

  db.query(tokenQuery, [token], async (err, results) => {
    if (err) {
      console.error('Error checking token:', err);
      return res.status(500).json({ error: 'שגיאה בבדיקת טוקן' });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'קישור לא תקף או שפג תוקפו' });
    }

    const tokenRecord = results[0];
    const userId = tokenRecord.user_id;

    try {
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user's password
      const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
      db.query(updateQuery, [hashedPassword, userId], (err) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.status(500).json({ error: 'שגיאה בעדכון הסיסמה' });
        }

        // Mark token as used
        const markUsedQuery = 'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?';
        db.query(markUsedQuery, [tokenRecord.id], (err) => {
          if (err) {
            console.error('Error marking token as used:', err);
            // Continue even if this fails - the password was still updated
          }

          res.status(200).json({ message: 'הסיסמה אופסה בהצלחה' });
        });
      });
    } catch (error) {
      console.error('Error hashing password:', error);
      res.status(500).json({ error: 'שגיאה בעיבוד הסיסמה' });
    }
  });
};

module.exports = { register, login, verifyToken, requestPasswordReset, resetPassword };
