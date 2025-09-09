// middlewares/apiResponse.js
export const ensureJsonResponse = (req, res, next) => {
  // Check if this is an API request (starts with /api/ or has Accept: application/json)
  const isApiRequest = req.path.startsWith('/api/') || 
                       req.get('Accept')?.includes('application/json') ||
                       req.xhr; // AJAX request

  if (isApiRequest) {
    // Override res.json to ensure consistent format
    const originalJson = res.json;
    res.json = function(data) {
      // Ensure we always return a proper JSON structure
      if (!data || typeof data !== 'object') {
        data = { success: true, data: data };
      }
      return originalJson.call(this, data);
    };

    // Handle errors consistently
    res.apiError = function(message, status = 500, details = null) {
      return this.status(status).json({
        success: false,
        message,
        error: details,
        timestamp: new Date().toISOString()
      });
    };

    // Handle success consistently
    res.apiSuccess = function(data, message = 'Success') {
      return this.json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    };
  }
  next();
};
