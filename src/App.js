import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in user:", result.user);
    } catch (error) {
      console.error("Firebase Auth Error:", error);
      // Screen par aur Alert me exact error dikhayega
      const message = error.code ? `${error.code}: ${error.message}` : error.message;
      setErrorMsg(message);
      alert(`Login Error Detail:\n${message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', backgroundColor: '#0f172a' }}>
        <h2>Loading Expense Tracker...</h2>
      </div>
    );
  }

  return (
    <div className="dark-theme" style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {!user ? (
        <div className="div-auth-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="auth-card" style={{ padding: '30px', backgroundColor: '#1e293b', borderRadius: '12px', width: '350px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '40px' }}>💸</span>
              <h2 style={{ color: '#fff', margin: '10px 0 5px' }}>Expense Tracker</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Smart Personal Finance Platform</p>
            </div>

            {errorMsg && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                border: '1px solid #ef4444', 
                color: '#f87171', 
                padding: '10px', 
                borderRadius: '6px', 
                marginBottom: '15px',
                fontSize: '13px',
                wordBreak: 'break-word',
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
                gap: '10px',
                marginTop: '10px'
              }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
              Continue with Google
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', color: '#fff' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
            <h2>Welcome, {user.displayName || 'User'}! 👋</h2>
            <button 
              onClick={handleSignOut}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Sign Out
            </button>
          </header>

          <main style={{ marginTop: '30px', textAlign: 'center' }}>
            <h3>🎉 Successful Login! Your Dashboard is ready.</h3>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;