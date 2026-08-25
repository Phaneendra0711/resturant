import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "/api/staff";

export default function ManageStaff() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CHEF");

  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  const [selectedStaff, setSelectedStaff] =
    useState(null);

  const [newPassword, setNewPassword] =
    useState("");

  // ==========================================
  // FETCH STAFF
  // ==========================================

  const fetchStaff = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch staff"
        );
      }

      setStaff(data.staff || []);
    } catch (error) {
      console.error("Fetch staff error:", error);

      alert(
        error.message || "Failed to load staff"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // ==========================================
  // ADD EMPLOYEE
  // ==========================================

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !username.trim() ||
      !password.trim()
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to create employee"
        );
      }

      alert("Employee created successfully");

      setName("");
      setUsername("");
      setPassword("");
      setRole("CHEF");
      setShowAddForm(false);

      fetchStaff();
    } catch (error) {
      console.error(
        "Add employee error:",
        error
      );

      alert(
        error.message ||
        "Failed to create employee"
      );
    }
  };

  // ==========================================
  // ENABLE / DISABLE
  // ==========================================

  const toggleStaffStatus = async (employee) => {
    // Extra frontend protection
    if (employee.role === "ADMIN") {
      alert(
        "Admin accounts cannot be disabled."
      );
      return;
    }

    const action = employee.active
      ? "disable"
      : "enable";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${employee.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${employee._id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            active: !employee.active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update status"
        );
      }

      fetchStaff();
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        error.message ||
        "Failed to update staff status"
      );
    }
  };

  // ==========================================
  // DELETE EMPLOYEE
  // ==========================================

  const deleteStaff = async (employee) => {
    // Extra frontend protection
    if (employee.role === "ADMIN") {
      alert(
        "Admin accounts cannot be removed."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete ${employee.name}'s account permanently?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${employee._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to delete employee"
        );
      }

      alert(
        "Employee removed successfully"
      );

      fetchStaff();
    } catch (error) {
      console.error(
        "Delete staff error:",
        error
      );

      alert(
        error.message ||
        "Failed to remove employee"
      );
    }
  };

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  const openPasswordForm = (employee) => {
    setSelectedStaff(employee);
    setNewPassword("");
    setShowPasswordForm(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      alert("Enter a new password");
      return;
    }

    if (newPassword.length < 4) {
      alert(
        "Password must contain at least 4 characters"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${selectedStaff._id}/password`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to change password"
        );
      }

      alert(
        "Password changed successfully"
      );

      setShowPasswordForm(false);
      setSelectedStaff(null);
      setNewPassword("");
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      alert(
        error.message ||
        "Failed to change password"
      );
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("userRole");
    localStorage.removeItem("staffId");
    localStorage.removeItem("staffName");
    localStorage.removeItem("staffUsername");

    navigate("/staff-login");
  };

  // ==========================================
  // STYLES
  // ==========================================

  const inputStyle = {
    width: "100%",
    padding: "13px",
    borderRadius: "9px",
    border: "1px solid #444",
    background: "#222",
    color: "white",
    boxSizing: "border-box",
    fontSize: "15px",
    outline: "none",
  };

  const goldButton = {
    padding: "12px 20px",
    background: "#ffb347",
    color: "#111",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#050505,#111)",
        color: "white",
        padding: "30px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "35px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              color: "#ffb347",
              fontSize: "42px",
              margin: "0 0 8px 0",
            }}
          >
            Manage Staff
          </h1>

          <p
            style={{
              color: "#888",
              margin: 0,
            }}
          >
            Manage restaurant employees
            and their accounts
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              navigate("/admin")
            }
            style={goldButton}
          >
            Admin Dashboard
          </button>

          <button
            onClick={() =>
              navigate(
                "/admin/performance"
              )
            }
            style={goldButton}
          >
            Performance & Orders
          </button>

          <button
            onClick={handleLogout}
            style={{
              ...goldButton,
              background: "#ff8c00",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ACTION BAR */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#151515",
          border:
            "1px solid rgba(255,179,71,.18)",
          borderRadius: "18px",
          padding: "20px 25px",
          marginBottom: "25px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 5px 0",
              color: "#ffb347",
            }}
          >
            Employees
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            {staff.length} staff account
            {staff.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() =>
            setShowAddForm(
              !showAddForm
            )
          }
          style={{
            ...goldButton,
            background: showAddForm
              ? "#444"
              : "#ffb347",
            color: showAddForm
              ? "white"
              : "#111",
          }}
        >
          {showAddForm
            ? "Close Form"
            : "+ Add Employee"}
        </button>
      </div>

      {/* ADD EMPLOYEE */}

      {showAddForm && (
        <form
          onSubmit={handleAddEmployee}
          style={{
            background: "#151515",
            border:
              "1px solid rgba(255,179,71,.2)",
            borderRadius: "18px",
            padding: "30px",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              color: "#ffb347",
              marginTop: 0,
            }}
          >
            Add New Employee
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label>Name</label>

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Employee name"
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              />
            </div>

            <div>
              <label>Username</label>

              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="Login username"
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              />
            </div>

            <div>
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Initial password"
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              />
            </div>

            <div>
              <label>Role</label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              >
                <option value="CHEF">
                  Chef
                </option>

                <option value="WAITER">
                  Waiter
                </option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...goldButton,
              marginTop: "25px",
              background: "#4caf50",
              color: "white",
            }}
          >
            Create Employee
          </button>
        </form>
      )}

      {/* CHANGE PASSWORD MODAL */}

      {showPasswordForm &&
        selectedStaff && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(0,0,0,.75)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <form
              onSubmit={
                handleChangePassword
              }
              style={{
                width: "420px",
                maxWidth: "100%",
                background: "#181818",
                border:
                  "1px solid #ffb347",
                borderRadius: "18px",
                padding: "30px",
              }}
            >
              <h2
                style={{
                  color: "#ffb347",
                  marginTop: 0,
                }}
              >
                Change Password
              </h2>

              <p
                style={{
                  color: "#aaa",
                }}
              >
                Change password for{" "}
                <strong
                  style={{
                    color: "white",
                  }}
                >
                  {selectedStaff.name}
                </strong>
              </p>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                placeholder="Enter new password"
                style={{
                  ...inputStyle,
                  marginTop: "15px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="submit"
                  style={{
                    ...goldButton,
                    background:
                      "#4caf50",
                    color: "white",
                    flex: 1,
                  }}
                >
                  Change Password
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(
                      false
                    );
                    setSelectedStaff(
                      null
                    );
                  }}
                  style={{
                    ...goldButton,
                    background: "#444",
                    color: "white",
                    flex: 1,
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

      {/* EMPLOYEE TABLE */}

      <div
        style={{
          background: "#151515",
          border:
            "1px solid rgba(255,179,71,.18)",
          borderRadius: "18px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "22px 25px",
            borderBottom:
              "1px solid #292929",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#ffb347",
            }}
          >
            Employee Accounts
          </h2>

          <button
            onClick={fetchStaff}
            style={{
              ...goldButton,
              padding: "9px 16px",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div
            style={{
              padding: "50px",
              textAlign: "center",
              color: "#999",
            }}
          >
            Loading staff...
          </div>
        ) : staff.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#777",
            }}
          >
            No staff accounts found.
          </div>
        ) : (
          <div
            style={{
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
                  <th
                    style={{
                      padding: "18px",
                      textAlign:
                        "left",
                      color:
                        "#ffb347",
                    }}
                  >
                    Employee
                  </th>

                  <th
                    style={{
                      padding: "18px",
                      textAlign:
                        "left",
                      color:
                        "#ffb347",
                    }}
                  >
                    Username
                  </th>

                  <th
                    style={{
                      padding: "18px",
                      textAlign:
                        "left",
                      color:
                        "#ffb347",
                    }}
                  >
                    Role
                  </th>

                  <th
                    style={{
                      padding: "18px",
                      textAlign:
                        "left",
                      color:
                        "#ffb347",
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      padding: "18px",
                      textAlign:
                        "left",
                      color:
                        "#ffb347",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {staff.map(
                  (employee) => (
                    <tr
                      key={
                        employee._id
                      }
                      style={{
                        borderTop:
                          "1px solid #292929",
                      }}
                    >
                      <td
                        style={{
                          padding:
                            "18px",
                        }}
                      >
                        <strong>
                          {
                            employee.name
                          }
                        </strong>
                      </td>

                      <td
                        style={{
                          padding:
                            "18px",
                          color:
                            "#aaa",
                        }}
                      >
                        @
                        {
                          employee.username
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "18px",
                        }}
                      >
                        <span
                          style={{
                            background:
                              employee.role ===
                                "CHEF"
                                ? "#5b3b00"
                                : employee.role ===
                                  "WAITER"
                                  ? "#173f35"
                                  : "#333",
                            color:
                              employee.role ===
                                "CHEF"
                                ? "#ffb347"
                                : employee.role ===
                                  "WAITER"
                                  ? "#65d6b3"
                                  : "#fff",
                            padding:
                              "7px 12px",
                            borderRadius:
                              "20px",
                            fontWeight:
                              "bold",
                            fontSize:
                              "13px",
                          }}
                        >
                          {
                            employee.role
                          }
                        </span>
                      </td>

                      <td
                        style={{
                          padding:
                            "18px",
                        }}
                      >
                        <span
                          style={{
                            color:
                              employee.active
                                ? "#4caf50"
                                : "#ff4d4d",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {employee.active
                            ? "● Active"
                            : "● Disabled"}
                        </span>
                      </td>

                      <td
                        style={{
                          padding:
                            "18px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            gap: "8px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          {/* ADMIN ACCOUNTS:
                              ONLY PASSWORD */}

                          {employee.role !==
                            "ADMIN" && (
                              <button
                                onClick={() =>
                                  toggleStaffStatus(
                                    employee
                                  )
                                }
                                style={{
                                  padding:
                                    "8px 12px",
                                  background:
                                    employee.active
                                      ? "#6b2424"
                                      : "#245c2b",
                                  color:
                                    "white",
                                  border:
                                    "none",
                                  borderRadius:
                                    "8px",
                                  cursor:
                                    "pointer",
                                  fontWeight:
                                    "bold",
                                }}
                              >
                                {employee.active
                                  ? "Disable"
                                  : "Enable"}
                              </button>
                            )}

                          {/* PASSWORD
                              AVAILABLE FOR EVERY ROLE */}

                          <button
                            onClick={() =>
                              openPasswordForm(
                                employee
                              )
                            }
                            style={{
                              padding:
                                "8px 12px",
                              background:
                                "#76551c",
                              color:
                                "white",
                              border:
                                "none",
                              borderRadius:
                                "8px",
                              cursor:
                                "pointer",
                              fontWeight:
                                "bold",
                            }}
                          >
                            Password
                          </button>

                          {/* REMOVE
                              NOT AVAILABLE FOR ADMIN */}

                          {employee.role !==
                            "ADMIN" && (
                              <button
                                onClick={() =>
                                  deleteStaff(
                                    employee
                                  )
                                }
                                style={{
                                  padding:
                                    "8px 12px",
                                  background:
                                    "#8b2525",
                                  color:
                                    "white",
                                  border:
                                    "none",
                                  borderRadius:
                                    "8px",
                                  cursor:
                                    "pointer",
                                  fontWeight:
                                    "bold",
                                }}
                              >
                                Remove
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}