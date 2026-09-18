import { useNavigate } from "react-router-dom";
import {
  FaUserShield,
  FaArrowRight,
  FaUtensils,
} from "react-icons/fa";

import logo from "./assets/bg.png";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

      {/* =========================================
          BACKGROUND EFFECTS
      ========================================= */}

      <div className="landing-glow landing-glow-main" />
      <div className="landing-glow landing-glow-small" />

      <div className="landing-grid" />


      {/* =========================================
          STAFF PORTAL
      ========================================= */}

      <button
        className="landing-staff-button"
        onClick={() =>
          navigate("/staff-login")
        }
      >
        <FaUserShield />

        <span>
          STAFF PORTAL
        </span>

      </button>


      {/* =========================================
          MAIN CONTENT
      ========================================= */}

      <main className="landing-content">

        {/* LOGO */}

        <div className="landing-logo-wrapper">

          <div className="logo-ring logo-ring-one" />
          <div className="logo-ring logo-ring-two" />

          <img
            src={logo}
            alt="Order Now Eat Now"
            className="landing-logo"
          />

        </div>


        {/* SUBTITLE */}

        <p className="landing-subtitle">
          PREMIUM RESTAURANT EXPERIENCE
        </p>


        {/* TITLE */}

        <h1 className="landing-title">

          <span className="title-white">
            ORDER NOW
          </span>

          <span className="title-gold">
            EAT NOW
          </span>

        </h1>


        {/* DIVIDER */}

        <div className="landing-divider">

          <div className="divider-line" />

          <div className="divider-center">

            <span>
              ✦
            </span>

          </div>

          <div className="divider-line" />

        </div>


        {/* DESCRIPTION */}

        <p className="landing-description">
          A smarter way to order,
          track and enjoy your meal.
        </p>


        {/* ORDER BUTTON */}

        <button
          className="landing-btn"
          onClick={() =>
            navigate("/home")
          }
        >

          <span className="landing-btn-icon">
            <FaUtensils />
          </span>

          <span>
            ORDER NOW
          </span>

          <FaArrowRight className="landing-btn-arrow" />

        </button>


        {/* FOOTER TEXT */}

        <div className="landing-footer">

          <span className="footer-line" />

          <span>
            ORDER • TRACK • ENJOY
          </span>

          <span className="footer-line" />

        </div>

      </main>

    </div>
  );
}