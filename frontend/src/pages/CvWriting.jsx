import React from 'react';
import './CvWriting.css';
import Navbar from '../components/Navbar';

export default function CvWriting() {
  return (
    <div className="article-page">
      <Navbar />
      <div className="article-header" style={{ 
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '6rem 2rem'
      }}>
        <h1>איך לכתוב קורות חיים מנצחים</h1>
        <div className="article-meta">
          <span className="article-date">עודכן: 6 באוגוסט 2025</span>
          <span className="article-author">מאת: צוות המומחים שלנו</span>
        </div>
      </div>

      <div className="article-content">
        <div className="article-intro">
          <p>
            קורות חיים הם הכרטיס הביקור שלכם בעולם העבודה. 
            זהו המסמך הראשון שמעסיקים פוטנציאליים רואים, ולכן חשוב שיהיה מרשים, מקצועי ומדויק.
            במדריך זה נלמד אתכם איך ליצור קורות חיים שיבלטו מעל כולם ויעזרו לכם להשיג את העבודה שאתם רוצים.
          </p>
        </div>

        <div className="cv-section">
          <h2>מבנה בסיסי</h2>
          <div className="cv-content">
            <div className="cv-icon">📋</div>
            <div className="content-block">
              <p>קורות החיים צריכים לכלול את החלקים הבאים:</p>
              <ul className="cv-checklist">
                <li>פרטים אישיים ויצירת קשר</li>
                <li>תקציר מקצועי</li>
                <li>ניסיון תעסוקתי</li>
                <li>השכלה והכשרות</li>
                <li>כישורים ומיומנויות</li>
                <li>שפות</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="cv-section">
          <h2>פרטים אישיים</h2>
          <div className="cv-content">
            <div className="cv-icon">👤</div>
            <div className="content-block">
              <div className="example-block">
                <h3>מה לכלול:</h3>
                <ul>
                  <li>שם מלא</li>
                  <li>מספר טלפון</li>
                  <li>כתובת אימייל מקצועית</li>
                  <li>עיר מגורים</li>
                  <li>קישור לפרופיל LinkedIn</li>
                </ul>
              </div>
              <div className="pro-tip">
                <strong>טיפ:</strong> השתמשו בכתובת אימייל פשוטה ומקצועית, רצוי בפורמט שם.משפחה@
              </div>
            </div>
          </div>
        </div>

        <div className="cv-section">
          <h2>תקציר מקצועי</h2>
          <div className="cv-content">
            <div className="cv-icon">📝</div>
            <div className="content-block">
              <p>פסקה קצרה (3-4 שורות) המתארת:</p>
              <ul>
                <li>שנות ניסיון בתחום</li>
                <li>הישגים עיקריים</li>
                <li>תחומי התמחות</li>
                <li>מטרות מקצועיות</li>
              </ul>
              <div className="example-block">
                <h3>דוגמה:</h3>
                <p className="example-text">
                  "מנהל/ת פרויקטים בעל/ת 5 שנות ניסיון בניהול פרויקטי תוכנה מורכבים.
                  מומחיות בהובלת צוותים רב-תחומיים והשגת יעדים תחת לוחות זמנים צפופים.
                  הובלתי בהצלחה למעלה מ-15 פרויקטים בתקציב כולל של מעל 5 מיליון ש״ח."
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="cv-section">
          <h2>ניסיון תעסוקתי</h2>
          <div className="cv-content">
            <div className="cv-icon">💼</div>
            <div className="content-block">
              <div className="example-block">
                <h3>מבנה מומלץ לכל משרה:</h3>
                <ul>
                  <li>שם החברה ותפקיד</li>
                  <li>תאריכי העסקה</li>
                  <li>3-5 הישגים משמעותיים</li>
                  <li>מספרים ונתונים כמותיים</li>
                </ul>
              </div>
              <div className="pro-tip">
                <strong>טיפ:</strong> השתמשו במילות פעולה חזקות כמו: "הובלתי", "פיתחתי", "שיפרתי", "הגדלתי"
              </div>
            </div>
          </div>
        </div>

        <div className="cv-section">
          <h2>טיפים לעיצוב</h2>
          <div className="cv-content">
            <div className="cv-icon">🎨</div>
            <div className="content-block">
              <ul className="design-tips">
                <li>
                  <strong>פונט:</strong> השתמשו בפונט קריא וקלאסי (Arial, Times New Roman)
                </li>
                <li>
                  <strong>גודל:</strong> כותרות 14-16, טקסט רגיל 11-12
                </li>
                <li>
                  <strong>שוליים:</strong> השאירו מספיק שוליים לבנים (2.5 ס"מ מכל צד)
                </li>
                <li>
                  <strong>אורך:</strong> לא יותר מ-2 עמודים
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="cv-section">
          <h2>טעויות נפוצות</h2>
          <div className="cv-content">
            <div className="cv-icon">⚠️</div>
            <div className="content-block">
              <div className="mistakes-list">
                <div className="mistake-item">
                  <h3>שגיאות כתיב</h3>
                  <p>בדקו היטב את הטקסט לפני השליחה</p>
                </div>
                <div className="mistake-item">
                  <h3>מידע לא רלוונטי</h3>
                  <p>התמקדו במידע שרלוונטי למשרה המבוקשת</p>
                </div>
                <div className="mistake-item">
                  <h3>פורמט לא אחיד</h3>
                  <p>שמרו על עיצוב ופורמט אחידים לאורך כל המסמך</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h2>נקודות מפתח לזכירה</h2>
          <ul>
            <li>התאימו את קורות החיים לכל משרה</li>
            <li>הדגישו הישגים ותוצאות כמותיות</li>
            <li>שמרו על תמציתיות ובהירות</li>
            <li>בדקו היטב שגיאות כתיב ודקדוק</li>
          </ul>
        </div>

        <div className="additional-resources">
          <h3>משאבים נוספים</h3>
          <ul>
            <li>
              <a href="/articles/interview-mistakes">5 טעויות שלא עושים בראיון עבודה</a>
            </li>
            <li>
              <a href="/articles/interview-dress">איך להתלבש לראיון עבודה</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
