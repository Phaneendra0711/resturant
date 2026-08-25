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

        setOrders(data.orders || []);
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
        o.status ===
        "PREPARING"
    ).length;

  const readyCount =
    orders.filter(
      (o) =>
        o.status ===
        "READY"
    ).length;

  const completedCount =
    orders.filter(
      (o) =>
        o.status ===
        "SERVED"
    ).length;

  const filteredOrders =
    orders.filter((order) => {

      if (
        activeTab === "NEW"
      ) {
        return (
          order.status ===
          "NEW"
        );
      }

      if (
        activeTab ===
        "PREPARING"
      ) {
        return (
          order.status ===
          "PREPARING"
        );
      }

      if (
        activeTab ===
        "READY"
      ) {
        return (
          order.status ===
          "READY"
        );
      }

      if (
        activeTab ===
        "COMPLETED"
      ) {
        return (
          order.status ===
          "SERVED"
        );
      }

      return true;
    });

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
                Head Chef
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
              Welcome Chef 👨‍🍳
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

                  <div className="chef-order-info">

                    <h2>
                      ORDER #
                      {order._id}
                    </h2>

                    <h3>
                      Status :
                      {" "}
                      {order.status}
                    </h3>

                    <p>
                      Ordered At :
                      {" "}
                      {order.createdAt}
                    </p>

                  </div>

                  <div className="chef-order-items">

                    <h4>
                      ORDER ITEMS
                    </h4>

                    <ul>

                      {order.items?.map(
                        (item) => (

                          <li
                            key={item.id}
                          >
                            {item.name}
                            {" "}
                            ×
                            {" "}
                            {item.quantity}
                            {" "}
                            —
                            {" "}
                            ₹
                            {item.price}
                          </li>

                        )
                      )}

                    </ul>

                  </div>

                  <div className="chef-order-actions">

                    {order.status ===
                      "NEW" && (

                        <button
                          className="accept-btn"
                          onClick={() =>
                            acceptOrder(
                              order._id
                            )
                          }
                        >
                          <FaCheck />
                          &nbsp;
                          ACCEPT ORDER
                        </button>

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