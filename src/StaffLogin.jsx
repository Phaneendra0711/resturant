import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserShield,
  FaUser,
  FaLock,
  FaSignInAlt,
  FaChevronDown,
} from "react-icons/fa";

import "./StaffLogin.css";

export default function StaffLogin() {
  const [role, setRole] = useState("CHEF");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("staffId");
    localStorage.removeItem("staffName");
    localStorage.removeItem("staffUsername");
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      const staff = data.staff;

      /*
        Make sure selected role
        matches actual account role.
      */

      if (staff.role !== role) {
        alert(
          `This account is a ${staff.role} account. Please select ${staff.role}.`
        );

        return;
      }

      /*
        Store session information.
        Password is NOT stored.
      */

      sessionStorage.clear();

      sessionStorage.setItem(
        "userRole",
        staff.role.toLowerCase()
      );

      sessionStorage.setItem(
        "staffId",
        staff._id
      );

      sessionStorage.setItem(
        "staffName",
        staff.name
      );

      sessionStorage.setItem(
        "staffUsername",
        staff.username
      );

      /*
        Redirect based on role.
      */

      if (staff.role === "CHEF") {
        navigate("/chef", {
          replace: true,
        });
      } else if (staff.role === "WAITER") {
        navigate("/waiter", {
          replace: true,
        });
      } else if (staff.role === "ADMIN") {
        navigate("/admin", {
          replace: true,
        });
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
    <div className="staff-page">

      {/* =========================================
          BACKGROUND EFFECTS
      ========================================= */}

      <div className="staff-glow staff-glow-one" />
      <div className="staff-glow staff-glow-two" />

      <div className="staff-grid" />


      {/* =========================================
          HOME BUTTON
      ========================================= */}

      <button
        className="staff-home-button"
        onClick={() => navigate("/home")}
      >
        <FaHome />

        <span>
          HOME
        </span>
      </button>


      {/* =========================================
          LOGIN CARD
      ========================================= */}

      <div className="staff-login-card">

        {/* Top decorative line */}

        <div className="staff-card-line" />


        {/* =======================================
            LOGO / ICON
        ======================================= */}

        <div className="staff-login-icon">

          <FaUserShield />

        </div>


        <div className="staff-eyebrow">
          RESTAURANT MANAGEMENT SYSTEM
        </div>


        <h1>
          STAFF LOGIN
        </h1>


        <p className="staff-subtitle">
          Sign in to access your staff dashboard
        </p>


        {/* =======================================
            ROLE
        ======================================= */}

        <div className="staff-field">

          <label>
            STAFF ROLE
          </label>


          <div className="staff-input-wrapper">

            <FaUserShield className="field-icon" />

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              disabled={loading}
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

            <FaChevronDown className="select-arrow" />

          </div>

        </div>


        {/* =======================================
            USERNAME
        ======================================= */}

        <div className="staff-field">

          <label>
            USERNAME
          </label>


          <div className="staff-input-wrapper">

            <FaUser className="field-icon" />

            <input
              type="text"
              placeholder="Enter your username"
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
              disabled={loading}
              autoComplete="username"
            />

          </div>

        </div>


        {/* =======================================
            PASSWORD
        ======================================= */}

        <div className="staff-field">

          <label>
            PASSWORD
          </label>


          <div className="staff-input-wrapper">

            <FaLock className="field-icon" />

            <input
              type="password"
              placeholder="Enter your password"
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
              disabled={loading}
              autoComplete="current-password"
            />

          </div>

        </div>


        {/* =======================================
            LOGIN BUTTON
        ======================================= */}

        <button
          className={`staff-login-button ${
            loading
              ? "staff-login-loading"
              : ""
          }`}
          onClick={handleLogin}
          disabled={loading}
        >

          {loading ? (
            <>
              <span className="login-spinner" />

              LOGGING IN...
            </>
          ) : (
            <>
              <FaSignInAlt />

              LOGIN TO DASHBOARD
            </>
          )}

        </button>


        {/* =======================================
            FOOTER
        ======================================= */}

        <div className="staff-login-footer">

          <span className="footer-dot" />

          <span>
            Authorized staff access only
          </span>

          <span className="footer-dot" />

        </div>

      </div>

    </div>
  );
}