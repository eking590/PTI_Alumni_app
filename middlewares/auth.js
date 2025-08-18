export const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) {
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
export const ensureAlumniAuthenticated = (req, res, next) => {
  if (req.session && req.session.alumni) {
    return next();
  }
  res.redirect('/alumni/login');
};