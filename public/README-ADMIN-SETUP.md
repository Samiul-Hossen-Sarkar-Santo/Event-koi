# Event-koi Project - Complete Setup Guide

## 🎯 **Project Overview**
Event-koi is a comprehensive event management platform with separate user and admin functionalities, featuring secure authentication, event management, and user administration.

## ✅ **Completed Features**

### **🔐 Secure Admin System**

#### **Admin Portal** (`admin-portal.html`)
- **Hidden Access**: Only accessible via direct URL `http://localhost:3000/admin-portal.html`
- **Dual Authentication**: Registration requires invitation code, login requires security code
- **Professional UI**: Gradient design with security indicators

#### **Admin Authentication Codes**
- **Invitation Code**: `ADMIN_2025_SECRET_KEY` (for registration)
- **Security Code**: `SECURE_ADMIN_ACCESS_2025` (for login)
- **Environment Variables**: Can be overridden via `.env` file

#### **Admin Registration Process**
1. Navigate to `/admin-portal.html`
2. Click "Need admin access? Contact administrator"
3. Enter invitation code: `ADMIN_2025_SECRET_KEY`
4. Complete registration form
5. Login with security code: `SECURE_ADMIN_ACCESS_2025`

### **👑 Admin Dashboard Features** (`admin.html`)

#### **Dashboard Overview**
- Real-time statistics (Total Events, Active Users, Pending Approvals, Revenue)
- Quick access navigation sidebar
- Responsive design

#### **Event Management**
- **Approval System**: Review and approve/reject pending events
- **Event Details**: View complete event information before approval
- **Bulk Actions**: Approve or reject multiple events

#### **User Management**
- **User Listing**: View all users with search and filtering
- **Account Status**: Suspend, activate, or ban users
- **Role Management**: View user roles (admin, organizer, user)
- **User Statistics**: Track registrations and events created per user

#### **Available Admin Actions**
- ✅ Approve/Reject Events
- ✅ Suspend/Activate Users
- ✅ Ban Users (with reason logging)
- ✅ View User Statistics
- ✅ Monitor Platform Activity

### **👤 Enhanced User Features**

#### **User Dashboard** (`user.html`)
- **Profile Management**: Complete profile editing with bio, skills, interests
- **Registration History**: View past, upcoming, and cancelled event registrations
- **Favorites System**: Save and manage favorite events
- **Notification Preferences**: Email and reminder settings

#### **User Profile Fields**
- Basic Info: Name, bio, university, year of study
- Skills & Interests: Customizable tags
- Social Links: Professional networking
- Notification Preferences: Granular control

## 🛡️ **Security Features**

### **Multi-Layer Admin Security**
1. **Hidden Portal**: Admin access not visible to regular users
2. **Invitation-Only Registration**: Requires secret invitation code
3. **Security Code Login**: Additional security layer for admin login
4. **Session Management**: Secure admin session handling
5. **Account Status Enforcement**: Banned/suspended users blocked from actions

### **Access Control**
- **Role-Based Permissions**: Admin, organizer, user roles
- **Account Status Monitoring**: Active, suspended, banned statuses
- **Audit Trail**: Status changes logged with admin ID and timestamp

## 📁 **File Structure**

### **Frontend Files**
```
admin-portal.html       # Hidden admin login/registration portal
admin.html             # Admin dashboard (requires authentication)
user.html              # User dashboard with profile management
js/admin.js            # Admin dashboard functionality
js/user.js             # User dashboard functionality
css/admin.css          # Admin styling
css/user.css           # User styling
```

### **Backend Files**
```
routes/auth.js         # Admin & user authentication
routes/users.js        # User management & admin user operations
routes/events.js       # Event management with admin approval
models/User.js         # Enhanced user model with admin fields
models/Event.js        # Event model with approval status
models/Registration.js # Registration tracking
```

## 🚀 **Getting Started**

### **1. Start the Server**
```bash
cd "e:\Projects\sre\Event-koi"
npm start
```

### **2. Create First Admin**
1. Visit: `http://localhost:3000/admin-portal.html`
2. Click "Need admin access? Contact administrator"
3. Use invitation code: `ADMIN_2025_SECRET_KEY`
4. Complete registration

### **3. Admin Login**
1. Use security code: `SECURE_ADMIN_ACCESS_2025`
2. Access admin dashboard at: `http://localhost:3000/admin.html`

### **4. User Access**
- Main site: `http://localhost:3000`
- User registration: `http://localhost:3000/login_signup.html`
- User dashboard: `http://localhost:3000/user.html`

## 📋 **Admin Endpoints**

### **Authentication**
- `POST /auth/admin-register` - Admin registration (invitation-only)
- `POST /auth/admin-login` - Secure admin login
- `GET /auth/admin-check` - Verify admin session

### **User Management**
- `GET /users/admin/all` - List all users with pagination
- `PUT /users/admin/:userId/status` - Update user account status
- `GET /users/admin/stats` - User statistics

### **Event Management**
- `GET /events/admin/all-events` - All events by status
- `PUT /events/admin/:id/approval` - Approve/reject events
- `GET /events/admin/dashboard-stats` - Dashboard statistics

## 🎨 **User Experience**

### **Admin Experience**
- Clean, professional dashboard
- Intuitive navigation with icons
- Real-time data updates
- Secure authentication flow

### **User Experience**
- Rich profile management
- Registration history tracking
- Event favorites system
- Notification preferences

## 🔧 **Configuration**

### **Environment Variables** (Optional)
Create `.env` file:
```
ADMIN_INVITE_CODE=your_custom_invitation_code
ADMIN_SECURITY_CODE=your_custom_security_code
```

### **Default Codes** (If no .env file)
- Invitation Code: `ADMIN_2025_SECRET_KEY`
- Security Code: `SECURE_ADMIN_ACCESS_2025`

## 🎯 **Next Enhancement Opportunities**

### **Short Term**
- Email notifications for user actions
- Event capacity and waitlist management
- Advanced analytics and reporting
- Bulk user operations

### **Long Term**
- Payment integration
- Mobile app development
- Advanced event templates
- Integration with calendar systems

## ✨ **Key Benefits**

1. **Security First**: Multi-layer admin authentication
2. **User Friendly**: Intuitive interfaces for both users and admins
3. **Scalable**: Proper role-based access control
4. **Maintainable**: Clean code structure and organization
5. **Professional**: Enterprise-grade admin dashboard

## 🛟 **Support**

The system is now fully functional with:
- ✅ Secure admin authentication and registration
- ✅ Comprehensive admin dashboard
- ✅ Enhanced user profiles and dashboard
- ✅ Event approval workflow
- ✅ User management capabilities
- ✅ Account status enforcement

All admin and user features are working and ready for production use!
