import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from './firebase';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const [transactions, setTransactions] = useState([
    { id: 1, title: 'Project Stipend', amount: 15000, type: 'income', category: 'Salary', date: '2026-08-01' },
    { id: 2, title: 'Laptop Accessories', amount: 2500, type: 'expense', category: 'Shopping', date: '2026-08-05' },
    { id: 3, title: 'Zomato & Dinner', amount: 850, type: 'expense', category: 'Food', date: '2026-08-10' }
  ]);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Mode Toggle Body Sync
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newTx = {
      id: Date.now(),
      title,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toISOString().split('T')[0]
    };

    setTransactions([newTx, ...transactions]);
    setTitle('');
    setAmount('');
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
  };

  const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);
  const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);
  const balance = totalIncome - totalExpense;

  const chartData = {
    labels: ['Total Income (₹)', 'Total Expense (₹)'],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderColor: darkMode ? '#1e293b' : '#ffffff',
        borderWidth: 3,
        hoverOffset: 6
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#f4f4f5' : '#09090b',
          font: { size: 13, weight: '600', family: 'Inter, sans-serif' },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    },
    cutout: '72%'
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || tx.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExportPDF = () => {
    const printContent = `
      <html>
        <head>
          <title>Expense Tracker Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #0284c7; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f4f4f4; }
            .income { color: green; }
            .expense { color: red; }
          </style>
        </head>
        <body>
          <h1>Expense Report - ${user ? user.email : 'User'}</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <h3>Summary</h3>
          <p>Total Balance: ₹${balance}</p>
          <p>Total Income: ₹${totalIncome}</p>
          <p>Total Expenses: ₹${totalExpense}</p>
          <h3>Transaction History</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Category</th><th>Type</th><th>Amount</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(tx => `
                <tr>
                  <td>${tx.title}</td>
                  <td>${tx.category}</td>
                  <td class="${tx.type}">${tx.type.toUpperCase()}</td>
                  <td>₹${tx.amount}</td>
                  <td>${tx.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(printContent);
    win.document.close();
    win.print();
  };

  if (loading) {
    return (
      <div className="app-container" style={{ alignItems: 'center' }}>
        <h3>Loading Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="app-container">
      {!user ? (
        <div className="login-wrapper">
          <div className="login-card">
            <div className="brand-header">
              <div className="icon-badge">💳</div>
              <h2 className="brand-title">Expense Tracker</h2>
              <p className="brand-subtitle">Smart Financial Analytics</p>
            </div>

            {error && <div style={{ color: '#f43f5e', fontSize: '0.8rem', marginBottom: '10px' }}>{error}</div>}

            <form onSubmit={handleEmailAuth} className="form-container">
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input 
                  type="email" 
                  placeholder="test@gmail.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="custom-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="custom-input"
                />
              </div>

              <button type="submit" className="btn-primary">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            <button type="button" onClick={handleGoogleSignIn} className="btn-google">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>

            <p style={{ fontSize: '0.8rem', marginTop: '18px', marginBottom: 0 }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span onClick={() => { setIsSignUp(!isSignUp); setError(''); }} style={{ color: '#38bdf8', fontWeight: '600', cursor: 'pointer' }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className="dashboard-container">
          {/* Header */}
          <header className="dashboard-header">
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Dashboard</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>{user.email}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>

              <button onClick={handleExportPDF} className="pdf-btn">
                📄 Export
              </button>

              <button onClick={() => signOut(auth)} className="logout-btn">Logout</button>
            </div>
          </header>

          {/* Balance Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>Total Balance</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', color: balance >= 0 ? '#10b981' : '#f43f5e' }}>
                ₹{balance.toLocaleString()}
              </h3>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>Total Income</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', color: '#10b981' }}>+₹{totalIncome.toLocaleString()}</h3>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>Total Expenses</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', color: '#f43f5e' }}>-₹{totalExpense.toLocaleString()}</h3>
            </div>
          </div>

          {/* Add Transaction */}
          <div className="dashboard-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>Add New Transaction</h3>
            <form onSubmit={handleAddTransaction} className="form-container">
              <div className="input-group">
                <label className="input-label">Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Internship Stipend, Grocery, Rent" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  className="custom-input" 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  required 
                  className="custom-input" 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="custom-input">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="custom-input">
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Rent">Rent</option>
                    <option value="Salary">Salary</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary">+ Add Transaction</button>
            </form>
          </div>

          {/* Chart Section */}
          <div className="dashboard-card" style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>📊 Financial Breakdown</h3>
            <div style={{ height: '240px', position: 'relative', width: '100%' }}>
              {totalIncome === 0 && totalExpense === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  Add income/expense to see live chart.
                </div>
              ) : (
                <Doughnut data={chartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* History */}
          <div className="dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Transaction History</h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Search title..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="custom-input"
                  style={{ width: '150px', padding: '6px 10px', fontSize: '0.8rem' }}
                />
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="custom-input"
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                >
                  <option value="All">All Categories</option>
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', margin: '20px 0' }}>No transactions found.</p>
            ) : (
              <div className="tx-list">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="tx-item">
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>{tx.title}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{tx.category} • {tx.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ 
                        color: tx.type === 'income' ? '#10b981' : '#f43f5e', 
                        fontWeight: '700',
                        fontSize: '0.95rem'
                      }}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </span>
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)} 
                        className="delete-btn"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default App;