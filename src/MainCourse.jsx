import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "./assets/bg.png";
import mainCourseBg from "./assets/maincourse_bg.png";
import { dishesData } from "./data";

import {
  FaShoppingCart,
  FaInfoCircle,
  FaChartBar,
  FaUser,
  FaLeaf,
  FaDrumstickBite,
} from "react-icons/fa";

import "./MainCourse.css";

export default function MainCourse() {
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(
    JSON.parse(localStorage.getItem("cart"))
      ?.length || 0
  );
  const [expandedDescription, setExpandedDescription] = useState({});

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

  const categories = ["VEG", "NON VEG"];

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
          category: item.section || "MAIN COURSE",
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
      className="maincourse-page"
      style={{
        backgroundImage: `url(${mainCourseBg})`,
      }}
    >
      {/* SIDEBAR */}

      <div className="maincourse-sidebar">
        <img
          src={logo}
          alt="logo"
          className="maincourse-logo"
        />

        <div className="maincourse-sidebar-menu">
          <div className="maincourse-menu-active">
            🍛 MAIN COURSE
          </div>

          <div
            className="maincourse-menu-item"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART
          </div>

          <div className="maincourse-menu-item">
            <FaInfoCircle />
            ABOUT
          </div>

          <div className="maincourse-menu-item">
            <FaChartBar />
            REPORTS
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}

      <div className="maincourse-content">

        {/* TOP BAR */}

        <div className="maincourse-topbar">

          <button
            className="maincourse-home-btn"
            onClick={() =>
              navigate("/home")
            }
          >
            🏠 HOME
          </button>

          <button className="maincourse-customer-btn">
            <FaUser />
            &nbsp; CUSTOMER
          </button>

          <button
            className="maincourse-cart-btn"
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
            MAIN COURSE
            <span> MENU</span>
          </h1>

          <p>
            Authentic Biryanis &
            Signature Main Courses
          </p>
        </div>
        {/* CATEGORY SECTIONS */}

        {categories.map((section) => {
          const dishes =
            storageData.filter(
              (dish) =>
                dish.section?.toUpperCase() ===
                "MAIN COURSE" &&
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
                className={`category-card ${section === "VEG"
                    ? "veg"
                    : "nonveg"
                  }`}
              >
                <div className="category-icon">
                  {section === "VEG" ? (
                    <FaLeaf />
                  ) : (
                    <FaDrumstickBite />
                  )}
                </div>

                <div>
                  <h2>
                    {section} BIRIYANI
                  </h2>

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
                    <div className="dish-code">
                      {item.code ||
                        `MC-${item.id}`}
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
            <div className="feature-icon">
              🍲
            </div>

            <h3>
              Authentic Recipes
            </h3>

            <p>
              Traditional taste,
              royal touch
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🌿
            </div>

            <h3>
              Premium Ingredients
            </h3>

            <p>
              Freshly selected
              ingredients
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              👨‍🍳
            </div>

            <h3>
              Cooked With Care
            </h3>

            <p>
              Crafted by skilled chefs
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              ⭐
            </div>

            <h3>
              Best In Taste
            </h3>

            <p>
              Authentic biryani
              flavours
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              🚚
            </div>

            <h3>
              Fast Delivery
            </h3>

            <p>
              Quick delivery &
              pickup
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}