require('dotenv').config();  // Энэ нь .env файлыг уншина
// controllers/auth.controller.js - Complete Production Version
const db = require("../models");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const User = db.users;
const Op = db.Sequelize.Op;

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role || 'worker'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-12345',
    { expiresIn: '7d' }
  );
};

// Prepare User Response
const prepareUserResponse = (user) => {
  const userObj = user.toJSON ? user.toJSON() : user;
  
  // Remove sensitive fields
  delete userObj.password;
  delete userObj.reset_password_token;
  delete userObj.reset_password_expires;
  delete userObj.refresh_token;
  delete userObj.email_verification_token;
  
  return userObj;
};

// ==================== MONGOLIAN PHONE AUTH ====================

// Register with Phone
exports.register = async (req, res) => {
  try {
    const { phone, password, full_name, role, email } = req.body;

    if (!phone || !password || !full_name) {
      return res.status(400).json({ message: "Бүх талбаруудыг бөглөнө үү" });
    }

    // Validate phone number format (Mongolian)
    const phoneRegex = /^[89]\d{7}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Утасны дугаар буруу форматтай байна" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: "Нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэх ёстой" });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ message: "Утасны дугаар бүртгэлтэй байна" });
    }

    // Check if email exists (if provided)
    if (email) {
      const emailUser = await User.findOne({ where: { email } });
      if (emailUser) {
        return res.status(409).json({ message: "Имэйл хаяг бүртгэлтэй байна" });
      }
    }

    // Only allow specific roles; default to worker
    const allowedRoles = ["director", "general_manager", "supervisor", "worker"];
    const userRole = allowedRoles.includes(role) ? role : "worker";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      phone,
      password: hashedPassword,
      full_name,
      email: email || null,
      role: userRole,
      is_active: true,
      provider: 'local'
    });

    const token = generateToken(user);
    const userResponse = prepareUserResponse(user);

    res.status(201).json({ 
      message: "Бүртгэл амжилттай", 
      token,
      user: userResponse 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
};

// Login with Phone
exports.login = async (req, res) => {
  try {
    console.log('Login attempt with:', { 
      phone: req.body.phone, 
      email: req.body.email 
    });
    
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: "Утасны дугаар/имэйл болон нууц үг оруулна уу" });
    }

    // Find user by phone or email
    let user;
    const userAttributes = ['id', 'email', 'full_name', 'first_name', 'last_name', 'avatar', 'google_id', 'provider', 'is_verified', 'is_active', 'role', 'phone', 'facebook_id', 'supervisor_id', 'password', 'created_at', 'updated_at'];
    if (phone) {
      console.log('Searching for user with phone:', phone);
      user = await User.findOne({ 
        where: { phone },
        attributes: userAttributes
      });
    } else if (email) {
      console.log('Searching for user with email:', email);
      user = await User.findOne({ 
        where: { email },
        attributes: userAttributes
      });
    }
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: "Утасны дугаар/имэйл эсвэл нууц үг буруу байна" });
    }

    console.log('User found:', { 
      id: user.id, 
      phone: user.phone,
      email: user.email,
      is_active: user.is_active 
    });

    // Check if user is active
    if (!user.is_active) {
      console.log('User is inactive');
      return res.status(403).json({ message: "Таны бүртгэл идэвхгүй байна" });
    }

    // Check if user has password (for social login users)
    if (!user.password) {
      console.log('User has no password (social login)');
      return res.status(400).json({ 
        message: "Энэ хаягаар Google хаягаар нэвтэрсэн байна. Google хаягаар нэвтэрнэ үү" 
      });
    }

    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(401).json({ message: "Утасны дугаар/имэйл эсвэл нууц үг буруу байна" });
    }

    // Generate JWT token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Save refresh token
    await user.update({ refresh_token: refreshToken });

    const userResponse = prepareUserResponse(user);

    console.log('Login successful for user:', user.id);
    
    res.json({
      message: "Амжилттай нэвтэрлээ",
      token,
      refresh_token: refreshToken,
      user: userResponse
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Нэвтрэхэд алдаа гарлаа" });
  }
};

