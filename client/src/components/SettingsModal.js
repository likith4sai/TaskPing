import React from 'react';
import { X, Moon, Sun, Settings as SettingsIcon, Zap, Bell, Smartphone, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme, settings, toggleTheme, updateSettings, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  if (!isOpen) return null;

  const handleSettingChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <SettingsIcon size={24} />
            <h2>Settings</h2>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Theme Section */}
          <div className="settings-section">
            <h3>Appearance</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
                <span>Theme</span>
              </div>
              <button 
                onClick={toggleTheme}
                className={`theme-toggle ${isDark ? 'dark' : 'light'}`}
              >
                <div className="theme-toggle-slider">
                  {isDark ? <Moon size={14} /> : <Sun size={14} />}
                </div>
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <Smartphone size={16} />
                <span>Compact Mode</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Behavior Section */}
          <div className="settings-section">
            <h3>Behavior</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <Zap size={16} />
                <span>Smooth Animations</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.animations}
                  onChange={(e) => handleSettingChange('animations', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <Bell size={16} />
                <span>Push Notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <RotateCcw size={16} />
                <span>Auto Refresh</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* User Info Section */}
          <div className="settings-section">
            <h3>Account</h3>
            <div className="user-profile">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
                <div className="user-since">
                  Member since {new Date(user?.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
