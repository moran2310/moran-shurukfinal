import React from 'react';
import './InterviewTips.css';
import Navbar from '../components/Navbar';

export default function InterviewTips() {
  return (
    <div className="article-page">
      <Navbar />
      <div className="article-header" style={{ 
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '6rem 2rem'
      }}>
        <h1>טיפים לראיון עבודה</h1>
        <div className="article-meta">
          <span className="article-date">עודכן: 6 באוגוסט 2025</span>
          <span className="article-author">מאת: צוות המומחים שלנו</span>
        </div>
      </div>

      <div className="article-content">
        <div className="article-intro">
          <p>
            ראיון עבודה הוא הזדמנות חשובה להציג את עצמכם ולהרשים את המראיין.
            אספנו עבורכם את הטיפים החשובים ביותר שיעזרו לכם להצליח בראיון העבודה הבא שלכם.
          </p>
        </div>

        <div className="tips-section before-interview">
          <h2>לפני הראיון</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">🔍</div>
              <h3>חקירה מקדימה</h3>
              <ul>
                <li>קראו על החברה באתר הרשמי</li>
                <li>בדקו את דף ה-LinkedIn של החברה</li>
                <li>הכירו את המוצרים/שירותים העיקריים</li>
                <li>התעדכנו בחדשות אחרונות על החברה</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-icon">📝</div>
              <h3>הכנת מסמכים</h3>
              <ul>
                <li>הדפיסו מספר עותקים של קו"ח</li>
                <li>הכינו תיק עם תעודות ואישורים</li>
                <li>הביאו פנקס ועט לרישום</li>
                <li>ארגנו תיק מסמכים מסודר</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-icon">⏰</div>
              <h3>תכנון לוגיסטי</h3>
              <ul>
                <li>בדקו את המסלול מראש</li>
                <li>צאו מוקדם מהצפוי</li>
                <li>הגיעו 10-15 דקות לפני</li>
                <li>ודאו שהטלפון על שקט</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="tips-section during-interview">
          <h2>במהלך הראיון</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">🤝</div>
              <h3>שפת גוף</h3>
              <ul>
                <li>שמרו על קשר עין</li>
                <li>חייכו באופן טבעי</li>
                <li>שבו בצורה זקופה</li>
                <li>הקשיבו בתשומת לב</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-icon">💬</div>
              <h3>תקשורת מילולית</h3>
              <ul>
                <li>דברו בביטחון אך בצניעות</li>
                <li>תנו דוגמאות מניסיונכם</li>
                <li>השתמשו בשפה מקצועית</li>
                <li>הימנעו מביקורת על מעסיקים קודמים</li>
              </ul>
            </div>

            <div className="tip-card highlight">
              <div className="tip-icon">⭐</div>
              <h3>שאלות נפוצות</h3>
              <div className="common-questions">
                <div className="question">
                  <strong>ספר/י על עצמך</strong>
                  <p>התמקדו בניסיון המקצועי הרלוונטי</p>
                </div>
                <div className="question">
                  <strong>למה את/ה רוצה לעבוד אצלנו?</strong>
                  <p>הדגישו התאמה לערכי החברה</p>
                </div>
                <div className="question">
                  <strong>מהן נקודות החוזק שלך?</strong>
                  <p>תנו דוגמאות מעשיות</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tips-section after-interview">
          <h2>אחרי הראיון</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">📧</div>
              <h3>מעקב</h3>
              <ul>
                <li>שלחו מייל תודה</li>
                <li>הדגישו נקודות חשובות מהראיון</li>
                <li>הביעו התלהבות מהתפקיד</li>
                <li>שאלו על המשך התהליך</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-icon">📋</div>
              <h3>הפקת לקחים</h3>
              <ul>
                <li>רשמו נקודות לשיפור</li>
                <li>תעדו שאלות מעניינות</li>
                <li>שמרו על קשר מקצועי</li>
                <li>המשיכו בחיפוש עד לקבלת הצעה</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pro-tips-section">
          <h2>טיפים מתקדמים</h2>
          <div className="pro-tips-grid">
            <div className="pro-tip-card">
              <h3>שפת גוף חיובית</h3>
              <img src="https://images.unsplash.com/photo-1559581958-df379578606a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="שפת גוף חיובית" />
              <ul>
                <li>ישיבה זקופה מביעה ביטחון</li>
                <li>חיוך טבעי יוצר אווירה נעימה</li>
                <li>קשר עין מראה עניין והקשבה</li>
                <li>ידיים פתוחות משדרות פתיחות</li>
              </ul>
            </div>

            <div className="pro-tip-card">
              <h3>תשובות STAR</h3>
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="שיטת STAR" />
              <p>שיטת STAR לתשובות מובנות:</p>
              <ul>
                <li><strong>S</strong>ituation - תיאור המצב</li>
                <li><strong>T</strong>ask - המשימה שעמדה בפניכם</li>
                <li><strong>A</strong>ction - הפעולות שנקטתם</li>
                <li><strong>R</strong>esult - התוצאה שהשגתם</li>
              </ul>
            </div>

            <div className="pro-tip-card">
              <h3>שאלות למראיין</h3>
              <img src="https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="שאלות למראיין" />
              <p>שאלות מומלצות לסוף הראיון:</p>
              <ul>
                <li>מה הציפיות לששת החודשים הראשונים?</li>
                <li>איך נראה יום טיפוסי בתפקיד?</li>
                <li>מהם האתגרים העיקריים בתפקיד?</li>
                <li>מה הצעד הבא בתהליך?</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h2>נקודות מפתח לזכירה</h2>
          <div className="key-points">
            <div className="key-point">
              <span className="point-icon">✓</span>
              <p>הכנה מוקדמת היא המפתח להצלחה</p>
            </div>
            <div className="key-point">
              <span className="point-icon">✓</span>
              <p>היו אותנטיים אך מקצועיים</p>
            </div>
            <div className="key-point">
              <span className="point-icon">✓</span>
              <p>הקשיבו בתשומת לב ושאלו שאלות חכמות</p>
            </div>
            <div className="key-point">
              <span className="point-icon">✓</span>
              <p>המשיכו את התהליך גם אחרי הראיון</p>
            </div>
          </div>
        </div>

        <div className="additional-resources">
          <h3>מאמרים נוספים שיעזרו לכם</h3>
          <ul>
            <li>
              <a href="/articles/interview-mistakes">5 טעויות שלא עושים בראיון עבודה</a>
            </li>
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