// ==================== GOOGLE OAUTH 2.0 ====================

// Generate Google OAuth URL
exports.googleAuth = (req, res) => {
  try {
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
      ],
      prompt: 'consent'
    });
    
    res.json({
      success: true,
      auth_url: authUrl,
      message: 'Google нэвтрэх холбоос'
    });
    
  } catch (error) {
    console.error('Google Auth URL generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Google нэвтрэх холболтыг үүсгэхэд алдаа гарлаа' 
    });
  }
};

// Handle Google OAuth Callback
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      // Get frontend origin from environment or default to localhost:3000
      const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Error</title>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'google_auth_error',
                message: 'Баталгаажуулах код шаардлагатай'
              }, '${frontendOrigin}');
            }
            setTimeout(() => window.close(), 1000);
          </script>
        </head>
        <body>
          <p>Алдаа: Баталгаажуулах код шаардлагатай</p>
        </body>
        </html>
      `);
    }
    
    // Exchange authorization code for tokens
    const { tokens } = await googleClient.getToken(code);
    
    // Verify ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const avatar = payload.picture;
    
    // Check if user exists by google_id or email
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { google_id: googleId },
          { email: email }
        ]
      },
      attributes: ['id', 'email', 'full_name', 'first_name', 'last_name', 'avatar', 'google_id', 'provider', 'is_verified', 'is_active', 'role', 'phone', 'facebook_id', 'supervisor_id', 'created_at', 'updated_at']
    });
    
    // User creation/update logic
    if (!user) {
      // Create new user
      user = await User.create({
        google_id: googleId,
        email: email,
        full_name: name || `${payload.given_name} ${payload.family_name}`,
        first_name: payload.given_name || '',
        last_name: payload.family_name || '',
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}`,
        provider: 'google',
        is_verified: payload.email_verified || true,
        is_active: true,
        role: 'worker'
      });
    } else {
      // Update existing user
      const updates = {
        provider: 'google',
        is_verified: true
      };
      
      if (!user.google_id) updates.google_id = googleId;
      if (!user.avatar && avatar) updates.avatar = avatar;
      if (!user.full_name && name) updates.full_name = name;
      
      await user.update(updates);
    }
    
    // Generate JWT token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Save refresh token
    await user.update({ refresh_token: refreshToken });
    
    // Prepare user response
    const userResponse = prepareUserResponse(user);
    
    // Get frontend origin from environment or default to localhost:3000
    const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Escape special characters for HTML/JavaScript
    const safeToken = token.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const safeRefreshToken = refreshToken.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const safeUserResponse = JSON.stringify(userResponse)
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e');
    
    // Return HTML page that closes the popup and sends data to parent
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google Authentication</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
            animation: fadeIn 0.5s ease-in-out;
          }
          .checkmark {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: scaleIn 0.5s ease-in-out;
          }
          .checkmark svg {
            width: 30px;
            height: 30px;
            color: white;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
            font-weight: 600;
          }
          p {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
          }
          .loader {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>Амжилттай нэвтэрлээ!</h1>
          <p>Та Google хаягаар амжилттай нэвтэрлээ. Энэ цонх автоматаар хаагдах болно.</p>
          <div class="loader"></div>
        </div>
        <script>
          // Send data to parent window
          try {
            const data = {
              success: true,
              message: 'Google хаягаар амжилттай нэвтэрлээ',
              token: '${safeToken}',
              refresh_token: '${safeRefreshToken}',
              user: ${JSON.stringify(userResponse)}
            };
            
            // Send message to parent window with correct frontend origin
            if (window.opener) {
              window.opener.postMessage({
                type: 'google_auth_success',
                ...data
              }, '${frontendOrigin}');
              
              console.log('✅ Auth data sent to parent window at ${frontendOrigin}');
            }
            
          } catch (error) {
            console.error('Error sending auth data:', error);
          }
          
          // Close window after 1.5 seconds
          setTimeout(() => {
            window.close();
          }, 1500);
        </script>
      </body>
      </html>
    `;
    
    res.send(html);
    
  } catch (error) {
    console.error('Google callback error:', error);
    
    let errorMessage = 'Google нэвтрэхэд алдаа гарлаа';
    
    if (error.message.includes('invalid_grant')) {
      errorMessage = 'Баталгаажуулах код хугацаа нь дууссан';
    }
    
    // Escape error message for JavaScript
    const safeErrorMessage = errorMessage
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    
    // Get frontend origin
    const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Return error HTML page
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication Error</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f56565 0%, #ed64a6 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
          }
          .error-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #f56565;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
          .error-icon svg {
            width: 30px;
            height: 30px;
            color: white;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            margin-bottom: 20px;
          }
          button {
            background: #f56565;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.3s;
          }
          button:hover {
            background: #e53e3e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>Алдаа гарлаа</h1>
          <p>${errorMessage}</p>
          <button onclick="window.close()">Хаах</button>
        </div>
        <script>
          // Send error to parent window
          try {
            const frontendOrigin = '${frontendOrigin}';
            
            if (window.opener) {
              window.opener.postMessage({
                type: 'google_auth_error',
                message: '${safeErrorMessage}'
              }, frontendOrigin);
            }
            
            // Auto-close after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          } catch (error) {
            console.error('Error sending error message:', error);
          }
        </script>
      </body>
      </html>
    `;
    
    res.send(errorHtml);
  }
};
// ==================== FACEBOOK OAUTH ====================

