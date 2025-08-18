// import Alumni from '../models/Alumni.js';
// import axios from 'axios';
// import { cloudinary, upload } from '../config/cloudinaryConfig.js';
// //import { Configuration, OpenAIApi } from 'openai';


// // // Initialize OpenAI with API key
// // const configuration = new Configuration({
// //   apiKey: process.env.OPENAI_API_KEY
// // });
// // const openai = new OpenAIApi(configuration);

// export const searchAlumni = async (req, res) => {
//   const { query, firstName, lastName, graduationYear, department, location, email } = req.query;

//   try {
//     const filter = {};

//     if (query) filter.$text = { $search: query };
//     if (graduationYear) filter.graduationYear = graduationYear;
//     if (firstName) filter.firstName = firstName;
//     if (lastName) filter.lastName = lastName;
//     if (email) filter.email = email;
//     if (department) filter.department = department;
//     if (location) filter.location = location;

//     // Fetch alumni matching search criteria
//        const alumniList = await Alumni.find(filter);


// // Step 2: Use Mistral API to refine and provide suggestions
//     // const mistralResponse = await axios.post(
//     //   'https://api.mistral.ai/v1/completions',
//     //   {
//     //     model: 'mistral-medium', // or your preferred model
//     //     prompt: `Provide suggestions for alumni profiles based on these search criteria: query: "${query || ''}", graduationYear: "${graduationYear || ''}", department: "${department || ''}", location: "${location || ''}".`,
//     //     max_tokens: 100
//     //   },
//     //   {
//     //     headers: {
//     //       'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//     //       'Content-Type': 'application/json'
//     //     }
//     //   }
//     // );

//   const mistralResponse = await axios.post(
//   'https://api.mistral.ai/v1/chat/completions',
//   {
//     model: 'mistral-medium', // or your preferred model
//     messages: [
//       {
//         role: 'user',
//         content: `Provide suggestions for alumni profiles based on these search criteria: query: "${query || ''}", graduationYear: "${graduationYear || ''}", department: "${department || ''}", location: "${location || ''}".`
//       }
//     ],
//     max_tokens: 100
//   },
//   {
//     headers: {
//       'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//       'Content-Type': 'application/json'
//     }
//   }
// );


//      // Parse AI suggestions and clean up response text
//     //const aiSuggestions = mistralResponse.data.choices[0].text.trim().split('\n');
//     const aiRawSuggestions = mistralResponse.data.choices[0].message.content.trim().split('\n');

//      // Clean up the suggestions
//   function formatSuggestions(suggestions) {
//     if (!Array.isArray(suggestions)) return [];
//     return suggestions
//       .filter(line =>
//         line.trim() &&
//         !line.toLowerCase().includes('suggestions for alumni profiles') &&
//         !line.startsWith('###')
//     )
//       .map(line => line.trim());
// }
//     //const aiSuggestions = mistralResponse.data.choices[0].message.content.trim().split('\n');
//     const aiSuggestions = formatSuggestions(aiRawSuggestions);
    
//     // Respond with alumni data and AI-generated suggestions
//     return res.status(200).json({ alumni: alumniList, suggestions: aiSuggestions });

//   } catch (error) {
//     console.error('Error in searchAlumni:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };



// // Function to add a new alumni
// export const addAlumni = async (req, res) => {

//   try {
//     const { firstName,lastName,currentPosition,company, linkedInProfile,
//     graduationYear, department, location, email, matNo, facebookProfile, xProfile, achievements } = req.body;

//   if ( !firstName || !graduationYear || !department || !location || !email) {
//     return res.status(400).json({ message: 'All fields are required' });
//   }

//    // Image is automatically uploaded to Cloudinary by multer middleware
//    //const profileImage = req.file ? req.file.path : null;


//     const newAlumni = new Alumni({
//       firstName,
//       lastName,
//       graduationYear,
//       matNo,
//       linkedInProfile,
//       facebookProfile,
//       xProfile,
//       achievements,
//       department,
//       currentPosition,
//       company,
//       location,
//       email,
//       //profileImage // Storing Cloudinary URL in the database
//     });

//     await newAlumni.save();
//     res.status(201).json({ message: 'Alumni added successfully', alumni: newAlumni });
//   } catch (error) {
//     console.error('Error adding alumni:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


import Alumni from '../models/Alumni.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { cloudinary } from '../config/cloudinaryConfig.js';
import { validationResult } from 'express-validator';




export const getAlumniLogin = (req, res) => {
  return res.render('pages/alumni/login', { 
    title: 'Alumni Login',
    error: null
  });
};

