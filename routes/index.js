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
  getAlumniRegister, postAlumniRegister
  //getSearchAlumniPage
} from '../controllers/alumniController.js';
import { ensureAuthenticated, ensureAlumniAuthenticated } from '../middlewares/auth.js';

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
router.get('/dashboard', ensureAuthenticated, getDashboard);
// Alumni routes
router.get('/', ensureAuthenticated, getAllAlumni);
router.get('/alumni/dashboard', ensureAlumniAuthenticated, getAlumniDashboard);
router.get('/alumni', ensureAuthenticated, getAllAlumni);
//router.post('/alumni', ensureAuthenticated, addAlumni);
router.get('/alumni/search-form', ensureAuthenticated, getSearchAlumniPage);

router.get('/alumni/search', ensureAuthenticated, searchAlumni);
router.get('/alumni/edit/:id', ensureAuthenticated, getEditAlumni);
router.post('/alumni/edit/:id', ensureAuthenticated, updateAlumni);
router.get('/alumni/delete/:id', ensureAuthenticated, deleteAlumni);

router.get('/alumni/login', getAlumniLogin);
router.post('/alumni/login', postAlumniLogin);

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

//router.post('/alumni/register', postAlumniRegister);

//EJS routes 

export default router;