exports.facebookAuth = async (req, res) => {
  try {
    const { accessToken, userId, email, name } = req.body;
    
    if (!accessToken || !userId) {
      return res.status(400).json({
        message: 'Facebook мэдээлэл шаардлагатай'
      });
    }
    
    // Find or create user
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { facebook_id: userId },
          { email: email }
        ]
      },
      attributes: ['id', 'email', 'full_name', 'first_name', 'last_name', 'avatar', 'google_id', 'provider', 'is_verified', 'is_active', 'role', 'phone', 'facebook_id', 'supervisor_id', 'created_at', 'updated_at']
    });
    
    const userData = {
      facebook_id: userId,
      email: email,
      full_name: name || 'Facebook User',
      first_name: name?.split(' ')[0] || '',
      last_name: name?.split(' ').slice(1).join(' ') || '',
      avatar: `https://graph.facebook.com/${userId}/picture?type=large`,
      provider: 'facebook',
      is_verified: true,
      is_active: true,
      role: 'worker'
    };
    
    if (!user) {
      user = await User.create(userData);
    } else {
      const updates = {};
      if (!user.facebook_id) updates.facebook_id = userId;
      if (!user.provider) updates.provider = 'facebook';
      
      if (Object.keys(updates).length > 0) {
        await user.update(updates);
      }
    }
    
    // Generate token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    await user.update({ refresh_token: refreshToken });
    
    const userResponse = prepareUserResponse(user);
    
    res.json({
      message: 'Facebook хаягаар амжилттай нэвтэрлээ',
      token,
      refresh_token: refreshToken,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({
      message: 'Facebook нэвтрэхэд алдаа гарлаа'
    });
  }
};

// Facebook Callback (simplified)
exports.facebookCallback = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Facebook callback received',
      data: req.query
    });
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.status(500).json({
      message: 'Facebook callback алдаа'
    });
  }
};

// ==================== TOKEN MANAGEMENT ====================

