import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import logo from "./assets/bg.png";
import cartBg from "./assets/cart_bg.png";

import {
  FaShoppingCart,
  FaTrash,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaAward,
  FaHeadset,
  FaMotorcycle,
  FaArrowRight,
  FaSyncAlt,
} from "react-icons/fa";

import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] =
    useState([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [chefDescription, setChefDescription] = useState("");
  const [waiterDescription, setWaiterDescription] = useState("");

  useEffect(() => {
    const savedCart =
      JSON.parse(
        localStorage.getItem("cart")
      ) || [];

    setCartItems(savedCart);
  }, []);

  const increaseQty = (id) => {

    const updatedCart =
      cartItems.map((item) =>
        item.id === id
          ? {
            ...item,
            qty: item.qty + 1,
          }
          : item
      );

    setCartItems(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
  };

  const decreaseQty = (id) => {

    const updatedCart =
      cartItems.map((item) =>
        item.id === id &&
          item.qty > 1
          ? {
            ...item,
            qty: item.qty - 1,
          }
          : item
      );

    setCartItems(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
  };

  const removeItem = (id) => {

    const updatedCart =
      cartItems.filter(
        (item) => item.id !== id
      );

    setCartItems(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
  };

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + item.price * item.qty,
    0
  );

  const gst =
    Math.round(subtotal * 0.05);

  const serviceCharge =
    Math.round(subtotal * 0.05);

  const total =
    subtotal +
    gst +
    serviceCharge;

  const handlePlaceOrder = async () => {
    const trimmedName = customerName.trim();

    if (!trimmedName) {
      alert("Please enter your name before placing the order.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Cart is empty");
      return;
    }

    const orderData = {
      customerName: customerName.trim(),

      items: cartItems.map((item) => ({
        name: item.name,
        category: item.category || "",
        price: item.price,
        quantity: item.qty,
        image: item.image || "",
      })),

      totalAmount: total,

      paymentStatus: "PAID",
      paymentMethod: "DEMO",

      amountPaid: total,
      paidAt: new Date(),

      tableNumber: tableNumber,
      couponCode: couponCode.trim(),
      chefDescription: chefDescription.trim(),
      waiterDescription: waiterDescription.trim(),
    };

    try {
      const response = await fetch(
        "/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();

      console.log(
        "ORDER SAVED TO MONGODB:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to create order"
        );
      }

      // MongoDB-created order
      const mongoOrder = data.order;

      // Save the MongoDB order ID locally
      localStorage.setItem(
        "activeOrderId",
        mongoOrder._id
      );

      // Keep all customer orders locally
      const existingOrders =
        JSON.parse(
          localStorage.getItem("orders")
        ) || [];

      existingOrders.push(
        mongoOrder
      );

      localStorage.setItem(
        "orders",
        JSON.stringify(
          existingOrders
        )
      );

      // Clear cart
      localStorage.removeItem("cart");

      setCartItems([]);

      alert(
        "Order Placed Successfully"
      );

      navigate("/status");

    } catch (error) {
      console.error(
        "MONGODB ORDER ERROR:",
        error
      );

      alert(
        "Order could not be saved. Please try again."
      );
    }
  };
  return (
    <div
      className="cart-page"
      style={{
        backgroundImage: `url(${cartBg})`,
      }}
    >
      <div className="cart-header">

        <img
          src={logo}
          alt="logo"
          className="cart-logo"
        />

        <div className="cart-brand">

          <h1>ORDER NOW</h1>

          <div className="brand-line"></div>

          <h2>EAT NOW</h2>

          <div className="cart-nav">

            <span
              onClick={() =>
                navigate("/home")
              }
            >
              HOME
            </span>

            <span
              onClick={() =>
                navigate("/home")
              }
            >
              MENU
            </span>

            <span className="active-nav">
              CART
            </span>

            <span>
              ABOUT US
            </span>

            <span>
              CONTACT
            </span>

          </div>

        </div>

        <div className="cart-top-buttons">

          <div className="cart-mini-btn">

            <FaShoppingCart />

            <div>
              <p>CART</p>

              <span>
                ₹{subtotal}
              </span>
            </div>

            <div className="cart-count">
              {cartItems.reduce(
                (sum, item) =>
                  sum + item.qty,
                0
              )}
            </div>

          </div>

        </div>

      </div>

      <div className="cart-title">

        <h1>YOUR CART</h1>

        <p>
          Review your items and proceed
          to billing
        </p>

      </div>

      <div className="cart-container">

        <div className="cart-left">

          <div className="cart-table-header">
            <span>ITEM</span>
            <span>PRICE</span>
            <span>QUANTITY</span>
            <span>TOTAL</span>
          </div>

          {cartItems.length === 0 ? (

            <div
              style={{
                padding: "80px",
                textAlign: "center",
                color: "#fff",
                fontSize: "24px",
              }}
            >
              Your cart is empty
            </div>

          ) : (

            cartItems.map((item) => (

              <div
                key={item.id}
                className="cart-item"
              >

                <div className="item-info">

                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <div>
                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      Freshly prepared
                      restaurant dish
                    </p>
                  </div>

                </div>

                <div className="item-price">
                  ₹{item.price}
                </div>

                <div className="qty-box">

                  <button
                    onClick={() =>
                      decreaseQty(item.id)
                    }
                  >
                    <FaMinus />
                  </button>

                  <span>
                    {item.qty}
                  </span>

                  <button
                    onClick={() =>
                      increaseQty(item.id)
                    }
                  >
                    <FaPlus />
                  </button>

                </div>

                <div className="item-total">
                  ₹
                  {item.price *
                    item.qty}
                </div>

                <button
                  className="delete-btn"
                  onClick={() =>
                    removeItem(item.id)
                  }
                >
                  <FaTrash />
                </button>

              </div>

            ))

          )}

          <div className="cart-actions">

            <button
              className="continue-btn"
              onClick={() =>
                navigate("/home")
              }
            >
              Continue Shopping
            </button>

            <button
              className="update-btn"
              onClick={() =>
                localStorage.setItem(
                  "cart",
                  JSON.stringify(
                    cartItems
                  )
                )
              }
            >
              <FaSyncAlt />
              Update Cart
            </button>

          </div>

        </div>

        <div className="cart-right">

          <div className="summary-card">

            <h2>
              ORDER SUMMARY
            </h2>

            <div className="summary-line"></div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>
                ₹{subtotal}
              </span>
            </div>

            <div className="summary-row">
              <span>
                GST (5%)
              </span>
              <span>
                ₹{gst}
              </span>
            </div>

            <div className="summary-row">
              <span>
                Service Charge (5%)
              </span>
              <span>
                ₹{serviceCharge}
              </span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>
                GRAND TOTAL
              </span>

              <span>
                ₹{total}
              </span>
            </div>
            <div
              style={{
                marginTop: "25px",
                marginBottom: "20px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                CUSTOMER NAME
              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
                placeholder="Enter your name"
                maxLength={50}
                style={{
                  width: "100%",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  border: "1px solid rgba(216,154,43,.6)",
                  background: "rgba(0,0,0,.35)",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                TABLE NUMBER
              </label>

              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  border: "1px solid rgba(216,154,43,.6)",
                  background: "#111",
                  color: tableNumber ? "#fff" : "#888",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                <option value="">Select your table</option>

                {Array.from({ length: 30 }, (_, index) => (
                  <option
                    key={index + 1}
                    value={String(index + 1)}
                  >
                    Table {index + 1}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                COUPON CODE{" "}
                <span
                  style={{
                    color: "#777",
                    fontWeight: "400",
                  }}
                >
                  (OPTIONAL)
                </span>
              </label>

              <input
                type="text"
                value={couponCode}
                onChange={(e) =>
                  setCouponCode(e.target.value)
                }
                placeholder="Enter coupon code"
                maxLength={30}
                style={{
                  width: "100%",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  border: "1px solid rgba(216,154,43,.6)",
                  background: "rgba(0,0,0,.35)",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                DESCRIPTION TO CHEF{" "}
                <span
                  style={{
                    color: "#777",
                    fontWeight: "400",
                  }}
                >
                  (OPTIONAL)
                </span>
              </label>

              <textarea
                value={chefDescription}
                onChange={(e) =>
                  setChefDescription(e.target.value)
                }
                placeholder="Example: Less spicy, no onions, extra crispy..."
                maxLength={250}
                rows={3}
                style={{
                  width: "100%",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  border: "1px solid rgba(216,154,43,.6)",
                  background: "rgba(0,0,0,.35)",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div
              style={{
                marginBottom: "22px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                DESCRIPTION TO WAITER{" "}
                <span
                  style={{
                    color: "#777",
                    fontWeight: "400",
                  }}
                >
                  (OPTIONAL)
                </span>
              </label>

              <textarea
                value={waiterDescription}
                onChange={(e) =>
                  setWaiterDescription(e.target.value)
                }
                placeholder="Example: Bring extra plates, serve after 10 minutes..."
                maxLength={250}
                rows={3}
                style={{
                  width: "100%",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  border: "1px solid rgba(216,154,43,.6)",
                  background: "rgba(0,0,0,.35)",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <button
              className="checkout-btn"
              onClick={handlePlaceOrder}
            >
              PROCEED TO BILLING
              <FaArrowRight />
            </button>
            <div className="payment-title">
              PAYMENT METHODS
            </div>

            <div className="payment-icons">
              <div>VISA</div>
              <div>MC</div>
              <div>AMEX</div>
              <div>UPI</div>
              <div>PAY</div>
            </div>

          </div>

        </div>

      </div>

      <div className="cart-features">

        <div className="feature-box">
          <FaMotorcycle className="feature-icon" />

          <div>
            <h3>
              TABLE SERVICE
            </h3>

            <p>
              Premium restaurant
              experience
            </p>
          </div>
        </div>

        <div className="feature-box">
          <FaAward className="feature-icon" />

          <div>
            <h3>
              BEST QUALITY
            </h3>

            <p>
              Premium ingredients
            </p>
          </div>
        </div>

        <div className="feature-box">
          <FaShieldAlt className="feature-icon" />

          <div>
            <h3>
              SECURE PAYMENT
            </h3>

            <p>
              Safe & trusted billing
            </p>
          </div>
        </div>

        <div className="feature-box">
          <FaHeadset className="feature-icon" />

          <div>
            <h3>
              24/7 SUPPORT
            </h3>

            <p>
              Always here to help
            </p>
          </div>
        </div>

      </div>

      <div className="cart-footer">
        © 2026 Order Now Eat Now.
        All Rights Reserved.
      </div>

    </div>
  );
}
