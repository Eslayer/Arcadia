import { useState, useEffect } from 'react'
import Register from './Register'

function App() {
  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [redirectToAdmin, setRedirectToAdmin] = useState(false)

  // Ingesta automática de tokens devueltos por Google / Cognito
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token') || params.get('access_token');
      if (idToken) {
        // Limpiar inmediatamente el texto enorme del hash de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoading(true);
        setSuccess(true);

        let userEmail = "usuario-google@arcadia.com";
        let userNombre = "Usuario Google";
        let userRol = "Cliente";

        try {
          const base64Url = idToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);

          userEmail = payload.email || userEmail;

          // Prioridad: 1. Nickname (apodo), 2. Nombre completo, 3. Nombre de pila, 4. Correo formateado
          if (payload.nickname) {
            userNombre = payload.nickname;
          } else if (payload.preferred_username) {
            userNombre = payload.preferred_username;
          } else if (payload.name && !payload.name.startsWith('Google_')) {
            userNombre = payload.name;
          } else if (payload.given_name) {
            userNombre = payload.given_name + (payload.family_name ? ' ' + payload.family_name : '');
          } else if (userEmail) {
            // Convierte "ed.chacana" -> "Ed Chacana"
            userNombre = userEmail.split('@')[0]
              .replace(/[._]/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          }

          if (payload['cognito:groups'] && payload['cognito:groups'].includes('ADMIN')) {
            userRol = 'Admin';
          }
        } catch (e) {
          console.warn("No se pudo decodificar el payload del token", e);
        }

        const userObj = { id: "cognito-" + Date.now(), nombre: userNombre, email: userEmail, rol: userRol };
        localStorage.setItem('token', idToken);
        localStorage.setItem('user', JSON.stringify(userObj));

        const userParam = encodeURIComponent(JSON.stringify(userObj));
        const clientesUrl = import.meta.env.VITE_CLIENTES_URL || 'http://arcadia-clientes-arcadi.s3-website-us-east-1.amazonaws.com';
        const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://arcadia-admin-arcadi.s3-website-us-east-1.amazonaws.com';

        setTimeout(() => {
          if (userRol.toLowerCase() === 'admin') {
            window.location.href = `${adminUrl}/?token=${idToken}&user=${userParam}`;
          } else {
            window.location.href = `${clientesUrl}/?token=${idToken}&user=${userParam}`;
          }
        }, 1200);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://67mry3gq69.execute-api.us-east-1.amazonaws.com';
      const response = await fetch(`${gatewayUrl}/api/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Credenciales inválidas')
      }

      // Successful login
      const data = await response.json()

      // Validar que si desea entrar al panel de administración, tenga el rol necesario
      if (redirectToAdmin && data.rol?.toLowerCase() !== 'admin') {
        throw new Error('Acceso denegado: Se requieren permisos de administrador para ingresar al panel.')
      }

      setSuccess(true)

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol
      }))

      // Redirigir según la selección
      setTimeout(() => {
        const userParam = encodeURIComponent(JSON.stringify({
          id: data.userId,
          nombre: data.nombre,
          email: data.email,
          rol: data.rol
        }));

        const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://arcadia-admin-arcadi.s3-website-us-east-1.amazonaws.com';
        const clientesUrl = import.meta.env.VITE_CLIENTES_URL || 'http://arcadia-clientes-arcadi.s3-website-us-east-1.amazonaws.com';
        if (redirectToAdmin) {
          window.location.href = `${adminUrl}/?token=${data.token}&user=${userParam}`
        } else {
          window.location.href = `${clientesUrl}/?token=${data.token}&user=${userParam}`
        }
      }, 1000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBypass = () => {
    setSuccess(true)
    const mockToken = redirectToAdmin ? "mock-admin-token-bypass" : "mock-cliente-token-bypass";
    const mockUser = encodeURIComponent(JSON.stringify({
      id: "u-mock-bypass",
      nombre: redirectToAdmin ? "Administrador Demo (Bypass)" : "Cliente Demo (Bypass)",
      email: redirectToAdmin ? "admin-bypass@arcadia.com" : "cliente-bypass@arcadia.com",
      rol: redirectToAdmin ? "Admin" : "Cliente"
    }));

    setTimeout(() => {
      const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://arcadia-admin-arcadi.s3-website-us-east-1.amazonaws.com';
      const clientesUrl = import.meta.env.VITE_CLIENTES_URL || 'http://arcadia-clientes-arcadi.s3-website-us-east-1.amazonaws.com';
      if (redirectToAdmin) {
        window.location.href = `${adminUrl}/?token=${mockToken}&user=${mockUser}`;
      } else {
        window.location.href = `${clientesUrl}/?token=${mockToken}&user=${mockUser}`;
      }
    }, 1500)
  }

  if (showRegister) {
    return <Register onBack={() => setShowRegister(false)} />
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="glass-card success-message">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2>{redirectToAdmin ? 'Bienvenido al Panel Admin' : 'Inicio de sesión exitoso'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
            {redirectToAdmin ? 'Conectando al dashboard...' : 'Redirigiendo a la tienda...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <button
        onClick={() => window.history.back()}
        className="back-button"
        title="Volver atrás"
      >
        ← Volver
      </button>
      <div className="glass-card">
        <div className="login-header">
          <h1>Arcadia Admin</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@arcadia.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              type="checkbox"
              id="redirectToAdmin"
              checked={redirectToAdmin}
              onChange={(e) => setRedirectToAdmin(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="redirectToAdmin" style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ingresar al Panel de Administración
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="loader"></span> : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted, #94a3b8)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}></div>
          <span style={{ padding: '0 0.75rem', fontSize: '0.85rem' }}>o continuar con</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}></div>
        </div>

        <button
          type="button"
          onClick={() => {
            // identity_provider=Google + prompt=select_account obliga a Google a mostrar el selector de cuentas
            window.location.href = "https://us-east-1thhosouds.auth.us-east-1.amazoncognito.com/oauth2/authorize?identity_provider=Google&response_type=token&client_id=199b3ebi5sd9sdkaotqai33h64&redirect_uri=https://arcadia-login-arcadi.s3.us-east-1.amazonaws.com/index.html&scope=openid+email+profile&prompt=select_account";
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Iniciar sesión con Google
        </button>

        <button
          onClick={handleBypass}
          className="btn-secondary"
          title="Usa este botón en tu presentación si no tienes usuarios en la DB"
        >
          Bypass Login (Modo Presentación)
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ¿No tienes cuenta?
          </span>
          <button
            onClick={() => setShowRegister(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            Regístrate
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
