import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider 
} from './firebase';
import { 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Page load hote hi Auth State & Redirect Result handling
  useEffect(() => {
    // Check if user is returning from Google Redirect Login
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User successfully signed in via redirect
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect Login Error:", error);
        setErrorMsg("Authentication failed. Please try again.");
      });

    // Listen for Auth changes (Login/Logout)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In Handler (Redirect Method)
  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Sign In Error:", error);
      setErrorMsg("Authentication failed. Please try again.");
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="dark-theme" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
        <h2>Loading Expense Tracker...</h2>
      </div>
    );
  }

  return (
    <div className="dark-theme">
      {!user ? (
        // --- LOGIN SCREEN ---
        <div className="div-auth-wrapper">
          <div className="auth-card">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '40px' }}>💸</span>
              <h2>Expense Tracker</h2>
              <p style={{ color: '#8a94a6', fontSize: '14px' }}>Smart Personal Finance Platform</p>
            </div>

            {errorMsg && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                border: '1px solid #ef4444', 
                color: '#f87171', 
                padding: '10px', 
                borderRadius: '6px', 
                marginBottom: '15px',
                fontSize: '14px',
                textAlign: 'center' 
              }}>
                {errorMsg}
              </div>
            )}

            <button 
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
              Continue with Google
            </button>
          </div>
        </div>
      ) : (
        // --- MAIN DASHBOARD SCREEN ---
        <div style={{ padding: '20px', color: '#fff' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Welcome, {user.displayName || 'User'}! 👋</h2>
            <button 
              onClick={handleSignOut}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </header>

          <main style={{ marginTop: '30px' }}>
            <h3>Your Expense Tracker Dashboard</h3>
            {/* Aapka baaki ka Expenses/Analytics Code yahan aayega */}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;