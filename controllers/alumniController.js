


import Alumni from '../models/Alumni.js';
import bcrypt from 'bcryptjs';
import ImageProcessor from '../config/ImageProcessor.js'; 
import path from 'path';
import upload from '../middlewares/upload.js';
import fs from 'fs';
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
    // Trim and lowercase email for consistency
    const normalizedEmail = email.toLowerCase().trim();

    const alumni = await Alumni.findOne({  email: normalizedEmail  });
    if (!alumni) {
      return res.status(401).render('pages/alumni/login', { 
        title: 'Alumni Login',
        error: 'Invalid credentials',
        email: email 
      });
    }

    // Debug: Check what's being compared
    console.log('Input password:', password);
    console.log('Stored hash:', alumni.password);
    console.log('Alumni found:', alumni.email);

    const isMatch = await bcrypt.compare(password, alumni.password);
    if (!isMatch) {
      return res.status(401).render('pages/alumni/login', { 
        title: 'Alumni Login',
        error: 'Invalid credentials', 
        email: email 
      });
    }

     req.session.alumni = {
      id: alumni._id,
      email: alumni.email,
      firstName: alumni.firstName,
      lastName: alumni.lastName,
      image: alumni.image
    };

    console.log('Session created for:', alumni.email);
    
    return res.redirect('/alumni/dashboard');
  } catch (err) {
    console.error(err);
    return res.status(500).render('pages/alumni/login', { 
      title: 'Alumni Login',
      error: 'Server error' ,
      email: email 
    });
  }
};

export const alumniLogout = (req, res) => {
  req.session.destroy();
  res.redirect('pages/alumni/login');
};


// export const getSearchAlumniPage = async (req, res) => {
//    return res.render('pages/alumni/searchForm', {
//     title: 'Search Alumni',
//     alumni: req.session.alumni,
//     query: req.query.query || '' // Pass query to the template, default to empty string

//   });
// }
// export const getSearchAlumniPage = async (req, res) => {
//   return res.render('pages/alumni/searchForm', {
//     title: 'Search Alumni',
//     alumni: req.session.alumni,
//     query: req.query.query || '',
//     includeImageAnalysis: req.query.includeImageAnalysis === 'true',
//     onlyWithImages: req.query.onlyWithImages === 'true',
//     department: req.query.department || '',
//     graduationYear: req.query.graduationYear || '',
//     company: req.query.company || ''
//   });
// }
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
export const getSearchAlumniPage = async (req, res) => {
  return res.render('pages/alumni/searchForm', {
    title: 'Search Alumni',
    alumni: req.session.alumni,
    query: req.query.query || '',
    searchByImage: req.query.searchByImage === 'true',
    includeImageAnalysis: req.query.includeImageAnalysis === 'true',
    onlyWithImages: req.query.onlyWithImages === 'true',
    department: req.query.department || '',
    graduationYear: req.query.graduationYear || '',
    company: req.query.company || ''
  });
};

export const uploadSearchImage = upload.single('searchImage');

