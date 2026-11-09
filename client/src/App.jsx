import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SalonPublicPage from "./pages/SalonPublicPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Dynamic Public Route */}
        <Route path="/salon/:slug" element={<SalonPublicPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
