import mongoose from "mongoose";

/*
==================================================
ORDER ITEM SCHEMA
==================================================
*/

const orderItemSchema = new mongoose.Schema(
  {
    /*
    BASIC ITEM INFORMATION
    */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    image: {
      type: String,
      default: "",
    },

    /*
    ==================================================
    ITEM TYPE
    ==================================================

    FOOD
      → Chef prepares this item

    SERVICE
      → Waiter serves this item
         Example:
         Water Bottle
         Coke
    */

    serviceType: {
      type: String,
      enum: ["FOOD", "SERVICE"],
      default: "FOOD",
    },

    /*
    ==================================================
    SERVICE PREFERENCE
    ==================================================

    Only meaningful for SERVICE items.

    NOW
      → Serve immediately

    FIRST
      → Serve together with first food preference

    LAST
      → Serve together with last food preference
    */

    servicePreference: {
      type: String,
      enum: ["NOW", "FIRST", "LAST", ""],
      default: "",
    },

    /*
    ==================================================
    SERVICE GROUP
    ==================================================

    This tells the waiter which food item
    the service item belongs with.

    NOW
      → separate service task

    FIRST
      → grouped with first food preference

    LAST
      → grouped with last food preference
    */

    serviceGroup: {
      type: String,
      enum: ["NOW", "FIRST", "LAST", ""],
      default: "",
    },

    // Persistent waiter task identity. A food item and every service
    // item delivered with it share this value and are one waiter task.
    waiterTaskGroup: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    ==================================================
    WAITER SERVICE TIMER
    ==================================================

    Food service:
      8 minutes

    Water / Coke:
      5 minutes
    */

    waiterServiceTargetMinutes: {
      type: Number,
      default: 8,
    },

    /*
    ==================================================
    CUSTOMER PREFERENCE
    ==================================================
    */

    preference: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    ==================================================
    CUSTOMER ESTIMATION
    ==================================================
    */

    customerFirstMinutes: {
      type: Number,
      default: 0,
    },

    customerLastMinutes: {
      type: Number,
      default: 0,
    },

    /*
    ==================================================
    CHEF TIMER
    ==================================================

    These values are used only for FOOD items.

    Example:

    chefGreenMinutes = 20
    chefOrangeMinutes = 25

    Green:
      until 15 minutes

    Orange:
      final 5 minutes

    Red:
      after target
    */

    chefGreenMinutes: {
      type: Number,
      default: 15,
    },

    chefOrangeMinutes: {
      type: Number,
      default: 20,
    },

    /*
    ==================================================
    CHEF TIMESTAMPS
    ==================================================
    */

    acceptedAt: {
      type: Date,
      default: null,
    },

    readyAt: {
      type: Date,
      default: null,
    },

    chefId: {
      type: String,
      default: null,
    },

    chefName: {
      type: String,
      default: "",
    },

    /*
    ==================================================
    WAITER TIMESTAMPS
    ==================================================
    */

    waiterAssignedAt: {
      type: Date,
      default: null,
    },

    servedAt: {
      type: Date,
      default: null,
    },

    waiterId: {
      type: String,
      default: null,
    },

    waiterName: {
      type: String,
      default: "",
    },

    /*
    ==================================================
    ITEM STATUS
    ==================================================
    */

    status: {
      type: String,
      enum: [
        "ORDERED",
        "PREPARING",
        "READY",
        "ON_THE_WAY",
        "SERVED",
        "WAITING",
      ],
      default: "ORDERED",
    },
  },
  {
    _id: true,
  }
);


/*
==================================================
ORDER SCHEMA
==================================================
*/

const orderSchema = new mongoose.Schema(
  {
    /*
    ==================================================
    CUSTOMER
    ==================================================
    */

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    tableNumber: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    ==================================================
    ITEMS
    ==================================================
    */

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message:
          "Order must contain at least one item",
      },
    },

    /*
    ==================================================
    TOTAL
    ==================================================
    */

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
    ==================================================
    CUSTOMER ESTIMATE
    ==================================================
    */

    customerEstimate: {
      firstMinutes: {
        type: Number,
        default: 20,
      },

      lastMinutes: {
        type: Number,
        default: 25,
      },
    },

    /*
    ==================================================
    OVERALL ORDER STATUS
    ==================================================
    */

    status: {
      type: String,
      enum: [
        "NEW",
        "PREPARING",
        "SERVED",
      ],
      default: "NEW",
    },

    /*
    ==================================================
    PAYMENT
    ==================================================
    */

    paymentStatus: {
      type: String,
      default: "PAID",
    },

    paymentMethod: {
      type: String,
      default: "DEMO",
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    /*
    ==================================================
    COUPON
    ==================================================
    */

    couponCode: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    ==================================================
    DESCRIPTIONS
    ==================================================
    */

    chefDescription: {
      type: String,
      default: "",
      trim: true,
    },

    waiterDescription: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    ==================================================
    CHEF COMPATIBILITY INFORMATION
    ==================================================
    */

    chef: {
      staffId: {
        type: String,
        default: "",
      },

      name: {
        type: String,
        default: "",
      },

      acceptedAt: {
        type: Date,
        default: null,
      },

      readyAt: {
        type: Date,
        default: null,
      },

      targetMinutes: {
        type: Number,
        default: 20,
      },

      performance: {
        type: String,
        default: "",
      },
    },

    /*
    ==================================================
    WAITER COMPATIBILITY INFORMATION
    ==================================================
    */

    waiter: {
      staffId: {
        type: String,
        default: "",
      },

      name: {
        type: String,
        default: "",
      },

      assignedAt: {
        type: Date,
        default: null,
      },

      servedAt: {
        type: Date,
        default: null,
      },

      targetMinutes: {
        type: Number,
        default: 8,
      },

      performance: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);


/*
==================================================
MODEL
==================================================
*/

const Order = mongoose.model(
  "Order",
  orderSchema
);

export default Order;
