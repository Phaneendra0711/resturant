import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import logo from "./assets/bg.png";
import cartBg from "./assets/cart_bg.png";

import {
  FaShoppingCart,
  FaTrash,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaAward,
  FaHeadset,
  FaMotorcycle,
  FaArrowRight,
  FaSyncAlt,
} from "react-icons/fa";

import "./Cart.css";


/* =========================================================
   QUICK SERVICE ITEMS
   ========================================================= */

const QUICK_ITEMS = [
  {
    id: "service-water-bottle",
    name: "Water Bottle",
    price: 20,
    category: "BEVERAGES",
    icon: "💧",
  },
  {
    id: "service-coke",
    name: "Coke",
    price: 40,
    category: "BEVERAGES",
    icon: "🥤",
  },
];


/* =========================================================
   SERVICE ITEM CHECK
   ========================================================= */

const isServiceItem = (item) => {

  const category =
    String(
      item?.category || ""
    ).trim().toUpperCase();

  const name =
    String(
      item?.name || ""
    ).trim().toLowerCase();

  return (
    category === "BEVERAGES" ||
    category === "BEVERAGE" ||
    name.includes("water bottle") ||
    name === "coke" ||
    name.includes("coca cola")
  );
};


/* =========================================================
   GET FOOD ITEMS
   ========================================================= */

const getFoodItems = (
  items
) => {

  return items.filter(
    (item) =>
      !isServiceItem(item)
  );

};


/* =========================================================
   CUSTOMER ESTIMATION
   ========================================================= */

const calculateCustomerEstimate = (
  foodItems
) => {

  if (
    foodItems.length === 0
  ) {
    return {
      firstMinutes: 0,
      lastMinutes: 0,
    };
  }


  const firstItem =
    foodItems[0];

  const firstQuantity =
    Math.max(
      1,
      Number(
        firstItem?.qty || 1
      )
    );


  /*
   * FIRST PREFERENCE
   *
   * 20 + (quantity - 1) * 5
   */

  const firstMinutes =
    20 +
    (firstQuantity - 1) *
    5;


  /*
   * LAST PREFERENCE
   *
   * 15
   * + different items * 10
   * + quantity extras
   */

  const extraQuantityMinutes =
    foodItems.reduce(
      (
        total,
        item
      ) => {

        const quantity =
          Math.max(
            1,
            Number(
              item.qty || 1
            )
          );

        return (
          total +
          (quantity - 1) * 5
        );

      },
      0
    );


  const lastMinutes =
    15 +
    foodItems.length * 10 +
    extraQuantityMinutes;


  return {
    firstMinutes,
    lastMinutes,
  };

};


/* =========================================================
   GET ESTIMATE FOR PREFERENCE
   ========================================================= */

const getPreferenceEstimate = (
  foodItems,
  preferenceOrder
) => {

  const estimate =
    calculateCustomerEstimate(
      foodItems
    );


  if (
    foodItems.length === 0
  ) {
    return 0;
  }


  if (
    preferenceOrder === 1
  ) {
    return estimate.firstMinutes;
  }


  if (
    preferenceOrder ===
    foodItems.length
  ) {
    return estimate.lastMinutes;
  }


  /*
   * Middle preference.
   *
   * Spread between first and last
   * preference.
   */

  const step =
    foodItems.length > 1
      ? (
        estimate.lastMinutes -
        estimate.firstMinutes
      ) /
      (
        foodItems.length - 1
      )
      : 0;


  return Math.round(
    estimate.firstMinutes +
    (
      preferenceOrder - 1
    ) *
    step
  );

};


/* =========================================================
   PREFERENCE LABEL
   ========================================================= */

const getPreferenceLabel = (
  number
) => {

  if (
    number === 1
  ) {
    return "1ST PREFERENCE";
  }

  if (
    number === 2
  ) {
    return "2ND PREFERENCE";
  }

  if (
    number === 3
  ) {
    return "3RD PREFERENCE";
  }

  return `${number}TH PREFERENCE`;

};


