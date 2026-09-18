import { useState, useEffect, useRef } from "react";
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

const isFoodItem = (item) =>
  String(item?.serviceType || "FOOD").toUpperCase() !==
  "SERVICE";

/*
  ==========================================================
  ITEM TIMER
  ==========================================================

  The timer is calculated from the server-side acceptedAt time.
  We never store a decreasing "remaining seconds" value.

  GREEN  -> normal preparation time
  ORANGE -> final 5 minutes
  RED    -> deadline passed
*/
function ItemTimer({ item, orderAcceptedAt, stopped }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (stopped) return undefined;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [stopped]);

  const acceptedAt =
    item.acceptedAt ||
    orderAcceptedAt ||
    null;

  const totalMinutes = Math.max(
    1,
    Number(item.chefOrangeMinutes) || 20
  );

  const greenMinutes = Math.max(
    0,
    Number(item.chefGreenMinutes) ||
    Math.max(0, totalMinutes - 5)
  );

  const startTime = acceptedAt
    ? new Date(acceptedAt).getTime()
    : null;

  const stopTime =
    stopped && item.readyAt
      ? new Date(item.readyAt).getTime()
      : now;

  const elapsedSeconds =
    startTime && !Number.isNaN(startTime)
      ? Math.max(
        0,
        (stopTime - startTime) / 1000
      )
      : 0;
  const totalSeconds = totalMinutes * 60;

  const remainingSeconds =
    Math.max(
      0,
      totalSeconds - elapsedSeconds
    );

  const lateSeconds =
    Math.max(
      0,
      elapsedSeconds - totalSeconds
    );

  let timerState = "GREEN";

  if (elapsedSeconds >= totalSeconds) {
    timerState = "RED";
  } else if (
    elapsedSeconds >= greenMinutes * 60
  ) {
    timerState = "ORANGE";
  }

  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  const progress =
    totalSeconds > 0
      ? Math.max(
        0,
        Math.min(
          1,
          remainingSeconds / totalSeconds
        )
      )
      : 0;

  const dashOffset =
    circumference * (1 - progress);

  const timerColor =
    timerState === "GREEN"
      ? "#22c55e"
      : timerState === "ORANGE"
        ? "#f59e0b"
        : "#ef4444";

  const formatSeconds = (seconds) => {
    const safeSeconds = Math.max(
      0,
      Math.ceil(seconds)
    );

    const minutes = Math.floor(
      safeSeconds / 60
    );

    const secs = safeSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const displayTime =
    timerState === "RED"
      ? `+${formatSeconds(lateSeconds)}`
      : formatSeconds(remainingSeconds);

  return (
    <div
      style={{
        minWidth: "118px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "104px",
          height: "104px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#151515",
          boxShadow:
            `0 0 0 1px ${timerColor}55, 0 0 22px ${timerColor}22`,
        }}
      >
        <svg
          width="104"
          height="104"
          viewBox="0 0 104 104"
          style={{
            position: "absolute",
            inset: 0,
            transform: "rotate(-90deg)",
          }}
        >
          <circle
            cx="52"
            cy="52"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />

          <circle
            cx="52"
            cy="52"
            r={radius}
            fill="none"
            stroke={timerColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={
              stopped
                ? circumference *
                (1 -
                  Math.max(
                    0,
                    Math.min(
                      1,
                      remainingSeconds /
                      totalSeconds
                    )
                  ))
                : dashOffset
            }
            style={{
              transition:
                "stroke-dashoffset 0.8s linear, stroke 0.2s ease",
            }}
          />
        </svg>

        {timerState === "RED" && (
          <div
            style={{
              position: "absolute",
              inset: "7px",
              borderRadius: "50%",
              border: "2px solid #ef4444",
              opacity: 0.8,
            }}
          />
        )}

        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: timerColor,
              fontSize: "21px",
              fontWeight: "800",
              lineHeight: 1,
              fontVariantNumeric:
                "tabular-nums",
            }}
          >
            {displayTime}
          </div>

          <div
            style={{
              color: "#888",
              fontSize: "9px",
              fontWeight: "700",
              marginTop: "6px",
              letterSpacing: "1px",
            }}
          >
            {timerState === "RED"
              ? "LATE"
              : stopped
                ? "STOPPED"
                : "REMAINING"}
          </div>
        </div>
      </div>

      <div
        style={{
          color: timerColor,
          fontSize: "10px",
          fontWeight: "800",
          letterSpacing: "0.8px",
          textAlign: "center",
        }}
      >
        {stopped
          ? "TIMER STOPPED"
          : timerState === "RED"
            ? "DEADLINE PASSED"
            : timerState === "ORANGE"
              ? "FINAL 5 MIN"
              : "ON TIME"}
      </div>
    </div>
  );
}

