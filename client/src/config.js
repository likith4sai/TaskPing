export const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-deployed-api.herokuapp.com'
    : 'http://localhost:5000',
  
  isProduction: process.env.NODE_ENV === 'production'
};
