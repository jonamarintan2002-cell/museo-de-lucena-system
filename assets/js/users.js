// =========================================================
// MUSEO DE LUCENA
// USER MANAGEMENT
// assets/js/users.js
// ADMIN + STAFF + CLIENT / EVALUATOR
// =========================================================


// =========================================================
// FIREBASE CONFIG
// =========================================================

import {
  auth,
  db,
  firebaseConfig
} from "./firebase-config.js";


// =========================================================
// FIREBASE APP
// =========================================================

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";


// =========================================================
// FIREBASE AUTH
// =========================================================

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


// =========================================================
// FIRESTORE
// =========================================================

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// SECONDARY AUTH
// =========================================================

const secondaryAppName =
  "MuseoUserCreationApp";


let secondaryApp =
  getApps().find(
    app =>
      app.name === secondaryAppName
  );


if (!secondaryApp) {

  secondaryApp =
    initializeApp(
      firebaseConfig,
      secondaryAppName
    );

}


const secondaryAuth =
  getAuth(
    secondaryApp
  );


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile =
  null;


let users =
  [];


// =========================================================
// PAGE ELEMENTS
// =========================================================

const pageLoader =
  document.getElementById(
    "pageLoader"
  );


const sidebar =
  document.getElementById(
    "sidebar"
  );


const sidebarOverlay =
  document.getElementById(
    "sidebarOverlay"
  );


const menuButton =
  document.getElementById(
    "menuButton"
  );


const logoutButton =
  document.getElementById(
    "logoutButton"
  );


// =========================================================
// CURRENT USER DISPLAY
// =========================================================

const sidebarUserName =
  document.getElementById(
    "sidebarUserName"
  );


const sidebarUserRole =
  document.getElementById(
    "sidebarUserRole"
  );


const sidebarAvatar =
  document.getElementById(
    "sidebarAvatar"
  );


// =========================================================
// SUMMARY
// =========================================================

const totalUserCount =
  document.getElementById(
    "totalUserCount"
  );


const adminUserCount =
  document.getElementById(
    "adminUserCount"
  );


const staffUserCount =
  document.getElementById(
    "staffUserCount"
  );


const inactiveUserCount =
  document.getElementById(
    "inactiveUserCount"
  );


// =========================================================
// SEARCH / FILTER
// =========================================================

const userSearch =
  document.getElementById(
    "userSearch"
  );


const roleFilter =
  document.getElementById(
    "roleFilter"
  );


const userStatusFilter =
  document.getElementById(
    "userStatusFilter"
  );


const resetUserFilters =
  document.getElementById(
    "resetUserFilters"
  );


// =========================================================
// TABLE
// =========================================================

const usersTableBody =
  document.getElementById(
    "usersTableBody"
  );


const userResultCount =
  document.getElementById(
    "userResultCount"
  );


// =========================================================
// USER MODAL
// =========================================================

const userModal =
  document.getElementById(
    "userModal"
  );


const openAddUser =
  document.getElementById(
    "openAddUser"
  );


const closeUserModal =
  document.getElementById(
    "closeUserModal"
  );


const cancelUser =
  document.getElementById(
    "cancelUser"
  );


// =========================================================
// USER FORM
// =========================================================

const userForm =
  document.getElementById(
    "userForm"
  );


const userFullName =
  document.getElementById(
    "userFullName"
  );


const userEmail =
  document.getElementById(
    "userEmail"
  );


const userPassword =
  document.getElementById(
    "userPassword"
  );


const newUserRole =
  document.getElementById(
    "newUserRole"
  );


const newUserStatus =
  document.getElementById(
    "newUserStatus"
  );


const saveUser =
  document.getElementById(
    "saveUser"
  );


const userFormMessage =
  document.getElementById(
    "userFormMessage"
  );


// =========================================================
// GET PROFILE
// =========================================================

async function getUserProfile(
  uid
) {

  const reference =
    doc(
      db,
      "users",
      uid
    );


  const snapshot =
    await getDoc(
      reference
    );


  if (!snapshot.exists()) {

    throw new Error(
      "PROFILE_NOT_FOUND"
    );

  }


  return {
    id: snapshot.id,
    ...snapshot.data()
  };

}


