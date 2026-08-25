import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "./assets/bg.png";
import pizzabg from "./assets/pizzabg.png";
import { dishesData } from "./data";

import {
  FaShoppingCart,
  FaInfoCircle,
  FaChartBar,
  FaUser,
  FaPizzaSlice,
} from "react-icons/fa";

import "./Pizza.css";

export default function Pizza() {
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

  const pizzas = storageData.filter(
    (d) =>
      d.section?.toUpperCase() ===
      "PIZZA" &&
      d.enabled === true
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
      className="pizza-page"
      style={{
        backgroundImage: `url(${pizzabg})`,
      }}
    >
      <aside className="pizza-sidebar">
        <img
          src={logo}
          alt="logo"
          className="pizza-logo"
        />

        <div className="pizza-sidebar-menu">

          <div className="pizza-menu-active">
            <FaPizzaSlice />
            PIZZAS
          </div>

          <div
            className="pizza-menu-item"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART
          </div>

          <div className="pizza-menu-item">
            <FaInfoCircle />
            ABOUT
          </div>

          <div className="pizza-menu-item">
            <FaChartBar />
            REPORTS
          </div>

        </div>
      </aside>

      <main className="pizza-main">

        <header className="pizza-topbar">

          <button
            className="pizza-home-btn"
            onClick={() =>
              navigate("/home")
            }
          >
            🏠 HOME
          </button>

          <button className="pizza-customer-btn">
            <FaUser />
            CUSTOMER
          </button>

          <button
            className="pizza-cart-btn"
            onClick={() =>
              navigate("/cart")
            }
          >
            <FaShoppingCart />
            CART ({cartCount})
          </button>

        </header>

        <section className="pizza-title">
          <h1>
            PIZZA
            <span> MENU</span>
          </h1>
        </section>
        <div className="pizza-grid">

          {pizzas.length === 0 ? (

            <div
              style={{
                color: "#fff",
                textAlign: "center",
                width: "100%",
                fontSize: "24px",
                marginTop: "50px",
              }}
            >
              No pizzas available.
            </div>

          ) : (

            pizzas.map((p) => (
              <div
                key={p.id}
                className="pizza-card"
              >

                <div className="pizza-code">
                  {p.code ||
                    `PZ-${p.id}`}
                </div>

                <img
                  src={p.image}
                  alt={p.name}
                  className="pizza-image"
                />

                <h3>
                  {p.name}
                </h3>

                <div className="pizza-price-row">
                  ₹{p.price}
                </div>

                <button
                  className="pizza-add-btn"
                  onClick={() =>
                    addToCart(p)
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

        <div className="pizza-features">

          <div className="pizza-feature">
            <div className="pizza-feature-icon">
              🍕
            </div>

            <h3>
              Stone Baked
            </h3>

            <p>
              Authentic oven baked
              pizzas
            </p>
          </div>

          <div className="pizza-feature">
            <div className="pizza-feature-icon">
              🧀
            </div>

            <h3>
              Premium Cheese
            </h3>

            <p>
              Rich mozzarella and
              fresh toppings
            </p>
          </div>

          <div className="pizza-feature">
            <div className="pizza-feature-icon">
              👨‍🍳
            </div>

            <h3>
              Expert Chefs
            </h3>

            <p>
              Handcrafted with care
            </p>
          </div>

          <div className="pizza-feature">
            <div className="pizza-feature-icon">
              🚚
            </div>

            <h3>
              Fast Delivery
            </h3>

            <p>
              Hot & fresh at your
              doorstep
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}