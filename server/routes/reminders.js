const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { google } = require('googleapis');
const Reminder = require('../models/Reminder');
const localParser = require('../utils/localParser');
const { auth } = require('../middleware/auth');
const priorityService = require('../services/priorityService'); // ✅ New service

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Google Calendar
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Apply auth middleware to all reminder routes
router.use(auth);

/* 
====================================================
UPDATED /process ROUTE (recurring + smart priority)
====================================================
*/
router.post('/process', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        response: "Please tell me what you'd like to remember! 💭"
      });
    }

    console.log(`🔍 Processing message for user ${req.user.name}: "${message}"`);

    let aiResponse;

    // Try OpenAI first, fallback to local parser
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
      try {
        console.log('🤖 Trying OpenAI...');
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful reminder assistant that can handle recurring events and smart prioritization. Extract task details from natural language.
              
Current date/time: ${new Date().toISOString()}

Parse the user's message and return ONLY a JSON object with:
- task: string
- datetime: ISO string
- success: boolean
- response: string
- confidence: number
- recurring: object with { isRecurring: boolean, pattern: string, interval: number }
- priority: string (low, medium, high, urgent)
- category: string (work, personal, health, finance, shopping, other)
- tags: array of strings`
            },
            { role: "user", content: message }
          ],
          temperature: 0.1,
          max_tokens: 300
        });

        aiResponse = JSON.parse(completion.choices[0].message.content);
        console.log('✅ OpenAI response:', aiResponse);

      } catch (openaiError) {
        console.log('⚠️ OpenAI failed, using enhanced local parser:', openaiError.message);
        aiResponse = localParser.parseTask(message);
      }
    } else {
      console.log('📍 Using enhanced local parser (no OpenAI key)');
      aiResponse = localParser.parseTask(message);
    }

    console.log('🎯 Final parsed result:', aiResponse);

    if (aiResponse.success && aiResponse.datetime) {
      try {
        const eventDateTime = new Date(aiResponse.datetime);
        const endDateTime = new Date(eventDateTime.getTime() + 30 * 60000);

        // Google Calendar event
        const event = {
          summary: `📋 ${aiResponse.task}`,
          description: `Reminder created via TaskPing\nOriginal message: "${message}"\nPriority: ${aiResponse.priority || 'medium'}\nCategory: ${aiResponse.category || 'personal'}`,
          start: {
            dateTime: eventDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 10 },
              { method: 'popup', minutes: 0 },
            ],
          },
        };

        let calendarResponse;
        try {
          calendarResponse = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
          });
          console.log('✅ Calendar event created:', calendarResponse.data.id);
        } catch (calendarError) {
          console.log('⚠️ Calendar creation failed, continuing without it:', calendarError.message);
        }

        // Enhanced reminder data
        const reminderData = {
          userId,
          task: aiResponse.task,
          scheduledDateTime: eventDateTime,
          googleEventId: calendarResponse?.data?.id || `local_${Date.now()}`,
          originalMessage: message,
          category: aiResponse.category || 'personal',
          tags: aiResponse.tags || [],
          priority: aiResponse.priority || 'medium',
          recurring: aiResponse.recurring || { isRecurring: false }
        };

        const reminder = new Reminder(reminderData);

        // Calculate smart priority
        reminder.calculateSmartPriority();

        await reminder.save();
        console.log('💾 Saved enhanced reminder to database');

        // Handle recurring
        if (reminder.recurring.isRecurring) {
          const nextDate = reminder.generateNextRecurrence();
          if (nextDate) {
            await Reminder.findByIdAndUpdate(reminder._id, {
              'recurring.nextScheduledDate': nextDate
            });
          }
        }

        const responseMessage = calendarResponse ?
          `${aiResponse.response} 📱 You'll get a notification on your phone!` :
          `${aiResponse.response} ⚠️ Calendar integration isn't set up yet, but I've saved your reminder!`;

        res.json({
          response: responseMessage,
          calendarEvent: {
            summary: aiResponse.task,
            start: eventDateTime.toISOString(),
            googleEventId: calendarResponse?.data?.id || 'local',
            formattedDate: localParser.formatDateForUser ?
              localParser.formatDateForUser(eventDateTime) :
              eventDateTime.toLocaleString(),
            priority: aiResponse.priority,
            category: aiResponse.category,
            recurring: aiResponse.recurring
          },
          success: true
        });

      } catch (error) {
        console.error('💥 Processing error:', error);
        res.json({
          response: `${aiResponse.response} ⚠️ I understood your request but couldn't save it right now. Please try again!`,
          success: false,
          error: 'processing_error'
        });
      }
    } else {
      res.json({
        response: aiResponse.response || "I need more details about when you'd like to be reminded. Could you specify a time? 🕒",
        success: false
      });
    }

  } catch (error) {
    console.error('💥 Main processing error:', error);
    res.status(500).json({
      response: "Sorry, I'm having technical difficulties. Please try again! 🔧"
    });
  }
});

