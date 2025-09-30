import React from 'react';
import { Plus, Zap, Calendar, Bell } from 'lucide-react';

const QuickActions = ({ onQuickAction }) => {
  const quickActions = [
    {
      id: 'daily-standup',
      icon: <Calendar size={16} />,
      label: 'Daily Standup',
      message: 'daily standup meeting at 9am #work'
    },
    {
      id: 'take-medicine',
      icon: <Bell size={16} />,
      label: 'Medicine',
      message: 'take medicine every day at 8am #health'
    },
    {
      id: 'workout',
      icon: <Zap size={16} />,
      label: 'Workout',
      message: 'workout session every Tuesday and Thursday at 6pm #health'
    },
    {
      id: 'weekly-review',
      icon: <Plus size={16} />,
      label: 'Weekly Review',
      message: 'weekly review meeting every Friday at 5pm #work'
    }
  ];

  return (
    <div className="quick-actions">
      <div className="quick-actions-header">
        <Zap size={16} />
        <span>Quick Add</span>
      </div>
      <div className="quick-actions-grid">
        {quickActions.map(action => (
          <button
            key={action.id}
            onClick={() => onQuickAction(action.message)}
            className="quick-action-btn"
            title={`Add: ${action.message}`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
