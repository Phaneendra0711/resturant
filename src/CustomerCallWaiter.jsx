import { useState } from "react";
import { FaBell, FaTimes, FaSpinner } from "react-icons/fa";
import "./CustomerCallWaiter.css";

export default function CustomerCallWaiter() {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const openModal = () => {
    setResultMessage("");
    setOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setOpen(false);
    setResultMessage("");
  };

  const requestWaiter = async () => {
    const name = customerName.trim();

    if (!name) {
      setResultMessage("Please enter your name.");
      return;
    }

    if (!tableNumber) {
      setResultMessage("Please select your table number.");
      return;
    }

    try {
      setSubmitting(true);
      setResultMessage("");

      const response = await fetch("/api/assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: name,
          tableNumber,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to request waiter"
        );
      }

      setResultMessage(
        "Waiter has been notified. Please wait."
      );

      setTimeout(() => {
        setOpen(false);
        setCustomerName("");
        setTableNumber("");
        setMessage("");
        setResultMessage("");
      }, 1800);
    } catch (error) {
      console.error("Waiter assistance error:", error);
      setResultMessage(
        error.message || "Unable to request waiter."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="customer-call-waiter-button"
        onClick={openModal}
        aria-label="Call waiter"
      >
        <FaBell />
        <span>CALL WAITER</span>
      </button>

      {open && (
        <div
          className="customer-call-waiter-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="customer-call-waiter-modal">
            <button
              type="button"
              className="customer-call-waiter-close"
              onClick={closeModal}
              disabled={submitting}
              aria-label="Close"
            >
              <FaTimes />
            </button>

            <div className="customer-call-waiter-icon">
              <FaBell />
            </div>

            <div className="customer-call-waiter-heading">
              <span>TABLE SERVICE</span>
              <h2>CALL WAITER</h2>
              <p>
                Please provide your details so our waiter
                can assist you.
              </p>
            </div>

            <label>YOUR NAME</label>
            <input
              type="text"
              value={customerName}
              onChange={(event) => {
                setCustomerName(event.target.value);
                setResultMessage("");
              }}
              placeholder="Enter your name"
              maxLength={50}
              disabled={submitting}
            />

            <label>TABLE NUMBER</label>
            <select
              value={tableNumber}
              onChange={(event) => {
                setTableNumber(event.target.value);
                setResultMessage("");
              }}
              disabled={submitting}
            >
              <option value="">Select your table</option>
              {Array.from(
                { length: 30 },
                (_, index) => index + 1
              ).map((table) => (
                <option
                  key={table}
                  value={String(table)}
                >
                  Table {table}
                </option>
              ))}
            </select>

            <label>MESSAGE (OPTIONAL)</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell the waiter what you need..."
              maxLength={200}
              disabled={submitting}
              rows={3}
            />

            {resultMessage && (
              <div
                className={`customer-call-waiter-result ${
                  resultMessage.includes("notified")
                    ? "success"
                    : "error"
                }`}
              >
                {resultMessage}
              </div>
            )}

            <button
              type="button"
              className="customer-call-waiter-submit"
              onClick={requestWaiter}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <FaSpinner className="customer-call-waiter-spinner" />
                  REQUESTING...
                </>
              ) : (
                <>
                  <FaBell />
                  REQUEST WAITER
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
