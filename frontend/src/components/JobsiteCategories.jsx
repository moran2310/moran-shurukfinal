import React from 'react';
import './JobsiteCategories.css';

export default function JobsiteCategories() {
  return (
    <div className="jobsite-box">
      <h2 className="jobsite-title">מתחם השכר</h2>
      <ul className="jobsite-list">
        <li>טבלאות שכר</li>
        <li>נתוני שכר לפי תפקיד</li>
        <li>כמה אתם שווים</li>
        <li>מחשבון שכר ברוטו נטו</li>
      </ul>
    </div>
  );
}
