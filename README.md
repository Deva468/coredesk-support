# CoreDesk — IT Support Ticketing System

CoreDesk is a full-stack IT support ticketing system built with the MERN stack (MongoDB, Express, React, Node.js). It allows employees to raise support requests and enables administrators to manage, resolve, and track those requests through a dedicated admin dashboard.

🔗 **Live Demo:** [coredesk-support-dk.vercel.app](https://coredesk-support-dk.vercel.app)

---

## ✨ Features

- **Role-based authentication** — separate access levels for Employees and Administrators
- **Ticket management** — create, view, resolve, and remove support tickets
- **Admin dashboard** — manage registered employees, assign resolvers, and track ticket history
- **Activity audit log** — tracks logins, ticket actions, and admin operations
- **Google OAuth login** — quick sign-in for employee accounts
- **Admin promotion/demotion** — existing admins can grant or revoke admin access
- **Secure JWT-based sessions** with protected routes
- **Responsive UI** built with React and Vite

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- React Router DOM

**Backend:**
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT for authentication
- bcryptjs for password hashing
- Google Auth Library (OAuth)

**Deployment:**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas


## 🚀 Running Locally

### Prerequisites
- Node.js installed
- A MongoDB Atlas account (or local MongoDB instance)

### 1. Clone the repository
```bash
git clone https://github.com/Deva468/coredesk-support.git
cd coredesk-support
```

### 2. Backend Setup
```bash
cd "IT-Help Desk/server"
npm install
```
