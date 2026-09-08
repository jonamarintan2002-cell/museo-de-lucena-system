// =========================================================
// MUSEO DE LUCENA
// CLIENT / EVALUATOR DASHBOARD
// assets/js/client-dashboard.js
// =========================================================

import {
  auth,
  db
} from "./firebase-config.js";


import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


import {
  collection,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// SETTINGS
// =========================================================

const FIREBASE_TIMEOUT = 10000;

const LOADER_SAFETY_TIMEOUT = 12000;


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile = null;

let artifacts = [];

let categories = [];

let pageFinishedLoading = false;


// =========================================================
// ELEMENTS
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


const clientLogoutButton =
  document.getElementById(
    "clientLogoutButton"
  );


// =========================================================
// PROFILE ELEMENTS
// =========================================================

const clientSidebarAvatar =
  document.getElementById(
    "clientSidebarAvatar"
  );


const clientSidebarName =
  document.getElementById(
    "clientSidebarName"
  );


const clientSidebarRole =
  document.getElementById(
    "clientSidebarRole"
  );


const clientTopbarAvatar =
  document.getElementById(
    "clientTopbarAvatar"
  );


const clientTopbarName =
  document.getElementById(
    "clientTopbarName"
  );


const clientWelcomeName =
  document.getElementById(
    "clientWelcomeName"
  );


// =========================================================
// STATISTICS
// =========================================================

const clientTotalArtifacts =
  document.getElementById(
    "clientTotalArtifacts"
  );


const clientTotalCategories =
  document.getElementById(
    "clientTotalCategories"
  );


const clientGoodCondition =
  document.getElementById(
    "clientGoodCondition"
  );


// =========================================================
// RECENT ARTIFACTS
// =========================================================

const clientRecentArtifacts =
  document.getElementById(
    "clientRecentArtifacts"
  );


// =========================================================
// TIMEOUT HELPER
// =========================================================

function withTimeout(
  promise,
  milliseconds = FIREBASE_TIMEOUT,
  label = "Firebase request"
) {

  return Promise.race([

    promise,

    new Promise(
      (_, reject) => {

        setTimeout(
          () => {

            reject(
              new Error(
                `TIMEOUT_${label}`
              )
            );

          },
          milliseconds
        );

      }
    )

  ]);

}


// =========================================================
// HIDE PAGE LOADER
// =========================================================

function hidePageLoader() {

  if (
    pageFinishedLoading
  ) {

    return;

  }


  pageFinishedLoading =
    true;


  if (!pageLoader) {

    return;

  }


  pageLoader.classList.add(
    "hide"
  );


  // Extra fallback in case the CSS transition
  // does not fully remove the loader.

  setTimeout(
    () => {

      if (pageLoader) {

        pageLoader.style.display =
          "none";

      }

    },
    550
  );

}


// =========================================================
// LOADER SAFETY FALLBACK
// =========================================================
//
// Even when a Firebase request hangs,
// the loader will not remain forever.
// =========================================================

const loaderSafetyTimer =
  setTimeout(
    () => {

      if (
        pageFinishedLoading
      ) {

        return;

      }


      console.warn(
        "Client dashboard loading exceeded the safety timeout."
      );


      hidePageLoader();


      showLoadError(
        "The portal took too long to load. Please check your connection and refresh the page."
      );

    },
    LOADER_SAFETY_TIMEOUT
  );


// =========================================================
// GET USER PROFILE
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
    await withTimeout(
      getDoc(
        reference
      ),
      FIREBASE_TIMEOUT,
      "USER_PROFILE"
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
// NORMALIZE ROLE
// =========================================================

function normalizeRole(
  role
) {

  return String(
    role || ""
  )
    .trim()
    .toLowerCase();

}


// =========================================================
// NORMALIZE STATUS
// =========================================================

function normalizeStatus(
  status
) {

  return String(
    status || ""
  )
    .trim()
    .toLowerCase();

}


// =========================================================
// DISPLAY CLIENT / EVALUATOR PROFILE
// =========================================================

function displayClientProfile(
  profile
) {

  const name =
    profile.fullName ||
    profile.name ||
    "Evaluator";


  const firstName =
    name
      .trim()
      .split(/\s+/)[0] ||
    "Evaluator";


  const initial =
    name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "E";


  if (clientSidebarName) {

    clientSidebarName.textContent =
      name;

  }


  if (clientSidebarRole) {

    clientSidebarRole.textContent =
      "Evaluator";

  }


  if (clientSidebarAvatar) {

    clientSidebarAvatar.textContent =
      initial;

  }


  if (clientTopbarName) {

    clientTopbarName.textContent =
      name;

  }


  if (clientTopbarAvatar) {

    clientTopbarAvatar.textContent =
      initial;

  }


  if (clientWelcomeName) {

    clientWelcomeName.textContent =
      firstName;

  }

}


// =========================================================
// LOAD CATEGORIES
// =========================================================

async function loadCategories() {

  const snapshot =
    await withTimeout(

      getDocs(
        collection(
          db,
          "categories"
        )
      ),

      FIREBASE_TIMEOUT,

      "CATEGORIES"

    );


  categories =
    snapshot.docs.map(
      item => ({
        id: item.id,
        ...item.data()
      })
    );

}


// =========================================================
// LOAD ARTIFACTS
// =========================================================

async function loadArtifacts() {

  const snapshot =
    await withTimeout(

      getDocs(
        collection(
          db,
          "artifacts"
        )
      ),

      FIREBASE_TIMEOUT,

      "ARTIFACTS"

    );


  artifacts =
    snapshot.docs.map(
      item => ({
        id: item.id,
        ...item.data()
      })
    );


  // =======================================================
  // EVALUATORS ONLY SEE ACTIVE ARTIFACTS
  // =======================================================

  artifacts =
    artifacts.filter(
      artifact =>
        normalizeStatus(
          artifact.status ||
          "Active"
        ) ===
        "active"
    );


  // =======================================================
  // NEWEST FIRST
  // =======================================================

  artifacts.sort(
    (a, b) =>
      getTimestampValue(
        b.createdAt
      ) -
      getTimestampValue(
        a.createdAt
      )
  );

}


// =========================================================
// UPDATE STATISTICS
// =========================================================

function updateStatistics() {

  const totalArtifacts =
    artifacts.length;


  const totalCategories =
    categories.length;


  const goodCondition =
    artifacts.filter(
      artifact =>
        String(
          artifact.condition ||
          ""
        )
          .trim()
          .toLowerCase() ===
        "good"
    ).length;


  if (clientTotalArtifacts) {

    clientTotalArtifacts.textContent =
      totalArtifacts;

  }


  if (clientTotalCategories) {

    clientTotalCategories.textContent =
      totalCategories;

  }


  if (clientGoodCondition) {

    clientGoodCondition.textContent =
      goodCondition;

  }

}


// =========================================================
// GET ARTIFACT IMAGE SOURCE
// =========================================================

function getArtifactImageSource(
  artifact
) {

  return (
    artifact.imageData ||
    artifact.imageUrl ||
    ""
  );

}


// =========================================================
// RENDER RECENT ARTIFACTS
// =========================================================

function renderRecentArtifacts() {

  if (!clientRecentArtifacts) {

    return;

  }


  const recent =
    artifacts.slice(
      0,
      5
    );


  // =======================================================
  // EMPTY COLLECTION
  // =======================================================

  if (!recent.length) {

    clientRecentArtifacts.innerHTML = `
      <div class="client-empty-state">

        <div class="empty-symbol">
          M
        </div>

        <strong>
          No artifact records available
        </strong>

        <p>
          Active artifact records will appear here.
        </p>

      </div>
    `;


    return;

  }


  // =======================================================
  // ARTIFACT LIST
  // =======================================================

  clientRecentArtifacts.innerHTML =
    recent
      .map(
        artifact => {

          const artifactName =
            artifact.name ||
            artifact.artifactName ||
            "Untitled Artifact";


          const name =
            escapeHTML(
              artifactName
            );


          const category =
            escapeHTML(
              artifact.category ||
              artifact.categoryName ||
              "Uncategorized"
            );


          const accession =
            escapeHTML(
              artifact.accessionNumber ||
              "No accession number"
            );


          const condition =
            escapeHTML(
              artifact.condition ||
              "Not specified"
            );


          const firstLetter =
            String(
              artifactName
            )
              .trim()
              .charAt(0)
              .toUpperCase() ||
            "A";


          const imageSource =
            getArtifactImageSource(
              artifact
            );


          const thumbnail =
            imageSource
              ? `
                <img
                  src="${escapeAttribute(
                    imageSource
                  )}"
                  alt="${escapeAttribute(
                    artifactName
                  )}"
                  loading="lazy"
                >
              `
              : escapeHTML(
                  firstLetter
                );


          return `
            <div class="client-artifact-row">

              <div class="client-artifact-thumb">
                ${thumbnail}
              </div>


              <div class="client-artifact-info">

                <strong>
                  ${name}
                </strong>

                <span>
                  ${accession} · ${category}
                </span>

              </div>


              <span class="client-artifact-badge">
                ${condition}
              </span>

            </div>
          `;

        }
      )
      .join("");

}


// =========================================================
// LOAD DASHBOARD DATA
// =========================================================

async function loadDashboardData() {

  // Use Promise.allSettled so one failed request
  // does not freeze the entire dashboard.

  const results =
    await Promise.allSettled([
      loadCategories(),
      loadArtifacts()
    ]);


  const categoryResult =
    results[0];


  const artifactResult =
    results[1];


  // =======================================================
  // CATEGORY ERROR
  // =======================================================

  if (
    categoryResult.status ===
    "rejected"
  ) {

    console.error(
      "Category loading failed:",
      categoryResult.reason
    );


    categories =
      [];

  }


  // =======================================================
  // ARTIFACT ERROR
  // =======================================================

  if (
    artifactResult.status ===
    "rejected"
  ) {

    console.error(
      "Artifact loading failed:",
      artifactResult.reason
    );


    artifacts =
      [];


    throw artifactResult.reason;

  }


  updateStatistics();


  renderRecentArtifacts();

}


// =========================================================
// SHOW LOAD ERROR
// =========================================================

function showLoadError(
  message
) {

  if (clientRecentArtifacts) {

    clientRecentArtifacts.innerHTML = `
      <div class="client-empty-state">

        <div class="empty-symbol">
          !
        </div>

        <strong>
          Unable to load collection
        </strong>

        <p>
          ${escapeHTML(
            message
          )}
        </p>

      </div>
    `;

  }


  if (clientTotalArtifacts) {

    clientTotalArtifacts.textContent =
      "—";

  }


  if (clientTotalCategories) {

    clientTotalCategories.textContent =
      "—";

  }


  if (clientGoodCondition) {

    clientGoodCondition.textContent =
      "—";

  }

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
    typeof value.seconds ===
    "number"
  ) {

    return (
      value.seconds *
      1000
    );

  }


  return 0;

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
// ESCAPE ATTRIBUTE
// =========================================================

function escapeAttribute(
  value
) {

  return String(
    value ?? ""
  )
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
// SIDEBAR
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
// MOBILE SIDEBAR
// =========================================================

document
  .querySelectorAll(
    ".sidebar-nav .nav-item"
  )
  .forEach(
    link => {

      link.addEventListener(
        "click",
        () => {

          if (
            window.innerWidth <=
            900
          ) {

            sidebar?.classList.remove(
              "open"
            );


            sidebarOverlay?.classList.remove(
              "show"
            );

          }

        }
      );

    }
  );


// =========================================================
// LOGOUT
// =========================================================

clientLogoutButton?.addEventListener(
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
        "Evaluator logout error:",
        error
      );


      alert(
        "Unable to sign out. Please try again."
      );

    }

  }
);


