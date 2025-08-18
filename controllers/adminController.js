import Admin from '../models/Admin.js';
import Alumni from '../models/Alumni.js';

export const getLogin = (req, res) => {
  return res.render('pages/admin/login', { title: 'Admin Login',  error: null });
};

// export const postLogin = async (req, res) => {
//   const { username, password } = req.body;
  
//   try {
//     const admin = await Admin.findOne({ username });
//     if (!admin) {
//       return res.status(401).render('pages/login', { 
//         title: 'Admin Login',
//         error: 'Invalid credentials' 
//       });
//     }

//     const isMatch = await admin.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).render('pages/login', { 
//         title: 'Admin Login',
//         error: 'Invalid credentials' 
//       });
//     }

//     req.session.admin = admin;
//     res.redirect('/dashboard');
//   } catch (err) {
//     console.error(err);
//     res.status(500).render('pages/login', { 
//       title: 'Admin Login',
//       error: 'Server error' 
//     });
//   }
// };

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

    req.session.admin = admin;
    return res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error');
    res.redirect('/login');
  }
};

export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.redirect('/login');
  })
};  


export const getDashboard = async (req, res) => {
  try {
    const alumniCount = await Alumni.countDocuments();
    const recentAlumni = await Alumni.find().sort({ createdAt: -1 }).limit(5);

    res.render('pages/admin/dashboard', {
      title: 'Dashboard',
      alumniCount,
      recentAlumniCount: recentAlumni.length,
      recentAlumni
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load dashboard'
    });
  }
};