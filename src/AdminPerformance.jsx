import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import * as XLSX from "xlsx";

import {
  FaArrowLeft,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaRupeeSign,
  FaUsers,
  FaStar,
  FaSyncAlt,
  FaFileExcel,
  FaChartLine,
  FaUtensils,
  FaMotorcycle,
} from "react-icons/fa";

export default function AdminPerformance() {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [staff, setStaff] =
    useState([]);

  const [feedbacks, setFeedbacks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [orderFilter, setOrderFilter] =
    useState("ALL");
  const [showCashCoupon, setShowCashCoupon] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [cashCustomer, setCashCustomer] = useState("");
  const [cashPhone, setCashPhone] = useState("");
  const [generatedCoupon, setGeneratedCoupon] = useState(null);

  // ==========================================
  // ADMIN PROTECTION
  // ==========================================

  useEffect(() => {
    const role =
      localStorage.getItem(
        "userRole"
      );

    if (role !== "admin") {
      navigate("/staff-login");
    }
  }, [navigate]);

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      // ----------------------------------------
      // ORDERS FROM MONGODB
      // ----------------------------------------

      const ordersResponse =
        await fetch(
          "/api/orders"
        );

      const ordersData =
        await ordersResponse.json();

      if (!ordersResponse.ok) {
        throw new Error(
          ordersData.message ||
          "Failed to load orders"
        );
      }

      setOrders(
        ordersData.orders || []
      );

      // ----------------------------------------
      // STAFF FROM MONGODB
      // ----------------------------------------

      try {
        const staffResponse =
          await fetch(
            "/api/staff"
          );

        const staffData =
          await staffResponse.json();

        if (staffResponse.ok) {
          setStaff(
            staffData.staff || []
          );
        }
      } catch (staffError) {
        console.error(
          "Staff loading error:",
          staffError
        );
      }

      // ----------------------------------------
      // FEEDBACK
      // ----------------------------------------
      // ----------------------------------------
      // FEEDBACK FROM MONGODB
      // ----------------------------------------

      try {

        const feedbackResponse =
          await fetch(
            "/api/feedback"
          );

        const feedbackData =
          await feedbackResponse.json();

        if (feedbackResponse.ok) {

          setFeedbacks(
            feedbackData.feedbacks || []
          );

        }

      } catch (feedbackError) {

        console.error(
          "Feedback loading error:",
          feedbackError
        );

      }
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      alert(
        error.message ||
        "Failed to load dashboard data"
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Show loading animation ONLY
    // when the page initially opens.
    loadData(true);

    // Silent background refresh.
    // Existing orders stay visible.
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // ORDER STATISTICS
  // ==========================================

  const activeOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status !==
            "SERVED"
        ),
      [orders]
    );

  const completedOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
            "SERVED"
        ),
      [orders]
    );

  const newOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
            "NEW"
        ),
      [orders]
    );

  const preparingOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
            "PREPARING"
        ),
      [orders]
    );

  const readyOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
            "READY"
        ),
      [orders]
    );

  const onTheWayOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
            "ON_THE_WAY"
        ),
      [orders]
    );

  // ==========================================
  // REVENUE
  // ==========================================

  const totalRevenue =
    useMemo(
      () =>
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            Number(
              order.totalAmount ||
              0
            ),
          0
        ),
      [orders]
    );

  const completedRevenue =
    useMemo(
      () =>
        completedOrders.reduce(
          (
            total,
            order
          ) =>
            total +
            Number(
              order.totalAmount ||
              0
            ),
          0
        ),
      [completedOrders]
    );

  const averageOrderValue =
    orders.length > 0
      ? totalRevenue /
      orders.length
      : 0;

  // ==========================================
  // FEEDBACK STATISTICS
  // ==========================================

  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce(
        (
          total,
          feedback
        ) =>
          total +
          Number(
            feedback.overallRating ||
            0
          ),
        0
      ) /
      feedbacks.length
      : 0;

  const averageFoodRating =
    feedbacks.length > 0
      ? feedbacks.reduce(
        (
          total,
          feedback
        ) =>
          total +
          Number(
            feedback.foodRating ||
            0
          ),
        0
      ) /
      feedbacks.length
      : 0;

  const averageServiceRating =
    feedbacks.length > 0
      ? feedbacks.reduce(
        (
          total,
          feedback
        ) =>
          total +
          Number(
            feedback.serviceRating ||
            0
          ),
        0
      ) /
      feedbacks.length
      : 0;

  // ==========================================
  // STAFF
  // ==========================================

  const chefs =
    staff.filter(
      (member) =>
        member.role ===
        "CHEF"
    );

  const waiters =
    staff.filter(
      (member) =>
        member.role ===
        "WAITER"
    );

  const activeStaff =
    staff.filter(
      (member) =>
        member.active
    );

  const disabledStaff =
    staff.filter(
      (member) =>
        !member.active
    );

  // ==========================================
  // FILTERED ORDERS
  // ==========================================

  const filteredOrders =
    useMemo(() => {
      if (
        orderFilter ===
        "ACTIVE"
      ) {
        return activeOrders;
      }

      if (
        orderFilter ===
        "COMPLETED"
      ) {
        return completedOrders;
      }

      return orders;
    }, [
      orderFilter,
      orders,
      activeOrders,
      completedOrders,
    ]);

  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const currency = (
    value
  ) =>
    `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN"
    )}`;

  const generateCashCoupon = async (event) => {
    event.preventDefault();
    const response = await fetch("/api/coupons/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(cashAmount), customerName: cashCustomer,
        customerPhone: cashPhone, adminId: localStorage.getItem("staffId"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.message || "Unable to generate coupon");
      return;
    }
    setGeneratedCoupon(data.coupon);
  };

  // ==========================================
  // INDIVIDUAL STAFF PERFORMANCE
  // ==========================================

  const chefPerformance = useMemo(() => {
    return chefs.map((chef) => {
      const chefOrders = orders.filter(
        (order) =>
          order.chef?.staffId === chef._id ||
          order.chef?.name === chef.name
      );

      const completed = chefOrders.filter(
        (order) =>
          order.status === "SERVED"
      );

      const preparationTimes =
        chefOrders
          .filter(
            (order) =>
              order.chef?.acceptedAt &&
              order.chef?.readyAt
          )
          .map(
            (order) =>
              (
                new Date(
                  order.chef.readyAt
                ).getTime() -
                new Date(
                  order.chef.acceptedAt
                ).getTime()
              ) /
              60000
          );

      const averagePreparation =
        preparationTimes.length
          ? Math.round(
            preparationTimes.reduce(
              (a, b) => a + b,
              0
            ) /
            preparationTimes.length
          )
          : 0;

      return {
        ...chef,
        orders: chefOrders.length,
        completed: completed.length,
        averagePreparation,
      };
    });
  }, [chefs, orders]);


  const waiterPerformance = useMemo(() => {
    return waiters.map((waiter) => {
      const waiterOrders = orders.filter(
        (order) =>
          order.waiter?.staffId === waiter._id ||
          order.waiter?.name === waiter.name
      );

      const served = waiterOrders.filter(
        (order) =>
          order.status === "SERVED"
      );

      const servingTimes =
        waiterOrders
          .filter(
            (order) =>
              order.waiter?.assignedAt &&
              order.waiter?.servedAt
          )
          .map(
            (order) =>
              (
                new Date(
                  order.waiter.servedAt
                ).getTime() -
                new Date(
                  order.waiter.assignedAt
                ).getTime()
              ) /
              60000
          );

      const averageServing =
        servingTimes.length
          ? Math.round(
            servingTimes.reduce(
              (a, b) => a + b,
              0
            ) /
            servingTimes.length
          )
          : 0;

      return {
        ...waiter,
        orders: waiterOrders.length,
        served: served.length,
        averageServing,
      };
    });
  }, [waiters, orders]);

  // ==========================================
  // STATUS LABEL
  // ==========================================

  const statusLabel = (
    status
  ) => {
    switch (status) {
      case "NEW":
        return "NEW";

      case "PREPARING":
        return "PREPARING";

      case "READY":
        return "READY";

      case "ON_THE_WAY":
        return "ON THE WAY";

      case "SERVED":
        return "SERVED";

      default:
        return status ||
          "UNKNOWN";
    }
  };

  // ==========================================
  // STATUS COLOR
  // ==========================================

  const statusColor = (
    status
  ) => {
    switch (status) {
      case "NEW":
        return "#ffb347";

      case "PREPARING":
        return "#ff8c00";

      case "READY":
        return "#4caf50";

      case "ON_THE_WAY":
        return "#3498db";

      case "SERVED":
        return "#8bc34a";

      default:
        return "#aaa";
    }
  };

  // ==========================================
  // DATE
  // ==========================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
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
  // DOWNLOAD EXCEL REPORT
  // ==========================================

  const downloadExcelReport = () => {
    try {
      if (!orders.length) {
        alert("There are no orders to export.");
        return;
      }

      // ========================================
      // ORDERS SHEET
      // One row per item
      // ========================================

      const orderRows = [];

      orders.forEach((order) => {
        const items = order.items || [];

        if (items.length === 0) {
          orderRows.push({
            "Order ID": order._id || "",
            "Customer Name":
              order.customerName || "Customer",
            "Item Name": "",
            Quantity: "",
            Chef:
              order.chef?.name || "—",
            Waiter:
              order.waiter?.name || "—",
            Status:
              statusLabel(order.status),
            "Order Date": order.createdAt
              ? new Date(
                order.createdAt
              ).toLocaleDateString("en-IN")
              : "—",
            "Order Time": order.createdAt
              ? new Date(
                order.createdAt
              ).toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
              : "—",
            "Chef Accepted":
              formatDate(
                order.chef?.acceptedAt
              ),
            "Ready Time":
              formatDate(
                order.chef?.readyAt
              ),
            "Waiter Assigned":
              formatDate(
                order.waiter?.assignedAt
              ),
            "Served Time":
              formatDate(
                order.waiter?.servedAt
              ),
            "Total Amount":
              Number(
                order.totalAmount || 0
              ),
            "Payment Status":
              order.paymentStatus || "—",
            "Payment Method":
              order.paymentMethod || "—",
          });

          return;
        }

        items.forEach((item) => {
          orderRows.push({
            "Order ID": order._id || "",

            "Customer Name":
              order.customerName ||
              "Customer",

            "Item Name":
              item.name || "",

            Quantity:
              Number(
                item.quantity || 0
              ),

            Chef:
              order.chef?.name ||
              "—",

            Waiter:
              order.waiter?.name ||
              "—",

            Status:
              statusLabel(
                order.status
              ),

            "Order Date":
              order.createdAt
                ? new Date(
                  order.createdAt
                ).toLocaleDateString(
                  "en-IN"
                )
                : "—",

            "Order Time":
              order.createdAt
                ? new Date(
                  order.createdAt
                ).toLocaleTimeString(
                  "en-IN",
                  {
                    hour:
                      "2-digit",
                    minute:
                      "2-digit",
                  }
                )
                : "—",

            "Chef Accepted":
              formatDate(
                order.chef?.acceptedAt
              ),

            "Ready Time":
              formatDate(
                order.chef?.readyAt
              ),

            "Waiter Assigned":
              formatDate(
                order.waiter?.assignedAt
              ),

            "Served Time":
              formatDate(
                order.waiter?.servedAt
              ),

            "Total Amount":
              Number(
                order.totalAmount || 0
              ),

            "Payment Status":
              order.paymentStatus ||
              "—",

            "Payment Method":
              order.paymentMethod ||
              "—",
          });
        });
      });


      // ========================================
      // STAFF PERFORMANCE SHEET
      // ========================================

      const staffRows = [];

      chefPerformance.forEach(
        (chef) => {
          staffRows.push({
            "Staff Name":
              chef.name || "—",

            Role: "Chef",

            "Total Orders":
              chef.orders || 0,

            Completed:
              chef.completed || 0,

            "Average Preparation Time":
              chef.averagePreparation
                ? `${chef.averagePreparation} min`
                : "—",

            Status:
              chef.active
                ? "ACTIVE"
                : "DISABLED",
          });
        }
      );

      waiterPerformance.forEach(
        (waiter) => {
          staffRows.push({
            "Staff Name":
              waiter.name || "—",

            Role: "Waiter",

            "Total Orders":
              waiter.orders || 0,

            Completed:
              waiter.served || 0,

            "Average Serving Time":
              waiter.averageServing
                ? `${waiter.averageServing} min`
                : "—",

            Status:
              waiter.active
                ? "ACTIVE"
                : "DISABLED",
          });
        }
      );


      // ========================================
      // CREATE WORKBOOK
      // ========================================

      const workbook =
        XLSX.utils.book_new();


      // Orders worksheet

      const ordersSheet =
        XLSX.utils.json_to_sheet(
          orderRows
        );

      XLSX.utils.book_append_sheet(
        workbook,
        ordersSheet,
        "Orders"
      );


      // Staff worksheet

      const staffSheet =
        XLSX.utils.json_to_sheet(
          staffRows
        );

      XLSX.utils.book_append_sheet(
        workbook,
        staffSheet,
        "Staff Performance"
      );


      // ========================================
      // COLUMN WIDTHS
      // ========================================

      ordersSheet["!cols"] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 28 },
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
      ];

      staffSheet["!cols"] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
        { wch: 30 },
        { wch: 15 },
      ];


      // ========================================
      // DOWNLOAD FILE
      // ========================================

      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      const filename =
        `restaurant_report_${today}.xlsx`;

      XLSX.writeFile(
        workbook,
        filename
      );

      console.log(
        "Excel report downloaded:",
        filename
      );

    } catch (error) {
      console.error(
        "Excel export error:",
        error
      );

      alert(
        "Failed to generate Excel report."
      );
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem(
      "adminAuth"
    );

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

  // ==========================================
  // STYLES
  // ==========================================

  const page = {
    minHeight:
      "100vh",
    background:
      "linear-gradient(180deg,#050505,#111)",
    color: "white",
    padding: "30px",
    boxSizing:
      "border-box",
  };

  const goldButton = {
    padding:
      "12px 20px",
    background:
      "#ffb347",
    color: "#111",
    border: "none",
    borderRadius:
      "10px",
    cursor:
      "pointer",
    fontWeight:
      "bold",
  };

  const panel = {
    background:
      "linear-gradient(145deg,#181818,#101010)",
    border:
      "1px solid rgba(255,179,71,.18)",
    borderRadius:
      "18px",
    boxShadow:
      "0 15px 40px rgba(0,0,0,.25)",
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div style={page}>

      {showCashCoupon && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.75)", display: "grid", placeItems: "center", padding: 20 }}>
          <form onSubmit={generateCashCoupon} style={{ width: 420, maxWidth: "100%", background: "#171717", border: "1px solid #ffb347", borderRadius: 16, padding: 26 }}>
            <h2 style={{ color: "#ffb347", marginTop: 0 }}>Generate cash coupon</h2>
            <p style={{ color: "#aaa" }}>Confirm the cash received by the admin, then give this one-use code to the customer.</p>
            {generatedCoupon ? (
              <div style={{ textAlign: "center", padding: 18, background: "#0e2616", borderRadius: 10 }}>
                <div style={{ color: "#fff", fontSize: 30, fontWeight: 800, letterSpacing: 5 }}>{generatedCoupon.code}</div>
                <div style={{ color: "#7ee787", marginTop: 8 }}>Value: {currency(generatedCoupon.amount)}</div>
                <button type="button" onClick={() => setShowCashCoupon(false)} style={{ ...goldButton, marginTop: 18 }}>Done</button>
              </div>
            ) : (
              <>
                <input required type="number" min="1" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="Cash amount (₹)" style={{ width: "100%", padding: 12, marginTop: 12, borderRadius: 8 }} />
                <input value={cashCustomer} onChange={(e) => setCashCustomer(e.target.value)} placeholder="Customer name" style={{ width: "100%", padding: 12, marginTop: 10, borderRadius: 8 }} />
                <input value={cashPhone} onChange={(e) => setCashPhone(e.target.value)} placeholder="Customer phone (optional)" style={{ width: "100%", padding: 12, marginTop: 10, borderRadius: 8 }} />
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button type="submit" style={{ ...goldButton, background: "#3f8f4f", color: "#fff", flex: 1 }}>Generate</button>
                  <button type="button" onClick={() => setShowCashCoupon(false)} style={{ ...goldButton, background: "#444", color: "#fff", flex: 1 }}>Cancel</button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

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
          gap: "20px",
          marginBottom:
            "35px",
          flexWrap:
            "wrap",
        }}
      >

        <div>
          <h1
            style={{
              color:
                "#ffb347",
              fontSize:
                "42px",
              margin:
                "0 0 8px",
            }}
          >
            Performance & Orders
          </h1>

          <p
            style={{
              color:
                "#888",
              margin: 0,
              fontSize:
                "16px",
            }}
          >
            Restaurant performance,
            orders, revenue and
            customer feedback
          </p>
        </div>

        <div
          style={{
            display:
              "flex",
            gap: "10px",
            flexWrap:
              "wrap",
          }}
        >

          <button
            onClick={() =>
              navigate(
                "/admin"
              )
            }
            style={
              goldButton
            }
          >
            <FaArrowLeft />
            &nbsp; Admin Dashboard
          </button>

          <button
            onClick={() =>
              navigate(
                "/admin/staff"
              )
            }
            style={
              goldButton
            }
          >
            <FaUsers />
            &nbsp; Manage Staff
          </button>

          <button
            onClick={downloadExcelReport}
            style={{
              ...goldButton,
              background: "#4caf50",
              color: "#fff",
            }}
          >
            <FaFileExcel />
            &nbsp; Download Orders data
          </button>


          <button
            onClick={
              handleLogout
            }
            style={{
              ...goldButton,
              background:
                "#ff8c00",
            }}
          >
            Logout
          </button>

        </div>
      </div>

      {/* ======================================
          KPI CARDS
      ====================================== */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "18px",
          marginBottom:
            "30px",
        }}
      >

        {/* REVENUE */}

        <div
          style={{
            ...panel,
            padding:
              "24px",
          }}
        >
          <FaRupeeSign
            style={{
              color:
                "#ffb347",
              fontSize:
                "25px",
            }}
          />

          <p
            style={{
              color:
                "#888",
              margin:
                "12px 0 5px",
            }}
          >
            TOTAL REVENUE
          </p>

          <h2
            style={{
              color:
                "#ffb347",
              fontSize:
                "32px",
              margin:
                "0",
            }}
          >
            {currency(
              totalRevenue
            )}
          </h2>

          <small
            style={{
              color:
                "#777",
            }}
          >
            Completed:{" "}
            {currency(
              completedRevenue
            )}
          </small>
        </div>

        {/* ORDERS */}

        <div
          style={{
            ...panel,
            padding:
              "24px",
          }}
        >
          <FaClipboardList
            style={{
              color:
                "#ffb347",
              fontSize:
                "25px",
            }}
          />

          <p
            style={{
              color:
                "#888",
              margin:
                "12px 0 5px",
            }}
          >
            TOTAL ORDERS
          </p>

          <h2
            style={{
              fontSize:
                "32px",
              margin:
                "0",
            }}
          >
            {orders.length}
          </h2>

          <small
            style={{
              color:
                "#777",
            }}
          >
            All orders in MongoDB
          </small>
        </div>

        {/* ACTIVE */}

        <div
          style={{
            ...panel,
            padding:
              "24px",
          }}
        >
          <FaClock
            style={{
              color:
                "#ff8c00",
              fontSize:
                "25px",
            }}
          />

          <p
            style={{
              color:
                "#888",
              margin:
                "12px 0 5px",
            }}
          >
            ACTIVE ORDERS
          </p>

          <h2
            style={{
              color:
                "#ff8c00",
              fontSize:
                "32px",
              margin:
                "0",
            }}
          >
            {
              activeOrders.length
            }
          </h2>

          <small
            style={{
              color:
                "#777",
            }}
          >
            Currently processing
          </small>
        </div>

        {/* COMPLETED */}

        <div
          style={{
            ...panel,
            padding:
              "24px",
          }}
        >
          <FaCheckCircle
            style={{
              color:
                "#4caf50",
              fontSize:
                "25px",
            }}
          />

          <p
            style={{
              color:
                "#888",
              margin:
                "12px 0 5px",
            }}
          >
            COMPLETED
          </p>

          <h2
            style={{
              color:
                "#4caf50",
              fontSize:
                "32px",
              margin:
                "0",
            }}
          >
            {
              completedOrders.length
            }
          </h2>

          <small
            style={{
              color:
                "#777",
            }}
          >
            Served orders
          </small>
        </div>

      </div>

      {/* ======================================
          ORDER STATUS SUMMARY
      ====================================== */}

      <div
        style={{
          ...panel,
          padding:
            "25px",
          marginBottom:
            "30px",
        }}
      >

        <h2
          style={{
            color:
              "#ffb347",
            marginTop: 0,
          }}
        >
          Order Status Overview
        </h2>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(150px,1fr))",
            gap:
              "15px",
          }}
        >

          <StatusBox
            title="New"
            value={
              newOrders.length
            }
            icon="🆕"
            color="#ffb347"
          />

          <StatusBox
            title="Preparing"
            value={
              preparingOrders.length
            }
            icon="👨‍🍳"
            color="#ff8c00"
          />

          <StatusBox
            title="Ready"
            value={
              readyOrders.length
            }
            icon="🔔"
            color="#4caf50"
          />

          <StatusBox
            title="On The Way"
            value={
              onTheWayOrders.length
            }
            icon="🚶"
            color="#3498db"
          />

          <StatusBox
            title="Served"
            value={
              completedOrders.length
            }
            icon="✅"
            color="#8bc34a"
          />

        </div>
      </div>

      {/* ======================================
    ORDERS + STAFF PERFORMANCE
====================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "25px",
          marginBottom: "30px",
          alignItems: "start",
        }}
      >

        {/* ======================================
      LEFT SIDE - ORDERS
  ====================================== */}

        <div
          style={{
            ...panel,
            overflow: "hidden",
          }}
        >

          <div
            style={{
              padding: "25px",
              borderBottom:
                "1px solid #292929",
            }}
          >

            <h2
              style={{
                color: "#ffb347",
                margin: "0 0 5px",
              }}
            >
              <FaClipboardList />
              &nbsp; Orders
            </h2>

            <p
              style={{
                color: "#777",
                margin: 0,
              }}
            >
              Recent restaurant orders
            </p>

          </div>


          {/* ORDER FILTERS */}

          <div
            style={{
              padding: "15px 20px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              borderBottom:
                "1px solid #292929",
            }}
          >

            {[
              ["ALL", "All"],
              ["ACTIVE", "Active"],
              ["COMPLETED", "Completed"],
            ].map((filter) => (

              <button
                key={filter[0]}
                onClick={() =>
                  setOrderFilter(filter[0])
                }
                style={{
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  background:
                    orderFilter === filter[0]
                      ? "#ffb347"
                      : "#292929",
                  color:
                    orderFilter === filter[0]
                      ? "#111"
                      : "#aaa",
                }}
              >
                {filter[1]}
              </button>

            ))}

            <button
              onClick={loadData}
              style={{
                padding: "8px 12px",
                border:
                  "1px solid #555",
                borderRadius: "8px",
                background: "#202020",
                color: "#ffb347",
                cursor: "pointer",
              }}
            >
              <FaSyncAlt />
            </button>

          </div>


          {/* ORDERS */}

          {loading ? (

            <div
              style={{
                padding: "50px 20px",
                textAlign: "center",
                color: "#888",
              }}
            >
              <FaSyncAlt
                style={{
                  fontSize: "28px",
                  color: "#ffb347",
                }}
              />

              <p>
                Loading orders...
              </p>
            </div>

          ) : filteredOrders.length === 0 ? (

            <div
              style={{
                padding: "50px 20px",
                textAlign: "center",
                color: "#777",
              }}
            >
              No orders found.
            </div>

          ) : (

            <div
              style={{
                maxHeight: "520px",
                overflowY: "auto",
                overflowX: "auto",
              }}
            >

              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: "900px",
                }}
              >

                <thead>

                  <tr
                    style={{
                      background:
                        "#202020",
                    }}
                  >

                    <th style={tableHead}>
                      Order ID
                    </th>

                    <th style={tableHead}>
                      Customer
                    </th>

                    <th style={tableHead}>
                      Item
                    </th>

                    <th style={tableHead}>
                      Qty
                    </th>

                    <th style={tableHead}>
                      Chef
                    </th>

                    <th style={tableHead}>
                      Waiter
                    </th>

                    <th style={tableHead}>
                      Status
                    </th>

                    <th style={tableHead}>
                      Date
                    </th>

                    <th style={tableHead}>
                      Time
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredOrders.map(
                    (order) => (

                      <tr
                        key={order._id}
                        style={{
                          borderTop:
                            "1px solid #292929",
                        }}
                      >

                        {/* ORDER ID */}

                        <td style={tableCell}>
                          <strong
                            style={{
                              color:
                                "#ffb347",
                            }}
                          >
                            #
                            {String(
                              order._id
                            ).slice(-8)}
                          </strong>
                        </td>


                        {/* CUSTOMER */}

                        <td style={tableCell}>
                          {order.customerName ||
                            "Customer"}
                        </td>


                        {/* ITEM */}

                        <td style={tableCell}>

                          {(order.items || []).map(
                            (item, index) => (

                              <div
                                key={index}
                                style={{
                                  marginBottom:
                                    "4px",
                                }}
                              >
                                {item.name}
                              </div>

                            )
                          )}

                        </td>


                        {/* QUANTITY */}

                        <td style={tableCell}>

                          {(order.items || [])
                            .reduce(
                              (
                                total,
                                item
                              ) =>
                                total +
                                Number(
                                  item.quantity ||
                                  0
                                ),
                              0
                            )}

                        </td>


                        {/* CHEF */}

                        <td style={tableCell}>
                          {order.chef?.name ||
                            "—"}
                        </td>


                        {/* WAITER */}

                        <td style={tableCell}>
                          {order.waiter?.name ||
                            "—"}
                        </td>


                        {/* STATUS */}

                        <td style={tableCell}>

                          <span
                            style={{
                              color:
                                statusColor(
                                  order.status
                                ),
                              fontWeight:
                                "bold",
                              fontSize:
                                "12px",
                            }}
                          >
                            ●{" "}
                            {statusLabel(
                              order.status
                            )}
                          </span>

                        </td>


                        {/* DATE */}

                        <td
                          style={{
                            ...tableCell,
                            color: "#aaa",
                          }}
                        >
                          {order.createdAt
                            ? new Date(
                              order.createdAt
                            ).toLocaleDateString(
                              "en-IN"
                            )
                            : "—"}
                        </td>


                        {/* TIME */}

                        <td
                          style={{
                            ...tableCell,
                            color: "#aaa",
                          }}
                        >
                          {order.createdAt
                            ? new Date(
                              order.createdAt
                            ).toLocaleTimeString(
                              "en-IN",
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )
                            : "—"}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* ======================================
      RIGHT SIDE - STAFF PERFORMANCE
  ====================================== */}

        <div
          style={{
            ...panel,
            padding: "25px",
            maxHeight: "650px",
            overflowY: "auto",
          }}
        >

          <h2
            style={{
              color: "#ffb347",
              marginTop: 0,
            }}
          >
            <FaUsers />
            &nbsp; Staff Performance
          </h2>

          <p
            style={{
              color: "#777",
              marginTop: "-10px",
              marginBottom: "25px",
            }}
          >
            Individual employee performance
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 24 }}>
            {staff.filter((member) => member.role !== "ADMIN").map((member) => (
              <div key={member._id} style={{ padding: 10, borderRadius: 9, background: "#121212", border: "1px solid #292929" }}>
                <div style={{ color: "#ddd", fontSize: 13 }}>{member.name} · {member.role}</div>
                <strong style={{ color: "#ffcc4d" }}>★ {member.creditPoints || 0}</strong>
              </div>
            ))}
          </div>


          {/* ==================================
        CHEFS
    ================================== */}

          <h3
            style={{
              color: "#ffb347",
              borderBottom:
                "1px solid #292929",
              paddingBottom: "10px",
            }}
          >
            👨‍🍳 Chefs
          </h3>


          {chefPerformance.length === 0 ? (

            <p
              style={{
                color: "#777",
              }}
            >
              No chef data available.
            </p>

          ) : (

            chefPerformance.map(
              (chef) => (

                <div
                  key={chef._id}
                  style={{
                    background:
                      "#121212",
                    border:
                      "1px solid #292929",
                    borderRadius:
                      "12px",
                    padding: "15px",
                    marginBottom:
                      "12px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      marginBottom:
                        "10px",
                    }}
                  >

                    <strong
                      style={{
                        color:
                          "#fff",
                        fontSize:
                          "16px",
                      }}
                    >
                      {chef.name}
                    </strong>

                    <span
                      style={{
                        color:
                          chef.active
                            ? "#4caf50"
                            : "#777",
                        fontSize:
                          "12px",
                      }}
                    >
                      {chef.active
                        ? "ACTIVE"
                        : "DISABLED"}
                    </span>

                  </div>


                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(4,1fr)",
                      gap: "8px",
                    }}
                  >

                    <PerformanceMini
                      label="Orders"
                      value={
                        chef.orders
                      }
                    />

                    <PerformanceMini
                      label="Completed"
                      value={
                        chef.completed
                      }
                    />

                    <PerformanceMini
                      label="Avg Prep"
                      value={
                        chef.averagePreparation
                          ? `${chef.averagePreparation} min`
                          : "—"
                      }
                    />

                    <PerformanceMini label="Credit Points" value={`★ ${chef.creditPoints || 0}`} />

                  </div>

                </div>

              )
            )

          )}


          {/* ==================================
        WAITERS
    ================================== */}

          <h3
            style={{
              color: "#ffb347",
              borderBottom:
                "1px solid #292929",
              paddingBottom: "10px",
              marginTop: "30px",
            }}
          >
            🧑‍💼 Waiters
          </h3>


          {waiterPerformance.length === 0 ? (

            <p
              style={{
                color: "#777",
              }}
            >
              No waiter data available.
            </p>

          ) : (

            waiterPerformance.map(
              (waiter) => (

                <div
                  key={waiter._id}
                  style={{
                    background:
                      "#121212",
                    border:
                      "1px solid #292929",
                    borderRadius:
                      "12px",
                    padding: "15px",
                    marginBottom:
                      "12px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      marginBottom:
                        "10px",
                    }}
                  >

                    <strong
                      style={{
                        color:
                          "#fff",
                        fontSize:
                          "16px",
                      }}
                    >
                      {waiter.name}
                    </strong>

                    <span
                      style={{
                        color:
                          waiter.active
                            ? "#4caf50"
                            : "#777",
                        fontSize:
                          "12px",
                      }}
                    >
                      {waiter.active
                        ? "ACTIVE"
                        : "DISABLED"}
                    </span>

                  </div>


                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(4,1fr)",
                      gap: "8px",
                    }}
                  >

                    <PerformanceMini
                      label="Orders"
                      value={
                        waiter.orders
                      }
                    />

                    <PerformanceMini
                      label="Served"
                      value={
                        waiter.served
                      }
                    />

                    <PerformanceMini
                      label="Avg Serve"
                      value={
                        waiter.averageServing
                          ? `${waiter.averageServing} min`
                          : "—"
                      }
                    />

                    <PerformanceMini label="Credit Points" value={`★ ${waiter.creditPoints || 0}`} />

                  </div>

                </div>

              )
            )

          )}

        </div>

      </div>


      {/* ======================================
          FEEDBACK
      ====================================== */}

      <div
        style={{
          ...panel,
          marginBottom:
            "30px",
          overflow:
            "hidden",
        }}
      >

        <div
          style={{
            padding:
              "25px",
            borderBottom:
              "1px solid #292929",
          }}
        >

          <h2
            style={{
              color:
                "#ffb347",
              margin:
                "0 0 6px",
            }}
          >
            <FaStar />
            &nbsp; Customer Feedback
          </h2>

          <p
            style={{
              color:
                "#777",
              margin: 0,
            }}
          >
            Customer ratings and
            comments
          </p>

        </div>

        {/* FEEDBACK SUMMARY */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap:
              "15px",
            padding:
              "20px 25px",
          }}
        >

          <FeedbackStat
            label="Overall Rating"
            value={
              averageRating.toFixed(
                1
              )
            }
          />

          <FeedbackStat
            label="Food Rating"
            value={
              averageFoodRating.toFixed(
                1
              )
            }
          />

          <FeedbackStat
            label="Service Rating"
            value={
              averageServiceRating.toFixed(
                1
              )
            }
          />

          <FeedbackStat
            label="Reviews"
            value={
              feedbacks.length
            }
          />

        </div>

        {feedbacks.length ===
          0 ? (
          <div
            style={{
              padding:
                "45px",
              textAlign:
                "center",
              color:
                "#777",
            }}
          >
            No customer feedback
            available yet.
          </div>
        ) : (
          <div
            style={{
              padding:
                "0 25px 25px",
              overflowX:
                "auto",
            }}
          >

            <table
              style={{
                width:
                  "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "700px",
              }}
            >

              <thead>
                <tr
                  style={{
                    background:
                      "#202020",
                  }}
                >
                  <th
                    style={
                      tableHead
                    }
                  >
                    Overall
                  </th>

                  <th
                    style={
                      tableHead
                    }
                  >
                    Food
                  </th>

                  <th
                    style={
                      tableHead
                    }
                  >
                    Service
                  </th>

                  <th
                    style={
                      tableHead
                    }
                  >
                    Comment
                  </th>

                  <th
                    style={
                      tableHead
                    }
                  >
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>

                {feedbacks
                  .slice()
                  .reverse()
                  .map(
                    (
                      feedback,
                      index
                    ) => (
                      <tr
                        key={
                          feedback.orderId ||
                          index
                        }
                        style={{
                          borderTop:
                            "1px solid #292929",
                        }}
                      >

                        <td
                          style={
                            tableCell
                          }
                        >
                          ⭐{" "}
                          {
                            feedback.overallRating
                          }/5
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {
                            feedback.foodRating
                          }/5
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {
                            feedback.serviceRating
                          }/5
                        </td>

                        <td
                          style={{
                            ...tableCell,
                            maxWidth:
                              "350px",
                            color:
                              "#aaa",
                          }}
                        >
                          {feedback.comment ||
                            "No comment"}
                        </td>

                        <td
                          style={{
                            ...tableCell,
                            color:
                              "#777",
                          }}
                        >
                          {formatDate(
                            feedback.createdAt
                          )}
                        </td>

                      </tr>
                    )
                  )}

              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* ======================================
          FOOTER
      ====================================== */}

      <div
        style={{
          textAlign:
            "center",
          padding:
            "25px",
          color:
            "#555",
          borderTop:
            "1px solid #222",
        }}
      >
        ORDER NOW • EAT NOW
        &nbsp; | &nbsp;
        Restaurant Administration
      </div>

    </div>
  );
}