// =========================================================
// AUTH GUARD
// =========================================================

let authCallbackStarted =
  false;


onAuthStateChanged(
  auth,
  async user => {

    // Prevent accidental duplicate initialization.

    if (
      authCallbackStarted
    ) {

      return;

    }


    authCallbackStarted =
      true;


    // =====================================================
    // NO AUTHENTICATED USER
    // =====================================================

    if (!user) {

      clearTimeout(
        loaderSafetyTimer
      );


      hidePageLoader();


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


      const role =
        normalizeRole(
          currentProfile.role
        );


      const status =
        normalizeStatus(
          currentProfile.status
        );


      // ===================================================
      // INACTIVE ACCOUNT
      // ===================================================

      if (
        status !==
        "active"
      ) {

        await signOut(
          auth
        );


        clearTimeout(
          loaderSafetyTimer
        );


        hidePageLoader();


        window.location.replace(
          "login.html"
        );


        return;

      }


      // ===================================================
      // ADMIN / STAFF
      // ===================================================

      if (
        role === "admin" ||
        role === "staff"
      ) {

        clearTimeout(
          loaderSafetyTimer
        );


        hidePageLoader();


        window.location.replace(
          "dashboard.html"
        );


        return;

      }


      // ===================================================
      // CLIENT / EVALUATOR ONLY
      // ===================================================

      if (
        role !== "client"
      ) {

        await signOut(
          auth
        );


        clearTimeout(
          loaderSafetyTimer
        );


        hidePageLoader();


        window.location.replace(
          "login.html"
        );


        return;

      }


      // ===================================================
      // DISPLAY PROFILE
      // ===================================================

      displayClientProfile(
        currentProfile
      );


      // ===================================================
      // LOAD DASHBOARD
      // ===================================================

      try {

        await loadDashboardData();


      } catch (error) {

        console.error(
          "Client dashboard data error:",
          error
        );


        if (
          error.code ===
          "permission-denied"
        ) {

          showLoadError(
            "Your evaluator account does not have permission to view artifact records."
          );

        }

        else if (
          String(
            error.message || ""
          ).startsWith(
            "TIMEOUT_"
          )
        ) {

          showLoadError(
            "The museum collection took too long to load. Please refresh the page or check your internet connection."
          );

        }

        else {

          showLoadError(
            "Unable to load the museum collection. Please refresh the page."
          );

        }

      }

    } catch (error) {

      console.error(
        "Client dashboard initialization error:",
        error
      );


      if (
        error.message ===
        "PROFILE_NOT_FOUND"
      ) {

        showLoadError(
          "No evaluator profile was found for this account."
        );

      }

      else if (
        error.code ===
        "permission-denied"
      ) {

        showLoadError(
          "Firestore denied access to your evaluator profile."
        );

      }

      else if (
        String(
          error.message || ""
        ).startsWith(
          "TIMEOUT_"
        )
      ) {

        showLoadError(
          "Firebase took too long to respond. Please check your internet connection and refresh the page."
        );

      }

      else {

        showLoadError(
          "Unable to initialize the evaluator portal."
        );

      }

    } finally {

      // ===================================================
      // GUARANTEED LOADER CLEANUP
      // ===================================================

      clearTimeout(
        loaderSafetyTimer
      );


      hidePageLoader();

    }

  }
);