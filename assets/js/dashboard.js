// =========================================================
// MUSEO DE LUCENA
// DASHBOARD CONTROLLER
// assets/js/dashboard.js
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
// OPTIONAL: EMAIL VERIFICATION GUARD
// Tanggalin ang "//" sa unahan ng dalawang linya (dito at sa
// AUTH GUARD sa ibaba) kapag nagawa mo na ang email-guard.js
// =========================================================

// import { requireVerifiedEmail } from "./email-guard.js";


// =========================================================
// ELEMENTS
// =========================================================

const pageLoader =
  document.getElementById("pageLoader");

const sidebar =
  document.getElementById("sidebar");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");

const menuButton =
  document.getElementById("menuButton");

const logoutButton =
  document.getElementById("logoutButton");


// =========================================================
// USER ELEMENTS
// =========================================================

const sidebarUserName =
  document.getElementById("sidebarUserName");

const sidebarUserRole =
  document.getElementById("sidebarUserRole");

const sidebarAvatar =
  document.getElementById("sidebarAvatar");


const topbarUserName =
  document.getElementById("topbarUserName");

const topbarUserRole =
  document.getElementById("topbarUserRole");

const topbarAvatar =
  document.getElementById("topbarAvatar");


const welcomeName =
  document.getElementById("welcomeName");


// =========================================================
// DASHBOARD NUMBERS
// =========================================================

const totalArtifactsElement =
  document.getElementById("totalArtifacts");

const totalCategoriesElement =
  document.getElementById("totalCategories");

const goodConditionElement =
  document.getElementById("goodCondition");

const needsAttentionElement =
  document.getElementById("needsAttention");


// =========================================================
// CONDITION ELEMENTS
// =========================================================

const conditionGoodCount =
  document.getElementById("conditionGoodCount");

const conditionFairCount =
  document.getElementById("conditionFairCount");

const conditionPoorCount =
  document.getElementById("conditionPoorCount");


const conditionGoodBar =
  document.getElementById("conditionGoodBar");

const conditionFairBar =
  document.getElementById("conditionFairBar");

const conditionPoorBar =
  document.getElementById("conditionPoorBar");


// =========================================================
// LISTS
// =========================================================

const recentArtifacts =
  document.getElementById("recentArtifacts");

const activityList =
  document.getElementById("activityList");


// =========================================================
// ADDED: STATS CACHE (INSTANT NUMBERS)
// =========================================================
// Ipinapakita agad ang huling alam na numero pagbukas ng
// dashboard, habang kinukuha pa ang bago sa Firestore.
// Napapalitan ito ng totoong bilang pagdating ng data.
// =========================================================

const STATS_CACHE_KEY =
  "museo_dashboard_stats_v1";


function readStatsCache() {

  try {

    return JSON.parse(
      localStorage.getItem(
        STATS_CACHE_KEY
      ) || "null"
    );

  } catch (_) {

    return null;

  }

}


function updateStatsCache(partial) {

  try {

    const current =
      readStatsCache() || {};


    localStorage.setItem(
      STATS_CACHE_KEY,
      JSON.stringify({
        ...current,
        ...partial
      })
    );

  } catch (_) {}

}


function setNumber(element, value) {

  if (
    element &&
    value !== undefined &&
    value !== null
  ) {

    element.textContent =
      value;

  }

}


function applyStats(stats) {

  if (!stats) {

    return;

  }


  setNumber(
    totalArtifactsElement,
    stats.total
  );

  setNumber(
    totalCategoriesElement,
    stats.categories
  );

  setNumber(
    goodConditionElement,
    stats.good
  );

  if (
    stats.fair !== undefined &&
    stats.poor !== undefined
  ) {

    setNumber(
      needsAttentionElement,
      stats.fair + stats.poor
    );

  }

  setNumber(
    conditionGoodCount,
    stats.good
  );

  setNumber(
    conditionFairCount,
    stats.fair
  );

  setNumber(
    conditionPoorCount,
    stats.poor
  );


  const good =
    stats.good || 0;

  const fair =
    stats.fair || 0;

  const poor =
    stats.poor || 0;

  const total =
    good + fair + poor;


  const percent =
    value =>
      total
        ? `${(value / total) * 100}%`
        : "0%";


  if (conditionGoodBar) {

    conditionGoodBar.style.width =
      percent(good);

  }

  if (conditionFairBar) {

    conditionFairBar.style.width =
      percent(fair);

  }

  if (conditionPoorBar) {

    conditionPoorBar.style.width =
      percent(poor);

  }

}


