import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === "0000") {
      localStorage.setItem("adminAuth", "true");
      navigate("/admin");
    } else {
      alert("Incorrect Password");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "400px",
          padding: "40px",
          background: "#111",
          borderRadius: "20px",
          border: "1px solid #d89a2b",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#d89a2b" }}>
          ADMIN LOGIN
        </h1>

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "10px",
          }}
        />

        <button
          onClick={() => navigate("/home")}
          style={{
            position: "absolute",
            top: "30px",
            left: "30px",
            padding: "14px 24px",
            background:
              "linear-gradient(135deg,#d89a2b,#ffcc66)",
            color: "#111",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow:
              "0 0 20px rgba(216,154,43,.3)",
          }}
        >
          <FaHome />
          HOME
        </button>


        <button
          onClick={handleLogin}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "15px",
            background: "#d89a2b",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          LOGIN
        </button>
      </div>
    </div>
  );
}