// =========================================================
// DISPLAY CURRENT ADMIN
// =========================================================

function displayCurrentUser(
  profile
) {

  const fullName =
    profile.fullName ||
    "Museo Administrator";


  const initial =
    fullName
      .trim()
      .charAt(0)
      .toUpperCase();


  if (sidebarUserName) {

    sidebarUserName.textContent =
      fullName;

  }


  if (sidebarUserRole) {

    sidebarUserRole.textContent =
      "Administrator";

  }


  if (sidebarAvatar) {

    sidebarAvatar.textContent =
      initial;

  }

}


// =========================================================
// LOAD USERS
// =========================================================

async function loadUsers() {

  showUsersLoading();


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    users =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    users.sort(
      (a, b) => {

        const priority = {
          admin: 0,
          staff: 1,
          client: 2
        };


        const roleA =
          priority[
            String(
              a.role || ""
            ).toLowerCase()
          ] ?? 99;


        const roleB =
          priority[
            String(
              b.role || ""
            ).toLowerCase()
          ] ?? 99;


        if (
          roleA !== roleB
        ) {

          return (
            roleA -
            roleB
          );

        }


        return String(
          a.fullName || ""
        ).localeCompare(
          String(
            b.fullName || ""
          )
        );

      }
    );


    updateSummary();

    applyFilters();


  } catch (error) {

    console.error(
      "Load users error:",
      error
    );


    if (usersTableBody) {

      usersTableBody.innerHTML = `
        <tr>

          <td colspan="6">

            <div class="user-empty-state">

              <strong>
                Unable to load users
              </strong>

              <p>
                Please check your Firestore connection
                and security rules.
              </p>

            </div>

          </td>

        </tr>
      `;

    }


    throw error;

  }

}


// =========================================================
// LOADING
// =========================================================

function showUsersLoading() {

  if (!usersTableBody) {

    return;

  }


  usersTableBody.innerHTML = `
    <tr>

      <td colspan="6">

        <div class="user-empty-state">

          <strong>
            Loading users...
          </strong>

          <p>
            Retrieving system profiles.
          </p>

        </div>

      </td>

    </tr>
  `;

}


// =========================================================
// SUMMARY
// =========================================================

function updateSummary() {

  const total =
    users.length;


  const admins =
    users.filter(
      user =>
        user.role ===
        "admin"
    ).length;


  const staff =
    users.filter(
      user =>
        user.role ===
        "staff"
    ).length;


  const inactive =
    users.filter(
      user =>
        user.status ===
        "inactive"
    ).length;


  if (totalUserCount) {

    totalUserCount.textContent =
      total;

  }


  if (adminUserCount) {

    adminUserCount.textContent =
      admins;

  }


  if (staffUserCount) {

    staffUserCount.textContent =
      staff;

  }


  if (inactiveUserCount) {

    inactiveUserCount.textContent =
      inactive;

  }

}


// =========================================================
// FILTER
// =========================================================

function applyFilters() {

  const keyword =
    userSearch
      ? userSearch.value
          .trim()
          .toLowerCase()
      : "";


  const selectedRole =
    roleFilter
      ? roleFilter.value
      : "";


  const selectedStatus =
    userStatusFilter
      ? userStatusFilter.value
      : "";


  const filtered =
    users.filter(
      user => {

        const searchable =
          [
            user.fullName,
            user.email
          ]
            .map(
              value =>
                String(
                  value || ""
                ).toLowerCase()
            )
            .join(" ");


        const matchesSearch =
          !keyword ||
          searchable.includes(
            keyword
          );


        const matchesRole =
          !selectedRole ||
          user.role ===
            selectedRole;


        const matchesStatus =
          !selectedStatus ||
          user.status ===
            selectedStatus;


        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );

      }
    );


  renderUsers(
    filtered
  );

}


// =========================================================
// FILTER EVENTS
// =========================================================

userSearch?.addEventListener(
  "input",
  applyFilters
);


roleFilter?.addEventListener(
  "change",
  applyFilters
);


userStatusFilter?.addEventListener(
  "change",
  applyFilters
);


