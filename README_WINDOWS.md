# Windows Setup Guide

This project contains **frontend** (React) and **backend** (Node.js + MySQL).  
Follow these steps to run on Windows:

## 1) Install prerequisites
- Node.js LTS (https://nodejs.org)
- MySQL (e.g., XAMPP/WAMP) — default port 3306
- Git (optional)

## 2) Database
- Open phpMyAdmin and create a database named `jobportal`.
- Import the SQL dump located at `jobportal.sql` (root of the project).

## 3) Environment variables
- Go to `backend/` and copy `.env.example` to `.env`.
- For Windows, set:
  ```env
  DB_HOST=127.0.0.1
  DB_USER=root
  DB_PASSWORD=        # leave empty if using XAMPP default
  DB_NAME=jobportal
  DB_PORT=3306
  # DO NOT set DB_SOCKET on Windows
  PORT=3008
  JWT_SECRET=something-secure
  ```

## 4) Install & run
Open **two terminals**:

**Backend**
```bash
cd backend
npm install
npm run dev   # or: npm start
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

## 5) Access
- Frontend usually: http://localhost:3000
- Backend API: http://localhost:3008

> Note: If port 3008 is busy on your machine, change `PORT` in `backend/.env` accordingly.
