// =========================================================
// MUSEO DE LUCENA
// ACTIVITY LOGS MODULE
// assets/js/activity.js
// =========================================================


// =========================================================
// FIREBASE CONFIG
// =========================================================

import {
  auth,
  db
} from "./firebase-config.js";


// =========================================================
// FIREBASE AUTH
// =========================================================

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


// =========================================================
// FIRESTORE
// =========================================================

import {
  collection,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile = null;

let activities = [];


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

const refreshLogs =
  document.getElementById(
    "refreshLogs"
  );


// =========================================================
// CURRENT USER ELEMENTS
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
// SUMMARY ELEMENTS
// =========================================================

const totalActivityCount =
  document.getElementById(
    "totalActivityCount"
  );

const todayActivityCount =
  document.getElementById(
    "todayActivityCount"
  );

const adminActivityCount =
  document.getElementById(
    "adminActivityCount"
  );

const staffActivityCount =
  document.getElementById(
    "staffActivityCount"
  );


// =========================================================
// FILTER ELEMENTS
// =========================================================

const activitySearch =
  document.getElementById(
    "activitySearch"
  );

const activityRoleFilter =
  document.getElementById(
    "activityRoleFilter"
  );

const activityActionFilter =
  document.getElementById(
    "activityActionFilter"
  );

const activityDateFilter =
  document.getElementById(
    "activityDateFilter"
  );

const resetActivityFilters =
  document.getElementById(
    "resetActivityFilters"
  );


// =========================================================
// TABLE ELEMENTS
// =========================================================

const activityTableBody =
  document.getElementById(
    "activityTableBody"
  );

const activityResultCount =
  document.getElementById(
    "activityResultCount"
  );


// =========================================================
// GET USER PROFILE
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

function displayCurrentUser(profile) {

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
// LOAD ACTIVITY LOGS
// =========================================================

async function loadActivities() {

  showActivityLoading();


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "activity_logs"
        )
      );


    activities =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    // =====================================================
    // NEWEST FIRST
    // =====================================================

    activities.sort(
      (a, b) =>
        getTimestampValue(
          b.timestamp ||
          b.createdAt
        ) -
        getTimestampValue(
          a.timestamp ||
          a.createdAt
        )
    );


    updateSummary();

    applyFilters();


  } catch (error) {

    console.error(
      "Load activity logs error:",
      error
    );


    if (activityTableBody) {

      activityTableBody.innerHTML = `
        <tr>

          <td colspan="5">

            <div class="activity-empty-state">

              <strong>
                Unable to load activity logs
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


    if (activityResultCount) {

      activityResultCount.textContent =
        "0 activities";

    }


    throw error;

  }

}


// =========================================================
// LOADING STATE
// =========================================================

function showActivityLoading() {

  if (!activityTableBody) {

    return;

  }


  activityTableBody.innerHTML = `
    <tr>

      <td colspan="5">

        <div class="activity-empty-state">

          <strong>
            Loading activity logs...
          </strong>

          <p>
            Retrieving recorded system activities.
          </p>

        </div>

      </td>

    </tr>
  `;

}


// =========================================================
// UPDATE SUMMARY
// =========================================================

function updateSummary() {

  const total =
    activities.length;


  const today =
    activities.filter(
      activity =>
        isToday(
          activity.timestamp ||
          activity.createdAt
        )
    ).length;


  const admin =
    activities.filter(
      activity =>
        String(
          activity.userRole || ""
        )
          .trim()
          .toLowerCase() ===
        "admin"
    ).length;


  const staff =
    activities.filter(
      activity =>
        String(
          activity.userRole || ""
        )
          .trim()
          .toLowerCase() ===
        "staff"
    ).length;


  if (totalActivityCount) {

    totalActivityCount.textContent =
      total;

  }


  if (todayActivityCount) {

    todayActivityCount.textContent =
      today;

  }


  if (adminActivityCount) {

    adminActivityCount.textContent =
      admin;

  }


  if (staffActivityCount) {

    staffActivityCount.textContent =
      staff;

  }

}


// =========================================================
// FILTER EVENTS
// =========================================================

activitySearch?.addEventListener(
  "input",
  applyFilters
);


activityRoleFilter?.addEventListener(
  "change",
  applyFilters
);


activityActionFilter?.addEventListener(
  "change",
  applyFilters
);


activityDateFilter?.addEventListener(
  "change",
  applyFilters
);


// =========================================================
// RESET FILTERS
// =========================================================

resetActivityFilters?.addEventListener(
  "click",
  () => {

    if (activitySearch) {

      activitySearch.value =
        "";

    }


    if (activityRoleFilter) {

      activityRoleFilter.value =
        "";

    }


    if (activityActionFilter) {

      activityActionFilter.value =
        "";

    }


    if (activityDateFilter) {

      activityDateFilter.value =
        "";

    }


    applyFilters();

  }
);


// =========================================================
// APPLY FILTERS
// =========================================================

function applyFilters() {

  const keyword =
    activitySearch
      ? activitySearch.value
          .trim()
          .toLowerCase()
      : "";


  const selectedRole =
    activityRoleFilter
      ? activityRoleFilter.value
      : "";


  const selectedAction =
    activityActionFilter
      ? activityActionFilter.value
      : "";


  const selectedDate =
    activityDateFilter
      ? activityDateFilter.value
      : "";


  const filtered =
    activities.filter(
      activity => {

        // =================================================
        // SEARCH
        // =================================================

        const searchableText =
          [
            activity.action,
            activity.description,
            activity.userName,
            activity.userRole
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
          searchableText.includes(
            keyword
          );


        // =================================================
        // ROLE
        // =================================================

        const role =
          String(
            activity.userRole || ""
          )
            .trim()
            .toLowerCase();


        const matchesRole =
          !selectedRole ||
          role ===
            selectedRole;


        // =================================================
        // ACTION TYPE
        // =================================================

        const actionCategory =
          getActionCategory(
            activity
          );


        const matchesAction =
          !selectedAction ||
          actionCategory ===
            selectedAction;


        // =================================================
        // DATE
        // =================================================

        const timestamp =
          activity.timestamp ||
          activity.createdAt;


        const matchesDate =
          matchesDateFilter(
            timestamp,
            selectedDate
          );


        return (
          matchesSearch &&
          matchesRole &&
          matchesAction &&
          matchesDate
        );

      }
    );


  renderActivities(
    filtered
  );

}


// =========================================================
// ACTION CATEGORY
// =========================================================

function getActionCategory(
  activity
) {

  const text =
    [
      activity.action,
      activity.description
    ]
      .map(
        value =>
          String(
            value || ""
          )
            .trim()
            .toLowerCase()
      )
      .join(" ");


  if (
    text.includes(
      "artifact"
    )
  ) {

    return "artifact";

  }


  if (
    text.includes(
      "categor"
    )
  ) {

    return "category";

  }


  if (
    text.includes(
      "staff"
    ) ||
    text.includes(
      "user"
    ) ||
    text.includes(
      "account"
    )
  ) {

    return "user";

  }


  if (
    text.includes(
      "report"
    )
  ) {

    return "report";

  }


  return "other";

}


// =========================================================
// DATE FILTER MATCHING
// =========================================================

function matchesDateFilter(
  timestamp,
  filter
) {

  if (!filter) {

    return true;

  }


  const date =
    timestampToDate(
      timestamp
    );


  if (!date) {

    return false;

  }


  const now =
    new Date();


  // =======================================================
  // TODAY
  // =======================================================

  if (
    filter ===
    "today"
  ) {

    return (
      date.getFullYear() ===
        now.getFullYear() &&
      date.getMonth() ===
        now.getMonth() &&
      date.getDate() ===
        now.getDate()
    );

  }


  // =======================================================
  // LAST 7 DAYS
  // =======================================================

  if (
    filter ===
    "7days"
  ) {

    const start =
      new Date();


    start.setHours(
      0,
      0,
      0,
      0
    );


    start.setDate(
      start.getDate() -
      6
    );


    return (
      date >= start &&
      date <= now
    );

  }


  // =======================================================
  // LAST 30 DAYS
  // =======================================================

  if (
    filter ===
    "30days"
  ) {

    const start =
      new Date();


    start.setHours(
      0,
      0,
      0,
      0
    );


    start.setDate(
      start.getDate() -
      29
    );


    return (
      date >= start &&
      date <= now
    );

  }


  return true;

}


// =========================================================
// CHECK IF TODAY
// =========================================================

function isToday(
  timestamp
) {

  const date =
    timestampToDate(
      timestamp
    );


  if (!date) {

    return false;

  }


  const today =
    new Date();


  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  );

}


// =========================================================
// RENDER ACTIVITIES
// =========================================================

function renderActivities(
  list
) {

  if (!activityTableBody) {

    return;

  }


  if (activityResultCount) {

    activityResultCount.textContent =
      `${list.length} ${
        list.length === 1
          ? "activity"
          : "activities"
      }`;

  }


  if (!list.length) {

    activityTableBody.innerHTML = `
      <tr>

        <td colspan="5">

          <div class="activity-empty-state">

            <strong>
              No activity logs found
            </strong>

            <p>
              No recorded activities match the
              current filters.
            </p>

          </div>

        </td>

      </tr>
    `;


    return;

  }


  activityTableBody.innerHTML =
    list
      .map(
        activity => {

          // =================================================
          // USER
          // =================================================

          const userName =
            escapeHTML(
              activity.userName ||
              "Unknown User"
            );


          const userId =
            escapeHTML(
              activity.userId ||
              "—"
            );


          const initial =
            String(
              activity.userName ||
              "U"
            )
              .trim()
              .charAt(0)
              .toUpperCase();


          // =================================================
          // ROLE
          // =================================================

          const rawRole =
            String(
              activity.userRole ||
              ""
            )
              .trim()
              .toLowerCase();


          const roleLabel =
            rawRole ===
            "admin"
              ? "Administrator"
              : rawRole ===
                "staff"
                ? "Museum Staff"
                : "System User";


          const roleClass =
            rawRole ===
            "admin"
              ? "admin"
              : "staff";


          // =================================================
          // ACTION
          // =================================================

          const action =
            escapeHTML(
              activity.action ||
              "System Activity"
            );


          // =================================================
          // DESCRIPTION
          // =================================================

          const description =
            escapeHTML(
              activity.description ||
              "No description provided."
            );


          // =================================================
          // DATE
          // =================================================

          const dateInfo =
            formatActivityDate(
              activity.timestamp ||
              activity.createdAt
            );


          return `
            <tr>

              <!-- DATE & TIME -->

              <td>

                <div class="activity-date">

                  ${escapeHTML(
                    dateInfo.date
                  )}

                  <small>

                    ${escapeHTML(
                      dateInfo.time
                    )}

                  </small>

                </div>

              </td>


              <!-- USER -->

              <td>

                <div class="activity-user">

                  <div
                    class="activity-user-avatar"
                  >
                    ${escapeHTML(
                      initial
                    )}
                  </div>


                  <div
                    class="activity-user-info"
                  >

                    <strong>
                      ${userName}
                    </strong>

                    <span>
                      ${userId}
                    </span>

                  </div>

                </div>

              </td>


              <!-- ROLE -->

              <td>

                <span
                  class="
                    activity-role
                    ${roleClass}
                  "
                >
                  ${roleLabel}
                </span>

              </td>


              <!-- ACTION -->

              <td>

                <span
                  class="activity-action"
                >
                  ${action}
                </span>

              </td>


              <!-- DESCRIPTION -->

              <td>

                <div
                  class="activity-description"
                >
                  ${description}
                </div>

              </td>

            </tr>
          `;

        }
      )
      .join("");

}


// =========================================================
// FORMAT ACTIVITY DATE
// =========================================================

function formatActivityDate(
  timestamp
) {

  const date =
    timestampToDate(
      timestamp
    );


  if (!date) {

    return {
      date: "—",
      time: "—"
    };

  }


  const dateText =
    new Intl.DateTimeFormat(
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


  const timeText =
    new Intl.DateTimeFormat(
      "en-PH",
      {
        hour:
          "numeric",

        minute:
          "2-digit",

        second:
          "2-digit"
      }
    ).format(
      date
    );


  return {
    date:
      dateText,

    time:
      timeText
  };

}


// =========================================================
// TIMESTAMP TO DATE
// =========================================================

function timestampToDate(
  value
) {

  if (!value) {

    return null;

  }


  // Firebase Timestamp

  if (
    typeof value.toDate ===
    "function"
  ) {

    return value.toDate();

  }


  // Firebase timestamp-like object

  if (
    value.seconds
  ) {

    return new Date(
      value.seconds *
      1000
    );

  }


  // JS Date / string / number fallback

  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date;

}


// =========================================================
// TIMESTAMP VALUE
// =========================================================

function getTimestampValue(
  value
) {

  if (!value) {

    return 0;

  }


  if (
    typeof value.toMillis ===
    "function"
  ) {

    return value.toMillis();

  }


  if (
    value.seconds
  ) {

    return (
      value.seconds *
      1000
    );

  }


  const date =
    new Date(
      value
    ).getTime();


  return Number.isNaN(
    date
  )
    ? 0
    : date;

}


// =========================================================
// REFRESH LOGS
// =========================================================

refreshLogs?.addEventListener(
  "click",
  async () => {

    refreshLogs.disabled =
      true;


    const originalText =
      refreshLogs.textContent;


    refreshLogs.textContent =
      "Refreshing...";


    try {

      await loadActivities();


    } catch (error) {

      console.error(
        "Refresh activity logs error:",
        error
      );


    } finally {

      refreshLogs.disabled =
        false;


      refreshLogs.textContent =
        originalText;

    }

  }
);


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
// AUTHENTICATION GUARD
// ADMIN ONLY
// =========================================================

onAuthStateChanged(
  auth,
  async user => {

    // =====================================================
    // NOT LOGGED IN
    // =====================================================

    if (!user) {

      window.location.replace(
        "login.html"
      );


      return;

    }


    try {

      // ===================================================
      // GET CURRENT USER PROFILE
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
      // ADMINISTRATOR ONLY
      // ===================================================

      if (
        currentProfile.role !==
        "admin"
      ) {

        window.location.replace(
          "dashboard.html"
        );


        return;

      }


      // ===================================================
      // DISPLAY ADMIN
      // ===================================================

      displayCurrentUser(
        currentProfile
      );


      // ===================================================
      // SHOW PAGE IMMEDIATELY
      // ===================================================

      hidePageLoader();


      // ===================================================
      // LOAD ACTIVITY LOGS
      // ===================================================

      try {

        await loadActivities();


      } catch (error) {

        console.error(
          "Activity log loading failed:",
          error
        );

      }


    } catch (error) {

      console.error(
        "Activity Logs initialization error:",
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