import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Send, Calendar, Clock, CheckCircle, Bot, User, Trash2, Check, 
  BarChart3, LogOut, Settings, Sun, Moon, Mic, MicOff, Download, Upload
} from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Auth from './components/Auth';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './contexts/ThemeContext';
import './App.css';

function App() {
  // 🌗 Theme
  const { isDark, toggleTheme } = useTheme();

  // 🔐 Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ⚙️ UI states
  const [showSettings, setShowSettings] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  // ✅ Main app states
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState({
    totalReminders: 0,
    todayReminders: 0,
    upcomingReminders: 0,
    completedReminders: 0
  });
  
  const messagesEndRef = useRef(null);

  // 🎤 Voice Recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // 📜 Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔔 Show notification helper
  const showNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  // 🕐 Format time helper
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // 👤 Authentication handlers
  const handleAuthSuccess = (token, user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('taskping_token', token);
    localStorage.setItem('taskping_user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMessages([]);
    setReminders([]);
    setStats({
      totalReminders: 0,
      todayReminders: 0,
      upcomingReminders: 0,
      completedReminders: 0
    });
    localStorage.removeItem('taskping_token');
    localStorage.removeItem('taskping_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  // 📋 Data loading functions
  const loadReminders = async () => {
    try {
      let response;
      try {
        response = await axios.get('/api/reminders/inbox?limit=20');
        console.log('📊 Loaded smart reminders');
      } catch (error) {
        response = await axios.get('/api/reminders/list');
        console.log('📋 Loaded regular reminders');
      }
      
      setReminders(response.data.reminders || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/reminders/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // 💬 Message handling
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const timestamp = new Date();
    
    setMessages(prev => [...prev, { type: 'user', text: userMessage, timestamp }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/reminders/process', {
        message: userMessage
      });

      const botResponse = {
        type: 'bot',
        text: response.data.response,
        timestamp: new Date(),
        calendarEvent: response.data.calendarEvent,
        success: response.data.success
      };

      setMessages(prev => [...prev, botResponse]);
      if (response.data.success) {
        loadReminders();
        loadStats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = '😅 Sorry, I had trouble processing that. Please try again!';
      if (error.response?.status === 401) {
        errorMessage = '🔐 Your session has expired. Please log in again.';
        handleLogout();
        return;
      }
      setMessages(prev => [...prev, { type: 'bot', text: errorMessage, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reminder actions
  const completeReminder = async (reminderId) => {
    try {
      await axios.patch(`/api/reminders/complete/${reminderId}`);
      
      try {
        await axios.post(`/api/reminders/track/${reminderId}/complete`);
      } catch (trackError) {
        // Ignore if tracking not available
      }
      
      loadReminders();
      loadStats();

      // 🔔 Notify user
      showNotification('✅ Task Completed!', 'Great job completing your reminder!');
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: '✅ Great job! Reminder marked as completed.',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error completing reminder:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const deleteReminder = async (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await axios.delete(`/api/reminders/delete/${reminderId}`);
        loadReminders();
        loadStats();
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: '🗑️ Reminder deleted successfully.',
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error deleting reminder:', error);
        if (error.response?.status === 401) {
          handleLogout();
        }
      }
    }
  };

  // 🎤 Voice recognition handlers
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  // 📥📤 Export/Import data functions
  const exportData = async () => {
    try {
      const response = await axios.get('/api/reminders/export');
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `taskping-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: '📥 Your data has been exported successfully!',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Export error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: '❌ Export failed. Feature may not be available yet.',
        timestamp: new Date()
      }]);
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          JSON.parse(e.target.result);
          setMessages(prev => [...prev, { 
            type: 'bot', 
            text: '📤 Data import ready! (Feature coming soon)',
            timestamp: new Date()
          }]);
        } catch (error) {
          console.error('Import error:', error);
          setMessages(prev => [...prev, { 
            type: 'bot', 
            text: '❌ Import failed. Please check your file format.',
            timestamp: new Date()
          }]);
        }
      };
      reader.readAsText(file);
    }
  };

  // 🚀 App initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate app startup
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Check for saved auth
        const savedToken = localStorage.getItem('taskping_token');
        const savedUser = localStorage.getItem('taskping_user');
        
        if (savedToken && savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setCurrentUser(userData);
            setIsAuthenticated(true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            
            // Load user data
            await Promise.all([loadReminders(), loadStats()]);
          } catch (error) {
            console.error('Error restoring auth:', error);
            handleLogout();
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setAppLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // 🔔 Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 👋 Welcome message when logged in
  useEffect(() => {
    if (isAuthenticated && !appLoading && currentUser) {
      setMessages([
        { 
          type: 'bot', 
          text: `👋 Welcome back, ${currentUser.name}! I'm ready to help you manage your reminders. What would you like to remember today?`,
          timestamp: new Date()
        }
      ]);
      loadReminders();
      loadStats();
    }
  }, [isAuthenticated, appLoading, currentUser]);

  // 📜 Auto-scroll messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🎤 Handle voice transcript
  useEffect(() => {
    if (transcript && !listening) {
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, listening, resetTranscript]);

  // ⌨️ Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.message-input')?.focus();
      }
      
      // Ctrl/Cmd + Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input.trim()) {
        e.preventDefault();
        sendMessage({ preventDefault: () => {} });
      }
      
      // Escape to clear input
      if (e.key === 'Escape') {
        setInput('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [input, sendMessage]);

  // 🔄 App loading screen
  if (appLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <h2>Loading TaskPing</h2>
        <p>Preparing your AI assistant...</p>
      </div>
    );
  }

  // 🔑 Show login if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // ✅ Main TaskPing UI
  return (
    <div className="app">
      <div className="main-container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <div className="header-left">
              <h1>
                <Calendar className="header-icon" />
                TaskPing
              </h1>
              <p>Welcome back, {currentUser?.name}! 👋</p>
            </div>
            <div className="header-right">
              <div className="user-info">
                <span className="user-name">{currentUser?.name}</span>
                <span className="user-email">{currentUser?.email}</span>
              </div>
              <div className="header-actions">
                <button 
                  onClick={toggleTheme}
                  className="action-btn"
                  title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <button 
                  onClick={() => setShowSettings(true)}
                  className="action-btn"
                  title="Settings"
                >
                  <Settings size={20} />
                </button>
                
                <button 
                  onClick={exportData} 
                  className="action-btn" 
                  title="Export Data"
                >
                  <Download size={20} />
                </button>
                
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileImport} 
                  style={{ display: 'none' }} 
                  id="import-input"
                />
                
                <button 
                  onClick={() => document.getElementById('import-input').click()} 
                  className="action-btn" 
                  title="Import Data"
                >
                  <Upload size={20} />
                </button>
                
                <button 
                  onClick={handleLogout} 
                  className="logout-button" 
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="content-wrapper">
          {/* Chat Section */}
          <div className="chat-container">
            <div className="chat-header">
              <Bot className="chat-icon" />
              <span>Chat with TaskPing</span>
            </div>

            <div className="messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <div className="message-avatar">
                    {message.type === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    {message.calendarEvent && (
                      <div className="calendar-preview">
                        <Calendar size={16} />
                        <div className="event-details">
                          <strong>{message.calendarEvent.summary}</strong>
                          <div className="event-time">
                            <Clock size={14} />
                            {message.calendarEvent.formattedDate}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message bot">
                  <div className="message-avatar"><Bot size={20} /></div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="input-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., 'Call mom tomorrow at 6pm' or click mic to speak"
                disabled={loading}
                className="message-input"
              />
              {browserSupportsSpeechRecognition && (
                <button 
                  type="button"
                  onClick={toggleListening}
                  className={`voice-button ${listening ? 'listening' : ''}`}
                  title={listening ? 'Stop listening' : 'Start voice input'}
                >
                  {listening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              <button type="submit" disabled={loading || !input.trim()} className="send-button">
                <Send size={20} />
              </button>
            </form>
            <div className="shortcut-hint">
              Ctrl+K to focus • Ctrl+Enter to send • Esc to clear
            </div>
          </div>

          {/* Reminders Sidebar */}
          <div className="reminders-sidebar">
            <div className="sidebar-header">
              <CheckCircle className="sidebar-icon" />
              <span>Your Reminders</span>
            </div>

            {/* Quick Stats */}
            <div className="stats-panel">
              <div className="stats-header">
                <BarChart3 size={16} />
                <span>Quick Stats</span>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <Calendar size={20} />
                  <div className="stat-info">
                    <div className="stat-number">{stats.totalReminders}</div>
                    <div className="stat-label">Total</div>
                  </div>
                </div>
                <div className="stat-card">
                  <Clock size={20} />
                  <div className="stat-info">
                    <div className="stat-number">{stats.todayReminders}</div>
                    <div className="stat-label">Today</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reminder List */}
            <div className="reminders-list">
              {reminders.length === 0 ? (
                <div className="no-reminders">
                  <Calendar size={40} className="empty-icon" />
                  <p>No reminders yet</p>
                  <small>Start by telling me what you need to remember!</small>
                </div>
              ) : (
                reminders.map((reminder) => (
                  <div 
                    key={reminder.id} 
                    className={`reminder-item ${reminder.completed ? 'completed' : ''} ${
                      reminder.priority ? `priority-${reminder.priority}` : ''
                    }`}
                  >
                    <div className="reminder-content">
                      <div className="reminder-header">
                        <div className="reminder-task">{reminder.task}</div>
                        <div className="reminder-badges">
                          {reminder.recurring && reminder.recurring.isRecurring && (
                            <span className="badge recurring-badge" title="Recurring">🔄</span>
                          )}
                          {reminder.priority && reminder.priority !== 'medium' && (
                            <span className={`badge priority-badge priority-${reminder.priority}`} title={`${reminder.priority} priority`}>
                              {reminder.priority === 'urgent' ? '🔴' : 
                               reminder.priority === 'high' ? '🟠' : '🟢'}
                            </span>
                          )}
                          {reminder.category && reminder.category !== 'personal' && (
                            <span className={`badge category-badge category-${reminder.category}`} title={reminder.category}>
                              {reminder.category === 'work' ? '💼' : 
                               reminder.category === 'health' ? '🏥' : 
                               reminder.category === 'finance' ? '💰' : 
                               reminder.category === 'shopping' ? '🛒' : '📝'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="reminder-time">
                        <Clock size={12} />
                        {reminder.formattedDate}
                      </div>
                      
                      {reminder.smartPriority && reminder.smartPriority.score > 50 && (
                        <div className="smart-priority">
                          <div className="priority-bar">
                            <div 
                              className="priority-fill"
                              style={{ width: `${reminder.smartPriority.score}%` }}
                              title={`Smart Priority: ${reminder.smartPriority.score}/100`}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {reminder.tags && reminder.tags.length > 0 && (
                        <div className="reminder-tags">
                          {reminder.tags.map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="reminder-actions">
                      {!reminder.completed && (
                        <button
                          onClick={() => completeReminder(reminder.id)}
                          className="action-button complete-btn"
                          title="Mark as completed"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="action-button delete-btn"
                        title="Delete reminder"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
