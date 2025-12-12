import React, { useState } from 'react';
import './JobsiteDropdowns.css';

export default function JobsiteDropdowns() {
  const [openList, setOpenList] = useState(null);

  const toggleList = (key) => {
    setOpenList((prev) => (prev === key ? null : key));
  };

  return (
  <div className="jobsite-box">
    <div className="jobsearch-wrapper">
      <h3>חיפוש עבודה</h3>
      <ul className="dropdown-list">
        <li>סוכן חכם</li>

        <li onClick={() => toggleList('topCategories')}>
          קטגוריות מובילות {openList === 'topCategories' ? '🔼' : '🔽'}
        </li>
        {openList === 'topCategories' && (
          <ul className="sub-dropdown">
            <li>דרושים הייטק</li>
            <li>דרושים סטודנטים</li>
            <li>דרושים בכירים</li>
            <li>דרושים רילוקיישן</li>
            <li>עבודה מהבית</li>
            <li>עבודה היברידית</li>
            <li>עבודה זמנית</li>
            <li>עבודה בחו"ל</li>
            <li>עבודה גם לבני 50 פלוס</li>
            <li>עבודה לנוער</li>
            <li>כל המשרות הפנויות &gt;&gt;</li>
          </ul>
        )}

        <li onClick={() => toggleList('byField')}>
          חיפוש לפי תחום {openList === 'byField' ? '🔼' : '🔽'}
        </li>
        {openList === 'byField' && (
          <ul className="sub-dropdown">
            <li>אדמיניסטרציה</li>
            <li>אינטרנט</li>
            <li>הוראה</li>
            <li>הנדסה</li>
            <li>תעשייה</li>
            <li>כספים</li>
            <li>מכירות</li>
            <li>רפואה</li>
            <li>שירות לקוחות</li>
            <li>תוכנה</li>
            <li>כל התחומים &gt;&gt;</li>
          </ul>
        )}

        <li onClick={() => toggleList('byRegion')}>
          חיפוש לפי אזור {openList === 'byRegion' ? '🔼' : '🔽'}
        </li>
        {openList === 'byRegion' && (
          <ul className="sub-dropdown">
            <li>מרכז</li>
            <li>צפון</li>
            <li>דרום</li>
            <li>תל אביב</li>
            <li>חיפה</li>
            <li>באר שבע</li>
            <li>ירושלים</li>
            <li>כל האזורים &gt;&gt;</li>
          </ul>
        )}

        <li onClick={() => toggleList('byCompany')}>
          חיפוש לפי חברה {openList === 'byCompany' ? '🔼' : '🔽'}
        </li>
        {openList === 'byCompany' && (
          <ul className="sub-dropdown">
            <li>אורמת</li>
            <li>אלקטרה</li>
            <li>דונה</li>
            <li>הפניקס</li>
            <li>וולט</li>
            <li>מאוחדת</li>
            <li>מליסרון</li>
            <li>קמ"ג</li>
            <li>רכבת ישראל</li>
            <li>רשות הטבע והגנים</li>
            <li>לכל החברות &gt;&gt;</li>
          </ul>
        )}
      </ul>
    </div>
  </div>
);

}
