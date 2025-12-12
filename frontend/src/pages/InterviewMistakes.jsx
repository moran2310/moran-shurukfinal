import React from 'react';
import './InterviewMistakes.css';
import Navbar from '../components/Navbar';

export default function InterviewMistakes() {
  return (
    <div className="article-page">
      <Navbar />
      <div className="article-header" style={{ 
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1573497161529-95eb65b7a2fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '6rem 2rem'
      }}>
        <h1>5 טעויות שלא עושים בראיון עבודה</h1>
        <div className="article-meta">
          <span className="article-date">עודכן: 6 באוגוסט 2025</span>
          <span className="article-author">מאת: צוות המומחים שלנו</span>
        </div>
      </div>

      <div className="article-content">
        <div className="article-intro">
          <p>
            ראיון עבודה הוא הזדמנות חשובה להציג את עצמכם בפני מעסיק פוטנציאלי. 
            אבל לפעמים, טעויות קטנות יכולות לפגוע בסיכויים שלכם לקבל את המשרה. 
            הכנו עבורכם רשימה של 5 טעויות נפוצות שחשוב להימנע מהן.
          </p>
        </div>

        <div className="mistake-section">
          <h2>1. איחור לראיון</h2>
          <div className="mistake-content">
            <div className="mistake-icon">⏰</div>
            <p>
              איחור לראיון עבודה מעביר מסר שלילי לגבי האחריות והמקצועיות שלכם.
              תמיד הגיעו 10-15 דקות לפני הזמן המתוכנן.
            </p>
            <div className="pro-tip">
              <strong>טיפ:</strong> בדקו את המסלול מראש, קחו בחשבון פקקים ועיכובים אפשריים.
            </div>
          </div>
        </div>

        <div className="mistake-section">
          <h2>2. חוסר הכנה מספקת</h2>
          <div className="mistake-content">
            <div className="mistake-icon">📚</div>
            <p>
              הגעה לראיון בלי מחקר מקדים על החברה והתפקיד מראה חוסר רצינות.
              חשוב להכיר את החברה, ערכיה, והדרישות המרכזיות של התפקיד.
            </p>
            <div className="pro-tip">
              <strong>טיפ:</strong> הקדישו זמן לקריאה על החברה באתר שלה וברשתות החברתיות.
            </div>
          </div>
        </div>

        <div className="mistake-section">
          <h2>3. תשובות לא מפורטות</h2>
          <div className="mistake-content">
            <div className="mistake-icon">💬</div>
            <p>
              תשובות קצרות מדי או כלליות מדי לא מאפשרות למראיין להכיר אתכם.
              חשוב לתת דוגמאות ספציפיות מהניסיון שלכם.
            </p>
            <div className="pro-tip">
              <strong>טיפ:</strong> השתמשו בשיטת STAR: מצב, משימה, פעולה, תוצאה.
            </div>
          </div>
        </div>

        <div className="mistake-section">
          <h2>4. דיבור שלילי על מעסיקים קודמים</h2>
          <div className="mistake-content">
            <div className="mistake-icon">🚫</div>
            <p>
              ביקורת על מקומות עבודה קודמים מעבירה מסר שלילי ולא מקצועי.
              התמקדו בסיבות חיוביות לעזיבה ובמה שלמדתם.
            </p>
            <div className="pro-tip">
              <strong>טיפ:</strong> הדגישו את הרצון שלכם להתפתח ולצמוח מקצועית.
            </div>
          </div>
        </div>

        <div className="mistake-section">
          <h2>5. חוסר שאלות בסוף הראיון</h2>
          <div className="mistake-content">
            <div className="mistake-icon">❓</div>
            <p>
              כשהמראיין שואל אם יש לכם שאלות, "לא" היא תשובה לא טובה.
              הכינו מראש שאלות מעמיקות על התפקיד והחברה.
            </p>
            <div className="pro-tip">
              <strong>טיפ:</strong> הכינו לפחות 3-4 שאלות איכותיות מראש.
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h2>סיכום</h2>
          <p>
            הימנעות מטעויות אלו תעזור לכם להציג את עצמכם בצורה הטובה ביותר בראיון העבודה.
            זכרו: ההכנה היא המפתח להצלחה!
          </p>
        </div>

        <div className="additional-resources">
          <h3>משאבים נוספים</h3>
          <ul>
            <li>
              <a href="/articles/interview-dress">איך להתלבש לראיון עבודה</a>
            </li>
            <li>
              <a href="/articles/cv-writing">איך לכתוב קורות חיים מנצחים</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
