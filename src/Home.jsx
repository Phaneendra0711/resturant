import logo from "./assets/bg.png";
import homeBg from "./assets/home_bg.png";

import img1 from "./assets/1.png";
import img2 from "./assets/2.png";
import img3 from "./assets/3.png";
import img4 from "./assets/4.png";
import img5 from "./assets/5.png";
import img6 from "./assets/6.png";
import img7 from "./assets/7.png";
import img8 from "./assets/8.png";

import {
  FaShoppingCart,
  FaUtensils,
  FaPizzaSlice,
  FaHamburger,
  FaGlassCheers,
  FaLeaf,
  FaReceipt,
  FaIceCream,
  FaBirthdayCake,
  FaBell,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Home() {
  const navigate = useNavigate();

  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [assistanceSubmitting, setAssistanceSubmitting] = useState(false);
  const [assistanceMessage, setAssistanceMessage] = useState("");

  const [waiterCooldownUntil, setWaiterCooldownUntil] = useState(() => {
    const saved = localStorage.getItem("waiterCooldownUntil");
    return saved ? Number(saved) : 0;
  });

  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const updateCooldown = () => {
      const remaining = Math.max(
        0,
        waiterCooldownUntil - Date.now()
      );

      setCooldownRemaining(remaining);

      if (remaining <= 0 && waiterCooldownUntil > 0) {
        localStorage.removeItem("waiterCooldownUntil");
        setWaiterCooldownUntil(0);
      }
    };

    updateCooldown();

    const timer = setInterval(updateCooldown, 1000);

    return () => clearInterval(timer);
  }, [waiterCooldownUntil]);

  const requestWaiter = async () => {
    if (waiterCooldownUntil > Date.now()) {
      return;
    }

    if (!customerName.trim()) {
      setAssistanceMessage("Please enter your name.");
      return;
    }

    if (!tableNumber) {
      setAssistanceMessage("Please select your table number.");
      return;
    }

    try {
      setAssistanceSubmitting(true);
      setAssistanceMessage("");

      const response = await fetch("/api/assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          tableNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to request waiter"
        );
      }

      setAssistanceMessage(
        "Waiter has been notified. Please wait a moment."
      );

      const cooldownUntil =
        Date.now() + 5 * 60 * 1000;

      localStorage.setItem(
        "waiterCooldownUntil",
        String(cooldownUntil)
      );

      setWaiterCooldownUntil(cooldownUntil);

      setTimeout(() => {
        setShowWaiterModal(false);
        setCustomerName("");
        setTableNumber("");
        setAssistanceMessage("");
      }, 1800);
    } catch (error) {
      console.error("Waiter assistance error:", error);

      setAssistanceMessage(
        error.message || "Unable to request waiter."
      );
    } finally {
      setAssistanceSubmitting(false);
    }
  };

  const categories = [
    {
      name: "STARTERS",
      image: img1,
      icon: <FaUtensils />,
      path: "/starters",
    },
    {
      name: "MAIN COURSE",
      image: img2,
      icon: <FaUtensils />,
      path: "/maincourse",
    },
    {
      name: "PIZZA",
      image: img3,
      icon: <FaPizzaSlice />,
      path: "/pizza",
    },
    {
      name: "BURGERS",
      image: img4,
      icon: <FaHamburger />,
      path: "/burger",
    },
    {
      name: "BEVERAGES",
      image: img5,
      icon: <FaGlassCheers />,
      path: "/beverages",
    },
    {
      name: "SALADS",
      image: img6,
      icon: <FaLeaf />,
      path: "/salads",
    },
    {
      name: "DESSERTS",
      image: img7,
      icon: <FaBirthdayCake />,
      path: "/desserts",
    },
    {
      name: "ICE CREAMS",
      image: img8,
      icon: <FaIceCream />,
      path: "/icecreams",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${homeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#fff",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 40px",
          borderBottom:
            "1px solid rgba(216,154,43,.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        <img
          src={logo}
          alt="logo"
          style={{
            width: "280px",
            height: "200px",
            objectFit: "contain",
          }}
        />

        <div
          style={{
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              margin: 0,
              color: "#d89a2b",
              fontWeight: "900",
              letterSpacing: "4px",
            }}
          >
            ORDER NOW
          </h1>

          <div
            style={{
              width: "320px",
              height: "2px",
              margin: "10px auto",
              background:
                "linear-gradient(to right, transparent, #d89a2b, transparent)",
            }}
          />

          <h2
            style={{
              margin: 0,
              color: "#ffffff",
              letterSpacing: "10px",
              fontWeight: "400",
              fontSize: "26px",
            }}
          >
            EAT NOW
          </h2>

          <div
            style={{
              display: "flex",
              gap: "50px",
              justifyContent: "center",
              marginTop: "25px",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            <span
              style={{
                color: "#d89a2b",
                cursor: "pointer",
              }}
            >
              HOME
            </span>

            <span
              style={{ cursor: "pointer" }}
              onClick={() =>
                window.scrollTo({
                  top: 750,
                  behavior: "smooth",
                })
              }
            >
              MENU
            </span>

            <span
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/cart")}
            >
              CART
            </span>

            <span style={{ cursor: "pointer" }}>
              ABOUT US
            </span>

            <span style={{ cursor: "pointer" }}>
              CONTACT
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "stretch",
          }}
        >
          {/* TOP ROW - CALL WAITER + CART */}

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >

            {/* CALL WAITER */}

            <button
              onClick={() => {
                if (waiterCooldownUntil > Date.now()) {
                  return;
                }

                setShowWaiterModal(true);
                setAssistanceMessage("");
              }}
              style={{
                border:
                  "2px solid rgba(216,154,43,.8)",
                borderRadius: "14px",
                padding: "15px 20px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg,#b87918,#d89a2b,#f4c45f)",
                color: "#111",
                cursor:
                  cooldownRemaining > 0
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  cooldownRemaining > 0
                    ? 0.55
                    : 1,
                fontWeight: "800",
                fontFamily: "Georgia, serif",
                fontSize: "15px",
                boxShadow:
                  "0 0 18px rgba(216,154,43,.25)",
                whiteSpace: "nowrap",
              }}
            >
              <FaBell />

              <span>
                {cooldownRemaining > 0
                  ? `WAITER CALLED • ${Math.floor(
                    cooldownRemaining / 60000
                  )}:${String(
                    Math.floor(
                      (cooldownRemaining % 60000) / 1000
                    )
                  ).padStart(2, "0")}`
                  : "CALL WAITER"}
              </span>
            </button>


            {/* CART */}

            <div
              onClick={() => navigate("/cart")}
              style={{
                border:
                  "2px solid rgba(216,154,43,.8)",
                borderRadius: "14px",
                padding: "15px 25px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                background:
                  "rgba(0,0,0,.45)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <FaShoppingCart />

              <span>CART</span>

              <span
                style={{
                  color: "#d89a2b",
                  fontWeight: "700",
                }}
              >
                VIEW
              </span>
            </div>

          </div>


          {/* MY ORDERS */}

          <div
            onClick={() =>
              navigate("/my-orders")
            }
            style={{
              border:
                "2px solid rgba(216,154,43,.8)",
              borderRadius: "14px",
              padding: "15px 25px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              background:
                "rgba(0,0,0,.45)",
              cursor: "pointer",
            }}
          >
            <FaReceipt />

            <span>MY ORDERS</span>

            <span
              style={{
                color: "#d89a2b",
                fontWeight: "700",
              }}
            >
              VIEW
            </span>
          </div>

        </div>
      </div>


      {/* HERO SECTION */}

      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          marginBottom: "50px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "25px",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "2px",
              background: "#d89a2b",
            }}
          />

          <h2
            style={{
              color: "#fff",
              fontSize: "38px",
              margin: 0,
              letterSpacing: "3px",
            }}
          >
            EXPLORE OUR
          </h2>

          <div
            style={{
              width: "120px",
              height: "2px",
              background: "#d89a2b",
            }}
          />
        </div>

        <h1
          style={{
            fontSize: "110px",
            margin: "10px 0",
            color: "#d89a2b",
            textShadow:
              "0 0 25px rgba(216,154,43,.25)",
          }}
        >
          CATEGORIES
        </h1>

        <p
          style={{
            color: "#ddd",
            fontSize: "24px",
          }}
        >
          Discover a wide variety of delicious food
        </p>
      </div>
      {/* PREMIUM CATEGORY GRID */}

      <div
        style={{
          width: "95%",
          margin: "0 auto 80px",
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "30px",
        }}
      >
        {categories.map((item) => (
          <div
            key={item.name}
            onClick={() => navigate(item.path)}
            style={{
              cursor: "pointer",
              background:
                "linear-gradient(145deg, rgba(15,15,15,.96), rgba(5,5,5,.98))",
              border:
                "1px solid rgba(216,154,43,.35)",
              borderRadius: "28px",
              overflow: "hidden",
              backdropFilter: "blur(12px)",
              boxShadow:
                "0 0 20px rgba(216,154,43,.08)",
              transition: "all .35s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-10px)";
              e.currentTarget.style.boxShadow =
                "0 0 35px rgba(216,154,43,.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0px)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(216,154,43,.08)";
            }}
          >
            {/* IMAGE */}

            <div
              style={{
                height: "240px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "15px",
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "contain",
                  filter:
                    "drop-shadow(0 10px 20px rgba(0,0,0,.7))",
                }}
              />
            </div>

            {/* ICON */}

            <div
              style={{
                width: "70px",
                height: "70px",
                margin: "-10px auto 15px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg,#b87918,#d89a2b,#f4c45f)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#111",
                fontSize: "28px",
                boxShadow:
                  "0 0 20px rgba(216,154,43,.35)",
              }}
            >
              {item.icon}
            </div>

            {/* TITLE */}

            <div
              style={{
                textAlign: "center",
                padding: "0 20px 25px",
              }}
            >
              <h3
                style={{
                  color: "#fff",
                  fontSize: "26px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                }}
              >
                {item.name}
              </h3>

              <div
                style={{
                  width: "140px",
                  height: "2px",
                  margin: "0 auto",
                  background:
                    "linear-gradient(to right, transparent, #d89a2b, transparent)",
                }}
              />

              <p
                style={{
                  color: "#bbb",
                  marginTop: "15px",
                  fontSize: "14px",
                  lineHeight: "24px",
                }}
              >
                Explore our premium
                collection of {item.name.toLowerCase()}
                prepared with authentic
                ingredients and rich flavors.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* PREMIUM FEATURES SECTION */}

      <div
        style={{
          width: "95%",
          margin: "0 auto 80px",
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "25px",
        }}
      >
        <div
          style={{
            background:
              "rgba(10,10,10,.92)",
            border:
              "1px solid rgba(216,154,43,.25)",
            borderRadius: "24px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "40px",
            }}
          >
            🍽️
          </div>

          <h3
            style={{
              color: "#d89a2b",
              marginTop: "15px",
            }}
          >
            Authentic Recipes
          </h3>

          <p
            style={{
              color: "#bbb",
              marginTop: "10px",
            }}
          >
            Traditional flavors with a
            premium touch.
          </p>
        </div>

        <div
          style={{
            background:
              "rgba(10,10,10,.92)",
            border:
              "1px solid rgba(216,154,43,.25)",
            borderRadius: "24px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "40px",
            }}
          >
            🌿
          </div>

          <h3
            style={{
              color: "#d89a2b",
              marginTop: "15px",
            }}
          >
            Fresh Ingredients
          </h3>

          <p
            style={{
              color: "#bbb",
              marginTop: "10px",
            }}
          >
            Carefully selected premium
            ingredients.
          </p>
        </div>
        <div
          style={{
            background:
              "rgba(10,10,10,.92)",
            border:
              "1px solid rgba(216,154,43,.25)",
            borderRadius: "24px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "40px",
            }}
          >
            👨‍🍳
          </div>

          <h3
            style={{
              color: "#d89a2b",
              marginTop: "15px",
            }}
          >
            Expert Chefs
          </h3>

          <p
            style={{
              color: "#bbb",
              marginTop: "10px",
            }}
          >
            Prepared by experienced
            chefs with passion.
          </p>
        </div>

        <div
          style={{
            background:
              "rgba(10,10,10,.92)",
            border:
              "1px solid rgba(216,154,43,.25)",
            borderRadius: "24px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "40px",
            }}
          >
            🚚
          </div>

          <h3
            style={{
              color: "#d89a2b",
              marginTop: "15px",
            }}
          >
            Fast Delivery
          </h3>

          <p
            style={{
              color: "#bbb",
              marginTop: "10px",
            }}
          >
            Hot and fresh food delivered
            to your doorstep.
          </p>
        </div>
      </div>

      {/* CALL WAITER MODAL */}
      {showWaiterModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.78)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => {
            if (!assistanceSubmitting) {
              setShowWaiterModal(false);
              setAssistanceMessage("");
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "480px",
              background:
                "linear-gradient(145deg, rgba(20,20,20,.98), rgba(5,5,5,.99))",
              border:
                "1px solid rgba(216,154,43,.55)",
              borderRadius: "24px",
              padding: "35px",
              boxShadow:
                "0 0 50px rgba(216,154,43,.18)",
              fontFamily: "Georgia, serif",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  margin: "0 auto 15px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,#b87918,#d89a2b,#f4c45f)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111",
                  fontSize: "28px",
                  boxShadow:
                    "0 0 25px rgba(216,154,43,.3)",
                }}
              >
                <FaBell />
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#d89a2b",
                  fontSize: "28px",
                  letterSpacing: "2px",
                }}
              >
                CALL WAITER
              </h2>

              <p
                style={{
                  color: "#aaa",
                  marginTop: "10px",
                  fontSize: "15px",
                }}
              >
                Please provide your details so our waiter
                can assist you.
              </p>
            </div>

            {/* CUSTOMER NAME */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  color: "#d89a2b",
                  fontWeight: "700",
                  marginBottom: "8px",
                  letterSpacing: "1px",
                }}
              >
                CUSTOMER NAME
              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setAssistanceMessage("");
                }}
                placeholder="Enter your name"
                disabled={assistanceSubmitting}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(216,154,43,.35)",
                  background: "rgba(0,0,0,.65)",
                  color: "#fff",
                  outline: "none",
                  fontFamily: "Georgia, serif",
                  fontSize: "16px",
                }}
              />
            </div>

            {/* TABLE NUMBER */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  color: "#d89a2b",
                  fontWeight: "700",
                  marginBottom: "8px",
                  letterSpacing: "1px",
                }}
              >
                TABLE NUMBER
              </label>

              <select
                value={tableNumber}
                onChange={(e) => {
                  setTableNumber(e.target.value);
                  setAssistanceMessage("");
                }}
                disabled={assistanceSubmitting}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(216,154,43,.35)",
                  background: "#111",
                  color: tableNumber ? "#fff" : "#888",
                  outline: "none",
                  fontFamily: "Georgia, serif",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                <option value="">
                  Select your table
                </option>

                {Array.from(
                  { length: 30 },
                  (_, index) => index + 1
                ).map((table) => (
                  <option
                    key={table}
                    value={String(table)}
                  >
                    Table {table}
                  </option>
                ))}
              </select>
            </div>

            {/* MESSAGE */}
            {assistanceMessage && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "12px 15px",
                  borderRadius: "10px",
                  background:
                    assistanceMessage.includes("notified")
                      ? "rgba(40,120,70,.18)"
                      : "rgba(180,60,60,.15)",
                  border:
                    assistanceMessage.includes("notified")
                      ? "1px solid rgba(80,180,110,.35)"
                      : "1px solid rgba(220,90,90,.35)",
                  color:
                    assistanceMessage.includes("notified")
                      ? "#8ee0a5"
                      : "#ff9b9b",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                {assistanceMessage}
              </div>
            )}

            {/* BUTTONS */}
            <div
              style={{
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                type="button"
                disabled={assistanceSubmitting}
                onClick={() => {
                  setShowWaiterModal(false);
                  setAssistanceMessage("");
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(255,255,255,.18)",
                  background: "rgba(255,255,255,.06)",
                  color: "#bbb",
                  cursor: assistanceSubmitting
                    ? "not-allowed"
                    : "pointer",
                  fontFamily: "Georgia, serif",
                  fontWeight: "700",
                }}
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={requestWaiter}
                disabled={assistanceSubmitting}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "12px",
                  border:
                    "2px solid rgba(216,154,43,.8)",
                  background:
                    assistanceSubmitting
                      ? "rgba(216,154,43,.35)"
                      : "linear-gradient(135deg,#b87918,#d89a2b,#f4c45f)",
                  color: "#111",
                  cursor: assistanceSubmitting
                    ? "not-allowed"
                    : "pointer",
                  fontFamily: "Georgia, serif",
                  fontWeight: "800",
                }}
              >
                {assistanceSubmitting
                  ? "REQUESTING..."
                  : "REQUEST WAITER"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}

      <div
        style={{
          marginTop: "40px",
          padding: "35px 20px",
          textAlign: "center",
          borderTop:
            "1px solid rgba(216,154,43,.2)",
          background:
            "rgba(0,0,0,.45)",
          backdropFilter: "blur(8px)",
        }}
      >
        <h2
          style={{
            color: "#d89a2b",
            letterSpacing: "3px",
            marginBottom: "10px",
          }}
        >
          ORDER NOW • EAT NOW
        </h2>

        <p
          style={{
            color: "#aaa",
            fontSize: "15px",
          }}
        >
          Premium Dining Experience •
          Authentic Taste • Fresh Ingredients
        </p>

        <div
          style={{
            marginTop: "20px",
            color: "#777",
            fontSize: "13px",
          }}
        >
          © 2026 Order Now Eat Now.
          All Rights Reserved.
        </div>
      </div>
    </div>
  );
}