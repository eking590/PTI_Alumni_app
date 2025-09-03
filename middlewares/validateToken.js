// export const ensureAuthenticated = (req, res, next) => {
//   if (req.session && req.session.admin) {
//     return next();
//   }
//   res.redirect('/login');
// };

// Direct fix for your existing ensureAuthenticated middleware
export const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  
  // ADD THIS: Check for alumni session too
  if (req.session && req.session.alumni) {
    return next();
  }
  
  res.redirect('/login');
};





// Admin auth middleware
// export const ensureAuthenticated = (req, res, next) => {
//   if (req.session && req.session.admin) {
//     return next();
//   }
//   res.redirect('/login');
// };

// Alumni auth middleware
// export const ensureAlumniAuthenticated = (req, res, next) => {
//   // Check if alumni is logged in (using session)
//   if (req.session && req.session.alumni) {
//     // Convert to string if it's an ObjectId
//     req.alumniId = req.session.alumni.toString ? req.session.alumni.toString() : req.session.alumni;
//     return next();
//   }
  
//   // Check if using JWT tokens
//   if (req.user) {
//     return next();
//   }
  
//   // If not authenticated, redirect to login
//   res.redirect('/alumni/login');
// };


// middleware/alumniAuth.js
export const ensureAlumniAuthenticated = (req, res, next) => {
  console.log('Checking alumni authentication...');
  console.log('Session alumni:', req.session.alumni);
  console.log('Session admin:', req.session.admin);
  console.log('User:', req.user);
  
  // Check if alumni is logged in (using session)
if (req.session.alumniId) {
    console.log('Alumni authenticated with ID:', req.session.alumniId);
    return next();
  }
  
  // Check for user object with alumni type
  if (req.session.user && req.session.user.type === 'alumni') {
    console.log('Alumni authenticated via user object:', req.session.user.id);
    return next();
  }
  
  // Check if admin is logged in
  if (req.session.admin) {
    console.log('Admin authenticated, allowing access');
    return next();
  }
  
  console.log('No authentication found, redirecting to login');
  res.redirect('/alumni/login');
};

export const ensureAlumniSession = (req, res, next) => {
  if (req.session && req.session.alumniId) {
    return next();
  }
  res.redirect('/alumni/login');
};
