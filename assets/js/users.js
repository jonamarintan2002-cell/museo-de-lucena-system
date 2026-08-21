// =========================================================
// MUSEO DE LUCENA
// USER MANAGEMENT
// assets/js/users.js
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
// Secondary Firebase app is used when creating staff
// accounts so the current Administrator stays signed in.
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
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// SECONDARY AUTH INSTANCE
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
// USER DISPLAY
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
// USER TABLE
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
// GET CURRENT USER PROFILE
// =========================================================

async function getUserProfile(uid) {

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

        const roleA =
          String(
            a.role || ""
          );


        const roleB =
          String(
            b.role || ""
          );


        // Administrators first

        if (
          roleA !== roleB
        ) {

          if (
            roleA === "admin"
          ) {

            return -1;

          }


          if (
            roleB === "admin"
          ) {

            return 1;

          }

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
// LOADING STATE
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
            Retrieving authorized system profiles.
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
// FILTER USERS
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

      userSearch.value =
        "";

    }


    if (roleFilter) {

      roleFilter.value =
        "";

    }


    if (userStatusFilter) {

      userStatusFilter.value =
        "";

    }


    applyFilters();

  }
);


// =========================================================
// RENDER USERS
// =========================================================

function renderUsers(list) {

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


          const role =
            user.role ===
            "admin"
              ? "Administrator"
              : "Museum Staff";


          const roleClass =
            user.role ===
            "admin"
              ? "admin"
              : "staff";


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


          let actions =
            "";


          // Only Staff accounts can be enabled/disabled
          // from this page.

          if (
            user.role === "staff"
          ) {

            if (
              user.status ===
              "inactive"
            ) {

              actions = `
                <button
                  type="button"
                  class="user-action activate"
                  data-action="activate"
                  data-id="${user.id}"
                >
                  Activate
                </button>
              `;

            }

            else {

              actions = `
                <button
                  type="button"
                  class="user-action deactivate"
                  data-action="deactivate"
                  data-id="${user.id}"
                >
                  Deactivate
                </button>
              `;

            }

          }

          else {

            actions = `
              <span>
                —
              </span>
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
                        user.id ===
                        auth.currentUser?.uid
                          ? "Current account"
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
                    ${roleClass}
                  "
                >
                  ${role}
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
// OPEN ADD STAFF MODAL
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
// CLOSE USER MODAL
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
// ESC KEY
// =========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
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


    // =====================================================
    // ADMIN ONLY
    // =====================================================

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


    // =====================================================
    // FORM VALUES
    // =====================================================

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


    // =====================================================
    // VALIDATION
    // =====================================================

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
      password.length < 8
    ) {

      showFormMessage(
        "Temporary password must contain at least 8 characters.",
        "error"
      );

      userPassword.focus();

      return;

    }


    // =====================================================
    // CHECK EMAIL IN FIRESTORE
    // =====================================================

    const duplicate =
      users.find(
        user =>
          String(
            user.email || ""
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


    let createdAuthUser =
      null;


    try {

      // ===================================================
      // CREATE AUTH USER USING SECONDARY AUTH
      //
      // IMPORTANT:
      // This does NOT replace the current Administrator
      // session because secondaryAuth is a separate
      // Firebase Auth instance.
      // ===================================================

      const credential =
        await createUserWithEmailAndPassword(
          secondaryAuth,
          email,
          password
        );


      createdAuthUser =
        credential.user;


      const newUid =
        credential.user.uid;


      // ===================================================
      // CREATE FIRESTORE PROFILE
      // ===================================================

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


      // ===================================================
      // SIGN OUT SECONDARY ACCOUNT ONLY
      // ===================================================

      try {

        await signOut(
          secondaryAuth
        );

      } catch (_) {}


      // ===================================================
      // ACTIVITY LOG
      // ===================================================

      await logActivity(
        "Created staff account",
        `${fullName} - ${email}`
      );


      // ===================================================
      // SUCCESS MESSAGE
      // ===================================================

      showFormMessage(
        "Staff account created successfully.",
        "success"
      );


      // Refresh table

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


      // Always try to clear secondary auth

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
            "Firestore denied the user profile creation. Please check your security rules.";

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
// ACTIVATE / DEACTIVATE USER
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


    // Only Staff profiles may be changed here.

    if (
      selectedUser.role !==
      "staff"
    ) {

      alert(
        "Administrator accounts cannot be changed from this page."
      );

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
        newStatus === "active"
          ? "Activated staff account"
          : "Deactivated staff account",
        `${selectedUser.fullName} - ${selectedUser.email}`
      );


      await loadUsers();


    } catch (error) {

      console.error(
        "Update user status error:",
        error
      );


      alert(
        "Unable to update the staff account status."
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
// CLEAR MESSAGE
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
      value
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

    // =====================================================
    // NO LOGIN
    // =====================================================

    if (!user) {

      window.location.replace(
        "login.html"
      );


      return;

    }


    try {

      // ===================================================
      // GET PROFILE
      // ===================================================

      currentProfile =
        await getUserProfile(
          user.uid
        );


      // ===================================================
      // ACTIVE ACCOUNT REQUIRED
      // ===================================================

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


      // ===================================================
      // ADMIN ROLE REQUIRED
      // ===================================================

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


      // ===================================================
      // SHOW CURRENT ADMIN
      // ===================================================

      displayCurrentUser(
        currentProfile
      );


      // ===================================================
      // SHOW PAGE IMMEDIATELY
      //
      // We do not wait for the users collection before
      // removing the full-screen loader.
      // ===================================================

      hidePageLoader();


      // ===================================================
      // LOAD USERS
      // ===================================================

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