// Ipakita agad ang cached numbers pagbukas ng page.

applyStats(
  readStatsCache()
);


// =========================================================
// ADDED: WALANG LOADING SCREEN
// =========================================================
// Ipinapakita agad ang dashboard pagbukas ng page.
// Ang pangalan at role ay galing sa huling login (cache),
// at kinukumpirma pa rin ito ng auth guard sa ibaba.
// Kung hindi valid ang account, ire-redirect pa rin sa login.
// =========================================================

const PROFILE_CACHE_KEY =
  "museo_dashboard_profile_v1";


function readProfileCache() {

  try {

    return JSON.parse(
      localStorage.getItem(
        PROFILE_CACHE_KEY
      ) || "null"
    );

  } catch (_) {

    return null;

  }

}


function saveProfileCache(profile) {

  try {

    localStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({
        fullName: profile.fullName,
        role: profile.role
      })
    );

  } catch (_) {}

}


function clearProfileCache() {

  try {

    localStorage.removeItem(
      PROFILE_CACHE_KEY
    );

  } catch (_) {}

}


const cachedProfile =
  readProfileCache();


if (cachedProfile) {

  displayUser(
    cachedProfile
  );

}


hidePageLoader();


// =========================================================
// CURRENT DATE
// =========================================================

const currentDate =
  document.getElementById("currentDate");


if (currentDate) {

  currentDate.textContent =
    new Intl.DateTimeFormat(
      "en-PH",
      {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric"
      }
    ).format(
      new Date()
    );

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
  closeSidebar
);


function closeSidebar() {

  sidebar?.classList.remove(
    "open"
  );

  sidebarOverlay?.classList.remove(
    "show"
  );

}


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
// FORMAT ROLE
// =========================================================

function formatRole(role) {

  if (role === "admin") {

    return "Administrator";

  }


  if (role === "staff") {

    return "Museum Staff";

  }


  return role || "Museo User";

}


// =========================================================
// DISPLAY USER
// =========================================================

function displayUser(profile) {

  const fullName =
    profile.fullName ||
    "Museo User";


  const role =
    formatRole(
      profile.role
    );


  const initial =
    fullName
      .trim()
      .charAt(0)
      .toUpperCase();


  // =======================================================
  // SIDEBAR
  // =======================================================

  if (sidebarUserName) {

    sidebarUserName.textContent =
      fullName;

  }


  if (sidebarUserRole) {

    sidebarUserRole.textContent =
      role;

  }


  if (sidebarAvatar) {

    sidebarAvatar.textContent =
      initial;

  }


  // =======================================================
  // TOPBAR
  // =======================================================

  if (topbarUserName) {

    topbarUserName.textContent =
      fullName;

  }


  if (topbarUserRole) {

    topbarUserRole.textContent =
      role;

  }


  if (topbarAvatar) {

    topbarAvatar.textContent =
      initial;

  }


  // =======================================================
  // WELCOME
  // =======================================================

  if (welcomeName) {

    const firstName =
      fullName
        .trim()
        .split(/\s+/)[0];


    welcomeName.textContent =
      firstName ||
      "User";

  }


  // =======================================================
  // STAFF: HIDE ADMIN-ONLY ITEMS
  // =======================================================

  if (
    profile.role !== "admin"
  ) {

    document
      .querySelectorAll(
        ".admin-only"
      )
      .forEach(
        element => {

          element.classList.add(
            "hidden"
          );

        }
      );

  }

}


