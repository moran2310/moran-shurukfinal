import React from 'react';
import './InterviewDress.css';
import Navbar from '../components/Navbar';

export default function InterviewDress() {
  return (
    <div className="article-page">
      <Navbar />
      <div className="article-header" style={{ 
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '6rem 2rem'
      }}>
        <h1>איך להתלבש לראיון עבודה</h1>
        <div className="article-meta">
          <span className="article-date">עודכן: 6 באוגוסט 2025</span>
          <span className="article-author">מאת: צוות המומחים שלנו</span>
        </div>
      </div>

      <div className="article-content">
        <div className="article-intro">
          <p>
            הרושם הראשוני שאתם יוצרים בראיון עבודה מתחיל עוד לפני שאמרתם מילה.
            הלבוש שלכם מעביר מסר חשוב על המקצועיות, תשומת הלב לפרטים והרצינות שלכם.
            הכנו עבורכם מדריך מקיף שיעזור לכם להתלבש בצורה מושלמת לראיון העבודה הבא שלכם.
          </p>
        </div>

        <div className="dress-section">
          <h2>כללי יסוד</h2>
          <div className="dress-content">
            <div className="dress-icon">👔</div>
            <ul className="dress-tips">
              <li>בחרו בגדים נקיים ומגוהצים</li>
              <li>העדיפו צבעים קלאסיים ומאופקים</li>
              <li>ודאו שהבגדים מתאימים למידותיכם</li>
              <li>הימנעו מבגדים חושפניים או צמודים מדי</li>
            </ul>
          </div>
        </div>

        <div className="dress-section">
          <h2>לבוש פורמלי</h2>
          <div className="dress-content">
            <div className="dress-icon">🎯</div>
            <div className="dress-subsections">
              <div className="dress-subsection">
                <h3>גברים</h3>
                <ul>
                  <li>חליפה בצבע כהה (שחור, כחול נייבי או אפור כהה)</li>
                  <li>חולצה מכופתרת בצבע בהיר</li>
                  <li>עניבה בצבע תואם</li>
                  <li>נעליים מצוחצחות בצבע כהה</li>
                  <li>גרביים כהות ותואמות</li>
                </ul>
              </div>
              <div className="dress-subsection">
                <h3>נשים</h3>
                <ul>
                  <li>חליפת מכנסיים או חצאית בצבע קלאסי</li>
                  <li>חולצה או חולצת משי מחמיאה</li>
                  <li>נעליים סגורות בעקב נמוך-בינוני</li>
                  <li>תכשיטים עדינים ומינימליסטיים</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="dress-section">
          <h2>לבוש חצי פורמלי</h2>
          <div className="dress-content">
            <div className="dress-icon">👕</div>
            <div className="dress-subsections">
              <div className="dress-subsection">
                <h3>גברים</h3>
                <ul>
                  <li>מכנסיים מחויטים</li>
                  <li>חולצה מכופתרת (עם או בלי עניבה)</li>
                  <li>בלייזר (אופציונלי)</li>
                  <li>נעליים אלגנטיות</li>
                </ul>
              </div>
              <div className="dress-subsection">
                <h3>נשים</h3>
                <ul>
                  <li>שמלה עסקית בצבע מאופק</li>
                  <li>חצאית עם חולצה מחמיאה</li>
                  <li>מכנסיים מחויטים עם חולצה אלגנטית</li>
                  <li>נעליים נוחות ומקצועיות</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="dress-section">
          <h2>טיפים נוספים</h2>
          <div className="dress-content">
            <div className="dress-icon">💡</div>
            <div className="tips-list">
              <div className="tip-item">
                <h3>התאמה לתרבות החברה</h3>
                <p>חקרו מראש את סגנון הלבוש המקובל בחברה. בחברות הייטק, למשל, הקוד הלבוש עשוי להיות יותר קז'ואל.</p>
              </div>
              <div className="tip-item">
                <h3>היגיינה ותחזוקה</h3>
                <p>הקפידו על שיער מסודר, ציפורניים נקיות וטיפוח כללי. הימנעו מבשמים חזקים.</p>
              </div>
              <div className="tip-item">
                <h3>אביזרים</h3>
                <p>בחרו תיק או תיקייה מקצועית לקורות החיים. הימנעו מתכשיטים רועשים או בולטים מדי.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h2>נקודות מפתח לזכירה</h2>
          <ul>
            <li>פשוט ואלגנטי עדיף על מוגזם ובולט</li>
            <li>נוחות חשובה - אתם צריכים להרגיש בטוחים בעצמכם</li>
            <li>תמיד עדיף להיות לבושים יותר פורמלי מאשר פחות</li>
            <li>הכנה מראש תמנע לחץ ביום הראיון</li>
          </ul>
        </div>

        <div className="additional-resources">
          <h3>משאבים נוספים</h3>
          <ul>
            <li>
              <a href="/articles/interview-mistakes">5 טעויות שלא עושים בראיון עבודה</a>
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
