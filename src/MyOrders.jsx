import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FaHome,
  FaReceipt,
  FaClock,
  FaCheckCircle,
  FaUtensils,
  FaArrowRight,
  FaSyncAlt,
} from "react-icons/fa";

export default function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  // ==========================================
  // LOAD CUSTOMER ORDERS
  // ==========================================

  const loadOrders = async () => {
    try {
      setLoading(true);

      const storedOrders =
        JSON.parse(
          localStorage.getItem(
            "orders"
          )
        ) || [];

      if (
        storedOrders.length === 0
      ) {
        setOrders([]);
        return;
      }

      /*
        Refresh every locally stored
        order from MongoDB so the
        status is always current.
      */

      const updatedOrders =
        await Promise.all(
          storedOrders.map(
            async (localOrder) => {
              try {
                if (
                  !localOrder._id
                ) {
                  return localOrder;
                }

                const response =
                  await fetch(
                    `/api/orders/${localOrder._id}`
                  );

                if (!response.ok) {
                  return localOrder;
                }

                const data =
                  await response.json();

                return (
                  data.order ||
                  localOrder
                );
              } catch {
                return localOrder;
              }
            }
          )
        );

      setOrders(
        updatedOrders
      );

      /*
        Keep the refreshed
        versions locally.
      */

      localStorage.setItem(
        "orders",
        JSON.stringify(
          updatedOrders
        )
      );
    } catch (error) {
      console.error(
        "Failed to load orders:",
        error
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadOrders();
  }, []);

  // ==========================================
  // TRACK ORDER
  // ==========================================

  const trackOrder = (
    order
  ) => {
    if (!order?._id) {
      alert(
        "Order tracking information is unavailable."
      );

      return;
    }

    /*
      Tell Status.jsx which
      order should be displayed.
    */

    localStorage.setItem(
      "activeOrderId",
      order._id
    );

    navigate("/status");
  };

  // ==========================================
  // STATUS TEXT
  // ==========================================

  const getStatusText = (
    status
  ) => {
    switch (status) {
      case "NEW":
        return "Order Placed";

      case "PREPARING":
        return "Preparing";

      case "READY":
        return "Ready";

      case "ON_THE_WAY":
        return "On The Way";

      case "SERVED":
        return "Served";

      default:
        return "Order Placed";
    }
  };

  // ==========================================
  // STATUS COLOR
  // ==========================================

  const getStatusColor = (
    status
  ) => {
    switch (status) {
      case "NEW":
        return "#d89a2b";

      case "PREPARING":
        return "#ff9f43";

      case "READY":
        return "#2ecc71";

      case "ON_THE_WAY":
        return "#3498db";

      case "SERVED":
        return "#27ae60";

      default:
        return "#d89a2b";
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "Recently";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Recently";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // TOTAL
  // ==========================================

  const getTotal = (
    order
  ) => {
    if (
      order.totalAmount !==
      undefined
    ) {
      return order.totalAmount;
    }

    return (
      order.items || []
    ).reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity ??
          item.qty ??
          1
        ),
      0
    );
  };

  // ==========================================
  // EMPTY STATE
  // ==========================================

  if (
    !loading &&
    orders.length === 0
  ) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "linear-gradient(180deg,#050505,#111)",
          color: "white",
          padding:
            "30px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "50px",
          }}
        >
          <h1
            style={{
              color:
                "#d89a2b",
              fontSize:
                "40px",
              margin: 0,
            }}
          >
            MY ORDERS
          </h1>

          <button
            onClick={() =>
              navigate(
                "/home"
              )
            }
            style={{
              padding:
                "13px 22px",
              background:
                "#d89a2b",
              color:
                "#111",
              border:
                "none",
              borderRadius:
                "12px",
              cursor:
                "pointer",
              fontWeight:
                "bold",
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "8px",
            }}
          >
            <FaHome />
            HOME
          </button>
        </div>

        {/* EMPTY */}

        <div
          style={{
            maxWidth:
              "650px",
            margin:
              "100px auto",
            textAlign:
              "center",
            background:
              "#151515",
            border:
              "1px solid rgba(216,154,43,.25)",
            borderRadius:
              "25px",
            padding:
              "60px 30px",
            boxShadow:
              "0 20px 60px rgba(0,0,0,.35)",
          }}
        >
          <FaReceipt
            style={{
              fontSize:
                "60px",
              color:
                "#d89a2b",
              marginBottom:
                "20px",
            }}
          />

          <h2
            style={{
              fontSize:
                "30px",
              margin:
                "10px 0",
            }}
          >
            No Orders Yet
          </h2>

          <p
            style={{
              color:
                "#999",
              fontSize:
                "17px",
              lineHeight:
                "1.6",
            }}
          >
            Your placed orders
            will appear here.
          </p>

          <button
            onClick={() =>
              navigate(
                "/home"
              )
            }
            style={{
              marginTop:
                "20px",
              padding:
                "14px 28px",
              background:
                "linear-gradient(135deg,#b87918,#d89a2b,#f4c45f)",
              color:
                "#111",
              border:
                "none",
              borderRadius:
                "12px",
              fontWeight:
                "bold",
              cursor:
                "pointer",
            }}
          >
            START ORDERING
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "linear-gradient(180deg,#050505,#111)",
        color: "white",
        padding:
          "30px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >

      {/* ======================================
          HEADER
      ====================================== */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom:
            "35px",
          gap:
            "20px",
          flexWrap:
            "wrap",
        }}
      >
        <div>
          <h1
            style={{
              color:
                "#d89a2b",
              fontSize:
                "42px",
              margin:
                "0 0 8px",
              letterSpacing:
                "2px",
            }}
          >
            MY ORDERS
          </h1>

          <p
            style={{
              margin: 0,
              color:
                "#888",
              fontSize:
                "16px",
            }}
          >
            View your orders
            and track them
            in real time
          </p>
        </div>

        <div
          style={{
            display:
              "flex",
            gap:
              "12px",
          }}
        >

          {/* REFRESH */}

          <button
            onClick={
              loadOrders
            }
            style={{
              padding:
                "13px 20px",
              background:
                "#222",
              color:
                "#d89a2b",
              border:
                "1px solid #d89a2b",
              borderRadius:
                "12px",
              cursor:
                "pointer",
              fontWeight:
                "bold",
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "8px",
            }}
          >
            <FaSyncAlt />
            Refresh
          </button>

          {/* HOME */}

          <button
            onClick={() =>
              navigate(
                "/home"
              )
            }
            style={{
              padding:
                "13px 22px",
              background:
                "#d89a2b",
              color:
                "#111",
              border:
                "none",
              borderRadius:
                "12px",
              cursor:
                "pointer",
              fontWeight:
                "bold",
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "8px",
            }}
          >
            <FaHome />
            Home
          </button>

        </div>
      </div>

      {/* ======================================
          ORDER COUNT
      ====================================== */}

      <div
        style={{
          marginBottom:
            "25px",
          color:
            "#aaa",
        }}
      >
        <FaReceipt
          style={{
            color:
              "#d89a2b",
            marginRight:
              "8px",
          }}
        />

        {orders.length} order
        {orders.length !== 1
          ? "s"
          : ""}
      </div>

      {/* ======================================
          LOADING
      ====================================== */}

      {loading && (
        <div
          style={{
            textAlign:
              "center",
            padding:
              "80px",
            color:
              "#aaa",
          }}
        >
          <FaSyncAlt
            style={{
              fontSize:
                "35px",
              color:
                "#d89a2b",
              marginBottom:
                "15px",
            }}
          />

          <p>
            Loading your
            orders...
          </p>
        </div>
      )}

      {/* ======================================
          ORDERS
      ====================================== */}

      {!loading &&
        orders.map(
          (
            order,
            index
          ) => (
            <div
              key={
                order._id ||
                order.id ||
                index
              }
              style={{
                maxWidth:
                  "1100px",
                margin:
                  "0 auto 25px",
                background:
                  "linear-gradient(145deg,#171717,#101010)",
                border:
                  "1px solid rgba(216,154,43,.22)",
                borderRadius:
                  "22px",
                padding:
                  "28px",
                boxShadow:
                  "0 15px 45px rgba(0,0,0,.3)",
              }}
            >

              {/* ORDER HEADER */}

              <div
                style={{
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
                  borderBottom:
                    "1px solid #292929",
                  paddingBottom:
                    "20px",
                  marginBottom:
                    "20px",
                }}
              >

                <div>
                  <h2
                    style={{
                      margin:
                        "0 0 8px",
                      color:
                        "#fff",
                    }}
                  >
                    Order #
                    {String(
                      order._id ||
                      order.id ||
                      ""
                    ).slice(
                      -8
                    )}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color:
                        "#777",
                    }}
                  >
                    <FaClock
                      style={{
                        marginRight:
                          "7px",
                      }}
                    />

                    {formatDate(
                      order.createdAt ||
                      order.time
                    )}
                  </p>
                </div>

                {/* STATUS */}

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "8px",
                    padding:
                      "10px 16px",
                    borderRadius:
                      "25px",
                    background:
                      `${getStatusColor(
                        order.status
                      )}20`,
                    color:
                      getStatusColor(
                        order.status
                      ),
                    fontWeight:
                      "bold",
                  }}
                >
                  {order.status ===
                    "SERVED" ? (
                    <FaCheckCircle />
                  ) : (
                    <FaUtensils />
                  )}

                  {getStatusText(
                    order.status
                  )}
                </div>

              </div>

              {/* ORDER CONTENT */}

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 220px",
                  gap:
                    "25px",
                }}
              >

                {/* ITEMS */}

                <div>
                  <h3
                    style={{
                      color:
                        "#d89a2b",
                      marginTop: 0,
                    }}
                  >
                    ORDER ITEMS
                  </h3>

                  {(order.items ||
                    []).map(
                      (
                        item,
                        itemIndex
                      ) => {
                        const quantity =
                          Number(
                            item.quantity ??
                            item.qty ??
                            1
                          );

                        const price =
                          Number(
                            item.price ||
                            0
                          );

                        return (
                          <div
                            key={
                              item._id ||
                              item.id ||
                              itemIndex
                            }
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              padding:
                                "12px 0",
                              borderBottom:
                                "1px solid #242424",
                            }}
                          >

                            <div>
                              <strong>
                                {
                                  item.name
                                }
                              </strong>

                              <span
                                style={{
                                  color:
                                    "#777",
                                  marginLeft:
                                    "10px",
                                }}
                              >
                                ×{" "}
                                {
                                  quantity
                                }
                              </span>
                            </div>

                            <strong
                              style={{
                                color:
                                  "#ddd",
                              }}
                            >
                              ₹
                              {price *
                                quantity}
                            </strong>

                          </div>
                        );
                      }
                    )}
                </div>

                {/* SUMMARY */}

                <div
                  style={{
                    background:
                      "#0d0d0d",
                    borderRadius:
                      "16px",
                    padding:
                      "20px",
                    border:
                      "1px solid #292929",
                    height:
                      "fit-content",
                  }}
                >

                  <p
                    style={{
                      color:
                        "#888",
                      marginTop:
                        0,
                    }}
                  >
                    TOTAL
                  </p>

                  <h2
                    style={{
                      color:
                        "#d89a2b",
                      fontSize:
                        "30px",
                      margin:
                        "5px 0 20px",
                    }}
                  >
                    ₹
                    {getTotal(
                      order
                    )}
                  </h2>

                  <button
                    onClick={() =>
                      trackOrder(
                        order
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "14px",
                      background:
                        "linear-gradient(135deg,#b87918,#d89a2b,#f4c45f)",
                      color:
                        "#111",
                      border:
                        "none",
                      borderRadius:
                        "11px",
                      cursor:
                        "pointer",
                      fontWeight:
                        "bold",
                      display:
                        "flex",
                      justifyContent:
                        "center",
                      alignItems:
                        "center",
                      gap:
                        "8px",
                    }}
                  >
                    TRACK MY ORDER
                    <FaArrowRight />
                  </button>

                </div>

              </div>

            </div>
          )
        )}

    </div>
  );
}