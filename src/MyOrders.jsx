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
  FaShoppingBag,
} from "react-icons/fa";

import "./MyOrders.css";


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
          localStorage.getItem("orders")
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


      // ==========================================
      // SORT ORDERS
      // OLDEST → NEWEST
      // NEWEST ORDER AT BOTTOM
      // ==========================================

      const sortedOrders =
        [...updatedOrders].sort(
          (a, b) => {

            const idA =
              String(
                a?._id || ""
              );

            const idB =
              String(
                b?._id || ""
              );

            return idB.localeCompare(
              idA
            );
          }
        );


      setOrders(
        sortedOrders
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

  const getStatusClass = (
    status
  ) => {

    switch (status) {

      case "NEW":
        return "status-new";

      case "PREPARING":
        return "status-preparing";

      case "READY":
        return "status-ready";

      case "ON_THE_WAY":
        return "status-way";

      case "SERVED":
        return "status-served";

      default:
        return "status-new";

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
  // ITEM COUNT
  // ==========================================

  const getItemCount = (
    order
  ) => {

    return (
      order.items || []
    ).reduce(
      (
        total,
        item
      ) =>

        total +
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

      <div className="my-orders-page">

        <div className="orders-background-glow glow-one" />
        <div className="orders-background-glow glow-two" />


        {/* HOME BUTTON */}

        <button
          className="orders-home-button"
          onClick={() =>
            navigate("/home")
          }
        >

          <FaHome />

          <span>
            HOME
          </span>

        </button>


        {/* EMPTY CARD */}

        <div className="empty-orders-wrapper">

          <div className="empty-orders-card">

            <div className="empty-icon">

              <FaReceipt />

            </div>


            <div className="empty-label">

              ORDER HISTORY

            </div>


            <h1>
              No Orders Yet
            </h1>


            <p>
              Your placed orders will
              appear here automatically.
            </p>


            <button
              className="start-order-button"
              onClick={() =>
                navigate("/home")
              }
            >

              <FaUtensils />

              START ORDERING

              <FaArrowRight />

            </button>

          </div>

        </div>

      </div>

    );

  }


  // ==========================================
  // MAIN UI
  // ==========================================

  return (

    <div className="my-orders-page">

      <div className="orders-background-glow glow-one" />
      <div className="orders-background-glow glow-two" />


      {/* ======================================
          HEADER
      ====================================== */}

      <header className="orders-header">

        <div className="orders-title-section">

          <div className="orders-title-icon">

            <FaReceipt />

          </div>


          <div>

            <div className="orders-eyebrow">

              CUSTOMER PORTAL

            </div>


            <h1>
              MY ORDERS
            </h1>


            <p>
              View your orders and track
              them in real time
            </p>

          </div>

        </div>


        <div className="orders-header-actions">

          <button
            className="refresh-button"
            onClick={loadOrders}
          >

            <FaSyncAlt />

            <span>
              REFRESH
            </span>

          </button>


          <button
            className="home-button"
            onClick={() =>
              navigate("/home")
            }
          >

            <FaHome />

            <span>
              HOME
            </span>

          </button>

        </div>

      </header>


      {/* ======================================
          SUMMARY BAR
      ====================================== */}

      <div className="orders-summary-bar">

        <div className="summary-left">

          <div className="summary-icon">

            <FaShoppingBag />

          </div>


          <div>

            <span className="summary-number">

              {orders.length}

            </span>


            <span className="summary-text">

              {orders.length === 1
                ? " Order"
                : " Orders"}

            </span>

          </div>

        </div>


        <div className="summary-divider" />


        <div className="summary-message">

          <FaClock />

          <span>
            Your latest order is shown below
          </span>

        </div>

      </div>


      {/* ======================================
          LOADING
      ====================================== */}

      {loading && (

        <div className="orders-loading">

          <div className="loading-spinner">

            <FaSyncAlt />

          </div>


          <h3>
            Loading your orders
          </h3>


          <p>
            Fetching the latest order status...
          </p>

        </div>

      )}


      {/* ======================================
          ORDERS
      ====================================== */}

      {!loading && (

        <div className="orders-list">

          {orders.map(
            (
              order,
              index
            ) => {

              const itemCount =
                getItemCount(order);


              return (

                <article
                  key={
                    order._id ||
                    order.id ||
                    index
                  }
                  className="order-card"
                >

                  {/* TOP GOLD LINE */}

                  <div className="order-card-line" />


                  {/* ==================================
                      ORDER HEADER
                  ================================== */}

                  <div className="order-card-header">

                    <div className="order-info">

                      <div className="order-number-label">

                        ORDER

                      </div>


                      <h2>

                        #

                        {String(
                          order._id ||
                          order.id ||
                          ""
                        ).slice(-8)}

                      </h2>


                      <div className="order-date">

                        <FaClock />

                        {formatDate(
                          order.createdAt ||
                          order.time
                        )}

                      </div>

                    </div>


                    {/* STATUS */}

                    <div
                      className={`order-status ${getStatusClass(
                        order.status
                      )}`}
                    >

                      {order.status ===
                      "SERVED" ? (
                        <FaCheckCircle />
                      ) : (
                        <FaUtensils />
                      )}


                      <span>
                        {getStatusText(
                          order.status
                        )}
                      </span>

                    </div>

                  </div>


                  {/* ==================================
                      ORDER BODY
                  ================================== */}

                  <div className="order-card-body">


                    {/* ITEMS */}

                    <div className="order-items-section">

                      <div className="section-heading">

                        <FaUtensils />

                        <span>
                          ORDER ITEMS
                        </span>

                        <div className="heading-line" />

                      </div>


                      <div className="items-container">

                        {(order.items || []).map(
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
                                className="order-item"
                              >

                                <div className="item-left">

                                  <div className="item-number">

                                    {String(
                                      itemIndex + 1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}

                                  </div>


                                  <div className="item-details">

                                    <strong>
                                      {item.name}
                                    </strong>


                                    <span>
                                      Quantity × {quantity}
                                    </span>

                                  </div>

                                </div>


                                <div className="item-price">

                                  ₹

                                  {(
                                    price *
                                    quantity
                                  ).toLocaleString(
                                    "en-IN"
                                  )}

                                </div>

                              </div>

                            );

                          }
                        )}

                      </div>


                      {/* ITEM COUNT */}

                      <div className="items-count">

                        <FaShoppingBag />

                        {itemCount}

                        {itemCount === 1
                          ? " item"
                          : " items"}

                      </div>

                    </div>


                    {/* ==================================
                        SUMMARY
                    ================================== */}

                    <div className="order-summary">

                      <div className="summary-label">

                        ORDER TOTAL

                      </div>


                      <div className="total-amount">

                        <span>
                          ₹
                        </span>

                        {Number(
                          getTotal(order)
                        ).toLocaleString(
                          "en-IN"
                        )}

                      </div>


                      <div className="total-divider" />


                      <div className="tracking-label">

                        <FaClock />

                        LIVE ORDER TRACKING

                      </div>


                      <button
                        className="track-order-button"
                        onClick={() =>
                          trackOrder(order)
                        }
                      >

                        <span>
                          TRACK MY ORDER
                        </span>

                        <FaArrowRight />

                      </button>

                    </div>

                  </div>

                </article>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}