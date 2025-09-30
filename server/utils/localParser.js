const chrono = require('chrono-node');

class LocalTaskParser {
  constructor() {
    // Recurring reminder detection
    this.recurringPatterns = [
      { regex: /every\s+day|daily/i, pattern: 'daily', interval: 1 },
      { regex: /every\s+(\d+)\s+days?/i, pattern: 'daily', interval: 'match' },
      { regex: /every\s+week|weekly/i, pattern: 'weekly', interval: 1 },
      { regex: /every\s+(\d+)\s+weeks?/i, pattern: 'weekly', interval: 'match' },
      { regex: /every\s+month|monthly/i, pattern: 'monthly', interval: 1 },
      { regex: /every\s+(\d+)\s+months?/i, pattern: 'monthly', interval: 'match' },
      { regex: /every\s+year|yearly|annually/i, pattern: 'yearly', interval: 1 },
      { regex: /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, pattern: 'custom', daysOfWeek: 'match' },
      { regex: /every\s+(weekday|workday)/i, pattern: 'custom', daysOfWeek: [1, 2, 3, 4, 5] }, // Mon-Fri
      { regex: /every\s+(weekend)/i, pattern: 'custom', daysOfWeek: [0, 6] } // Sat-Sun
    ];

    // Priority detection
    this.priorityPatterns = [
      { regex: /urgent|asap|immediately|critical/i, priority: 'urgent' },
      { regex: /important|high\s+priority|crucial/i, priority: 'high' },
      { regex: /low\s+priority|when\s+possible|sometime/i, priority: 'low' },
      { regex: /normal|medium|regular/i, priority: 'medium' }
    ];

    // Category detection
    this.categoryPatterns = [
      { regex: /work|meeting|office|project|boss|client|deadline/i, category: 'work' },
      { regex: /doctor|appointment|medicine|health|exercise|gym/i, category: 'health' },
      { regex: /buy|shopping|groceries|store|purchase/i, category: 'shopping' },
      { regex: /bank|payment|bill|finance|money|budget/i, category: 'finance' },
      { regex: /family|personal|home|friend/i, category: 'personal' }
    ];

    // Task patterns
    this.taskPatterns = [
      { regex: /remind me (?:in )?(\d+)\s*(min|mins?|minutes?|hrs?|hours?)\s+to (.+)/i, taskGroup: 3, timeAmount: 1, timeUnit: 2 },
      { regex: /remind me to (.+?) (at |on |by )?(.+)/i, taskGroup: 1, timeGroup: 3 },
      { regex: /remind me (.+?) (at |on |in |for |by )?(.+)/i, taskGroup: 1, timeGroup: 3 },
      { regex: /(.+?) (tomorrow|today|tonight|morning|afternoon|evening|next week|next month)/i, taskGroup: 1, timeGroup: 2 },
      { regex: /(.+?) at (\d{1,2}(?::\d{2})?\s*(?:am|pm))/i, taskGroup: 1, timeGroup: 2 },
      { regex: /(.+?) (?:on |at )?(\w+day)\s*(?:at )?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i, taskGroup: 1, timeGroup: 2 },
      { regex: /(.+?) in (\d+) (minutes?|hours?|days?)/i, taskGroup: 1, timeGroup: 2 },
      { regex: /(.+)/i, taskGroup: 1, timeGroup: null }
    ];

    // Time parsing
    this.timePatterns = [
      { regex: /(\d+)\s*(min|mins?|minutes?)/i, calculate: (m) => new Date(Date.now() + parseInt(m[1]) * 60 * 1000) },
      { regex: /(\d+)\s*(hrs?|hours?)/i, calculate: (m) => new Date(Date.now() + parseInt(m[1]) * 60 * 60 * 1000) },
      { regex: /(\d+)\s*(days?)/i, calculate: (m) => { const d = new Date(); d.setDate(d.getDate() + parseInt(m[1])); d.setHours(9, 0, 0, 0); return d; } },
      { regex: /tomorrow/i, calculate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
      { regex: /today/i, calculate: () => { const d = new Date(); d.setHours(d.getHours() + 1); return d; } },
      { regex: /tonight/i, calculate: () => { const d = new Date(); d.setHours(20, 0, 0, 0); return d; } },
      { regex: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, calculate: (m) => {
        const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        const targetDay = days.indexOf(m[1].toLowerCase());
        const today = new Date(); const currentDay = today.getDay();
        let daysToAdd = (targetDay - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        const d = new Date(today); d.setDate(today.getDate() + daysToAdd); d.setHours(9,0,0,0);
        return d;
      }}
    ];
  }

  parseTask(message) {
    try {
      console.log(`🔍 Parsing locally: "${message}"`);
      let task = '';
      let datetime = null;
      let confidence = 0;

      // Defaults
      let recurring = { isRecurring: false };
      let priority = 'medium';
      let category = 'personal';
      let tags = [];

      // Detect recurring
      for (const pattern of this.recurringPatterns) {
        const match = message.match(pattern.regex);
        if (match) {
          recurring.isRecurring = true;
          recurring.pattern = pattern.pattern;
          recurring.interval = pattern.interval === 'match' ? parseInt(match[1]) || 1 : pattern.interval;
          if (pattern.daysOfWeek === 'match') {
            const dayMap = { monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0 };
            recurring.daysOfWeek = [dayMap[match[1].toLowerCase()]];
          } else if (Array.isArray(pattern.daysOfWeek)) {
            recurring.daysOfWeek = pattern.daysOfWeek;
          }
          console.log('✅ Recurring detected:', recurring);
          break;
        }
      }

      // Detect priority
      for (const pattern of this.priorityPatterns) {
        if (pattern.regex.test(message)) {
          priority = pattern.priority;
          break;
        }
      }

      // Detect category
      for (const pattern of this.categoryPatterns) {
        if (pattern.regex.test(message)) {
          category = pattern.category;
          break;
        }
      }

      // Tags (#work, #shopping)
      const tagMatches = message.match(/#\w+/g);
      if (tagMatches) tags = tagMatches.map(t => t.slice(1).toLowerCase());

      // Quick reminder like "remind me in 5 mins to call mom"
      const reminderTimePattern = /remind me (?:in )?(\d+)\s*(min|mins?|minutes?|hrs?|hours?)\s+to (.+)/i;
      const reminderMatch = message.match(reminderTimePattern);
      if (reminderMatch) {
        const [, amount, unit, taskText] = reminderMatch;
        const isMinutes = unit.toLowerCase().includes('min');
        const multiplier = isMinutes ? 60*1000 : 60*60*1000;
        datetime = new Date(Date.now() + parseInt(amount) * multiplier);
        task = taskText.trim();
        confidence = 95;

        return {
          task, datetime: datetime.toISOString(), success: true, confidence,
          recurring, priority, category, tags,
          response: recurring.isRecurring 
            ? `✅ I'll remind you to "${task}" ${this.getRecurringDescription(recurring)} starting ${this.formatDateForUser(datetime)}.`
            : `✅ I'll remind you to "${task}" on ${this.formatDateForUser(datetime)}.`
        };
      }

      // Chrono-node parsing
      const chronoResults = chrono.parse(message, new Date());
      if (chronoResults.length > 0) {
        datetime = chronoResults[0].start.date();
        confidence = 90;
        task = message.replace(chronoResults[0].text, '').trim()
          .replace(/^(remind me to |remind me |to )/i, '')
          .replace(/every\s+\w+/gi, '')
          .replace(/#\w+/g, '').trim();

        if (!task || task.length < 2) task = 'Reminder';

        return {
          task, datetime: datetime.toISOString(), success: true, confidence,
          recurring, priority, category, tags,
          response: recurring.isRecurring 
            ? `✅ I'll remind you about "${task}" ${this.getRecurringDescription(recurring)} starting ${this.formatDateForUser(datetime)}.`
            : `✅ I'll remind you about "${task}" on ${this.formatDateForUser(datetime)}.`
        };
      }

      // Fallback regex parsing
      for (const pattern of this.taskPatterns) {
        const match = message.match(pattern.regex);
        if (match) {
          task = match[pattern.taskGroup]?.trim();
          if (pattern.timeAmount && pattern.timeUnit) {
            const amount = parseInt(match[pattern.timeAmount]);
            const unit = match[pattern.timeUnit];
            const isMinutes = unit.toLowerCase().includes('min');
            const multiplier = isMinutes ? 60*1000 : 60*60*1000;
            datetime = new Date(Date.now() + amount * multiplier);
            confidence = 90;
            break;
          }
          const timeText = match[pattern.timeGroup]?.trim();
          if (timeText) {
            datetime = this.parseTime(timeText);
            if (datetime) { confidence = 80; break; }
          }
          if (task && !datetime) {
            return {
              task, success: false, confidence: 0,
              recurring, priority, category, tags,
              response: `🕒 Got it! When should I remind you about "${task}"?`
            };
          }
        }
      }

      if (task && datetime) {
        task = task.replace(/^(remind me to |remind me |to )/i, '')
          .replace(/every\s+\w+/gi, '').replace(/#\w+/g, '').trim();
        return {
          task, datetime: datetime.toISOString(), success: true, confidence,
          recurring, priority, category, tags,
          response: recurring.isRecurring 
            ? `✅ Got it! I'll remind you about "${task}" ${this.getRecurringDescription(recurring)} starting ${this.formatDateForUser(datetime)}.`
            : `✅ Got it! I'll remind you about "${task}" on ${this.formatDateForUser(datetime)}.`
        };
      }

      return {
        task: '', success: false, confidence: 0,
        recurring, priority, category, tags,
        response: "🤔 Didn't catch that. Try: 'remind me to call mom every Tuesday at 2pm #family urgent'."
      };

    } catch (error) {
      console.error('Local parsing error:', error);
      return {
        task: '', success: false, confidence: 0,
        recurring: { isRecurring: false }, priority: 'medium', category: 'personal', tags: [],
        response: "⚠️ Sorry, I couldn't parse that. Try rephrasing."
      };
    }
  }

  getRecurringDescription(recurring) {
    if (!recurring.isRecurring) return '';
    switch (recurring.pattern) {
      case 'daily': return recurring.interval === 1 ? 'every day' : `every ${recurring.interval} days`;
      case 'weekly': return recurring.interval === 1 ? 'every week' : `every ${recurring.interval} weeks`;
      case 'monthly': return recurring.interval === 1 ? 'every month' : `every ${recurring.interval} months`;
      case 'yearly': return recurring.interval === 1 ? 'every year' : `every ${recurring.interval} years`;
      case 'custom': if (recurring.daysOfWeek) {
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        return `every ${recurring.daysOfWeek.map(d => dayNames[d]).join(', ')}`;
      }
    }
    return '';
  }

  parseTime(text) {
    for (const pattern of this.timePatterns) {
      const match = text.match(pattern.regex);
      if (match) try { return pattern.calculate(match); } catch { continue; }
    }
    const chronoResults = chrono.parse(text, new Date());
    if (chronoResults.length > 0) return chronoResults[0].start.date();
    return null;
  }

  formatDateForUser(date) {
    return date.toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  }
}

module.exports = new LocalTaskParser();
