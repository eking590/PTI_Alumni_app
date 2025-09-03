// import express from 'express';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import cors from "cors";
// import session from 'express-session';
// import bodyParser from "body-parser";
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { db } from './config/db.js';

// // Import routes
// import alumniRoutes from './routes/alumniRoutes.js';
// import frontendRoutes from './routes/frontendRoutes.js';

// dotenv.config();
// const app = express();
// app.use(express.json());

// app.use(bodyParser.json({ limit: '10mb' }));
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors());

// // Set EJS as the templating engine
// app.set('view engine', 'ejs');
// //app.set('views', path.join(process.cwd(), 'views')); // Make sure 'views' folder is in your project root

// // Set views directory path
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.set('views', path.join(__dirname, 'views'));

// // MongoDB connection
// // mongoose.connect(process.env.MONGODB_URI, {
// //   useNewUrlParser: false,
// //   useUnifiedTopology: false,
// // }).then(() => {
// //   console.log('Connected to MongoDB');
// // }).catch(err => console.error(err));

// // Routes
// app.use('/app/api/', alumniRoutes);
// app.use('/', frontendRoutes);

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server listening on port http://localhost:${process.env.PORT}  `));


import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import cors from "cors";

import flash from 'express-flash';

//import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './config/db.js';;
import routes from './routes/index.js';

dotenv.config();

const app = express();

// Connect to database
db;



// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));


// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET ||   'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/PTI-alumni',
      ttl: 60 * 60 * 24 * 14, // 14 days
    }), 
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24 * 14 // = 14 days
     } // Set to true if using https
}));

app.use(flash());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', routes);



// Set default template variables
app.use((req, res, next) => {
  res.locals.error = null;
  res.locals.title = 'Alumni Management';
  next();
});
// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { 
    title: 'Error',
    error: 'Something went wrong!' 
  });
});



// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});


//Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port http://localhost:${process.env.PORT}  `));
