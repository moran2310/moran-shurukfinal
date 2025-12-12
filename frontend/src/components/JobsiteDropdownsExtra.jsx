import React, { useState } from 'react';
import './JobsiteDropdowns.css'; // משתמשים באותו CSS כי הסטייל אחיד

export default function JobsiteDropdownsExtra() {
  const [openList, setOpenList] = useState(null);

  const toggleList = (key) => {
    setOpenList((prev) => (prev === key ? null : key));
  };

  return (
    <div className="jobsite-box">
      <div className="jobsearch-wrapper">
        <h2 className="jobsearch-title">כיצד למצוא עבודה?</h2>
        <div className="jobsearch-container">
          <ul className="dropdown-list">
            <li onClick={() => toggleList('guides')}>
              מדריכים לחיפוש עבודה {openList === 'guides' ? '🔼' : '🔽'}
            </li>
            {openList === 'guides' && (
              <ul className="sub-dropdown">
                <li>מכתב מקדים</li>
                <li>שאלות נפוצות בראיון עבודה</li>
                <li>שאלות קשות בראיונות עבודה</li>
                <li>איך להציג את עצמך בראיון עבודה</li>
                <li>תפקידים מתחזקים בשוק העבודה</li>
                <li>רעיונות לעבודות מהבית</li>
                <li>איך למצוא עבודה לנוער?</li>
              </ul>
            )}

            <li onClick={() => toggleList('tools')}>
              כלים לחיפוש עבודה {openList === 'tools' ? '🔼' : '🔽'}
            </li>
            {openList === 'tools' && (
              <ul className="sub-dropdown">
                <li>הכוון תעסוקתי</li>
                <li>ליווי אישי למציאת עבודה</li>
                <li>ליווי אישי לגילאי 50+</li>
                <li>ליווי אישי לבכירים</li>
                <li>איך לכתוב קורות חיים?</li>
                <li>כתיבת קורות חיים בחינם</li>
                <li>כתיבה מקצועית של קורות חיים</li>
                <li>הכנה לראיון עבודה</li>
              </ul>
            )}

            <li onClick={() => toggleList('unemployment')}>
              כלים לפיטורים ואבטלה {openList === 'unemployment' ? '🔼' : '🔽'}
            </li>
            {openList === 'unemployment' && (
              <ul className="sub-dropdown">
                <li>מכתב התפטרות</li>
                <li>מחשבון דמי אבטלה</li>
              </ul>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
