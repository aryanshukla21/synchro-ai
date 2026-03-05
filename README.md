# 🚀 Synchro-AI

<div align="center">

**Collaborative Smart Workspace with AI-Powered Insights**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/cloud/atlas)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey)](https://expressjs.com/)

[Features](#-key-features) • [Demo](#-demo) • [Installation](#%EF%B8%8F-installation) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

Synchro-AI is a full-stack collaborative platform designed to revolutionize project management through real-time communication and intelligent task analysis. Built with the MERN stack (MongoDB, Express, React, Node.js) and powered by Google's Gemini AI API, it provides teams with automated code review, intelligent task analysis, and high-level project summaries.

Whether you're managing a small team or coordinating complex multi-stakeholder projects, Synchro-AI streamlines workflows, enhances productivity, and provides AI-driven insights to keep your projects on track.

---

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- **Automated Code & Task Review**: Integrated Gemini API analyzes submitted work and provides:
  - Quality scores (0-100 scale)
  - Detailed feedback on code quality, best practices, and potential improvements
  - Suggestions for optimization and bug fixes
- **Project Pulse Summaries**: AI-generated high-level project overviews that synthesize team activity, progress, and potential bottlenecks

### ⚡ Real-Time Collaboration
- **Instant Notifications**: Live updates using Socket.io for task assignments, status changes, and team activity
- **Live Presence Indicators**: See who's online and actively working
- **Real-time Chat**: Integrated messaging for seamless team communication

### 📊 Interactive Kanban Board
- **Visual Workflow Management**: Drag-and-drop interface with customizable stages
  - 📝 **To-Do**: Newly created tasks awaiting action
  - 🔄 **In-Progress**: Tasks currently being worked on
  - 🔍 **Review-Requested**: Work submitted for AI and peer review
  - ✅ **Merged**: Completed and approved tasks
- **Custom Labels & Tags**: Organize tasks with color-coded labels
- **Priority Levels**: Mark tasks as Low, Medium, High, or Critical

### 🎯 Robust Project Management
- **Workspace Management**: Create unlimited project workspaces with granular role-based access control
  - 👑 **Owner**: Full administrative control
  - 🤝 **Co-Owner**: Management permissions with restricted admin access
  - ✏️ **Contributor**: Can create and complete tasks
  - 👁️ **Viewer**: Read-only access to project data
- **Task Assignment**: Assign tasks to specific team members with deadlines and priorities
- **Activity Logs**: Comprehensive audit trail tracking all project actions, changes, and contributions
- **File Attachments**: Upload and manage task-related files via Cloudinary integration

### 📈 Intelligent Analytics
- **Dashboard Widgets**: Visual insights into project health
  - Task completion rates and velocity metrics
  - Team workload distribution and capacity planning
  - AI-generated "Project Pulse" summaries highlighting trends and risks
- **Custom Reports**: Export project data for stakeholder presentations
- **Performance Metrics**: Track individual and team productivity over time

### 🔒 Secure Authentication
- **Multi-Step Registration**: Email verification with OTP (One-Time Password)
- **JWT-Based Sessions**: Secure, stateless authentication with token refresh
- **Password Security**: Bcrypt hashing with salt rounds for maximum security
- **Session Management**: Automatic logout and token expiration handling

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, Lucide React, Zustand |
| **Backend** | Node.js, Express 5, Socket.io |
| **Database** | MongoDB with Mongoose ODM |
| **AI Integration** | Google Generative AI (Gemini API) |
| **Storage & Media** | Cloudinary (File uploads and management) |
| **Email** | Nodemailer (SMTP-based email delivery) |
| **Security** | JWT (JSON Web Tokens), Bcrypt |
| **Real-time** | Socket.io (WebSocket communication) |

---

## 📁 Repository Structure

```plaintext
synchro-ai/
├── client/                     # React frontend application (Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Kanban/         # Kanban board components
│   │   │   ├── Dashboard/      # Analytics and metrics
│   │   │   ├── TaskCard/       # Task display components
│   │   │   └── Modals/         # Dialog and modal windows
│   │   ├── contexts/           # React Context providers
│   │   │   ├── AuthContext.jsx # Authentication state
│   │   │   └── ToastContext.jsx# Notification management
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useSocket.js    # Socket.io integration
│   │   │   └── useAuth.js      # Authentication utilities
│   │   ├── pages/              # Application routes/views
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ProjectView.jsx
│   │   ├── services/           # API client services
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Application entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express backend application
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   │   ├── database.js     # MongoDB connection
│   │   │   ├── socket.js       # Socket.io setup
│   │   │   └── cloudinary.js   # Cloudinary configuration
│   │   ├── controllers/        # Request handlers (business logic)
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── submissionController.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.js         # JWT verification
│   │   │   ├── validation.js   # Input validation
│   │   │   └── errorHandler.js # Global error handling
│   │   ├── models/             # Mongoose schemas and models
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   ├── Task.js
│   │   │   └── Submission.js
│   │   ├── routes/             # API endpoint definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── task.routes.js
│   │   │   └── submission.routes.js
│   │   ├── services/           # External service integrations
│   │   │   ├── aiService.js    # Gemini API integration
│   │   │   ├── emailService.js # Nodemailer utilities
│   │   │   └── uploadService.js# Cloudinary file handling
│   │   └── server.js           # Application entry point
│   ├── package.json
│   └── .env.example
│
├── .gitignore
├── package.json                # Root package.json for scripts
├── LICENSE
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **MongoDB Atlas** account - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Google Gemini API Key** - [Get API key](https://ai.google.dev/)
- **Cloudinary Account** - [Sign up](https://cloudinary.com/)
- **SMTP Email Account** (for email notifications)

### ⚙️ Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/aryanshukla21/synchro-ai.git
cd synchro-ai
```

#### 2️⃣ Install Dependencies

Install dependencies for both client and server:

```bash
npm run install-all
```

Or manually:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

#### 3️⃣ Environment Configuration

Create a `.env` file in the `server/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URL=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Client Configuration
CLIENT_URL=http://localhost:5173

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
EMAIL_FROM=noreply@synchro-ai.com
```

**Important Notes:**
- For Gmail SMTP, you need to use an [App Password](https://support.google.com/accounts/answer/185833)
- Never commit the `.env` file to version control
- Use `.env.example` as a template for team members

#### 4️⃣ MongoDB Setup

1. Create a MongoDB Atlas cluster (or use local MongoDB)
2. Create a database named `synchro-ai`
3. Whitelist your IP address in Atlas Network Access
4. Copy the connection string and add it to your `.env` file

#### 5️⃣ Cloudinary Setup

1. Log in to your Cloudinary account
2. Navigate to Dashboard to find your credentials
3. Copy Cloud Name, API Key, and API Secret to `.env`
4. (Optional) Create an upload preset for better organization

### ▶️ Running the Application

#### Development Mode (Recommended)

Start both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

This will:
- Start the Express server on `http://localhost:5000`
- Start the Vite development server on `http://localhost:5173`
- Enable hot module replacement (HMR) for both

#### Manual Start

Alternatively, run each service separately:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

#### Production Build

Build the frontend for production:

```bash
cd client
npm run build
```

Start the production server:

```bash
cd server
npm start
```

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response:** Sends OTP to email for verification

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Project Endpoints

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Awesome Project",
  "description": "A revolutionary app that changes everything",
  "members": [
    {
      "userId": "user_id_2",
      "role": "contributor"
    }
  ]
}
```

#### Get All Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

#### Get Single Project
```http
GET /api/projects/:projectId
Authorization: Bearer <token>
```

#### Update Project
```http
PUT /api/projects/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

### Task Endpoints

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project_id",
  "title": "Implement user authentication",
  "description": "Set up JWT-based auth with email verification",
  "assignedTo": "user_id",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59Z",
  "tags": ["backend", "security"]
}
```

**Note:** Only project Owners can create tasks

#### Update Task Status
```http
PATCH /api/tasks/:taskId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress"
}
```

**Valid statuses:** `todo`, `in-progress`, `review-requested`, `merged`

### Submission Endpoints

#### Submit Work for Review
```http
POST /api/submissions
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "taskId": "task_id",
  "description": "Implemented JWT authentication with refresh tokens",
  "files": [file1, file2]
}
```

#### Get AI Review
```http
GET /api/submissions/:submissionId/review
Authorization: Bearer <token>
```

**Response:**
```json
{
  "submissionId": "submission_id",
  "aiReview": {
    "score": 85,
    "feedback": "Well-structured code with good practices. Consider adding error handling for edge cases...",
    "suggestions": [
      "Add input validation for user data",
      "Implement rate limiting for auth endpoints"
    ]
  }
}
```

#### Merge Submission
```http
POST /api/submissions/:submissionId/merge
Authorization: Bearer <token>
```

**Note:** Automatically triggers AI quality review before merging

### Analytics Endpoints

#### Get Project Analytics
```http
GET /api/projects/:projectId/analytics
Authorization: Bearer <token>
```

#### Get Project Pulse (AI Summary)
```http
GET /api/projects/:projectId/pulse
Authorization: Bearer <token>
```

---

## 🎨 Frontend Architecture

### State Management

The application uses **Zustand** for global state management and React Context for authentication and notifications.

#### Zustand Store Example
```javascript
import create from 'zustand';