resetUserFilters?.addEventListener(
  "click",
  () => {

    if (userSearch) {
      userSearch.value = "";
    }


    if (roleFilter) {
      roleFilter.value = "";
    }


    if (userStatusFilter) {
      userStatusFilter.value = "";
    }


    applyFilters();

  }
);


// =========================================================
// ROLE DISPLAY
// =========================================================

function getRoleDisplay(
  role
) {

  switch (
    String(
      role || ""
    ).toLowerCase()
  ) {

    case "admin":

      return {
        label:
          "Administrator",

        className:
          "admin"
      };


    case "staff":

      return {
        label:
          "Museum Staff",

        className:
          "staff"
      };


    case "client":

      return {
        label:
          "Evaluator",

        className:
          "client"
      };


    default:

      return {
        label:
          "Unknown",

        className:
          "staff"
      };

  }

}


// =========================================================
// RENDER USERS
// =========================================================

function renderUsers(
  list
) {

  if (!usersTableBody) {

    return;

  }


  if (userResultCount) {

    userResultCount.textContent =
      `${list.length} ${
        list.length === 1
          ? "user"
          : "users"
      }`;

  }


  if (!list.length) {

    usersTableBody.innerHTML = `
      <tr>

        <td colspan="6">

          <div class="user-empty-state">

            <strong>
              No users found
            </strong>

            <p>
              No system users match the current
              search or filters.
            </p>

          </div>

        </td>

      </tr>
    `;


    return;

  }


  usersTableBody.innerHTML =
    list
      .map(
        user => {

          const fullName =
            escapeHTML(
              user.fullName ||
              "Unnamed User"
            );


          const email =
            escapeHTML(
              user.email ||
              "No email"
            );


          const roleInfo =
            getRoleDisplay(
              user.role
            );


          const status =
            user.status ===
            "inactive"
              ? "Inactive"
              : "Active";


          const statusClass =
            user.status ===
            "inactive"
              ? "inactive"
              : "active";


          const createdDate =
            formatTimestamp(
              user.createdAt
            );


          const initial =
            String(
              user.fullName ||
              "U"
            )
              .charAt(0)
              .toUpperCase();


          const isCurrentAccount =
            user.id ===
            auth.currentUser?.uid;


          let actions =
            "";


          // =================================================
          // CURRENT ADMIN
          // =================================================

          if (
            isCurrentAccount
          ) {

            actions = `
              <span
                title="You cannot modify your currently signed-in administrator account."
              >
                —
              </span>
            `;

          }


          // =================================================
          // OTHER ADMINISTRATORS
          // =================================================

          else if (
            user.role ===
            "admin"
          ) {

            actions = `
              <span
                title="Administrator accounts cannot be deleted from this page."
              >
                —
              </span>
            `;

          }


          // =================================================
          // STAFF / CLIENT
          // =================================================

          else {

            const statusButton =
              user.status ===
              "inactive"
                ? `
                  <button
                    type="button"
                    class="user-action activate"
                    data-action="activate"
                    data-id="${user.id}"
                  >
                    Activate
                  </button>
                `
                : `
                  <button
                    type="button"
                    class="user-action deactivate"
                    data-action="deactivate"
                    data-id="${user.id}"
                  >
                    Deactivate
                  </button>
                `;


            actions = `
              ${statusButton}

              <button
                type="button"
                class="user-action delete"
                data-action="delete"
                data-id="${user.id}"
                title="Permanently delete this system profile"
              >
                Delete
              </button>
            `;

          }


          return `
            <tr>

              <td>

                <div class="user-cell">

                  <div class="user-table-avatar">
                    ${escapeHTML(
                      initial
                    )}
                  </div>


                  <div class="user-cell-info">

                    <strong>
                      ${fullName}
                    </strong>

                    <span>
                      ${
                        isCurrentAccount
                          ? "Current account"
                          : user.role ===
                            "client"
                            ? "Registered evaluator"
                            : "System user"
                      }
                    </span>

                  </div>

                </div>

              </td>


              <td>
                ${email}
              </td>


              <td>

                <span
                  class="
                    role-badge
                    ${roleInfo.className}
                  "
                >
                  ${escapeHTML(
                    roleInfo.label
                  )}
                </span>

              </td>


              <td>

                <span
                  class="
                    user-status-badge
                    ${statusClass}
                  "
                >
                  ${status}
                </span>

              </td>


              <td>
                ${escapeHTML(
                  createdDate
                )}
              </td>


              <td>

                <div class="user-actions">
                  ${actions}
                </div>

              </td>

            </tr>
          `;

        }
      )
      .join("");

}


