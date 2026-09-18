import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "./assets/bg.png";
import saladbg from "./assets/saladbg.png";
import { dishesData } from "./data";

import {
  FaShoppingCart,
  FaInfoCircle,
  FaChartBar,
  FaUser,
  FaLeaf,
} from "react-icons/fa";

import "./Salads.css";

export default function Salads() {
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

  const salads = storageData.filter(
    (dish) =>
      dish.section?.toUpperCase() ===
      "SALADS" &&
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
          category: item.category || item.section || "Salads",
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
      className="salad-page"
      style={{
        backgroundImage: `url(${saladbg})`,
      }}
    >
      <aside className="salad-sidebar">

        <img
          src={logo}
          alt="logo"
          className="salad-logo"
        />

        <div className="salad-sidebar-menu">

          <div className="salad-menu-active">
            <FaLeaf />
            SALADS
          </div>

          <div
            className="salad-menu-item"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART
          </div>

          <div className="salad-menu-item">
            <FaInfoCircle />
            ABOUT
          </div>

          <div className="salad-menu-item">
            <FaChartBar />
            REPORTS
          </div>

        </div>

      </aside>

      <main className="salad-main">

        <div className="salad-topbar">

          <button
            className="salad-home-btn"
            onClick={() =>
              navigate("/home")
            }
          >
            🏠 HOME
          </button>

          <div className="salad-top-buttons">

            <button className="salad-customer-btn">
              <FaUser />
              CUSTOMER
            </button>

            <button
              className="salad-cart-btn"
              onClick={() =>
                navigate("/cart")
              }
            >
              <FaShoppingCart />
              CART ({cartCount})
            </button>

          </div>

        </div>

        <div className="salad-title">

          <h1>
            SALADS
            <span> MENU</span>
          </h1>

          <p>
            Fresh • Healthy • Delicious
          </p>

        </div>
        <div className="salad-grid">

          {salads.length === 0 ? (

            <div className="salad-empty">
              No Salads Available
            </div>

          ) : (

            salads.map((item) => (

              <div
                key={item.id}
                className="salad-card"
              >

                <div className="salad-code">
                  {item.code ||
                    `SL-${item.id}`}
                </div>

                <img
                  src={item.image}
                  alt={item.name}
                  className="salad-image"
                />

                <h3>
                  {item.name}
                </h3>

                <div className="salad-price">
                  ₹{item.price}
                </div>

                <button
                  className="salad-add-btn"
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
                  className="salad-add-btn"
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

        <div className="salad-features">

          <div className="salad-feature">
            🥗
            <h3>
              Fresh Ingredients
            </h3>

            <p>
              Handpicked vegetables
            </p>
          </div>

          <div className="salad-feature">
            🌿
            <h3>
              Healthy Choice
            </h3>

            <p>
              Rich in nutrition
            </p>
          </div>

          <div className="salad-feature">
            ⭐
            <h3>
              Premium Taste
            </h3>

            <p>
              Balanced flavours
            </p>
          </div>

          <div className="salad-feature">
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