// ============================================
// SMALL COMPONENTS
// ============================================

function StatusBox({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div
      style={{
        background:
          "#121212",
        border:
          `1px solid ${color}40`,
        borderRadius:
          "12px",
        padding:
          "18px",
      }}
    >
      <div
        style={{
          fontSize:
            "22px",
        }}
      >
        {icon}
      </div>

      <p
        style={{
          color:
            "#888",
          margin:
            "8px 0 4px",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          color,
          margin: 0,
          fontSize:
            "28px",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

function PerformanceRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display:
          "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center",
        padding:
          "15px 0",
        borderBottom:
          "1px solid #292929",
        gap: "15px",
      }}
    >
      <span
        style={{
          color:
            "#999",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color:
            "#ffb347",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function FeedbackStat({
  label,
  value,
}) {
  return (
    <div
      style={{
        background:
          "#121212",
        borderRadius:
          "12px",
        padding:
          "18px",
        border:
          "1px solid #292929",
      }}
    >
      <p
        style={{
          color:
            "#888",
          margin:
            "0 0 6px",
        }}
      >
        {label}
      </p>

      <h2
        style={{
          color:
            "#ffb347",
          margin: 0,
        }}
      >
        {value}
      </h2>
    </div>
  );
}

const tableHead = {
  padding:
    "16px",
  textAlign:
    "left",
  color:
    "#ffb347",
  fontSize:
    "13px",
};

const tableCell = {
  padding:
    "16px",
  color:
    "#ddd",
};

function PerformanceMini({
  label,
  value,
}) {
  return (
    <div
      style={{
        background: "#1b1b1b",
        borderRadius: "8px",
        padding: "9px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: "11px",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          color: "#ffb347",
          fontSize: "14px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
