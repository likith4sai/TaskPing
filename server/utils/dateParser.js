const chrono = require('chrono-node');

const parseNaturalDate = (text, referenceDate = new Date()) => {
  try {
    // Use chrono-node for natural language parsing
    const results = chrono.parse(text, referenceDate);
    
    if (results.length > 0) {
      return results[0].start.date();
    }
    
    // Fallback patterns for common phrases
    const patterns = [
      { 
        regex: /tomorrow/i, 
        getDate: () => {
          const tomorrow = new Date(referenceDate);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
          return tomorrow;
        }
      },
      { 
        regex: /next week/i, 
        getDate: () => {
          const nextWeek = new Date(referenceDate);
          nextWeek.setDate(nextWeek.getDate() + 7);
          nextWeek.setHours(9, 0, 0, 0);
          return nextWeek;
        }
      },
      { 
        regex: /in (\d+) hours?/i, 
        getDate: (match) => {
          const hours = parseInt(match[1]);
          return new Date(referenceDate.getTime() + hours * 60 * 60 * 1000);
        }
      }
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        return pattern.getDate(match);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
};

const formatDateForUser = (date) => {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

module.exports = {
  parseNaturalDate,
  formatDateForUser
};
