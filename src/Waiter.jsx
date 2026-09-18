import { useEffect, useMemo, useRef, useState } from "react";
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

const MAX_ACTIVE_TASKS = 2;

const FOOD_TARGET_MINUTES = 8;
const SERVICE_TARGET_MINUTES = 5;
const ASSISTANCE_TARGET_MINUTES = 8;

/* =========================================================
   HELPERS
========================================================= */

const getOrderId = (order) =>
  order?._id || order?.id;

const getItemId = (item) =>
  item?._id || item?.id;

const getItemQuantity = (item) =>
  Number(
    item?.quantity ??
      item?.qty ??
      1
  );

const getItemName = (item) =>
  item?.name || "Item";

const getStaffId = () =>
  localStorage.getItem("staffId");

const getStaffName = () =>
  localStorage.getItem(
    "staffName"
  ) || "Waiter";

/*
  IMPORTANT:

  Do NOT use category === BEVERAGES.

  Only Water Bottle and Coke
  are waiter service items.
*/

const isWaterOrCoke = (item) => {
  const name = String(
    item?.name || ""
  )
    .trim()
    .toUpperCase();

  return (
    name === "WATER BOTTLE" ||
    name === "COKE" ||
    name === "COCA COLA"
  );
};

const isServiceItem = (item) => {
  if (
    String(
      item?.serviceType || ""
    ).toUpperCase() ===
    "SERVICE"
  ) {
    return true;
  }

  return isWaterOrCoke(item);
};

const isFoodItem = (item) =>
  !isServiceItem(item);

const getServicePreference = (
  item
) => {
  const direct =
    String(
      item?.servicePreference ||
        ""
    )
      .trim()
      .toUpperCase();

  if (
    direct === "FIRST" ||
    direct.includes("FIRST")
  ) {
    return "FIRST";
  }

  if (
    direct === "LAST" ||
    direct.includes("LAST")
  ) {
    return "LAST";
  }

  const fallback =
    String(
      item?.preference || ""
    )
      .trim()
      .toUpperCase();

  if (
    fallback.includes("FIRST") ||
    fallback.includes("1ST")
  ) {
    return "FIRST";
  }

  if (
    fallback.includes("LAST")
  ) {
    return "LAST";
  }

  return "NOW";
};

const getWaiterTaskGroup = (order, item) => {
  // Serve-now Water/Coke must remain independent, including for old orders
  // that may contain a stale group generated before the preference changed.
  if (isServiceItem(item) && getServicePreference(item) === "NOW") {
    return `SERVICE_${getItemId(item)}`;
  }

  if (item?.waiterTaskGroup) {
    return String(item.waiterTaskGroup);
  }

  const foods = (order.items || []).filter(isFoodItem);
  const preference = getServicePreference(item);

  if (isServiceItem(item) && preference === "FIRST" && foods[0]) {
    return `FOOD_${getItemId(foods[0])}`;
  }

  if (isServiceItem(item) && preference === "LAST" && foods.length > 0) {
    return `FOOD_${getItemId(foods[foods.length - 1])}`;
  }

  return isFoodItem(item)
    ? `FOOD_${getItemId(item)}`
    : `SERVICE_${getItemId(item)}`;
};

const groupTasks = (orders, includesItem) => {
  const groups = new Map();

  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (!includesItem(order, item)) return;

      const groupId = getWaiterTaskGroup(order, item);
      const key = `${getOrderId(order)}:${groupId}`;
      const existing = groups.get(key) || {
        order,
        groupId,
        items: [],
      };

      existing.items.push(item);
      groups.set(key, existing);
    });
  });

  return [...groups.values()].map((task) => ({
    ...task,
    type: task.items.some(isFoodItem) ? "FOOD" : "SERVICE",
  }));
};

/* =========================================================
   TIMER
========================================================= */

