const Reminder = require('../models/Reminder');
const moment = require('moment-timezone');

class PriorityService {
  constructor() {
    this.cronJob = null;
  }

  start() {
    console.log('🧠 Starting Smart Priority Service...');
    
    const cron = require('node-cron');
    
    // Recalculate priorities every 30 minutes
    this.cronJob = cron.schedule('*/30 * * * *', async () => {
      await this.recalculateAllPriorities();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Run immediately
    setTimeout(() => this.recalculateAllPriorities(), 2000);
  }

  async recalculateAllPriorities() {
    try {
      console.log('🧠 Recalculating smart priorities...');
      
      const activeReminders = await Reminder.find({
        completed: false,
        scheduledDateTime: { $gt: new Date() }
      });

      console.log(`📊 Updating priorities for ${activeReminders.length} reminders`);

      const bulkOps = [];
      
      for (const reminder of activeReminders) {
        const score = reminder.calculateSmartPriority();
        
        bulkOps.push({
          updateOne: {
            filter: { _id: reminder._id },
            update: {
              'smartPriority.score': reminder.smartPriority.score,
              'smartPriority.factors': reminder.smartPriority.factors,
              'smartPriority.lastCalculated': reminder.smartPriority.lastCalculated
            }
          }
        });
      }

      if (bulkOps.length > 0) {
        await Reminder.bulkWrite(bulkOps);
        console.log(`✅ Updated ${bulkOps.length} priority scores`);
      }

    } catch (error) {
      console.error('❌ Error recalculating priorities:', error);
    }
  }

  // Get smart-sorted reminders for a user
  async getSmartSortedReminders(userId, limit = 20) {
    try {
      // First, ensure recent priority calculations
      await this.recalculateUserPriorities(userId);
      
      const reminders = await Reminder.find({ 
        userId,
        completed: false,
        scheduledDateTime: { $gt: new Date() }
      })
      .sort({ 
        'smartPriority.score': -1, // Highest priority first
        scheduledDateTime: 1 // Then by time
      })
      .limit(limit)
      .lean();

      return reminders;
    } catch (error) {
      console.error('❌ Error getting smart sorted reminders:', error);
      return [];
    }
  }

  async recalculateUserPriorities(userId) {
    const userReminders = await Reminder.find({
      userId,
      completed: false,
      scheduledDateTime: { $gt: new Date() }
    });

    const bulkOps = [];
    
    for (const reminder of userReminders) {
      const score = reminder.calculateSmartPriority();
      
      bulkOps.push({
        updateOne: {
          filter: { _id: reminder._id },
          update: {
            'smartPriority.score': reminder.smartPriority.score,
            'smartPriority.factors': reminder.smartPriority.factors,
            'smartPriority.lastCalculated': reminder.smartPriority.lastCalculated
          }
        }
      });
    }

    if (bulkOps.length > 0) {
      await Reminder.bulkWrite(bulkOps);
    }
  }

  // Track user interaction to improve future priorities
  async trackInteraction(reminderId, interactionType, data = {}) {
    try {
      const update = {
        'interactions.lastViewed': new Date()
      };

      switch (interactionType) {
        case 'view':
          update.$inc = { 'interactions.views': 1 };
          break;
        case 'snooze':
          update.$inc = { 'interactions.snoozes': 1 };
          break;
        case 'edit':
          update.$inc = { 'interactions.edits': 1 };
          break;
        case 'complete':
          if (data.completionTime) {
            update['interactions.completionTime'] = data.completionTime;
          }
          break;
      }

      await Reminder.findByIdAndUpdate(reminderId, update);
    } catch (error) {
      console.error('❌ Error tracking interaction:', error);
    }
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🧠 Smart Priority Service stopped');
    }
  }
}

module.exports = new PriorityService();