// =========================================================
// OPEN ADD STAFF
// =========================================================

openAddUser?.addEventListener(
  "click",
  () => {

    if (
      currentProfile?.role !==
      "admin"
    ) {

      return;

    }


    resetUserForm();


    userModal?.classList.add(
      "show"
    );


    setTimeout(
      () => {

        userFullName?.focus();

      },
      100
    );

  }
);


// =========================================================
// CLOSE MODAL
// =========================================================

function closeModal() {

  userModal?.classList.remove(
    "show"
  );


  resetUserForm();

}


closeUserModal?.addEventListener(
  "click",
  closeModal
);


cancelUser?.addEventListener(
  "click",
  closeModal
);


userModal?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      userModal
    ) {

      closeModal();

    }

  }
);


// =========================================================
// ESC
// =========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
        "Escape" &&
      userModal?.classList.contains(
        "show"
      )
    ) {

      closeModal();

    }

  }
);


// =========================================================
// RESET USER FORM
// =========================================================

function resetUserForm() {

  userForm?.reset();


  if (newUserStatus) {

    newUserStatus.value =
      "active";

  }


  if (newUserRole) {

    newUserRole.value =
      "staff";

  }


  clearFormMessage();


  if (saveUser) {

    saveUser.disabled =
      false;


    saveUser.textContent =
      "Create Staff Account";

  }

}


// =========================================================
// CREATE STAFF ACCOUNT
// =========================================================

userForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearFormMessage();


    if (
      currentProfile?.role !==
      "admin"
    ) {

      showFormMessage(
        "Administrator access is required.",
        "error"
      );


      return;

    }


    const fullName =
      userFullName.value
        .trim();


    const email =
      userEmail.value
        .trim()
        .toLowerCase();


    const password =
      userPassword.value;


    const status =
      newUserStatus.value ||
      "active";


    if (
      !fullName ||
      !email ||
      !password
    ) {

      showFormMessage(
        "Please complete all required fields.",
        "error"
      );


      return;

    }


    if (
      password.length <
      8
    ) {

      showFormMessage(
        "Temporary password must contain at least 8 characters.",
        "error"
      );


      userPassword.focus();


      return;

    }


    const duplicate =
      users.find(
        user =>
          String(
            user.email ||
            ""
          )
            .trim()
            .toLowerCase() ===
          email
      );


    if (duplicate) {

      showFormMessage(
        "A system profile with this email address already exists.",
        "error"
      );


      return;

    }


    saveUser.disabled =
      true;


    saveUser.textContent =
      "Creating Account...";


    try {

      const credential =
        await createUserWithEmailAndPassword(
          secondaryAuth,
          email,
          password
        );


      const newUid =
        credential.user.uid;


      await setDoc(
        doc(
          db,
          "users",
          newUid
        ),
        {

          fullName,

          email,

          role:
            "staff",

          status,

          createdAt:
            serverTimestamp(),

          createdBy:
            auth.currentUser.uid,

          createdByName:
            currentProfile.fullName ||
            "Museo Administrator"

        }
      );


      try {

        await signOut(
          secondaryAuth
        );

      } catch (_) {}


      await logActivity(
        "Created staff account",
        `${fullName} - ${email}`
      );


      showFormMessage(
        "Staff account created successfully.",
        "success"
      );


      await loadUsers();


      setTimeout(
        () => {

          closeModal();

        },
        700
      );


    } catch (error) {

      console.error(
        "Create staff account error:",
        error
      );


      try {

        await signOut(
          secondaryAuth
        );

      } catch (_) {}


      let message =
        "Unable to create the staff account. Please try again.";


      switch (
        error.code
      ) {

        case "auth/email-already-in-use":

          message =
            "This email address already has a Firebase Authentication account.";

          break;


        case "auth/invalid-email":

          message =
            "Please enter a valid email address.";

          break;


        case "auth/weak-password":

          message =
            "The temporary password is too weak.";

          break;


        case "auth/network-request-failed":

          message =
            "Network connection failed. Please check your internet connection.";

          break;


        case "permission-denied":

          message =
            "Firestore denied the user profile creation.";

          break;

      }


      showFormMessage(
        message,
        "error"
      );


    } finally {

      saveUser.disabled =
        false;


      saveUser.textContent =
        "Create Staff Account";

    }

  }
);


