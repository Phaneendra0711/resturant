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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          "/api/orders"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to fetch orders"
          );
        }

        setOrders(data.orders || []);

      } catch (error) {
        console.error(
          "Failed to load waiter orders:",
          error
        );
      }
    };

    fetchOrders();

    // Keep waiter dashboard updated
    const interval = setInterval(
      fetchOrders,
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
      console.error(
        "Mark served error:",
        error
      );

      alert(
        "Unable to mark order as served"
      );
    }
  };

  const waiterOrders =
    orders.filter(
      (order) =>
        order.status ===
        "READY" ||
        order.status ===
        "ON_THE_WAY"
    );

  const readyCount =
    orders.filter(
      (o) =>
        o.status ===
        "READY"
    ).length;

  const wayCount =
    orders.filter(
      (o) =>
        o.status ===
        "ON_THE_WAY"
    ).length;

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

            <div className="waiter-menu-active">

              <FaClipboardList />

              <span>
                Ready Orders
              </span>

              <div className="waiter-badge">
                {readyCount}
              </div>

            </div>

            <div className="waiter-menu-item">

              <FaMotorcycle />

              <span>
                On The Way
              </span>

              <div className="waiter-badge-dark">
                {wayCount}
              </div>

            </div>

            <div className="waiter-menu-item">

              <FaCheckCircle />

              <span>
                Served
              </span>

              <div className="waiter-badge-dark">
                {
                  orders.filter(
                    (o) =>
                      o.status ===
                      "SERVED"
                  ).length
                }
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
                Waiter
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
              Welcome Waiter 🧑‍💼
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
                {wayCount}
              </h2>

              <p>
                On The Way
              </p>

            </div>

          </div>

        </div>

        <div className="waiter-section-title">
          READY FOR SERVICE
        </div>
        {waiterOrders.length === 0 ? (

          <div className="waiter-empty">

            <h1>
              NO ORDERS READY
            </h1>

            <p>
              Waiting for chef to mark
              orders as ready...
            </p>

          </div>

        ) : (

          <div className="waiter-orders">

            {waiterOrders.map((order) => (

              <div
                key={order.id}
                className="waiter-order-card"
              >

                <div className="waiter-order-info">

                  <h2>
                    ORDER #{order._id || order.id}
                  </h2>

                  <h3>
                    Status :
                    {" "}
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
                        >
                          {item.name}
                          {" "}
                          ×
                          {" "}
                          {item.quantity ??
                            item.qty ??
                            1}
                        </li>

                      )
                    )}

                  </ul>

                </div>

                <div className="waiter-order-actions">

                  {order.status ===
                    "READY" && (

                      <button
                        className="way-btn"
                        onClick={() =>
                          sendToTable(
                            order._id
                          )
                        }
                      >
                        🚶
                        &nbsp;
                        ON THE WAY TO TABLE
                      </button>

                    )}

                  {order.status ===
                    "ON_THE_WAY" && (

                      <button
                        className="served-btn"
                        onClick={() =>
                          markServed(
                            order._id
                          )
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