export default function Chef() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] =
    useState("NEW");

  const [currentTime, setCurrentTime] =
    useState(new Date());
  const [creditPoints, setCreditPoints] = useState(0);
  const [creditChange, setCreditChange] = useState(null);
  const previousCreditPoints = useRef(null);

  const currentStaffId =
    localStorage.getItem("staffId");

  const currentStaffName =
    localStorage.getItem("staffName");

  const handleLogout = () => {
    if (currentStaffId) {
      fetch(`/api/staff/${currentStaffId}/logout`, { method: "PATCH", keepalive: true });
    }
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("userRole");
    localStorage.removeItem("staffId");
    localStorage.removeItem("staffName");
    localStorage.removeItem("staffUsername");

    navigate("/staff-login");
  };

  useEffect(() => {
    const role =
      localStorage.getItem("userRole");

    if (role !== "chef") {
      navigate("/staff-login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!currentStaffId) return undefined;
    const loadCredits = async () => {
      const response = await fetch(`/api/staff/${currentStaffId}/credits`);
      if (response.ok) {
        const data = await response.json();
        const nextPoints = data.creditPoints || 0;
        if (previousCreditPoints.current !== null && nextPoints !== previousCreditPoints.current) {
          setCreditChange(nextPoints - previousCreditPoints.current);
        }
        previousCreditPoints.current = nextPoints;
        setCreditPoints(nextPoints);
      }
    };
    loadCredits();
    const interval = setInterval(loadCredits, 5000);
    return () => clearInterval(interval);
  }, [currentStaffId]);

  useEffect(() => {
    if (creditChange === null) return undefined;
    const timer = setTimeout(() => setCreditChange(null), 1800);
    return () => clearTimeout(timer);
  }, [creditChange]);

  /*
    Live clock for the header.
  */
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () =>
      clearInterval(clockInterval);
  }, []);

  /*
    Load orders every 2 seconds.
  */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          "/api/orders"
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to fetch orders"
          );
        }

        const fetchedOrders =
          data.orders || [];

        /*
          FIFO:
          Oldest order first.
        */
        const sortedOrders =
          [...fetchedOrders].sort(
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

              return String(
                a._id
              ).localeCompare(
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

    fetchOrders();

    const interval = setInterval(
      fetchOrders,
      2000
    );

    return () =>
      clearInterval(interval);
  }, []);

  /*
    ==========================================================
    CHEF ACCEPT ORDER
    ==========================================================

    The backend:
    - checks FIFO top 5
    - checks max 2 active orders
    - assigns the chef
    - starts every item timer at the same acceptedAt time
  */
  const acceptOrder = async (id) => {
    try {
      const response = await fetch(
        `/api/orders/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: "PREPARING",
            staffId:
              localStorage.getItem(
                "staffId"
              ),
            staffName:
              localStorage.getItem(
                "staffName"
              ),
            staffRole: "chef",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to accept order"
        );
      }

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
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

  /*
    ==========================================================
    MARK ONE ITEM READY
    ==========================================================
  
    Chef must complete items in preference/order sequence.
  
    Example:
  
    Item 1 → READY
    Item 2 → READY
    Item 3 → READY
  
    Item 3 cannot be marked READY while
    Item 1 or Item 2 is unfinished.
  */
  const markItemReady = async (
    orderId,
    itemId
  ) => {
    try {
      /*
        Find the order currently displayed.
      */

      const currentOrder =
        orders.find(
          (order) =>
            order._id === orderId
        );

      if (!currentOrder) {
        throw new Error(
          "Order not found"
        );
      }

      const items =
        (currentOrder.items || []).filter(isFoodItem);

      const selectedIndex =
        items.findIndex(
          (item) =>
            String(item._id) ===
            String(itemId)
        );

      if (selectedIndex === -1) {
        throw new Error(
          "Order item not found"
        );
      }

      /*
        --------------------------------------------------
        SEQUENTIAL CHECK
        --------------------------------------------------
  
        Every earlier food item must already be in a completed state:
        READY, ON_THE_WAY, or SERVED.
      */

      const previousItems =
        items.slice(
          0,
          selectedIndex
        );

      const unfinishedPreviousItem =
        previousItems.find(
          (item) =>
            !["READY", "ON_THE_WAY", "SERVED"].includes(item.status)
        );

      if (unfinishedPreviousItem) {
        alert(
          `Please finish "${unfinishedPreviousItem.name}" first.`
        );

        return;
      }

      /*
        --------------------------------------------------
        SEND READY REQUEST
        --------------------------------------------------
      */

      const response =
        await fetch(
          `/api/orders/${orderId}/items/${itemId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              status: "READY",

              staffId:
                localStorage.getItem(
                  "staffId"
                ),

              staffName:
                localStorage.getItem(
                  "staffName"
                ),

              staffRole: "chef",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to mark item ready"
        );
      }

      /*
        Update only this order in the
        local Chef dashboard.
      */

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order._id === orderId
                ? data.order
                : order
          )
      );

    } catch (error) {

      console.error(
        "Mark item ready error:",
        error
      );

      alert(
        error.message ||
        "Unable to mark item ready"
      );
    }
  };

  const newOrdersCount =
    orders.filter(
      (o) => o.status === "NEW"
    ).length;

  const isMyPreparingFoodOrder = (order) =>
    String(order.chef?.staffId || "") === String(currentStaffId || "") &&
    (order.items || []).some(
      (item) => isFoodItem(item) && item.status === "PREPARING"
    );

  const preparingCount =
    orders.filter(
      isMyPreparingFoodOrder
    ).length;

  const readyCount =
    orders.reduce(
      (total, order) => {
        const isMyOrder =
          String(
            order.chef?.staffId || ""
          ) === String(
            currentStaffId || ""
          );

        if (!isMyOrder) {
          return total;
        }

        return (
          total +
          (order.items || []).filter(
            (item) =>
              isFoodItem(item) &&
              item.status === "READY"
          ).length
        );
      },
      0
    );

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
    ==========================================================
    NEW ORDERS
    ==========================================================
  */
  const newOrders = orders
    .filter(
      (order) =>
        order.status === "NEW" &&
        (order.items || []).some(isFoodItem)
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

      return String(
        a._id
      ).localeCompare(
        String(b._id)
      );
    });

  /*
    ==========================================================
    CHEF'S OWN ORDERS
    ==========================================================
  */
  const myPreparingOrders =
    orders.filter(
      isMyPreparingFoodOrder
    );

  const myReadyOrders =
    orders.filter(
      (order) => {
        const isMyOrder =
          String(
            order.chef?.staffId || ""
          ) === String(
            currentStaffId || ""
          );

        if (!isMyOrder) {
          return false;
        }

        return (
          order.items || []
        ).some(
          (item) =>
            isFoodItem(item) &&
            item.status === "READY"
        );
      }
    );

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
    Only oldest 5 NEW orders are eligible.
  */
  const fifoOrders =
    newOrders.slice(0, 5);

  let filteredOrders = [];

  if (activeTab === "NEW") {
    filteredOrders = newOrders;
  }

  if (activeTab === "PREPARING") {
    filteredOrders =
      myPreparingOrders;
  }

  if (activeTab === "READY") {
    filteredOrders =
      myReadyOrders;
  }

  if (activeTab === "COMPLETED") {
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
                activeTab === "NEW"
                  ? "chef-menu-active"
                  : "chef-menu-item"
              }
              onClick={() =>
                setActiveTab("NEW")
              }
            >
              <FaClipboardList />
              <span>
                New Orders
              </span>
              <div className="chef-badge">
                {newOrdersCount}
              </div>
            </div>

            <div
              className={
                activeTab === "PREPARING"
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
                {preparingCount}
              </div>
            </div>

            <div
              className={
                activeTab === "READY"
                  ? "chef-menu-active"
                  : "chef-menu-item"
              }
              onClick={() =>
                setActiveTab("READY")
              }
            >
              <FaBell />
              <span>Ready</span>
              <div className="chef-badge-dark">
                {readyCount}
              </div>
            </div>

            <div
              className={
                activeTab === "COMPLETED"
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
                {completedCount}
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
                {currentStaffName ||
                  "Chef"}
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
              Welcome{" "}
              {currentStaffName ||
                "Chef"}{" "}
              👨‍🍳
            </h3>

            <h1 className="chef-title">
              CHEF DASHBOARD
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className={`chef-time credit-points-box ${creditChange !== null ? "credit-points-pulse" : ""}`} style={{ margin: 0 }}>
              <span style={{ color: "#ffcc4d", fontWeight: 800 }}>★ {creditPoints}</span>
              {creditChange !== null && (
                <span className={creditChange > 0 ? "credit-change credit-change-positive" : "credit-change credit-change-negative"}>
                  {creditChange > 0 ? `+${creditChange}` : creditChange}
                </span>
              )}
              <div><p>Credit Points</p></div>
            </div>
            <div className="chef-time">
              <FaClock />
              <div>
                <h3>{currentTime.toLocaleTimeString()}</h3>
                <p>Live Kitchen</p>
              </div>
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
              <p>New Orders</p>
            </div>
          </div>

          <div className="chef-stat-card">
            <FaUtensils />

            <div>
              <h2>
                {preparingCount}
              </h2>
              <p>Preparing</p>
            </div>
          </div>

          <div className="chef-stat-card ready">
            <FaBell />

            <div>
              <h2>
                {readyCount}
              </h2>
              <p>Ready</p>
            </div>
          </div>

          <div className="chef-stat-card completed">
            <FaCheckCircle />

            <div>
              <h2>
                {completedCount}
              </h2>
              <p>Completed</p>
            </div>
          </div>
        </div>

        <div className="chef-section-title">
          {activeTab === "NEW" &&
            "NEW ORDERS"}

          {activeTab ===
            "PREPARING" &&
            "PREPARING ORDERS"}

          {activeTab === "READY" &&
            "READY FOR SERVICE"}

          {activeTab ===
            "COMPLETED" &&
            "COMPLETED ORDERS"}
        </div>

        {filteredOrders.length ===
          0 ? (
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
              (order) => {
                const getPriority = (item) => {
                  const match = String(item.preference || "").match(/\d+/);
                  return match ? Number(match[0]) : 999;
                };

                const orderItems =
                  [...(order.items || []).filter(isFoodItem)].sort((a, b) => getPriority(a) - getPriority(b));

                const visibleItems =
                  activeTab === "READY"
                    ? orderItems.filter(
                      (item) =>
                        item.status === "READY"
                    )
                    : orderItems;

                const allItemsReady =
                  orderItems.length >
                  0 &&
                  orderItems.every(
                    (item) =>
                      item.status ===
                      "READY"
                  );

                const orderAcceptedAt =
                  order.chef
                    ?.acceptedAt ||
                  orderItems.find(
                    (item) =>
                      item.acceptedAt
                  )?.acceptedAt ||
                  null;

                return (
                  <div
                    key={order._id}
                    className="chef-order-card"
                  >
                    {/* ORDER INFORMATION */}
                    <div className="chef-order-info">
                      <h3>
                        Status :{" "}
                        {order.status}
                      </h3>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "12px",
                          flexWrap:
                            "wrap",
                          marginTop:
                            "12px",
                        }}
                      >
                        <div
                          style={{
                            padding:
                              "9px 16px",
                            borderRadius:
                              "9px",
                            background:
                              "rgba(216,154,43,0.10)",
                            border:
                              "1px solid rgba(216,154,43,0.20)",
                          }}
                        >
                          <span
                            style={{
                              color:
                                "#999",
                              fontSize:
                                "11px",
                              display:
                                "block",
                              marginBottom:
                                "4px",
                            }}
                          >
                            ORDER TIME
                          </span>

                          <strong
                            style={{
                              color:
                                "#fff",
                            }}
                          >
                            {order.createdAt
                              ? new Date(
                                order.createdAt
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour:
                                    "2-digit",
                                  minute:
                                    "2-digit",
                                }
                              )
                              : "-"}
                          </strong>
                        </div>

                        <div
                          style={{
                            padding:
                              "9px 16px",
                            borderRadius:
                              "9px",
                            background:
                              "rgba(216,154,43,0.10)",
                            border:
                              "1px solid rgba(216,154,43,0.20)",
                          }}
                        >
                          <span
                            style={{
                              color:
                                "#999",
                              fontSize:
                                "11px",
                              display:
                                "block",
                              marginBottom:
                                "4px",
                            }}
                          >
                            TABLE
                          </span>

                          <strong
                            style={{
                              color:
                                "#fff",
                            }}
                          >
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

                      {visibleItems.map(
                        (
                          item,
                          index
                        ) => {
                          const isReady =
                            item.status ===
                            "READY";

                          const isOnTheWay =
                            item.status ===
                            "ON_THE_WAY";

                          const isServed =
                            item.status ===
                            "SERVED";

                          const isPreparing =
                            item.status === "PREPARING";

                          const isNew =
                            item.status === "NEW";

                          const itemId =
                            item._id ||
                            `${order._id}-${index}`;

                          const previousItems =
                            orderItems.slice(0, index);

                          const previousItemsReady =
                            previousItems.every(
                              (previousItem) =>
                                ["READY", "ON_THE_WAY", "SERVED"].includes(previousItem.status)
                            );

                          const canMarkReady =
                            item.status === "PREPARING" &&
                            previousItemsReady;

                          return (
                            <div
                              key={itemId}
                              style={{
                                marginBottom:
                                  "18px",
                                padding:
                                  "16px 0",
                                borderBottom:
                                  index !==
                                    visibleItems.length - 1
                                    ? "1px solid rgba(255,255,255,0.08)"
                                    : "none",
                              }}
                            >
                              {/* ITEM ROW */}
                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "space-between",
                                  gap:
                                    "18px",
                                  width:
                                    "100%",
                                }}
                              >
                                {/* ITEM DETAILS */}
                                <div
                                  style={{
                                    flex:
                                      1,
                                    minWidth:
                                      0,
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        "#d89a2b",
                                      fontSize:
                                        "13px",
                                      fontWeight:
                                        "700",
                                      textTransform:
                                        "uppercase",
                                      letterSpacing:
                                        "0.6px",
                                      marginBottom:
                                        "7px",
                                    }}
                                  >
                                    {item.category ||
                                      "UNCATEGORIZED"}
                                  </div>

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      gap:
                                        "12px",
                                      flexWrap:
                                        "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color:
                                          "#fff",
                                        fontSize:
                                          "22px",
                                        fontWeight:
                                          "700",
                                        lineHeight:
                                          "1.3",
                                      }}
                                    >
                                      {
                                        item.name
                                      }
                                    </span>

                                    <span
                                      style={{
                                        color:
                                          "#aaa",
                                        fontSize:
                                          "16px",
                                        fontWeight:
                                          "600",
                                      }}
                                    >
                                      ×{" "}
                                      {
                                        item.quantity
                                      }
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      marginTop:
                                        "10px",
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      gap:
                                        "10px",
                                      flexWrap:
                                        "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color:
                                          "#fff",
                                        fontSize:
                                          "15px",
                                        fontWeight:
                                          "700",
                                      }}
                                    >
                                      ₹
                                      {
                                        item.price
                                      }
                                    </span>

                                    {item.preference && (
                                      <span
                                        style={{
                                          padding:
                                            "5px 9px",
                                          borderRadius:
                                            "999px",
                                          background:
                                            "rgba(216,154,43,0.10)",
                                          border:
                                            "1px solid rgba(216,154,43,0.22)",
                                          color:
                                            "#d89a2b",
                                          fontSize:
                                            "11px",
                                          fontWeight:
                                            "700",
                                        }}
                                      >
                                        {
                                          item.preference
                                        }
                                      </span>
                                    )}
                                  </div>

                                  {/* NEW ORDER ESTIMATE */}
                                  {isNew && (
                                    <div
                                      style={{
                                        marginTop:
                                          "13px",
                                        display:
                                          "inline-flex",
                                        alignItems:
                                          "center",
                                        gap:
                                          "7px",
                                        padding:
                                          "7px 11px",
                                        borderRadius:
                                          "999px",
                                        background:
                                          "rgba(255,255,255,0.05)",
                                        color:
                                          "#ccc",
                                        fontSize:
                                          "11px",
                                        fontWeight:
                                          "700",
                                      }}
                                    >
                                      <FaClock />

                                      CHEF ESTIMATE{" "}
                                      {item.chefGreenMinutes ||
                                        15}
                                      –
                                      {item.chefOrangeMinutes ||
                                        20}{" "}
                                      MIN
                                    </div>
                                  )}

                                  {/* ITEM STATUS */}
                                  <div
                                    style={{
                                      marginTop:
                                        "12px",
                                      color:
                                        isReady || isOnTheWay || isServed
                                          ? "#22c55e"
                                          : isPreparing
                                            ? "#f59e0b"
                                            : "#888",
                                      fontSize:
                                        "11px",
                                      fontWeight:
                                        "800",
                                      letterSpacing:
                                        "0.8px",
                                    }}
                                  >
                                    {isReady
                                      ? "✓ READY FOR SERVICE"
                                      : isOnTheWay
                                        ? "✓ ON THE WAY"
                                        : isServed
                                          ? "✓ SERVED"
                                          : isPreparing
                                            ? "● PREPARING"
                                            : "● WAITING FOR CHEF"}
                                  </div>
                                </div>

                                {/* TIMER / READY BUTTON */}
                                {isPreparing && (
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      flexDirection:
                                        "column",
                                      alignItems:
                                        "center",
                                      gap:
                                        "9px",
                                      flexShrink:
                                        0,
                                    }}
                                  >
                                    <ItemTimer
                                      item={
                                        item
                                      }
                                      orderAcceptedAt={
                                        orderAcceptedAt
                                      }
                                      stopped={
                                        false
                                      }
                                    />

                                    <button
                                      className="ready-btn"
                                      disabled={!canMarkReady}
                                      onClick={() =>
                                        markItemReady(
                                          order._id,
                                          item._id
                                        )
                                      }
                                      style={{
                                        minWidth: "150px",
                                        cursor: canMarkReady
                                          ? "pointer"
                                          : "not-allowed",
                                        opacity: canMarkReady
                                          ? 1
                                          : 0.45,
                                      }}
                                    >
                                      {canMarkReady
                                        ? "🔔 READY"
                                        : "🔒 FINISH PREVIOUS"}
                                    </button>
                                  </div>
                                )}

                                {(isReady || isOnTheWay || isServed) && (
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      flexDirection:
                                        "column",
                                      alignItems:
                                        "center",
                                      gap:
                                        "8px",
                                      minWidth:
                                        "150px",
                                      flexShrink:
                                        0,
                                    }}
                                  >
                                    <ItemTimer
                                      item={
                                        item
                                      }
                                      orderAcceptedAt={
                                        orderAcceptedAt
                                      }
                                      stopped={
                                        true
                                      }
                                    />

                                    <div
                                      style={{
                                        width:
                                          "150px",
                                        padding:
                                          "11px 12px",
                                        borderRadius:
                                          "10px",
                                        textAlign:
                                          "center",
                                        background:
                                          isOnTheWay
                                            ? "rgba(59,130,246,0.10)"
                                            : isServed
                                              ? "rgba(34,197,94,0.10)"
                                              : "rgba(34,197,94,0.10)",
                                        border:
                                          isOnTheWay
                                            ? "1px solid rgba(59,130,246,0.28)"
                                            : isServed
                                              ? "1px solid rgba(34,197,94,0.28)"
                                              : "1px solid rgba(34,197,94,0.28)",
                                        color:
                                          isOnTheWay
                                            ? "#60a5fa"
                                            : "#22c55e",
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          "800",
                                      }}
                                    >
                                      {isOnTheWay
                                        ? "🚚 ON THE WAY"
                                        : isServed
                                          ? "✓ SERVED"
                                          : "✓ READY FOR SERVICE"}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* DESCRIPTION TO CHEF */}
                    {order.chefDescription &&
                      order.chefDescription.trim() !==
                      "" && (
                        <div
                          style={{
                            marginTop:
                              "4px",
                            marginBottom:
                              "18px",
                            padding:
                              "16px 18px",
                            borderRadius:
                              "12px",
                            background:
                              "rgba(216,154,43,0.08)",
                            border:
                              "1px solid rgba(216,154,43,0.25)",
                          }}
                        >
                          <div
                            style={{
                              color:
                                "#d89a2b",
                              fontSize:
                                "13px",
                              fontWeight:
                                "700",
                              textTransform:
                                "uppercase",
                              marginBottom:
                                "8px",
                            }}
                          >
                            👨‍🍳 DESCRIPTION TO CHEF
                          </div>

                          <div
                            style={{
                              color:
                                "#eee",
                              fontSize:
                                "15px",
                              lineHeight:
                                "1.6",
                            }}
                          >
                            {
                              order.chefDescription
                            }
                          </div>
                        </div>
                      )}

                    {/* ORDER LEVEL ESTIMATE */}
                    <div
                      style={{
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        gap:
                          "8px",
                        padding:
                          "9px 15px",
                        borderRadius:
                          "20px",
                        background:
                          "rgba(255,255,255,0.05)",
                        color:
                          "#ddd",
                        marginBottom:
                          "18px",
                      }}
                    >
                      <FaClock />

                      <span>
                        Customer Estimate:
                      </span>

                      <strong
                        style={{
                          color:
                            "#d89a2b",
                        }}
                      >
                        {order.customerEstimate
                          ? `${order.customerEstimate.firstMinutes}-${order.customerEstimate.lastMinutes}`
                          : `${order.chef?.targetMinutes || 20}`}{" "}
                        MIN
                      </strong>
                    </div>

                    {/* ORDER ACTIONS */}
                    <div className="chef-order-actions">
                      {order.status ===
                        "NEW" &&
                        (() => {
                          const fifoIndex =
                            fifoOrders.findIndex(
                              (
                                fifoOrder
                              ) =>
                                fifoOrder._id ===
                                order._id
                            );

                          const isFifoEligible =
                            fifoIndex !==
                            -1;

                          const hasReachedLimit =
                            preparingCount >=
                            2;

                          return isFifoEligible &&
                            !hasReachedLimit ? (
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
                          ) : (
                            <button
                              className="accept-btn"
                              disabled
                              style={{
                                opacity:
                                  0.45,
                                cursor:
                                  "not-allowed",
                              }}
                            >
                              <FaClock />
                              &nbsp;
                              {hasReachedLimit
                                ? "MAX 2 ORDERS ACTIVE"
                                : "WAITING — FIFO QUEUE"}
                            </button>
                          );
                        })()}

                      {order.status ===
                        "PREPARING" && (
                          <div
                            style={{
                              width:
                                "100%",
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              gap:
                                "15px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <div
                              style={{
                                color:
                                  allItemsReady
                                    ? "#22c55e"
                                    : "#f59e0b",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  "800",
                                letterSpacing:
                                  "0.6px",
                              }}
                            >
                              {allItemsReady
                                ? "✓ ALL ITEMS READY"
                                : "ITEM-BY-ITEM PREPARATION IN PROGRESS"}
                            </div>
                          </div>
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
                );
              }
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
