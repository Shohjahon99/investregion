import { AppProvider, useRoute } from './store.jsx';
import Header, { Footer } from './components/Header.jsx';
import Home from './pages/Home.jsx';
import MapPage from './pages/MapPage.jsx';
import District from './pages/District.jsx';
import Compare from './pages/Compare.jsx';
import Calculator from './pages/Calculator.jsx';
import Finder from './pages/Finder.jsx';
import Offers from './pages/Offers.jsx';
import Rating from './pages/Rating.jsx';
import Method from './pages/Method.jsx';
import Api from './pages/Api.jsx';
import Admin from './pages/Admin.jsx';
import Report from './pages/Report.jsx';
import SpecsPage from './pages/SpecsPage.jsx';

function Routes() {
  const { path, args } = useRoute();
  if (path === 'report') return <Report ids={args[0]} />;
  const page = {
    '': <Home />, map: <MapPage />, d: <District id={args[0]} key={args[0]} />, compare: <Compare />, calc: <Calculator id={args[0]} key={args[0]} />,
    finder: <Finder />, specs: <SpecsPage id={args[0]} />, offers: <Offers id={args[0]} />, rating: <Rating />, method: <Method />, api: <Api />, admin: <Admin />,
  }[path] ?? <Home />;
  return (
    <div className={`app ${path === 'map' ? 'full' : ''}`}>
      <Header path={path} />
      <main>{page}</main>
      {path !== 'map' && <Footer />}
    </div>
  );
}

export default function App() {
  return <AppProvider><Routes /></AppProvider>;
}