function Timer({
  startedAt,
  targetMinutes,
  label,
}) {
  const [now, setNow] =
    useState(Date.now());

  useEffect(() => {
    const timer =
      setInterval(() => {
        setNow(Date.now());
      }, 1000);

    return () =>
      clearInterval(timer);
  }, []);

  const start =
    startedAt
      ? new Date(
          startedAt
        ).getTime()
      : now;

  const elapsed = Math.max(
    0,
    Math.floor(
      (now - start) / 1000
    )
  );

  const target =
    targetMinutes * 60;

  const late =
    elapsed >= target;

  const remaining =
    Math.max(
      0,
      target - elapsed
    );

  const value =
    late
      ? elapsed - target
      : remaining;

  const minutes =
    Math.floor(value / 60);

  const seconds =
    value % 60;

  const text =
    `${late ? "+" : ""}${String(
      minutes
    ).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

  const color =
    late
      ? "#ef4444"
      : "#22c55e";

  return (
    <div
      style={{
        minWidth: 130,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          border: `7px solid ${color}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          boxShadow:
            `0 0 22px ${color}33`,
        }}
      >
        <strong
          style={{
            color,
            fontSize: 19,
          }}
        >
          {text}
        </strong>

        <small
          style={{
            color: "#999",
            marginTop: 3,
          }}
        >
          {late ? "LATE" : label}
        </small>
      </div>

      <div
        style={{
          marginTop: 7,
          color,
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        TARGET {targetMinutes} MIN
      </div>
    </div>
  );
}

/* =========================================================
   WAITer
========================================================= */

