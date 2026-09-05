import { useNavigate } from "react-router-dom";
import logo from "./assets/bg.png";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

<button
  onClick={() => navigate("/staff-login")}
  style={{
    position: "fixed",
    top: "25px",
    right: "30px",
    zIndex: 1000,

    background:
      "linear-gradient(135deg, #f5b942, #d88916)",
    color: "#111",

    border: "none",
    padding: "15px 32px",
    borderRadius: "12px",

    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
    letterSpacing: "1px",

    boxShadow:
      "0 5px 20px rgba(216,154,43,.4)",

    transition: "all 0.2s ease",
  }}
>
  STAFF PORTAL
</button>

      <div className="landing-glow"></div>

      <div className="landing-content">

        <img
          src={logo}
          alt="Order Now Eat Now"
          className="landing-logo"
        />

        <p className="landing-subtitle">
          PREMIUM RESTAURANT EXPERIENCE
        </p>

        <h1 className="landing-title">
          ORDER NOW
          <span> EAT NOW</span>
        </h1>

        <div className="landing-divider">

          <div className="divider-line"></div>

          <div className="divider-icon">
            ✦
          </div>

          <div className="divider-line"></div>

        </div>

        <button
          className="landing-btn"
          onClick={() => navigate("/home")}
        >
          ORDER NOW →
        </button>

      </div>

    </div>
  );
}