import Admin from '../models/Admin.js';
import Alumni from '../models/Alumni.js';
import { generateToken } from '../middlewares/jwt.js';

export const getLogin = (req, res) => {
  return res.render('pages/admin/login', { title: 'Admin Login',  error: null });
};


export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    const token = generateToken(admin, 'admin');

    // Save token in cookie
    res.cookie('token', token, { httpOnly: true, secure: false });

    return res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error');
    res.redirect('/login');
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};  


export const getDashboard = async (req, res) => {
  if (req.user.type !== 'admin') {
    return res.redirect('/login');
  }
   
   try {
  const alumniCount = await Alumni.countDocuments();
  const recentAlumni = await Alumni.find().sort({ createdAt: -1 }).limit(5);
  const admin = await Admin.findById(req.user.id);
  res.render('pages/admin/dashboard', { 
       title: 'Dashboard',
      alumniCount,
      recentAlumniCount: recentAlumni.length,
      recentAlumni,
      admin 
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load dashboard'
    });
  }
};
