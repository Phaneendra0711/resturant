import { useNavigate } from "react-router-dom";
import logo from "./assets/bg.png";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">

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