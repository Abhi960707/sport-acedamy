# 🏆 Sport Academy Management System

A Full-Stack MERN Sport Academy Management System built using **MongoDB, Express.js, React.js, and Node.js**. The system provides secure role-based access, player and coach management, attendance tracking, payment management, professional player ID cards, reports, and dashboard analytics for sports academies.

---

## 🌐 Live Demo

**Frontend:**  
https://frontend-rho-pink-86.vercel.app

**Backend:**  
https://sport-acedamy-1.onrender.com

---

# ✨ Features

## 🔐 Authentication & Authorization

- JWT Authentication
- Secure Login & Logout
- Password Encryption (bcrypt)
- Protected Routes
- Role-Based Access Control (RBAC)

---

## 👥 Role-Based Access Control

### Super Admin

- Full System Access
- Manage Academies
- Manage Admins
- View Reports
- Dashboard Access

### Admin

- Manage Players
- Manage Coaches
- Manage Attendance
- Manage Payments
- Generate Reports

### Coach

- Manage Assigned Players
- Mark Attendance
- View Player Information

> **Note:** Players do not have a login portal. Player records are managed by authorized users (Admin/Coach).

---

## 🏟 Academy Management

- Academy Registration
- Academy Information
- Academy Settings
- Academy Profile Management

---

## 🧑‍🎓 Player Management

- Add Player
- Edit Player
- Delete Player
- Search Player
- Player Registration Form
- Player Profile
- Professional Player ID Card
- QR Code Integration
- Registration Print
- Player Reports

---

## 👨‍🏫 Coach Management

- Add Coach
- Edit Coach
- Delete Coach
- Coach Profile
- Sport Specialization

---

## 🏅 Sports Management

- Sports Categories
- Games Management
- Event Management

---

## 📅 Attendance Management

- Player Attendance
- Coach Attendance
- Attendance Reports

---

## 💳 Payment Management

- Fee Collection
- Payment Records
- Transaction History
- Pending Fee Tracking
- Payment Reports

---

## 📊 Dashboard Analytics

- Total Players
- Total Coaches
- Revenue Overview
- Attendance Statistics
- Performance Charts

---

## 📑 Reports

- Player Reports
- Attendance Reports
- Payment Reports
- Transaction Reports
- Printable Reports

---

## 🖨 Printing

- Registration Form Print
- Professional Player ID Card Print
- Report Printing

---

# 🛠 Tech Stack

## Frontend

- React.js
- React Router
- Tailwind CSS
- Axios

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JWT
- bcrypt

## Deployment

- Vercel
- Render

---

# 📁 Project Structure

```
Sport-Academy/
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── Backend/
│   ├── Controllers/
│   ├── Middleware/
│   ├── Models/
│   ├── Routes/
│   ├── Config/
│   └── package.json
│
├── README.md
├── .env.example
└── .gitignore
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/Abhi960707/sport-acedamy.git
```

## Install Dependencies

```bash
npm run install:all
```

## Run Development Server

```bash
npm run dev
```

---

# 🔑 Environment Variables

## Backend (.env)

```env
PORT=4005
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_JWT_SECRET
```

## Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:4005
```

> **Important:** Never commit your real `.env` file, MongoDB URI, or JWT secret to GitHub.

---

# 📸 Screenshots

Add screenshots of the following pages:

- Login
- Dashboard
- Player List
- Coach List
- Attendance
- Payments
- Reports
- Player Registration
- Professional Player ID Card

---

# 🚀 Future Improvements

- Email Notifications
- SMS Notifications
- Backup & Restore
- Multi-language Support
- Mobile Responsive Improvements
- Advanced Dashboard Analytics
- Performance Optimization

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Developer

**Abhijeet Mahadev Narsale**

**MERN Stack Developer**

### GitHub

https://github.com/Abhi960707

### LinkedIn

( www.linkedin.com/in/abhijeet-narsale-a889832a3 )

### Portfolio

( https://portfolio-roan-six-0lejr199ko.vercel.app )


---

## ⭐ Support

If you found this project useful, please consider giving it a **Star ⭐** on GitHub.