// =========================================================
// USER ACTIONS
// ACTIVATE / DEACTIVATE / DELETE
// =========================================================

usersTableBody?.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {

      return;

    }


    if (
      currentProfile?.role !==
      "admin"
    ) {

      return;

    }


    const userId =
      button.dataset.id;


    const action =
      button.dataset.action;


    const selectedUser =
      users.find(
        user =>
          user.id ===
          userId
      );


    if (!selectedUser) {

      return;

    }


    // =====================================================
    // NEVER MODIFY CURRENT ADMIN
    // =====================================================

    if (
      selectedUser.id ===
      auth.currentUser?.uid
    ) {

      alert(
        "You cannot modify or delete the administrator account you are currently using."
      );


      return;

    }


    // =====================================================
    // PROTECT ADMIN ACCOUNTS
    // =====================================================

    if (
      selectedUser.role ===
      "admin"
    ) {

      alert(
        "Administrator accounts cannot be changed or deleted from this page."
      );


      return;

    }


    // =====================================================
    // DELETE PROFILE
    // =====================================================

    if (
      action ===
      "delete"
    ) {

      const confirmed =
        confirm(
          `Permanently delete "${selectedUser.fullName}" from User Management?\n\nThis will remove the system profile and revoke access to the Museo de Lucena system.\n\nThis action cannot be undone.`
        );


      if (!confirmed) {

        return;

      }


      button.disabled =
        true;


      try {

        await deleteDoc(
          doc(
            db,
            "users",
            selectedUser.id
          )
        );


        await logActivity(
          selectedUser.role ===
            "client"
            ? "Deleted evaluator profile"
            : "Deleted staff profile",

          `${selectedUser.fullName} - ${selectedUser.email}`
        );


        await loadUsers();


      } catch (error) {

        console.error(
          "Delete user profile error:",
          error
        );


        if (
          error.code ===
          "permission-denied"
        ) {

          alert(
            "Firestore denied the deletion. Please check the User Management security rules."
          );

        } else {

          alert(
            "Unable to delete this system profile."
          );

        }

      }


      return;

    }


    // =====================================================
    // ACTIVATE / DEACTIVATE
    // =====================================================

    if (
      action !== "activate" &&
      action !== "deactivate"
    ) {

      return;

    }


    const newStatus =
      action ===
      "activate"
        ? "active"
        : "inactive";


    const actionLabel =
      newStatus ===
      "active"
        ? "activate"
        : "deactivate";


    const confirmed =
      confirm(
        `Are you sure you want to ${actionLabel} "${selectedUser.fullName}"?`
      );


    if (!confirmed) {

      return;

    }


    button.disabled =
      true;


    try {

      await updateDoc(
        doc(
          db,
          "users",
          selectedUser.id
        ),
        {

          status:
            newStatus,

          updatedAt:
            serverTimestamp(),

          updatedBy:
            auth.currentUser.uid,

          updatedByName:
            currentProfile.fullName ||
            "Museo Administrator"

        }
      );


      await logActivity(
        newStatus ===
          "active"
          ? (
              selectedUser.role ===
                "client"
                ? "Activated evaluator account"
                : "Activated staff account"
            )
          : (
              selectedUser.role ===
                "client"
                ? "Deactivated evaluator account"
                : "Deactivated staff account"
            ),

        `${selectedUser.fullName} - ${selectedUser.email}`
      );


      await loadUsers();


    } catch (error) {

      console.error(
        "Update user status error:",
        error
      );


      alert(
        "Unable to update this account status."
      );


    } finally {

      button.disabled =
        false;

    }

  }
);