const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project })
}));
```

### Socket.io Integration

Real-time updates are handled through Socket.io:

```javascript
// hooks/useSocket.js
import { useEffect } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (projectId) => {
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    socket.emit('join-project', projectId);

    socket.on('task-updated', (task) => {
      // Update local state
    });

    return () => socket.disconnect();
  }, [projectId]);
};
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Run Frontend Tests
```bash
cd client
npm test
```

### Run E2E Tests
```bash
npm run test:e2e
```

---

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
- Verify your IP is whitelisted in MongoDB Atlas
- Check that `MONGODB_URL` is correctly formatted
- Ensure network access settings allow connections

#### Gemini API Errors
- Verify your API key is valid and has quota remaining
- Check that billing is enabled on your Google Cloud account
- Ensure you're using the correct model name (`gemini-pro`)

#### Socket.io Connection Issues
- Confirm both client and server are running
- Check CORS settings in `server/src/server.js`
- Verify `CLIENT_URL` in `.env` matches your frontend URL

#### File Upload Failures
- Verify Cloudinary credentials are correct
- Check file size limits (default 10MB)
- Ensure file types are allowed

#### Email Not Sending
- Confirm SMTP credentials are correct
- For Gmail, use an App Password, not your regular password
- Check spam folder for test emails

---

## 📚 Learn More

### Documentation
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Socket.io Documentation](https://socket.io/docs/v4/)

### Tutorials
- [MERN Stack Tutorial](https://www.mongodb.com/languages/mern-stack-tutorial)
- [JWT Authentication Guide](https://jwt.io/introduction)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/utility-first)

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Write clean, documented code
   - Follow existing code style and conventions
   - Add tests for new features
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Code Style Guidelines

- Use ES6+ syntax
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write self-documenting code

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example:**
```
feat(auth): add password reset functionality

Implement password reset via email with secure token generation.
Adds new endpoints and email templates.

Closes #123
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Synchro-AI Contributors

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

## 👥 Authors & Acknowledgments

### Core Team
- **Aryan Shukla** - *Creator & Lead Developer* - [@aryanshukla21](https://github.com/aryanshukla21)

### Special Thanks
- Google Gemini AI team for the powerful AI API
- The MERN stack community for excellent documentation
- All contributors who have helped improve this project

---

<div align="center">

**Built with ❤️ by the Synchro-AI Team**

[⬆ Back to Top](#-synchro-ai)

</div>