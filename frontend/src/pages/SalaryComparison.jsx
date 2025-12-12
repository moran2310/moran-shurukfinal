import React, { useState, useCallback } from 'react';
import './SalaryComparison.css';

function SalaryComparison() {
  const [formData, setFormData] = useState({
    role: '',
    experience: '',
    location: '',
    industry: '',
    education: ''
  });

  const [salaryResult, setSalaryResult] = useState(null);

  // מידע בסיסי על שכר לפי תחום
  const baseSalaryByIndustry = {
    'הייטק': 18000,
    'פיננסים': 12000,
    'שיווק': 10000,
    'ביוטק': 15000,
    'קמעונאות': 8000
  };

  // מכפילים לפי ניסיון
  const experienceMultiplier = {
    '0-2': 1,
    '3-5': 1.3,
    '6-8': 1.6,
    '9+': 2
  };

  // מכפילים לפי אזור
  const locationMultiplier = {
    'תל אביב': 1.2,
    'ירושלים': 1,
    'חיפה': 0.9,
    'באר שבע': 0.85
  };

  // מכפילים לפי השכלה
  const educationMultiplier = {
    'תיכונית': 0.9,
    'הנדסאי': 1,
    'תואר ראשון': 1.2,
    'תואר שני': 1.4
  };

  const calculateSalary = useCallback(() => {
    const {
      industry,
      experience,
      location,
      education
    } = formData;

    if (!industry || !experience || !location || !education) {
      return null;
    }

    const baseSalary = baseSalaryByIndustry[industry] || 10000;
    const expMult = experienceMultiplier[experience] || 1;
    const locMult = locationMultiplier[location] || 1;
    const eduMult = educationMultiplier[education] || 1;

    const calculatedSalary = baseSalary * expMult * locMult * eduMult;
    
    return {
      gross: Math.round(calculatedSalary),
      net: Math.round(calculatedSalary * 0.75), // הערכה גסה של שכר נטו
      benefits: {
        pension: Math.round(calculatedSalary * 0.065),
        study: Math.round(calculatedSalary * 0.075),
        compensation: Math.round(calculatedSalary * 0.0833)
      },
      range: {
        min: Math.round(calculatedSalary * 0.9),
        max: Math.round(calculatedSalary * 1.1)
      }
    };
  }, [formData, baseSalaryByIndustry, experienceMultiplier, locationMultiplier, educationMultiplier]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = calculateSalary();
    setSalaryResult(result);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div className="salary-comparison-page">
      <header className="salary-header">
        <div className="header-content">
          <h1>השוואת שכר בשוק העבודה</h1>
          <p className="subtitle">גלו כמה באמת מרוויחים בתפקיד שלכם</p>
        </div>
      </header>

      <main className="salary-content">
        <section className="salary-calculator">
          <div className="calculator-container">
            <h2>מחשבון שכר</h2>
            <p>מלאו את הפרטים מטה לקבלת השוואת שכר מדויקת</p>
            
            <form className="salary-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>תפקיד</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="לדוגמה: מפתח/ת Full Stack"
                />
              </div>

              <div className="form-group">
                <label>שנות ניסיון</label>
                <select name="experience" value={formData.experience} onChange={handleInputChange}>
                  <option value="">בחר/י</option>
                  <option value="0-2">0-2 שנים</option>
                  <option value="3-5">3-5 שנים</option>
                  <option value="6-8">6-8 שנים</option>
                  <option value="9+">9+ שנים</option>
                </select>
              </div>

              <div className="form-group">
                <label>אזור</label>
                <select name="location" value={formData.location} onChange={handleInputChange}>
                  <option value="">בחר/י</option>
                  <option value="תל אביב">תל אביב והמרכז</option>
                  <option value="ירושלים">ירושלים והסביבה</option>
                  <option value="חיפה">חיפה והצפון</option>
                  <option value="באר שבע">באר שבע והדרום</option>
                </select>
              </div>

              <div className="form-group">
                <label>תחום</label>
                <select name="industry" value={formData.industry} onChange={handleInputChange}>
                  <option value="">בחר/י</option>
                  <option value="הייטק">הייטק</option>
                  <option value="פיננסים">פיננסים</option>
                  <option value="שיווק">שיווק ופרסום</option>
                  <option value="ביוטק">ביוטק ופארמה</option>
                  <option value="קמעונאות">קמעונאות</option>
                </select>
              </div>

              <div className="form-group">
                <label>השכלה</label>
                <select name="education" value={formData.education} onChange={handleInputChange}>
                  <option value="">בחר/י</option>
                  <option value="תיכונית">תיכונית</option>
                  <option value="הנדסאי">הנדסאי/ת</option>
                  <option value="תואר ראשון">תואר ראשון</option>
                  <option value="תואר שני">תואר שני ומעלה</option>
                </select>
              </div>

              <button type="submit" className="calculate-btn">חשב/י שכר</button>
            </form>

            {salaryResult && (
              <div className="salary-results">
                <h3>תוצאות השוואת השכר</h3>
                <div className="results-grid">
                  <div className="result-card primary">
                    <h4>טווח שכר משוער</h4>
                    <div className="salary-range">
                      <span>{salaryResult.range.min.toLocaleString()}₪</span>
                      <span>-</span>
                      <span>{salaryResult.range.max.toLocaleString()}₪</span>
                    </div>
                    <p className="note">* ברוטו חודשי</p>
                  </div>

                  <div className="result-card">
                    <h4>פירוט שכר חודשי</h4>
                    <div className="salary-details">
                      <div className="detail-item">
                        <span>ברוטו:</span>
                        <span>{salaryResult.gross.toLocaleString()}₪</span>
                      </div>
                      <div className="detail-item">
                        <span>נטו משוער:</span>
                        <span>{salaryResult.net.toLocaleString()}₪</span>
                      </div>
                    </div>
                  </div>

                  <div className="result-card">
                    <h4>הטבות סוציאליות</h4>
                    <div className="benefits-details">
                      <div className="detail-item">
                        <span>הפרשה לפנסיה (6.5%):</span>
                        <span>{salaryResult.benefits.pension.toLocaleString()}₪</span>
                      </div>
                      <div className="detail-item">
                        <span>קרן השתלמות (7.5%):</span>
                        <span>{salaryResult.benefits.study.toLocaleString()}₪</span>
                      </div>
                      <div className="detail-item">
                        <span>פיצויים (8.33%):</span>
                        <span>{salaryResult.benefits.compensation.toLocaleString()}₪</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="salary-info">
          <div className="info-grid">
            <div className="info-card">
              <h3>שכר ברוטו</h3>
              <p>שכר ברוטו הוא השכר הכולל שהמעסיק משלם לעובד, לפני ניכויי חובה כמו מס הכנסה, ביטוח לאומי וביטוח בריאות.</p>
              <div className="example-box">
                <h4>דוגמה:</h4>
                <p>שכר ברוטו: ₪15,000</p>
                <p>ניכויי חובה: ₪3,750</p>
                <p>שכר נטו: ₪11,250</p>
              </div>
            </div>

            <div className="info-card">
              <h3>הפרשות סוציאליות</h3>
              <p>הפרשות סוציאליות כוללות פנסיה, קרן השתלמות ופיצויים. אלו הן הטבות שהמעסיק מחויב או בוחר להפריש עבור העובד.</p>
              <ul className="benefits-list">
                <li>פנסיה: הפרשת מעסיק 6.5% + הפרשת עובד 6%</li>
                <li>קרן השתלמות: הפרשת מעסיק 7.5% + הפרשת עובד 2.5%</li>
                <li>פיצויים: הפרשת מעסיק 8.33%</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>זכויות נוספות</h3>
              <p>מעבר לשכר הבסיסי, עובדים זכאים להטבות נוספות על פי חוק:</p>
              <ul className="rights-list">
                <li>ימי חופשה שנתית</li>
                <li>דמי הבראה</li>
                <li>ימי מחלה</li>
                <li>שעות נוספות</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="salary-trends">
          <h2>מגמות שכר בשוק</h2>
          <div className="trends-container">
            <div className="trend-item">
              <h3>הייטק</h3>
              <p>השכר הממוצע בתחום ההייטק עומד על כ-25,000 ₪ ברוטו, כאשר מפתחי תוכנה בכירים יכולים להרוויח מעל 35,000 ₪.</p>
            </div>
            <div className="trend-item">
              <h3>פיננסים</h3>
              <p>בתחום הפיננסים, השכר הממוצע נע בין 12,000-20,000 ₪, כאשר בעלי ניסיון רב יכולים להגיע ל-30,000 ₪ ומעלה.</p>
            </div>
            <div className="trend-item">
              <h3>שיווק ופרסום</h3>
              <p>מנהלי שיווק מרוויחים בממוצע 15,000-25,000 ₪, כאשר מנהלי מותגים בכירים יכולים להגיע ל-35,000 ₪.</p>
            </div>
          </div>
        </section>

        <section className="salary-tips">
          <h2>טיפים למשא ומתן על שכר</h2>
          <div className="tips-container">
            <div className="tip-card">
              <h3>מחקר מקדים</h3>
              <p>בדקו את טווח השכר המקובל בשוק לתפקיד שלכם</p>
            </div>
            <div className="tip-card">
              <h3>הדגישו ערך</h3>
              <p>הציגו את הניסיון והערך המוסף שאתם מביאים</p>
            </div>
            <div className="tip-card">
              <h3>גמישות</h3>
              <p>שקלו הטבות נוספות מעבר לשכר הבסיסי</p>
            </div>
            <div className="tip-card">
              <h3>תזמון</h3>
              <p>בחרו את העיתוי הנכון לשיחה על העלאה</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SalaryComparison;
