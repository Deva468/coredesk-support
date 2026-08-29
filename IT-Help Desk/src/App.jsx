import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import AddTicket from "./pages/AddTicket";
import ViewTickets from "./pages/ViewTickets";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import HelpCenter from "./pages/HelpCenter";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./components/AuthContext";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/add" element={<AddTicket />} />
                <Route path="/tickets" element={<ViewTickets />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<HelpCenter />} />
              </Route>
              <Route element={<ProtectedRoute admin />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;