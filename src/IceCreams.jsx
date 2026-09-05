import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "./assets/bg.png";
import icecreamBg from "./assets/icecream_bg.png";
import { dishesData } from "./data";

import {
  FaShoppingCart,
  FaInfoCircle,
  FaChartBar,
  FaUser,
  FaLeaf,
  FaShieldAlt,
  FaHeart,
  FaMotorcycle,
} from "react-icons/fa";

import "./IceCreams.css";

export default function IceCreams() {
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

  const iceCreams = storageData.filter(
    (dish) =>
      dish.section?.toUpperCase() ===
      "ICE CREAMS" &&
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
          category: item.category || item.section || "Ice Creams",
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
      className="icecream-page"
      style={{
        backgroundImage: `url(${icecreamBg})`,
      }}
    >
      <aside className="icecream-sidebar">

        <img
          src={logo}
          alt="logo"
          className="icecream-logo"
        />

        <div className="icecream-sidebar-menu">

          <div className="icecream-menu-active">
            🍦 ICE CREAMS
          </div>

          <div
            className="icecream-menu-item"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART
          </div>

          <div className="icecream-menu-item">
            <FaInfoCircle />
            ABOUT
          </div>

          <div className="icecream-menu-item">
            <FaChartBar />
            REPORTS
          </div>

        </div>

      </aside>

      <main className="icecream-main">

        <div className="icecream-topbar">

          <button
            className="icecream-home-btn"
            onClick={() =>
              navigate("/home")
            }
          >
            🏠 HOME
          </button>

          <div className="icecream-top-buttons">

            <button className="icecream-customer-btn">
              <FaUser />
              CUSTOMER
            </button>

            <button
              className="icecream-cart-btn"
              onClick={() =>
                navigate("/cart")
              }
            >
              <FaShoppingCart />
              CART ({cartCount})
            </button>

          </div>

        </div>

        <div className="icecream-title">

          <h1>
            ICE CREAMS
            <span> MENU</span>
          </h1>

          <p>
            Sweet • Creamy • Irresistible
          </p>

        </div>
        <div className="icecream-grid">

          {iceCreams.length === 0 ? (

            <div className="icecream-empty">
              No Ice Creams Available
            </div>

          ) : (

            iceCreams.map((item) => (

              <div
                key={item.id}
                className="icecream-card"
              >

                <div className="icecream-code">
                  {item.code ||
                    `IC-${item.id}`}
                </div>

                <img
                  src={item.image}
                  alt={item.name}
                  className="icecream-image"
                />

                <h3>
                  {item.name}
                </h3>

                <div className="icecream-price">
                  ₹{item.price}
                </div>

                <button
                  className="icecream-add-btn"
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

        <div className="icecream-features">

          <div className="icecream-feature-card">
            <FaLeaf size={34} />

            <h3>
              Premium Ingredients
            </h3>

            <p>
              Finest milk & flavors
            </p>
          </div>

          <div className="icecream-feature-card">
            <FaShieldAlt size={34} />

            <h3>
              Hygienically Made
            </h3>

            <p>
              Freshly prepared daily
            </p>
          </div>

          <div className="icecream-feature-card">
            <FaHeart size={34} />

            <h3>
              Loved By Everyone
            </h3>

            <p>
              Rich creamy taste
            </p>
          </div>

          <div className="icecream-feature-card">
            <FaMotorcycle size={34} />

            <h3>
              Fast Delivery
            </h3>

            <p>
              Delivered fresh & cold
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}