export const postAlumniLogin = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const alumni = await Alumni.findOne({ email });
    if (!alumni) {
      return res.status(401).render('pages/alumni/login', { 
        title: 'Alumni Login',
        error: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, alumni.password);
    if (!isMatch) {
      return res.status(401).render('pages/alumni/login', { 
        title: 'Alumni Login',
        error: 'Invalid credentials' 
      });
    }

    req.session.alumni = alumni;
    return res.redirect('/alumni/dashboard');
  } catch (err) {
    console.error(err);
    return res.status(500).render('pages/alumni/login', { 
      title: 'Alumni Login',
      error: 'Server error' 
    });
  }
};

export const alumniLogout = (req, res) => {
  req.session.destroy();
  res.redirect('pages/alumni/login');
};


export const getSearchAlumniPage = async (req, res) => {
   return res.render('pages/alumni/searchForm', {
    title: 'Search Alumni',
    alumni: req.session.alumni,
    query: req.query.query || '' // Pass query to the template, default to empty string

  });
}
// Search Alumni (local DB + Mistral API)
// export const searchAlumni = async (req, res) => {
//   try {
//     const { query } = req.query;

//     // Local database search
//     const localResults = await Alumni.find({
//       $or: [
//         { firstName: { $regex: query, $options: 'i' } },
//         { lastName: { $regex: query, $options: 'i' } },
//         { email: { $regex: query, $options: 'i' } }
//       ]
//     });

//     // Example: Mistral API search (replace with actual endpoint if needed)
//     // const apiResults = await axios.get(`https://api.mistral.ai/search?q=${query}`, {
//     //   headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` }
//     // });

//   const apiResults = await axios.post(
//   'https://api.mistral.ai/v1/chat/completions',
//   {
//     model: 'mistral-medium',
//     messages: [
//       {
//         role: 'user',
//         content: `Provide suggestions for alumni profiles based on these search criteria: query: "${query || ''}".`
//       }
//     ],
//     max_tokens: 100
//   },
//   {
//     headers: {
//       'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//       'Content-Type': 'application/json'
//     }
//   }
// );

//     res.render('pages/alumni/search-results', { 
//       title: 'Search Results',
//       localResults,
//       apiResults: apiResults.data 
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).render('pages/error', { 
//       title: 'Error',
//       error: 'Failed to search alumni' 
//     });
//   }
// };


export const searchAlumni = async (req, res) => {
  try {
    const { query } = req.query;

    // 1. First perform local database search
    const localResults = await Alumni.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { currentPosition: { $regex: query, $options: 'i' } },
        { currentCompany: { $regex: query, $options: 'i' } }
      ]
    }).limit(50); // Limit results for AI processing

    // 2. Prepare context for Mistral with actual database content
    const alumniContext = localResults.map(alum => ({
      name: `${alum.firstName} ${alum.lastName}`,
      graduation: alum.graduationYear,
      position: alum.currentPosition,
      company: alum.currentCompany,
      skills: alum.skills?.join(', ')
    })).slice(0, 20); // Send a subset for analysis

    // 3. Enhanced Mistral query that analyzes the actual database results
    const mistralResponse = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-medium',
        messages: [
          {
            role: 'system',
            content: `You are an alumni search assistant. Analyze the following alumni data and provide insights, patterns, and suggestions based on the search query: "${query}".`
          },
          {
            role: 'user',
            content: `Search Query: "${query}"
            Alumni Data (JSON): ${JSON.stringify(alumniContext)}
            
            Please:
            1. Identify any interesting patterns in the results
            2. Suggest alternative search approaches if results are limited
            3. Highlight notable alumni based on the search
            4. Provide any career/industry trends visible in the results`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.render('pages/alumni/search-results', { 
      title: 'Search Results',
      query,
      localResults,
      apiResults: mistralResponse.data,
      alumniContext: alumniContext // Optional: pass to view if needed
    });
  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).render('pages/error', { 
      title: 'Error',
      error: err.response?.data?.message || 'Failed to search alumni' 
    });
  }
};

// Add Alumni
/*export const addAlumni = async (req, res) => {
  try {
    const { firstName, lastName, matNo, graduationYear, degree, department,
      currentPosition, company, location, email, image,
      linkedInProfile, facebookProfile, xProfile, achievements, password
    } = req.body;
    
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      image = result.secure_url;
    }

    const newAlumni = new Alumni({
      firstName,
      lastName,
      matNo,
      graduationYear,
      degree,
      department,
      currentPosition,
      company,
      location,
      email,
      image,
      linkedInProfile,
      facebookProfile,
      xProfile,
      achievements,
      password
    });

    await newAlumni.save();
    console.log('New alumni added successfully:', newAlumni);
    res.redirect('/alumni/login');
  } catch (err) {
    console.error(err);
    res.status(400).render('pages/alumni/register', { 
      title: 'Alumni Registration',
      error: 'All required fields must be filled.' 
    });
  }
}; */

