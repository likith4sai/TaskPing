const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const moment = require('moment-timezone');

class RecurringService {
  constructor() {
    this.cronJob = null;
  }

  // Start the recurring events processor
  start() {
    console.log('🔄 Starting Recurring Events Service...');
    
    // Run every hour to check for new recurring instances needed
    this.cronJob = cron.schedule('0 * * * *', async () => {
      await this.processRecurringEvents();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Also run immediately on startup
    setTimeout(() => this.processRecurringEvents(), 5000);
  }

  async processRecurringEvents() {
    try {
      console.log('🔄 Processing recurring events...');
      
      const now = moment();
      const lookAhead = moment().add(7, 'days'); // Look 7 days ahead
      
      // Find all active recurring reminders
      const recurringReminders = await Reminder.find({
        'recurring.isRecurring': true,
        completed: false,
        $or: [
          { 'recurring.endDate': null },
          { 'recurring.endDate': { $gt: now.toDate() } }
        ]
      });

      console.log(`📋 Found ${recurringReminders.length} recurring reminders`);

      for (const reminder of recurringReminders) {
        await this.createMissingInstances(reminder, now, lookAhead);
      }

    } catch (error) {
      console.error('❌ Error processing recurring events:', error);
    }
  }

  async createMissingInstances(parentReminder, now, lookAhead) {
    try {
      const nextDate = parentReminder.generateNextRecurrence();
      if (!nextDate) return; // No more recurrences

      const nextMoment = moment(nextDate);
      
      // Only create if it's within our look-ahead window
      if (nextMoment.isBefore(lookAhead)) {
        
        // Check if this instance already exists
        const existingInstance = await Reminder.findOne({
          'recurring.parentRecurringId': parentReminder._id,
          scheduledDateTime: {
            $gte: nextMoment.startOf('day').toDate(),
            $lt: nextMoment.endOf('day').toDate()
          }
        });

        if (!existingInstance) {
          // Create new recurring instance
          const newInstance = new Reminder({
            userId: parentReminder.userId,
            task: parentReminder.task,
            description: parentReminder.description,
            scheduledDateTime: nextDate,
            googleEventId: `recurring_${Date.now()}`,
            originalMessage: parentReminder.originalMessage,
            category: parentReminder.category,
            tags: parentReminder.tags,
            priority: parentReminder.priority,
            recurring: {
              isRecurring: false, // This is an instance, not the parent
              parentRecurringId: parentReminder._id
            }
          });

          // Calculate smart priority for new instance
          newInstance.calculateSmartPriority();

          await newInstance.save();
          console.log(`✅ Created recurring instance: ${newInstance.task} for ${nextMoment.format('YYYY-MM-DD HH:mm')}`);

          // Update parent's current occurrence count
          await Reminder.findByIdAndUpdate(parentReminder._id, {
            $inc: { 'recurring.currentOccurrence': 1 },
            'recurring.nextScheduledDate': nextDate
          });
        }
      }
    } catch (error) {
      console.error('❌ Error creating recurring instance:', error);
    }
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🔄 Recurring Events Service stopped');
    }
  }
}

module.exports = new RecurringService();
