# Project Management System

A comprehensive project and task management platform built with modern web technologies. Features organization-based multi-tenancy, role-based access control, and comprehensive audit logging.

## 🚀 Features

### Authentication & Organization Management
- **Self Registration**: Users can register and automatically create their own organization (become admin)
- **Admin-only Invitations**: Only organization admins can invite new members via email
- **Invite-based Registration**: New users join organizations through admin invitations
- **Role-based Access**: Admin and Member roles with appropriate permissions
- **Secure Authentication**: JWT-based authentication system

### Project Management
- **Create Projects**: Organize work into projects with descriptions, priorities, and due dates
- **Project Assignment**: Assign team members to projects
- **Status Tracking**: Track project progress (Active → Completed → Archived)
- **Project Dashboard**: Overview of all organization projects

### Task Management
- **Task Creation**: Create detailed tasks within projects
- **Task Assignment**: Assign tasks to specific team members
- **Workflow Management**: Move tasks through workflow stages (To Do → In Progress → Review → Done)
- **Priority Management**: Set task priorities (Low, Medium, High)
- **Due Date Tracking**: Set and monitor task deadlines

### Audit & Monitoring
- **Organization-wide Audit Logs**: Track all important actions across the organization
- **Project-specific Logs**: View audit trails for specific projects
- **Action Tracking**: Monitor user actions, invitations, project changes, and more
- **Comprehensive Logging**: Detailed audit trail for compliance and monitoring


## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance (local or cloud)
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repositories

```bash
# Clone all three repositories
git clone <https://github.com/eklavya-successiveTech/MiniProjectFrontend.git> frontend
git clone <https://github.com/eklavya-successiveTech/MiniProjectBackend.git> backend  
git clone <https://github.com/eklavya-successiveTech/miniProjectGQL.git> graphql
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 3. GraphQL Server Setup

```bash
cd graphql
npm install
npm run dev
```
### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🚦 Getting Started

### Registration Flow

#### Option 1: Self Registration
1. Visit the application homepage
2. Click "Sign Up"
3. Fill in your details (name, email, password)
4. Upon successful registration, you'll automatically create and become admin of your own organization
5. You can then invite other members to join your organization

#### Option 2: Invitation-based Registration (Admin Only)
1. An organization **admin** sends you an invitation email
2. Click the invitation link in the email
3. Complete your registration (name, password) - email is pre-filled
4. You'll be registered as a member of the inviting organization

**Note**: Only organization admins have the ability to invite new members. Regular members cannot send invitations.

### Using the Platform

1. **Dashboard**: View organization overview, recent projects, and audit logs
2. **Projects**: Create, edit, and manage projects
3. **Tasks**: Create tasks within projects, assign them, and track progress
4. **Team**: Admins can invite new members and manage organization users
5. **Audit Logs**: Monitor all activities across the organization or specific projects

## 🔧 Available Scripts

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run start        # Start production server
npm run test         # Run test suite
npm run build        # Build for production
```

### GraphQL
```bash
npm run dev          # Start GraphQL server with hot reload
npm run start        # Start production GraphQL server
npm run test         # Run test suite
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run test suite
npm run lint         # Run linting
```

## 📊 Database Schema

The system uses MongoDB with the following main collections:
- **Users**: Store user authentication and profile data
- **Organizations**: Manage organization information
- **Projects**: Project details and metadata
- **Tasks**: Individual task items within projects
- **Invites**: Manage user invitations with expiry
- **AuditLogs**: Comprehensive activity tracking
