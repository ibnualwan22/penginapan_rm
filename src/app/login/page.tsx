'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false, // Kita tangani redirect manual
        username,
        password,
      });

      if (result?.error) {
        setError('Username atau password salah!'); // Pesan error jika login gagal
      } else if (result?.ok) {
        router.push('/admin'); // Arahkan ke dashboard admin jika berhasil
      }
    } catch (error) {
      setError('Terjadi kesalahan. Coba lagi.');
    }
  };

  return (
    <div className={styles.body}>
        <div className={styles.slideshow}>
    <div className={styles.slide} style={{ backgroundImage: "url('/images/bg1.jpg')" }} />
    <div className={styles.slide} style={{ backgroundImage: "url('/images/bg2.jpg')" }} />
    <div className={styles.slide} style={{ backgroundImage: "url('/images/bg3.jpg')" }} />
  </div>
      <div className={styles.loginContainer}>
        <h2>Selamat Datang</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}