// =========================================================
// LOAD ARTIFACTS
// =========================================================

async function loadArtifacts() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "artifacts"
        )
      );


    const artifacts =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    // =====================================================
    // TOTAL ARTIFACTS
    // =====================================================

    if (totalArtifactsElement) {

      totalArtifactsElement.textContent =
        artifacts.length;

    }


    // =====================================================
    // CONDITION COUNTS
    // =====================================================

    let good = 0;
    let fair = 0;
    let poor = 0;


    artifacts.forEach(
      artifact => {

        const condition =
          String(
            artifact.condition ||
            ""
          )
            .trim()
            .toLowerCase();


        if (
          condition ===
          "good"
        ) {

          good++;

        }

        else if (
          condition ===
          "fair"
        ) {

          fair++;

        }

        else if (
          condition ===
          "poor"
        ) {

          poor++;

        }

      }
    );


    // ADDED: i-save ang numero para instant na sa susunod na bukas
    updateStatsCache({
      total: artifacts.length,
      good,
      fair,
      poor
    });


    if (goodConditionElement) {

      goodConditionElement.textContent =
        good;

    }


    if (needsAttentionElement) {

      needsAttentionElement.textContent =
        fair + poor;

    }


    if (conditionGoodCount) {

      conditionGoodCount.textContent =
        good;

    }


    if (conditionFairCount) {

      conditionFairCount.textContent =
        fair;

    }


    if (conditionPoorCount) {

      conditionPoorCount.textContent =
        poor;

    }


    // =====================================================
    // CONDITION BARS
    // =====================================================

    const totalCondition =
      good +
      fair +
      poor;


    if (conditionGoodBar) {

      conditionGoodBar.style.width =
        totalCondition
          ? `${
              (
                good /
                totalCondition
              ) *
              100
            }%`
          : "0%";

    }


    if (conditionFairBar) {

      conditionFairBar.style.width =
        totalCondition
          ? `${
              (
                fair /
                totalCondition
              ) *
              100
            }%`
          : "0%";

    }


    if (conditionPoorBar) {

      conditionPoorBar.style.width =
        totalCondition
          ? `${
              (
                poor /
                totalCondition
              ) *
              100
            }%`
          : "0%";

    }


    // =====================================================
    // RECENT ARTIFACTS
    // =====================================================

    displayRecentArtifacts(
      artifacts
    );


  } catch (error) {

    console.error(
      "Error loading artifacts:",
      error
    );


    if (recentArtifacts) {

      recentArtifacts.innerHTML = `
        <div class="empty-state">

          <strong>
            Unable to load artifacts
          </strong>

          <p>
            Please check the Firestore connection.
          </p>

        </div>
      `;

    }

  }

}


// =========================================================
// RECENT ARTIFACTS
// =========================================================

