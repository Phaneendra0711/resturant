import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dishesData } from "./data";
import "./Admin.css";

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

  /* =====================================================
     ADMIN AUTHENTICATION
  ===================================================== */

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");

    if (role !== "admin") {
      navigate("/staff-login");
    }
  }, [navigate]);

  /* =====================================================
     LOAD DISHES
  ===================================================== */

  useEffect(() => {
    const stored = localStorage.getItem("restaurantDishes");

    if (stored) {
      try {
        setDishes(JSON.parse(stored));
      } catch {
        localStorage.setItem(
          "restaurantDishes",
          JSON.stringify(dishesData)
        );
        setDishes(dishesData);
      }
    } else {
      localStorage.setItem(
        "restaurantDishes",
        JSON.stringify(dishesData)
      );

      setDishes(dishesData);
    }
  }, []);

  /* =====================================================
     DISH HELPERS
  ===================================================== */

  const normalizeDish = (dish) => ({
    ...dish,
    description:
      typeof dish.description === "string"
        ? dish.description
        : "",
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
      dish.id === dishId
        ? { ...dish, ...draftDish }
        : dish
    );

    saveDishes(updated);
  };

  const handleDishFieldChange = (
    id,
    field,
    value
  ) => {
    const updated = dishes.map((dish) =>
      dish.id === id
        ? { ...dish, [field]: value }
        : dish
    );

    setDishes(updated);
  };

  const handlePriceChange = (id, value) => {
    handleDishFieldChange(
      id,
      "price",
      Number(value)
    );
  };

  const handleDescriptionChange = (
    id,
    value
  ) => {
    handleDishFieldChange(
      id,
      "description",
      value
    );
  };

  const toggleDish = (id) => {
    const updated = dishes.map((dish) =>
      dish.id === id
        ? {
            ...dish,
            enabled: !dish.enabled,
          }
        : dish
    );

    setDishes(updated);
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");

    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("staffId");
    sessionStorage.removeItem("staffName");
    sessionStorage.removeItem("staffUsername");

    navigate("/staff-login");
  };

  /* =====================================================
     CASH COUPON
  ===================================================== */

  const sanitizeWholeAmount = (value) => {
    if (value === "") return "";

    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return "";
    }

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

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openCouponModal = () => {
    resetCouponModal();
    setShowCashCoupon(true);
  };

  const closeCouponModal = () => {
    resetCouponModal();
    setShowCashCoupon(false);
  };

  const generateCashCoupon = async (event) => {
    event.preventDefault();

    setCouponError("");

    const trimmedName =
      customerName.trim();

    const trimmedTable =
      tableNumber.toString().trim();

    const normalizedAmount =
      Number(cashAmount);

    const normalizedTable =
      Number(trimmedTable);

    if (!trimmedName) {
      setCouponError(
        "Customer name is required"
      );
      return;
    }

    if (
      !trimmedTable ||
      !Number.isInteger(normalizedTable) ||
      normalizedTable < 1 ||
      normalizedTable > 30
    ) {
      setCouponError(
        "Select a table number from 1 to 30"
      );
      return;
    }

    if (
      !Number.isInteger(normalizedAmount) ||
      normalizedAmount <= 0
    ) {
      setCouponError(
        "Enter a whole positive cash amount"
      );
      return;
    }

    setGeneratingCoupon(true);

    try {
      const response = await fetch(
        "/api/coupons/cash",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            amount: normalizedAmount,
            customerName: trimmedName,
            tableNumber: normalizedTable,
            adminId:
              sessionStorage.getItem(
                "staffId"
              ),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to generate coupon"
        );
      }

      setGeneratedCoupon(data.coupon);

      setCouponReceipt({
        code: data.coupon.code,
        amount: data.coupon.amount,
        customerName: trimmedName,
        tableNumber: trimmedTable,
        createdAt:
          new Date().toISOString(),
      });
    } catch (error) {
      setCouponError(
        error.message ||
          "Coupon server is unavailable"
      );
    } finally {
      setGeneratingCoupon(false);
    }
  };

  /* =====================================================
     GROUP DISHES
  ===================================================== */

  const groupedDishes = dishes.reduce(
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

  /* =====================================================
     COUNTS
  ===================================================== */

  const availableCount =
    dishes.filter(
      (dish) => dish.enabled
    ).length;

  const hiddenCount =
    dishes.filter(
      (dish) => !dish.enabled
    ).length;

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="admin-page">

      {/* =================================================
          TOP HEADER
      ================================================= */}

      <header className="admin-header">

        <div className="admin-brand">

          <div className="admin-brand-icon">
            ⚙
          </div>

          <div>
            <p className="admin-eyebrow">
              RESTAURANT MANAGEMENT
            </p>

            <h1>
              Admin Dashboard
            </h1>

            <p className="admin-subtitle">
              Manage your restaurant from one place
            </p>
          </div>

        </div>

        <div className="admin-header-actions">

          <button
            className="admin-btn admin-btn-secondary"
            onClick={() =>
              navigate(
                "/admin/performance"
              )
            }
          >
            <span>📊</span>
            Performance & Orders
          </button>

          <button
            className="admin-btn admin-btn-secondary"
            onClick={() =>
              navigate(
                "/admin/staff"
              )
            }
          >
            <span>👥</span>
            Manage Staff
          </button>

          <button
            className="admin-btn admin-btn-success"
            onClick={openCouponModal}
          >
            <span>🎟</span>
            Cash Coupon
          </button>

          <button
            className="admin-btn admin-btn-danger"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </header>

      {/* =================================================
          OVERVIEW CARDS
      ================================================= */}

      <section className="admin-overview">

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            🍽
          </div>

          <div>
            <span>
              Total Dishes
            </span>

            <strong>
              {dishes.length}
            </strong>
          </div>

        </div>

        <div className="admin-stat-card admin-stat-available">

          <div className="admin-stat-icon">
            ✓
          </div>

          <div>
            <span>
              Available
            </span>

            <strong>
              {availableCount}
            </strong>
          </div>

        </div>

        <div className="admin-stat-card admin-stat-hidden">

          <div className="admin-stat-icon">
            ◉
          </div>

          <div>
            <span>
              Hidden
            </span>

            <strong>
              {hiddenCount}
            </strong>
          </div>

        </div>

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            ⚡
          </div>

          <div>
            <span>
              Sections
            </span>

            <strong>
              {Object.keys(
                groupedDishes
              ).length}
            </strong>
          </div>

        </div>

      </section>

      {/* =================================================
          MENU MANAGEMENT
      ================================================= */}

      <main className="admin-content">

        <div className="admin-section-heading">

          <div>

            <p className="admin-section-label">
              MENU CONTROL
            </p>

            <h2>
              Menu Management
            </h2>

            <p>
              Change prices, descriptions and
              control dish availability.
            </p>

          </div>

          <div className="dish-count-badge">
            <span>🍴</span>
            {dishes.length} Dishes
          </div>

        </div>

        {/* =================================================
            DISH SECTIONS
        ================================================= */}

        {Object.entries(
          groupedDishes
        ).map(
          ([
            section,
            sectionDishes,
          ]) => (

            <section
              className="menu-section"
              key={section}
            >

              <div className="menu-section-header">

                <div>

                  <span className="menu-section-icon">
                    🍽
                  </span>

                  <div>
                    <h3>
                      {section}
                    </h3>

                    <p>
                      {sectionDishes.length}{" "}
                      {sectionDishes.length === 1
                        ? "item"
                        : "items"}
                    </p>
                  </div>

                </div>

                <span className="section-count">
                  {sectionDishes.length}
                </span>

              </div>

              <div className="dish-grid">

                {sectionDishes.map(
                  (dish) => (

                    <article
                      className={`dish-card ${
                        !dish.enabled
                          ? "dish-card-hidden"
                          : ""
                      }`}
                      key={dish.id}
                    >

                      {/* IMAGE */}

                      <div className="dish-image-wrapper">

                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="dish-image"
                        />

                        <span
                          className={`dish-status ${
                            dish.enabled
                              ? "status-available"
                              : "status-hidden"
                          }`}
                        >
                          <span className="status-dot" />

                          {dish.enabled
                            ? "Available"
                            : "Hidden"}
                        </span>

                      </div>

                      {/* DETAILS */}

                      <div className="dish-card-content">

                        <div className="dish-title-row">

                          <div>

                            <h4>
                              {dish.name}
                            </h4>

                            <div className="dish-meta">

                              <span>
                                {dish.section}
                              </span>

                              <span>
                                •
                              </span>

                              <span>
                                {dish.category}
                              </span>

                            </div>

                          </div>

                        </div>

                        {/* PRICE */}

                        <div className="admin-field">

                          <label>
                            PRICE
                          </label>

                          <div className="price-input">

                            <span>
                              ₹
                            </span>

                            <input
                              type="number"
                              value={
                                dish.price
                              }
                              onChange={(e) =>
                                handlePriceChange(
                                  dish.id,
                                  e.target.value
                                )
                              }
                            />

                          </div>

                        </div>

                        {/* DESCRIPTION */}

                        <div className="admin-field">

                          <label>
                            DESCRIPTION
                          </label>

                          <textarea
                            value={
                              dish.description ||
                              ""
                            }
                            onChange={(e) =>
                              handleDescriptionChange(
                                dish.id,
                                e.target.value
                              )
                            }
                            placeholder="Add a short dish description..."
                            rows={3}
                          />

                        </div>

                        {/* ACTIONS */}

                        <div className="dish-actions">

                          <button
                            className={`dish-action-btn ${
                              dish.enabled
                                ? "hide-btn"
                                : "show-btn"
                            }`}
                            onClick={() =>
                              toggleDish(
                                dish.id
                              )
                            }
                          >
                            {dish.enabled
                              ? "Hide Dish"
                              : "Show Dish"}
                          </button>

                          <button
                            className="dish-action-btn save-btn"
                            onClick={() =>
                              saveDish(
                                dish.id,
                                {
                                  price: Number(
                                    dish.price
                                  ),
                                  description:
                                    String(
                                      dish.description ||
                                        ""
                                    ),
                                  enabled:
                                    Boolean(
                                      dish.enabled
                                    ),
                                }
                              )
                            }
                          >
                            Save Changes
                          </button>

                        </div>

                      </div>

                    </article>

                  )
                )}

              </div>

            </section>

          )
        )}

      </main>

      {/* =================================================
          CASH COUPON MODAL
      ================================================= */}

      {showCashCoupon && (

        <div className="coupon-overlay">

          <form
            className="coupon-modal"
            onSubmit={
              generateCashCoupon
            }
          >

            <button
              type="button"
              className="coupon-close"
              onClick={
                closeCouponModal
              }
            >
              ×
            </button>

            {generatedCoupon &&
            couponReceipt ? (

              <div className="coupon-receipt">

                <div className="coupon-icon">
                  🎟
                </div>

                <p className="coupon-label">
                  CASH COUPON
                </p>

                <h2>
                  Coupon Generated
                </h2>

                <div className="coupon-code">
                  {couponReceipt.code}
                </div>

                <div className="receipt-details">

                  <div>
                    <span>
                      Amount
                    </span>

                    <strong>
                      ₹{couponReceipt.amount}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Customer
                    </span>

                    <strong>
                      {
                        couponReceipt.customerName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Table
                    </span>

                    <strong>
                      {
                        couponReceipt.tableNumber
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Created
                    </span>

                    <strong>
                      {formatReceiptTime(
                        couponReceipt.createdAt
                      )}
                    </strong>
                  </div>

                </div>

                <div className="coupon-actions">

                  <button
                    type="button"
                    className="coupon-done-btn"
                    onClick={
                      closeCouponModal
                    }
                  >
                    Done
                  </button>

                  <button
                    type="button"
                    className="coupon-print-btn"
                    onClick={() =>
                      window.print()
                    }
                  >
                    Print Receipt
                  </button>

                </div>

              </div>

            ) : (

              <>

                <div className="coupon-modal-header">

                  <div className="coupon-icon">
                    🎟
                  </div>

                  <div>
                    <p>
                      ADMIN TOOL
                    </p>

                    <h2>
                      Cash Coupon
                    </h2>
                  </div>

                </div>

                <p className="coupon-description">
                  Generate a cash coupon for a
                  customer and table.
                </p>

                <div className="coupon-form">

                  <div className="coupon-field">

                    <label>
                      CUSTOMER NAME
                    </label>

                    <input
                      required
                      value={
                        customerName
                      }
                      onChange={(e) =>
                        setCustomerName(
                          e.target.value
                        )
                      }
                      placeholder="Enter customer name"
                    />

                  </div>

                  <div className="coupon-field">

                    <label>
                      TABLE NUMBER
                    </label>

                    <select
                      required
                      value={
                        tableNumber
                      }
                      onChange={(e) =>
                        setTableNumber(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Select table number
                      </option>

                      {Array.from(
                        { length: 30 },
                        (_, index) =>
                          index + 1
                      ).map((num) => (
                        <option
                          key={num}
                          value={num}
                        >
                          Table {num}
                        </option>
                      ))}
                    </select>

                  </div>

                  <div className="coupon-field">

                    <label>
                      CASH AMOUNT
                    </label>

                    <div className="coupon-amount">

                      <span>
                        ₹
                      </span>

                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={
                          cashAmount
                        }
                        onChange={(e) =>
                          setCashAmount(
                            sanitizeWholeAmount(
                              e.target.value
                            )
                          )
                        }
                        placeholder="0"
                      />

                    </div>

                  </div>

                </div>

                {couponError && (

                  <div className="coupon-error">
                    ⚠ {couponError}
                  </div>

                )}

                <div className="coupon-actions">

                  <button
                    type="submit"
                    className="coupon-generate-btn"
                    disabled={
                      generatingCoupon
                    }
                  >
                    {generatingCoupon
                      ? "Generating..."
                      : "Generate Coupon"}
                  </button>

                  <button
                    type="button"
                    className="coupon-cancel-btn"
                    onClick={
                      closeCouponModal
                    }
                  >
                    Cancel
                  </button>

                </div>

              </>

            )}

          </form>

        </div>

      )}

    </div>
  );
}