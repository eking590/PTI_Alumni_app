


// middlewares/jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Generate token
export const generateToken = (user, type) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      type 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' } // Longer expiration for better testing
  );
};

// Verify token middleware - SIMPLIFIED AND FIXED
export const verifyToken = (req, res, next) => {
  console.log('Cookies:', req.cookies); // Debug: see what cookies are available
  console.log('Auth header:', req.headers['authorization']); // Debug headers

  // Get token from cookie first, then from authorization header
  let token = req.cookies?.token;
  
  // If no token in cookie, check authorization header
  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  console.log('Extracted token:', token); // Debug the extracted token

  if (!token) {
    console.log('❌ No token found');
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded:', decoded); // Debug decoded token
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    res.clearCookie('token');
    
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalid or expired' 
      });
    }
    return res.redirect('/login');
  }
};
