import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const SiteLayout = () => (
  <div className="site-layout">
    <Navbar />
    <main className="site-main">
      <Outlet />
    </main>
  </div>
);

export default SiteLayout;

