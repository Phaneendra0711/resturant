import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaMoneyBillWave,
  FaWallet,
  FaQrcode,
  FaGift,
  FaShieldAlt,
  FaSpinner,
} from "react-icons/fa";
import cartBg from "./assets/cart_bg.png";
import "./Payment.css";

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function Payment() {
  const navigate = useNavigate();

  const [checkout, setCheckout] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [success, setSuccess] = useState(false);

  const [cashRequested, setCashRequested] = useState(false);
  const [cashRequesting, setCashRequesting] = useState(false);
  const [cashCouponCode, setCashCouponCode] = useState("");
  const [cashCouponChecking, setCashCouponChecking] = useState(false);
  const [cashCouponStatus, setCashCouponStatus] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("pendingCheckout");

    if (!saved) {
      navigate("/cart", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (!parsed.items?.length || !parsed.total) {
        navigate("/cart", { replace: true });
        return;
      }

      setCheckout(parsed);
    } catch (error) {
      console.error("Invalid checkout data:", error);
      navigate("/cart", { replace: true });
    }
  }, [navigate]);

  const itemCount = useMemo(
    () =>
      checkout?.items?.reduce(
        (sum, item) => sum + Number(item.qty || 0),
        0
      ) || 0,
    [checkout]
  );

  const checkCashCoupon = async () => {
    const code = cashCouponCode.trim();

    if (!code) {
      alert("Please enter the coupon code given by the waiter.");
      return;
    }

    if (cashCouponChecking || processing) return;

    setCashCouponChecking(true);
    setCashCouponStatus(null);

    try {
      const response = await fetch("/api/coupons/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          total: Number(checkout.total || 0),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid coupon code.");
      }

      const orderTotal = Number(checkout.total || 0);
      const discount = Number(data.discount || 0);
      const unusedAmount = Number(data.unusedAmount || 0);
      const couponAmount = discount + unusedAmount;

      if (couponAmount < orderTotal) {
        setCashCouponStatus({
          type: "LOW",
          message: `Coupon amount ${formatMoney(couponAmount)} is lower than the order amount ${formatMoney(orderTotal)}. Please call the waiter for further payment.`,
        });
        return;
      }

      if (couponAmount > orderTotal || unusedAmount > 0) {
        setCashCouponStatus({
          type: "HIGH",
          message: `Coupon amount is ${formatMoney(couponAmount)}, which is ${formatMoney(couponAmount - orderTotal)} more than your order. The extra amount will be lost. Click CONFIRM to place the order.`,
          couponAmount,
          unusedAmount,
        });
        return;
      }

      setCashCouponStatus({
        type: "EXACT",
        message: `Coupon amount matches the order amount (${formatMoney(orderTotal)}).`,
      });

      await createOrder("CASH", code);
    } catch (error) {
      console.error("CASH COUPON ERROR:", error);
      setCashCouponStatus({
        type: "ERROR",
        message: error.message || "Unable to verify coupon code.",
      });
    } finally {
      setCashCouponChecking(false);
    }
  };

  const createOrder = async (method, suppliedCouponCode = "") => {
    if (!checkout || processing) return;

    if (method === "CASH" && !suppliedCouponCode.trim()) {
      alert("Please enter the coupon code given by the waiter.");
      return;
    }

    setSelectedMethod(method);
    setProcessing(true);

    try {
      if (method !== "CASH") {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      const backendPaymentMethod =
        method === "CASH"
          ? "CASH"
          : method === "UPI_SIMULATED"
            ? "UPI"
            : method === "CARD_SIMULATED"
              ? "CARD"
              : "DEMO";

      const orderData = {
        customerName: checkout.customerName,

        items: checkout.items.map((item) => ({
          name: item.name,
          category: item.category || "",
          price: item.price,
          quantity: item.qty,
          image: item.image || "",
          preference:
            item.preference ||
            (item.servicePreference === "FIRST"
              ? "WITH 1ST PREFERENCE"
              : item.servicePreference === "LAST"
                ? "WITH LAST PREFERENCE"
                : item.servicePreference === "NOW"
                  ? "SERVE NOW"
                  : ""),
        })),

        totalAmount: checkout.total,
        paymentStatus: "PAID",
        paymentMethod: backendPaymentMethod,
        amountPaid: checkout.total,
        paidAt: new Date(),
        tableNumber: checkout.tableNumber,
        couponCode:
          method === "CASH"
            ? suppliedCouponCode.trim()
            : checkout.couponCode || "",
        chefDescription: checkout.chefDescription || "",
        waiterDescription: checkout.waiterDescription || "",
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      const mongoOrder = data.order;

      localStorage.setItem("activeOrderId", mongoOrder._id);

      const existingOrders =
        JSON.parse(localStorage.getItem("orders")) || [];

      existingOrders.push(mongoOrder);
      localStorage.setItem("orders", JSON.stringify(existingOrders));

      localStorage.removeItem("cart");
      sessionStorage.removeItem("pendingCheckout");

      setSuccess(true);

      setTimeout(() => {
        navigate("/status");
      }, 900);
    } catch (error) {
      console.error("PAYMENT ERROR:", error);
      alert(error.message || "Payment could not be completed. Please try again.");
      setProcessing(false);
      setSelectedMethod("");
    }
  };

  const simulatePayment = async () => {
    if (!selectedMethod || selectedMethod === "CASH") {
      alert("Please select a digital payment method first.");
      return;
    }

    await createOrder(selectedMethod);
  };

  const requestCashPayment = async () => {
    if (!checkout || cashRequesting || cashRequested) return;

    setSelectedMethod("CASH");
    setCashRequesting(true);

    try {
      const response = await fetch("/api/assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: checkout.customerName,
          tableNumber: checkout.tableNumber,
          type: "CASH_PAYMENT",
          paymentType: "CASH",
          grandTotal: checkout.total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to request waiter");
      }

      setCashRequested(true);
      alert("Cash payment request sent to the waiter. Please enter the coupon code given by the waiter.");
    } catch (error) {
      console.error("CASH REQUEST ERROR:", error);
      alert(error.message || "Unable to request waiter for cash payment.");
      setSelectedMethod("");
    } finally {
      setCashRequesting(false);
    }
  };

  if (!checkout) {
    return (
      <div
        className="payment-page"
        style={{ backgroundImage: `url(${cartBg})` }}
      >
        <div className="payment-loading">Loading billing...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="payment-page"
        style={{ backgroundImage: `url(${cartBg})` }}
      >
        <div className="payment-success">
          <FaCheckCircle />
          <h1>ORDER PLACED</h1>
          <p>Your order has been placed successfully.</p>
          <span>Opening your order status...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="payment-page"
      style={{ backgroundImage: `url(${cartBg})` }}
    >
      <header className="payment-header">
        <button className="payment-back" onClick={() => navigate("/cart")}>
          <FaArrowLeft />
          BACK TO CART
        </button>

        <div className="payment-heading">
          <span>ORDER NOW</span>
          <h1>SECURE BILLING</h1>
          <p>Choose a payment method to complete your order</p>
        </div>

        <div className="payment-secure-badge">
          <FaShieldAlt />
          SECURE CHECKOUT
        </div>
      </header>

      <main className="payment-container">
        <section className="payment-methods-card">
          <div className="section-kicker">PAYMENT</div>
          <h2>CHOOSE YOUR PAYMENT METHOD</h2>
          <p className="section-description">
            Choose hand cash or simulate one of the digital payment methods below.
          </p>

          <div
            className={`cash-payment-button ${
              selectedMethod === "CASH" ? "selected" : ""
            } ${cashRequested ? "cash-requested" : ""}`}
          >
            <span className="method-icon">
              <FaMoneyBillWave />
            </span>

            <span className="method-copy">
              <strong>HAND CASH</strong>
              <small>
                {cashRequested
                  ? "Waiter requested — enter your coupon code"
                  : "Request the waiter for cash payment"}
              </small>
            </span>

            {!cashRequested && (
              <button
                type="button"
                className="cash-request-action"
                onClick={requestCashPayment}
                disabled={cashRequesting || processing}
              >
                {cashRequesting ? (
                  <>
                    <FaSpinner className="spinner" /> REQUESTING
                  </>
                ) : (
                  <>
                    REQUEST WAITER <FaArrowRight />
                  </>
                )}
              </button>
            )}

            {cashRequested && (
              <div className="cash-coupon-area">
                <input
                  type="text"
                  value={cashCouponCode}
                  onChange={(e) => {
                    setCashCouponCode(e.target.value.toUpperCase());
                    setCashCouponStatus(null);
                  }}
                  placeholder="ENTER COUPON CODE"
                  maxLength={50}
                  disabled={processing}
                />

                <button
                  type="button"
                  className="cash-confirm-action"
                  onClick={
                    cashCouponStatus?.type === "HIGH"
                      ? () => createOrder("CASH", cashCouponCode)
                      : checkCashCoupon
                  }
                  disabled={
                    processing ||
                    cashCouponChecking ||
                    !cashCouponCode.trim() ||
                    cashCouponStatus?.type === "LOW"
                  }
                >
                  {processing ? (
                    <>
                      <FaSpinner className="spinner" /> PLACING
                    </>
                  ) : cashCouponChecking ? (
                    <>
                      <FaSpinner className="spinner" /> CHECKING
                    </>
                  ) : cashCouponStatus?.type === "HIGH" ? (
                    <>
                      CONFIRM & PLACE ORDER <FaArrowRight />
                    </>
                  ) : (
                    <>
                      CHECK COUPON <FaArrowRight />
                    </>
                  )}
                </button>

                {cashCouponStatus && (
                  <div
                    className={`cash-coupon-status cash-coupon-status-${cashCouponStatus.type.toLowerCase()}`}
                  >
                    {cashCouponStatus.message}
                  </div>
                )}
              </div>
            )}

            <span className="method-amount">
              {formatMoney(checkout.total)}
            </span>
          </div>

          <div className="method-divider">
            <span>SIMULATED DIGITAL PAYMENTS</span>
          </div>

          <div className="digital-grid">
            <button
              className={`digital-method ${
                selectedMethod === "UPI_SIMULATED" ? "selected" : ""
              }`}
              onClick={() => setSelectedMethod("UPI_SIMULATED")}
              disabled={processing || cashRequested}
            >
              <FaMobileAlt />
              <strong>UPI</strong>
              <span>Simulate UPI payment</span>
            </button>

            <button
              className={`digital-method ${
                selectedMethod === "CARD_SIMULATED" ? "selected" : ""
              }`}
              onClick={() => setSelectedMethod("CARD_SIMULATED")}
              disabled={processing || cashRequested}
            >
              <FaCreditCard />
              <strong>DEBIT / CREDIT CARD</strong>
              <span>Simulate card payment</span>
            </button>

            <button
              className={`digital-method ${
                selectedMethod === "NET_BANKING_SIMULATED" ? "selected" : ""
              }`}
              onClick={() => setSelectedMethod("NET_BANKING_SIMULATED")}
              disabled={processing || cashRequested}
            >
              <FaUniversity />
              <strong>NET BANKING</strong>
              <span>Simulate bank payment</span>
            </button>

            <button
              className={`digital-method ${
                selectedMethod === "WALLET_SIMULATED" ? "selected" : ""
              }`}
              onClick={() => setSelectedMethod("WALLET_SIMULATED")}
              disabled={processing || cashRequested}
            >
              <FaWallet />
              <strong>WALLETS</strong>
              <span>Simulate wallet payment</span>
            </button>
          </div>

          <button
            type="button"
            className="simulate-payment-button"
            onClick={simulatePayment}
            disabled={processing || cashRequested || !selectedMethod || selectedMethod === "CASH"}
          >
            {processing && selectedMethod !== "CASH" ? (
              <>
                <FaSpinner className="spinner" /> SIMULATING PAYMENT...
              </>
            ) : (
              <>
                SIMULATE PAYMENT <FaArrowRight />
              </>
            )}
          </button>

          <div className="static-methods-title">OTHER PAYMENT METHODS</div>

          <div className="static-methods">
            <button type="button" onClick={() => alert("QR Payment is coming soon.")}>
              <FaQrcode />
              <span>QR PAYMENT</span>
              <small>Available at counter</small>
            </button>
            <button type="button" onClick={() => alert("Gift Card payment is coming soon.")}>
              <FaGift />
              <span>GIFT CARD</span>
              <small>Restaurant gift cards</small>
            </button>
            <button type="button" onClick={() => alert("Contactless payment is coming soon.")}>
              <FaCreditCard />
              <span>CONTACTLESS</span>
              <small>Tap-to-pay terminal</small>
            </button>
          </div>

          {processing && (
            <div className="payment-processing">
              <FaSpinner className="spinner" />
              <span>
                {selectedMethod === "CASH"
                  ? "Confirming cash payment..."
                  : "Simulating secure payment..."}
              </span>
            </div>
          )}
        </section>

        <aside className="payment-summary-card">
          <div className="section-kicker">BILLING SUMMARY</div>
          <h2>YOUR ORDER</h2>

          <div className="summary-meta">
            <div>
              <span>Customer</span>
              <strong>{checkout.customerName}</strong>
            </div>
            <div>
              <span>Table</span>
              <strong>{checkout.tableNumber}</strong>
            </div>
            <div>
              <span>Items</span>
              <strong>{itemCount}</strong>
            </div>
          </div>

          <div className="summary-items">
            {checkout.items.map((item) => (
              <div className="summary-item" key={item.id || item.name}>
                <span>
                  {item.name} × {item.qty}
                </span>
                <strong>
                  {formatMoney(Number(item.price) * Number(item.qty))}
                </strong>
              </div>
            ))}
          </div>

          <div className="billing-line">
            <span>Food Subtotal</span>
            <strong>{formatMoney(checkout.subtotal)}</strong>
          </div>

          <div className="billing-line">
            <span>GST (5% on food)</span>
            <strong>{formatMoney(checkout.gst)}</strong>
          </div>

          <div className="billing-line">
            <span>Service Charge</span>
            <strong>{formatMoney(checkout.serviceCharge)}</strong>
          </div>

          <div className="grand-total">
            <span>GRAND TOTAL</span>
            <strong>{formatMoney(checkout.total)}</strong>
          </div>

          <div className="demo-note">
            <FaShieldAlt />
            <span>
              Digital payment buttons are simulation-only and do not connect to a real payment gateway.
            </span>
          </div>
        </aside>
      </main>
    </div>
  );
}
