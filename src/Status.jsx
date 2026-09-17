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

    const steps = [
      "NEW",
      "PREPARING",
      "READY",
      "ON_THE_WAY",
      "SERVED",
    ];

    return (
      steps.indexOf(
        currentStatus
      ) >=
      steps.indexOf(step)
    );

  };

  const getStatusText = () => {

    switch (
    order.status
    ) {

      case "NEW":
        return "Order Placed";

      case "PREPARING":
        return "Preparation Underway";

      case "READY":
        return "Ready For Service";

      case "ON_THE_WAY":
        return "On The Way To Table";

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
      item?.servicePreference || item?.serviceGroup || item?.preference || ""
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
          { status: "NEW", title: getServiceWaitingLabel(item), subtitle: "Service" },
          { status: "ON_THE_WAY", title: "On The Way", subtitle: "Serving" },
          { status: "SERVED", title: "Served", subtitle: "Enjoy" },
        ]
      : [
          { status: "NEW", title: "Ordered", subtitle: "Received" },
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
          <strong>{item.status?.replaceAll("_", " ") || "NEW"}</strong>
        </div>

        <div className={`tracking-line item-tracking-line steps-${steps.length}`}>
          {steps.map((step, index) => (
            <div
              className={`tracking-step ${getStepStatus(item.status || "NEW", step.status) ? "completed" : ""}`}
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
                Order ID
              </span>

              <strong>
                #{order._id || order.id}
              </strong>

            </div>

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

            <button className="support-btn">

              <FaPhoneAlt />

              Contact Support

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

          {/* PREMIUM MESSAGE */}

          <div className="premium-message">

            <div className="message-icon">
              👨‍🍳
            </div>

            <div>

              <h3>
                Chef's Kitchen Update
              </h3>

              <p>

                {order.status === "NEW" &&
                  "Your order has been received and is waiting for kitchen confirmation."}

                {order.status === "PREPARING" &&
                  "Our chef is carefully preparing your dishes."}

                {order.status === "READY" &&
                  "Your food is ready and waiting for table service."}

                {order.status === "ON_THE_WAY" &&
                  "A waiter is bringing your order to your table."}

                {order.status === "SERVED" &&
                  "Your order has been successfully served. Enjoy your meal!"}

              </p>

            </div>

          </div>
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
