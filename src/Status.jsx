import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaHome,
  FaClipboardCheck,
  FaUtensils,
  FaBell,
  FaMotorcycle,
  FaCheckCircle,
  FaPhoneAlt,
  FaClock,
  FaCrown,
  FaReceipt,
  FaStar,
} from "react-icons/fa";

import logo from "./assets/bg.png";

import "./Status.css";

export default function Status() {

  const navigate = useNavigate();

  const [order, setOrder] =
    useState(null);
  const [feedback, setFeedback] = useState({
    overallRating: 0,
    foodRating: 0,
    serviceRating: 0,
    comment: "",
  });

  const [feedbackSubmitted, setFeedbackSubmitted] =
    useState(false);

  const [feedbackMessage, setFeedbackMessage] =
    useState("");
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [assistanceSubmitting, setAssistanceSubmitting] = useState(false);
  const [assistanceMessage, setAssistanceMessage] = useState("");
  const [waiterCooldownUntil, setWaiterCooldownUntil] = useState(() => {
    const saved = localStorage.getItem("waiterCooldownUntil");
    return saved ? Number(saved) : 0;
  });
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const updateCooldown = () => {
      const remaining = Math.max(0, waiterCooldownUntil - Date.now());
      setCooldownRemaining(remaining);

      if (remaining <= 0 && waiterCooldownUntil > 0) {
        localStorage.removeItem("waiterCooldownUntil");
        setWaiterCooldownUntil(0);
      }
    };

    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    return () => clearInterval(timer);
  }, [waiterCooldownUntil]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId =
          localStorage.getItem(
            "activeOrderId"
          );

        if (!orderId) {
          setOrder(null);
          return;
        }

        const response = await fetch(
          `/api/orders/${orderId}`
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to fetch order"
          );
        }

        setOrder(data.order);

      } catch (error) {
        console.error(
          "Tracking error:",
          error
        );
      }
    };

    fetchOrder();

    const interval =
      setInterval(
        fetchOrder,
        2000
      );

    return () =>
      clearInterval(interval);

  }, []);

  if (!order) {

    return (

      <div className="status-empty">

        <div className="empty-card">

          <FaReceipt />

          <h1>
            No Active Orders
          </h1>

          <p>
            Place an order to track
            its live status.
          </p>

          <button
            onClick={() =>
              navigate("/home")
            }
          >
            Go To Menu
          </button>

        </div>

      </div>

    );

  }

  const subtotal =
    order.totalAmount ??
    (order.items || []).reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(
          item.quantity ??
          item.qty ??
          1
        ),
      0
    );

  const getStepStatus = (
    currentStatus,
    step
  ) => {
    const normalizedCurrent = String(currentStatus || "")
      .trim()
      .toUpperCase();

    const normalizedStep = String(step || "")
      .trim()
      .toUpperCase();

    const foodSteps = [
      "ORDERED",
      "PREPARING",
      "READY",
      "ON_THE_WAY",
      "SERVED",
    ];

    const serviceSteps = [
      "WAITING",
      "ON_THE_WAY",
      "SERVED",
    ];

    const legacyMap = {
      NEW: "ORDERED",
      PREPARING: "PREPARING",
      READY: "READY",
      ON_THE_WAY: "ON_THE_WAY",
      SERVED: "SERVED",
    };

    const currentLookup = legacyMap[normalizedCurrent] || normalizedCurrent;
    const stepOrder = serviceSteps.includes(normalizedStep) ? serviceSteps : foodSteps;
    const currentIndex = stepOrder.indexOf(currentLookup);
    const stepIndex = stepOrder.indexOf(normalizedStep);

    if (currentIndex === -1 || stepIndex === -1) {
      return false;
    }

    return currentIndex >= stepIndex;
  };

  const getStatusText = () => {

    switch (
    order.status
    ) {

      case "NEW":
        return "Order Placed";

      case "PREPARING":
        return "Preparation Underway";

      case "SERVED":
        return "Served Successfully";

      default:
        return "Order Placed";

    }

  };

  const isServiceItem = (item) =>
    String(item?.serviceType || "").toUpperCase() === "SERVICE" ||
    ["WATER BOTTLE", "COKE", "COCA COLA"].includes(
      String(item?.name || "").trim().toUpperCase()
    );

  const getServiceWaitingLabel = (item) => {
    const preference = String(
      item?.whenToServe || item?.servicePreference || item?.serviceGroup || item?.preference || ""
    ).toUpperCase();

    if (preference.includes("FIRST") || preference.includes("1ST")) {
      return "Waiting for 1st preference order";
    }

    if (preference.includes("LAST")) {
      return "Waiting for last preference order";
    }

    return "Waiting for pickup";
  };

  const renderItemTracker = (item) => {
    const service = isServiceItem(item);
    const steps = service
      ? [
          { status: "WAITING", title: getServiceWaitingLabel(item), subtitle: "Service" },
          { status: "ON_THE_WAY", title: "On The Way", subtitle: "Serving" },
          { status: "SERVED", title: "Served", subtitle: "Enjoy" },
        ]
      : [
          { status: "ORDERED", title: "Ordered", subtitle: "Received" },
          { status: "PREPARING", title: "Preparing", subtitle: "Kitchen" },
          { status: "READY", title: "Ready", subtitle: "Pickup" },
          { status: "ON_THE_WAY", title: "On The Way", subtitle: "Serving" },
          { status: "SERVED", title: "Served", subtitle: "Enjoy" },
        ];

    const icons = service
      ? [<FaClock />, <FaMotorcycle />, <FaCheckCircle />]
      : [<FaClipboardCheck />, <FaUtensils />, <FaBell />, <FaMotorcycle />, <FaCheckCircle />];

    return (
      <div
        className="item-tracking-row"
        key={item._id || item.id || item.name}
      >
        <div className="item-tracking-heading">
          <div>
            <span>{service ? "SERVICE ITEM" : "FOOD ITEM"}</span>
            <h3>{item.name} × {item.quantity ?? item.qty ?? 1}</h3>
          </div>
          <strong>{item.status?.replaceAll("_", " ") || (service ? "WAITING" : "ORDERED")}</strong>
        </div>

        <div className={`tracking-line item-tracking-line steps-${steps.length}`}>
          {steps.map((step, index) => (
            <div
              className={`tracking-step ${getStepStatus(item.status || (service ? "WAITING" : "ORDERED"), step.status) ? "completed" : ""}`}
              key={step.status}
            >
              <div className="tracking-icon">{icons[index]}</div>
              <h4>{step.title}</h4>
              <p>{step.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const estimate = order.customerEstimate || {};
  const firstMinutes = Number(estimate.firstMinutes || 0);
  const lastMinutes = Number(estimate.lastMinutes || 0);
  const estimateText = firstMinutes && lastMinutes
    ? `${firstMinutes}-${lastMinutes} Min`
    : "Available immediately";

  const estimateSeconds = firstMinutes && lastMinutes
    ? ((firstMinutes + lastMinutes) / 2) * 60
    : 0;

  const servedAtValue =
    order.waiter?.servedAt ||
    (order.items || []).find((item) => item.servedAt)?.servedAt ||
    null;

  const isOrderServed = String(order.status || "").toUpperCase() === "SERVED";

  const timerReferenceTime = servedAtValue
    ? new Date(servedAtValue).getTime()
    : now;

  const elapsedSeconds = order.createdAt
    ? Math.max(0, (timerReferenceTime - new Date(order.createdAt).getTime()) / 1000)
    : 0;

  const remainingSeconds = estimateSeconds > 0
    ? estimateSeconds - elapsedSeconds
    : 0;

  const formatCountdown = (seconds) => {
    const totalSeconds = Math.max(0, Math.ceil(Math.abs(seconds)));
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const sign = seconds < 0 ? "-" : "";
    return `${sign}${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const liveTimerText = estimateSeconds > 0
    ? `${formatCountdown(remainingSeconds)} ${remainingSeconds < 0 ? "late" : "left"}`
    : "Ready now";

  const requestWaiter = async () => {
    if (waiterCooldownUntil > Date.now()) {
      return;
    }

    if (!customerName.trim()) {
      setAssistanceMessage("Please enter your name.");
      return;
    }

    if (!tableNumber) {
      setAssistanceMessage("Please select your table number.");
      return;
    }

    try {
      setAssistanceSubmitting(true);
      setAssistanceMessage("");

      const response = await fetch("/api/assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          tableNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to request waiter");
      }

      setAssistanceMessage("Waiter has been notified. Please wait a moment.");
      const cooldownUntil = Date.now() + 5 * 60 * 1000;
      localStorage.setItem("waiterCooldownUntil", String(cooldownUntil));
      setWaiterCooldownUntil(cooldownUntil);

      setTimeout(() => {
        setShowWaiterModal(false);
        setCustomerName("");
        setTableNumber("");
        setAssistanceMessage("");
      }, 1800);
    } catch (error) {
      console.error("Waiter assistance error:", error);
      setAssistanceMessage(error.message || "Unable to request waiter.");
    } finally {
      setAssistanceSubmitting(false);
    }
  };

  const handleRating = (type, value) => {
    setFeedback((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const submitFeedback = async () => {

    if (feedback.overallRating === 0) {
      setFeedbackMessage(
        "Please select an overall rating."
      );
      return;
    }

    try {

      const response = await fetch(
        "/api/feedback",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            orderId:
              order._id,

            overallRating:
              feedback.overallRating,

            foodRating:
              feedback.foodRating,

            serviceRating:
              feedback.serviceRating,

            comment:
              feedback.comment.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        if (response.status === 409) {
          setFeedbackSubmitted(true);

          setFeedbackMessage(
            "Feedback already submitted for this order."
          );

          return;
        }

        throw new Error(
          data.message ||
          "Failed to submit feedback"
        );
      }

      setFeedbackSubmitted(true);

      setFeedbackMessage(
        "Thank you for sharing your experience!"
      );

      setTimeout(() => {
        navigate("/");
      }, 1200);

    } catch (error) {

      console.error(
        "Feedback submission error:",
        error
      );

      setFeedbackMessage(
        "Unable to submit feedback. Please try again."
      );
    }
  };
  return (

    <div className="premium-status-page">

      {/* BACKGROUND EFFECTS */}

      <div className="status-bg-orb orb-1"></div>
      <div className="status-bg-orb orb-2"></div>
      <div className="status-bg-orb orb-3"></div>

      {/* HEADER */}

      <div className="premium-header">

        <div className="premium-brand">

          <img
            src={logo}
            alt="logo"
            className="premium-logo"
          />

          <div>

            <div className="premium-tag">
              <FaCrown />
              PREMIUM ORDER TRACKING
            </div>

            <h1>
              ORDER STATUS
            </h1>

            <p>
              Live Restaurant Experience
            </p>

          </div>

        </div>

        <button
          className="premium-home-btn"
          onClick={() =>
            navigate("/home")
          }
        >
          <FaHome />
          Home
        </button>

      </div>

      {/* HERO SECTION */}

      <div className="premium-hero">

        <div className="hero-left">

          <div className="hero-icon">
            🍽️
          </div>

          <div>

            <h2>
              Thank You For Your Order
            </h2>

            <p>
              Your order is being
              tracked in real time.
            </p>

          </div>

        </div>

        <div className="hero-status">

          <span>
            Current Status
          </span>

          <h3>
            {getStatusText()}
          </h3>

        </div>

      </div>

      {/* MAIN GRID */}

      <div className="premium-grid">

        {/* LEFT PANEL */}

        <div className="premium-left">

          <div className="glass-card">

            <h2>
              ORDER DETAILS
            </h2>

            <div className="order-info-row">

              <span>
                Order Time
              </span>

              <strong>
                {order.createdAt
                  ? new Date(
                    order.createdAt
                  ).toLocaleTimeString()
                  : order.time}
              </strong>

            </div>

            <div className="order-info-row">

              <span>
                Estimated Time
              </span>

              <strong>
                {estimateText}
              </strong>

            </div>

            <div className="order-info-row">

              <span>
                Timer
              </span>

              <strong>
                {liveTimerText}
              </strong>

            </div>

            <div className="order-divider"></div>

            <div className="items-section">

              <h3>
                ITEMS
              </h3>

              {(order.items || []).map(
                (item) => (

                  <div
                    key={
                      item._id ||
                      item.id ||
                      item.name
                    }
                    className="item-row"
                  >

                    <span>
                      {item.name}
                      {" "}
                      ×
                      {" "}
                      {item.quantity ??
                        item.qty ??
                        1}
                    </span>

                    <strong>
                      ₹
                      {Number(item.price || 0) *
                        Number(
                          item.quantity ??
                          item.qty ??
                          1
                        )}
                    </strong>

                  </div>

                )
              )}

            </div>

            <div className="order-divider"></div>

            <div className="grand-total">

              <span>
                Grand Total
              </span>

              <h2>
                ₹{subtotal}
              </h2>

            </div>

          </div>

          {/* RIGHT-SIDE SUPPORT */}

          <div className="glass-card support-card order-support-card">

            <h2>
              Need Assistance?
            </h2>

            <p>
              Our restaurant team is
              available to help you.
            </p>

            <button
              className="support-btn"
              onClick={() => {
                if (waiterCooldownUntil > Date.now()) {
                  return;
                }
                setShowWaiterModal(true);
                setAssistanceMessage("");
              }}
              disabled={cooldownRemaining > 0}
              style={{ opacity: cooldownRemaining > 0 ? 0.6 : 1 }}
            >

              <FaBell />

              {cooldownRemaining > 0
                ? `Waiter Called • ${Math.floor(cooldownRemaining / 60000)}:${String(Math.floor((cooldownRemaining % 60000) / 1000)).padStart(2, "0")}`
                : "Call Waiter"}

            </button>

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="premium-right">

          {/* ITEM-LEVEL TRACKING */}

          <section className="tracking-card item-tracking-section">
            <h2 className="item-tracking-title">LIVE ORDER TRACKING</h2>
            {(order.items || []).map(renderItemTracker)}
          </section>

          {/* ETA CARDS */}

          <div className="premium-stats">

            <div className="stat-card">

              <FaClock />

              <div>

                <span>
                  Estimated Time
                </span>

                <h2>
                  {estimateText}
                </h2>

              </div>

            </div>

            <div className="stat-card">

              🍽️

              <div>

                <span>
                  Current Status
                </span>

                <h2>
                  {getStatusText()}
                </h2>

              </div>

            </div>

          </div>

          {showWaiterModal && (
            <div className="waiter-modal-overlay">
              <div className="feedback-card waiter-modal-card">
                <div className="feedback-header">
                  <div className="feedback-icon">🚶</div>
                  <div>
                    <h2>Request a Waiter</h2>
                    <p>We will send a waiter to your table.</p>
                  </div>
                </div>

                <div className="rating-section" style={{ marginTop: "14px" }}>
                  <h3>Name</h3>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(216,154,43,.35)", background: "rgba(0,0,0,.25)", color: "#fff" }}
                  />
                </div>

                <div className="rating-section">
                  <h3>Table Number</h3>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(216,154,43,.35)", background: "rgba(0,0,0,.25)", color: "#fff" }}
                  >
                    <option value="">Select table</option>
                    {[...Array(30)].map((_, index) => (
                      <option key={index + 1} value={String(index + 1)}>
                        Table {index + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                  <button
                    className="support-btn"
                    onClick={requestWaiter}
                    disabled={assistanceSubmitting}
                    style={{ opacity: assistanceSubmitting ? 0.7 : 1 }}
                  >
                    {assistanceSubmitting ? "Sending..." : "Send Request"}
                  </button>

                  <button
                    className="support-btn"
                    onClick={() => {
                      setShowWaiterModal(false);
                      setAssistanceMessage("");
                    }}
                    style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
                  >
                    Close
                  </button>
                </div>

                {assistanceMessage && (
                  <p style={{ marginTop: "12px", color: assistanceMessage.includes("Waiter") ? "#ffd777" : "#ffb4b4" }}>
                    {assistanceMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {order.status === "SERVED" && (
            <div className="feedback-card">

              {!feedbackSubmitted ? (
                <>
                  <div className="feedback-header">
                    <div className="feedback-icon">
                      ⭐
                    </div>

                    <div>
                      <h2>
                        Enjoyed Your Meal?
                      </h2>

                      <p>
                        We'd love to hear about your
                        dining experience.
                      </p>
                    </div>
                  </div>

                  {/* OVERALL RATING */}
                  <div className="rating-section">
                    <h3>
                      Overall Experience
                    </h3>

                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <button
                            key={star}
                            className={
                              star <=
                                feedback.overallRating
                                ? "star active"
                                : "star"
                            }
                            onClick={() =>
                              handleRating(
                                "overallRating",
                                star
                              )
                            }
                          >
                            <FaStar />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* FOOD RATING */}
                  <div className="rating-section">
                    <h3>
                      Food Quality
                    </h3>

                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <button
                            key={star}
                            className={
                              star <=
                                feedback.foodRating
                                ? "star active"
                                : "star"
                            }
                            onClick={() =>
                              handleRating(
                                "foodRating",
                                star
                              )
                            }
                          >
                            <FaStar />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* SERVICE RATING */}
                  <div className="rating-section">
                    <h3>
                      Service
                    </h3>

                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <button
                            key={star}
                            className={
                              star <=
                                feedback.serviceRating
                                ? "star active"
                                : "star"
                            }
                            onClick={() =>
                              handleRating(
                                "serviceRating",
                                star
                              )
                            }
                          >
                            <FaStar />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* COMMENT */}
                  <div className="comment-section">
                    <h3>
                      Tell us about your experience
                    </h3>

                    <textarea
                      value={feedback.comment}
                      onChange={(e) =>
                        setFeedback({
                          ...feedback,
                          comment: e.target.value,
                        })
                      }
                      placeholder="Write your feedback here..."
                      rows="4"
                    />
                  </div>

                  {feedbackMessage && (
                    <p className="feedback-error">
                      {feedbackMessage}
                    </p>
                  )}

                  <button
                    className="submit-feedback-btn"
                    onClick={submitFeedback}
                  >
                    <FaStar />
                    Submit Feedback
                  </button>
                </>
              ) : (
                <div className="feedback-success">
                  <div className="success-icon">
                    ✓
                  </div>

                  <h2>
                    Thank You!
                  </h2>

                  <p>
                    Your feedback has been submitted
                    successfully.
                  </p>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}

      <div className="premium-footer">

        <span>
          ORDER NOW • EAT NOW
        </span>

        <span>
          Premium Restaurant Experience
        </span>

      </div>

    </div>

  );

}