function displayRecentArtifacts(
  artifacts
) {

  if (!recentArtifacts) {

    return;

  }


  // =======================================================
  // EMPTY
  // =======================================================

  if (!artifacts.length) {

    recentArtifacts.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">

          <svg viewBox="0 0 24 24">

            <path
              d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"
            />

          </svg>

        </div>

        <strong>
          No artifact records yet
        </strong>

        <p>
          Added artifacts will appear here.
        </p>

      </div>
    `;


    return;

  }


  // =======================================================
  // NEWEST FIRST
  // =======================================================

  const sortedArtifacts =
    [...artifacts].sort(
      (a, b) =>
        getTimestampValue(
          b.createdAt
        ) -
        getTimestampValue(
          a.createdAt
        )
    );


  const latest =
    sortedArtifacts.slice(
      0,
      5
    );


  // =======================================================
  // RENDER
  // =======================================================

  recentArtifacts.innerHTML =
    latest
      .map(
        artifact => {

          const name =
            escapeHTML(
              artifact.name ||
              artifact.artifactName ||
              "Untitled Artifact"
            );


          const category =
            escapeHTML(
              artifact.category ||
              artifact.categoryName ||
              "Uncategorized"
            );


          const condition =
            escapeHTML(
              artifact.condition ||
              "Not specified"
            );


          const image =
            artifact.imageUrl ||
            artifact.imageURL ||
            "";


          const rawName =
            artifact.name ||
            artifact.artifactName ||
            "A";


          const firstLetter =
            rawName
              .charAt(0)
              .toUpperCase();


          return `
            <div class="artifact-row">

              <div class="artifact-thumb">

                ${
                  image
                    ? `
                      <img
                        src="${escapeAttribute(
                          image
                        )}"
                        alt="${name}"
                      >
                    `
                    : escapeHTML(
                        firstLetter
                      )
                }

              </div>


              <div class="artifact-info">

                <strong>
                  ${name}
                </strong>

                <span>
                  ${category}
                </span>

              </div>


              <span class="artifact-condition">
                ${condition}
              </span>

            </div>
          `;

        }
      )
      .join("");

}


// =========================================================
// LOAD CATEGORIES
// =========================================================

async function loadCategories() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "categories"
        )
      );


    if (totalCategoriesElement) {

      totalCategoriesElement.textContent =
        snapshot.size;

    }


    // ADDED: i-save ang numero para instant na sa susunod na bukas
    updateStatsCache({
      categories: snapshot.size
    });


  } catch (error) {

    console.error(
      "Error loading categories:",
      error
    );


    if (totalCategoriesElement) {

      totalCategoriesElement.textContent =
        "0";

    }

  }

}


// =========================================================
// LOAD ACTIVITY PREVIEW
// ADMIN ONLY
// =========================================================

async function loadActivities(
  profile
) {

  if (
    profile.role !== "admin"
  ) {

    return;

  }


  if (!activityList) {

    return;

  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "activity_logs"
        )
      );


    const activities =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    if (!activities.length) {

      activityList.innerHTML = `
        <div class="empty-state compact">

          <strong>
            No recent activity
          </strong>

          <p>
            System activities will appear here.
          </p>

        </div>
      `;


      return;

    }


    const latest =
      [...activities]
        .sort(
          (a, b) =>
            getTimestampValue(
              b.timestamp ||
              b.createdAt
            ) -
            getTimestampValue(
              a.timestamp ||
              a.createdAt
            )
        )
        .slice(
          0,
          5
        );


    activityList.innerHTML =
      latest
        .map(
          activity => {

            const action =
              escapeHTML(
                activity.action ||
                "System activity"
              );


            const description =
              escapeHTML(
                activity.description ||
                activity.userName ||
                "Museo de Lucena"
              );


            return `
              <div class="activity-row">

                <div class="activity-dot">
                </div>

                <div class="activity-info">

                  <strong>
                    ${action}
                  </strong>

                  <span>
                    ${description}
                  </span>

                </div>

              </div>
            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "Activity logs error:",
      error
    );


    activityList.innerHTML = `
      <div class="empty-state compact">

        <strong>
          Unable to load activity
        </strong>

        <p>
          Please check the Firestore connection.
        </p>

      </div>
    `;

  }

}


// =========================================================
// TIMESTAMP HELPER
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


  if (value.seconds) {

    return (
      value.seconds *
      1000
    );

  }


  const converted =
    new Date(
      value
    ).getTime();


  return Number.isNaN(
    converted
  )
    ? 0
    : converted;

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(value);


  return div.innerHTML;

}


// =========================================================
// ESCAPE ATTRIBUTE
// =========================================================

function escapeAttribute(value) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    );

}


// =========================================================
// =========================================================
// NAVIGATION
// =========================================================
// IMPORTANT:
//
// Sidebar navigation uses the normal <a href=""> links
// from dashboard.html.
//
// WE DO NOT USE preventDefault() on sidebar links anymore.
//
// This avoids navigation conflicts.
// =========================================================
// =========================================================


// =========================================================
// QUICK ACTION:
// ADD ARTIFACT
// =========================================================

const addArtifactButton =
  document.getElementById(
    "addArtifactButton"
  );


