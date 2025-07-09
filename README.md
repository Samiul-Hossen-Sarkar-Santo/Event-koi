# Event Koi?! 🎉

A comprehensive event management platform built with modern web technologies. Event Koi?! streamlines event discovery, creation, and management for educational institutions and organizations.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## 🌟 Features

### For Participants
- 🔍 **Event Discovery** - Browse events by category with advanced filtering
- 📝 **Easy Registration** - Platform-based or external registration options
- 👤 **Profile Management** - Comprehensive user profiles with avatar uploads
- 📊 **Personal Dashboard** - Track registered events and personal activity

### For Organizers
- ✨ **Event Creation** - Rich event creation with image uploads and detailed information
- 📈 **Analytics Dashboard** - Real-time analytics with interactive charts
- 🎯 **Event Management** - Edit, update, and manage event details
- 📋 **Registration Tracking** - Monitor event registrations and performance

### For Administrators
- 🛡️ **User Management** - Account approval, role assignment, and moderation
- ✅ **Event Approval** - Review and approve events with feedback mechanisms
- 📊 **System Monitoring** - Activity logs with advanced filtering
- 🔧 **Platform Oversight** - Comprehensive system administration

## 🚀 Quick Start

### Prerequisites
- Node.js (v14.0.0 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/event-koi.git
cd event-koi
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/eventkoi
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventkoi

SESSION_SECRET=your-super-secret-session-key
PORT=3000
```

4. **Start the application**
```bash
npm start
```

5. **Access the application**
Open your browser and navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
Event-koi/
│
├── 📁 css/                     # Stylesheets
│   ├── style.css              # Main homepage styles
│   ├── login_signup.css       # Authentication pages
│   ├── user.css               # User dashboard
│   ├── organizer.css          # Organizer dashboard
│   ├── admin.css              # Admin dashboard
│   └── ...
│
├── 📁 js/                      # Client-side JavaScript
│   ├── script.js              # Homepage functionality
│   ├── login_signup.js        # Authentication logic
│   ├── user.js                # User dashboard
│   ├── organizer.js           # Organizer analytics
│   ├── admin.js               # Admin functionality
│   └── ...
│
├── 📁 models/                  # MongoDB Models
│   ├── User.js                # User schema
│   ├── Event.js               # Event schema
│   ├── Category.js            # Category schema
│   ├── Registration.js        # Registration schema
│   └── ...
│
├── 📁 routes/                  # Express Routes
│   ├── auth.js                # Authentication
│   ├── users.js               # User management
│   ├── events.js              # Event CRUD
│   ├── admin.js               # Admin functionality
│   └── categories.js          # Category management
│
├── 📁 uploads/                 # File uploads
├── 📄 server.js               # Main server file
├── 📄 package.json            # Dependencies
└── 📄 *.html                  # Frontend pages
```

## 🔧 Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **bcrypt** - Password hashing
- **express-session** - Session management
- **multer** - File upload handling

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid/Flexbox
- **JavaScript (ES6+)** - Client-side scripting
- **Chart.js** - Data visualization

## 📱 User Roles & Access

### 🙋‍♀️ Participant/User
- Browse and search events
- Register for events
- Manage personal profile
- View registration history

### 🎯 Organizer
- All participant features
- Create and manage events
- View analytics dashboard
- Track event performance

### 🛡️ Administrator
- All organizer features
- Approve/reject events
- Manage user accounts
- System monitoring and logs

## 🎨 Design Features

- **Unified Theme**: Modern gray "Nexus" design across all pages
- **Responsive Design**: Mobile-first approach with cross-device compatibility
- **Intuitive Navigation**: Role-based navigation with clear user flows
- **Interactive Charts**: Real-time analytics with Chart.js visualizations
- **Modern UI/UX**: Clean, professional interface with smooth interactions

## 🔐 Security Features

- **Password Encryption**: Secure password hashing with bcrypt
- **Session Management**: Secure session handling with express-session
- **Role-based Access**: Protected routes based on user roles
- **Input Validation**: Server-side validation for all user inputs
- **File Upload Security**: Secure file handling with type validation

## 📊 API Endpoints

### Authentication
```
POST /auth/register    # User registration
POST /auth/login       # User login
POST /auth/logout      # User logout
GET  /auth/check       # Check authentication status
```

### Events
```
GET    /events              # Get all events
POST   /events              # Create new event
GET    /events/:id          # Get specific event
PUT    /events/:id          # Update event
DELETE /events/:id          # Delete event
GET    /events/organizer-analytics  # Get organizer analytics
```

### Users
```
GET    /users/profile       # Get user profile
PUT    /users/profile       # Update user profile
POST   /users/upload-avatar # Upload profile picture
GET    /users/events        # Get user's events
```

### Admin
```
GET    /admin/dashboard     # Admin dashboard data
GET    /admin/users         # Get all users
PUT    /admin/users/:id     # Update user status
GET    /admin/logs          # Get activity logs
POST   /admin/approve-event # Approve/reject events
```

## 🛠️ Development

### Running in Development Mode
```bash
# Install dependencies
npm install

# Start with nodemon for auto-restart
npx nodemon server.js

# Or start normally
npm start
```

### Database Setup
1. **Local MongoDB**: Ensure MongoDB is running on `mongodb://localhost:27017`
2. **MongoDB Atlas**: Update the connection string in `.env`

### Adding New Features
1. Create appropriate model in `/models`
2. Add routes in `/routes`
3. Implement frontend logic in `/js`
4. Add corresponding HTML pages if needed

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongo --eval "db.adminCommand('ismaster')"

# For MongoDB Atlas, verify connection string
```

**Port Already in Use**
```bash
# Change port in .env file or kill existing process
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

**File Upload Issues**
- Ensure `uploads/` directory exists
- Check file permissions
- Verify file size limits in multer configuration

## 📝 Usage Examples

### Creating an Event
1. Login as organizer
2. Navigate to "Create Event"
3. Fill in event details
4. Upload cover image
5. Submit for admin approval

### Managing Users (Admin)
1. Access admin dashboard
2. View user list in "User Management"
3. Approve/reject user accounts
4. Monitor user activity in logs

### Viewing Analytics (Organizer)
1. Access organizer dashboard
2. View real-time charts
3. Track event performance
4. Monitor registration trends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chart.js for data visualization
- MongoDB for database solutions
- Express.js community for excellent documentation
- All contributors and testers

## 📞 Support

For support, email support@eventkoi.com or create an issue in this repository.

---

**Built with ❤️ by the Event Koi?! Team**
