import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";

import Inventory from "./pages/Inventory";

import AddPhone from "./pages/AddPhone";

import EditPhone from "./pages/EditPhone";

import SalesTerminal from "./pages/SalesTerminal";

import SalesHistory from "./pages/SalesHistory";

import Transfers from "./pages/Transfers";

import TransferHistory from "./pages/TransferHistory";

import ReturnsHistory from "./pages/ReturnsHistory";

import Receipt from "./pages/Receipt";

import ThermalReceipt from "./pages/ThermalReceipt";

import Reports from "./pages/Reports";

import Branches from "./pages/Branches";

import Users from "./pages/Users";

import AuditLogs from "./pages/AuditLogs";

// =========================
// PROTECTED ROUTE
// =========================
function ProtectedRoute({
  children,
}) {
  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {
    return (
      <Navigate to="/login" />
    );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* PROTECTED ROUTES */}
        <Route
          path="*"
          element={
            <ProtectedRoute>

              <div className="min-h-screen bg-gray-100">

                <Navbar />

                <Routes>

                  {/* DASHBOARD */}
                  <Route
                    path="/"
                    element={
                      <Dashboard />
                    }
                  />

                  <Route
                    path="/dashboard"
                    element={
                      <Dashboard />
                    }
                  />

                  {/* INVENTORY */}
                  <Route
                    path="/inventory"
                    element={
                      <Inventory />
                    }
                  />

                  {/* ADD PHONE */}
                  <Route
                    path="/add-phone"
                    element={
                      <AddPhone />
                    }
                  />

                  {/* EDIT PHONE */}
                  <Route
                    path="/edit-phone/:id"
                    element={
                      <EditPhone />
                    }
                  />

                  {/* SALES */}
                  <Route
                    path="/sales-terminal"
                    element={
                      <SalesTerminal />
                    }
                  />

                  <Route
                    path="/sales-history"
                    element={
                      <SalesHistory />
                    }
                  />

                  <Route
                    path="/returns"
                    element={
                      <ReturnsHistory />
                    }
                  />

                  {/* A4 RECEIPT */}
                  <Route
                    path="/receipt/:id"
                    element={
                      <Receipt />
                    }
                  />

                  {/* THERMAL RECEIPT */}
                  <Route
                    path="/thermal-receipt/:id"
                    element={
                      <ThermalReceipt />
                    }
                  />

                  {/* TRANSFERS */}
                  <Route
                    path="/transfers"
                    element={
                      <Transfers />
                    }
                  />

                  <Route
                    path="/transfer-history"
                    element={
                      <TransferHistory />
                    }
                  />

                  {/* REPORTS */}
                  <Route
                    path="/reports"
                    element={
                      <Reports />
                    }
                  />

                  {/* BRANCHES */}
                  <Route
                    path="/branches"
                    element={
                      <Branches />
                    }
                  />

                  {/* USERS */}
                  <Route
                    path="/users"
                    element={
                      <Users />
                    }
                  />

                  {/* AUDIT LOGS */}
                  <Route
                    path="/audit-logs"
                    element={
                      <AuditLogs />
                    }
                  />

                </Routes>

              </div>

            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;