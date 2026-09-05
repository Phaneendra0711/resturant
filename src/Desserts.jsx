import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "./assets/bg.png";
import dessertBg from "./assets/dessertbg.png";
import { dishesData } from "./data";

import {
  FaShoppingCart,
  FaInfoCircle,
  FaChartBar,
  FaUser,
  FaLeaf,
  FaShieldAlt,
  FaStar,
  FaMotorcycle,
} from "react-icons/fa";

import "./Desserts.css";

export default function Desserts() {
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(
    JSON.parse(localStorage.getItem("cart"))
      ?.length || 0
  );

  const storageData =
    JSON.parse(
      localStorage.getItem(
        "restaurantDishes"
      )
    ) || dishesData;

  const desserts = storageData.filter(
    (dish) =>
      dish.section?.toUpperCase() ===
      "DESSERTS" &&
      dish.enabled === true
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
          category: item.category || item.section || "Desserts",
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
      className="dessert-page"
      style={{
        backgroundImage: `url(${dessertBg})`,
      }}
    >
      <aside className="dessert-sidebar">

        <img
          src={logo}
          alt="Logo"
          className="dessert-logo"
        />

        <div className="dessert-sidebar-menu">

          <div className="dessert-menu-active">
            🍰 DESSERTS
          </div>

          <div
            className="dessert-menu-item"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART
          </div>

          <div className="dessert-menu-item">
            <FaInfoCircle />
            ABOUT
          </div>

          <div className="dessert-menu-item">
            <FaChartBar />
            REPORTS
          </div>

        </div>

      </aside>

      <main className="dessert-main">

        <div className="dessert-topbar">

          <button
            className="dessert-home-btn"
            onClick={() =>
              navigate("/home")
            }
          >
            🏠 HOME
          </button>

          <div className="dessert-top-buttons">

            <button className="dessert-customer-btn">
              <FaUser />
              CUSTOMER
            </button>

            <button
              className="dessert-cart-btn"
              onClick={() =>
                navigate("/cart")
              }
            >
              <FaShoppingCart />
              CART ({cartCount})
            </button>

          </div>

        </div>

        <div className="dessert-title">

          <h1>
            DESSERTS
            <span> MENU</span>
          </h1>

          <p>
            Sweet Moments • Perfect Endings
          </p>

        </div>
        {/* DESSERT GRID */}

        <div className="dessert-grid">

          {desserts.length === 0 ? (

            <div className="dessert-empty">
              No Dessert Items Available
            </div>

          ) : (

            desserts.map((item) => (

              <div
                key={item.id}
                className="dessert-card"
              >

                <div className="dessert-code">
                  {item.code ||
                    `DS-${item.id}`}
                </div>

                <img
                  src={item.image}
                  alt={item.name}
                  className="dessert-image"
                />

                <h3>
                  {item.name}
                </h3>

                <div className="dessert-price">
                  ₹{item.price}
                </div>

                <button
                  className="dessert-add-btn"
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

        <div className="dessert-features">

          <div className="dessert-feature">
            <FaLeaf size={34} />

            <h3>
              Premium Ingredients
            </h3>

            <p>
              Finest quality ingredients
            </p>
          </div>

          <div className="dessert-feature">
            <FaShieldAlt size={34} />

            <h3>
              Hygienic Preparation
            </h3>

            <p>
              Prepared with care
            </p>
          </div>

          <div className="dessert-feature">
            <FaStar size={34} />

            <h3>
              Irresistible Taste
            </h3>

            <p>
              Rich & delightful flavors
            </p>
          </div>

          <div className="dessert-feature">
            <FaMotorcycle size={34} />

            <h3>
              Fast Delivery
            </h3>

            <p>
              Quick delivery service
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}