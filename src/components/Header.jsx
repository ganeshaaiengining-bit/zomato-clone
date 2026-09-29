import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useData } from '../context/DataContext'
import './Header.css'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/search', label: 'Restaurants' },
  { to: '/orders', label: 'My Orders' },
]

export default function Header () {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin, signOut } = useAuth()
  const { count } = useCart()
  const { isDemo } = useData()

  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // /search?query= ke saath input sync — render ke dauraan adjust (React recommended pattern)
  const urlQuery = new URLSearchParams(location.search).get('query') || ''
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  if (location.pathname === '/search' && urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    setQuery(urlQuery)
  }

  // dropdown bahar click karne par band
  useEffect(() => {
    if (!menuOpen) return undefined
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  function submitSearch (event) {
    event.preventDefault()
    const value = query.trim()
    navigate(value ? `/search?query=${encodeURIComponent(value)}` : '/search')
  }

  const links = isAdmin ? [...NAV, { to: '/admin', label: 'Admin' }] : NAV

  return (
    <header className="fz-header">
      {isDemo && (
        <div className="fz-demo-strip">
          Demo mode — data browser me save ho raha hai.{' '}
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
            Firebase connect karein →
          </a>
        </div>
      )}

      <div className="fz-header__main fz-container">
        <NavLink to="/" className="fz-brand" aria-label="FoodieZone home">
          <span className="fz-brand__mark" aria-hidden="true">
            F
          </span>
          <span className="fz-brand__text">
            Foodie<strong>Zone</strong>
          </span>
        </NavLink>

        <button className="fz-location" type="button" title="Delivery location">
          <span className="fz-location__label">Deliver to</span>
          <span className="fz-location__value">
            Indiranagar, Bengaluru <span aria-hidden="true">▾</span>
          </span>
        </button>

        <form className="fz-search" role="search" onSubmit={submitSearch}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for biryani, burgers, pizza…"
            aria-label="Search restaurants and dishes"
          />
          <button type="submit" className="fz-btn fz-btn--primary" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
              <path
                d="M11 4a7 7 0 1 0 4.2 12.6l3.6 3.6 1.4-1.4-3.6-3.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
                fill="currentColor"
              />
            </svg>
            <span>Search</span>
          </button>
        </form>

        <div className="fz-header__actions">
          <button
            type="button"
            className="fz-cart-btn"
            onClick={() => navigate('/cart')}
            aria-label={`Cart, ${count} items`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M7 7V6a5 5 0 0 1 10 0v1h3l-1 13H5L4 7h3Zm2 0h6V6a3 3 0 0 0-6 0v1Z"
                fill="currentColor"
              />
            </svg>
            <span className="sr-only">Cart</span>
            {count > 0 && <span className="fz-cart-btn__count">{count}</span>}
          </button>

          {user ? (
            <div className="fz-user" ref={menuRef}>
              <button
                type="button"
                className="fz-user__trigger"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" />
                ) : (
                  <span className="fz-user__avatar" aria-hidden="true">
                    {user.name?.charAt(0).toUpperCase() || 'F'}
                  </span>
                )}
                <span className="fz-user__name">{user.name?.split(' ')[0] || 'Account'}</span>
                <span aria-hidden="true">▾</span>
              </button>

              {menuOpen && (
                <div className="fz-user__menu" role="menu">
                  <p className="fz-user__email">{user.email}</p>
                  <NavLink to="/orders" role="menuitem" onClick={() => setMenuOpen(false)}>
                    My Orders
                  </NavLink>
                  {isAdmin && (
                    <NavLink to="/admin" role="menuitem" onClick={() => setMenuOpen(false)}>
                      Admin panel
                    </NavLink>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      signOut()
                      navigate('/')
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="fz-btn fz-btn--ghost fz-header__login"
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
          )}
        </div>
      </div>

      <nav className="fz-tabs" aria-label="Primary">
        <div className="fz-container fz-tabs__inner">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