// =========================================================
// ACTIVITY LOG
// =========================================================

async function logActivity(
  action,
  description
) {

  try {

    if (
      !auth.currentUser ||
      !currentProfile
    ) {

      return;

    }


    await addDoc(
      collection(
        db,
        "activity_logs"
      ),
      {

        action,

        description,

        userId:
          auth.currentUser.uid,

        userName:
          currentProfile.fullName ||
          "Museo Administrator",

        userRole:
          currentProfile.role,

        timestamp:
          serverTimestamp()

      }
    );


  } catch (error) {

    console.error(
      "Activity log error:",
      error
    );

  }

}


// =========================================================
// FORM MESSAGE
// =========================================================

function showFormMessage(
  message,
  type = "error"
) {

  if (!userFormMessage) {

    return;

  }


  userFormMessage.textContent =
    message;


  userFormMessage.className =
    `form-message show ${type}`;

}


// =========================================================
// CLEAR FORM MESSAGE
// =========================================================

function clearFormMessage() {

  if (!userFormMessage) {

    return;

  }


  userFormMessage.textContent =
    "";


  userFormMessage.className =
    "form-message";

}


// =========================================================
// FORMAT TIMESTAMP
// =========================================================

function formatTimestamp(
  timestamp
) {

  if (!timestamp) {

    return "—";

  }


  let date =
    null;


  if (
    typeof timestamp.toDate ===
    "function"
  ) {

    date =
      timestamp.toDate();

  }

  else if (
    timestamp.seconds
  ) {

    date =
      new Date(
        timestamp.seconds *
        1000
      );

  }

  else {

    date =
      new Date(
        timestamp
      );

  }


  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  return new Intl.DateTimeFormat(
    "en-PH",
    {

      month:
        "short",

      day:
        "numeric",

      year:
        "numeric"

    }
  ).format(
    date
  );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(
  value
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(
      value ?? ""
    );


  return div.innerHTML;

}


// =========================================================
// MOBILE SIDEBAR
// =========================================================

menuButton?.addEventListener(
  "click",
  () => {

    sidebar?.classList.add(
      "open"
    );


    sidebarOverlay?.classList.add(
      "show"
    );

  }
);


sidebarOverlay?.addEventListener(
  "click",
  () => {

    sidebar?.classList.remove(
      "open"
    );


    sidebarOverlay?.classList.remove(
      "show"
    );

  }
);


// =========================================================
// LOGOUT
// =========================================================

logoutButton?.addEventListener(
  "click",
  async () => {

    const confirmed =
      confirm(
        "Are you sure you want to sign out?"
      );


    if (!confirmed) {

      return;

    }


    try {

      await signOut(
        auth
      );


      window.location.replace(
        "login.html"
      );


    } catch (error) {

      console.error(
        "Logout error:",
        error
      );


      alert(
        "Unable to sign out. Please try again."
      );

    }

  }
);


// =========================================================
// HIDE PAGE LOADER
// =========================================================

function hidePageLoader() {

  pageLoader?.classList.add(
    "hide"
  );

}


// =========================================================
// AUTH GUARD
// ADMIN ONLY
// =========================================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      window.location.replace(
        "login.html"
      );


      return;

    }


    try {

      currentProfile =
        await getUserProfile(
          user.uid
        );


      if (
        currentProfile.status !==
        "active"
      ) {

        await signOut(
          auth
        );


        window.location.replace(
          "login.html"
        );


        return;

      }


      if (
        currentProfile.role !==
        "admin"
      ) {

        alert(
          "Administrator access is required to open User Management."
        );


        window.location.replace(
          "dashboard.html"
        );


        return;

      }


      displayCurrentUser(
        currentProfile
      );


      // Show page before fetching all profiles.

      hidePageLoader();


      try {

        await loadUsers();


      } catch (error) {

        console.error(
          "User list loading failed:",
          error
        );

      }


    } catch (error) {

      console.error(
        "User Management initialization error:",
        error
      );


      try {

        await signOut(
          auth
        );

      } catch (_) {}


      window.location.replace(
        "login.html"
      );

    }

  }
);