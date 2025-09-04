import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Generate token
export const generateToken = (user, type) => {
  return jwt.sign(
    { id: user._id, type }, 
    JWT_SECRET, 
    { expiresIn: '1d' }
  );
};

// Verify token middleware
export const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization'];

  if (!token) {
    return res.redirect('/login'); // Or res.status(401).json({ message: 'No token' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded; // { id, type }
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.redirect('/login');
  }
};

