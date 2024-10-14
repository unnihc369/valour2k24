import ButtonGradient from "./assets/svg/ButtonGradient";
import Benefits from "./components/Benefits";
import Collaboration from "./components/Collaboration";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import { Routes, Route } from 'react-router-dom';
import Login from "./pages/Login";
import GameDashboard from "./pages/GameDashboard";
import EditGame from "./pages/EditGame";
import TennisDashboard from "./pages/TennisDashboard";
import CricketDashboard from "./pages/CricketDashboard";
import EditFinal from "./pages/EditFinal";
import Tournament from "./pages/Tournament";
import T1 from "./pages/T1";
import TournamentList from "./pages/TournamentList.jsx";


const App = () => {
  return (
    <>
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
        <Header />
        <Routes>
          <Route path="/" element={<Hero />} />
          {/* <Route path="/benefits" element={<Benefits />} /> */}
          <Route path="/list" element={<TournamentList />} />
          <Route path="/tour/:id" element={<T1 />} />
          <Route path="/login" element={<Login />} />
          <Route path="/game" element={<GameDashboard />} />
          {/* <Route path="/tour" element={<Tournament />} /> */}
          <Route path="/edit/:id" element={<EditGame />} />
          <Route path="/editfinal/:id" element={<EditFinal />} />
        </Routes>
        <Footer />
      </div>

      <ButtonGradient />
    </>
  );
};

export default App;
