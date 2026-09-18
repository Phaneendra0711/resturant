import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dishesData } from "./data";

export default function Admin() {
  const [dishes, setDishes] = useState([]);
  const [showCashCoupon, setShowCashCoupon] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [generatedCoupon, setGeneratedCoupon] = useState(null);
  const [couponReceipt, setCouponReceipt] = useState(null);
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

  const normalizeDish = (dish) => ({
    ...dish,
    description: typeof dish.description === "string" ? dish.description : "",
  });

  const saveDishes = (updatedDishes) => {
    const normalized = (updatedDishes || []).map(normalizeDish);
    setDishes(normalized);

    localStorage.setItem(
      "restaurantDishes",
      JSON.stringify(normalized)
    );
  };

  const saveDish = (dishId, draftDish) => {
    const updated = dishes.map((dish) =>
      dish.id === dishId ? { ...dish, ...draftDish } : dish
    );
    saveDishes(updated);
  };

  const handleDishFieldChange = (id, field, value) => {
    const updated = dishes.map((dish) =>
      dish.id === id ? { ...dish, [field]: value } : dish
    );
    setDishes(updated);
  };

  // ==========================================
  // CHANGE PRICE
  // ==========================================

  const handlePriceChange = (
    id,
    value
  ) => {
    handleDishFieldChange(id, "price", Number(value));
  };

  const handleDescriptionChange = (
    id,
    value
  ) => {
    handleDishFieldChange(id, "description", value);
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

    setDishes(updated);
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

  const sanitizeWholeAmount = (value) => {
    if (value === "") return "";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "";
    return String(Math.trunc(numeric));
  };

  const resetCouponModal = () => {
    setGeneratedCoupon(null);
    setCouponReceipt(null);
    setCouponError("");
    setCashAmount("");
    setCustomerName("");
    setTableNumber("");
  };

  const formatReceiptTime = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generateCashCoupon = async (event) => {
    event.preventDefault();
    setCouponError("");

    const trimmedName = customerName.trim();
    const trimmedTable = tableNumber.toString().trim();
    const normalizedAmount = Number(cashAmount);
    const normalizedTable = Number(trimmedTable);

    if (!trimmedName) {
      setCouponError("Customer name is required");
      return;
    }

    if (!trimmedTable || !Number.isInteger(normalizedTable) || normalizedTable < 1 || normalizedTable > 30) {
      setCouponError("Select a table number from 1 to 30");
      return;
    }

    if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
      setCouponError("Enter a whole positive cash amount");
      return;
    }

    setGeneratingCoupon(true);
    try {
      const response = await fetch("/api/coupons/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: normalizedAmount,
          customerName: trimmedName,
          tableNumber: normalizedTable,
          adminId: localStorage.getItem("staffId"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to generate coupon");
      setGeneratedCoupon(data.coupon);
      setCouponReceipt({
        code: data.coupon.code,
        amount: data.coupon.amount,
        customerName: trimmedName,
        tableNumber: trimmedTable,
        createdAt: new Date().toISOString(),
      });
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
          <form onSubmit={generateCashCoupon} style={{ width: 420, maxWidth: "100%", padding: 26, borderRadius: 16, background: "#171717", border: "1px solid #ffb347" }}>
            <h2 style={{ color: "#ffb347", marginTop: 0 }}>Cash coupon</h2>
            {generatedCoupon && couponReceipt ? (
              <div style={{ textAlign: "left", padding: 18, borderRadius: 12, background: "#0f1f14", border: "1px solid rgba(126,231,135,.35)" }}>
                <div style={{ textAlign: "center", fontWeight: 800, letterSpacing: 2, color: "#ffd27d", marginBottom: 18 }}>COUPON RECEIPT</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ color: "#bbb" }}>Code</span><strong style={{ letterSpacing: 2 }}>{couponReceipt.code}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ color: "#bbb" }}>Amount</span><strong>₹{couponReceipt.amount}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ color: "#bbb" }}>Customer</span><strong>{couponReceipt.customerName}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ color: "#bbb" }}>Table No</span><strong>{couponReceipt.tableNumber}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ color: "#bbb" }}>Time</span><strong>{formatReceiptTime(couponReceipt.createdAt)}</strong></div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => { resetCouponModal(); setShowCashCoupon(false); }} style={{ flex: 1, padding: "10px 18px", border: 0, borderRadius: 8, cursor: "pointer", background: "#4caf50", color: "white", fontWeight: "bold" }}>Done</button>
                  <button type="button" onClick={() => window.print()} style={{ flex: 1, padding: "10px 18px", border: 0, borderRadius: 8, cursor: "pointer", background: "#ffb347", color: "#111", fontWeight: "bold" }}>Print</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: "#aaa" }}>Enter customer details and amount to generate the cash coupon.</p>
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" style={{ width: "100%", padding: 12, borderRadius: 8, boxSizing: "border-box", marginBottom: 10 }} />
                <select required value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, boxSizing: "border-box", marginBottom: 10, background: "#111", color: "white" }}>
                  <option value="">Select table number</option>
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <input required type="number" min="1" step="1" value={cashAmount} onChange={(e) => setCashAmount(sanitizeWholeAmount(e.target.value))} placeholder="Amount (₹)" style={{ width: "100%", padding: 12, borderRadius: 8, boxSizing: "border-box" }} />
                {couponError && <p style={{ color: "#ff7777", marginBottom: 0 }}>{couponError}</p>}
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button type="submit" disabled={generatingCoupon} style={{ flex: 1, padding: 11, background: "#4caf50", color: "white", border: 0, borderRadius: 8, fontWeight: "bold" }}>{generatingCoupon ? "Generating..." : "Generate code"}</button>
                  <button type="button" onClick={() => { resetCouponModal(); setShowCashCoupon(false); }} style={{ flex: 1, padding: 11, background: "#444", color: "white", border: 0, borderRadius: 8 }}>Cancel</button>
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
          <button
            onClick={() => navigate("/admin/performance")}
            style={{
              padding: "13px 22px",
              background: "#ffb347",
              color: "#111",
              border: "none",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            Performance & Orders
          </button>

          <button
            onClick={() => navigate("/admin/staff")}
            style={{
              padding: "13px 22px",
              background: "#ffb347",
              color: "#111",
              border: "none",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            Manage Staff
          </button>

          <button
            onClick={() => { setCashAmount(""); setCustomerName(""); setTableNumber(""); setGeneratedCoupon(null); setCouponReceipt(null); setCouponError(""); setShowCashCoupon(true); }}
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

                      {/* DESCRIPTION */}

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
                          Description
                        </label>

                        <textarea
                          value={
                            dish.description || ""
                          }
                          onChange={(e) => handleDescriptionChange(dish.id, e.target.value)}
                          placeholder="Add short dish description"
                          rows={3}
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
                              "15px",
                            resize:
                              "vertical",
                            background:
                              "#111",
                            color:
                              "white",
                          }}
                        />

                      </div>

                      {/* HIDE / SHOW */}

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "15px",
                        }}
                      >
                        <button
                          onClick={() =>
                            toggleDish(
                              dish.id
                            )
                          }
                          style={{
                            flex: 1,
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

                        <button
                          onClick={() =>
                            saveDish(dish.id, {
                              price: Number(dish.price),
                              description: String(dish.description || ""),
                              enabled: Boolean(dish.enabled),
                            })
                          }
                          style={{
                            flex: 1,
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
                              "#ffb347",
                            color:
                              "#111",
                          }}
                        >
                          Save
                        </button>
                      </div>

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
