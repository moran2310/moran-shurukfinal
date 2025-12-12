import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Container, Form, Row, Col, Spinner } from "react-bootstrap";
import { API_BASE_URL } from "../config";
import "./HomePage.css";
import JobsiteBoxes from "../components/JobsiteBoxes";
import JobsiteInfoBox from "../components/JobsiteInfoBox";
import Navbar from "../components/Navbar";
import LocationSearch from "../components/LocationSearch";

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedLocation] = useState(
    () => localStorage.getItem("selectedLocation") || ""
  );

  const [fields, setFields] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedJobType, setSelectedJobType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistance, setSelectedDistance] = useState("");
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(true);

  const jobCategories = {
    hitech: [
      { title: "מפתח/ת Full Stack", count: 150 },
      { title: "מפתח/ת Frontend", count: 120 },
      { title: "QA Automation", count: 80 },
      { title: "DevOps Engineer", count: 90 },
    ],
    restaurants: [
      { title: "מלצר/ית", count: 200 },
      { title: "ברמן/ית", count: 150 },
      { title: "מנהל/ת צוות", count: 80 },
    ],
    customer_service: [
      { title: "נציג/ת שירות טלפוני", count: 180 },
      { title: "תמיכה טכנית", count: 120 },
      { title: "מנהל/ת צוות שירות", count: 60 },
    ],
    sales_marketing: [
      { title: "איש/ת מכירות שטח", count: 150 },
      { title: "נציג/ת טלמרקטינג", count: 120 },
      { title: "מנהל/ת תיקי לקוחות", count: 80 },
    ],
    finance_accounting: [
      { title: "רואה/ת חשבון", count: 100 },
      { title: "אנליסט/ית פיננסי", count: 80 },
      { title: "מנהל/ת חשבונות", count: 150 },
    ],
    medical_health: [
      { title: "אחות/אח מוסמך/ת", count: 200 },
      { title: "רופא/ה משפחה", count: 80 },
      { title: "פיזיותרפיסט/ית", count: 120 },
    ],
    logistics_operations: [
      { title: "מחסנאי/ת", count: 180 },
      { title: "נהג/ת חלוקה", count: 150 },
      { title: "מנהל/ת לוגיסטיקה", count: 90 },
    ],
  };

  // State declarations moved to top

  // Fetch fields on component mount
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/fields`);
        const fieldsData = await response.json();
        console.log("Fetched fields:", fieldsData);
        setFields(Array.isArray(fieldsData) ? fieldsData : []);
      } catch (error) {
        console.error("Error fetching fields:", error);
        setFields([]);
      } finally {
        setIsLoadingFields(false);
      }
    };

    fetchFields();
  }, []);

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const apiUrl = `${API_BASE_URL}/api/cities`;
        console.log("Attempting to fetch from:", apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const citiesData = await response.json();
        console.log("Fetched cities data:", citiesData);

        // Log the first few cities to verify the data structure
        if (citiesData && citiesData.length > 0) {
          console.log("First city in response:", citiesData[0]);
          console.log("City ID:", citiesData[0].CityID);
          console.log("City Name:", citiesData[0].CityName);
        } else {
          console.warn("No cities data received or empty array");
        }

        setCities(Array.isArray(citiesData) ? citiesData : []);
      } catch (error) {
        console.error("Error fetching cities:", error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          console.error('Failed to connect to the server. Please check if the backend server is running.');
        } else {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  const distances = ['5 ק"מ', '10 ק"מ', '15 ק"מ', '20 ק"מ', '30 ק"מ', '50 ק"מ'];

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
  };

  const handleDistanceChange = (e) => {
    setSelectedDistance(e.target.value);
  };

  const jobTypesList = [
    { id: 1, name: "משרה מלאה" },
    { id: 2, name: "משרה חלקית" },
    { id: 3, name: "עבודה מהבית" },
    { id: 4, name: "סטודנטים" },
  ];

  const [jobTypes] = useState(jobTypesList);

  const handleRoleChange = (e) => {
    const roleId = e.target.value;
    console.log("Selected role ID:", roleId);

    if (!roleId) {
      setSelectedRole(null);
      return;
    }
    console.log("Roles:", roles);
    const selectedRole = roles.find((r) => r.RoleID === parseInt(roleId));

    setSelectedRole(selectedRole);
  };

  const handleFreeSearch = () => {
    if (!searchQuery) {
      alert("נא להקליד טקסט לחיפוש");
      return;
    }

    const params = new URLSearchParams({
      query: searchQuery,
      type: "free",
    });
    navigate(`/search-results?${params.toString()}`);
  };

  const handleSmartSearch = () => {
    console.log("Smart search values:", {
      field: selectedField,
      role: selectedRole,
      jobType: selectedJobType,
      city: selectedCity,
    });

    if (!selectedField || !selectedRole || !selectedCity || !selectedJobType) {
      alert("נא לבחור תחום, תפקיד, סוג משרה ועיר");
      return;
    }

    const params = new URLSearchParams({
      field: selectedField.CategoryID,
      role: selectedRole.RoleName,
      jobType: selectedJobType,
      city: selectedCity,
      type: "smart",
    });

    const searchUrl = `/search-results?${params.toString()}`;
    console.log("Search URL:", searchUrl);

    navigate(searchUrl);
  };

  const handleJobTypeChange = (e) => {
    const typeId = e.target.value;
    console.log("Selected job type ID:", typeId);

    if (!typeId) {
      setSelectedJobType(null);
      return;
    }

    setSelectedJobType(parseInt(typeId));
  };

  const handleFreeSearchClick = () => {
    navigate("/search-results");
  };

  const handleFieldChange = async (e) => {
    const fieldId = e.target.value;
    console.log("Selected field ID:", fieldId);

    if (!fieldId) {
      setSelectedField(null);
      setSelectedRole(null);
      setRoles([]);
      return;
    }

    try {
      setIsLoadingRoles(true);
      const selectedField = fields.find(
        (f) => f.CategoryID === parseInt(fieldId)
      );
      console.log("Found field:", selectedField);
      setSelectedField(selectedField);

      const response = await fetch(
        `${API_BASE_URL}/api/roles/${fieldId}`
      );
      const rolesData = await response.json();
      console.log("Roles data:", rolesData);

      setSelectedRole(null);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  return (
    <div className="homepage">
      <Navbar />
      <div className="search-filters">
        <h1>מצאו את העבודה המושלמת</h1>
        <p>אלפי משרות איכותיות מחכות לכם</p>


        <div className="filters">
          <div className="select-with-icon">
            <i className="fas fa-layer-group icon-left" aria-hidden="true"></i>
            <select
              value={selectedField ? selectedField.CategoryID : ""}
              onChange={handleFieldChange}
              disabled={isLoadingFields}
              aria-label="בחר/י תחום"
            >
              <option value="">
                {isLoadingFields ? "טוען תחומים..." : "בחר/י תחום"}
              </option>
              {!isLoadingFields &&
                fields &&
                fields.length > 0 &&
                fields.map((field) => (
                  <option key={field.CategoryID} value={field.CategoryID}>
                    {field.CategoryName}
                  </option>
                ))}
            </select>
          </div>

          <div className="select-with-icon">
            <i className="fas fa-user-tie icon-left" aria-hidden="true"></i>
            <select
              value={selectedRole ? selectedRole.RoleID : ""}
              onChange={handleRoleChange}
              disabled={!selectedField || isLoadingRoles}
              aria-label="בחר/י תפקיד"
            >
              <option value="">
                {isLoadingRoles ? "טוען תפקידים..." : "בחר/י תפקיד"}
              </option>
              {!isLoadingRoles &&
                roles &&
                roles.length > 0 &&
                roles.map((role) => (
                  <option key={role.RoleID} value={role.RoleID}>
                    {role.RoleName}
                  </option>
                ))}
            </select>
          </div>

          <div className="select-with-icon">
            <i className="fas fa-briefcase icon-left" aria-hidden="true"></i>
            <select
              value={selectedJobType || ""}
              onChange={handleJobTypeChange}
              className="form-select"
              aria-label="בחר סוג משרה"
            >
              <option value="">בחר סוג משרה</option>
              {jobTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="select-with-icon">
            <i className="fas fa-map-marker-alt icon-left" aria-hidden="true"></i>
            <select
              value={selectedCity || ""}
              onChange={handleCityChange}
              disabled={isLoadingCities}
              aria-label="איפה תרצו לעבוד?"
            >
              <option value="">
                {isLoadingCities ? "טוען ערים..." : "איפה תרצו לעבוד?"}
              </option>
              {!isLoadingCities &&
                cities &&
                cities.length > 0 &&
                cities.map((city) => (
                  <option key={city.CityID} value={city.CityID}>
                    {city.CityName}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="search-actions">
          <button
            className="search-button"
            onClick={handleSmartSearch}
            disabled={!selectedField || !selectedRole || !selectedCity}
          >
            <i className="fas fa-search" aria-hidden="true"></i>
            חיפוש חכם
          </button>
        </div>
      </div>

      <div className="company-logos-section">
        <h2>חברות מובילות מגייסות</h2>
        <div className="logos-container">
          <div className="logos-row">
            <img src="/logo/masem.png" alt="רשות המיסים" />
            <img src="/logo/fox.png" alt="קבוצת פוקס" />
            <img src="/logo/altshuler.png" alt="אלטשולר שחם" />
            <img src="/logo/hot.png" alt="HOT" />
            <img src="/logo/freesbe.jpeg" alt="freesbe" />
            <img src="/logo/dutyfree.png" alt="דיוטי פרי" />
            <img src="/logo/cellcom.png" alt="סלקום" />
            <img src="/logo/bezeq.png" alt="בזק" />
            <img src="/logo/max.png" alt="MAX" />
            <img src="/logo/masem.png" alt="רשות המיסים" />
            <img src="/logo/fox.png" alt="קבוצת פוקס" />
            <img src="/logo/altshuler.png" alt="אלטשולר שחם" />
            <img src="/logo/hot.png" alt="HOT" />
            <img src="/logo/freesbe.jpeg" alt="freesbe" />
            <img src="/logo/dutyfree.png" alt="דיוטי פרי" />
            <img src="/logo/cellcom.png" alt="סלקום" />
            <img src="/logo/bezeq.png" alt="בזק" />
            <img src="/logo/max.png" alt="MAX" />
          </div>
        </div>
      </div>

      <div className="help-section">
        <div className="help-grid">
          <Link to="/upgrade-cv" className="help-card">
            <img
              src="/icons/resume.png"
              alt="שדרוג קורות חיים"
              className="help-icon"
            />
            <p>שדרוג קורות חיים</p>
          </Link>
          <div
            className="help-card"
            onClick={() => (window.location.href = "/salary-comparison")}
          >
            <img
              src="/icons/comparison.png"
              alt="השוואת שכר"
              className="help-icon"
            />
            <p>השוואת שכר בשוק</p>
          </div>
          <div
            className="help-card"
            onClick={() => (window.location.href = "/articles/interview-tips")}
          >
            <img
              src="/icons/interview.png"
              alt="ראיון עבודה"
              className="help-icon"
            />
            <p>טיפים לראיון עבודה</p>
          </div>
          <div
            className="help-card"
            onClick={() => (window.location.href = "/personal-guidance")}
          >
            <img
              src="/icons/assistant.png"
              alt="ליווי אישי"
              className="help-icon"
            />
            <p>ליווי בחיפוש עבודה</p>
          </div>
        </div>
      </div>

      <div className="articles-section">
        <div className="articles-grid">
          <article className="article-card">
            <div className="article-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div
              className="article-image"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1573497161529-95eb65b7a2fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80")',
              }}
            ></div>
            <div className="article-content">
              <h3>5 טעויות שלא עושים בראיון עבודה</h3>
              <p>למדו מה לא לעשות בראיון העבודה הבא שלכם</p>
              <a href="/articles/interview-mistakes" className="read-more">
                קרא עוד
              </a>
            </div>
          </article>

          <article className="article-card">
            <div className="article-icon">
              <i className="fas fa-tshirt"></i>
            </div>
            <div
              className="article-image"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80")',
              }}
            ></div>
            <div className="article-content">
              <h3>איך להתלבש לראיון עבודה</h3>
              <p>טיפים והמלצות ללבוש מתאים לראיון עבודה שיעזור לכם להרשים</p>
              <a href="/articles/interview-dress" className="read-more">
                קרא עוד
              </a>
            </div>
          </article>

          <article className="article-card">
            <div className="article-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div
              className="article-image"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80")',
              }}
            ></div>
            <div className="article-content">
              <h3>איך לכתוב קורות חיים מנצחים</h3>
              <p>טיפים מעשיים לכתיבת קורות חיים שיבלטו מעל כולם</p>
              <a href="/articles/cv-writing" className="read-more">
                קרא עוד
              </a>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
