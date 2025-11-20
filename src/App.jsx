import { Route, Routes } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Agent from './pages/Agent';

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>
      <Route path="/agent" element={<Agent />} />
    </Routes>
  );
}

export default App;