/* =========================================================
   NORMALIZE CART
   ========================================================= */

const normalizeCart = (
  items
) => {

  let preferenceCounter =
    1;


  return items.map(
    (item) => {

      if (
        isServiceItem(item)
      ) {

        return {
          ...item,

          qty:
            Math.max(
              1,
              Number(
                item.qty || 1
              )
            ),

          servicePreference:
            item.servicePreference ||
            (
              String(item.name || "")
                .trim()
                .toLowerCase() === "coke"
                ? "FIRST"
                : "NOW"
            ),
        };

      }


      const existingPreference =
        Number(
          item.preferenceOrder
        );


      const preferenceOrder =
        existingPreference >= 1
          ? existingPreference
          : preferenceCounter++;


      return {
        ...item,

        qty:
          Math.max(
            1,
            Number(
              item.qty || 1
            )
          ),

        preferenceOrder,
      };

    }
  );

};


/* =========================================================
   CART COMPONENT
   ========================================================= */

export default function Cart() {

  const navigate =
    useNavigate();


  const [
    cartItems,
    setCartItems,
  ] = useState([]);


  const [
    customerName,
    setCustomerName,
  ] = useState("");


  const [
    tableNumber,
    setTableNumber,
  ] = useState("");


  const [
    couponCode,
    setCouponCode,
  ] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);


  const [
    chefDescription,
    setChefDescription,
  ] = useState("");


  const [
    waiterDescription,
    setWaiterDescription,
  ] = useState("");


  const [
    updated,
    setUpdated,
  ] = useState(false);


  /* =========================================================
     LOAD CART
     ========================================================= */

  useEffect(() => {

    try {

      const savedCart =
        JSON.parse(
          localStorage.getItem(
            "cart"
          )
        ) || [];


      setCartItems(
        normalizeCart(
          Array.isArray(
            savedCart
          )
            ? savedCart
            : []
        )
      );

    } catch {

      setCartItems([]);

    }

  }, []);


  /* =========================================================
     SAVE CART
     ========================================================= */

  const saveCart = (
    updatedCart
  ) => {

    setCartItems(
      updatedCart
    );

    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );

  };


  /* =========================================================
     FOOD ITEMS SORTED BY PREFERENCE
     ========================================================= */

  const foodItems =
    cartItems
      .filter(
        (item) =>
          !isServiceItem(item)
      )
      .sort(
        (
          a,
          b
        ) =>
          Number(
            a.preferenceOrder || 1
          ) -
          Number(
            b.preferenceOrder || 1
          )
      );


  const serviceItems =
    cartItems.filter(
      (item) =>
        isServiceItem(item)
    );


  const orderedItems = [
    ...foodItems,
    ...serviceItems,
  ];


  /* =========================================================
     ESTIMATE
     ========================================================= */

  const customerEstimate =
    calculateCustomerEstimate(
      foodItems
    );


  /* =========================================================
     CHANGE FOOD PREFERENCE
     ========================================================= */

  const changeFoodPreference = (
    itemId,
    newPreference
  ) => {

    const target =
      Number(
        newPreference
      );


    const currentItem =
      cartItems.find(
        (item) =>
          item.id === itemId
      );


    if (
      !currentItem
    ) {
      return;
    }


    const currentPreference =
      Number(
        currentItem.preferenceOrder ||
        1
      );


    if (
      currentPreference ===
      target
    ) {
      return;
    }


    /*
     * Swap preferences so every
     * food item keeps a unique
     * preference position.
     */

    const updatedCart =
      cartItems.map(
        (item) => {

          if (
            item.id ===
            itemId
          ) {

            return {
              ...item,
              preferenceOrder:
                target,
            };

          }


          if (
            !isServiceItem(item) &&
            Number(
              item.preferenceOrder
            ) === target
          ) {

            return {
              ...item,
              preferenceOrder:
                currentPreference,
            };

          }


          return item;

        }
      );


    saveCart(
      updatedCart
    );

  };


  /* =========================================================
     CHANGE WATER / COKE TIMING
     ========================================================= */

  const changeServicePreference = (
    itemId,
    preference
  ) => {

    const updatedCart =
      cartItems.map(
        (item) =>
          item.id === itemId
            ? {
              ...item,
              servicePreference:
                preference,
            }
            : item
      );


    saveCart(
      updatedCart
    );

  };


  /* =========================================================
     ADD QUICK ITEM
     ========================================================= */

  const addQuickItem = (
    quickItem
  ) => {

    const existing =
      cartItems.find(
        (item) =>
          item.id ===
          quickItem.id
      );


    if (
      existing
    ) {

      const updatedCart =
        cartItems.map(
          (item) =>
            item.id ===
              quickItem.id
              ? {
                ...item,
                qty:
                  Number(
                    item.qty || 1
                  ) + 1,
              }
              : item
        );


      saveCart(
        updatedCart
      );

      return;

    }


    const newItem = {
      id:
        quickItem.id,

      name:
        quickItem.name,

      price:
        quickItem.price,

      category:
        quickItem.category,

      image:
        "",

      qty:
        1,

      servicePreference:
        quickItem.name.toLowerCase() === "coke"
          ? "FIRST"
          : "NOW",
    };


    saveCart([
      ...cartItems,
      newItem,
    ]);

  };


  /* =========================================================
     INCREASE
     ========================================================= */

  const increaseQty = (
    id
  ) => {

    const updatedCart =
      cartItems.map(
        (item) =>
          item.id === id
            ? {
              ...item,
              qty:
                Number(
                  item.qty || 1
                ) + 1,
            }
            : item
      );


    saveCart(
      updatedCart
    );

  };


  /* =========================================================
     DECREASE
     ========================================================= */

  const decreaseQty = (
    id
  ) => {

    const updatedCart =
      cartItems
        .map(
          (item) =>
            item.id === id
              ? {
                ...item,
                qty:
                  Number(
                    item.qty || 1
                  ) - 1,
              }
              : item
        )
        .filter(
          (item) =>
            Number(
              item.qty
            ) > 0
        );


    saveCart(
      updatedCart
    );

  };


  /* =========================================================
     REMOVE
     ========================================================= */

  const removeItem = (
    id
  ) => {

    saveCart(
      cartItems.filter(
        (item) =>
          item.id !== id
      )
    );

  };


  /* =========================================================
     FOOD SUBTOTAL
     ========================================================= */

  const foodSubtotal =
    foodItems.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.price || 0
        ) *
        Number(
          item.qty || 0
        ),
      0
    );


  /* =========================================================
     DRINK SUBTOTAL
     ========================================================= */

  const serviceSubtotal =
    serviceItems.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.price || 0
        ) *
        Number(
          item.qty || 0
        ),
      0
    );


  /* =========================================================
     GST
     
     IMPORTANT:
     GST ONLY ON FOOD.
     
     WATER + COKE ARE EXCLUDED.
     ========================================================= */

  const gst =
    Math.round(
      foodSubtotal * 0.05
    );


  /* =========================================================
     GRAND TOTAL
     ========================================================= */

  const total =
    foodSubtotal +
    serviceSubtotal +
    gst;

  const payableTotal = Math.max(0, total - couponDiscount);

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return alert("Enter a coupon code first");
    try {
      const response = await fetch("/api/coupons/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, total }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to apply coupon");
      if (data.unusedAmount > 0 && !window.confirm(`This coupon has ₹${data.unusedAmount} more than this order. The remaining value will be lost. Do you want to continue?`)) return;
      setCouponDiscount(data.discount);
    } catch (error) {
      setCouponDiscount(0);
      alert(error.message);
    }
  };


  /* =========================================================
     CART COUNT
     ========================================================= */

  const cartCount =
    cartItems.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.qty || 0
        ),
      0
    );


  /* =========================================================
     UPDATE CART
     ========================================================= */

  const handleUpdateCart =
    () => {

      localStorage.setItem(
        "cart",
        JSON.stringify(
          cartItems
        )
      );


      setUpdated(
        true
      );


      setTimeout(
        () =>
          setUpdated(
            false
          ),
        1500
      );

    };


  /* =========================================================
     SERVICE ITEM ESTIMATE
     ========================================================= */

  const getServiceEstimate =
    (item) => {

      if (
        item.servicePreference ===
        "NOW"
      ) {

        return {
          label:
            "AVAILABLE NOW",
          minutes:
            0,
          description:
            "Waiter can serve immediately",
        };

      }


      if (
        item.servicePreference ===
        "FIRST"
      ) {

        return {
          label:
            "WITH 1ST PREFERENCE",
          minutes:
            customerEstimate.firstMinutes,
          description:
            "Served with your first preference",
        };

      }


      return {
        label:
          "WITH LAST PREFERENCE",
        minutes:
          customerEstimate.lastMinutes,
        description:
          "Served with your last preference",
      };

    };


  /* =========================================================
     PLACE ORDER
     ========================================================= */

  const handlePlaceOrder =
    async () => {

      const trimmedName =
        customerName.trim();


      if (
        !trimmedName
      ) {

        alert(
          "Please enter your name before placing the order."
        );

        return;

      }


      if (
        cartItems.length === 0
      ) {

        alert(
          "Your cart is empty."
        );

        return;

      }


      /*
       * Food must be sent in
       * preference order.
       */

      const orderedFood =
        [...foodItems].sort(
          (
            a,
            b
          ) =>
            Number(
              a.preferenceOrder
            ) -
            Number(
              b.preferenceOrder
            )
        );


      const orderedServices =
        [...serviceItems];


      const finalItems = [
        ...orderedFood,
        ...orderedServices,
      ];


      const orderData = {

        customerName:
          trimmedName,


        items:
          finalItems.map(
            (item) => {

              const service =
                isServiceItem(
                  item
                );


              return {

                name:
                  item.name,

                category:
                  item.category || "",

                price:
                  Number(
                    item.price
                  ) || 0,

                quantity:
                  Number(
                    item.qty
                  ) || 1,

                image:
                  item.image || "",

                serviceType:
                  service ? "SERVICE" : "FOOD",

                servicePreference:
                  service
                    ? (item.servicePreference || "NOW")
                    : "",


                /*
                 * Food preference
                 */

                preference:
                  service
                    ? (
                      item.servicePreference ===
                        "NOW"
                        ? "SERVE NOW"
                        : item.servicePreference ===
                          "FIRST"
                          ? "WITH 1ST PREFERENCE"
                          : "WITH LAST PREFERENCE"
                    )
                    : getPreferenceLabel(
                      Number(
                        item.preferenceOrder
                      )
                    ),

              };

            }
          ),


        /*
         * FOOD + DRINKS + GST
         *
         * No service charge.
         */

        totalAmount:
          payableTotal,


        paymentStatus:
          "PAID",

        paymentMethod:
          "DEMO",

        amountPaid:
          payableTotal,

        paidAt:
          new Date(),

        tableNumber:
          tableNumber,

        couponCode:
          couponCode.trim(),

        chefDescription:
          chefDescription.trim(),

        waiterDescription:
          waiterDescription.trim(),

      };


      try {

        const response =
          await fetch(
            "/api/orders",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  orderData
                ),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.message ||
            "Failed to create order"
          );

        }


        const mongoOrder =
          data.order;


        localStorage.setItem(
          "activeOrderId",
          mongoOrder._id
        );


        const existingOrders =
          JSON.parse(
            localStorage.getItem(
              "orders"
            )
          ) || [];


        existingOrders.push(
          mongoOrder
        );


        localStorage.setItem(
          "orders",
          JSON.stringify(
            existingOrders
          )
        );


        localStorage.removeItem(
          "cart"
        );


        setCartItems(
          []
        );


        alert(
          "Order Placed Successfully"
        );


        navigate(
          "/status"
        );

      } catch (
      error
      ) {

        console.error(
          "ORDER ERROR:",
          error
        );


        alert(
          error.message ||
          "Order could not be saved. Please try again."
        );

      }

    };


  /* =========================================================
     ITEM ICON
     ========================================================= */

  const getItemIcon =
    (item) => {

      const name =
        String(
          item?.name || ""
        ).toLowerCase();


      if (
        name.includes(
          "water bottle"
        )
      ) {
        return "💧";
      }


      if (
        name === "coke" ||
        name.includes(
          "coca cola"
        )
      ) {
        return "🥤";
      }


      return "🍽️";

    };


  /* =========================================================
     RENDER
     ========================================================= */

  return (

    <div
      className="cart-page"
      style={{
        backgroundImage:
          `url(${cartBg})`,
      }}
    >


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="cart-header">

        <img
          src={logo}
          alt="Order Now"
          className="cart-logo"
        />


        <div className="cart-brand">

          <h1>
            ORDER NOW
          </h1>

          <div className="brand-line"></div>

          <h2>
            EAT NOW
          </h2>


          <nav className="cart-nav">

            <span
              onClick={() =>
                navigate(
                  "/home"
                )
              }
            >
              HOME
            </span>

            <span
              onClick={() =>
                navigate(
                  "/home"
                )
              }
            >
              MENU
            </span>

            <span className="active-nav">
              CART
            </span>

            <span>
              ABOUT US
            </span>

            <span>
              CONTACT
            </span>

          </nav>

        </div>


        <div className="cart-top-buttons">

          <div className="cart-mini-btn">

            <FaShoppingCart />

            <div>

              <p>
                CART
              </p>

              <span>
                ₹{total}
              </span>

            </div>

            <div className="cart-count">
              {cartCount}
            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          TITLE
          ===================================================== */}

      <section className="cart-title">

        <div className="cart-title-badge">
          SHOPPING CART
        </div>

        <h1>
          YOUR CART
        </h1>

        <p>
          Choose your item preferences
          and when your drinks should arrive
        </p>

      </section>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="cart-container">


        {/* ===================================================
            LEFT
            =================================================== */}

        <section className="cart-left">


          <div className="cart-table-header">

            <span>
              ITEM
            </span>

            <span>
              PRICE
            </span>

            <span>
              QUANTITY
            </span>

            <span>
              PREFERENCE
            </span>

            <span>
              ESTIMATED SERVING
            </span>

            <span>
              TOTAL
            </span>

            <span></span>

          </div>


          {/* =================================================
              ITEMS
              ================================================= */}

          {orderedItems.length === 0 ? (

            <div className="cart-empty">

              <div className="empty-icon">
                🛒
              </div>

              <h2>
                YOUR CART IS EMPTY
              </h2>

              <p>
                Add something delicious
                to get started.
              </p>

              <button
                className="empty-shopping-btn"
                onClick={() =>
                  navigate(
                    "/home"
                  )
                }
              >
                BROWSE MENU

                <FaArrowRight />

              </button>

            </div>

          ) : (

            <div className="cart-items-list">

              {orderedItems.map(
                (
                  item
                ) => {

                  const service =
                    isServiceItem(
                      item
                    );


                  const preference =
                    Number(
                      item.preferenceOrder ||
                      1
                    );


                  const foodEstimate =
                    service
                      ? null
                      : getPreferenceEstimate(
                        foodItems,
                        preference
                      );


                  const serviceEstimate =
                    service
                      ? getServiceEstimate(
                        item
                      )
                      : null;


                  return (

                    <div
                      key={
                        item.id
                      }
                      className="cart-item"
                    >


                      {/* ITEM */}

                      <div className="item-info">

                        <div className="item-image-wrap">

                          {item.image ? (

                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.name
                              }
                            />

                          ) : (

                            <div className="item-emoji">
                              {getItemIcon(
                                item
                              )}
                            </div>

                          )}

                        </div>


                        <div className="item-details">

                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            {service
                              ? "Quick waiter service"
                              : "Freshly prepared restaurant dish"}
                          </p>

                        </div>

                      </div>


                      {/* PRICE */}

                      <div className="item-price">

                        ₹
                        {Number(
                          item.price
                        ).toFixed(0)}

                      </div>


                      {/* QUANTITY */}

                      <div className="qty-box">

                        <button
                          onClick={() =>
                            decreaseQty(
                              item.id
                            )
                          }
                        >
                          <FaMinus />
                        </button>

                        <span>
                          {item.qty}
                        </span>

                        <button
                          onClick={() =>
                            increaseQty(
                              item.id
                            )
                          }
                        >
                          <FaPlus />
                        </button>

                      </div>


                      {/* =================================================
                          PREFERENCE
                          ================================================= */}

                      <div className="preference-box">

                        {service ? (

                          <>

                            <label>
                              SERVE WHEN?
                            </label>

                            <select
                              value={
                                item.servicePreference ||
                                "NOW"
                              }
                              onChange={(
                                e
                              ) =>
                                changeServicePreference(
                                  item.id,
                                  e.target.value
                                )
                              }
                            >

                              <option value="NOW">
                                Serve Now
                              </option>

                              <option value="FIRST">
                                With 1st Preference
                              </option>

                              <option value="LAST">
                                With Last Preference
                              </option>

                            </select>

                          </>

                        ) : (

                          <>

                            <label>
                              FOOD PREFERENCE
                            </label>

                            <select
                              value={
                                preference
                              }
                              onChange={(
                                e
                              ) =>
                                changeFoodPreference(
                                  item.id,
                                  e.target.value
                                )
                              }
                            >

                              {foodItems.map(
                                (
                                  _,
                                  index
                                ) => {

                                  const number =
                                    index + 1;


                                  return (

                                    <option
                                      key={
                                        number
                                      }
                                      value={
                                        number
                                      }
                                    >
                                      {
                                        getPreferenceLabel(
                                          number
                                        )
                                      }
                                    </option>

                                  );

                                }
                              )}

                            </select>

                          </>

                        )}

                      </div>


                      {/* =================================================
                          ESTIMATE
                          ================================================= */}

                      <div className="serving-estimate">

                        {service ? (

                          serviceEstimate.minutes ===
                            0 ? (

                            <>

                              <div className="estimate-now">

                                <span className="estimate-dot"></span>

                                AVAILABLE NOW

                              </div>

                              <strong>
                                SERVE NOW
                              </strong>

                              <small>
                                Waiter can bring it immediately
                              </small>

                            </>

                          ) : (

                            <>

                              <div className="estimate-label">

                                {
                                  serviceEstimate.label
                                }

                              </div>

                              <strong>

                                ~
                                {
                                  serviceEstimate.minutes
                                }
                                MIN

                              </strong>

                              <small>
                                {
                                  serviceEstimate.description
                                }
                              </small>

                            </>

                          )

                        ) : (

                          <>

                            <div
                              className={
                                preference === 1
                                  ? "estimate-label first"
                                  : preference ===
                                    foodItems.length
                                    ? "estimate-label last"
                                    : "estimate-label"
                              }
                            >

                              {
                                getPreferenceLabel(
                                  preference
                                )
                              }

                            </div>

                            <strong>

                              ~
                              {
                                foodEstimate
                              }
                              MIN

                            </strong>

                            <small>

                              {preference === 1
                                ? "First item expected to reach you"
                                : preference ===
                                  foodItems.length
                                  ? "Final item expected to reach you"
                                  : "Estimated serving time"}

                            </small>

                          </>

                        )}

                      </div>


                      {/* TOTAL */}

                      <div className="item-total">

                        ₹
                        {(
                          Number(
                            item.price
                          ) *
                          Number(
                            item.qty
                          )
                        ).toFixed(0)}

                      </div>


                      {/* DELETE */}

                      <button
                        className="delete-btn"
                        onClick={() =>
                          removeItem(
                            item.id
                          )
                        }
                      >
                        <FaTrash />
                      </button>

                    </div>

                  );

                }
              )}

            </div>

          )}


          {/* =====================================================
              QUICK ADD
              ===================================================== */}

          <section className="quick-add-section">

            <div className="quick-add-heading">

              <div>

                <span>
                  QUICK ADD
                </span>

                <h2>
                  WATER & DRINKS
                </h2>

              </div>

              <p>
                Choose whether your drink
                arrives now, with your first
                preference, or with your last.
              </p>

            </div>


            <div className="quick-add-grid">

              {QUICK_ITEMS.map(
                (
                  item
                ) => (

                  <div
                    key={
                      item.id
                    }
                    className="quick-item-card"
                  >

                    <div className="quick-item-icon">
                      {item.icon}
                    </div>


                    <div className="quick-item-info">

                      <h3>
                        {item.name}
                      </h3>

                      <p>
                        ₹{item.price}
                      </p>

                    </div>


                    <div className="quick-item-service">

                      <span>
                        WAITER SERVICE
                      </span>

                      <small>
                        5 MIN TARGET
                      </small>

                    </div>


                    <button
                      className="quick-add-btn"
                      onClick={() =>
                        addQuickItem(
                          item
                        )
                      }
                    >

                      <FaPlus />

                      ADD

                    </button>

                  </div>

                )
              )}

            </div>

          </section>


          {/* =====================================================
              ACTIONS
              ===================================================== */}

          <div className="cart-actions">

            <button
              className="continue-btn"
              onClick={() =>
                navigate(
                  "/home"
                )
              }
            >

              ← CONTINUE SHOPPING

            </button>


            <button
              className={
                updated
                  ? "update-btn updated"
                  : "update-btn"
              }
              onClick={
                handleUpdateCart
              }
            >

              <FaSyncAlt />

              {updated
                ? "CART UPDATED"
                : "UPDATE CART"}

            </button>

          </div>

        </section>


        {/* ===================================================
            RIGHT SUMMARY
            =================================================== */}

        <aside className="cart-right">

          <div className="summary-card">


            <div className="summary-heading">

              <h2>
                ORDER SUMMARY
              </h2>

              <div className="summary-line"></div>

            </div>


            {/* FOOD */}

            <div className="summary-section-title">
              FOOD
            </div>

            <div className="summary-row">

              <span>
                Food Subtotal
              </span>

              <strong>
                ₹
                {foodSubtotal.toFixed(
                  0
                )}
              </strong>

            </div>


            {/* DRINKS */}

            <div className="summary-row">

              <span>
                Water / Coke
              </span>

              <strong>
                ₹
                {serviceSubtotal.toFixed(
                  0
                )}
              </strong>

            </div>


            {/* GST */}

            <div className="summary-row gst-row">

              <span>
                GST (5% on food)
              </span>

              <strong>
                ₹
                {gst.toFixed(
                  0
                )}
              </strong>

            </div>


            <div className="gst-note">

              GST is applied only to food.
              Water Bottle and Coke are
              excluded from GST.

            </div>


            <div className="summary-divider"></div>


            {/* GRAND TOTAL */}

            <div className="summary-total">

              <span>
                GRAND TOTAL
              </span>

              <strong>
                ₹
                {payableTotal.toFixed(
                  0
                )}
              </strong>

            </div>


            {/* =================================================
                CUSTOMER
                ================================================= */}

            <div className="checkout-form">


              <div className="form-group">

                <label>
                  CUSTOMER NAME
                </label>

                <input
                  type="text"
                  value={
                    customerName
                  }
                  onChange={(
                    e
                  ) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  placeholder="Enter your name"
                  maxLength={50}
                />

              </div>


              <div className="form-group">

                <label>
                  TABLE NUMBER
                </label>

                <select
                  value={
                    tableNumber
                  }
                  onChange={(
                    e
                  ) =>
                    setTableNumber(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select your table
                  </option>

                  {Array.from(
                    {
                      length: 30,
                    },
                    (
                      _,
                      index
                    ) => (

                      <option
                        key={
                          index + 1
                        }
                        value={
                          String(
                            index + 1
                          )
                        }
                      >
                        Table{" "}
                        {index + 1}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group">

                <label>

                  COUPON CODE

                  <span>
                    OPTIONAL
                  </span>

                </label>

                <input
                  type="text"
                  value={
                    couponCode
                  }
                  onChange={(
                    e
                  ) => {
                    setCouponCode(e.target.value);
                    setCouponDiscount(0);
                  }
                  }
                  placeholder="Enter coupon code"
                />

                <button type="button" onClick={applyCoupon} style={{ marginTop: "8px", padding: "9px 14px", borderRadius: "8px", border: "none", background: "#ffb347", color: "#111", fontWeight: "bold", cursor: "pointer" }}>
                  Apply coupon
                </button>
                {couponDiscount > 0 && (
                  <p style={{ color: "#69d36b", marginTop: "7px" }}>
                    Coupon applied: −₹{couponDiscount.toFixed(0)}
                  </p>
                )}

              </div>


              <div className="form-group">

                <label>

                  DESCRIPTION TO CHEF

                  <span>
                    OPTIONAL
                  </span>

                </label>

                <textarea
                  value={
                    chefDescription
                  }
                  onChange={(
                    e
                  ) =>
                    setChefDescription(
                      e.target.value
                    )
                  }
                  placeholder="Less spicy, no onions, extra crispy..."
                />

              </div>


              <div className="form-group">

                <label>

                  DESCRIPTION TO WAITER

                  <span>
                    OPTIONAL
                  </span>

                </label>

                <textarea
                  value={
                    waiterDescription
                  }
                  onChange={(
                    e
                  ) =>
                    setWaiterDescription(
                      e.target.value
                    )
                  }
                  placeholder="Bring extra plates, serve after 10 minutes..."
                />

              </div>


              <button
                className="checkout-btn"
                onClick={
                  handlePlaceOrder
                }
              >

                <span>
                  PROCEED TO BILLING
                </span>

                <FaArrowRight />

              </button>


              <button
                className="track-btn"
                onClick={() =>
                  navigate(
                    "/status"
                  )
                }
              >
                📦 TRACK MY ORDER
              </button>


              <div className="payment-title">
                PAYMENT METHODS
              </div>


              <div className="payment-icons">

                <div>
                  VISA
                </div>

                <div>
                  MC
                </div>

                <div>
                  AMEX
                </div>

                <div>
                  UPI
                </div>

                <div>
                  PAY
                </div>

              </div>

            </div>

          </div>

        </aside>

      </main>


      {/* =====================================================
          FEATURES
          ===================================================== */}

      <section className="cart-features">

        <div className="feature-box">

          <FaMotorcycle
            className="feature-icon"
          />

          <div>

            <h3>
              TABLE SERVICE
            </h3>

            <p>
              Delivered directly to your table
            </p>

          </div>

        </div>


        <div className="feature-box">

          <FaAward
            className="feature-icon"
          />

          <div>

            <h3>
              BEST QUALITY
            </h3>

            <p>
              Freshly prepared food
            </p>

          </div>

        </div>


        <div className="feature-box">

          <FaShieldAlt
            className="feature-icon"
          />

          <div>

            <h3>
              SECURE PAYMENT
            </h3>

            <p>
              Safe & trusted billing
            </p>

          </div>

        </div>


        <div className="feature-box">

          <FaHeadset
            className="feature-icon"
          />

          <div>

            <h3>
              CUSTOMER SUPPORT
            </h3>

            <p>
              Assistance whenever needed
            </p>

          </div>

        </div>

      </section>


      <footer className="cart-footer">

        © 2026 Order Now Eat Now.
        All Rights Reserved.

      </footer>

    </div>

  );

}
