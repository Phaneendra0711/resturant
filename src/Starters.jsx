import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "./assets/bg.png";
import starterBg from "./assets/starters-banner-bg.png";
import { dishesData } from "./data";

import {
  FaShoppingCart,
  FaInfoCircle,
  FaChartBar,
  FaUser,
  FaFire,
  FaLeaf,
  FaDrumstickBite,
  FaStar,
  FaBolt,
  FaShieldAlt,
  FaHome,
} from "react-icons/fa";

import "./Starters.css";

export default function Starters() {
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0);
  const [expandedDescription, setExpandedDescription] = useState({});

  useEffect(() => {
    const cart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];

    setCartCount(cart.length);
  }, []);

  const storageData = (() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem(
            "restaurantDishes"
          )
        ) || dishesData
      );
    } catch {
      return dishesData;
    }
  })();

  const categories = [
    "VEG DRY",
    "VEG WET",
    "NON VEG DRY",
    "NON VEG WET",
  ];

  const toggleDescription = (id) => {
    setExpandedDescription((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const addToCart = (item) => {
    const existingCart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];

    const existingItem =
      existingCart.find(
        (cartItem) =>
          cartItem.id === item.id
      );

    let updatedCart;

    if (existingItem) {
      updatedCart = existingCart.map(
        (cartItem) =>
          cartItem.id === item.id
            ? {
              ...cartItem,
              qty:
                cartItem.qty + 1,
            }
            : cartItem
      );
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: item.id,
          name: item.name,
          category: item.category || item.section || "Starters",
          image: item.image,
          price: item.price,
          qty: 1,
        },
      ];
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    setCartCount(
      updatedCart.length
    );

    toast.success(
      `${item.name} added to cart 🍽️`,
      {
        style: {
          background: "#111",
          color: "#f4c45f",
          border:
            "1px solid #d89a2b"
        }
      }
    );
  };

  return (
    <div
      className="starters-page"
      style={{
        backgroundImage: `url(${starterBg})`,
      }}
    >
      {/* SIDEBAR */}

      <div className="starters-sidebar">
        <img
          src={logo}
          alt="logo"
          className="starters-logo"
        />

        <div className="starters-sidebar-menu">

          <div className="starters-menu-active">
            <FaFire />
            STARTERS
          </div>

          <div
            className="starters-menu-item"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART
          </div>

          <div className="starters-menu-item">
            <FaInfoCircle />
            ABOUT
          </div>

          <div className="starters-menu-item">
            <FaChartBar />
            REPORTS
          </div>

        </div>
      </div>

      {/* MAIN CONTENT */}

      <div className="starters-content">

        {/* TOP BAR */}

        <div className="starters-topbar">

          <button
            className="starters-customer-btn"
            onClick={() =>
              navigate("/home")
            }
          >
            <FaHome />
            &nbsp; HOME
          </button>

          <button
            className="starters-cart-btn"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            &nbsp; CART ({cartCount})
          </button>

        </div>

        {/* TITLE */}

        <div className="main-title">

          <h1>
            STARTERS <span>MENU</span>
          </h1>

          <p>
            Crispy, Flavorful &
            Delicious Appetizers
          </p>

        </div>
        {/* CATEGORY SECTIONS */}

        {categories.map((section) => {

          const dishes = storageData.filter(
            (dish) =>
              dish.section?.toUpperCase() ===
              "STARTERS" &&
              dish.category?.toUpperCase() ===
              section &&
              dish.enabled
          );

          if (dishes.length === 0)
            return null;

          return (
            <div key={section}>

              {/* CATEGORY HEADER */}

              <div
                className={`category-card ${section.startsWith("VEG")
                    ? "veg"
                    : "nonveg"
                  }`}
              >

                <div className="category-icon">
                  {section.startsWith("VEG") ? (
                    <FaLeaf />
                  ) : (
                    <FaDrumstickBite />
                  )}
                </div>

                <div>
                  <h2>{section}</h2>

                  <p>
                    {dishes.length} Dishes
                    Available
                  </p>
                </div>

              </div>

              {/* FOOD GRID */}

              <div className="food-grid">

                {dishes.map((item) => (

                  <div
                    key={item.id}
                    className="food-card"
                  >

                    <div className="card-top">

                      <div className="dish-code">
                        {item.code ||
                          `ST-${item.id}`}
                      </div>

                      {section.startsWith(
                        "VEG"
                      ) ? (
                        <div className="veg-box">
                          <div className="veg-dot"></div>
                        </div>
                      ) : (
                        <div className="nonveg-box">
                          <div className="nonveg-dot"></div>
                        </div>
                      )}

                    </div>

                    <img
                      src={item.image}
                      alt={item.name}
                      className="food-image"
                    />

                    <h3 className="dish-name">
                      {item.name}
                    </h3>

                    <div className="dish-price">
                      ₹{item.price}
                    </div>

                    <button
                      className="add-cart-btn"
                      onClick={() =>
                        toggleDescription(item.id)
                      }
                      style={{
                        marginTop: "10px",
                        background: "#2a2a2a",
                        color: "#f4c45f",
                      }}
                    >
                      {expandedDescription[item.id]
                        ? "Hide Description"
                        : "Description"}
                    </button>

                    {expandedDescription[item.id] && (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "rgba(255,255,255,0.04)",
                          color: "#f0f0f0",
                          fontSize: "13px",
                          lineHeight: "1.5",
                        }}
                      >
                        {item.description || "No description available."}
                      </div>
                    )}

                    <button
                      className="add-cart-btn"
                      onClick={() =>
                        addToCart(item)
                      }
                    >
                      <FaShoppingCart />
                      &nbsp; ADD TO CART
                    </button>

                  </div>

                ))}

              </div>

            </div>
          );
        })}

        {/* FEATURES */}

        <div className="features-section">

          <div className="feature-card">
            <FaStar size={35} />

            <h3>
              Premium Taste
            </h3>

            <p>
              Handpicked ingredients
            </p>
          </div>

          <div className="feature-card">
            <FaBolt size={35} />

            <h3>
              Freshly Prepared
            </h3>

            <p>
              Made fresh every order
            </p>
          </div>

          <div className="feature-card">
            <FaShieldAlt size={35} />

            <h3>
              Quality Assured
            </h3>

            <p>
              Hygienic preparation
            </p>
          </div>

          <div className="feature-card">
            <FaShoppingCart size={35} />

            <h3>
              Quick Service
            </h3>

            <p>
              Fast delivery & pickup
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}