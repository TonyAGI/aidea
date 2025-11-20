import { NavLink } from 'react-router-dom';
import '../styles/nav.css';

const menuItems = [
  { label: 'HOME', to: '/' },
  { label: 'ABOUT', to: '/#about', external: true },
  { label: 'CONTACT', to: '/#contact', external: true },
  { label: 'AGENT', to: '/agent' },
  { label: 'PRICING', to: '/pricing' },
];

const Navbar = () => (
  <nav className="navbar">
    <div className="navbar-container">
      <ul className="navbar-menu">
        <li>
          <h3 style={{ margin: 0 }}>
            <b>AI&lt;&gt;</b>DEA*
          </h3>
        </li>
        <li className="navbar-logo-img">
          <img src="/ai-dea-logo.png" alt="AI<>DEA Logo" className="ai-logo-transparent" />
        </li>
        {menuItems.map(({ label, to, external }) => (
          <li key={label}>
            {external ? (
              <a href={to}>{label}</a>
            ) : (
              <NavLink to={to} end={to === '/'}>
                {label}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

export default Navbar;

