import React from 'react';
import './PersonalGuidance.css';

function PersonalGuidance() {
  return (
    <div className="personal-guidance-page">
      <header className="guidance-header">
        <div className="header-content">
          <h1>ליווי אישי בחיפוש עבודה</h1>
          <p className="subtitle">אנחנו כאן בשבילך בכל צעד בדרך למשרה הבאה שלך</p>
        </div>
      </header>

      <main className="guidance-content">
        <section className="guidance-intro">
          <div className="intro-text">
            <h2>למה ליווי אישי?</h2>
            <p>חיפוש עבודה יכול להיות תהליך מאתגר ומורכב. אנחנו מאמינים שעם הכוונה נכונה וליווי מקצועי, נוכל לעזור לך להשיג את המשרה המושלמת עבורך.</p>
          </div>
          <div className="intro-image">
            <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="פגישת ייעוץ" />
          </div>
        </section>

        <section className="our-services">
          <h2>איך אנחנו יכולים לעזור?</h2>
          <div className="services-grid">
            <div className="service-card">
              <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="בניית קורות חיים" />
              <h3>בניית קורות חיים מנצחים</h3>
              <p>נעזור לך ליצור קורות חיים שיבלטו ויציגו את הכישורים והניסיון שלך בצורה הטובה ביותר</p>
            </div>
            
            <div className="service-card">
              <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="אסטרטגיית חיפוש" />
              <h3>אסטרטגיית חיפוש עבודה</h3>
              <p>נבנה יחד תכנית פעולה מותאמת אישית שתעזור לך למקסם את סיכויי ההצלחה שלך</p>
            </div>

            <div className="service-card">
              <img src="https://images.unsplash.com/photo-1557425955-df376b5903c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="הכנה לראיונות" />
              <h3>הכנה לראיונות עבודה</h3>
              <p>נתרגל יחד ראיונות עבודה ונעבוד על התשובות והמסרים שיעזרו לך להרשים את המראיינים</p>
            </div>
          </div>
        </section>

        <section className="commitment">
          <div className="commitment-content">
            <h2>ההתחייבות שלנו</h2>
            <p>אנחנו מתחייבים ללוות אותך לאורך כל הדרך, עד שתמצא את העבודה המתאימה לך. הליווי שלנו כולל:</p>
            <ul>
              <li>פגישות אישיות שבועיות</li>
              <li>זמינות מלאה בווטסאפ לשאלות והתייעצויות</li>
              <li>עדכון שוטף על משרות רלוונטיות</li>
              <li>משוב והכוונה לאחר כל ראיון</li>
              <li>תמיכה מקצועית ואישית לאורך כל התהליך</li>
            </ul>
          </div>
          <div className="commitment-image">
            <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="ליווי מקצועי" />
          </div>
        </section>

        <section className="contact-section">
          <h2>מוכנים להתחיל?</h2>
          <p>השאירו פרטים ונחזור אליכם בהקדם</p>
          <form className="contact-form">
            <input type="text" placeholder="שם מלא" required />
            <input type="tel" placeholder="טלפון" required />
            <input type="email" placeholder="אימייל" required />
            <textarea placeholder="ספרו לנו קצת על עצמכם ומה אתם מחפשים"></textarea>
            <button type="submit" className="submit-btn">שליחה</button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default PersonalGuidance;
