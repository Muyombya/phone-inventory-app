import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import AddPhone from "./pages/AddPhone";
import EditPhone from "./pages/EditPhone";
import Login from "./pages/Login";
import Phones from "./pages/Phones";

import useAuth from "./context/useAuth";

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Phones />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddPhone />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <EditPhone />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;