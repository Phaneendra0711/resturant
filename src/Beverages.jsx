import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "./assets/bg.png";
import beveragebg from "./assets/beveragebg.png";
import { dishesData } from "./data";

import {
  FaShoppingCart,
  FaInfoCircle,
  FaChartBar,
  FaUser,
  FaGlassWhiskey,
} from "react-icons/fa";

import "./Beverages.css";

export default function Beverages() {
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(
    JSON.parse(localStorage.getItem("cart"))
      ?.length || 0
  );
  const [expandedDescription, setExpandedDescription] = useState({});

  const storageData =
    JSON.parse(
      localStorage.getItem(
        "restaurantDishes"
      )
    ) || dishesData;

  const beverages = storageData.filter(
    (dish) =>
      dish.section?.toUpperCase() ===
      "BEVERAGES" &&
      dish.enabled === true
  );

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
          category: item.category || "Beverages",
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
      className="beverage-page"
      style={{
        backgroundImage: `url(${beveragebg})`,
      }}
    >
      {/* SIDEBAR */}

      <aside className="beverage-sidebar">

        <img
          src={logo}
          alt="logo"
          className="beverage-logo"
        />

        <div className="beverage-sidebar-menu">

          <div className="beverage-menu-active">
            <FaGlassWhiskey />
            BEVERAGES
          </div>

          <div
            className="beverage-menu-item"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART
          </div>

          <div className="beverage-menu-item">
            <FaInfoCircle />
            ABOUT
          </div>

          <div className="beverage-menu-item">
            <FaChartBar />
            REPORTS
          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="beverage-main">

        <div className="beverage-topbar">

          <button
            className="beverage-home-btn"
            onClick={() =>
              navigate("/home")
            }
          >
            🏠 HOME
          </button>

          <div className="beverage-top-buttons">

            <button className="beverage-customer-btn">
              <FaUser />
              CUSTOMER
            </button>

            <button
              className="beverage-cart-btn"
              onClick={() =>
                navigate("/cart")
              }
            >
              <FaShoppingCart />
              CART ({cartCount})
            </button>

          </div>

        </div>

        <div className="beverage-title">

          <h1>
            BEVERAGES
          </h1>

          <p>
            Sip Freshness • Feel The Goodness
          </p>

        </div>
        <div className="beverage-grid">

          {beverages.length === 0 ? (

            <div className="beverage-empty">
              No Beverages Available
            </div>

          ) : (

            beverages.map((item) => (

              <div
                key={item.id}
                className="beverage-card"
              >

                <div className="beverage-code">
                  {item.code ||
                    `BV-${item.id}`}
                </div>

                <img
                  src={item.image}
                  alt={item.name}
                  className="beverage-image"
                />

                <h3>
                  {item.name}
                </h3>

                <div className="beverage-price">
                  ₹{item.price}
                </div>

                <button
                  className="beverage-add-btn"
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
                  className="beverage-add-btn"
                  onClick={() =>
                    addToCart(item)
                  }
                >
                  <FaShoppingCart />
                  &nbsp; ADD TO CART
                </button>

              </div>

            ))

          )}

        </div>

        {/* FEATURES */}

        <div className="beverage-features">

          <div className="beverage-feature">
            🥤
            <h3>
              Fresh Drinks
            </h3>

            <p>
              Made fresh every day
            </p>
          </div>

          <div className="beverage-feature">
            🌿
            <h3>
              Natural Ingredients
            </h3>

            <p>
              Premium quality ingredients
            </p>
          </div>

          <div className="beverage-feature">
            ⭐
            <h3>
              Best Taste
            </h3>

            <p>
              Refreshing flavours
            </p>
          </div>

          <div className="beverage-feature">
            🚚
            <h3>
              Fast Service
            </h3>

            <p>
              Quick preparation
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}