import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [formData, setFormData] = useState({});
  const [finalGrade, setFinalGrade] = useState(null);
  const [currentGrade, setCurrentGrade] = useState(0);
  const [filledCoeffs, setFilledCoeffs] = useState(0);
  const [totalCoeffs, setTotalCoeffs] = useState(0);
  const [requiredAverage, setRequiredAverage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const coeffs = {
    'premiere_anglais': 3,
    'premiere_espagnol': 3,
    'premiere_enseignement_scientifique': 3,
    'premiere_histoire_geo': 3,
    'premiere_emc': 1,
    'premiere_llce': 8,
    'francais_ecrit': 5,
    'francais_oral': 5,
    'terminale_anglais': 3,
    'terminale_espagnol': 3,
    'terminale_enseignement_scientifique': 3,
    'terminale_histoire_geo': 3,
    'terminale_emc': 1,
    'terminale_eps': 6,
    'philosophie': 8,
    'maths': 16,
    'physique_chimie': 16,
    'grand_oral': 10
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchFormData(token);
    } else {
      const localFormData = localStorage.getItem('formData');
      if (localFormData) {
        setFormData(JSON.parse(localFormData));
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      saveFormData();
    } else {
      localStorage.setItem('formData', JSON.stringify(formData));
    }
    
    const newGrade = calculateCurrentGrade();
    setCurrentGrade(newGrade);
    updateGradeIndicator(newGrade);
    const newRequiredAverage = calculateRequiredAverage(newGrade);
    setRequiredAverage(newRequiredAverage);
  }, [formData]);

  const fetchFormData = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/formData', {
        headers: { Authorization: token }
      });
      setFormData(response.data.formData);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const saveFormData = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/save', { formData }, {
        headers: { Authorization: token }
      });
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const handleLoginClick = () => {
    setShowLoginForm(!showLoginForm);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setShowLoginForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value === '' ? '' : parseFloat(value)
    }));
  };

  const calculateAverage = (values) => {
    const validValues = values.filter(value => value !== undefined && value !== null && value !== '' && !isNaN(value));
    return validValues.length > 0 ? parseFloat((validValues.reduce((sum, value) => sum + parseFloat(value), 0) / validValues.length).toFixed(2)) : null;
  };

  const calculateCurrentGrade = () => {
    let totalPoints = 0;
    let filledCoeffs = 0;
    let totalCoeffs = 0;

    for (const [subject, coeff] of Object.entries(coeffs)) {
      let grade;
      if (subject.startsWith('premiere_') || subject.startsWith('terminale_')) {
        const trimesterGrades = [formData[`${subject}_t1`], formData[`${subject}_t2`], formData[`${subject}_t3`]];
        grade = calculateAverage(trimesterGrades);
      } else {
        grade = formData[subject] !== '' ? formData[subject] : null;
      }

      if (grade !== null && !isNaN(grade)) {
        totalPoints += grade * coeff;
        filledCoeffs += coeff;
      }
      totalCoeffs += coeff;
    }

    setFilledCoeffs(filledCoeffs);
    setTotalCoeffs(totalCoeffs);

    return filledCoeffs > 0 ? totalPoints / filledCoeffs : 0;
  };

  const calculateRequiredAverage = (currentGrade) => {
    const remainingCoeffs = totalCoeffs - filledCoeffs;
    if (remainingCoeffs === 0) return null;

    const pointsNeeded = 16 * totalCoeffs - currentGrade * filledCoeffs;
    return parseFloat((pointsNeeded / remainingCoeffs).toFixed(2));
  };

  const handleCalculate = () => {
    const finalGrade = calculateCurrentGrade();
    setFinalGrade(finalGrade.toFixed(2));
  };

  const updateGradeIndicator = (grade) => {
    const indicator = document.getElementById('grade-indicator');
    if (indicator) {
      indicator.style.left = `${(grade / 20) * 100}%`;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Calculateur de Note du BAC</h1>
        <button onClick={isLoggedIn ? handleLogout : handleLoginClick}>
          {isLoggedIn ? 'Logout' : 'Login'}
        </button>
      </header>
      <main className="app-main">
        {showLoginForm && !isLoggedIn && (
          <LoginForm setIsLoggedIn={setIsLoggedIn} setShowLoginForm={setShowLoginForm} setFormData={setFormData} />
        )}
        <div className="grades-container">
          <div className="grades-column">
            <h2 className="column-title">Première</h2>
            {['anglais', 'espagnol', 'enseignement_scientifique', 'histoire_geo', 'emc', 'llce'].map((subject) => (
              <SubjectCard key={subject} subject={`premiere_${subject}`} coeff={coeffs[`premiere_${subject}`]} formData={formData} handleChange={handleChange} calculateAverage={calculateAverage} />
            ))}
            <h3 className="column-subtitle">Épreuves de Première</h3>
            <SubjectCard subject="francais_ecrit" coeff={coeffs.francais_ecrit} formData={formData} handleChange={handleChange} isFinal={true} />
            <SubjectCard subject="francais_oral" coeff={coeffs.francais_oral} formData={formData} handleChange={handleChange} isFinal={true} />
          </div>
          <div className="grades-column">
            <h2 className="column-title">Terminale</h2>
            {['anglais', 'espagnol', 'enseignement_scientifique', 'histoire_geo', 'emc', 'eps'].map((subject) => (
              <SubjectCard key={subject} subject={`terminale_${subject}`} coeff={coeffs[`terminale_${subject}`]} formData={formData} handleChange={handleChange} calculateAverage={calculateAverage} />
            ))}
            <h3 className="column-subtitle">Épreuves de Terminale</h3>
            {['philosophie', 'maths', 'physique_chimie', 'grand_oral'].map((subject) => (
              <SubjectCard key={subject} subject={subject} coeff={coeffs[subject]} formData={formData} handleChange={handleChange} isFinal={true} />
            ))}
          </div>
        </div>
        <button onClick={handleCalculate} className="calculate-button">Calculer la note finale</button>
        <div className="results-container">
          <div className="results-card">
            <h2 className="results-title">Résultats</h2>
            {finalGrade !== null && (
              <div className="final-grade">
                <span className="label">Note Finale:</span>
                <span className="value">{finalGrade}</span>
              </div>
            )}
            <div className="grade-scale-container">
              <div className="grade-scale">
                <div className="grade-marker" style={{ left: '50%' }}><span className="grade-label">BAC</span></div>
                <div className="grade-marker" style={{ left: '60%' }}><span className="grade-label">AB</span></div>
                <div className="grade-marker" style={{ left: '70%' }}><span className="grade-label">B</span></div>
                <div className="grade-marker" style={{ left: '80%' }}><span className="grade-label">TB</span></div>
                <div className="grade-marker" style={{ left: '90%' }}><span className="grade-label">F</span></div>
                <div id="grade-indicator"></div>
              </div>
            </div>
            <div className="coeffs-info">
              <div className="coeffs-text">Coefficients remplis: {filledCoeffs}/{totalCoeffs}</div>
              <div className="coeffs-diagram">
                <div className="filled-coeffs" style={{width: `${(filledCoeffs / totalCoeffs) * 100}%`}}></div>
              </div>
            </div>
            {requiredAverage !== null && (
              <div className="required-average">
                <span className="label">Moyenne nécessaire pour la mention Très Bien:</span>
                <span className="value">{requiredAverage}/20</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function LoginForm({ setIsLoggedIn, setShowLoginForm, setFormData }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', { username, password });
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      setFormData(response.data.formData);
      setShowLoginForm(false);
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/register', { username, password });
      alert('User registered successfully. Please log in.');
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="login-form">
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

function SubjectCard({ subject, coeff, formData, handleChange, isFinal = false, calculateAverage }) {
  const getAverage = () => {
    if (isFinal) {
      return formData[subject] !== '' ? formData[subject] : '-';
    } else {
      const trimesterGrades = [formData[`${subject}_t1`], formData[`${subject}_t2`], formData[`${subject}_t3`]];
      const average = calculateAverage(trimesterGrades);
      return average !== null ? average : '-';
    }
  };

  const average = getAverage();

  return (
    <div className="subject-card">
      <h3 className="subject-title">{subject.replace(/_/g, ' ').replace(/premiere |terminale /, '').toUpperCase()}</h3>
      {!isFinal && (
        <div className="trimester-inputs">
          <input
            type="number"
            name={`${subject}_t1`}
            placeholder="T1"
            value={formData[`${subject}_t1`] || ''}
            onChange={handleChange}
            className="trimester-input"
          />
          <input
            type="number"
            name={`${subject}_t2`}
            placeholder="T2"
            value={formData[`${subject}_t2`] || ''}
            onChange={handleChange}
            className="trimester-input"
          />
          <input
            type="number"
            name={`${subject}_t3`}
            placeholder="T3"
            value={formData[`${subject}_t3`] || ''}
            onChange={handleChange}
            className="trimester-input"
          />
        </div>
      )}
      {isFinal && (
        <input
          type="number"
          name={subject}
          placeholder="Note"
          value={formData[subject] || ''}
          onChange={handleChange}
          className="final-input"
        />
      )}
      <div className="info-row">
        <span className="average">Moyenne: {typeof average === 'number' ? average.toFixed(2) : average}</span>
        <span className="coefficient">Coefficient: {coeff}</span>
      </div>
    </div>
  );
}

export default App;