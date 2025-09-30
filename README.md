# 🎯 TaskPing

<div align="center">
  
![TaskPing Logo](https://img.shields.io/badge/TaskPing-AI%20Task%20Manager-blue?style=for-the-badge&logo=calendar&logoColor=white)

**An AI-powered smart reminder and task management application that revolutionizes how you organize your life.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Now-brightgreen?style=for-the-badge)](https://taskping-l4icbk2us-likithsais-projects.vercel.app)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/likith4sai/TaskPing?style=for-the-badge)](https://github.com/likith4sai/TaskPing/stargazers)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🚀 Live Demo](#-live-demo)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚡ Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎮 Usage](#-usage)
- [📸 Screenshots](#-screenshots)
- [🏗️ Project Structure](#️-project-structure)
- [🔧 API Endpoints](#-api-endpoints)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact](#-contact)

---

## ✨ Features

### 🧠 AI-Powered Intelligence
- **Natural Language Processing**: Create reminders using conversational language
- **Smart Priority Scoring**: AI automatically prioritizes your tasks
- **Intelligent Categorization**: Auto-categorizes tasks (work, personal, health, etc.)
- **Context-Aware Suggestions**: Gets smarter with your usage patterns

### 🎤 Voice & Communication
- **Voice Recognition**: Add reminders hands-free using speech-to-text
- **Interactive Chat Interface**: Converse with your AI assistant
- **Multi-language Support**: Understands natural language in multiple contexts
- **Voice Feedback**: Audio confirmation for successful actions

### 📅 Advanced Scheduling
- **Google Calendar Integration**: Seamless sync with your Google Calendar
- **Recurring Reminders**: Set up daily, weekly, monthly, or custom recurring tasks
- **Smart Date Recognition**: Understands phrases like "tomorrow at 6 PM" or "next Monday"
- **Time Zone Awareness**: Handles different time zones automatically

### 🔔 Notifications & Alerts
- **Real-time Desktop Notifications**: Never miss important tasks
- **Priority-based Alerts**: High-priority tasks get immediate attention
- **Customizable Notification Settings**: Control when and how you're notified
- **Cross-platform Notifications**: Works on desktop and mobile browsers

### 🎨 User Experience
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Dark/Light Mode**: Easy on the eyes with theme switching
- **Keyboard Shortcuts**: Power-user features for efficiency
- **Smooth Animations**: Polished interface with delightful interactions

### 🔒 Security & Data
- **JWT Authentication**: Secure user sessions
- **Data Encryption**: Your information is protected
- **Export/Import**: Backup and restore your data as JSON
- **Multi-user Support**: Each user has their own secure workspace

---

## 🚀 Live Demo

Experience TaskPing in action:

**🌐 [https://taskping-l4icbk2us-likithsais-projects.vercel.app](https://taskping-l4icbk2us-likithsais-projects.vercel.app)**

### Demo Credentials:
```
Email: demo@taskping.com
Password: Demo123!
```
*Note: Demo data is reset every 24 hours*

---

## 🛠️ Tech Stack

<div align="center">

| Frontend | Backend | Database | APIs |
|----------|---------|----------|------|
| ![React](https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react) | ![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js) | ![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=flat-square&logo=mongodb) | ![Google](https://img.shields.io/badge/Google%20Calendar-API-red?style=flat-square&logo=google) |
| ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript) | ![Express](https://img.shields.io/badge/Express.js-4.18+-black?style=flat-square&logo=express) | ![Mongoose](https://img.shields.io/badge/Mongoose-ODM-red?style=flat-square) | ![OpenAI](https://img.shields.io/badge/OpenAI-API-black?style=flat-square&logo=openai) |
| ![CSS3](https://img.shields.io/badge/CSS3-Styled-blue?style=flat-square&logo=css3) | ![JWT](https://img.shields.io/badge/JWT-Auth-purple?style=flat-square) | | |

</div>

### 📚 Key Libraries
- **Lucide React**: Beautiful, customizable icons
- **React Speech Recognition**: Voice input functionality  
- **Axios**: HTTP client for API requests
- **bcryptjs**: Password hashing and security
- **chrono-node**: Natural language date parsing
- **cors**: Cross-origin resource sharing

---

## ⚡ Quick Start

Get TaskPing running in 3 minutes:

```bash
# Clone the repository
git clone https://github.com/likith4sai/TaskPing.git
cd TaskPing

# Install dependencies
npm run install:all

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your configuration

# Start development servers
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see TaskPing in action! 🎉

---

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Local installation](https://www.mongodb.com/try/download/community) or [Atlas account](https://cloud.mongodb.com/)
- **Google API Credentials** - [Get them here](https://console.developers.google.com/)

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/likith4sai/TaskPing.git
   cd TaskPing
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Return to Root Directory**
   ```bash
   cd ..
   ```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/taskping
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskping

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Google Calendar Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Features (Optional)
OPENAI_API_KEY=your-openai-api-key

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create credentials (OAuth 2.0 client ID)
5. Add your domain to authorized origins
6. Copy Client ID and Secret to your `.env` file

---

## 🎮 Usage

### Running the Application

**Development Mode:**
```bash
# Start backend server (runs on port 5000)
cd server
npm run dev

# In a new terminal, start frontend (runs on port 3000)
cd client  
npm start
```

**Production Mode:**
```bash
# Build the frontend
cd client
npm run build

# Start the production server
cd ../server
npm start
```

### Core Features Guide

#### 📝 Creating Reminders
- **Text Input**: Type natural language like "Call mom tomorrow at 6 PM"
- **Voice Input**: Click the microphone icon and speak your reminder
- **Smart Recognition**: AI understands context, dates, times, and priorities

#### 🎯 Managing Tasks
- **Priority Inbox**: View tasks sorted by AI-calculated importance
- **Categories**: Tasks are automatically categorized (work, personal, health, etc.)
- **Completion**: Click the checkmark to mark tasks as complete
- **Deletion**: Use the trash icon to remove unwanted tasks

#### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus on input field
- `Ctrl/Cmd + Enter`: Send message/reminder
- `Escape`: Clear current input
- `Ctrl/Cmd + /`: Show shortcuts help

#### 📊 Data Management
- **Export**: Download your data as JSON for backup
- **Import**: Upload previously exported data
- **Settings**: Customize notifications and preferences

---

## 📸 Screenshots

<div align="center">

### 🏠 Main Interface
![Main Interface](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=TaskPing+Main+Interface)

### 🎤 Voice Recognition
![Voice Feature](https://via.placeholder.com/800x400/2563eb/ffffff?text=Voice+Recognition+Active)

### 📱 Mobile Responsive
![Mobile View](https://via.placeholder.com/400x600/10b981/ffffff?text=Mobile+Responsive+Design)

### 🌙 Dark Mode
![Dark Mode](https://via.placeholder.com/800x400/111827/ffffff?text=Beautiful+Dark+Mode)

</div>

---

## 🏗️ Project Structure

```
TaskPing/
├── 📁 client/                 # React frontend
│   ├── 📁 public/            # Static assets
│   ├── 📁 src/               # Source code
│   │   ├── 📁 components/    # React components
│   │   │   ├── Auth.js       # Authentication components
│   │   │   ├── QuickActions.js
│   │   │   └── SettingsModal.js
│   │   ├── 📁 contexts/      # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── App.js            # Main app component
│   │   ├── App.css           # Styles
│   │   └── index.js          # Entry point
│   ├── package.json          # Dependencies & scripts
│   └── README.md             # Client documentation
├── 📁 server/                 # Node.js backend
│   ├── 📁 models/            # Database models
│   │   ├── User.js           # User model
│   │   └── Reminder.js       # Reminder model
│   ├── 📁 routes/            # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── reminders.js      # Reminder routes
│   │   └── googleAuth.js     # Google Calendar routes
│   ├── 📁 middleware/        # Custom middleware
│   │   └── auth.js           # JWT verification
│   ├── 📁 services/          # Business logic
│   │   ├── recurringService.js
│   │   └── priorityService.js
│   ├── 📁 utils/             # Utility functions
│   │   └── localParser.js    # Date parsing
│   ├── server.js             # Express server
│   └── package.json          # Dependencies & scripts
├── .gitignore                 # Git ignore rules
├── .gitattributes            # Git line ending settings
├── LICENSE                   # MIT license
└── README.md                 # This file
```

---

## 🔧 API Endpoints

### 🔐 Authentication
```http
POST /api/auth/register    # Register new user
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user
GET  /api/auth/test        # Test auth routes
```

### 📝 Reminders
```http
GET    /api/reminders/list          # Get all reminders
GET    /api/reminders/inbox         # Get smart priority inbox
POST   /api/reminders/process       # Process natural language reminder
GET    /api/reminders/stats         # Get reminder statistics
PATCH  /api/reminders/complete/:id  # Mark reminder as complete
DELETE /api/reminders/delete/:id    # Delete reminder
GET    /api/reminders/export        # Export user data
POST   /api/reminders/import        # Import user data
```

### 📅 Google Calendar
```http
GET  /auth/google                   # Initiate Google OAuth
GET  /auth/google/callback          # Handle OAuth callback
POST /auth/google/event             # Create calendar event
```

### 🏥 System Health
```http
GET  /api/health                    # Health check endpoint
GET  /api                           # API information
```

---

## 🤝 Contributing

We love contributions! Here's how you can help make TaskPing even better:

### 🐛 Bug Reports
Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### ✨ Feature Requests
Have an idea? We'd love to hear it! Open an issue with:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach

### 🔧 Pull Requests

1. **Fork the Repository**
   ```bash
   git fork https://github.com/likith4sai/TaskPing.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Commit Your Changes**
   ```bash
   git commit -m "Add: Amazing new feature"
   ```

5. **Push to Your Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Include screenshots for UI changes

### 📋 Development Guidelines

- **Code Style**: Follow existing patterns and ESLint rules
- **Commits**: Use conventional commit messages (feat:, fix:, docs:, etc.)
- **Testing**: Add tests for new features when possible
- **Documentation**: Update README and comments for significant changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Likith Sai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contact

<div align="center">

### 👨‍💻 **Likith Sai**

[![GitHub](https://img.shields.io/badge/GitHub-likith4sai-black?style=for-the-badge&logo=github)](https://github.com/likith4sai)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/likithsai)
[![Email](https://img.shields.io/badge/Email-Contact-red?style=for-the-badge&logo=gmail)](mailto:likithsai@example.com)

**Project Repository**: [https://github.com/likith4sai/TaskPing](https://github.com/likith4sai/TaskPing)

</div>

---

## 🙏 Acknowledgments

- **React Team** for the amazing frontend framework
- **MongoDB** for the flexible database solution
- **Google** for Calendar API integration
- **OpenAI** for AI capabilities
- **Lucide** for beautiful icons
- **All Contributors** who help make TaskPing better

---

<div align="center">

### ⭐ Star this repo if TaskPing helps you stay organized!

**Made with ❤️ by [Likith Sai](https://github.com/likith4sai)**

![TaskPing](https://img.shields.io/badge/TaskPing-2025-blue?style=for-the-badge)

</div>
