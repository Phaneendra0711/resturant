import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MyOrders from "./MyOrders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Main pages
import Landing from "./Landing";
import Home from "./Home";
import Cart from "./Cart";
import Status from "./Status";

// Menu pages
import Starters from "./Starters";
import MainCourse from "./MainCourse";
import Pizza from "./Pizza";
import Burger from "./Burger";
import Beverages from "./Beverages";
import Salads from "./Salads";
import Desserts from "./Desserts";
import IceCreams from "./IceCreams";

// Staff
import StaffLogin from "./StaffLogin";
import Chef from "./Chef";
import Waiter from "./Waiter";

// Admin
import Admin from "./Admin";
import AdminPerformance from "./AdminPerformance";
import ManageStaff from "./ManageStaff";

function App() {
  return (
    <BrowserRouter>

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        newestOnTop
        theme="dark"
      />

      <Routes>

        {/* =========================
            DEFAULT
        ========================= */}

        <Route
          path="/"
          element={<Landing />}
        />

        {/* =========================
            HOME
        ========================= */}

        <Route
          path="/home"
          element={<Home />}
        />

        <Route
          path="/my-orders"
          element={<MyOrders />}
        />

        {/* =========================
            MENU
        ========================= */}

        <Route
          path="/starters"
          element={<Starters />}
        />

        <Route
          path="/maincourse"
          element={<MainCourse />}
        />

        <Route
          path="/pizza"
          element={<Pizza />}
        />

        <Route
          path="/burger"
          element={<Burger />}
        />

        <Route
          path="/beverages"
          element={<Beverages />}
        />

        <Route
          path="/salads"
          element={<Salads />}
        />

        <Route
          path="/desserts"
          element={<Desserts />}
        />

        <Route
          path="/icecreams"
          element={<IceCreams />}
        />

        {/* =========================
            CART
        ========================= */}

        <Route
          path="/cart"
          element={<Cart />}
        />

        {/* =========================
            ORDER STATUS
        ========================= */}

        <Route
          path="/status"
          element={<Status />}
        />

        {/* =========================
            STAFF LOGIN
        ========================= */}

        <Route
          path="/staff-login"
          element={<StaffLogin />}
        />

        {/* =========================
            CHEF
        ========================= */}

        <Route
          path="/chef"
          element={<Chef />}
        />

        {/* =========================
            WAITER
        ========================= */}

        <Route
          path="/waiter"
          element={<Waiter />}
        />

        {/* =========================
            ADMIN DASHBOARD
        ========================= */}

        <Route
          path="/admin"
          element={<Admin />}
        />

        {/* =========================
            ADMIN PERFORMANCE & ORDERS
        ========================= */}

        <Route
          path="/admin/performance"
          element={<AdminPerformance />}
        />

        {/* =========================
            MANAGE STAFF
        ========================= */}

        <Route
          path="/admin/staff"
          element={<ManageStaff />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;