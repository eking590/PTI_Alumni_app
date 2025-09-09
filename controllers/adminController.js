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
  const verifiedCount = await Alumni.countDocuments({ verified: true });
  const pendingCount = await Alumni.countDocuments({ verified: false });
  const recentAlumni = await Alumni.find().sort({ createdAt: -1 }).limit(5);
  const admin = await Admin.findById(req.user.id);
  res.render('pages/admin/dashboard', { 
       title: 'Dashboard',
      alumniCount,
      verifiedCount,
      pendingCount,
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


// Get pending verification list
export const getPendingVerifications = async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.redirect('/login');
    }

    const pendingAlumni = await Alumni.find({ verified: false })
      .sort({ createdAt: -1 })
      .limit(50);

    res.render('pages/admin/verifications', {
      title: 'Pending Verifications',
      pendingAlumni,
      admin: req.user,
      jwtToken: req.cookies.token // Pass token to template
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load pending verifications'
    });
  }
};

// Verify an alumni
export const verifyAlumni = async (req, res) => {
  try {
    console.log('Verification request by user:', req.user);

    if (req.user.type !== 'admin') {
      console.log('❌ Unauthorized: User is not admin');
      return res.status(403).json({ success: false, 
        message: 'Unauthorized: Admin access required' });
    }

    const { alumniId } = req.params;
    console.log('Verifying alumniId:', alumniId);

    const alumni = await Alumni.findById(alumniId);

    if (!alumni) {
      return res.status(404).json({ success: false, 
        message: 'Alumni not found' });
    }
    // Check if already verified
    if (alumni.verified) {
      return res.status(400).json({ success: false, 
        message: 'Alumni is already verified' });
    }
    alumni.verified = true;
    alumni.verificationDate = new Date();
    alumni.verifiedBy = req.user.id;

    await alumni.save();

    console.log('✅ Alumni verified:', alumni.email);

    req.flash('success', 'Alumni verified successfully');
    res.json({ 
      success: true, 
      message: 'Alumni verified successfully' ,
      alumni: {
        alumniId: alumni._id,
        name: `${alumni.firstName} ${alumni.lastName}`, 
        email: alumni.email,
        matNo: alumni.matNo,
        department: alumni.department,
        graduationYear: alumni.graduationYear,
      }
    });
  } catch (err) {
    console.error('verification error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message});
  }
};

// Reject an alumni (delete or mark as rejected)
export const rejectAlumni = async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { alumniId } = req.params;
    const { reason } = req.body;

    // Option 1: Delete the alumni
     // Find alumni first to get email for potential notification
    const alumni = await Alumni.findById(alumniId);
    //await Alumni.findByIdAndDelete(alumniId);
    if (!alumni) {
      return res.status(404).json({ success: false, message: 'Alumni not found' });
    }
    
    const alumniEmail = alumni.email;

     // Delete the alumni
    await Alumni.findByIdAndDelete(alumniId);
    // Option 2: Or mark as rejected (if you want to keep records)
    // const alumni = await Alumni.findById(alumniId);
    // alumni.verificationStatus = 'rejected';
    // alumni.rejectionReason = reason;
    // await alumni.save();

    req.flash('success', 'Alumni registration rejected');
     res.json({ 
      success: true, 
      message: 'Alumni registration rejected',
      rejectedAlumni: {
        id: alumniId,
        email: alumniEmail,
        reason: reason || 'No reason provided'
      }
    });
  } catch (err) {
    console.error('Rejection error:',err);
    res.status(500).json({ success: 
      false, 
      message: 'Server error',
      error: err.message});
  }
};

// Get alumni details for verification
export const getAlumniVerificationDetails = async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.redirect('/login');
    }

    const { alumniId } = req.params;
    const alumni = await Alumni.findById(alumniId);

    if (!alumni) {
      return res.status(404).render('pages/error', {
        title: 'Error',
        error: 'Alumni not found'
      });
    }

    res.render('pages/admin/verification-details', {
      title: 'Verification Details',
      alumni,
      admin: req.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load verification details'
    });
  }
};
