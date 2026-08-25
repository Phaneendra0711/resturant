import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

export default function StaffLogin() {
  const [role, setRole] = useState("CHEF");
  const [username, setUsername] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      alert(
        "Please enter username and password"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/staff/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Login failed"
        );
      }

      const staff = data.staff;

      /*
        Make sure the selected role
        matches the actual account role.
      */

      if (
        staff.role !== role
      ) {
        alert(
          `This account is a ${staff.role} account. Please select ${staff.role}.`
        );

        return;
      }

      /*
        Store only session information
        locally.

        Password is NOT stored.
      */

      localStorage.setItem(
        "userRole",
        staff.role.toLowerCase()
      );

      localStorage.setItem(
        "staffId",
        staff._id
      );

      localStorage.setItem(
        "staffName",
        staff.name
      );

      localStorage.setItem(
        "staffUsername",
        staff.username
      );

      // Redirect based on role

      if (staff.role === "CHEF") {
        navigate("/chef");
      } else if (
        staff.role === "WAITER"
      ) {
        navigate("/waiter");
      } else if (
        staff.role === "ADMIN"
      ) {
        navigate("/admin");
      }

    } catch (error) {
      console.error(
        "Staff login error:",
        error
      );

      alert(
        error.message ||
        "Unable to login"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        justifyContent:
          "center",
        alignItems: "center",
        position: "relative",
      }}
    >

      {/* HOME BUTTON */}

      <button
        onClick={() =>
          navigate("/home")
        }
        style={{
          position: "absolute",
          top: "30px",
          left: "30px",
          padding:
            "14px 24px",
          background:
            "linear-gradient(135deg,#d89a2b,#ffcc66)",
          color: "#111",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "16px",
          display: "flex",
          alignItems:
            "center",
          gap: "8px",
          boxShadow:
            "0 0 20px rgba(216,154,43,.3)",
        }}
      >
        <FaHome />
        HOME
      </button>

      {/* LOGIN CARD */}

      <div
        style={{
          width: "420px",
          padding: "40px",
          background: "#111",
          borderRadius: "20px",
          border:
            "1px solid #d89a2b",
          textAlign: "center",
          boxShadow:
            "0 0 40px rgba(216,154,43,.12)",
        }}
      >

        <h1
          style={{
            color: "#d89a2b",
            marginBottom:
              "10px",
          }}
        >
          STAFF LOGIN
        </h1>

        <p
          style={{
            color: "#888",
            marginBottom:
              "30px",
          }}
        >
          Login using your
          staff account
        </p>

        {/* ROLE */}

        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
          style={{
            width: "100%",
            padding: "15px",
            marginBottom:
              "15px",
            borderRadius:
              "10px",
            background:
              "#222",
            color:
              "white",
            border:
              "1px solid #444",
            fontSize:
              "16px",
          }}
        >
          <option value="CHEF">
            Chef
          </option>

          <option value="WAITER">
            Waiter
          </option>

          <option value="ADMIN">
            Admin
          </option>
        </select>

        {/* USERNAME */}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter"
            ) {
              handleLogin();
            }
          }}
          style={{
            width: "100%",
            padding: "15px",
            marginBottom:
              "15px",
            borderRadius:
              "10px",
            border:
              "1px solid #444",
            background:
              "#222",
            color:
              "white",
            boxSizing:
              "border-box",
          }}
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter"
            ) {
              handleLogin();
            }
          }}
          style={{
            width: "100%",
            padding: "15px",
            marginBottom:
              "20px",
            borderRadius:
              "10px",
            border:
              "1px solid #444",
            background:
              "#222",
            color:
              "white",
            boxSizing:
              "border-box",
          }}
        />

        {/* LOGIN */}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            background:
              loading
                ? "#666"
                : "#d89a2b",
            border: "none",
            borderRadius:
              "10px",
            fontWeight:
              "bold",
            cursor:
              loading
                ? "not-allowed"
                : "pointer",
            fontSize:
              "16px",
          }}
        >
          {loading
            ? "LOGGING IN..."
            : "LOGIN"}
        </button>

      </div>
    </div>
  );
}