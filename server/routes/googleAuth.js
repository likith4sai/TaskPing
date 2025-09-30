const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Start Google OAuth flow
router.get('/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    prompt: 'consent' // Forces refresh token
  });
  
  console.log('📧 Google Auth URL generated');
  res.redirect(authUrl);
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('❌ No authorization code received');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('✅ Tokens received:');
    console.log('📝 Copy this refresh token to your .env file:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    
    res.send(`
      <html>
        <head><title>TaskPing - Setup Complete!</title></head>
        <body style="font-family: Arial; padding: 20px; text-align: center;">
          <h1>🎉 Authentication Successful!</h1>
          <h2>✅ Setup Complete</h2>
          <p>Your Google Calendar is now connected to TaskPing!</p>
          <p style="background: #f0f0f0; padding: 10px; border-radius: 5px;">
            <strong>Refresh Token:</strong><br>
            <code>${tokens.refresh_token}</code>
          </p>
          <p><strong>Copy the token above and add it to your .env file</strong></p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ OAuth error:', error);
    res.status(500).send('❌ Authentication failed');
  }
});

// Test calendar connection
router.get('/test', async (req, res) => {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      return res.json({ 
        status: 'error', 
        message: 'No refresh token found. Please authenticate first.' 
      });
    }

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Try to list calendars
    const response = await calendar.calendarList.list();
    
    res.json({ 
      status: 'success', 
      message: 'Google Calendar connection working!',
      calendars: response.data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary
      }))
    });
  } catch (error) {
    console.error('Calendar test error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Calendar connection failed',
      error: error.message 
    });
  }
});

module.exports = router;
