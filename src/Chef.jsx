import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaClipboardList,
  FaUtensils,
  FaBell,
  FaCheckCircle,
  FaSignOutAlt,
  FaClock,
  FaCheck,
} from "react-icons/fa";

import logo from "./assets/bg.png";

import "./Chef.css";

export default function Chef() {

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

    if (role !== "chef") {

      navigate("/staff-login");

    }

  }, []);

  const [orders, setOrders] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState("NEW");

  const currentStaffId =
    localStorage.getItem("staffId");

  const currentStaffName =
    localStorage.getItem("staffName");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          "/api/orders"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch orders"
          );
        }

        const fetchedOrders = data.orders || [];

        /*
          FIFO:
          Oldest order first
          Newest order last
        */
        const sortedOrders = [...fetchedOrders].sort(
          (a, b) => {
            const timeA = new Date(
              a.createdAt
            ).getTime();

            const timeB = new Date(
              b.createdAt
            ).getTime();

            if (timeA !== timeB) {
              return timeA - timeB;
            }

            return String(a._id).localeCompare(
              String(b._id)
            );
          }
        );

        setOrders(sortedOrders);
      } catch (error) {
        console.error(
          "Failed to load orders:",
          error
        );
      }
    };

    // Load immediately
    fetchOrders();

    // Check for new orders every 2 seconds
    const interval = setInterval(
      fetchOrders,
      2000
    );

    // Stop checking when leaving Chef page
    return () => clearInterval(interval);
  }, []);

  const acceptOrder = async (id) => {
    try {
      const response = await fetch(
        `/api/orders/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "PREPARING",
            staffId: localStorage.getItem("staffId"),
            staffName: localStorage.getItem("staffName"),
            staffRole: "chef",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update order"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === id
            ? data.order
            : order
        )
      );
    } catch (error) {
      console.error(
        "Accept order error:",
        error
      );

      alert(
        error.message ||
        "Unable to accept order"
      );
    }
  };

  const markReady = async (id) => {
    try {
      const response = await fetch(
        `/api/orders/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "READY",
            staffId: localStorage.getItem("staffId"),
            staffName: localStorage.getItem("staffName"),
            staffRole: "chef",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update order"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === id
            ? data.order
            : order
        )
      );
    } catch (error) {
      console.error(
        "Mark ready error:",
        error
      );

      alert(
        "Unable to mark order as ready"
      );
    }
  };

  const newOrdersCount =
    orders.filter(
      (o) => o.status === "NEW"
    ).length;

  const preparingCount =
    orders.filter(
      (o) =>
        o.status === "PREPARING" &&
        String(
          o.chef?.staffId || ""
        ) === String(
          currentStaffId || ""
        )
    ).length;

  const readyCount =
    orders.filter(
      (o) =>
        o.status === "READY" &&
        String(
          o.chef?.staffId || ""
        ) === String(
          currentStaffId || ""
        )
    ).length;

  const completedCount =
    orders.filter(
      (o) =>
        o.status === "SERVED" &&
        String(
          o.chef?.staffId || ""
        ) === String(
          currentStaffId || ""
        )
    ).length;

  /*
    ==========================================
    NEW ORDERS
    ==========================================
  
    Shared FIFO queue.
  
    All chefs see the same NEW orders.
  
    Only the oldest 5 are eligible to accept.
  */

  const newOrders = orders
    .filter(
      (order) =>
        order.status === "NEW"
    )
    .sort((a, b) => {
      const timeA = new Date(
        a.createdAt
      ).getTime();

      const timeB = new Date(
        b.createdAt
      ).getTime();

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return String(a._id).localeCompare(
        String(b._id)
      );
    });


  /*
    ==========================================
    CHEF'S OWN PREPARING ORDERS
    ==========================================
  */

  const myPreparingOrders =
    orders.filter(
      (order) =>
        order.status ===
        "PREPARING" &&
        String(
          order.chef?.staffId || ""
        ) === String(
          currentStaffId || ""
        )
    );


  /*
    ==========================================
    CHEF'S OWN READY ORDERS
    ==========================================
  */

  const myReadyOrders =
    orders.filter(
      (order) =>
        order.status ===
        "READY" &&
        String(
          order.chef?.staffId || ""
        ) === String(
          currentStaffId || ""
        )
    );


  /*
    ==========================================
    CHEF'S OWN COMPLETED ORDERS
    ==========================================
  */

  const myCompletedOrders =
    orders.filter(
      (order) =>
        order.status ===
        "SERVED" &&
        String(
          order.chef?.staffId || ""
        ) === String(
          currentStaffId || ""
        )
    );


  /*
    ==========================================
    FIFO TOP 5
    ==========================================
  */

  const fifoOrders =
    newOrders.slice(0, 5);


  /*
    ==========================================
    CURRENT TAB
    ==========================================
  */

  let filteredOrders = [];

  if (activeTab === "NEW") {
    filteredOrders = newOrders;
  }

  if (
    activeTab === "PREPARING"
  ) {
    filteredOrders =
      myPreparingOrders;
  }

  if (activeTab === "READY") {
    filteredOrders =
      myReadyOrders;
  }

  if (
    activeTab === "COMPLETED"
  ) {
    filteredOrders =
      myCompletedOrders;
  }

  return (

    <div className="chef-page">

      <aside className="chef-sidebar">

        <div>

          <div className="chef-logo-box">

            <img
              src={logo}
              alt="logo"
              className="chef-logo"
            />

          </div>

          <div className="chef-menu">

            <div
              className={
                activeTab ===
                  "NEW"
                  ? "chef-menu-active"
                  : "chef-menu-item"
              }
              onClick={() =>
                setActiveTab(
                  "NEW"
                )
              }
            >

              <FaClipboardList />

              <span>
                New Orders
              </span>

              <div className="chef-badge">
                {
                  newOrdersCount
                }
              </div>

            </div>

            <div
              className={
                activeTab ===
                  "PREPARING"
                  ? "chef-menu-active"
                  : "chef-menu-item"
              }
              onClick={() =>
                setActiveTab(
                  "PREPARING"
                )
              }
            >

              <FaUtensils />

              <span>
                Preparing
              </span>

              <div className="chef-badge-dark">
                {
                  preparingCount
                }
              </div>

            </div>

            <div
              className={
                activeTab ===
                  "READY"
                  ? "chef-menu-active"
                  : "chef-menu-item"
              }
              onClick={() =>
                setActiveTab(
                  "READY"
                )
              }
            >

              <FaBell />

              <span>
                Ready
              </span>

              <div className="chef-badge-dark">
                {
                  readyCount
                }
              </div>

            </div>

            <div
              className={
                activeTab ===
                  "COMPLETED"
                  ? "chef-menu-active"
                  : "chef-menu-item"
              }
              onClick={() =>
                setActiveTab(
                  "COMPLETED"
                )
              }
            >

              <FaCheckCircle />

              <span>
                Completed
              </span>

              <div className="chef-badge-dark">
                {
                  completedCount
                }
              </div>

            </div>

          </div>

        </div>

        <div>

          <div className="chef-profile">

            <div className="chef-avatar">
              👨‍🍳
            </div>

            <div>

              <h3>
                {currentStaffName || "Chef"}
              </h3>

              <p>
                Kitchen Manager
              </p>

            </div>

          </div>

          <div
            className="chef-logout"
            onClick={handleLogout}
          >

            <FaSignOutAlt />

            Logout

          </div>

        </div>

      </aside>

      <main className="chef-main">

        <div className="chef-header">

          <div>

            <h3 className="chef-welcome">
              Welcome {currentStaffName || "Chef"} 👨‍🍳
            </h3>

            <h1 className="chef-title">
              CHEF DASHBOARD
            </h1>

          </div>

          <div className="chef-time">

            <FaClock />

            <div>

              <h3>
                {new Date().toLocaleTimeString()}
              </h3>

              <p>
                Live Kitchen
              </p>

            </div>

          </div>

        </div>
        <div className="chef-stats">

          <div className="chef-stat-card">

            <FaClipboardList />

            <div>

              <h2>
                {newOrdersCount}
              </h2>

              <p>
                New Orders
              </p>

            </div>

          </div>

          <div className="chef-stat-card">

            <FaUtensils />

            <div>

              <h2>
                {preparingCount}
              </h2>

              <p>
                Preparing
              </p>

            </div>

          </div>

          <div className="chef-stat-card ready">

            <FaBell />

            <div>

              <h2>
                {readyCount}
              </h2>

              <p>
                Ready
              </p>

            </div>

          </div>

          <div className="chef-stat-card completed">

            <FaCheckCircle />

            <div>

              <h2>
                {completedCount}
              </h2>

              <p>
                Completed
              </p>

            </div>

          </div>

        </div>

        <div className="chef-section-title">

          {activeTab === "NEW" &&
            "NEW ORDERS"}

          {activeTab ===
            "PREPARING" &&
            "PREPARING ORDERS"}

          {activeTab ===
            "READY" &&
            "READY FOR SERVICE"}

          {activeTab ===
            "COMPLETED" &&
            "COMPLETED ORDERS"}

        </div>

        {filteredOrders.length === 0 ? (

          <div className="chef-empty">

            <h1>
              NO ORDERS
            </h1>

            <p>
              No orders available
              in this section.
            </p>

          </div>

        ) : (

          <div className="chef-orders">

            {filteredOrders.map(
              (order) => (

                <div
                  key={order._id}
                  className="chef-order-card"
                >

                  {/* ORDER INFORMATION */}
                  <div className="chef-order-info">

                    <h3>
                      Status : {order.status}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginTop: "12px",
                      }}
                    >

                      {/* ORDER TIME */}
                      <div
                        style={{
                          padding: "9px 16px",
                          borderRadius: "9px",
                          background: "rgba(216,154,43,0.10)",
                          border: "1px solid rgba(216,154,43,0.20)",
                        }}
                      >
                        <span
                          style={{
                            color: "#999",
                            fontSize: "11px",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          ORDER TIME
                        </span>

                        <strong style={{ color: "#fff" }}>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "-"}
                        </strong>
                      </div>

                      {/* TABLE */}
                      <div
                        style={{
                          padding: "9px 16px",
                          borderRadius: "9px",
                          background: "rgba(216,154,43,0.10)",
                          border: "1px solid rgba(216,154,43,0.20)",
                        }}
                      >
                        <span
                          style={{
                            color: "#999",
                            fontSize: "11px",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          TABLE
                        </span>

                        <strong style={{ color: "#fff" }}>
                          {order.tableNumber
                            ? `Table ${order.tableNumber}`
                            : "Not selected"}
                        </strong>
                      </div>

                    </div>

                  </div>


                  {/* ORDER ITEMS */}
                  <div className="chef-order-items">

                    <h4>
                      ORDER ITEMS
                    </h4>

                    {order.items?.map((item, index) => (
                      <div
                        key={
                          item._id ||
                          `${order._id}-${index}`
                        }
                        style={{
                          marginBottom: "18px",
                          paddingBottom: "16px",
                          borderBottom:
                            index !== order.items.length - 1
                              ? "1px solid rgba(255,255,255,0.08)"
                              : "none",
                        }}
                      >

                        {/* CATEGORY */}
                        <div
                          style={{
                            color: "#d89a2b",
                            fontSize: "36px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.6px",
                            marginBottom: "7px",
                          }}
                        >
                          {item.category || "UNCATEGORIZED"}
                        </div>

                        {/* ITEM NAME */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "20px",
                          }}
                        >

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >

                            <span
                              style={{
                                color: "#fff",
                                fontSize: "26px",
                                fontWeight: "700",
                                lineHeight: "1.3",
                              }}
                            >
                              {item.name}
                            </span>

                            <span
                              style={{
                                color: "#aaa",
                                fontSize: "16px",
                                fontWeight: "600",
                              }}
                            >
                              × {item.quantity}
                            </span>

                          </div>

                          {/* PRICE */}
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "17px",
                              fontWeight: "700",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₹{item.price}
                          </span>

                        </div>

                      </div>
                    ))}

                  </div>


                  {/* DESCRIPTION TO CHEF */}
                  {order.chefDescription &&
                    order.chefDescription.trim() !== "" && (
                      <div
                        style={{
                          marginTop: "4px",
                          marginBottom: "18px",
                          padding: "16px 18px",
                          borderRadius: "12px",
                          background: "rgba(216,154,43,0.08)",
                          border: "1px solid rgba(216,154,43,0.25)",
                        }}
                      >

                        <div
                          style={{
                            color: "#d89a2b",
                            fontSize: "13px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            marginBottom: "8px",
                          }}
                        >
                          👨‍🍳 DESCRIPTION TO CHEF
                        </div>

                        <div
                          style={{
                            color: "#eee",
                            fontSize: "15px",
                            lineHeight: "1.6",
                          }}
                        >
                          {order.chefDescription}
                        </div>

                      </div>
                    )}


                  {/* ESTIMATED TIME */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "9px 15px",
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ddd",
                      marginBottom: "18px",
                    }}
                  >
                    <FaClock />

                    <span>
                      Estimated Time:
                    </span>

                    <strong
                      style={{
                        color: "#d89a2b",
                      }}
                    >
                      {order.chef?.targetMinutes || 15} MIN
                    </strong>
                  </div>
                  <div className="chef-order-actions">

                    {order.status === "NEW" && (
                      (() => {
                        const fifoIndex =
                          fifoOrders.findIndex(
                            (fifoOrder) =>
                              fifoOrder._id ===
                              order._id
                          );

                        const isFifoEligible =
                          fifoIndex !== -1;

                        const hasReachedLimit =
                          preparingCount >= 2;

                        return isFifoEligible &&
                          !hasReachedLimit ? (
                          <button
                            className="accept-btn"
                            onClick={() =>
                              acceptOrder(order._id)
                            }
                          >
                            <FaCheck />
                            &nbsp;
                            ACCEPT ORDER
                          </button>
                        ) : (
                          <button
                            className="accept-btn"
                            disabled
                            style={{
                              opacity: 0.45,
                              cursor: "not-allowed",
                            }}
                          >
                            <FaClock />
                            &nbsp;
                            {hasReachedLimit
                              ? "MAX 2 ORDERS ACTIVE"
                              : "WAITING — FIFO QUEUE"}
                          </button>
                        );
                      })()
                    )}

                    {order.status ===
                      "PREPARING" && (

                        <button
                          className="ready-btn"
                          onClick={() =>
                            markReady(
                              order._id
                            )
                          }
                        >
                          🔔
                          &nbsp;
                          READY FOR SERVICE
                        </button>

                      )}

                    {order.status ===
                      "READY" && (

                        <button
                          className="preparing-btn"
                        >
                          READY FOR WAITER
                        </button>

                      )}

                    {order.status ===
                      "SERVED" && (

                        <button
                          className="preparing-btn"
                        >
                          COMPLETED
                        </button>

                      )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

        <div className="chef-footer">

          <span>
            Orders received from
            customer billing.
          </span>

          <span>
            Kitchen Management
            System
          </span>

        </div>

      </main>

    </div>

  );
}