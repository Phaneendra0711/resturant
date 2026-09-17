import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dishesData } from "./data";

export default function Admin() {
  const [dishes, setDishes] = useState([]);
  const [showCashCoupon, setShowCashCoupon] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [generatedCoupon, setGeneratedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [generatingCoupon, setGeneratingCoupon] = useState(false);

  const navigate = useNavigate();

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================

  useEffect(() => {
    const role = localStorage.getItem("userRole");

    if (role !== "admin") {
      navigate("/staff-login");
    }
  }, [navigate]);

  // ==========================================
  // LOAD DISHES
  // ==========================================

  useEffect(() => {
    const stored =
      localStorage.getItem("restaurantDishes");

    if (stored) {
      setDishes(JSON.parse(stored));
    } else {
      localStorage.setItem(
        "restaurantDishes",
        JSON.stringify(dishesData)
      );

      setDishes(dishesData);
    }
  }, []);

  // ==========================================
  // SAVE DISHES
  // ==========================================

  const saveDishes = (updatedDishes) => {
    setDishes(updatedDishes);

    localStorage.setItem(
      "restaurantDishes",
      JSON.stringify(updatedDishes)
    );
  };

  // ==========================================
  // CHANGE PRICE
  // ==========================================

  const handlePriceChange = (
    id,
    value
  ) => {
    const updated = dishes.map(
      (dish) =>
        dish.id === id
          ? {
            ...dish,
            price: Number(value),
          }
          : dish
    );

    saveDishes(updated);
  };

  // ==========================================
  // HIDE / SHOW DISH
  // ==========================================

  const toggleDish = (id) => {
    const updated = dishes.map(
      (dish) =>
        dish.id === id
          ? {
            ...dish,
            enabled: !dish.enabled,
          }
          : dish
    );

    saveDishes(updated);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("userRole");
    localStorage.removeItem("staffId");
    localStorage.removeItem("staffName");
    localStorage.removeItem("staffUsername");

    navigate("/staff-login");
  };

  const generateCashCoupon = async (event) => {
    event.preventDefault();
    setCouponError("");
    setGeneratingCoupon(true);
    try {
      const response = await fetch("/api/coupons/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(cashAmount), adminId: localStorage.getItem("staffId") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to generate coupon");
      setGeneratedCoupon(data.coupon);
    } catch (error) {
      setCouponError(error.message || "Coupon server is unavailable");
    } finally {
      setGeneratingCoupon(false);
    }
  };

  // ==========================================
  // GROUP DISHES BY SECTION
  // ==========================================

  const groupedDishes =
    dishes.reduce(
      (acc, dish) => {
        const section =
          dish.section || "OTHER";

        if (!acc[section]) {
          acc[section] = [];
        }

        acc[section].push(dish);

        return acc;
      },
      {}
    );

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#050505,#111)",
        color: "white",
        padding: "30px",
      }}
    >

      {showCashCoupon && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.75)", display: "grid", placeItems: "center", padding: 20 }}>
          <form onSubmit={generateCashCoupon} style={{ width: 380, maxWidth: "100%", padding: 26, borderRadius: 16, background: "#171717", border: "1px solid #ffb347" }}>
            <h2 style={{ color: "#ffb347", marginTop: 0 }}>Cash coupon</h2>
            {generatedCoupon ? (
              <div style={{ textAlign: "center", padding: 18, borderRadius: 10, background: "#0e2616" }}>
                <div style={{ fontSize: 32, letterSpacing: 5, fontWeight: 800 }}>{generatedCoupon.code}</div>
                <p style={{ color: "#7ee787" }}>Coupon value: ₹{generatedCoupon.amount}</p>
                <button type="button" onClick={() => setShowCashCoupon(false)} style={{ padding: "10px 18px", border: 0, borderRadius: 8, cursor: "pointer" }}>Done</button>
              </div>
            ) : (
              <>
                <p style={{ color: "#aaa" }}>Enter the cash amount received from the customer.</p>
                <input required type="number" min="1" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="Amount (₹)" style={{ width: "100%", padding: 12, borderRadius: 8, boxSizing: "border-box" }} />
                {couponError && <p style={{ color: "#ff7777", marginBottom: 0 }}>{couponError}</p>}
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button type="submit" disabled={generatingCoupon} style={{ flex: 1, padding: 11, background: "#4caf50", color: "white", border: 0, borderRadius: 8, fontWeight: "bold" }}>{generatingCoupon ? "Generating..." : "Generate code"}</button>
                  <button type="button" onClick={() => setShowCashCoupon(false)} style={{ flex: 1, padding: 11, background: "#444", color: "white", border: 0, borderRadius: 8 }}>Cancel</button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* ======================================
          HEADER
      ====================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "45px",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >

        <h1
          style={{
            color: "#ffb347",
            fontSize: "42px",
            margin: 0,
          }}
        >
          Admin Dashboard
        </h1>

        {/* TOP RIGHT BUTTONS */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >

          {/* PERFORMANCE & ORDERS */}

          <button
            onClick={() =>
              navigate(
                "/admin/performance"
              )
            }
            style={{
              padding:
                "13px 22px",
              background:
                "#ffb347",
              color: "#111",
              border: "none",
              borderRadius:
                "12px",
              fontWeight:
                "bold",
              cursor:
                "pointer",
              fontSize:
                "15px",
            }}
          >
            Performance & Orders
          </button>

          {/* MANAGE STAFF */}

          <button
            onClick={() =>
              navigate(
                "/admin/staff"
              )
            }
            style={{
              padding:
                "13px 22px",
              background:
                "#ffb347",
              color: "#111",
              border: "none",
              borderRadius:
                "12px",
              fontWeight:
                "bold",
              cursor:
                "pointer",
              fontSize:
                "15px",
            }}
          >
            Manage Staff
          </button>

          <button
            onClick={() => { setCashAmount(""); setGeneratedCoupon(null); setCouponError(""); setShowCashCoupon(true); }}
            style={{ padding: "13px 22px", background: "#4caf50", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}
          >
            Cash Coupon
          </button>

          {/* LOGOUT */}

          <button
            onClick={
              handleLogout
            }
            style={{
              padding:
                "13px 22px",
              background:
                "#ff8c00",
              color: "#111",
              border: "none",
              borderRadius:
                "12px",
              fontWeight:
                "bold",
              cursor:
                "pointer",
              fontSize:
                "15px",
            }}
          >
            Logout
          </button>

        </div>
      </div>

      {/* ======================================
          ADMIN OVERVIEW
      ====================================== */}

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          textAlign: "center",
          marginBottom: "55px",
        }}
      >

        <h2
          style={{
            fontSize: "32px",
            marginBottom: "10px",
          }}
        >
          Restaurant Administration
        </h2>

        <p
          style={{
            color: "#888",
            fontSize: "17px",
            marginBottom: "35px",
          }}
        >
          Manage your restaurant
          operations from one place
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",
            gap: "25px",
          }}
        >

          {/* PERFORMANCE CARD */}

          <div
            onClick={() =>
              navigate(
                "/admin/performance"
              )
            }
            style={{
              background:
                "#1b1b1b",
              padding: "32px",
              borderRadius:
                "20px",
              border:
                "1px solid rgba(255,179,71,.18)",
              cursor:
                "pointer",
              transition:
                "transform .2s",
            }}
          >

            <h2
              style={{
                color:
                  "#ffb347",
                marginTop: 0,
              }}
            >
              📊 Performance & Orders
            </h2>

            <p
              style={{
                color:
                  "#999",
                lineHeight:
                  "1.6",
              }}
            >
              View orders, revenue,
              staff performance
              and customer
              feedback.
            </p>

          </div>

          {/* STAFF CARD */}

          <div
            onClick={() =>
              navigate(
                "/admin/staff"
              )
            }
            style={{
              background:
                "#1b1b1b",
              padding: "32px",
              borderRadius:
                "20px",
              border:
                "1px solid rgba(255,179,71,.18)",
              cursor:
                "pointer",
            }}
          >

            <h2
              style={{
                color:
                  "#ffb347",
                marginTop: 0,
              }}
            >
              👥 Manage Staff
            </h2>

            <p
              style={{
                color:
                  "#999",
                lineHeight:
                  "1.6",
              }}
            >
              Add, remove,
              enable, disable
              and manage
              employee accounts.
            </p>

          </div>

        </div>

      </div>

      {/* ======================================
          MENU MANAGEMENT
      ====================================== */}

      <div
        style={{
          borderTop:
            "1px solid rgba(255,179,71,.18)",
          paddingTop:
            "45px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom:
              "35px",
            flexWrap:
              "wrap",
            gap: "15px",
          }}
        >

          <div>

            <h2
              style={{
                color:
                  "#ffb347",
                fontSize:
                  "34px",
                margin:
                  "0 0 8px 0",
              }}
            >
              Menu Management
            </h2>

            <p
              style={{
                color:
                  "#888",
                margin: 0,
              }}
            >
              Change prices and
              control dish availability
            </p>

          </div>

          <div
            style={{
              background:
                "#1b1b1b",
              border:
                "1px solid rgba(255,179,71,.2)",
              padding:
                "12px 20px",
              borderRadius:
                "12px",
              color:
                "#ffb347",
              fontWeight:
                "bold",
            }}
          >
            {dishes.length} Dishes
          </div>

        </div>

        {/* ==================================
            DISH SECTIONS
        ================================== */}

        {Object.entries(
          groupedDishes
        ).map(
          ([
            section,
            sectionDishes,
          ]) => (

            <div
              key={section}
              style={{
                marginBottom:
                  "60px",
              }}
            >

              {/* SECTION HEADER */}

              <div
                style={{
                  background:
                    "linear-gradient(135deg,#8b5a00,#ffb347)",
                  padding:
                    "16px 25px",
                  borderRadius:
                    "15px",
                  fontSize:
                    "28px",
                  fontWeight:
                    "bold",
                  color:
                    "#111",
                  marginBottom:
                    "25px",
                  textTransform:
                    "uppercase",
                }}
              >
                {section} (
                {
                  sectionDishes.length
                }
                )
              </div>

              {/* DISH GRID */}

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill,minmax(300px,1fr))",
                  gap: "25px",
                }}
              >

                {sectionDishes.map(
                  (dish) => (

                    <div
                      key={
                        dish.id
                      }
                      style={{
                        background:
                          "#1d1d1d",
                        borderRadius:
                          "18px",
                        padding:
                          "18px",
                        border:
                          "1px solid rgba(255,179,71,.15)",
                        boxShadow:
                          "0 10px 30px rgba(0,0,0,.2)",
                      }}
                    >

                      {/* IMAGE */}

                      <img
                        src={
                          dish.image
                        }
                        alt={
                          dish.name
                        }
                        style={{
                          width:
                            "100%",
                          height:
                            "200px",
                          objectFit:
                            "contain",
                        }}
                      />

                      {/* NAME */}

                      <h3
                        style={{
                          marginTop:
                            "12px",
                          fontSize:
                            "26px",
                          marginBottom:
                            "12px",
                        }}
                      >
                        {
                          dish.name
                        }
                      </h3>

                      {/* SECTION */}

                      <p>
                        <strong>
                          Section:
                        </strong>{" "}
                        {
                          dish.section
                        }
                      </p>

                      {/* CATEGORY */}

                      <p>
                        <strong>
                          Category:
                        </strong>{" "}
                        {
                          dish.category
                        }
                      </p>

                      {/* AVAILABILITY */}

                      <p
                        style={{
                          marginTop:
                            "12px",
                          color:
                            dish.enabled
                              ? "#4caf50"
                              : "#ff4d4d",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {dish.enabled
                          ? "● Available"
                          : "● Hidden"}
                      </p>

                      {/* PRICE */}

                      <div
                        style={{
                          marginTop:
                            "12px",
                        }}
                      >

                        <label
                          style={{
                            display:
                              "block",
                            marginBottom:
                              "5px",
                            color:
                              "#ddd",
                          }}
                        >
                          Price
                        </label>

                        <input
                          type="number"
                          value={
                            dish.price
                          }
                          onChange={(
                            e
                          ) =>
                            handlePriceChange(
                              dish.id,
                              e.target
                                .value
                            )
                          }
                          style={{
                            width:
                              "100%",
                            padding:
                              "11px",
                            marginTop:
                              "2px",
                            borderRadius:
                              "8px",
                            border:
                              "none",
                            boxSizing:
                              "border-box",
                            fontSize:
                              "16px",
                          }}
                        />

                      </div>

                      {/* HIDE / SHOW */}

                      <button
                        onClick={() =>
                          toggleDish(
                            dish.id
                          )
                        }
                        style={{
                          width:
                            "100%",
                          marginTop:
                            "15px",
                          padding:
                            "14px",
                          border:
                            "none",
                          borderRadius:
                            "10px",
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                          fontSize:
                            "15px",
                          background:
                            dish.enabled
                              ? "#ff4d4d"
                              : "#4caf50",
                          color:
                            "white",
                        }}
                      >
                        {dish.enabled
                          ? "Hide Dish"
                          : "Show Dish"}
                      </button>

                    </div>

                  )
                )}

              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
}