/* 
=======================================
EXISTING ROUTES (list, complete, delete, stats)
=======================================
*/
router.get('/list', async (req, res) => {
  try {
    const userId = req.user._id;
    const reminders = await Reminder.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const formatDateForUser = (date) => date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    res.json({
      reminders: reminders.map(r => ({
        id: r._id,
        task: r.task,
        scheduledDateTime: r.scheduledDateTime,
        formattedDate: formatDateForUser(r.scheduledDateTime),
        completed: r.completed,
        originalMessage: r.originalMessage,
        category: r.category,
        priority: r.priority
      }))
    });
  } catch (error) {
    console.error('❌ List reminders error:', error);
    res.status(500).json({ message: 'Error fetching reminders' });
  }
});

router.patch('/complete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      { completed: true },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder marked as completed!', reminder });
  } catch (error) {
    console.error('Complete reminder error:', error);
    res.status(500).json({ message: 'Error completing reminder' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reminder = await Reminder.findOne({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.googleEventId && !reminder.googleEventId.startsWith('local_')) {
      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: reminder.googleEventId,
        });
        console.log('✅ Deleted from Google Calendar');
      } catch (calError) {
        console.log('⚠️ Could not delete from Google Calendar:', calError.message);
      }
    }

    await Reminder.findOneAndDelete({ _id: id, userId });
    res.json({ message: 'Reminder deleted successfully!' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Error deleting reminder' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const totalReminders = await Reminder.countDocuments({ userId });
    const todayReminders = await Reminder.countDocuments({
      userId,
      scheduledDateTime: { $gte: todayStart, $lt: todayEnd }
    });
    const upcomingReminders = await Reminder.countDocuments({
      userId,
      scheduledDateTime: { $gt: now },
      completed: false
    });
    const completedReminders = await Reminder.countDocuments({
      userId,
      completed: true
    });

    res.json({
      totalReminders,
      todayReminders,
      upcomingReminders,
      completedReminders
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

/* 
========================================
NEW ROUTES (smart inbox + tracking)
========================================
*/
router.get('/inbox', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, category, priority } = req.query;

    await priorityService.trackInteraction(null, 'view');

    let query = {
      userId,
      completed: false,
      scheduledDateTime: { $gt: new Date() }
    };

    if (category && category !== 'all') query.category = category;
    if (priority && priority !== 'all') query.priority = priority;

    const reminders = await Reminder.find(query)
      .sort({ 'smartPriority.score': -1, scheduledDateTime: 1 })
      .limit(parseInt(limit));

    const formatDateForUser = (date) => date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    res.json({
      reminders: reminders.map(r => ({
        id: r._id,
        task: r.task,
        scheduledDateTime: r.scheduledDateTime,
        formattedDate: formatDateForUser(r.scheduledDateTime),
        completed: r.completed,
        originalMessage: r.originalMessage,
        category: r.category,
        priority: r.priority,
        tags: r.tags,
        smartPriority: r.smartPriority,
        recurring: r.recurring,
        isRecurring: r.recurring.isRecurring,
        interactions: r.interactions
      })),
      totalCount: reminders.length
    });

  } catch (error) {
    console.error('❌ Inbox error:', error);
    res.status(500).json({ message: 'Error fetching smart inbox' });
  }
});

router.post('/track/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const { data } = req.body;

    await priorityService.trackInteraction(id, action, data);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Tracking error:', error);
    res.status(500).json({ message: 'Error tracking interaction' });
  }
});

module.exports = router;
