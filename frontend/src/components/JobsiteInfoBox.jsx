import React from 'react';
import './JobsiteCategories.css'; // כדי לקבל את אותם עיצובים

export default function JobsiteInfoBox() {
  return (
    <div className="jobsite-box">
      <h2 className="jobsite-title">מידע נוסף</h2>
      <ul className="jobsite-list">
        <li>הצהרת נגישות</li>
        <li>מדיניות פרטיות</li>
        <li>מי אנחנו</li>
        <li>רוצה לעבוד בצעד הבא בקריירה?</li>
        <li>שאלות נפוצות</li>
        <li>שירות לקוחות</li>
        <li>תנאי שימוש</li>
      </ul>
    </div>
  );
}