export const searchAlumni = async (req, res) => {
  try {
    const searchParams = req.method === 'POST' ? { ...req.body, ...req.query } : req.query;

    const { 
      query, 
      includeImageAnalysis, 
      onlyWithImages, 
      searchByImage,
      department, 
      graduationYear, 
      company 
    }  = searchParams;

    let searchQuery = {};
    let searchImageFeatures = [];
    let searchImageHash = '';

    if (searchByImage === 'true' && req.file) {
      try {
        const imageBuffer = fs.readFileSync(req.file.path);
        searchImageFeatures = await ImageProcessor.extractImageFeatures(imageBuffer);
        searchImageHash = await ImageProcessor.generateImageHash(imageBuffer);

        fs.unlinkSync(req.file.path);

        searchQuery = {
          image: { $exists: true, $ne: '' },
          imageFeatures: { $exists: true, $ne: [] }
        };

      } catch (imageError) {
        console.error('Image processing error:', imageError);
        return res.status(400).render('pages/error', {
          title: 'Error',
          error: imageError.message || 'Failed to process the uploaded image'
        });
      }
    } else if (query) {
      // Text-based search - only apply regex to string fields
      searchQuery = {
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { currentPosition: { $regex: query, $options: 'i' } },
          { company: { $regex: query, $options: 'i' } },
          { department: { $regex: query, $options: 'i' } },
          { degree: { $regex: query, $options: 'i' } },
          { matNo: { $regex: query, $options: 'i' } },
          { achievements: { $in: [new RegExp(query, 'i')] } }
        ]
      };
    } else {
      // If no query provided, return all alumni (or apply filters only)
      searchQuery = {};
    }

    // Add optional filters - handle different field types properly
    if (department && department !== 'All Departments') {
      searchQuery.department = { $regex: department, $options: 'i' };
    }
    
    if (graduationYear && graduationYear !== 'All Years') {
      // Convert string year to Date object for comparison
      const yearStart = new Date(parseInt(graduationYear), 0, 1);
      const yearEnd = new Date(parseInt(graduationYear) + 1, 0, 1);
      
      searchQuery.graduationYear = {
        $gte: yearStart,
        $lt: yearEnd
      };
    }
    
    if (company && company.trim() !== '') {
      searchQuery.company = { $regex: company.trim(), $options: 'i' };
    }
    
    if (onlyWithImages === 'true') {
      searchQuery.image = { $exists: true, $ne: '' };
    }

    let localResults = await Alumni.find(searchQuery).limit(100);

    // For image search, calculate similarity scores
    if (searchByImage === 'true' && searchImageFeatures.length > 0) {
      localResults = await Promise.all(
        localResults.map(async (alum) => {
          if (alum.imageFeatures?.length > 0) {
            const similarity = ImageProcessor.calculateSimilarity(
              searchImageFeatures, 
              alum.imageFeatures
            );
            const hashSimilarity = 1 - ImageProcessor.compareHashes(
              searchImageHash, 
              alum.imageHash
            );
            
            const finalScore = (similarity * 0.7) + (hashSimilarity * 0.3);

            // Check if images are actually similar using stricter criteria
            const isActuallySimilar = ImageProcessor.areImagesSimilar(
            searchImageFeatures,
            alum.imageFeatures,
            searchImageHash,
            alum.imageHash,
            0.65 // 65% similarity threshold
        );



            return { ...alum.toObject(), 
              similarityScore: finalScore, 
              isSimilar: isActuallySimilar };
          }
          return { ...alum.toObject(), 
            similarityScore: 0,
            isSimilar: false };
        })
      );


    // Filter out non-similar images first
    const similarResults = localResults.filter(alum => alum.isSimilar);

    // Then sort by similarity score
    similarResults.sort((a, b) => b.similarityScore - a.similarityScore);


    // Return only similar results or empty array
    localResults = similarResults.length > 0 ? similarResults : [];
    
    console.log(`Found ${similarResults.length} similar images out of ${localResults.length} total`);
      //localResults.sort((a, b) => b.similarityScore - a.similarityScore);
    }

    const alumniContext = localResults.slice(0, 20).map(alum => ({
      name: `${alum.firstName} ${alum.lastName}`,
      graduation: alum.graduationYear,
      position: alum.currentPosition,
      company: alum.company,
      department: alum.department,
      degree: alum.degree,
      skills: alum.achievements?.join(', '),
      image: alum.image,
      similarityScore: alum.similarityScore
    }));

    let mistralResponse = null;
    let imageAnalysis = null;
    let imageSearchAnalysis = null;

    if (localResults.length > 0) {
      let mistralPrompt = '';
      
      if (searchByImage === 'true') {
        mistralPrompt = `Image Search Results: ${localResults.length} matches found
        Top Matches: ${alumniContext.slice(0, 5).map(a => a.name).join(', ')}
        
        Please analyze:
        1. Quality of image matching results
        2. Patterns in the matched profiles
        3. Suggestions for better image searches
        4. Any notable alumni in the results`;
      } else {
        mistralPrompt = `Search Query: "${query}"
        Results: ${localResults.length} found
        Top Results: ${alumniContext.slice(0, 5).map(a => a.name).join(', ')}
        
        Please analyze patterns, trends, and provide search insights`;
      }

      try {
        mistralResponse = await axios.post(
          'https://api.mistral.ai/v1/chat/completions',
          {
            model: 'mistral-medium',
            messages: [
              {
                role: 'system',
                content: 'You are an alumni search analysis assistant.'
              },
              {
                role: 'user',
                content: mistralPrompt
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
      } catch (apiError) {
        console.warn('Mistral API error:', apiError.message);
      }
    }

    const alumniWithImages = localResults.filter(alum => alum.image);
    let departmentImageAnalysis = null; 

    res.render('pages/alumni/search-results', { 
      title: 'Search Results',
      query: searchByImage === 'true' ? 'Image Search' : query,
      localResults: localResults.slice(0, 50),
      apiResults: mistralResponse?.data,
      imageAnalysis,
      imageSearchAnalysis,
      departmentImageAnalysis: departmentImageAnalysis || null,
      alumniContext,
      hasImages: alumniWithImages.length > 0,
      totalResults: localResults.length,
      resultsWithImages: alumniWithImages.length,
      includeImageAnalysis: includeImageAnalysis === 'true',
      onlyWithImages: onlyWithImages === 'true',
      searchByImage: searchByImage === 'true',
      department: department || '',
      graduationYear: graduationYear || '',
      company: company || '',
      searchType: searchByImage === 'true' ? 'image' : 'text',
      error: null
    });

  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).render('pages/error', { 
      title: 'Error',
      error: err.message || 'Failed to search alumni' 
      
    });
  }
};

export const processAlumniImages = async (req, res) => {
  try {
    const alumni = await Alumni.find({ image: { $exists: true, $ne: '' } });
    let processed = 0;

    for (const alum of alumni) {
      try {
        const response = await axios.get(alum.image, { 
          responseType: 'arraybuffer',
          timeout: 10000
        });
        
        const imageBuffer = Buffer.from(response.data);
        alum.imageFeatures = await ImageProcessor.extractImageFeatures(imageBuffer);
        alum.imageHash = await ImageProcessor.generateImageHash(imageBuffer);
        
        await alum.save();
        processed++;
        console.log(`Processed image for: ${alum.firstName} ${alum.lastName}`);
      } catch (error) {
        console.error(`Failed to process image for ${alum.firstName} ${alum.lastName}:`, error);
      }
    }
    
    res.json({ 
      message: 'Image processing completed', 
      processed,
      total: alumni.length 
    });
  } catch (error) {
    res.status(500).json({ error: 'Image processing failed' });
  }
};

// export const searchAlumni = async (req, res) => {
//   try {
//     const { query } = req.query;

//     // 1. First perform local database search
//     const localResults = await Alumni.find({
//       $or: [
//         { firstName: { $regex: query, $options: 'i' } },
//         { lastName: { $regex: query, $options: 'i' } },
//         { email: { $regex: query, $options: 'i' } },
//         { currentPosition: { $regex: query, $options: 'i' } },
//         { company: { $regex: query, $options: 'i' } }, 
//         { department: { $regex: query, $options: 'i' } }, // Added department search
//         { degree: { $regex: query, $options: 'i' } } // Added degree search

//       ]
//     }).limit(50); // Limit results for AI processing

//     // 2. Prepare context for Mistral with actual database content
//     const alumniContext = localResults.map(alum => ({
//       name: `${alum.firstName} ${alum.lastName}`,
//       graduation: alum.graduationYear,
//       position: alum.currentPosition,
//       company: alum.currentCompany,
//       department: alum.department,
//       degree: alum.degree,
//       skills: alum.achievements?.join(', '),
//       image: alum.image // Assuming you have a profileImage field
//     })).slice(0, 20); // Send a subset for analysis

//     // 3. Enhanced Mistral query that analyzes the actual database results
//     const mistralResponse = await axios.post(
//       'https://api.mistral.ai/v1/chat/completions',
//       {
//         model: 'mistral-medium',
//         messages: [
//           {
//             role: 'system',
//             content: `You are an alumni search assistant. Analyze the following alumni data and provide insights, patterns, and suggestions based on the search query: "${query}".`
//           },
//           {
//             role: 'user',
//             content: `Search Query: "${query}"
//             Alumni Data (JSON): ${JSON.stringify(alumniContext)}
            
//             Please:
//             1. Identify any interesting patterns in the results
//             2. Suggest alternative search approaches if results are limited
//             3. Highlight notable alumni based on the search
//             4. Provide any career/industry trends visible in the results`
//           }
//         ],
//         temperature: 0.7,
//         max_tokens: 300
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );
    
//     let imageAnalysis = null;
//     // Check if we have alumni with images
//     const alumniWithImages = alumniContext.filter(alum => alum.image); 
//      if (alumniWithImages.length > 0) {
//       try {
//         const imageAnalysisResponse = await axios.post(
//           'https://api.mistral.ai/v1/chat/completions',
//           {
//             model: 'mistral-medium',
//             messages: [
//               {
//                 role: 'system',
//                 content: `You are an image analysis assistant. Analyze the provided image URLs and describe the types of profile pictures, their quality, and any patterns you notice.`
//               },
//               {
//                 role: 'user',
//                 content: `Analyze these alumni profile images:
//                 ${alumniWithImages.map(alum => 
//                   `Name: ${alum.name}, Image URL: ${alum.image}`
//                 ).join('\n')}
                
//                 Please provide:
//                 1. Overall quality assessment of profile images
//                 2. Common themes (professional headshots, casual photos, etc.)
//                 3. Any missing or default images
//                 4. Suggestions for improving image consistency`
//               }
//             ],
//             temperature: 0.7,
//             max_tokens: 300
//           },
//           {
//             headers: {
//               'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//               'Content-Type': 'application/json'
//             }
//           }
//         );
        
//         imageAnalysis = imageAnalysisResponse.data;
//       } catch (imageError) {
//         console.warn('Image analysis failed:', imageError.message);
//         // Continue without image analysis
//       }
//     } 

//     let departmentImageAnalysis = null;
//     if (alumniWithImages.length > 0) {
//       try {
//         // Group images by department for pattern analysis
//         const imagesByDepartment = {};
//         alumniWithImages.forEach(alum => {
//           if (alum.department) {
//             if (!imagesByDepartment[alum.department]) {
//               imagesByDepartment[alum.department] = [];
//             }
//             imagesByDepartment[alum.department].push(alum.image);
//           }
//         });

//         const departmentAnalysisResponse = await axios.post(
//           'https://api.mistral.ai/v1/chat/completions',
//           {
//             model: 'mistral-medium',
//             messages: [
//               {
//                 role: 'system',
//                 content: `Analyze profile image patterns across different departments.`
//               },
//               {
//                 role: 'user',
//                 content: `Department-wise image analysis:
//                 ${Object.entries(imagesByDepartment).map(([dept, images]) => 
//                   `Department: ${dept}, Images: ${images.length}`
//                 ).join('\n')}
                
//                 Analyze:
//                 1. Which departments have the most/least profile images
//                 2. Any department-specific patterns
//                 3. Recommendations for improving image upload rates`
//               }
//             ],
//             temperature: 0.7,
//             max_tokens: 250
//           },
//           {
//             headers: {
//               'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//               'Content-Type': 'application/json'
//             }
//           }
//         );
        
//         departmentImageAnalysis = departmentAnalysisResponse.data;
//       } catch (deptError) {
//         console.warn('Department image analysis failed:', deptError.message);
//       }
//     }
//     res.render('pages/alumni/search-results', { 
//       title: 'Search Results',
//       query,
//       localResults,
//       apiResults: mistralResponse.data,
//       departmentImageAnalysis,
//       imageAnalysis, // Pass image analysis results to view
//       alumniContext: alumniContext, // Optional: pass to view if needed
//       hasImages: alumniWithImages.length > 0,
//       totalResults: localResults.length,
//       resultsWithImages: alumniWithImages.length
//     });
//   } catch (err) {
//     console.error('Search Error:', err);
//     res.status(500).render('pages/error', { 
//       title: 'Error',
//       error: err.response?.data?.message || 'Failed to search alumni' 
//     });
//   }
// };


// export const searchAlumni = async (req, res) => {
//   try {
//     const { 
//       query, 
//       includeImageAnalysis, 
//       onlyWithImages, 
//       department, 
//       graduationYear, 
//       company 
//     } = req.query;

//     // Build search query
//     let searchQuery = {
//       $or: [
//         { firstName: { $regex: query, $options: 'i' } },
//         { lastName: { $regex: query, $options: 'i' } },
//         { email: { $regex: query, $options: 'i' } },
//         { currentPosition: { $regex: query, $options: 'i' } },
//         { company: { $regex: query, $options: 'i' } },
//         { department: { $regex: query, $options: 'i' } },
//         { degree: { $regex: query, $options: 'i' } }
//       ]
//     };

//     // Add optional filters
//     if (department && department !== 'All Departments') {
//       searchQuery.department = department;
//     }
    
//     if (graduationYear && graduationYear !== 'All Years') {
//       searchQuery.graduationYear = {
//         $gte: new Date(graduationYear, 0, 1),
//         $lt: new Date(parseInt(graduationYear) + 1, 0, 1)
//       };
//     }
    
//     if (company) {
//       searchQuery.company = { $regex: company, $options: 'i' };
//     }
    
//     if (onlyWithImages === 'true') {
//       searchQuery.image = { $exists: true, $ne: '' };
//     }

//     // 1. Perform local database search
//     const localResults = await Alumni.find(searchQuery).limit(50);

//     // 2. Prepare context for Mistral with actual database content
//     const alumniContext = localResults.map(alum => ({
//       name: `${alum.firstName} ${alum.lastName}`,
//       graduation: alum.graduationYear,
//       position: alum.currentPosition,
//       company: alum.company,
//       department: alum.department,
//       degree: alum.degree,
//       skills: alum.achievements?.join(', '),
//       image: alum.image
//     })).slice(0, 20);

//     let mistralResponse = null;
//     let imageAnalysis = null;
//     let departmentImageAnalysis = null;

//     // 3. Only call Mistral API if there are results
//     if (localResults.length > 0) {
//       // Enhanced Mistral query that analyzes the actual database results
//       mistralResponse = await axios.post(
//         'https://api.mistral.ai/v1/chat/completions',
//         {
//           model: 'mistral-medium',
//           messages: [
//             {
//               role: 'system',
//               content: `You are an alumni search assistant. Analyze the following alumni data and provide insights, patterns, and suggestions based on the search query: "${query}".`
//             },
//             {
//               role: 'user',
//               content: `Search Query: "${query}"
//               Alumni Data (JSON): ${JSON.stringify(alumniContext)}
              
//               Please:
//               1. Identify any interesting patterns in the results
//               2. Suggest alternative search approaches if results are limited
//               3. Highlight notable alumni based on the search
//               4. Provide any career/industry trends visible in the results
//               5. Analyze profile images availability and patterns
//               6. Identify department or degree-specific trends`
//             }
//           ],
//           temperature: 0.7,
//           max_tokens: 400
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       // 4. Image search analysis (only if requested)
//       if (includeImageAnalysis === 'true') {
//         const alumniWithImages = alumniContext.filter(alum => alum.image);
        
//         if (alumniWithImages.length > 0) {
//           try {
//             const imageAnalysisResponse = await axios.post(
//               'https://api.mistral.ai/v1/chat/completions',
//               {
//                 model: 'mistral-medium',
//                 messages: [
//                   {
//                     role: 'system',
//                     content: `You are an image analysis assistant. Analyze the provided image URLs and describe the types of profile pictures, their quality, and any patterns you notice.`
//                   },
//                   {
//                     role: 'user',
//                     content: `Analyze these alumni profile images:
//                     ${alumniWithImages.map(alum => 
//                       `Name: ${alum.name}, Image URL: ${alum.image}`
//                     ).join('\n')}
                    
//                     Please provide:
//                     1. Overall quality assessment of profile images
//                     2. Common themes (professional headshots, casual photos, etc.)
//                     3. Any patterns in image usage
//                     4. Suggestions for improving image consistency
//                     5. Note if images are missing for certain departments or roles`
//                   }
//                 ],
//                 temperature: 0.7,
//                 max_tokens: 300
//               },
//               {
//                 headers: {
//                   'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//                   'Content-Type': 'application/json'
//                 }
//               }
//             );
            
//             imageAnalysis = imageAnalysisResponse.data;
//           } catch (imageError) {
//             console.warn('Image analysis failed:', imageError.message);
//           }
//         }

//         // Department-based image analysis
//         if (alumniWithImages.length > 0) {
//           try {
//             // Group images by department for pattern analysis
//             const imagesByDepartment = {};
//             alumniWithImages.forEach(alum => {
//               if (alum.department) {
//                 if (!imagesByDepartment[alum.department]) {
//                   imagesByDepartment[alum.department] = [];
//                 }
//                 imagesByDepartment[alum.department].push(alum.image);
//               }
//             });

//             const departmentAnalysisResponse = await axios.post(
//               'https://api.mistral.ai/v1/chat/completions',
//               {
//                 model: 'mistral-medium',
//                 messages: [
//                   {
//                     role: 'system',
//                     content: `Analyze profile image patterns across different departments.`
//                   },
//                   {
//                     role: 'user',
//                     content: `Department-wise image analysis:
//                     ${Object.entries(imagesByDepartment).map(([dept, images]) => 
//                       `Department: ${dept}, Images: ${images.length}`
//                     ).join('\n')}
                    
//                     Analyze:
//                     1. Which departments have the most/least profile images
//                     2. Any department-specific patterns
//                     3. Recommendations for improving image upload rates`
//                   }
//                 ],
//                 temperature: 0.7,
//                 max_tokens: 250
//               },
//               {
//                 headers: {
//                   'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
//                   'Content-Type': 'application/json'
//                 }
//               }
//             );
            
//             departmentImageAnalysis = departmentAnalysisResponse.data;
//           } catch (deptError) {
//             console.warn('Department image analysis failed:', deptError.message);
//           }
//         }
//       }
//     }

//     const alumniWithImages = alumniContext.filter(alum => alum.image);

//     res.render('pages/alumni/search-results', { 
//       title: 'Search Results',
//       query,
//       localResults,
//       apiResults: mistralResponse,
//       imageAnalysis,
//       departmentImageAnalysis,
//       alumniContext,
//       hasImages: alumniWithImages.length > 0,
//       totalResults: localResults.length,
//       resultsWithImages: alumniWithImages.length,
//       includeImageAnalysis: includeImageAnalysis === 'true',
//       onlyWithImages: onlyWithImages === 'true',
//       department: department || '',
//       graduationYear: graduationYear || '',
//       company: company || ''
//     });
//   } catch (err) {
//     console.error('Search Error:', err);
//     res.status(500).render('pages/error', { 
//       title: 'Error',
//       error: err.response?.data?.message || 'Failed to search alumni' 
//     });
//   }
// };
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

// export const postAlumniRegister = async (req, res) => {
//    // Validate request data
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//      // Render the form with errors and return to prevent further execution
//     return res.status(400).render('pages/alumni/register', {
//       title: 'Alumni Registration',
//       error: errors.array().map(e => e.msg).join(', ')
//     });
//   }

//  try {
//     const {
//       firstName,
//       lastName,
//       matNo,
//       department,
//       graduationYear,
//       degree,
//       email,
//       password,
//       location,
//       currentPosition,
//       company,
//       linkedInProfile,
//       facebookProfile,
//       xProfile,
//       achievements
//     } = req.body;

//     // Check if alumni already exists
//     let alumni = await Alumni.findOne({ email });
//     if (alumni) {
//       return res.status(400).json({ msg: 'Alumni already exists' });
//     }

//      // Check if matric number already exists
//     alumni = await Alumni.findOne({ matNo });
//     if (alumni) {
//       return res.status(400).json({ msg: 'Matriculation number already in use' });
//     }


//      if (!password) {
//       return res.status(400).render('pages/alumni/register', {
//         title: 'Alumni Registration',
//         error: 'Password is required.'
//       });
//     } 
    
//     //   let image = req.body.image;
//     // if (req.file) {
//     //   const result = await cloudinary.uploader.upload(req.file.path);
//     //   image = result.secure_url;
//     // } 

//     let image = '';
//     if (req.file) {
//       image = '/uploads/' + req.file.filename; // Save the relative path
//     }

 
// // Create new alumni instance
//     alumni = new Alumni({
//       firstName,
//       lastName,
//       matNo,
//       department,
//       graduationYear: new Date(graduationYear),
//       degree,
//       email,
//       password,
//       location,
//       currentPosition,
//       company,
//       socialMedia: {
//         linkedIn: linkedInProfile,
//         facebook: facebookProfile,
//         x: xProfile
//       },
//       achievements,
//       image
//     }); 

//     console.log('Image to save:', image);

  
//     // Hash password
//     // const salt = await bcrypt.genSalt(10);
//     // alumni.password = await bcrypt.hash(password, salt);

//     // Save to database
//     await alumni.save();
//     // Respond with success
//     // res.status(201).json({ msg: 'Alumni registered successfully', alumni });    
//     return res.redirect('/alumni/login');
//   } catch (err) {
//     console.error(err);
//     res.status(400).render('pages/alumni/register', { 
//       title: 'Alumni Registration',
//       error: 'All required fields must be filled.' 
//     });
//   }
// };
export const postAlumniRegister = async (req, res) => {
   console.log('Registration request received:', req.body);
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('pages/alumni/register', {
      title: 'Alumni Registration',
      error: errors.array().map(e => e.msg).join(', '),
      formData: req.body // Preserve form data
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

    // Check if alumni already exists by email
    let existingAlumni = await Alumni.findOne({ email });
    if (existingAlumni) {
      return res.status(400).render('pages/alumni/register', {
        title: 'Alumni Registration',
        error: 'Email already registered',
        formData: req.body
      });
    }

    // Check if matric number already exists
    existingAlumni = await Alumni.findOne({ matNo });
    if (existingAlumni) {
      return res.status(400).render('pages/alumni/register', {
        title: 'Alumni Registration',
        error: 'Matriculation number already in use',
        formData: req.body
      });
    }

    if (!password) {
      return res.status(400).render('pages/alumni/register', {
        title: 'Alumni Registration',
        error: 'Password is required.',
        formData: req.body
      });
    }

    // Handle image upload
    let image = '';
    if (req.file) {
      image = '/uploads/' + req.file.filename;
    }

    // Hash password
    // const saltRounds = 12;
    // const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new alumni instance
    const alumni = new Alumni({
      firstName,
      lastName,
      matNo,
      department,
      graduationYear: new Date(graduationYear),
      degree,
      email,
      password: password,
      location,
      currentPosition,
      company,
      socialMedia: {
        linkedIn: linkedInProfile,
        facebook: facebookProfile,
        x: xProfile
      },
      achievements: achievements ? achievements.split(',').map(a => a.trim()) : [],
      image,
      imageFeatures: [],
      imageHash: ''
    });

    console.log('Image to save:', image);

    // Save to database first (without image features)
    await alumni.save();
    console.log('Original password:', password);
   

    // Process image asynchronously after successful registration
    if (image) {
      processAlumniImage(alumni._id, image).catch(error => {
        console.error(`Failed to process image for ${alumni.email}:`, error.message);
        // Don't throw - registration should not fail due to image processing
      });
    }
    console.log('Registration successful. Redirecting to login page.');
    // Redirect to login immediately (don't wait for image processing)
    return res.redirect('/alumni/login?registered=true');

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).render('pages/alumni/register', { 
      title: 'Alumni Registration',
      error: 'Registration failed. Please try again.',
      formData: req.body
    });
  }
};

// Async function to process alumni image
// Async function to process alumni image (local files only)
async function processAlumniImage(alumniId, imageUrl) {
  try {
    const alumni = await Alumni.findById(alumniId);
    if (!alumni || !imageUrl || !imageUrl.startsWith('/uploads/')) return;

    console.log(`Processing image for: ${alumni.email}`);
    
    const imagePath = path.join(process.cwd(), 'public', imageUrl);
    
    if (!fs.existsSync(imagePath)) {
      console.warn(`Image file not found: ${imagePath}`);
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    alumni.imageFeatures = await ImageProcessor.extractImageFeatures(imageBuffer);
    alumni.imageHash = await ImageProcessor.generateImageHash(imageBuffer);
    await alumni.save();
    
    console.log(`✓ Image processed for: ${alumni.email}`);
    
  } catch (error) {
    console.error(`✗ Failed to process image for alumni ${alumniId}:`, error.message);
  }
}    
      // Helper function for external image processing
async function processExternalImage(alumni, imageUrl) {
  try {
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 15000
    });
    
    const imageBuffer = Buffer.from(response.data);
    alumni.imageFeatures = await ImageProcessor.extractImageFeatures(imageBuffer);
    alumni.imageHash = await ImageProcessor.generateImageHash(imageBuffer);
    await alumni.save();
    console.log(`✓ External image processed for: ${alumni.email}`);
  } catch (error) {
    console.error(`✗ Failed to process external image for ${alumni.email}:`, error.message);
  }
}


// Background processing function for existing images
export const processExistingAlumniImages = async (req, res) => {
  try {
    const alumniToProcess = await Alumni.find({
      image: { $exists: true, $ne: '' },
      $or: [
        { imageFeatures: { $exists: false } },
        { imageFeatures: { $eq: [] } },
        { imageHash: { $exists: false } },
        { imageHash: { $eq: '' } }
      ]
    }).limit(50);

    let processed = 0;
    let failed = 0;

    for (const alum of alumniToProcess) {
      try {
        await processAlumniImage(alum._id, alum.image);
        processed++;
      } catch (error) {
        console.error(`Failed to process image for ${alum.email}:`, error);
        failed++;
      }
    }

    res.json({
      success: true,
      message: `Processed ${processed} images, ${failed} failed`,
      processed,
      failed,
      total: alumniToProcess.length
    });

  } catch (error) {
    console.error('Background processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Background processing failed',
      error: error.message
    });
  }
};