addArtifactButton?.addEventListener(
  "click",
  () => {

    window.location.href =
      "artifacts.html";

  }
);


// =========================================================
// QUICK ACTION:
// VIEW ALL ARTIFACTS
// =========================================================

const viewArtifactsButton =
  document.getElementById(
    "viewArtifactsButton"
  );


viewArtifactsButton?.addEventListener(
  "click",
  () => {

    window.location.href =
      "artifacts.html";

  }
);


// =========================================================
// QUICK ACTION:
// ADD ARTIFACT
// =========================================================

const quickAddArtifact =
  document.getElementById(
    "quickAddArtifact"
  );


quickAddArtifact?.addEventListener(
  "click",
  () => {

    window.location.href =
      "artifacts.html";

  }
);


// =========================================================
// QUICK ACTION:
// SEARCH ARTIFACTS
// =========================================================

const quickSearch =
  document.getElementById(
    "quickSearch"
  );


quickSearch?.addEventListener(
  "click",
  () => {

    window.location.href =
      "artifacts.html";

  }
);


// =========================================================
// QUICK ACTION:
// REPORTS
// =========================================================

const quickReports =
  document.getElementById(
    "quickReports"
  );


quickReports?.addEventListener(
  "click",
  () => {

    window.location.href =
      "reports.html";

  }
);


// =========================================================
// QUICK ACTION:
// USER MANAGEMENT
// =========================================================

const quickUsers =
  document.getElementById(
    "quickUsers"
  );


quickUsers?.addEventListener(
  "click",
  () => {

    window.location.href =
      "users.html";

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


    clearProfileCache();


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

  if (!pageLoader) {

    return;

  }


  pageLoader.classList.add(
    "hide"
  );

}


// =========================================================
// AUTH GUARD
// =========================================================

onAuthStateChanged(
  auth,
  async user => {

    // =====================================================
    // NOT LOGGED IN
    // =====================================================

    if (!user) {

      clearProfileCache();


      window.location.replace(
        "login.html"
      );


      return;

    }


    // =====================================================
    // OPTIONAL: EMAIL VERIFICATION CHECK
    // Tanggalin ang "//" kapag nagawa mo na ang email-guard.js
    // =====================================================

    // if (!(await requireVerifiedEmail(auth, user))) return;


    // =====================================================
    // ADDED: SIMULAN AGAD ANG PAGKUHA NG DATA
    // Hindi na hinihintay ang profile; sabay na itong tumatakbo.
    // (Ang loadArtifacts at loadCategories ay may sariling
    // error handling kaya hindi sila magka-crash.)
    // =====================================================

    const artifactsPromise =
      loadArtifacts();

    const categoriesPromise =
      loadCategories();


    try {

      // ===================================================
      // GET USER PROFILE
      // ===================================================

      const profile =
        await getUserProfile(
          user.uid
        );


      // ===================================================
      // ACTIVE ACCOUNT REQUIRED
      // ===================================================

      if (
        profile.status !==
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
      // VALID ROLE REQUIRED
      // ===================================================

      if (
        ![
          "admin",
          "staff"
        ].includes(
          profile.role
        )
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
      // DISPLAY USER
      // ===================================================

      saveProfileCache(
        profile
      );


      displayUser(
        profile
      );


      // ===================================================
      // SHOW DASHBOARD IMMEDIATELY
      // ===================================================

      hidePageLoader();


      // ===================================================
      // LOAD DASHBOARD DATA
      // (artifacts at categories ay nasimulan na sa taas)
      // ===================================================

      const results =
        await Promise.allSettled([
          artifactsPromise,
          categoriesPromise,
          loadActivities(
            profile
          )
        ]);


      results.forEach(
        result => {

          if (
            result.status ===
            "rejected"
          ) {

            console.error(
              "Dashboard data loading error:",
              result.reason
            );

          }

        }
      );


    } catch (error) {

      console.error(
        "Dashboard initialization error:",
        error
      );


      clearProfileCache();


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