// Delete Alumni
export const deleteAlumni = async (req, res) => {
  try {
    const { id } = req.params;
    await Alumni.findByIdAndDelete(id);
    res.redirect('/alumni');
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', { 
      title: 'Error',
      error: 'Failed to delete alumni' 
    });
  }
};

// Get Edit Alumni Page
export const getEditAlumni = async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);
    res.render('pages/edit-alumni', { 
      title: 'Edit Alumni',
      alumni 
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', { 
      title: 'Error',
      error: 'Failed to fetch alumni' 
    });
  }
};

// Update Alumni
export const updateAlumni = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, graduationYear, degree, email, phone, currentJob, company } = req.body;
    let updateData = { firstName, lastName, graduationYear, degree, email, phone, currentJob, company };
    
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      updateData.image = result.secure_url;
    }

    await Alumni.findByIdAndUpdate(id, updateData);
    res.redirect('/alumni');
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', { 
      title: 'Error',
      error: 'Failed to update alumni' 
    });
  }
};

// Get All Alumni
export const getAllAlumni = async (req, res) => {
  try {
    const alumni = await Alumni.find().sort({ graduationYear: -1 });
    res.render('pages/alumni', { 
      title: 'All Alumni',
      alumni 
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', { 
      title: 'Error',
      error: 'Failed to fetch alumni' 
    });
  }
};




export const getDashboard = async (req, res) => {
  try {
    const alumniCount = await Alumni.countDocuments();
    const recentAlumni = await Alumni.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('pages/alumni/alumni-dashboard', {
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

export const getAlumniDashboard = async (req, res) => {
  res.render('pages/alumni/alumni-dashboard', {
    title: 'Alumni Dashboard',
    alumni: req.session.alumni
  });
};


export const getAlumniRegister = (req, res) => {
  res.render('pages/alumni/register', { title: 'Alumni Registration', error: null });
};

export const postAlumniRegister = async (req, res) => {
   // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     // Render the form with errors and return to prevent further execution
    return res.status(400).render('pages/alumni/register', {
      title: 'Alumni Registration',
      error: errors.array().map(e => e.msg).join(', ')
    });
  }

 try {
    const {
      firstName,
      lastName,
      matNo,
      department,
      graduationYear,
      degree,
      email,
      password,
      location,
      currentPosition,
      company,
      linkedInProfile,
      facebookProfile,
      xProfile,
      achievements
    } = req.body;

    // Check if alumni already exists
    let alumni = await Alumni.findOne({ email });
    if (alumni) {
      return res.status(400).json({ msg: 'Alumni already exists' });
    }

     // Check if matric number already exists
    alumni = await Alumni.findOne({ matNo });
    if (alumni) {
      return res.status(400).json({ msg: 'Matriculation number already in use' });
    }


     if (!password) {
      return res.status(400).render('pages/alumni/register', {
        title: 'Alumni Registration',
        error: 'Password is required.'
      });
    } 
    
    //   let image = req.body.image;
    // if (req.file) {
    //   const result = await cloudinary.uploader.upload(req.file.path);
    //   image = result.secure_url;
    // } 

    let image = '';
    if (req.file) {
      image = '/uploads/' + req.file.filename; // Save the relative path
    }

 
// Create new alumni instance
    alumni = new Alumni({
      firstName,
      lastName,
      matNo,
      department,
      graduationYear: new Date(graduationYear),
      degree,
      email,
      password,
      location,
      currentPosition,
      company,
      socialMedia: {
        linkedIn: linkedInProfile,
        facebook: facebookProfile,
        x: xProfile
      },
      achievements,
      image
    }); 

    console.log('Image to save:', image);

  
    // Hash password
    // const salt = await bcrypt.genSalt(10);
    // alumni.password = await bcrypt.hash(password, salt);

    // Save to database
    await alumni.save();
    // Respond with success
    // res.status(201).json({ msg: 'Alumni registered successfully', alumni });    
    return res.redirect('/alumni/login');
  } catch (err) {
    console.error(err);
    res.status(400).render('pages/alumni/register', { 
      title: 'Alumni Registration',
      error: 'All required fields must be filled.' 
    });
  }
};