export default function Waiter() {
  const navigate =
    useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [
    assistanceRequests,
    setAssistanceRequests,
  ] = useState([]);

  const [tab, setTab] =
    useState("READY");

  const [loading, setLoading] =
    useState(true);

  const [clock, setClock] =
    useState(new Date());
  const [creditPoints, setCreditPoints] = useState(0);
  const [creditChange, setCreditChange] = useState(null);
  const previousCreditPoints = useRef(null);

  const staffId =
    getStaffId();

  const staffName =
    getStaffName();

  /* =======================================================
     AUTH
  ======================================================= */

  useEffect(() => {
    const role =
      localStorage.getItem(
        "userRole"
      );

    if (role !== "waiter") {
      navigate("/staff-login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!staffId) return undefined;
    const loadCredits = async () => {
      const response = await fetch(`/api/staff/${staffId}/credits`);
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
  }, [staffId]);

  useEffect(() => {
    if (creditChange === null) return undefined;
    const timer = setTimeout(() => setCreditChange(null), 1800);
    return () => clearTimeout(timer);
  }, [creditChange]);

  /* =======================================================
     CLOCK
  ======================================================= */

  useEffect(() => {
    const timer =
      setInterval(() => {
        setClock(new Date());
      }, 1000);

    return () =>
      clearInterval(timer);
  }, []);

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchData = async () => {
    try {
      const [
        orderResponse,
        assistanceResponse,
      ] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/assistance"),
      ]);

      const orderData =
        await orderResponse.json();

      const assistanceData =
        await assistanceResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message
        );
      }

      if (!assistanceResponse.ok) {
        throw new Error(
          assistanceData.message
        );
      }

      setOrders(
        orderData.orders || []
      );

      setAssistanceRequests(
        assistanceData.requests || []
      );
    } catch (error) {
      console.error(
        "WAITER FETCH ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const timer =
      setInterval(
        fetchData,
        2000
      );

    return () =>
      clearInterval(timer);
  }, []);

  /* =======================================================
     SERVICE AVAILABILITY

     NOW:
       immediately

     FIRST:
       first food ready

     LAST:
       last food ready
  ======================================================= */

  const serviceAvailable = (
    order,
    item
  ) => {
    const preference =
      getServicePreference(
        item
      );

    if (
      preference === "NOW" &&
      String(item?.status || "") === "WAITING"
    ) {
      return true;
    }

    const foods =
      (order.items || []).filter(
        isFoodItem
      );

    if (foods.length === 0) {
      return false;
    }

    if (
      preference === "FIRST"
    ) {
      const first =
        foods[0];

      return [
        "READY",
        "ON_THE_WAY",
        "SERVED",
      ].includes(
        first.status
      );
    }

    if (
      preference === "LAST"
    ) {
      const last =
        foods[
          foods.length - 1
        ];

      return [
        "READY",
        "ON_THE_WAY",
        "SERVED",
      ].includes(
        last.status
      );
    }

    return false;
  };

  /* =======================================================
     READY WAITER TASK GROUPS

     A FOOD group can contain its food item plus FIRST/LAST service
     items. NOW service items form their own group.
  ======================================================= */

  const readyTaskGroups = useMemo(
    () => groupTasks(
      orders,
      (order, item) => (
        (isFoodItem(item) && item.status === "READY") ||
        (isServiceItem(item) && String(item?.status || "") === "WAITING" && serviceAvailable(order, item))
      )
    ),
    [orders]
  );

  /* =======================================================
     ASSISTANCE
  ======================================================= */

  const pendingAssistance =
    useMemo(
      () =>
        assistanceRequests.filter(
          (request) =>
            request.status ===
            "ACTIVE"
        ),
      [assistanceRequests]
    );

  /* =======================================================
     ACTIVE ITEM TASKS
  ======================================================= */

  const activeItemTasks = useMemo(
    () => groupTasks(
      orders,
      (_, item) => (
        item.status === "ON_THE_WAY" &&
        String(item.waiterId || "") === String(staffId)
      )
    ),
    [orders, staffId]
  );

  /* =======================================================
     ACTIVE ASSISTANCE
  ======================================================= */

  const activeAssistance =
    useMemo(
      () =>
        assistanceRequests.filter(
          (request) =>
            request.status ===
              "ACCEPTED" &&
            String(
              request.acceptedById ||
                ""
            ) ===
              String(staffId)
        ),
      [
        assistanceRequests,
        staffId,
      ]
    );

  /* =======================================================
     ALL ACTIVE TASKS

     FOOD + WATER + COKE + ASSISTANCE
  ======================================================= */

  const activeTasks =
    useMemo(() => {
      return [
        ...activeItemTasks,
        ...activeAssistance.map(
          (request) => ({
            type: "ASSISTANCE",
            request,
          })
        ),
      ];
    }, [
      activeItemTasks,
      activeAssistance,
    ]);

  const activeCount =
    activeTasks.length;

  const hasFreeSlot =
    activeCount <
    MAX_ACTIVE_TASKS;

  /* =======================================================
     SERVED
  ======================================================= */

  const servedItems = useMemo(
    () => groupTasks(
      orders,
      (_, item) => item.status === "SERVED"
    ),
    [orders]
  );

  const completedAssistance =
    assistanceRequests.filter(
      (request) =>
        request.status ===
        "COMPLETED"
    );

  const readyCount =
    readyTaskGroups.length +
    pendingAssistance.length;

  const servedCount =
    servedItems.length +
    completedAssistance.length;

  /* =======================================================
     ACCEPT ITEM
  ======================================================= */

  const acceptTaskGroup = async (
    orderId,
    groupId
  ) => {
    if (!hasFreeSlot) {
      alert(
        "You already have 2 active tasks."
      );
      return;
    }

    try {
      const response =
        await fetch(
          `/api/orders/${orderId}/waiter-groups/${encodeURIComponent(groupId)}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              status:
                "ON_THE_WAY",
              staffId,
              staffName,
              staffRole:
                "waiter",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message
        );
      }

      setOrders(
        (current) =>
          current.map(
            (order) =>
              String(
                getOrderId(order)
              ) ===
              String(orderId)
                ? data.order
                : order
          )
      );

      setTab("ACTIVE");
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to accept waiter task"
      );
    }
  };

  /* =======================================================
     SERVE ITEM
  ======================================================= */

  const serveTaskGroup = async (
    orderId,
    groupId
  ) => {
    try {
      const response =
        await fetch(
          `/api/orders/${orderId}/waiter-groups/${encodeURIComponent(groupId)}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              status: "SERVED",
              staffId,
              staffName,
              staffRole:
                "waiter",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message
        );
      }

      setOrders(
        (current) =>
          current.map(
            (order) =>
              String(
                getOrderId(order)
              ) ===
              String(orderId)
                ? data.order
                : order
          )
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to serve waiter task"
      );
    }
  };

  /* =======================================================
     ACCEPT ASSISTANCE
  ======================================================= */

  const acceptAssistance = async (
    requestId
  ) => {
    if (!hasFreeSlot) {
      alert(
        "You already have 2 active tasks."
      );
      return;
    }

    try {
      const response =
        await fetch(
          `/api/assistance/${requestId}/accept`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              staffId,
              staffName,
              staffRole:
                "waiter",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message
        );
      }

      setAssistanceRequests(
        (current) =>
          current.map(
            (request) =>
              String(
                request._id
              ) ===
              String(requestId)
                ? data.request
                : request
          )
      );

      setTab("ACTIVE");
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to accept assistance"
      );
    }
  };

  /* =======================================================
     COMPLETE ASSISTANCE
  ======================================================= */

  const completeAssistance =
    async (requestId) => {
      try {
        const response =
          await fetch(
            `/api/assistance/${requestId}/complete`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                staffId,
                staffName,
                staffRole:
                  "waiter",
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message
          );
        }

        setAssistanceRequests(
          (current) =>
            current.map(
              (request) =>
                String(
                  request._id
                ) ===
                String(requestId)
                  ? data.request
                  : request
            )
        );
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Unable to complete assistance"
        );
      }
    };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = () => {
    if (staffId) {
      fetch(`/api/staff/${staffId}/logout`, { method: "PATCH", keepalive: true });
    }
    localStorage.removeItem(
      "userRole"
    );

    localStorage.removeItem(
      "staffId"
    );

    localStorage.removeItem(
      "staffName"
    );

    localStorage.removeItem(
      "staffUsername"
    );

    navigate(
      "/staff-login"
    );
  };

  /* =======================================================
     CARD
  ======================================================= */

  const Card = ({
    children,
  }) => (
    <div
      style={{
        background:
          "linear-gradient(145deg,#151515,#0d0d0d)",
        border:
          "1px solid rgba(216,154,43,.2)",
        borderRadius: 18,
        padding: 22,
        marginBottom: 15,
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        gap: 25,
        flexWrap: "wrap",
      }}
    >
      {children}
    </div>
  );

  /* =======================================================
     READY TASK GROUP CARD
  ======================================================= */

  const renderReadyTask = ({ order, groupId, items, type }) => {
    const foodItems = items.filter(isFoodItem);
    const chefName = foodItems.map((item) => item?.chefName).find(Boolean) || "Unassigned";

    return (
      <Card
        key={`${getOrderId(order)}-${groupId}`}
      >
        <div>
          <div
            style={{
              color: "#22c55e",
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            {type === "FOOD" ? "READY TO SERVE" : "READY SERVICE ITEM"}
          </div>

          <h2
            style={{
              color: "#fff",
              margin: "0 0 10px",
            }}
          >
            {items.map((item, index) => (
              <span key={getItemId(item)}>
                {index > 0 && " + "}
                {isServiceItem(item) ? "🥤" : "🍽️"} {getItemName(item)} × {getItemQuantity(item)}
              </span>
            ))}
          </h2>

          <p>
            <strong>
              ORDER:
            </strong>{" "}
            #
            {String(
              getOrderId(order)
            ).slice(-6)}
          </p>

          <p>
            <strong>
              CUSTOMER:
            </strong>{" "}
            {order.customerName ||
              "Customer"}
          </p>

          <p>
            <strong>
              TABLE:
            </strong>{" "}
            {order.tableNumber ||
              "N/A"}
          </p>

          {type === "FOOD" && (
            <p>
              <strong>
                CHEF:
              </strong>{" "}
              {chefName}
            </p>
          )}

          <p>
            <strong>
              PREFERENCE:
            </strong>{" "}
            {type === "FOOD" ? "FOOD SERVICE GROUP" : "SERVE NOW"}
          </p>
        </div>

        <button
          className="way-btn"
          disabled={!hasFreeSlot}
          onClick={() =>
            acceptTaskGroup(
              getOrderId(order),
              groupId
            )
          }
          style={{
            minWidth: 190,
            padding:
              "14px 20px",
            opacity:
              hasFreeSlot
                ? 1
                : 0.45,
          }}
        >
          🚶 SERVE NOW
        </button>
      </Card>
    );
  };

  /* =======================================================
     ASSISTANCE CARD
  ======================================================= */

  const renderAssistance = (
    request
  ) => {
    const isCashRequest =
      String(request?.type || "ASSISTANCE").toUpperCase() === "CASH_PAYMENT" ||
      String(request?.paymentType || "").toUpperCase() === "CASH";

    return (
      <Card
        key={request._id}
      >
        <div>
          <div
            style={{
              color: isCashRequest ? "#f4c45f" : "#d89a2b",
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            {isCashRequest ? "💵 CASH REQUEST" : "🔔 ASSISTANCE"}
          </div>

          <h2
            style={{
              color: "#fff",
              margin:
                "0 0 10px",
            }}
          >
            {isCashRequest ? "HARD CASH PAYMENT" : "CUSTOMER ASSISTANCE"}
          </h2>

          <p>
            <strong>
              CUSTOMER:
            </strong>{" "}
            {request.customerName ||
              "Customer"}
          </p>

          <p>
            <strong>
              TABLE:
            </strong>{" "}
            {request.tableNumber ||
              "N/A"}
          </p>

          {isCashRequest && (
            <p>
              <strong>
                GRAND TOTAL:
              </strong>{" "}
              ₹{Number(request.grandTotal || 0).toFixed(0)}
            </p>
          )}

          {request.message && (
            <p
              style={{
                color: "#ddd",
                marginTop: 10,
              }}
            >
              <strong>
                {isCashRequest ? "REQUEST:" : "REQUEST:"}
              </strong>{" "}
              {request.message}
            </p>
          )}
        </div>

        <button
          className="way-btn"
          disabled={!hasFreeSlot}
          onClick={() =>
            acceptAssistance(
              request._id
            )
          }
          style={{
            minWidth: 200,
            opacity:
              hasFreeSlot
                ? 1
                : 0.45,
          }}
        >
          {isCashRequest ? "🤝 ACCEPT CASH" : "🤝 ACCEPT ASSISTANCE"}
        </button>
      </Card>
    );
  };

  /* =======================================================
     ACTIVE CARD
  ======================================================= */

  const renderActive = (
    task
  ) => {
    if (
      task.type ===
      "ASSISTANCE"
    ) {
      const request =
        task.request;
      const isCashRequest =
        String(request?.type || "ASSISTANCE").toUpperCase() === "CASH_PAYMENT" ||
        String(request?.paymentType || "").toUpperCase() === "CASH";

      return (
        <Card
          key={request._id}
        >
          <div>
            <div
              style={{
                color: isCashRequest ? "#f4c45f" : "#d89a2b",
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              {isCashRequest ? "💵 CASH REQUEST" : "🔔 ASSISTANCE"}
            </div>

            <h2>
              {isCashRequest ? "HARD CASH PAYMENT" : "CUSTOMER ASSISTANCE"}
            </h2>

            <p>
              CUSTOMER:{" "}
              {request.customerName ||
                "Customer"}
            </p>

            <p>
              TABLE:{" "}
              {request.tableNumber ||
                "N/A"}
            </p>

            {isCashRequest && (
              <p>
                GRAND TOTAL: ₹{Number(request.grandTotal || 0).toFixed(0)}
              </p>
            )}
          </div>

          <Timer
            startedAt={
              request.acceptedAt
            }
            targetMinutes={
              isCashRequest ? 10 : ASSISTANCE_TARGET_MINUTES
            }
            label={isCashRequest ? "CASH" : "ASSISTANCE"}
          />

          <button
            className="problem-btn"
            onClick={() =>
              completeAssistance(
                request._id
              )
            }
            style={{
              minWidth: 200,
              padding:
                "14px 20px",
            }}
          >
            {isCashRequest ? "✓ CASH RECEIVED" : "✓ PROBLEM SORTED"}
          </button>
        </Card>
      );
    }

    const {
      order,
      groupId,
      items,
    } = task;

    const service =
      task.type ===
      "SERVICE";

    return (
      <Card
        key={`${getOrderId(order)}-${groupId}`}
      >
        <div>
          <div
            style={{
              color:
                service
                  ? "#60a5fa"
                  : "#d89a2b",
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            {service
              ? "💧 SERVICE ITEM"
              : "🍽️ FOOD SERVICE"}
          </div>

          <h2>
            {items.map((item, index) => (
              <span key={getItemId(item)}>
                {index > 0 && " + "}
                {isServiceItem(item) ? "🥤" : "🍽️"} {getItemName(item)} × {getItemQuantity(item)}
              </span>
            ))}
          </h2>

          <p>
            ORDER: #
            {String(
              getOrderId(order)
            ).slice(-6)}
          </p>

          <p>
            CUSTOMER:{" "}
            {order.customerName ||
              "Customer"}
          </p>

          <p>
            TABLE:{" "}
            {order.tableNumber ||
              "N/A"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <Timer
            startedAt={items[0].waiterAssignedAt}
            targetMinutes={
              service
                ? SERVICE_TARGET_MINUTES
                : FOOD_TARGET_MINUTES
            }
            label={service ? "SERVICE" : "SERVING"}
          />

          <button
            className="served-btn"
            onClick={() =>
              serveTaskGroup(
                getOrderId(order),
                groupId
              )
            }
            style={{
              minWidth: 180,
              padding: "14px 20px",
            }}
          >
            ✅ SERVED
          </button>
        </div>
      </Card>
    );
  };

  /* =======================================================
     MAIN CONTENT
  ======================================================= */

  const renderContent =
    () => {
      if (
        tab === "READY"
      ) {
        return (
          <>
            {readyTaskGroups.length > 0 && (
              <>
                <h2
                  className="waiter-section-title"
                >
                  🍽️ READY WAITER TASKS
                </h2>

                {readyTaskGroups.map(renderReadyTask)}
              </>
            )}

            {pendingAssistance.length >
              0 && (
              <>
                <h2
                  className="waiter-section-title"
                  style={{
                    marginTop: 25,
                  }}
                >
                  🔔 ASSISTANCE REQUESTS
                </h2>

                {pendingAssistance.map(
                  renderAssistance
                )}
              </>
            )}

            {readyCount ===
              0 && (
              <div className="waiter-empty">
                <h1>
                  NO READY TASKS
                </h1>

                <p>
                  Waiting for food,
                  Water/Coke or
                  assistance.
                </p>
              </div>
            )}
          </>
        );
      }

      if (
        tab === "ACTIVE"
      ) {
        if (
          activeTasks.length ===
          0
        ) {
          return (
            <div className="waiter-empty">
              <h1>
                NO ACTIVE TASKS
              </h1>

              <p>
                Both waiter task
                slots are available.
              </p>
            </div>
          );
        }

        return activeTasks.map(
          renderActive
        );
      }

      if (
        tab === "SERVED"
      ) {
        if (
          servedItems.length ===
            0 &&
          completedAssistance.length ===
            0
        ) {
          return (
            <div className="waiter-empty">
              <h1>
                NO SERVED TASKS
              </h1>
            </div>
          );
        }

        return (
          <>
            {servedItems.map(({ order, groupId, items, type }) => (
                <Card
                  key={`${getOrderId(order)}-${groupId}`}
                >
                  <div>
                    <h3>
                      {items.map((item, index) => (
                        <span key={getItemId(item)}>
                          {index > 0 && " + "}
                          {type === "SERVICE" ? "💧" : "🍽️"} {getItemName(item)} × {getItemQuantity(item)}
                        </span>
                      ))}
                    </h3>

                    <p>
                      ORDER: #
                      {String(
                        getOrderId(
                          order
                        )
                      ).slice(-6)}
                    </p>

                    <p>
                      TABLE:{" "}
                      {order.tableNumber ||
                        "N/A"}
                    </p>
                  </div>

                  <strong
                    style={{
                      color:
                        "#22c55e",
                    }}
                  >
                    SERVED
                  </strong>
                </Card>
              )
            )}

            {completedAssistance.map(
              (request) => (
                <Card
                  key={request._id}
                >
                  <div>
                    <h3>
                      🔔 ASSISTANCE
                    </h3>

                    <p>
                      TABLE:{" "}
                      {request.tableNumber ||
                        "N/A"}
                    </p>
                  </div>

                  <strong
                    style={{
                      color:
                        "#22c55e",
                    }}
                  >
                    PROBLEM SORTED
                  </strong>
                </Card>
              )
            )}
          </>
        );
      }

      return null;
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="waiter-page">
      <aside className="waiter-sidebar">
        <div>
          <div className="waiter-logo-box">
            <img
              src={logo}
              alt="Order Now"
              className="waiter-logo"
            />
          </div>

          <div className="waiter-menu">
            <div
              className={
                tab === "READY"
                  ? "waiter-menu-active"
                  : "waiter-menu-item"
              }
              onClick={() =>
                setTab("READY")
              }
            >
              <FaClipboardList />

              <span>
                Ready Items
              </span>

              <div className="waiter-badge">
                {readyCount}
              </div>
            </div>

            <div
              className={
                tab === "ACTIVE"
                  ? "waiter-menu-active"
                  : "waiter-menu-item"
              }
              onClick={() =>
                setTab("ACTIVE")
              }
            >
              <FaMotorcycle />

              <span>
                Active Tasks
              </span>

              <div className="waiter-badge">
                {activeCount}
              </div>
            </div>

            <div
              className={
                tab === "SERVED"
                  ? "waiter-menu-active"
                  : "waiter-menu-item"
              }
              onClick={() =>
                setTab("SERVED")
              }
            >
              <FaCheckCircle />

              <span>
                Served
              </span>

              <div className="waiter-badge">
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
                {staffName}
              </h3>

              <p>
                Floor Service
              </p>
            </div>
          </div>

          <div
            className="waiter-logout"
            onClick={logout}
          >
            <FaSignOutAlt />
            Logout
          </div>
        </div>
      </aside>

      <main className="waiter-main">
        <div className="waiter-header">
          <div>
            <h3 className="waiter-welcome">
              Welcome{" "}
              {staffName} 🧑‍💼
            </h3>

            <h1 className="waiter-title">
              WAITER DASHBOARD
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className={`waiter-time credit-points-box ${creditChange !== null ? "credit-points-pulse" : ""}`} style={{ margin: 0 }}>
              <span style={{ color: "#ffcc4d", fontWeight: 800 }}>★ {creditPoints}</span>
              {creditChange !== null && (
                <span className={creditChange > 0 ? "credit-change credit-change-positive" : "credit-change credit-change-negative"}>
                  {creditChange > 0 ? `+${creditChange}` : creditChange}
                </span>
              )}
              <div><p>Credit Points</p></div>
            </div>
            <div className="waiter-time">
              <FaClock />
              <div>
                <h3>{clock.toLocaleTimeString()}</h3>
                <p>Table Service</p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginBottom: 20,
            padding: 18,
            borderRadius: 15,
            border:
              "1px solid rgba(34,197,94,.35)",
            background:
              "linear-gradient(135deg,#081c12,#11180a)",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
          }}
        >
          <div>
            <div
              style={{
                color: "#8fae9b",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              WAITER WORKLOAD
            </div>

            <div
              style={{
                color: "#fff",
                fontSize: 25,
                fontWeight: 800,
              }}
            >
              ACTIVE:{" "}
              {activeCount} /{" "}
              {MAX_ACTIVE_TASKS}
            </div>
          </div>

          <strong
            style={{
              color:
                hasFreeSlot
                  ? "#4ade80"
                  : "#ef4444",
            }}
          >
            {hasFreeSlot
              ? "TASK SLOT AVAILABLE"
              : "ALL TASK SLOTS FULL"}
          </strong>
        </div>

        <div className="waiter-stats">
          <div className="waiter-stat-card">
            <FaConciergeBell />

            <div>
              <h2>
                {readyCount}
              </h2>

              <p>
                Ready Tasks
              </p>
            </div>
          </div>

          <div className="waiter-stat-card">
            <FaMotorcycle />

            <div>
              <h2>
                {activeCount}
              </h2>

              <p>
                Active Tasks
              </p>
            </div>
          </div>

          <div className="waiter-stat-card">
            <FaClock />

            <div>
              <h2>
                {readyTaskGroups.filter((task) => task.type === "SERVICE").length}
              </h2>

              <p>
                Water / Coke
              </p>
            </div>
          </div>

          <div className="waiter-stat-card">
            <FaCheckCircle />

            <div>
              <h2>
                {servedCount}
              </h2>

              <p>
                Tasks Completed
              </p>
            </div>
          </div>
        </div>

        <div className="waiter-section-title">
          {tab === "READY" &&
            "READY ITEMS"}

          {tab === "ACTIVE" &&
            "MY ACTIVE TASKS"}

          {tab === "SERVED" &&
            "SERVED TASKS"}
        </div>

        {loading ? (
          <div className="waiter-empty">
            <h1>
              LOADING...
            </h1>
          </div>
        ) : (
          renderContent()
        )}

        <div className="waiter-footer">
          <span>
            Restaurant Service System
          </span>

          <span>
            Maximum 2 Active Tasks
          </span>
        </div>
      </main>
    </div>
  );
}
