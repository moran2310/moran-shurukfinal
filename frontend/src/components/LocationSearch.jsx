import React, { useState } from 'react';
import './LocationSearch.css';

const cities = [
  // ערים גדולות
  'ירושלים', 'תל אביב-יפו', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה',
  'באר שבע', 'בני ברק', 'חולון', 'רמת גן', 'אשקלון', 'רחובות', 'בת ים', 'בית שמש',
  'כפר סבא', 'הרצליה', 'חדרה', 'מודיעין-מכבים-רעות', 'לוד', 'נס ציונה', 'רמלה', 'רעננה',
  'רהט', 'הוד השרון', 'קריית גת', 'נצרת', 'גבעתיים', 'ראש העין', 'קריית אונו',
  
  // ערים בינוניות וקטנות
  'אום אל-פחם', 'אופקים', 'אור יהודה', 'אור עקיבא', 'אילת', 'אלעד', 'אריאל',
  'באקה אל-גרביה', 'דימונה', 'טבריה', 'טייבה', 'טירה', 'טירת כרמל', 'טמרה',
  'יבנה', 'יהוד-מונוסון', 'יקנעם עילית', 'כרמיאל', 'מגדל העמק', 'מעלה אדומים',
  'מעלות-תרשיחא', 'נהריה', 'נשר', 'נתיבות', 'סחנין', 'עכו', 'עפולה', 'ערד',
  'צפת', 'קלנסווה', 'קריית אתא', 'קריית ביאליק', 'קריית ים', 'קריית מוצקין',
  'קריית מלאכי', 'קריית שמונה', 'ראש העין', 'רמת השרון', 'שדרות', 'שפרעם',

  // מועצות מקומיות
  'אבן יהודה', 'אזור', 'אפרת', 'באר יעקב', 'בית גן', 'בית שאן', 'בנימינה-גבעת עדה',
  'גבעת זאב', 'גדרה', 'גן יבנה', 'גני תקווה', 'דאלית אל-כרמל', 'זכרון יעקב',
  'חצור הגלילית', 'טורעאן', 'יבנאל', 'ירוחם', 'כפר יונה', 'כפר כנא', 'כפר מנדא',
  'כפר קאסם', 'כפר קרע', 'להבים', 'מבשרת ציון', 'מגדל', 'מזכרת בתיה', 'מעלה עירון',
  'מצפה רמון', 'עומר', 'עספיא', 'ערערה', 'פרדס חנה-כרכור', 'פרדסיה', 'קדימה-צורן',
  'קריית טבעון', 'קריית עקרון', 'קרני שומרון', 'ראמה', 'רכסים', 'רמת ישי', 'שוהם',
  'תל מונד', 'תל שבע',

  // קיבוצים מרכזיים
  'אפיקים', 'אשדות יעקב', 'בית אלפא', 'גבעת ברנר', 'גן שמואל', 'דגניה א', 'דגניה ב',
  'יגור', 'יד מרדכי', 'כפר בלום', 'כפר גלעדי', 'להבות חביבה', 'מעגן מיכאל', 'מרחביה',
  'נאות מרדכי', 'נגבה', 'ניר דוד', 'עין גב', 'עין חרוד', 'רמת רחל', 'שדה בוקר', 'שפיים',

  // כפרים וישובים קהילתיים
  'אבו גוש', 'אורנית', 'אלון שבות', 'אלקנה', 'בית אריה', 'גבע בנימין', 'הר אדר',
  'זמר', 'חריש', 'טלמון', 'יקיר', 'כוכב יאיר', 'כפר אדומים', 'כפר ברא', 'כפר ורדים',
  'כפר תבור', 'מיתר', 'סביון', 'עילבון', 'עין קנייא', 'צור הדסה', 'קיסריה', 'ראש פינה',
  'רמת אפעל', 'שערי תקווה'
];

const LocationSearch = ({ isOpen, onClose, onSelect }) => {
  const [selectedCity, setSelectedCity] = useState('');
  const [travelTime, setTravelTime] = useState(30);
  const [workType, setWorkType] = useState('');
  const [showCities, setShowCities] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCities = cities.filter(city =>
    city.replace(/["-]/g, '').indexOf(searchTerm.replace(/["-]/g, '')) !== -1 || searchTerm === ''
  ).sort((a, b) => a.localeCompare(b, 'he'));


  if (!isOpen) return null;

  return (
    <div className="location-search">
      <div className="search-section">
        <h2 className="section-title">היישוב שלך</h2>
        <div className="city-search">
          <div className="input-wrapper">
            <input
              type="text"
              className="city-input"
              value={selectedCity || searchTerm}
              dir="rtl"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCity('');
                setShowCities(true);
              }}
              onClick={() => setShowCities(true)}
              placeholder="חיפוש יישוב"
            />
            {showCities && (
              <div className="cities-dropdown">
                {filteredCities.map((city, index) => (
                  <div
                    key={index}
                    className="city-option"
                    onClick={() => {
                      setSelectedCity(city);
                      setShowCities(false);
                      setSearchTerm('');
                    }}
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <h3 className="time-title">כמה דקות נסיעה לעבודה?</h3>
        <div className="travel-time">
          <input
            type="range"
            min="0"
            max="50"
            value={travelTime}
            onChange={(e) => setTravelTime(e.target.value)}
            className="time-slider"
          />
          <div className="time-labels">
            <span>0</span>
            <span>10</span>
            <span>20</span>
            <span>30</span>
            <span>40</span>
            <span>50</span>
          </div>
          <div className="current-time">
            {travelTime} דקות
          </div>
          <button 
            className="confirm-button" 
            onClick={() => {
              if (selectedCity) {
                onSelect(selectedCity, `${travelTime}`);
                onClose();
              }
            }}
          >
            אישור
          </button>
        </div>

        <h3 className="options-title">אפשרויות עבודה נוספות</h3>
        <div className="work-type">
          <label>
            <input
              type="checkbox"
              checked={workType === 'remote'}
              onChange={() => setWorkType(workType === 'remote' ? '' : 'remote')}
            />
            עבודה היברידית
          </label>
        </div>
      </div>
    </div>
  );
};

export default LocationSearch;
