import React, { useState, useEffect } from 'react';
import './App.css';

// Firebase Imports
import { auth, db, googleProvider } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';

// Chart & PDF Imports
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');

  // Transaction States
  const [transactions, setTransactions] = useState([]);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Realtime Listener
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, "transactions"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Dark Mode
  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }, [isDarkMode]);

  // Clean Error Formatting
  const formatAuthError = (errCode) => {
    switch (errCode) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Incorrect email or password. Click "Sign Up" below if you do not have an account.';
      case 'auth/email-already-in-use':
        return 'Email already registered. Please Sign In instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address (e.g. name@gmail.com).';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Google Sign-In popup close ho gaya tha.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  // Email/Password Auth
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(formatAuthError(err.code));
    }
  };

  // Google Sign-In Handler (Using Popup)
  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setAuthError(formatAuthError(err.code));
    }
  };

  const handleLogout = () => signOut(auth);

  // Voice Input
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser voice input support nahi karta!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => setText(event.results[0][0].transcript);
    recognition.start();
  };

  // Add Transaction
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text || !amount) return;

    const fullText = category === 'Other' ? text : `${category}: ${text}`;

    await addDoc(collection(db, "transactions"), {
      userId: user.uid,
      text: fullText,
      amount: +amount,
      createdAt: new Date().toISOString()
    });

    setText('');
    setAmount('');
  };

  // Delete Transaction
  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, "transactions", id));
  };

  // Export PDF
  const downloadPDF = () => {
    const docPdf = new jsPDF();
    docPdf.text('Expense Report', 14, 20);
    const tableRows = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.text,
      t.amount < 0 ? 'Expense' : 'Income',
      `RS ${t.amount}`
    ]);
    autoTable(docPdf, { head: [['Date', 'Description', 'Type', 'Amount']], body: tableRows, startY: 30 });
    docPdf.save('Expense_Report.pdf');
  };

  // Filters & Calculations
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.text.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'All') return true;
    const tDate = new Date(t.createdAt || Date.now());
    const today = new Date();
    if (filter === 'Today') return tDate.toDateString() === today.toDateString();
    if (filter === 'Weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      return tDate >= sevenDaysAgo;
    }
    return true;
  });

  const income = filteredTransactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0).toFixed(2);
  const expense = filteredTransactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0).toFixed(2);
  const total = (income - expense).toFixed(2);

  const categoryTotals = filteredTransactions.reduce((acc, t) => {
    const cat = t.text.includes(':') ? t.text.split(':')[0].trim() : 'Other';
    const amt = Math.abs(t.amount);
    if (!acc[cat]) { acc[cat] = 0; }
    acc[cat] += amt;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#2ecc71'],
      borderWidth: 2,
    }]
  };

  if (loading) return <div style={{color:'#fff', textAlign:'center', marginTop:'50px'}}>Loading Expense Tracker...</div>;

  // Modern Auth Screen
  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <span className="app-logo">💸</span>
            <h2>Expense Tracker</h2>
            <p>Smart Personal Finance Platform</p>
          </div>

          {authError && <div className="error-box">{authError}</div>}

          <form onSubmit={handleAuth} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="submit-btn">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="google-btn" onClick={handleGoogleSignIn}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Logged In Dashboard
  return (
    <div className="container">
      <div className="header-flex">
        <h2>📊 Expense Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button className="theme-btn" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? '☀️ Day' : '🌙 Night'}</button>
           <button onClick={downloadPDF} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>📥 PDF</button>
           <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div className="card text-center">
        <h1 style={{fontSize:'42px', margin:'0'}}>₹{total}</h1>
        <div className="inc-exp-container">
          <div>
            <h4 style={{ margin: 0, color: '#22c55e' }}>INCOME</h4>
            <p style={{ margin: 0, fontSize: '18px' }}>+₹{income}</p>
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#ef4444' }}>EXPENSE</h4>
            <p style={{ margin: 0, fontSize: '18px' }}>-₹{expense}</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {['All', 'Today', 'Weekly'].map(type => (
            <button key={type} onClick={() => setFilter(type)} className={filter === type ? 'filter-btn active' : 'filter-btn'}>{type}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Add New Transaction</h3>
        <form onSubmit={onSubmit} style={{marginTop: '15px'}}>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Food">🍔 Food</option>
            <option value="Rent">🏠 Rent</option>
            <option value="Salary">💰 Salary</option>
            <option value="Other">✨ Other</option>
          </select>
          <div style={{ position: 'relative' }}>
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="What was it for?" required />
            <button type="button" onClick={startListening} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>🎤</button>
          </div>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (e.g. -500 for expense, 1000 for income)" required />
          <button className="btn">Add Transaction</button>
        </form>
      </div>

      <div className="card" style={{textAlign: 'center'}}>
        <h3>Category Breakdown</h3>
        <div style={{ width: '280px', margin: '20px auto' }}>
          {filteredTransactions.length > 0 ? <Pie data={chartData} /> : <p style={{color: '#888', marginTop: '10px'}}>No data for chart</p>}
        </div>
      </div>

      <div className="card">
        <h3>History</h3>
        <input 
          type="text" 
          placeholder="🔍 Search history..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginTop: '15px' }}
        />

        <ul className="list">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(t => (
              <li key={t.id} className={t.amount < 0 ? 'minus' : 'plus'}>
                <span>{t.text}</span>
                <div>
                  <span style={{marginRight: '15px', fontWeight: 'bold'}}>₹{t.amount}</span>
                  <button onClick={() => deleteTransaction(t.id)} className="delete-btn">x</button>
                </div>
              </li>
            ))
          ) : (
            <p style={{textAlign: 'center', color: '#888', marginTop: '20px'}}>No transactions found</p>
          )}
        </ul>
      </div>

    </div>
  );
}

export default App;