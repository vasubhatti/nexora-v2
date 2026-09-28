import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Spinner from "../../components/Spinner.jsx";
import api from "../../api/axios.js";

const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const verify = async () => {
      const stored = localStorage.getItem("admin_user");
      if (!stored) { setStatus("denied"); return; }
      try {
        const { data } = await api.get("/auth/me");
        if (data.user.role === "admin") {
          setStatus("allowed");
        } else {
          setStatus("denied");
        }
      } catch {
        setStatus("denied");
      }
    };
    verify();
  }, []);

  if (status === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={28} />
      </div>
    );
  }

  return status === "allowed" ? children : <Navigate to="/admin" replace />;
};

export default AdminRoute;