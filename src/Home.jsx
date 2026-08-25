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
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

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

          <button
            onClick={() =>
              navigate("/staff-login")
            }
            style={{
              background:
                "linear-gradient(135deg,#8a5a08,#c98a20,#f0c35a)",
              color: "#111",
              border: "1px solid rgba(255,215,120,.5)",
              padding: "16px 32px",
              borderRadius: "18px",
              cursor: "pointer",
              fontWeight: "800",
              fontSize: "15px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              boxShadow:
                "0 0 15px rgba(216,154,43,.25), 0 0 35px rgba(216,154,43,.15)",
              transition: "all .3s ease",
              backdropFilter: "blur(10px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 0 25px rgba(216,154,43,.45), 0 0 50px rgba(216,154,43,.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 0 15px rgba(216,154,43,.25), 0 0 35px rgba(216,154,43,.15)";
            }}
          >
            STAFF PORTAL
          </button>
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