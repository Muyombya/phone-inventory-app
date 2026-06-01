import { Navigate } from "react-router-dom";



const ProtectedRoute = ({
  children,
}) => {
  const token =
    localStorage.getItem(
      "token"
    );



  // =========================
  // NOT LOGGED IN
  // =========================
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }



  // =========================
  // LOGGED IN
  // =========================
  return children;
};



export default ProtectedRoute;