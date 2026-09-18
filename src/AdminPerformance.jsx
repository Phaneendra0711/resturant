import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx-js-style";

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
  FaUtensils,
  FaMotorcycle,
  FaTimes,
  FaTicketAlt,
  FaChartLine,
} from "react-icons/fa";

export default function AdminPerformance() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState("ALL");

  const [dateRange, setDateRange] = useState("TODAY");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showExportRange, setShowExportRange] = useState(false);

  const [showCashCoupon, setShowCashCoupon] =
    useState(false);

  const [cashAmount, setCashAmount] = useState("");
  const [cashCustomer, setCashCustomer] = useState("");
  const [cashPhone, setCashPhone] = useState("");
  const [generatedCoupon, setGeneratedCoupon] =
    useState(null);

  /* =====================================================
     ADMIN PROTECTION
  ===================================================== */

  useEffect(() => {
    const role =
      sessionStorage.getItem("userRole");

    if (role !== "admin") {
      navigate("/staff-login");
    }
  }, [navigate]);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const ordersResponse =
        await fetch("/api/orders");

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

      try {
        const staffResponse =
          await fetch("/api/staff");

        const staffData =
          await staffResponse.json();

        if (staffResponse.ok) {
          setStaff(
            staffData.staff || []
          );
        }
      } catch (error) {
        console.error(
          "Staff loading error:",
          error
        );
      }

      try {
        const feedbackResponse =
          await fetch("/api/feedback");

        const feedbackData =
          await feedbackResponse.json();

        if (feedbackResponse.ok) {
          setFeedbacks(
            feedbackData.feedbacks || []
          );
        }
      } catch (error) {
        console.error(
          "Feedback loading error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Admin performance error:",
        error
      );

      if (showLoader) {
        alert(
          error.message ||
            "Failed to load dashboard data"
        );
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);

    const interval =
      setInterval(() => {
        loadData(false);
      }, 5000);

    return () =>
      clearInterval(interval);
  }, []);

  /* =====================================================
     ORDER STATISTICS
  ===================================================== */

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status !== "SERVED"
      ),
    [orders]
  );

  const completedOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === "SERVED"
      ),
    [orders]
  );

  const orderStatusSummary =
    useMemo(() => {
      const summary = {
        NEW: 0,
        PREPARING: 0,
        SERVED: 0,
      };

      orders.forEach((order) => {
        const status =
          String(
            order.status || "NEW"
          ).toUpperCase();

        if (status in summary) {
          summary[status]++;
        }
      });

      return summary;
    }, [orders]);

  const foodItemStatusSummary =
    useMemo(() => {
      const summary = {
        NEW: 0,
        PREPARING: 0,
        READY: 0,
        ON_THE_WAY: 0,
        SERVED: 0,
      };

      orders.forEach((order) => {
        (order.items || []).forEach(
          (item) => {
            if (
              String(
                item.serviceType ||
                  "FOOD"
              ).toUpperCase() ===
              "SERVICE"
            ) {
              return;
            }

            const status =
              String(
                item.status ||
                  "ORDERED"
              ).toUpperCase();

            if (
              status === "ORDERED"
            ) {
              summary.NEW++;
            } else if (
              status === "PREPARING"
            ) {
              summary.PREPARING++;
            } else if (
              status === "READY"
            ) {
              summary.READY++;
            } else if (
              status === "ON_THE_WAY"
            ) {
              summary.ON_THE_WAY++;
            } else if (
              status === "SERVED"
            ) {
              summary.SERVED++;
            }
          }
        );
      });

      return summary;
    }, [orders]);

  const serviceItemStatusSummary =
    useMemo(() => {
      const summary = {
        WAITING: 0,
        ON_THE_WAY: 0,
        SERVED: 0,
      };

      orders.forEach((order) => {
        (order.items || []).forEach(
          (item) => {
            if (
              String(
                item.serviceType ||
                  "FOOD"
              ).toUpperCase() !==
              "SERVICE"
            ) {
              return;
            }

            const status =
              String(
                item.status ||
                  "WAITING"
              ).toUpperCase();

            if (
              status === "WAITING"
            ) {
              summary.WAITING++;
            } else if (
              status === "ON_THE_WAY"
            ) {
              summary.ON_THE_WAY++;
            } else if (
              status === "SERVED"
            ) {
              summary.SERVED++;
            }
          }
        );
      });

      return summary;
    }, [orders]);

  /* =====================================================
     REVENUE
  ===================================================== */

  /* =====================================================
     FEEDBACK
  ===================================================== */

  const averageRating =
    feedbacks.length
      ? feedbacks.reduce(
          (total, feedback) =>
            total +
            Number(
              feedback.overallRating ||
                0
            ),
          0
        ) / feedbacks.length
      : 0;

  const averageFoodRating =
    feedbacks.length
      ? feedbacks.reduce(
          (total, feedback) =>
            total +
            Number(
              feedback.foodRating || 0
            ),
          0
        ) / feedbacks.length
      : 0;

  const averageServiceRating =
    feedbacks.length
      ? feedbacks.reduce(
          (total, feedback) =>
            total +
            Number(
              feedback.serviceRating ||
                0
            ),
          0
        ) / feedbacks.length
      : 0;

  /* =====================================================
     STAFF
  ===================================================== */

  const chefs = staff.filter(
    (member) =>
      member.role === "CHEF"
  );

  const waiters = staff.filter(
    (member) =>
      member.role === "WAITER"
  );

  const activeStaff = staff.filter(
    (member) => member.active
  );

  const disabledStaff = staff.filter(
    (member) => !member.active
  );

  /* =====================================================
     PERFORMANCE
  ===================================================== */

  const chefPerformance = useMemo(
    () =>
      chefs.map((chef) => {
        const chefOrders =
          orders.filter(
            (order) =>
              order.chef?.staffId ===
                chef._id ||
              order.chef?.name ===
                chef.name
          );

        const completed =
          chefOrders.filter(
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
                ) / 60000
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
          orders:
            chefOrders.length,
          completed:
            completed.length,
          averagePreparation,
        };
      }),
    [chefs, orders]
  );

  const waiterPerformance = useMemo(
    () =>
      waiters.map((waiter) => {
        const waiterOrders =
          orders.filter(
            (order) =>
              order.waiter?.staffId ===
                waiter._id ||
              order.waiter?.name ===
                waiter.name
          );

        const served =
          waiterOrders.filter(
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
                ) / 60000
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
          orders:
            waiterOrders.length,
          served:
            served.length,
          averageServing,
        };
      }),
    [waiters, orders]
  );

  /* =====================================================
     HELPERS
  ===================================================== */

  const statusLabel = (status) => {
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
        return status || "UNKNOWN";
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "NEW":
        return "#d89a2b";

      case "PREPARING":
        return "#ff8c00";

      case "READY":
        return "#65d88a";

      case "ON_THE_WAY":
        return "#4da3ff";

      case "SERVED":
        return "#8bc34a";

      default:
        return "#888";
    }
  };

  const currency = (value) =>
    `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;

  const formatDate = (value) => {
    if (!value) return "-";

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

  /* =====================================================
     DATE RANGE
  ===================================================== */

  const getRange = () => {
    const now = new Date();
    const dayStart = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const dayEnd = d => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
    if (dateRange === "CUSTOM") {
      if (!customStart || !customEnd) return null;
      const start = new Date(`${customStart}T00:00:00`);
      const end = new Date(`${customEnd}T23:59:59.999`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null;
      return { start, end };
    }
    if (dateRange === "YESTERDAY") { const d = new Date(now); d.setDate(d.getDate()-1); return {start:dayStart(d),end:dayEnd(d)}; }
    if (dateRange === "THIS_WEEK") { const d=dayStart(now); const n=d.getDay()===0?6:d.getDay()-1; d.setDate(d.getDate()-n); return {start:d,end:dayEnd(now)}; }
    if (dateRange === "THIS_MONTH") return {start:new Date(now.getFullYear(),now.getMonth(),1),end:dayEnd(now)};
    if (dateRange === "THIS_YEAR") return {start:new Date(now.getFullYear(),0,1),end:dayEnd(now)};
    return {start:dayStart(now),end:dayEnd(now)};
  };

  const activeDateRange = useMemo(() => getRange(), [dateRange, customStart, customEnd]);
  const inRange = (value, range=activeDateRange) => { if (!range || !value) return false; const d=new Date(value); return !Number.isNaN(d.getTime()) && d>=range.start && d<=range.end; };
  const rangedOrders = useMemo(() => orders.filter(o => inRange(o.createdAt || o.created_at || o.orderDate)), [orders, activeDateRange]);
  const rangedFeedbacks = useMemo(() => feedbacks.filter(f => inRange(f.createdAt || f.created_at || f.date)), [feedbacks, activeDateRange]);
  const rangedActiveOrders = useMemo(() => rangedOrders.filter(o=>o.status!=="SERVED"), [rangedOrders]);
  const rangedCompletedOrders = useMemo(() => rangedOrders.filter(o=>o.status==="SERVED"), [rangedOrders]);

  const rangedOrderStatusSummary = useMemo(() => { const x={NEW:0,PREPARING:0,SERVED:0}; rangedOrders.forEach(o=>{const st=String(o.status||"NEW").toUpperCase(); if(st in x)x[st]++;}); return x; },[rangedOrders]);
  const rangedFoodItemStatusSummary = useMemo(() => { const x={NEW:0,PREPARING:0,READY:0,ON_THE_WAY:0,SERVED:0}; rangedOrders.forEach(o=>(o.items||[]).forEach(i=>{if(String(i.serviceType||"FOOD").toUpperCase()==="SERVICE")return; const st=String(i.status||"ORDERED").toUpperCase(); if(st==="ORDERED")x.NEW++; else if(st in x)x[st]++;})); return x; },[rangedOrders]);
  const rangedServiceItemStatusSummary = useMemo(() => { const x={WAITING:0,ON_THE_WAY:0,SERVED:0}; rangedOrders.forEach(o=>(o.items||[]).forEach(i=>{if(String(i.serviceType||"FOOD").toUpperCase()!=="SERVICE")return; const st=String(i.status||"WAITING").toUpperCase(); if(st in x)x[st]++;})); return x; },[rangedOrders]);
  const rangedTotalRevenue = useMemo(()=>rangedOrders.reduce((n,o)=>n+Number(o.totalAmount||0),0),[rangedOrders]);
  const rangedCompletedRevenue = useMemo(()=>rangedCompletedOrders.reduce((n,o)=>n+Number(o.totalAmount||0),0),[rangedCompletedOrders]);
  const rangedAverageOrderValue = rangedOrders.length ? rangedTotalRevenue/rangedOrders.length : 0;
  const rangedAverageRating = rangedFeedbacks.length ? rangedFeedbacks.reduce((n,f)=>n+Number(f.overallRating||0),0)/rangedFeedbacks.length : 0;
  const rangedAverageFoodRating = rangedFeedbacks.length ? rangedFeedbacks.reduce((n,f)=>n+Number(f.foodRating||0),0)/rangedFeedbacks.length : 0;
  const rangedAverageServiceRating = rangedFeedbacks.length ? rangedFeedbacks.reduce((n,f)=>n+Number(f.serviceRating||0),0)/rangedFeedbacks.length : 0;

  const rangedChefPerformance = useMemo(()=>chefs.map(chef=>{ const os=rangedOrders.filter(o=>o.chef?.staffId===chef._id||o.chef?.name===chef.name); const completed=os.filter(o=>o.status==="SERVED"); const times=os.filter(o=>o.chef?.acceptedAt&&o.chef?.readyAt).map(o=>(new Date(o.chef.readyAt)-new Date(o.chef.acceptedAt))/60000); return {...chef,orders:os.length,completed:completed.length,averagePreparation:times.length?Math.round(times.reduce((a,b)=>a+b,0)/times.length):0}; }),[chefs,rangedOrders]);
  const rangedWaiterPerformance = useMemo(()=>waiters.map(waiter=>{ const os=rangedOrders.filter(o=>o.waiter?.staffId===waiter._id||o.waiter?.name===waiter.name); const served=os.filter(o=>o.status==="SERVED"); const times=os.filter(o=>o.waiter?.assignedAt&&o.waiter?.servedAt).map(o=>(new Date(o.waiter.servedAt)-new Date(o.waiter.assignedAt))/60000); return {...waiter,orders:os.length,served:served.length,averageServing:times.length?Math.round(times.reduce((a,b)=>a+b,0)/times.length):0}; }),[waiters,rangedOrders]);

  const filteredOrders = useMemo(()=>orderFilter==="ACTIVE"?rangedActiveOrders:orderFilter==="COMPLETED"?rangedCompletedOrders:rangedOrders,[orderFilter,rangedOrders,rangedActiveOrders,rangedCompletedOrders]);
  const rangeLabel={TODAY:"Today",YESTERDAY:"Yesterday",THIS_WEEK:"This Week",THIS_MONTH:"This Month",THIS_YEAR:"This Year",CUSTOM:"Custom Range"}[dateRange];
  const rangeText=activeDateRange?`${activeDateRange.start.toLocaleDateString("en-IN")} - ${activeDateRange.end.toLocaleDateString("en-IN")}`:"Select valid dates";

  /* =====================================================
     CASH COUPON
  ===================================================== */

  const sanitizeWholeAmount = (
    value
  ) => {
    if (value === "") return "";

    const numeric =
      Number(value);

    if (!Number.isFinite(numeric)) {
      return "";
    }

    return String(
      Math.trunc(numeric)
    );
  };

  const generateCashCoupon =
    async (event) => {
      event.preventDefault();

      const amount =
        Number(cashAmount);

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {
        alert(
          "Enter a whole positive cash amount"
        );
        return;
      }

      try {
        const response =
          await fetch(
            "/api/coupons/cash",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                amount,
                customerName:
                  cashCustomer,
                customerPhone:
                  cashPhone,
                adminId:
                  sessionStorage.getItem(
                    "staffId"
                  ),
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data.message ||
              "Unable to generate coupon"
          );
          return;
        }

        setGeneratedCoupon(
          data.coupon
        );
      } catch (error) {
        console.error(error);

        alert(
          "Unable to generate coupon"
        );
      }
    };

  /* =====================================================
     EXCEL EXPORT
  ===================================================== */

  const createExcelReport = (range = activeDateRange) => {
    if (!range) { alert("Please select a valid custom date range."); return; }
    const reportOrders=orders.filter(o=>inRange(o.createdAt||o.created_at||o.orderDate,range));
    const reportFeedbacks=feedbacks.filter(f=>inRange(f.createdAt||f.created_at||f.date,range));
    if(!reportOrders.length&&!reportFeedbacks.length){alert("There is no data for the selected range.");return;}
    try {
      const wb=XLSX.utils.book_new();
      const total=reportOrders.reduce((n,o)=>n+Number(o.totalAmount||0),0);
      const served=reportOrders.filter(o=>o.status==="SERVED");
      const summary=[{
        "Report Range":rangeLabel,"Date From":range.start.toLocaleDateString("en-IN"),"Date To":range.end.toLocaleDateString("en-IN"),
        "Total Orders":reportOrders.length,"Active Orders":reportOrders.filter(o=>o.status!=="SERVED").length,"Completed Orders":served.length,"Total Revenue":total,
        "Average Order Value":reportOrders.length?Math.round(total/reportOrders.length):0,"Customer Reviews":reportFeedbacks.length,
        "Average Overall Rating":reportFeedbacks.length?Number((reportFeedbacks.reduce((n,f)=>n+Number(f.overallRating||0),0)/reportFeedbacks.length).toFixed(2)):0
      }];
      const add=(rows,name,cols)=>{
        const sh=XLSX.utils.json_to_sheet(rows);
        sh["!cols"]=cols.map(w=>({wch:w}));
        const range=XLSX.utils.decode_range(sh["!ref"]||"A1:A1");
        for(let row=range.s.r; row<=range.e.r; row++){
          for(let col=range.s.c; col<=range.e.c; col++){
            const cell=sh[XLSX.utils.encode_cell({r:row,c:col})];
            if(!cell) continue;
            cell.s={
              alignment:{horizontal:"center",vertical:"center",wrapText:true}
            };
            if(row===range.s.r){
              cell.s={
                font:{bold:true},
                alignment:{horizontal:"center",vertical:"center",wrapText:true}
              };
            }
          }
        }
        sh["!rows"]=Array.from({length:range.e.r-range.s.r+1},()=>({hpt:24}));
        XLSX.utils.book_append_sheet(wb,sh,name);
      };
      add(summary,"Summary",[18,15,15,15,15,18,18,22,18,24]);

      const orderRows=reportOrders.map(o=>({"Order ID":o._id||"","Customer Name":o.customerName||"Customer","Table Number":o.tableNumber||"—",Items:(o.items||[]).map(i=>`${i.name||"Item"} × ${Number(i.quantity||i.qty||1)}`).join(", "),"Item Count":(o.items||[]).reduce((n,i)=>n+Number(i.quantity||i.qty||1),0),Chef:o.chef?.name||o.chefName||"—",Waiter:o.waiter?.name||o.waiterName||"—",Status:statusLabel(o.status),"Order Date":o.createdAt?new Date(o.createdAt).toLocaleDateString("en-IN"):"—","Order Time":o.createdAt?new Date(o.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"—","Total Amount":Number(o.totalAmount||0),"Payment Status":o.paymentStatus||"—","Payment Method":o.paymentMethod||"—","Coupon Code":o.couponCode||"—"}));
      if(orderRows.length)add(orderRows,"Orders",[25,22,14,55,12,20,20,15,16,14,16,18,18,18]);

      const itemRows=[]; reportOrders.forEach(o=>(o.items||[]).forEach(i=>itemRows.push({"Order ID":o._id||"","Customer Name":o.customerName||"Customer","Item Name":i.name||"",Category:i.category||"—",Quantity:Number(i.quantity||i.qty||1),"Unit Price":Number(i.price||0),"Item Total":Number(i.price||0)*Number(i.quantity||i.qty||1),Preference:i.preference||"—","Item Type":String(i.serviceType||"FOOD").toUpperCase(),Status:i.status||"—","Customer First Estimate":i.customerFirstMinutes??"—","Customer Last Estimate":i.customerLastMinutes??"—","Chef Green Minutes":i.chefGreenMinutes??"—","Chef Orange Minutes":i.chefOrangeMinutes??"—"})));
      if(itemRows.length)add(itemRows,"Order Items",[25,22,28,18,11,14,15,18,15,16,24,24,21,22]);

      const staffRows=[...rangedChefPerformance.map(c=>({"Staff Name":c.name||"—",Role:"Chef","Total Orders":c.orders||0,Completed:c.completed||0,"Average Preparation Time":c.averagePreparation?`${c.averagePreparation} min`:"—","Credit Points":c.creditPoints||0,Status:c.active?"ACTIVE":"DISABLED"})),...rangedWaiterPerformance.map(w=>({"Staff Name":w.name||"—",Role:"Waiter","Total Orders":w.orders||0,Completed:w.served||0,"Average Serving Time":w.averageServing?`${w.averageServing} min`:"—","Credit Points":w.creditPoints||0,Status:w.active?"ACTIVE":"DISABLED"}))];
      if(staffRows.length)add(staffRows,"Staff Performance",[25,15,18,18,28,18,15]);

      const feedbackRows=reportFeedbacks.map(f=>({"Order ID":f.orderId||"—","Customer Name":f.customerName||"—","Overall Rating":Number(f.overallRating||0),"Food Rating":Number(f.foodRating||0),"Service Rating":Number(f.serviceRating||0),Comment:f.comment||"No comment",Date:f.createdAt?new Date(f.createdAt).toLocaleDateString("en-IN"):"—",Time:f.createdAt?new Date(f.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"—"}));
      if(feedbackRows.length)add(feedbackRows,"Feedback",[25,22,17,15,18,55,16,14]);

      const map={}; reportOrders.forEach(o=>(o.items||[]).forEach(i=>{const n=i.name||"Unknown Item"; if(!map[n])map[n]={"Item Name":n,Category:i.category||"—","Quantity Sold":0,Revenue:0}; const q=Number(i.quantity||i.qty||1); map[n]["Quantity Sold"]+=q; map[n].Revenue+=Number(i.price||0)*q;}));
      const itemSummary=Object.values(map).sort((a,b)=>b["Quantity Sold"]-a["Quantity Sold"]);
      if(itemSummary.length)add(itemSummary,"Item Summary",[30,18,18,18]);

      const stamp=rangeLabel.replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_]/g,"");
      XLSX.writeFile(wb,`restaurant_report_${stamp}.xlsx`);
      setShowExportRange(false);
    } catch(error){console.error("Excel export error:",error);alert("Failed to generate Excel report.");}
  };

  const downloadExcelReport=()=>setShowExportRange(true);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem(
      "adminAuth"
    );

    sessionStorage.removeItem(
      "userRole"
    );

    sessionStorage.removeItem(
      "staffId"
    );

    sessionStorage.removeItem(
      "staffName"
    );

    sessionStorage.removeItem(
      "staffUsername"
    );

    navigate(
      "/staff-login"
    );
  };

  /* =====================================================
     THEME
  ===================================================== */

  const gold = "#d89a2b";

  const pageStyle = {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    padding: "28px 30px 60px",
    color: "#fff",
    background: `
      radial-gradient(
        circle at 8% 0%,
        rgba(216,154,43,.12),
        transparent 28%
      ),
      radial-gradient(
        circle at 92% 10%,
        rgba(216,154,43,.07),
        transparent 26%
      ),
      radial-gradient(
        circle at 50% 100%,
        rgba(216,154,43,.045),
        transparent 35%
      ),
      linear-gradient(
        135deg,
        #070707,
        #0b0b0b 45%,
        #10100f
      )
    `,
    fontFamily:
      "Inter, Poppins, system-ui, sans-serif",
    overflowX: "hidden",
  };

  const panel = {
    background:
      "linear-gradient(145deg,#181818,#101010)",
    border:
      "1px solid rgba(216,154,43,.14)",
    borderRadius: "17px",
    boxShadow:
      "0 15px 45px rgba(0,0,0,.32)",
  };

  const topButton = {
    minHeight: "46px",
    padding: "0 17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "10px",
    border:
      "1px solid rgba(216,154,43,.2)",
    color: "#ddd",
    background:
      "linear-gradient(145deg,#1d1d1d,#121212)",
    cursor: "pointer",
    fontWeight: 850,
    fontSize: "11px",
  };

  const goldButton = {
    ...topButton,
    color: "#111",
    border: "none",
    background:
      "linear-gradient(145deg,#e5aa45,#c17c19)",
    boxShadow:
      "0 7px 20px rgba(216,154,43,.12)",
  };

  const tableHead = {
    padding: "14px 15px",
    textAlign: "left",
    color: gold,
    fontSize: "10px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  };

  const tableCell = {
    padding: "14px 15px",
    color: "#ddd",
    fontSize: "11px",
    verticalAlign: "top",
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div style={pageStyle}>

      {/* =================================================
          COUPON MODAL
      ================================================= */}

      {showCashCoupon && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: "20px",
            background:
              "rgba(0,0,0,.82)",
            backdropFilter:
              "blur(12px)",
          }}
        >
          <form
            onSubmit={
              generateCashCoupon
            }
            style={{
              width: "440px",
              maxWidth: "100%",
              padding: "30px",
              boxSizing: "border-box",
              borderRadius: "20px",
              background:
                "linear-gradient(145deg,#1a1a1a,#0d0d0d)",
              border:
                "1px solid rgba(216,154,43,.35)",
              boxShadow:
                "0 30px 100px rgba(0,0,0,.7)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowCashCoupon(false);
                setGeneratedCoupon(null);
              }}
              style={{
                position: "absolute",
                top: "13px",
                right: "13px",
                width: "34px",
                height: "34px",
                border: "none",
                borderRadius: "50%",
                background: "#252525",
                color: "#999",
                cursor: "pointer",
              }}
            >
              <FaTimes />
            </button>

            <div
              style={{
                width: "50px",
                height: "50px",
                display: "grid",
                placeItems: "center",
                borderRadius: "13px",
                color: "#111",
                background:
                  "linear-gradient(145deg,#e7b04d,#b97818)",
                marginBottom: "17px",
              }}
            >
              <FaTicketAlt
                size={20}
              />
            </div>

            <p
              style={{
                color: gold,
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: ".14em",
                margin: 0,
              }}
            >
              ADMIN TOOL
            </p>

            <h2
              style={{
                margin:
                  "5px 0 8px",
                fontSize: "24px",
              }}
            >
              Generate Cash Coupon
            </h2>

            <p
              style={{
                color: "#777",
                fontSize: "11px",
                lineHeight: 1.5,
              }}
            >
              Confirm the cash received
              by the admin and generate
              a one-use coupon code.
            </p>

            {generatedCoupon ? (
              <div
                style={{
                  marginTop: "20px",
                  padding: "22px",
                  textAlign: "center",
                  borderRadius: "13px",
                  background:
                    "rgba(60,150,80,.08)",
                  border:
                    "1px solid rgba(101,216,138,.2)",
                }}
              >
                <div
                  style={{
                    color: "#fff",
                    fontSize: "30px",
                    fontWeight: 900,
                    letterSpacing: "5px",
                  }}
                >
                  {
                    generatedCoupon.code
                  }
                </div>

                <div
                  style={{
                    color: "#65d88a",
                    marginTop: "9px",
                    fontWeight: 800,
                  }}
                >
                  Value:{" "}
                  {currency(
                    generatedCoupon.amount
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCashCoupon(false);
                    setGeneratedCoupon(null);
                  }}
                  style={{
                    ...goldButton,
                    marginTop: "18px",
                    width: "100%",
                  }}
                >
                  DONE
                </button>
              </div>
            ) : (
              <>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={cashAmount}
                  onChange={(e) =>
                    setCashAmount(
                      sanitizeWholeAmount(
                        e.target.value
                      )
                    )
                  }
                  placeholder="Cash amount (₹)"
                  style={inputStyle}
                />

                <input
                  value={cashCustomer}
                  onChange={(e) =>
                    setCashCustomer(
                      e.target.value
                    )
                  }
                  placeholder="Customer name"
                  style={inputStyle}
                />

                <input
                  value={cashPhone}
                  onChange={(e) =>
                    setCashPhone(
                      e.target.value
                    )
                  }
                  placeholder="Customer phone (optional)"
                  style={inputStyle}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "9px",
                    marginTop: "18px",
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      ...goldButton,
                      background:
                        "linear-gradient(145deg,#69d985,#3c9e57)",
                      color: "#071008",
                    }}
                  >
                    GENERATE
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowCashCoupon(false)
                    }
                    style={{
                      ...topButton,
                      background: "#252525",
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      <div style={{...panel,padding:"16px 18px",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"14px",flexWrap:"wrap"}}>
        <div><div style={{color:gold,fontSize:"9px",fontWeight:900,letterSpacing:".14em",marginBottom:"5px"}}>ANALYSIS PERIOD</div><div style={{color:"#777",fontSize:"10px"}}>Showing orders and performance for <strong style={{color:"#ddd"}}>{rangeLabel}</strong> <span>({rangeText})</span></div></div>
        <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{[["TODAY","Today"],["YESTERDAY","Yesterday"],["THIS_WEEK","This Week"],["THIS_MONTH","This Month"],["THIS_YEAR","This Year"],["CUSTOM","Custom"]].map(([v,l])=><button key={v} onClick={()=>setDateRange(v)} style={{minHeight:"36px",padding:"0 12px",borderRadius:"9px",cursor:"pointer",border:dateRange===v?"1px solid #d89a2b":"1px solid #292929",background:dateRange===v?"rgba(216,154,43,.14)":"#171717",color:dateRange===v?gold:"#777",fontWeight:850,fontSize:"9px"}}>{l}</button>)}</div>
        {dateRange==="CUSTOM"&&<div style={{width:"100%",display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap",paddingTop:"10px",borderTop:"1px solid #252525"}}><label style={{color:"#666",fontSize:"9px",fontWeight:800}}>FROM <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{...inputStyle,width:"auto",marginTop:0,marginLeft:"6px"}}/></label><label style={{color:"#666",fontSize:"9px",fontWeight:800}}>TO <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{...inputStyle,width:"auto",marginTop:0,marginLeft:"6px"}}/></label></div>}
      </div>

      {showExportRange&&<div style={{position:"fixed",inset:0,zIndex:1200,display:"grid",placeItems:"center",padding:"20px",background:"rgba(0,0,0,.82)",backdropFilter:"blur(10px)"}}><div style={{width:"520px",maxWidth:"100%",padding:"28px",borderRadius:"20px",background:"linear-gradient(145deg,#1a1a1a,#0c0c0c)",border:"1px solid rgba(216,154,43,.30)",boxShadow:"0 30px 100px rgba(0,0,0,.7)"}}><FaFileExcel style={{color:"#69d985",fontSize:"30px",marginBottom:"12px"}}/><div style={{color:gold,fontSize:"9px",fontWeight:900,letterSpacing:".14em"}}>EXCEL EXPORT</div><h2 style={{margin:"6px 0 8px",fontSize:"24px"}}>Download Restaurant Data</h2><p style={{color:"#777",fontSize:"11px",lineHeight:1.55}}>Export a clean presentation-friendly workbook for the selected period.</p><div style={{marginTop:"18px"}}><div style={{color:"#666",fontSize:"8px",fontWeight:900,marginBottom:"8px"}}>CHOOSE EXPORT RANGE</div><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{[["TODAY","Today"],["YESTERDAY","Yesterday"],["THIS_WEEK","This Week"],["THIS_MONTH","This Month"],["THIS_YEAR","This Year"],["CUSTOM","Custom"]].map(([v,l])=><button key={v} type="button" onClick={()=>setDateRange(v)} style={{minHeight:"34px",padding:"0 10px",borderRadius:"8px",cursor:"pointer",border:dateRange===v?"1px solid #d89a2b":"1px solid #292929",background:dateRange===v?"rgba(216,154,43,.14)":"#171717",color:dateRange===v?gold:"#777",fontWeight:850,fontSize:"8px"}}>{l}</button>)}</div></div>{dateRange==="CUSTOM"&&<div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginTop:"10px"}}><input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{...inputStyle,width:"auto",marginTop:0}}/><input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{...inputStyle,width:"auto",marginTop:0}}/></div>}<div style={{marginTop:"18px",padding:"15px",borderRadius:"12px",background:"#111",border:"1px solid #292929"}}><div style={{color:"#666",fontSize:"8px",fontWeight:900}}>SELECTED RANGE</div><div style={{color:gold,fontSize:"16px",fontWeight:900,marginTop:"6px"}}>{rangeLabel}</div><div style={{color:"#777",fontSize:"10px",marginTop:"4px"}}>{rangeText}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px",marginTop:"18px"}}><button type="button" onClick={()=>createExcelReport()} disabled={!activeDateRange} style={{...goldButton,background:"linear-gradient(145deg,#69d985,#3c9e57)",color:"#071008",opacity:activeDateRange?1:.45}}><FaFileExcel/> DOWNLOAD XLSX</button><button type="button" onClick={()=>setShowExportRange(false)} style={{...topButton,background:"#252525"}}>CANCEL</button></div></div></div>}

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          ...panel,
          minHeight: "88px",
          padding:
            "18px 22px",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "20px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: gold,
              fontSize: "9px",
              fontWeight: 900,
              letterSpacing: ".14em",
              marginBottom: "5px",
            }}
          >
            RESTAURANT ANALYTICS
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "29px",
              fontWeight: 900,
              letterSpacing: "-.025em",
            }}
          >
            Performance & Orders
          </h1>

          <p
            style={{
              margin:
                "6px 0 0",
              color: "#666",
              fontSize: "11px",
            }}
          >
            Restaurant performance,
            orders, revenue and
            customer feedback
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "9px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              navigate("/admin")
            }
            style={topButton}
          >
            <FaArrowLeft />
            Admin Dashboard
          </button>

          <button
            onClick={() =>
              navigate(
                "/admin/staff"
              )
            }
            style={topButton}
          >
            <FaUsers />
            Manage Staff
          </button>

          <button
            onClick={
              downloadExcelReport
            }
            style={{
              ...topButton,
              background:
                "linear-gradient(145deg,#69d985,#3c9e57)",
              color: "#071008",
              border: "none",
            }}
          >
            <FaFileExcel />
            Download Data
          </button>

          <button
            onClick={
              handleLogout
            }
            style={{
              ...topButton,
              color: "#ff7373",
              border:
                "1px solid rgba(255,70,70,.2)",
              background:
                "rgba(255,70,70,.05)",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,minmax(0,1fr))",
          gap: "14px",
          marginBottom: "28px",
        }}
      >
        <KpiCard
          icon={<FaRupeeSign />}
          label="Total Revenue"
          value={currency(
            rangedTotalRevenue
          )}
          note={`Completed: ${currency(
            rangedCompletedRevenue
          )}`}
          color={gold}
        />

        <KpiCard
          icon={
            <FaClipboardList />
          }
          label="Total Orders"
          value={orders.length}
          note={`Average: ${currency(
            rangedAverageOrderValue
          )}`}
          color="#d89a2b"
        />

        <KpiCard
          icon={<FaClock />}
          label="Active Orders"
          value={
            rangedActiveOrders.length
          }
          note="Currently processing"
          color="#ff8c00"
        />

        <KpiCard
          icon={
            <FaCheckCircle />
          }
          label="Completed"
          value={
            rangedCompletedOrders.length
          }
          note="Served orders"
          color="#65d88a"
        />
      </div>

      {/* =================================================
          QUICK STATS
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,minmax(0,1fr))",
          gap: "14px",
          marginBottom: "28px",
        }}
      >
        <MiniStat
          label="New Orders"
          value={
            rangedOrderStatusSummary.NEW
          }
          icon="🆕"
        />

        <MiniStat
          label="Preparing"
          value={
            rangedOrderStatusSummary.PREPARING
          }
          icon="👨‍🍳"
        />

        <MiniStat
          label="Active Staff"
          value={activeStaff.length}
          icon="👥"
        />

        <MiniStat
          label="Disabled Staff"
          value={
            disabledStaff.length
          }
          icon="🔒"
        />
      </div>

      {/* =================================================
          STATUS OVERVIEW
      ================================================= */}

      <div
        style={{
          ...panel,
          padding: "23px",
          marginBottom: "28px",
        }}
      >
        <SectionTitle
          icon={<FaChartLine />}
          title="Status Overview"
          subtitle="Live order and service pipeline"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3,minmax(0,1fr))",
            gap: "13px",
          }}
        >
          <StatusGroup
            title="Order Status"
            color={gold}
            items={[
              [
                "New",
                rangedOrderStatusSummary.NEW,
                "🆕",
              ],
              [
                "Preparing",
                rangedOrderStatusSummary.PREPARING,
                "👨‍🍳",
              ],
              [
                "Served",
                rangedOrderStatusSummary.SERVED,
                "✅",
              ],
            ]}
          />

          <StatusGroup
            title="Food Items"
            color="#4da3ff"
            items={[
              [
                "New",
                rangedFoodItemStatusSummary.NEW,
                "🆕",
              ],
              [
                "Preparing",
                rangedFoodItemStatusSummary.PREPARING,
                "👨‍🍳",
              ],
              [
                "Ready",
                rangedFoodItemStatusSummary.READY,
                "🔔",
              ],
              [
                "On Way",
                rangedFoodItemStatusSummary.ON_THE_WAY,
                "🚶",
              ],
              [
                "Served",
                rangedFoodItemStatusSummary.SERVED,
                "✅",
              ],
            ]}
          />

          <StatusGroup
            title="Service Items"
            color="#65d88a"
            items={[
              [
                "Waiting",
                rangedServiceItemStatusSummary.WAITING,
                "⏳",
              ],
              [
                "On Way",
                rangedServiceItemStatusSummary.ON_THE_WAY,
                "🚶",
              ],
              [
                "Served",
                rangedServiceItemStatusSummary.SERVED,
                "✅",
              ],
            ]}
          />
        </div>
      </div>

      {/* =================================================
          ORDERS + STAFF
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0,1.25fr) minmax(360px,.75fr)",
          gap: "18px",
          marginBottom: "28px",
          alignItems: "start",
        }}
      >

        {/* ORDERS */}

        <div
          style={{
            ...panel,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "22px",
              borderBottom:
                "1px solid #282828",
            }}
          >
            <SectionTitle
              icon={
                <FaClipboardList />
              }
              title="Orders"
              subtitle="Recent restaurant orders"
            />
          </div>

          <div
            style={{
              padding:
                "13px 18px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              borderBottom:
                "1px solid #282828",
            }}
          >
            {[
              ["ALL", "All Orders"],
              ["ACTIVE", "Active"],
              [
                "COMPLETED",
                "Completed",
              ],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    setOrderFilter(
                      value
                    )
                  }
                  style={{
                    padding:
                      "9px 14px",
                    border:
                      orderFilter ===
                      value
                        ? "1px solid #d89a2b"
                        : "1px solid #292929",
                    borderRadius:
                      "9px",
                    cursor: "pointer",
                    fontWeight: 850,
                    fontSize: "10px",
                    background:
                      orderFilter ===
                      value
                        ? "rgba(216,154,43,.14)"
                        : "#171717",
                    color:
                      orderFilter ===
                      value
                        ? gold
                        : "#777",
                  }}
                >
                  {label}
                </button>
              )
            )}

            <button
              onClick={() =>
                loadData(false)
              }
              style={{
                ...topButton,
                minHeight: "35px",
                padding: "0 12px",
                marginLeft:
                  "auto",
              }}
            >
              <FaSyncAlt />
            </button>
          </div>

          {loading ? (
            <LoadingBox />
          ) : filteredOrders.length ===
            0 ? (
            <EmptyBox text="No orders found." />
          ) : (
            <div
              style={{
                maxHeight: "560px",
                overflow: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "800px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#141414",
                    }}
                  >
                    <th
                      style={
                        tableHead
                      }
                    >
                      Order
                    </th>

                    <th
                      style={
                        tableHead
                      }
                    >
                      Customer
                    </th>

                    <th
                      style={
                        tableHead
                      }
                    >
                      Items
                    </th>

                    <th
                      style={
                        tableHead
                      }
                    >
                      Qty
                    </th>

                    <th
                      style={
                        tableHead
                      }
                    >
                      Chef
                    </th>

                    <th
                      style={
                        tableHead
                      }
                    >
                      Waiter
                    </th>

                    <th
                      style={
                        tableHead
                      }
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (order) => (
                      <tr
                        key={
                          order._id
                        }
                        style={{
                          borderTop:
                            "1px solid #252525",
                        }}
                      >
                        <td
                          style={
                            tableCell
                          }
                        >
                          <strong
                            style={{
                              color: gold,
                            }}
                          >
                            #
                            {String(
                              order._id
                            ).slice(
                              -7
                            )}
                          </strong>

                          <div
                            style={{
                              marginTop:
                                "5px",
                              color:
                                "#555",
                              fontSize:
                                "9px",
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
                          </div>
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {order.customerName ||
                            "Customer"}
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {(order.items ||
                            [])
                            .map(
                              (
                                item,
                                index
                              ) => (
                                <div
                                  key={
                                    index
                                  }
                                  style={{
                                    marginBottom:
                                      "5px",
                                  }}
                                >
                                  {item.name}
                                </div>
                              )
                            )}
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {(order.items ||
                            [])
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

                        <td
                          style={
                            tableCell
                          }
                        >
                          {order.chef
                            ?.name ||
                            "—"}
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {order.waiter
                            ?.name ||
                            "—"}
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          <span
                            style={{
                              color:
                                statusColor(
                                  order.status
                                ),
                              fontWeight:
                                900,
                              fontSize:
                                "10px",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            ●{" "}
                            {statusLabel(
                              order.status
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* STAFF PERFORMANCE */}

        <div
          style={{
            ...panel,
            padding: "22px",
            maxHeight:
              "720px",
            overflowY: "auto",
          }}
        >
          <SectionTitle
            icon={<FaUsers />}
            title="Staff Performance"
            subtitle="Individual employee performance"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",
              gap: "8px",
              margin:
                "20px 0 24px",
            }}
          >
            {staff
              .filter(
                (member) =>
                  member.role !==
                  "ADMIN"
              )
              .map((member) => (
                <div
                  key={
                    member._id
                  }
                  style={{
                    padding: "11px",
                    borderRadius:
                      "10px",
                    background:
                      "#121212",
                    border:
                      "1px solid #292929",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#ddd",
                      fontSize:
                        "11px",
                      fontWeight:
                        700,
                    }}
                  >
                    {member.name}
                  </div>

                  <div
                    style={{
                      color:
                        "#666",
                      fontSize:
                        "8px",
                      margin:
                        "3px 0 7px",
                    }}
                  >
                    {member.role}
                  </div>

                  <strong
                    style={{
                      color:
                        "#ffcc4d",
                      fontSize:
                        "12px",
                    }}
                  >
                    ✦{" "}
                    {member.creditPoints ||
                      0}
                  </strong>
                </div>
              ))}
          </div>

          <StaffSection
            title="Chefs"
            icon="👨‍🍳"
            data={
              rangedChefPerformance
            }
            completedLabel="Completed"
            averageLabel="Avg Prep"
            averageKey="averagePreparation"
          />

          <StaffSection
            title="Waiters"
            icon="🧑‍💼"
            data={
              rangedWaiterPerformance
            }
            completedLabel="Served"
            averageLabel="Avg Serve"
            averageKey="averageServing"
          />
        </div>
      </div>

      {/* =================================================
          FEEDBACK
      ================================================= */}

      <div
        style={{
          ...panel,
          overflow: "hidden",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            padding: "22px",
            borderBottom:
              "1px solid #282828",
          }}
        >
          <SectionTitle
            icon={<FaStar />}
            title="Customer Feedback"
            subtitle="Customer ratings and comments"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,minmax(0,1fr))",
            gap: "12px",
            padding: "18px 22px",
          }}
        >
          <FeedbackStat
            label="Overall Rating"
            value={rangedAverageRating.toFixed(1)}
          />

          <FeedbackStat
            label="Food Rating"
            value={rangedAverageFoodRating.toFixed(1)}
          />

          <FeedbackStat
            label="Service Rating"
            value={rangedAverageServiceRating.toFixed(1)}
          />

          <FeedbackStat
            label="Reviews"
            value={
              rangedFeedbacks.length
            }
          />
        </div>

        {rangedFeedbacks.length ===
        0 ? (
          <EmptyBox text="No customer feedback available yet." />
        ) : (
          <div
            style={{
              padding:
                "0 22px 22px",
              overflowX:
                "auto",
            }}
          >
            <table
              style={{
                width: "100%",
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
                      "#141414",
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
                            "1px solid #252525",
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
                          }
                          /5
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {
                            feedback.foodRating
                          }
                          /5
                        </td>

                        <td
                          style={
                            tableCell
                          }
                        >
                          {
                            feedback.serviceRating
                          }
                          /5
                        </td>

                        <td
                          style={{
                            ...tableCell,
                            color:
                              "#aaa",
                            maxWidth:
                              "400px",
                          }}
                        >
                          {feedback.comment ||
                            "No comment"}
                        </td>

                        <td
                          style={{
                            ...tableCell,
                            color:
                              "#666",
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

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        style={{
          textAlign: "center",
          padding: "22px",
          color: "#444",
          borderTop:
            "1px solid rgba(216,154,43,.08)",
          fontSize: "9px",
          letterSpacing:
            ".08em",
        }}
      >
        ORDER NOW • EAT NOW
        &nbsp; | &nbsp;
        RESTAURANT ADMINISTRATION
      </div>
    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function KpiCard({
  icon,
  label,
  value,
  note,
  color,
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "19px",
        minHeight: "115px",
        boxSizing: "border-box",
        borderRadius: "16px",
        background:
          "linear-gradient(145deg,#171717,#101010)",
        border:
          "1px solid rgba(216,154,43,.13)",
        boxShadow:
          "0 12px 35px rgba(0,0,0,.25)",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          display: "grid",
          placeItems: "center",
          borderRadius: "11px",
          color,
          background:
            `${color}12`,
          fontSize: "17px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: "12px",
          color: "#666",
          fontSize: "8px",
          fontWeight: 900,
          letterSpacing: ".1em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "4px",
          color,
          fontSize: "25px",
          fontWeight: 900,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "4px",
          color: "#555",
          fontSize: "9px",
        }}
      >
        {note}
      </div>
    </div>
  );
}


function MiniStat({
  label,
  value,
  icon,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "13px 15px",
        borderRadius: "12px",
        background: "#111",
        border:
          "1px solid #252525",
      }}
    >
      <span
        style={{
          fontSize: "18px",
        }}
      >
        {icon}
      </span>

      <div>
        <div
          style={{
            color: "#666",
            fontSize: "8px",
            fontWeight: 900,
          }}
        >
          {label}
        </div>

        <strong
          style={{
            color: "#eee",
            fontSize: "17px",
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  );
}


function SectionTitle({
  icon,
  title,
  subtitle,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "11px",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          borderRadius: "10px",
          color: "#d89a2b",
          background:
            "rgba(216,154,43,.09)",
          fontSize: "15px",
        }}
      >
        {icon}
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            color: "#eee",
            fontSize: "19px",
            fontWeight: 900,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin:
              "3px 0 0",
            color: "#666",
            fontSize: "9px",
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}


function StatusGroup({
  title,
  color,
  items,
}) {
  return (
    <div
      style={{
        padding: "15px",
        borderRadius: "13px",
        background:
          "#111",
        border:
          `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          color,
          fontSize: "11px",
          fontWeight: 900,
          marginBottom:
            "12px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            `repeat(${items.length},minmax(0,1fr))`,
          gap: "7px",
        }}
      >
        {items.map(
          ([label, value, icon]) => (
            <div
              key={label}
              style={{
                padding: "10px 7px",
                borderRadius:
                  "9px",
                background:
                  "#181818",
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                }}
              >
                {icon}
              </div>

              <div
                style={{
                  color: "#666",
                  fontSize: "8px",
                  marginTop:
                    "5px",
                }}
              >
                {label}
              </div>

              <strong
                style={{
                  color,
                  display:
                    "block",
                  marginTop:
                    "2px",
                  fontSize:
                    "17px",
                }}
              >
                {value}
              </strong>
            </div>
          )
        )}
      </div>
    </div>
  );
}


