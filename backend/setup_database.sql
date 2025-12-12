-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS jobportal;
USE jobportal;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('worker', 'employer', 'admin') DEFAULT 'worker',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create worker_profiles table
CREATE TABLE IF NOT EXISTS worker_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  skills TEXT,
  experience_years INT,
  education VARCHAR(255),
  preferred_job_type VARCHAR(100),
  preferred_location VARCHAR(100),
  salary_expectation DECIMAL(10,2),
  cv_file VARCHAR(255),
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  job_recommendations BOOLEAN DEFAULT TRUE,
  application_updates BOOLEAN DEFAULT TRUE,
  profile_views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  location VARCHAR(255),
  job_type VARCHAR(50),
  category VARCHAR(100),
  company_name VARCHAR(255),
  employer_id INT,
  status ENUM('active', 'inactive', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  status ENUM('pending', 'in_review', 'accepted', 'rejected') DEFAULT 'pending',
  cv_file VARCHAR(255),
  cover_letter TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_application (user_id, job_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bookmark (user_id, job_id)
);

-- Insert some sample data for testing
INSERT IGNORE INTO users (id, full_name, email, password, role) VALUES 
(1, 'Test Worker', 'worker@test.com', '$2b$10$example', 'worker'),
(2, 'Test Employer', 'employer@test.com', '$2b$10$example', 'employer');

-- Insert sample jobs
INSERT IGNORE INTO jobs (id, title, description, company_name, location, salary_min, salary_max, employer_id) VALUES 
(1, 'מפתח Full Stack', 'פיתוח אפליקציות ווב מתקדמות', 'חברת הייטק מובילה', 'תל אביב', 15000, 25000, 2),
(2, 'מעצב UI/UX', 'עיצוב ממשקי משתמש חדשניים', 'סטודיו עיצוב', 'חיפה', 12000, 20000, 2),
(3, 'מנהל פרויקטים', 'ניהול פרויקטי טכנולוגיה', 'חברת ייעוץ', 'ירושלים', 18000, 28000, 2);

SHOW TABLES;
