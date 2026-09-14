import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaConciergeBell,
  FaMotorcycle,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaSignOutAlt,
} from "react-icons/fa";

import logo from "./assets/bg.png";

import "./Waiter.css";

export default function Waiter() {


  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("userRole");
    localStorage.removeItem("staffId");
    localStorage.removeItem("staffName");
    localStorage.removeItem("staffUsername");

    navigate("/staff-login");
  };

  useEffect(() => {

    const role =
      localStorage.getItem(
        "userRole"
      );

    if (role !== "waiter") {

      navigate("/staff-login");

    }

  }, []);

  const [orders, setOrders] =
    useState([]);

  const [assistanceRequests, setAssistanceRequests] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState("READY");

  useEffect(() => {
    const fetchOrdersAndAssistance = async () => {
      try {
        // FETCH ORDERS
        const ordersResponse = await fetch(
          "/api/orders"
        );

        const ordersData =
          await ordersResponse.json();

        if (!ordersResponse.ok) {
          throw new Error(
            ordersData.message ||
            "Failed to fetch orders"
          );
        }

        setOrders(
          ordersData.orders || []
        );


        // FETCH ACTIVE ASSISTANCE REQUESTS
        const assistanceResponse =
          await fetch(
            "/api/assistance"
          );

        const assistanceData =
          await assistanceResponse.json();

        if (!assistanceResponse.ok) {
          throw new Error(
            assistanceData.message ||
            "Failed to fetch assistance requests"
          );
        }

        setAssistanceRequests(
          assistanceData.requests || []
        );

      } catch (error) {
        console.error(
          "Failed to load waiter dashboard:",
          error
        );
      }
    };

    fetchOrdersAndAssistance();

    // Keep waiter dashboard updated
    const interval = setInterval(
      fetchOrdersAndAssistance,
      2000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const sendToTable = async (id) => {
    try {
      const response = await fetch(
        `/api/orders/${id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: "ON_THE_WAY",
            staffId: localStorage.getItem("staffId"),
            staffName: localStorage.getItem("staffName"),
            staffRole: "waiter",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to send order to table"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === id
            ? data.order
            : order
        )
      );

      console.log(
        "ORDER SENT TO TABLE:",
        data.order
      );

    } catch (error) {
      console.error(
        "Send to table error:",
        error
      );

      alert(
        error.message ||
        "Unable to send order to table"
      );
    }
  };

  const markServed = async (id) => {
    try {
      const response = await fetch(
        `/api/orders/${id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: "SERVED",
            staffId: localStorage.getItem("staffId"),
            staffName: localStorage.getItem("staffName"),
            staffRole: "waiter",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to mark order as served"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === id
            ? data.order
            : order
        )
      );

      console.log(
        "ORDER SERVED:",
        data.order
      );

    } catch (error) {
      console.error("Send to table error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send order to table";

      alert(message);
    }
  };

  const acceptAssistance = async (id) => {
    try {
      const response = await fetch(
        `/api/assistance/${id}/accept`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staffId:
              localStorage.getItem("staffId"),

            staffName:
              localStorage.getItem("staffName"),

            staffRole: "waiter",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to accept assistance request"
        );
      }

      setAssistanceRequests(
        (currentRequests) =>
          currentRequests.map((request) =>
            request._id === id
              ? data.request
              : request
          )
      );

      console.log(
        "ASSISTANCE ACCEPTED:",
        data.request
      );
    } catch (error) {
      console.error(
        "Accept assistance error:",
        error
      );

      alert(
        error.message ||
        "Unable to accept assistance request"
      );
    }
  };


  const completeAssistance = async (id) => {
    try {
      const response = await fetch(
        `/api/assistance/${id}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staffId:
              localStorage.getItem("staffId"),

            staffName:
              localStorage.getItem("staffName"),

            staffRole: "waiter",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to complete assistance request"
        );
      }

      setAssistanceRequests(
        (currentRequests) =>
          currentRequests.filter(
            (request) =>
              request._id !== id
          )
      );

      console.log(
        "ASSISTANCE COMPLETED:",
        data.request
      );
    } catch (error) {
      console.error(
        "Complete assistance error:",
        error
      );

      alert(
        error.message ||
        "Unable to complete assistance request"
      );
    }
  };

  const readyOrders = orders
    .filter(
      (order) =>
        order.status === "READY"
    )
    .sort((a, b) => {
      const aTime = a.chef?.readyAt
        ? new Date(
          a.chef.readyAt
        ).getTime()
        : Number.MAX_SAFE_INTEGER;

      const bTime = b.chef?.readyAt
        ? new Date(
          b.chef.readyAt
        ).getTime()
        : Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    });

  const staffId =
    localStorage.getItem("staffId");

  const onTheWayOrders =
    orders.filter(
      (order) =>
        order.status === "ON_THE_WAY" &&
        order.waiter?.staffId === staffId
    );

  const servedOrders =
    orders.filter(
      (order) =>
        order.status === "SERVED"
    );


  // ==================================================
  // ASSISTANCE REQUESTS
  // ==================================================

  const activeAssistanceRequests =
    assistanceRequests.filter(
      (request) =>
        request.status === "ACTIVE"
    );

  const acceptedAssistanceRequests =
    assistanceRequests.filter(
      (request) =>
        request.status === "ACCEPTED" &&
        request.acceptedById === staffId
    );


  // ==================================================
  // COUNTS
  // ==================================================

  const readyCount =
    readyOrders.length;

  const acceptedCount =
    onTheWayOrders.length +
    acceptedAssistanceRequests.length;

  // ==================================================
  // WAITER TASK AVAILABILITY
  // ==================================================

  const currentAssistance =
    acceptedAssistanceRequests[0] || null;

  const assistanceAcceptedAt =
    currentAssistance?.acceptedAt
      ? new Date(
        currentAssistance.acceptedAt
      ).getTime()
      : null;

  const assistanceElapsed =
    assistanceAcceptedAt
      ? Date.now() - assistanceAcceptedAt
      : 0;

  // Waiter cannot accept an order during
  // the first 5 minutes of assistance.
  const assistanceBlockingOrder =
    !!currentAssistance &&
    assistanceElapsed < 5 * 60 * 1000;

  // Waiter already has an accepted food order.
  const hasAcceptedOrder =
    onTheWayOrders.length > 0;

  // Can accept a new food order?
  const canAcceptOrder =
    !hasAcceptedOrder &&
    !assistanceBlockingOrder;

  // Can accept another assistance request?
  const canAcceptAssistance =
    !hasAcceptedOrder &&
    acceptedAssistanceRequests.length === 0;

  const servedCount =
    servedOrders.length;

  // ==================================================
  // ACTIVE ORDERS
  // ==================================================

  const activeOrders =
    activeTab === "READY"
      ? readyOrders
      : activeTab === "ACCEPTED"
        ? onTheWayOrders
        : servedOrders;

  return (

    <div className="waiter-page">

      {/* SIDEBAR */}

      <aside className="waiter-sidebar">

        <div>

          <div className="waiter-logo-box">

            <img
              src={logo}
              alt="logo"
              className="waiter-logo"
            />

          </div>

          <div className="waiter-menu">


            <div
              className={
                activeTab === "READY"
                  ? "waiter-menu-active"
                  : "waiter-menu-item"
              }
              onClick={() =>
                setActiveTab("READY")
              }
            >

              <FaClipboardList />

              <span>
                Ready Orders
              </span>

              <div
                className={
                  activeTab === "READY"
                    ? "waiter-badge"
                    : "waiter-badge-dark"
                }
              >
                {readyCount}
              </div>

            </div>
            <div
              className={
                activeTab === "ACCEPTED"
                  ? "waiter-menu-active"
                  : "waiter-menu-item"
              }
              onClick={() =>
                setActiveTab("ACCEPTED")
              }
            >

              <FaMotorcycle />

              <span>
                Accepted Orders
              </span>

              <div
                className={
                  activeTab === "ACCEPTED"
                    ? "waiter-badge"
                    : "waiter-badge-dark"
                }
              >
                {acceptedCount}
              </div>

            </div>

            <div
              className={
                activeTab === "SERVED"
                  ? "waiter-menu-active"
                  : "waiter-menu-item"
              }
              onClick={() =>
                setActiveTab("SERVED")
              }
            >

              <FaCheckCircle />

              <span>
                Served
              </span>

              <div
                className={
                  activeTab === "SERVED"
                    ? "waiter-badge"
                    : "waiter-badge-dark"
                }
              >
                {servedCount}
              </div>

            </div>

          </div>

        </div>

        <div>

          <div className="waiter-profile">

            <div className="waiter-avatar">
              🧑‍💼
            </div>

            <div>

              <h3>
                {localStorage.getItem("staffName") || "Waiter"}
              </h3>

              <p>
                Floor Service
              </p>

            </div>

          </div>

          <div
            className="waiter-logout"
            onClick={handleLogout}
          >

            <FaSignOutAlt />

            Logout

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="waiter-main">

        <div className="waiter-header">

          <div>

            <h3 className="waiter-welcome">
              Welcome {localStorage.getItem("staffName") || "Waiter"} 🧑‍💼
            </h3>

            <h1 className="waiter-title">
              WAITER DASHBOARD
            </h1>

          </div>

          <div className="waiter-time">

            <FaClock />

            <div>

              <h3>
                {new Date().toLocaleTimeString()}
              </h3>

              <p>
                Table Service
              </p>

            </div>

          </div>

        </div>

        <div className="waiter-stats">

          <div className="waiter-stat-card">

            <FaConciergeBell />

            <div>

              <h2>
                {readyCount}
              </h2>

              <p>
                Ready Orders
              </p>

            </div>

          </div>

          <div className="waiter-stat-card">

            <FaMotorcycle />

            <div>

              <h2>
                {acceptedCount}
              </h2>

              <p>
                Accepted Orders
              </p>

            </div>

          </div>

        </div>

        <div className="waiter-section-title">
          {activeTab === "READY" &&
            "READY FOR SERVICE"}

          {activeTab === "ACCEPTED" &&
            "ACCEPTED ORDERS"}
          {activeTab === "SERVED" &&
            "SERVED ORDERS"}
        </div>

        {/* ==================================================
    NEW ASSISTANCE REQUESTS
    ================================================== */}

        {activeTab === "READY" &&
          activeAssistanceRequests.length > 0 && (
            <div
              style={{
                marginBottom: "25px",
              }}
            >
              {activeAssistanceRequests.map(
                (request) => (
                  <div
                    key={request._id}
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(45,30,8,.96), rgba(15,10,3,.98))",
                      border:
                        "2px solid rgba(216,154,43,.75)",
                      borderRadius: "18px",
                      padding: "22px 25px",
                      marginBottom: "15px",
                      boxShadow:
                        "0 0 25px rgba(216,154,43,.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: "20px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            color: "#d89a2b",
                            fontSize: "22px",
                            letterSpacing: "1.5px",
                          }}
                        >
                          🔔 ASSISTANCE REQUIRED
                        </h2>

                        <p
                          style={{
                            margin:
                              "10px 0 0",
                            color: "#fff",
                            fontSize: "17px",
                          }}
                        >
                          CUSTOMER:{" "}
                          <strong>
                            {request.customerName}
                          </strong>
                        </p>

                        <p
                          style={{
                            margin:
                              "6px 0 0",
                            color: "#fff",
                            fontSize: "17px",
                          }}
                        >
                          TABLE:{" "}
                          <strong>
                            {request.tableNumber}
                          </strong>
                        </p>
                      </div>

                      <button
                        disabled={!canAcceptAssistance}
                        onClick={() => {
                          if (canAcceptAssistance) {
                            acceptAssistance(request._id);
                          }
                        }}
                        style={{
                          border:
                            "1px solid rgba(216,154,43,.8)",
                          borderRadius: "10px",
                          padding: "12px 20px",
                          background:
                            canAcceptAssistance
                              ? "linear-gradient(135deg,#b87918,#d89a2b,#f4c45f)"
                              : "rgba(100,100,100,.25)",
                          color:
                            canAcceptAssistance
                              ? "#111"
                              : "#777",
                          cursor:
                            canAcceptAssistance
                              ? "pointer"
                              : "not-allowed",
                          fontWeight: "800",
                          fontFamily: "Georgia, serif",
                          fontSize: "14px",
                          boxShadow:
                            canAcceptAssistance
                              ? "0 0 15px rgba(216,154,43,.18)"
                              : "none",
                          opacity:
                            canAcceptAssistance ? 1 : 0.45,
                        }}
                      >
                        🤝 ACCEPT ASSISTANCE
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}


        {/* ==================================================
    ACCEPTED ASSISTANCE
    ================================================== */}

        {activeTab === "ACCEPTED" &&
          acceptedAssistanceRequests.length > 0 && (
            <div
              style={{
                marginBottom: "25px",
              }}
            >
              {acceptedAssistanceRequests.map(
                (request) => (
                  <div
                    key={request._id}
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(45,30,8,.96), rgba(15,10,3,.98))",
                      border:
                        "2px solid rgba(216,154,43,.75)",
                      borderRadius: "18px",
                      padding: "22px 25px",
                      marginBottom: "15px",
                      boxShadow:
                        "0 0 25px rgba(216,154,43,.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: "20px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            color: "#d89a2b",
                            fontSize: "22px",
                            letterSpacing: "1.5px",
                          }}
                        >
                          🔔 ASSISTANCE ACCEPTED
                        </h2>

                        <p
                          style={{
                            margin:
                              "10px 0 0",
                            color: "#fff",
                            fontSize: "17px",
                          }}
                        >
                          CUSTOMER:{" "}
                          <strong>
                            {request.customerName}
                          </strong>
                        </p>

                        <p
                          style={{
                            margin:
                              "6px 0 0",
                            color: "#fff",
                            fontSize: "17px",
                          }}
                        >
                          TABLE:{" "}
                          <strong>
                            {request.tableNumber}
                          </strong>
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          completeAssistance(
                            request._id
                          )
                        }
                        style={{
                          border:
                            "1px solid rgba(216,154,43,.8)",
                          borderRadius: "10px",
                          padding:
                            "12px 20px",
                          background:
                            "linear-gradient(135deg,#b87918,#d89a2b,#f4c45f)",
                          color: "#111",
                          cursor: "pointer",
                          fontWeight: "800",
                          fontFamily:
                            "Georgia, serif",
                          fontSize: "14px",
                          boxShadow:
                            "0 0 15px rgba(216,154,43,.18)",
                        }}
                      >
                        ✓ ASSISTANCE PROVIDED
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

        {activeOrders.length === 0 &&
          (
            activeTab === "READY"
              ? activeAssistanceRequests.length === 0
              : activeTab === "ACCEPTED"
                ? acceptedAssistanceRequests.length === 0
                : true
          ) ? (
          <div className="waiter-empty">

            <h1>
              {activeTab === "READY" &&
                "NO ORDERS READY"}

              {activeTab === "ACCEPTED" &&
                "ACCEPTED ORDERS"}

              {activeTab === "SERVED" &&
                "NO SERVED ORDERS"}
            </h1>

            <p>
              {activeTab === "READY" &&
                "Waiting for chef to mark orders as ready..."}

              {activeTab === "ACCEPTED" &&
                "Accepted orders and assistance requests will appear here..."}

              {activeTab === "SERVED" &&
                "Completed table service orders will appear here..."}
            </p>
          </div>

        ) : (

          <div className="waiter-orders">

            {activeOrders.map((order) => (

              <div
                key={order._id}
                className="waiter-order-card"
              >

                <div className="waiter-order-info">
                  <h2>
                    ORDER #{order._id || order.id}
                  </h2>

                  <h3>
                    Status :{" "}
                    {order.status}
                  </h3>

                  <p>
                    Ordered At :{" "}
                    {order.createdAt
                      ? new Date(
                        order.createdAt
                      ).toLocaleTimeString()
                      : order.time}
                  </p>

                  {/* CHEF */}
                  <p
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    <strong>FROM:</strong>{" "}
                    {order.chef?.name ||
                      "Chef"}
                  </p>

                  {/* CATEGORY */}
                  <p>
                    <strong>CATEGORY:</strong>{" "}
                    {[
                      ...new Set(
                        (order.items || [])
                          .map(
                            (item) =>
                              item.category
                          )
                          .filter(Boolean)
                      ),
                    ].join(", ") ||
                      "MAIN COURSE"}
                  </p>

                  {/* TABLE */}
                  <p>
                    <strong>TO:</strong>{" "}
                    TABLE{" "}
                    {order.tableNumber ||
                      "N/A"}
                  </p>

                  {/* CUSTOMER */}
                  <p>
                    <strong>CUSTOMER:</strong>{" "}
                    {order.customerName ||
                      "Customer"}
                  </p>
                </div>

                <div className="waiter-order-items">

                  <h4>
                    ORDER ITEMS
                  </h4>

                  <ul>

                    {order.items?.map(
                      (item) => (

                        <li
                          key={
                            item._id ||
                            item.id ||
                            item.name
                          }
                          style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            marginBottom: "10px",
                          }}
                        >
                          {item.name}
                          {" "}
                          <span
                            style={{
                              color: "#d89a2b",
                              fontWeight: "800",
                            }}
                          >
                            ×{" "}
                            {item.quantity ??
                              item.qty ??
                              1}
                          </span>
                        </li>

                      )
                    )}

                  </ul>

                </div>

                {order.status === "READY" && (
                  <div
                    style={{
                      marginTop: "18px",
                      marginBottom: "18px",
                      padding: "15px",
                      borderRadius: "12px",
                      background:
                        "rgba(216,154,43,.07)",
                      border:
                        "1px solid rgba(216,154,43,.22)",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "#d89a2b",
                        fontWeight: "800",
                        letterSpacing: "1px",
                      }}
                    >
                      WAITER DESCRIPTION
                    </p>

                    <p
                      style={{
                        margin: 0,
                        color: "#ddd",
                        lineHeight: "1.6",
                      }}
                    >
                      {order.waiterDescription?.trim()
                        ? order.waiterDescription
                        : "No special instructions."}
                    </p>

                    <div
                      style={{
                        marginTop: "14px",
                        color: "#d89a2b",
                        fontWeight: "800",
                        fontSize: "15px",
                      }}
                    >
                      ⏱ ESTIMATED SERVICE TIME: 8 MIN
                    </div>
                  </div>
                )}

                <div className="waiter-order-actions">

                  {order.status ===
                    "READY" && (

                      <button
                        className="way-btn"
                        disabled={!canAcceptOrder}
                        onClick={() => {
                          if (canAcceptOrder) {
                            sendToTable(order._id);
                          }
                        }}
                        style={{
                          opacity: canAcceptOrder ? 1 : 0.45,
                          cursor: canAcceptOrder
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        🤝
                        &nbsp;
                        ACCEPT ORDER
                      </button>

                    )}

                  {order.status === "ON_THE_WAY" &&
                    order.waiter?.staffId ===
                    localStorage.getItem("staffId") && (

                      <button
                        className="served-btn"
                        onClick={() =>
                          markServed(order._id)
                        }
                      >
                        ✅
                        &nbsp;
                        SERVED TO TABLE
                      </button>

                    )}

                </div>

              </div>

            ))}

          </div>

        )}

        <div className="waiter-footer">

          <span>
            Orders received from Chef
            Dashboard
          </span>

          <span>
            Restaurant Service System
          </span>

        </div>

      </main>

    </div>
  );
}