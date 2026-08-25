import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "./assets/bg.png";
import burgerbg from "./assets/burgerbg.png";

import {
  FaShoppingCart,
  FaInfoCircle,
  FaChartBar,
  FaUser,
  FaHamburger,
} from "react-icons/fa";

import { dishesData } from "./data";
import "./Burger.css";

export default function Burger() {
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(
    JSON.parse(localStorage.getItem("cart"))
      ?.length || 0
  );

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

  const burgers = storageData.filter(
    (dish) =>
      dish.section?.toUpperCase() ===
      "BURGERS" &&
      dish.enabled
  );

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
      className="burger-page"
      style={{
        backgroundImage: `url(${burgerbg})`,
      }}
    >
      {/* SIDEBAR */}

      <aside className="burger-sidebar">

        <img
          src={logo}
          alt="logo"
          className="burger-logo"
        />

        <div className="burger-sidebar-menu">

          <div className="burger-menu-active">
            <FaHamburger />
            BURGERS
          </div>

          <div
            className="burger-menu-item"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART
          </div>

          <div className="burger-menu-item">
            <FaInfoCircle />
            ABOUT
          </div>

          <div className="burger-menu-item">
            <FaChartBar />
            REPORTS
          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="burger-main">

        {/* TOPBAR */}

        <div className="burger-topbar">

          <button
            className="burger-home-btn"
            onClick={() =>
              navigate("/home")
            }
          >
            🏠 HOME
          </button>

          <div className="burger-top-buttons">

            <button className="burger-customer-btn">
              <FaUser />
              CUSTOMER
            </button>

            <button
              className="burger-cart-btn"
              onClick={() =>
                navigate("/cart")
              }
            >
              <FaShoppingCart />
              CART ({cartCount})
            </button>

          </div>

        </div>

        {/* TITLE */}

        <div className="burger-title">

          <h1>
            BURGERS
            <span> MENU</span>
          </h1>

          <p>
            Gourmet Burgers • Premium Ingredients • Signature Taste
          </p>

        </div>
        {/* GRID */}

        <div className="burger-grid">

          {burgers.length === 0 ? (

            <div className="burger-empty">
              No Burgers Available
            </div>

          ) : (

            burgers.map((item) => (

              <div
                key={item.id}
                className="burger-card"
              >

                <div className="burger-code">
                  {item.code ||
                    `BG-${item.id}`}
                </div>

                <img
                  src={item.image}
                  alt={item.name}
                  className="burger-image"
                />

                <h3>
                  {item.name}
                </h3>

                <div className="burger-price-row">
                  ₹{item.price}
                </div>

                <button
                  className="burger-add-btn"
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

        <div className="burger-features">

          <div className="burger-feature">
            🌿
            <h3>
              Fresh Ingredients
            </h3>

            <p>
              Always fresh &
              quality ingredients
            </p>
          </div>

          <div className="burger-feature">
            🛡️
            <h3>
              Hygienic Preparation
            </h3>

            <p>
              Cooked with care &
              hygiene
            </p>
          </div>

          <div className="burger-feature">
            ⭐
            <h3>
              Best In Taste
            </h3>

            <p>
              Rich flavors &
              premium recipes
            </p>
          </div>

          <div className="burger-feature">
            🛵
            <h3>
              Fast Service
            </h3>

            <p>
              Quick preparation &
              delivery
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}