import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaLock,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === "0000") {
      localStorage.setItem("adminAuth", "true");
      navigate("/admin");
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "30px",

        background: `
          radial-gradient(
            circle at 10% 10%,
            rgba(216,154,43,0.13),
            transparent 30%
          ),
          radial-gradient(
            circle at 90% 90%,
            rgba(216,154,43,0.08),
            transparent 30%
          ),
          radial-gradient(
            circle at 50% 50%,
            rgba(216,154,43,0.035),
            transparent 45%
          ),
          linear-gradient(
            135deg,
            #050505 0%,
            #0a0a09 45%,
            #10100e 100%
          )
        `,

        fontFamily:
          "Inter, Poppins, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* BACKGROUND GRID */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",

          backgroundImage: `
            linear-gradient(
              rgba(216,154,43,0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(216,154,43,0.025) 1px,
              transparent 1px
            )
          `,

          backgroundSize: "70px 70px",
        }}
      />

      {/* GOLD GLOW */}
      <div
        style={{
          position: "absolute",
          width: "520px",
          height: "520px",
          borderRadius: "50%",

          background:
            "radial-gradient(circle, rgba(216,154,43,0.07), transparent 68%)",

          filter: "blur(20px)",

          pointerEvents: "none",
        }}
      />

      {/* HOME BUTTON */}
      <button
        onClick={() => navigate("/home")}
        style={{
          position: "absolute",
          top: "28px",
          left: "30px",
          zIndex: 5,

          minHeight: "48px",
          padding: "0 20px",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          gap: "9px",

          color: "#e8e8e8",

          background:
            "linear-gradient(145deg, rgba(28,28,28,0.96), rgba(16,16,16,0.96))",

          border:
            "1px solid rgba(216,154,43,0.22)",

          borderRadius: "12px",

          fontSize: "12px",
          fontWeight: "850",

          cursor: "pointer",

          boxShadow:
            "0 10px 30px rgba(0,0,0,0.35)",

          transition:
            "transform .2s ease, border-color .2s ease, background .2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor =
            "rgba(216,154,43,0.55)";
          e.currentTarget.style.background =
            "linear-gradient(145deg, #241f15, #15130f)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor =
            "rgba(216,154,43,0.22)";
          e.currentTarget.style.background =
            "linear-gradient(145deg, rgba(28,28,28,0.96), rgba(16,16,16,0.96))";
        }}
      >
        <FaHome
          style={{
            color: "#d89a2b",
            fontSize: "15px",
          }}
        />

        HOME
      </button>

      {/* LOGIN CARD */}
      <div
        style={{
          position: "relative",
          zIndex: 2,

          width: "100%",
          maxWidth: "430px",

          boxSizing: "border-box",

          padding: "42px",

          borderRadius: "22px",

          background: `
            linear-gradient(
              145deg,
              rgba(27,27,27,0.98),
              rgba(12,12,12,0.98)
            )
          `,

          border:
            "1px solid rgba(216,154,43,0.25)",

          boxShadow: `
            0 35px 100px rgba(0,0,0,0.65),
            0 0 55px rgba(216,154,43,0.045),
            inset 0 1px rgba(255,255,255,0.035)
          `,

          backdropFilter: "blur(18px)",
        }}
      >
        {/* TOP GOLD LINE */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "12%",
            right: "12%",
            height: "2px",

            borderRadius: "0 0 10px 10px",

            background:
              "linear-gradient(90deg, transparent, #d89a2b, transparent)",

            boxShadow:
              "0 0 18px rgba(216,154,43,0.4)",
          }}
        />

        {/* ICON */}
        <div
          style={{
            width: "68px",
            height: "68px",

            margin: "0 auto 20px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "18px",

            color: "#111",

            background:
              "linear-gradient(145deg, #e7b04d, #b97818)",

            boxShadow:
              "0 12px 35px rgba(216,154,43,0.22)",
          }}
        >
          <FaShieldAlt
            style={{
              fontSize: "28px",
            }}
          />
        </div>

        {/* HEADING */}
        <div
          style={{
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 7px",

              color: "#d89a2b",

              fontSize: "9px",
              fontWeight: "900",

              letterSpacing: "0.18em",
            }}
          >
            RESTAURANT MANAGEMENT
          </p>

          <h1
            style={{
              margin: 0,

              color: "#f3f3f3",

              fontSize: "29px",
              fontWeight: "900",

              letterSpacing: "-0.03em",
            }}
          >
            Admin Login
          </h1>

          <p
            style={{
              margin: "9px 0 0",

              color: "#666",

              fontSize: "11px",

              lineHeight: "1.5",
            }}
          >
            Sign in to manage your restaurant
          </p>
        </div>

        {/* DIVIDER */}
        <div
          style={{
            height: "1px",

            margin:
              "27px 0 24px",

            background:
              "linear-gradient(90deg, transparent, rgba(216,154,43,0.2), transparent)",
          }}
        />

        {/* PASSWORD LABEL */}
        <label
          style={{
            display: "block",

            marginBottom: "8px",

            color: "#777",

            fontSize: "9px",
            fontWeight: "900",

            letterSpacing: "0.12em",

            textTransform: "uppercase",
          }}
        >
          Administrator Password
        </label>

        {/* PASSWORD INPUT */}
        <div
          style={{
            position: "relative",
          }}
        >
          <FaLock
            style={{
              position: "absolute",

              left: "15px",
              top: "50%",

              transform: "translateY(-50%)",

              color: "#d89a2b",

              fontSize: "14px",

              pointerEvents: "none",
            }}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
            style={{
              width: "100%",
              height: "52px",

              boxSizing: "border-box",

              padding:
                "0 15px 0 43px",

              outline: "none",

              color: "#eee",

              background: "#090909",

              border:
                error
                  ? "1px solid rgba(255,80,80,0.5)"
                  : "1px solid rgba(255,255,255,0.08)",

              borderRadius: "11px",

              fontFamily: "inherit",

              fontSize: "13px",
              fontWeight: "650",

              transition:
                "border-color .2s ease, box-shadow .2s ease",
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor =
                  "rgba(216,154,43,0.55)";

                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(216,154,43,0.06)";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor =
                error
                  ? "rgba(255,80,80,0.5)"
                  : "rgba(255,255,255,0.08)";

              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              marginTop: "9px",

              padding: "9px 11px",

              color: "#ff7070",

              background:
                "rgba(255,70,70,0.07)",

              border:
                "1px solid rgba(255,70,70,0.15)",

              borderRadius: "8px",

              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            {error}
          </div>
        )}

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            height: "52px",

            marginTop: "20px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            gap: "9px",

            border: "none",
            borderRadius: "11px",

            color: "#111",

            background:
              "linear-gradient(135deg, #e6ad48, #c27d18)",

            fontFamily: "inherit",

            fontSize: "12px",
            fontWeight: "900",

            letterSpacing: "0.04em",

            cursor: "pointer",

            boxShadow:
              "0 10px 25px rgba(216,154,43,0.15)",

            transition:
              "transform .2s ease, box-shadow .2s ease, filter .2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform =
              "translateY(-2px)";

            e.currentTarget.style.filter =
              "brightness(1.08)";

            e.currentTarget.style.boxShadow =
              "0 14px 32px rgba(216,154,43,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              "translateY(0)";

            e.currentTarget.style.filter =
              "brightness(1)";

            e.currentTarget.style.boxShadow =
              "0 10px 25px rgba(216,154,43,0.15)";
          }}
        >
          LOGIN

          <FaArrowRight
            style={{
              fontSize: "11px",
            }}
          />
        </button>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "23px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            gap: "7px",

            color: "#505050",

            fontSize: "9px",
          }}
        >
          <FaShieldAlt
            style={{
              color: "#6b4b19",
              fontSize: "10px",
            }}
          />

          Authorized administrator access only
        </div>
      </div>
    </div>
  );
}