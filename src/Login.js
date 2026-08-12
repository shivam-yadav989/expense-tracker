import React, { useState } from 'react';
import axios from 'axios';

function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
  };

  return (
    <form onSubmit={handleLogin} className="container">
      <h3>Login to Tracker</h3>
      <input type="email" onChange={(e)=>setEmail(e.target.value)} placeholder="Email" />
      <input type="password" onChange={(e)=>setPassword(e.target.value)} placeholder="Password" />
      <button className="btn">Login</button>
    </form>
  );
}
export default Login;