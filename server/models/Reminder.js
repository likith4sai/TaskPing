const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  scheduledDateTime: {
    type: Date,
    required: true
  },
  googleEventId: {
    type: String,
    required: true
  },
  originalMessage: {
    type: String,
    required: true
  },

  // Enhanced features
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'finance', 'shopping', 'other'],
    default: 'personal'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // ENHANCED RECURRING SYSTEM
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
      default: undefined
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }], // 0=Sunday, 1=Monday, etc.
    monthDay: {
      type: Number,
      min: 1,
      max: 31
    },
    endDate: {
      type: Date
    },
    maxOccurrences: {
      type: Number,
      min: 1
    },
    currentOccurrence: {
      type: Number,
      default: 1
    },
    parentRecurringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder'
    },
    nextScheduledDate: {
      type: Date
    }
  },

  // SMART PRIORITY SYSTEM
  smartPriority: {
    score: {
      type: Number,
      default: 50 // 0-100 scale
    },
    factors: {
      urgency: { type: Number, default: 50 },
      importance: { type: Number, default: 50 },
      deadline: { type: Number, default: 50 },
      userBehavior: { type: Number, default: 50 },
      timeOfDay: { type: Number, default: 50 }
    },
    lastCalculated: {
      type: Date,
      default: Date.now
    }
  },

  // User interaction tracking
  interactions: {
    views: { type: Number, default: 0 },
    snoozes: { type: Number, default: 0 },
    edits: { type: Number, default: 0 },
    completionTime: { type: Number }, // minutes taken to complete
    lastViewed: { type: Date }
  },

  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Enhanced pre-save hook
reminderSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (this.completed && !this.completedAt) {
    this.completedAt = new Date();
  }

  // Clean up recurring fields if not recurring
  if (!this.recurring.isRecurring) {
    this.recurring.pattern = undefined;
    this.recurring.interval = undefined;
    this.recurring.daysOfWeek = [];
    this.recurring.endDate = undefined;
    this.recurring.maxOccurrences = undefined;
  }

  next();
});

// Calculate smart priority score
reminderSchema.methods.calculateSmartPriority = function() {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledDateTime);
  const hoursUntilDue = (scheduledTime - now) / (1000 * 60 * 60);

  // Factor calculations (0-100 scale)
  let urgency = 50;
  if (hoursUntilDue < 1) urgency = 100;
  else if (hoursUntilDue < 4) urgency = 85;
  else if (hoursUntilDue < 24) urgency = 70;
  else if (hoursUntilDue < 72) urgency = 50;
  else urgency = 30;

  // Base importance from priority
  let importance = 50;
  switch (this.priority) {
    case 'urgent': importance = 100; break;
    case 'high': importance = 80; break;
    case 'medium': importance = 50; break;
    case 'low': importance = 30; break;
  }

  // User behavior factor
  let userBehavior = 50;
  if (this.interactions.snoozes > 3) userBehavior = 20;
  if (this.interactions.views > 5) userBehavior = 80;
  if (this.interactions.edits > 2) userBehavior = 70;

  // Time of day factor (work hours boost for work category)
  let timeOfDay = 50;
  const hour = scheduledTime.getHours();
  if (this.category === 'work' && hour >= 9 && hour <= 17) {
    timeOfDay = 80;
  }

  // Weighted score
  const weights = { urgency: 0.4, importance: 0.3, userBehavior: 0.2, timeOfDay: 0.1 };
  const score = Math.round(
    urgency * weights.urgency +
    importance * weights.importance +
    userBehavior * weights.userBehavior +
    timeOfDay * weights.timeOfDay
  );

  this.smartPriority.score = Math.max(0, Math.min(100, score));
  this.smartPriority.factors = { urgency, importance, userBehavior, timeOfDay };
  this.smartPriority.lastCalculated = new Date();

  return this.smartPriority.score;
};

// Generate next recurring instance
reminderSchema.methods.generateNextRecurrence = function() {
  if (!this.recurring.isRecurring) return null;

  const moment = require('moment-timezone');
  const current = moment(this.scheduledDateTime);
  let next;

  switch (this.recurring.pattern) {
    case 'daily':
      next = current.clone().add(this.recurring.interval, 'days');
      break;
    case 'weekly':
      next = current.clone().add(this.recurring.interval, 'weeks');
      break;
    case 'monthly':
      next = current.clone().add(this.recurring.interval, 'months');
      break;
    case 'yearly':
      next = current.clone().add(this.recurring.interval, 'years');
      break;
    case 'custom':
      if (this.recurring.daysOfWeek.length > 0) {
        next = current.clone();
        let foundNext = false;
        for (let i = 1; i <= 7; i++) {
          const testDate = current.clone().add(i, 'days');
          if (this.recurring.daysOfWeek.includes(testDate.day())) {
            next = testDate;
            foundNext = true;
            break;
          }
        }
        if (!foundNext) {
          next = current.clone().add(1, 'week');
          next.day(this.recurring.daysOfWeek[0]);
        }
      }
      break;
  }

  // End conditions
  if (this.recurring.endDate && next.isAfter(moment(this.recurring.endDate))) {
    return null;
  }
  if (this.recurring.maxOccurrences &&
      this.recurring.currentOccurrence >= this.recurring.maxOccurrences) {
    return null;
  }

  return next.toDate();
};

// Indexes
reminderSchema.index({ userId: 1, createdAt: -1 });
reminderSchema.index({ userId: 1, scheduledDateTime: 1 });
reminderSchema.index({ userId: 1, 'smartPriority.score': -1 });
reminderSchema.index({ 'recurring.isRecurring': 1, 'recurring.nextScheduledDate': 1 });
reminderSchema.index({ scheduledDateTime: 1, emailSent: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
