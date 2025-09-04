import express from 'express';
import { check } from 'express-validator';
import multer from 'multer';
import { getDashboard, getLogin, postLogin, logout } from '../controllers/adminController.js';
import {
  getAllAlumni,
  //addAlumni,
  getAlumniDashboard,
  getSearchAlumniPage,
  uploadSearchImage,
  searchAlumni,
  processAlumniImages,
  getEditAlumni,
  updateAlumni,
  deleteAlumni, 
  getAlumniLogin, postAlumniLogin,
  getAlumniRegister, postAlumniRegister,
  //Alumnilogin,
  getAlumniEdit
  //getSearchAlumniPage
} from '../controllers/alumniController.js';
import {  ensureAlumniAuthenticated  } from '../middlewares/auth.js'; 

import { validateToken } from '../middlewares/validateToken.js'; 
import { verifyToken } from '../middlewares/jwt.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });



// Admin routes
router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/logout', logout);
router.get('/dashboard', verifyToken, getDashboard);
// Alumni routes
router.get('/', ensureAlumniAuthenticated, getAllAlumni);
//router.get('/alumni/dashboard', ensureAlumniAuthenticated, getAlumniDashboard);
router.get('/alumni/dashboard', verifyToken, getAlumniDashboard);

router.get('/alumni', ensureAlumniAuthenticated, getAllAlumni);
//router.post('/alumni', ensureAuthenticated, addAlumni);
router.get('/alumni/search-form', verifyToken, getSearchAlumniPage);

router.get('/alumni/search', verifyToken, searchAlumni);

//router.get('/alumni/edit/:id', ensureAuthenticated, getEditAlumni);
router.get('/alumni/edit/:id', verifyToken, getEditAlumni);

router.post('/alumni/edit',  verifyToken, upload.single('image'), updateAlumni);
//router.post('/alumni/edit', validateToken, updateAlumni);  

router.get('/alumni/delete/:id', verifyToken, deleteAlumni); 

router.get('/alumni/login',  getAlumniLogin);
router.post('/alumni/login',  postAlumniLogin);

// router.post('/alumni/login', Alumnilogin)

router.get('/alumni/register', getAlumniRegister);

// Register Alumni
router.post('/alumni/register', upload.single('image'),
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('matNo', 'Matriculation number is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('graduationYear', 'Graduation year is required').not().isEmpty()
  ], 
  postAlumniRegister
);

// GET - Display search form
router.get('/search', getSearchAlumniPage);

// POST - Handle form submission (both text and image search)
router.post('/search', uploadSearchImage, searchAlumni);

// POST - Handle form submission (both text and image search)
router.get('/process-images', processAlumniImages);

// GET - Handle text-only searches (optional)
router.get('/search/results', searchAlumni); 


//router.get('/alumni/edit-profile', verifyToken, getEditAlumni);

router.get('/alumni/edit-profile', verifyToken, getAlumniEdit);
//router.post('/alumni/register', postAlumniRegister);

//EJS routes 













export default router;