function StaffSection({
  title,
  icon,
  data,
  completedLabel,
  averageLabel,
  averageKey,
}) {
  return (
    <div
      style={{
        marginTop: "22px",
      }}
    >
      <h3
        style={{
          margin:
            "0 0 12px",
          paddingBottom:
            "9px",
          borderBottom:
            "1px solid #292929",
          color: "#d89a2b",
          fontSize: "12px",
        }}
      >
        {icon} {title}
      </h3>

      {data.length === 0 ? (
        <p
          style={{
            color: "#666",
            fontSize: "10px",
          }}
        >
          No {title.toLowerCase()} data
          available.
        </p>
      ) : (
        data.map((member) => (
          <div
            key={
              member._id
            }
            style={{
              padding: "14px",
              marginBottom:
                "9px",
              borderRadius:
                "12px",
              background:
                "#121212",
              border:
                "1px solid #292929",
            }}
          >
            <div
              style={{
                display: "flex",
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
                    "#eee",
                  fontSize:
                    "13px",
                }}
              >
                {member.name}
              </strong>

              <span
                style={{
                  color:
                    member.active
                      ? "#65d88a"
                      : "#666",
                  fontSize:
                    "8px",
                  fontWeight:
                    900,
                }}
              >
                {member.active
                  ? "ACTIVE"
                  : "DISABLED"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4,minmax(0,1fr))",
                gap: "6px",
              }}
            >
              <PerformanceMini
                label="Orders"
                value={
                  member.orders
                }
              />

              <PerformanceMini
                label={
                  completedLabel
                }
                value={
                  member.completed ??
                  member.served ??
                  0
                }
              />

              <PerformanceMini
                label={
                  averageLabel
                }
                value={
                  member[
                    averageKey
                  ]
                    ? `${member[averageKey]} min`
                    : "—"
                }
              />

              <PerformanceMini
                label="Credit"
                value={`✦ ${
                  member.creditPoints ||
                  0
                }`}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}


function PerformanceMini({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: "8px 5px",
        textAlign: "center",
        borderRadius: "8px",
        background: "#1b1b1b",
      }}
    >
      <div
        style={{
          color: "#666",
          fontSize: "7px",
          marginBottom:
            "4px",
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          color: "#d89a2b",
          fontSize: "11px",
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
        padding: "16px",
        borderRadius: "12px",
        background: "#121212",
        border:
          "1px solid #292929",
      }}
    >
      <p
        style={{
          margin:
            "0 0 6px",
          color: "#666",
          fontSize: "8px",
          fontWeight: 900,
          letterSpacing: ".08em",
        }}
      >
        {label}
      </p>

      <h2
        style={{
          margin: 0,
          color: "#d89a2b",
          fontSize: "22px",
        }}
      >
        {value}
      </h2>
    </div>
  );
}


function LoadingBox() {
  return (
    <div
      style={{
        padding: "55px 20px",
        textAlign: "center",
        color: "#666",
      }}
    >
      <FaSyncAlt
        style={{
          color: "#d89a2b",
          fontSize: "26px",
          animation:
            "adminSpin 1s linear infinite",
        }}
      />

      <p
        style={{
          fontSize: "10px",
        }}
      >
        Loading orders...
      </p>

      <style>
        {`
          @keyframes adminSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}


function EmptyBox({
  text,
}) {
  return (
    <div
      style={{
        padding: "50px 20px",
        textAlign: "center",
        color: "#666",
        fontSize: "11px",
      }}
    >
      {text}
    </div>
  );
}


const inputStyle = {
  width: "100%",
  height: "45px",
  boxSizing: "border-box",
  padding: "0 12px",
  marginTop: "10px",
  borderRadius: "9px",
  border:
    "1px solid rgba(255,255,255,.08)",
  outline: "none",
  color: "#eee",
  background: "#090909",
  fontFamily:
    "Inter, Poppins, system-ui, sans-serif",
  fontSize: "11px",
};