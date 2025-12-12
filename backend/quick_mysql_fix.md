# Quick XAMPP MySQL Fix

## Method 1: Reset MySQL Data (Recommended)

1. **Stop XAMPP completely**
   - Close XAMPP Control Panel
   - Stop all services

2. **Backup important data** (if any)
   - Copy `C:\xampp\mysql\data\jobportal` folder to desktop (if exists)

3. **Delete corrupted files**
   - Go to `C:\xampp\mysql\data`
   - Delete these files:
     - `ib_logfile0`
     - `ib_logfile1` 
     - `ibdata1`
   - Keep the `mysql` folder and any database folders

4. **Restart XAMPP**
   - Open XAMPP Control Panel
   - Start MySQL service
   - MySQL should now start clean

5. **Recreate your database**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create new database called `jobportal`
   - Your Node.js app will create the tables automatically

## Method 2: Complete Fresh Install (If Method 1 fails)

1. **Uninstall XAMPP**
2. **Download latest XAMPP** from https://www.apachefriends.org/
3. **Install fresh XAMPP**
4. **Start MySQL service**
5. **Create `jobportal` database**

## After MySQL is Fixed:

1. Start XAMPP MySQL service
2. Run your Node.js backend: `node server.js`
3. The beautiful dashboard styling should load properly
