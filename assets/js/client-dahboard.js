// =========================================================
// MUSEO DE LUCENA
// CLIENT DASHBOARD
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
// GLOBAL DATA
// =========================================================

let currentProfile = null;

let artifacts = [];

let categories = [];


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
// DISPLAY CLIENT PROFILE
// =========================================================

function displayClientProfile(
  profile
) {

  const name =
    profile.fullName ||
    profile.name ||
    "Client";


  const firstName =
    name
      .trim()
      .split(/\s+/)[0] ||
    "Client";


  const initial =
    name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "C";


  if (clientSidebarName) {

    clientSidebarName.textContent =
      name;

  }


  if (clientSidebarRole) {

    clientSidebarRole.textContent =
      "Client";

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
    await getDocs(
      collection(
        db,
        "categories"
      )
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
    await getDocs(
      collection(
        db,
        "artifacts"
      )
    );


  artifacts =
    snapshot.docs.map(
      item => ({
        id: item.id,
        ...item.data()
      })
    );


  // Client only sees ACTIVE artifact records.

  artifacts =
    artifacts.filter(
      artifact =>
        String(
          artifact.status ||
          "Active"
        )
          .trim()
          .toLowerCase() ===
        "active"
    );


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
// UPDATE DASHBOARD STATISTICS
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
// GET ARTIFACT IMAGE
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


  clientRecentArtifacts.innerHTML =
    recent.map(
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
            artifact.name ||
            artifact.artifactName ||
            "A"
          )
            .trim()
            .charAt(0)
            .toUpperCase();


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
                  artifact.name ||
                  artifact.artifactName ||
                  "Artifact"
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

  await Promise.all([
    loadCategories(),
    loadArtifacts()
  ]);


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
          ${escapeHTML(message)}
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


// Close sidebar after selecting a navigation link
// on mobile.

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
        "Client logout error:",
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
      // ACCOUNT STATUS
      // ===================================================

      if (
        status !== "active"
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
      // ADMIN / STAFF SHOULD USE ADMIN DASHBOARD
      // ===================================================

      if (
        role === "admin" ||
        role === "staff"
      ) {

        window.location.replace(
          "dashboard.html"
        );


        return;

      }


      // ===================================================
      // CLIENT ONLY
      // ===================================================

      if (
        role !== "client"
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
      // DISPLAY CLIENT
      // ===================================================

      displayClientProfile(
        currentProfile
      );


      // ===================================================
      // LOAD COLLECTION
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
            "Your client account does not yet have permission to view artifact records."
          );

        } else {

          showLoadError(
            "Please check your connection and refresh the page."
          );

        }

      }


      // ===================================================
      // HIDE LOADER
      // ===================================================

      if (pageLoader) {

        pageLoader.classList.add(
          "hide"
        );

      }


    } catch (error) {

      console.error(
        "Client dashboard initialization error:",
        error
      );


      if (pageLoader) {

        pageLoader.classList.add(
          "hide"
        );

      }


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