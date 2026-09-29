import { Link } from 'react-router-dom'
import './Footer.css'

const COLUMNS = [
  {
    title: 'FoodieZone',
    links: [
      { label: 'About us', to: '/search' },
      { label: 'Careers', to: '/search' },
      { label: 'Team', to: '/search' },
      { label: 'Blog', to: '/search' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Restaurants near me', to: '/search' },
      { label: 'Top rated', to: '/search?sort=rating' },
      { label: 'Fast delivery', to: '/search?sort=delivery' },
      { label: 'Pure veg', to: '/search?veg=1' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help centre', to: '/' },
      { label: 'Contact us', to: '/' },
      { label: 'Privacy policy', to: '/' },
      { label: 'Terms of use', to: '/' },
    ],
  },
]

export default function Footer () {
  return (
    <footer className="fz-footer">
      <div className="fz-container fz-footer__grid">
        <div className="fz-footer__brand">
          <span className="fz-brand__mark" aria-hidden="true">
            F
          </span>
          <p className="fz-small fz-muted">
            Fresh food, honest prices and honest delivery times. Order from the best restaurants in your
            neighbourhood.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3>{column.title}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="fz-container fz-footer__bottom">
        <span>© {new Date().getFullYear()} FoodieZone. Built with React, Vite & Firebase.</span>
        <span className="fz-muted">Made for food lovers</span>
      </div>
    </footer>
  )
}
