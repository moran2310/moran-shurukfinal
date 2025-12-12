import React, { useEffect, useState } from 'react';
import './UpgradeCV.css';

const testimonials = [
  "השירות היה מדהים! ממליץ בחום!",
  "קיבלתי עבודה תוך שבוע בזכותכם!",
  "הם עזרו לי לנסח קורות חיים מקצועיים ברמה הגבוהה ביותר!",
  "לא האמנתי כמה קל זה יכול להיות עם הליווי שלהם."
];

function UpgradeCV() {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("📝 פרטי לקוח:", formData);
    alert("הפרטים נשלחו בהצלחה!");
  };

  return (
    <div className="upgrade-page">
      <section className="hero-section">
        <h1>שדרגו את קורות החיים שלכם</h1>
        <p>השירות המקצועי שיעזור לכם להתקדם בקריירה</p>
        <div className="features">
          <div>
            <img src="/icons/lead.png" alt="icon" />
            <h3>להוביל את השוק</h3>
            <p>נעזור לכם להפוך למובילים בתחום שלכם</p>
          </div>
          <div>
            <img src="/icons/shine.png" alt="icon" />
            <h3>לבלוט מעל כולם</h3>
            <p>נבליט את היתרונות הייחודיים שלכם</p>
          </div>
          <div>
            <img src="/icons/advance.png" alt="icon" />
            <h3>להתקדם בקריירה</h3>
            <p>נפתח יחד את הצעד הבא בקריירה שלכם</p>
          </div>
        </div>
      </section>

      <section className="orange-steps-section">
        <h2>איך זה עובד?</h2>
        <div className="steps-inline">
          <div className="step">
            <img src="/icons/user.png" alt="step" />
            <p>נכיר אותך ואת הצרכים שלך</p>
          </div>
          <div className="step">
            <img src="/icons/write.png" alt="step" />
            <p>נכתוב קורות חיים מנצחים</p>
          </div>
          <div className="step">
            <img src="/icons/guide.png" alt="step" />
            <p>נדריך אותך איך להציג את עצמך</p>
          </div>
          <div className="step">
            <img src="/icons/check.png" alt="step" />
            <p>נצא לדרך חדשה ומקצועית</p>
          </div>
        </div>
      </section>

      <section className="blue-section">
        <h2>מה אומרים הלקוחות שלנו?</h2>
        <p className="testimonial">{testimonials[testimonialIndex]}</p>
      </section>

      <footer className="contact-footer">
        <h3>רוצה עזרה עם קורות החיים? אנחנו כאן, נשמח לשוחח</h3>
        <div className="form-fields">
          <input
            type="text"
            name="name"
            placeholder="השם שלך"
            value={formData.name}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="האימייל שלך"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="tel"
            name="phone"
            placeholder="הטלפון שלך"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <button className="contact-btn" onClick={handleSubmit}>דברו איתי</button>
      </footer>
    </div>
  );
}

export default UpgradeCV;