// Refresh Access Token
exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        message: 'Refresh token шаардлагатай'
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refresh_token, 
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-12345'
      );
    } catch (error) {
      return res.status(401).json({
        message: 'Хүчингүй эсвэл хугацаа дууссан refresh token'
      });
    }
    
    // Find user with this refresh token
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        refresh_token: refresh_token
      },
      attributes: ['id', 'email', 'full_name', 'first_name', 'last_name', 'avatar', 'google_id', 'provider', 'is_verified', 'is_active', 'role', 'phone', 'facebook_id', 'supervisor_id', 'refresh_token', 'created_at', 'updated_at']
    });
    
    if (!user) {
      return res.status(401).json({
        message: 'Хэрэглэгч олдсонгүй'
      });
    }
    
    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Update refresh token in database
    await user.update({ refresh_token: newRefreshToken });
    
    const userResponse = prepareUserResponse(user);
    
    res.json({
      message: 'Token шинэчлэгдлээ',
      token: newToken,
      refresh_token: newRefreshToken,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      message: 'Token шинэчлэхэд алдаа гарлаа'
    });
  }
};

// Verify Token Middleware
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Токен шаардлагатай" });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: "Токен хүчинтэй биш байна" });
    }
    
    try {
      // Find user - explicitly list attributes to avoid column errors
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'full_name', 'first_name', 'last_name', 'avatar', 'google_id', 'provider', 'is_verified', 'is_active', 'role', 'phone', 'facebook_id', 'supervisor_id', 'created_at', 'updated_at']
      });
      
      if (!user) {
        return res.status(401).json({ message: "Хэрэглэгч олдсонгүй" });
      }
      
      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({ message: "Таны бүртгэл идэвхгүй байна" });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('User lookup error:', error);
      res.status(500).json({ message: "Серверийн алдаа" });
    }
  });
};

// ==================== USER MANAGEMENT ====================

// Get Current User
exports.getCurrentUser = (req, res) => {
  try {
    const userResponse = prepareUserResponse(req.user);
    
    res.json({
      success: true,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа'
    });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, email } = req.body;
    const userId = req.user.id;
    
    const updates = {};
    
    if (full_name) updates.full_name = full_name.trim();
    if (phone) {
      // Validate phone number format
      const phoneRegex = /^[89]\d{7}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: "Утасны дугаар буруу форматтай байна" });
      }
      updates.phone = phone.trim();
    }
    if (email) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Имэйл хаяг буруу форматтай байна" });
      }
      updates.email = email.trim();
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'Шинэчлэх мэдээлэл оруулна уу'
      });
    }
    
    await User.update(updates, {
      where: { id: userId }
    });
    
    // Get updated user
    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'email', 'full_name', 'first_name', 'last_name', 'avatar', 'google_id', 'provider', 'is_verified', 'is_active', 'role', 'phone', 'facebook_id', 'supervisor_id', 'created_at', 'updated_at']
    });
    const userResponse = prepareUserResponse(updatedUser);
    
    res.json({
      message: 'Профайл амжилттай шинэчлэгдлээ',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Профайл шинэчлэхэд алдаа гарлаа'
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Хуучин болон шинэ нууц үгээ оруулна уу'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Шинэ нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэх ёстой'
      });
    }
    
    // Get user with password
    const user = await User.findByPk(userId, {
      attributes: { include: ['password'] }
    });
    
    if (!user.password) {
      return res.status(400).json({
        message: 'Энэ хаяг нь нийгмийн сүлжээгээр нэвтэрсэн байна'
      });
    }
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Хуучин нууц үг буруу байна'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await user.update({
      password: hashedPassword
    });
    
    res.json({
      message: 'Нууц үг амжилттай солигдлоо'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Нууц үг солиход алдаа гарлаа'
    });
  }
};

// ==================== LOGOUT ====================

// Logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Clear refresh token from database
    if (userId) {
      await User.update({ refresh_token: null }, {
        where: { id: userId }
      });
    }
    
    res.json({
      message: 'Амжилттай гарлаа'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Гарахад алдаа гарлаа'
    });
  }
};