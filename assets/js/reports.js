// =========================================================
// MUSEO DE LUCENA
// REPORTS MODULE
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
  addDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile = null;

let artifacts = [];

let categories = [];

let currentReportData = [];

let reportGenerated = false;


// =========================================================
// PAGE ELEMENTS
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


// =========================================================
// SUMMARY ELEMENTS
// =========================================================

const reportTotalArtifacts =
  document.getElementById("reportTotalArtifacts");

const reportGoodCondition =
  document.getElementById("reportGoodCondition");

const reportNeedsAttention =
  document.getElementById("reportNeedsAttention");

const reportArchived =
  document.getElementById("reportArchived");


// =========================================================
// REPORT FORM
// =========================================================

const reportType =
  document.getElementById("reportType");

const reportCategory =
  document.getElementById("reportCategory");

const reportCondition =
  document.getElementById("reportCondition");

const reportStatus =
  document.getElementById("reportStatus");

const generateReportButton =
  document.getElementById("generateReportButton");

const resetReportButton =
  document.getElementById("resetReportButton");

const printReportButton =
  document.getElementById("printReportButton");


// =========================================================
// REPORT PREVIEW
// =========================================================

const reportTitle =
  document.getElementById("reportTitle");

const reportSubtitle =
  document.getElementById("reportSubtitle");

const reportRecordCount =
  document.getElementById("reportRecordCount");

const reportTableBody =
  document.getElementById("reportTableBody");


// =========================================================
// GET USER PROFILE
// =========================================================

async function getUserProfile(uid) {

  const userReference =
    doc(
      db,
      "users",
      uid
    );


  const snapshot =
    await getDoc(
      userReference
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
// DISPLAY USER
// =========================================================

function displayUser(profile) {

  const fullName =
    profile.fullName ||
    "Museo User";


  const role =
    profile.role === "admin"
      ? "Administrator"
      : "Museum Staff";


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
      role;

  }


  if (sidebarAvatar) {

    sidebarAvatar.textContent =
      initial;

  }


  // Hide administrator-only elements from staff

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


  categories.sort(
    (a, b) =>
      String(
        a.name || ""
      ).localeCompare(
        String(
          b.name || ""
        )
      )
  );


  populateCategoryOptions();

}


// =========================================================
// POPULATE CATEGORY FILTER
// =========================================================

function populateCategoryOptions() {

  if (!reportCategory) {

    return;

  }


  reportCategory.innerHTML = `
    <option value="">
      Select category
    </option>
  `;


  categories.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        category.id;


      option.textContent =
        category.name ||
        "Unnamed Category";


      reportCategory.appendChild(
        option
      );

    }
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


  artifacts.sort(
    (a, b) =>
      getTimestampValue(
        b.createdAt
      ) -
      getTimestampValue(
        a.createdAt
      )
  );


  updateSummary();

}


// =========================================================
// UPDATE SUMMARY CARDS
// =========================================================

function updateSummary() {

  const total =
    artifacts.length;


  const good =
    artifacts.filter(
      artifact =>
        String(
          artifact.condition || ""
        )
          .trim()
          .toLowerCase() ===
        "good"
    ).length;


  const fair =
    artifacts.filter(
      artifact =>
        String(
          artifact.condition || ""
        )
          .trim()
          .toLowerCase() ===
        "fair"
    ).length;


  const poor =
    artifacts.filter(
      artifact =>
        String(
          artifact.condition || ""
        )
          .trim()
          .toLowerCase() ===
        "poor"
    ).length;


  const archived =
    artifacts.filter(
      artifact =>
        String(
          artifact.status || ""
        )
          .trim()
          .toLowerCase() ===
        "archived"
    ).length;


  if (reportTotalArtifacts) {

    reportTotalArtifacts.textContent =
      total;

  }


  if (reportGoodCondition) {

    reportGoodCondition.textContent =
      good;

  }


  if (reportNeedsAttention) {

    reportNeedsAttention.textContent =
      fair + poor;

  }


  if (reportArchived) {

    reportArchived.textContent =
      archived;

  }

}


// =========================================================
// REPORT TYPE CHANGE
// =========================================================

reportType?.addEventListener(
  "change",
  () => {

    updateReportFilters();

    resetPreviewOnly();

  }
);


// =========================================================
// ENABLE CORRECT FILTER
// =========================================================

function updateReportFilters() {

  const selectedType =
    reportType.value;


  // Disable all filters first

  reportCategory.disabled =
    true;

  reportCondition.disabled =
    true;

  reportStatus.disabled =
    true;


  // Reset values

  reportCategory.value =
    "";

  reportCondition.value =
    "";

  reportStatus.value =
    "";


  // Enable required filter

  if (
    selectedType ===
    "category"
  ) {

    reportCategory.disabled =
      false;

  }


  if (
    selectedType ===
    "condition"
  ) {

    reportCondition.disabled =
      false;

  }


  if (
    selectedType ===
    "status"
  ) {

    reportStatus.disabled =
      false;

  }

}


// =========================================================
// GENERATE REPORT
// =========================================================

generateReportButton?.addEventListener(
  "click",
  async () => {

    const selectedType =
      reportType.value;


    let filteredArtifacts =
      [...artifacts];


    let title =
      "All Artifact Records";


    let subtitle =
      "Complete list of artifact records stored in the system.";


    // =====================================================
    // BY CATEGORY
    // =====================================================

    if (
      selectedType ===
      "category"
    ) {

      const selectedCategoryId =
        reportCategory.value;


      if (!selectedCategoryId) {

        alert(
          "Please select a category."
        );

        reportCategory.focus();

        return;

      }


      const selectedCategory =
        categories.find(
          category =>
            category.id ===
            selectedCategoryId
        );


      filteredArtifacts =
        artifacts.filter(
          artifact =>
            artifact.categoryId ===
            selectedCategoryId
        );


      const categoryName =
        selectedCategory?.name ||
        "Selected Category";


      title =
        `Artifacts by Category: ${categoryName}`;


      subtitle =
        `Artifact records classified under ${categoryName}.`;

    }


    // =====================================================
    // BY CONDITION
    // =====================================================

    else if (
      selectedType ===
      "condition"
    ) {

      const selectedCondition =
        reportCondition.value;


      if (!selectedCondition) {

        alert(
          "Please select an artifact condition."
        );

        reportCondition.focus();

        return;

      }


      filteredArtifacts =
        artifacts.filter(
          artifact =>
            String(
              artifact.condition || ""
            )
              .trim()
              .toLowerCase() ===
            selectedCondition
              .toLowerCase()
        );


      title =
        `${selectedCondition} Condition Artifacts`;


      subtitle =
        `Artifact records with a condition classified as ${selectedCondition}.`;

    }


    // =====================================================
    // BY STATUS
    // =====================================================

    else if (
      selectedType ===
      "status"
    ) {

      const selectedStatus =
        reportStatus.value;


      if (!selectedStatus) {

        alert(
          "Please select a record status."
        );

        reportStatus.focus();

        return;

      }


      filteredArtifacts =
        artifacts.filter(
          artifact =>
            String(
              artifact.status ||
              "Active"
            )
              .trim()
              .toLowerCase() ===
            selectedStatus
              .toLowerCase()
        );


      title =
        `${selectedStatus} Artifact Records`;


      subtitle =
        `${selectedStatus} artifact records stored in the digital filing system.`;

    }


    // =====================================================
    // ALL ARTIFACTS
    // =====================================================

    else {

      title =
        "All Artifact Records";


      subtitle =
        "Complete list of artifact records stored in the system.";

    }


    currentReportData =
      filteredArtifacts;


    renderReport(
      filteredArtifacts,
      title,
      subtitle
    );


    reportGenerated =
      true;


    if (printReportButton) {

      printReportButton.disabled =
        false;

    }


    await logActivity(
      "Generated report",
      `${title} - ${filteredArtifacts.length} record(s)`
    );

  }
);


// =========================================================
// RENDER REPORT
// =========================================================

function renderReport(
  records,
  title,
  subtitle
) {

  if (reportTitle) {

    reportTitle.textContent =
      title;

  }


  if (reportSubtitle) {

    reportSubtitle.textContent =
      subtitle;

  }


  if (reportRecordCount) {

    reportRecordCount.textContent =
      records.length;

  }


  if (!reportTableBody) {

    return;

  }


  if (!records.length) {

    reportTableBody.innerHTML = `
      <tr>

        <td colspan="7">

          <div class="report-empty-state">

            <strong>
              No matching artifact records
            </strong>

            <p>
              No artifact records were found for
              the selected report criteria.
            </p>

          </div>

        </td>

      </tr>
    `;


    return;

  }


  reportTableBody.innerHTML =
    records
      .map(
        artifact => {

          const accession =
            escapeHTML(
              artifact.accessionNumber ||
              "—"
            );


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
            artifact.condition ||
            "Not specified";


          const status =
            artifact.status ||
            "Active";


          const dateAcquired =
            formatArtifactDate(
              artifact.dateAcquired
            );


          const location =
            escapeHTML(
              artifact.currentLocation ||
              "Not specified"
            );


          return `
            <tr>

              <td>
                ${accession}
              </td>


              <td>
                <strong>
                  ${name}
                </strong>
              </td>


              <td>
                ${category}
              </td>


              <td>

                <span
                  class="
                    report-condition
                    ${getConditionClass(
                      condition
                    )}
                  "
                >

                  ${escapeHTML(
                    condition
                  )}

                </span>

              </td>


              <td>

                <span
                  class="
                    report-status
                    ${getStatusClass(
                      status
                    )}
                  "
                >

                  ${escapeHTML(
                    status
                  )}

                </span>

              </td>


              <td>
                ${escapeHTML(
                  dateAcquired
                )}
              </td>


              <td>
                ${location}
              </td>

            </tr>
          `;

        }
      )
      .join("");

}


// =========================================================
// CONDITION CLASS
// =========================================================

function getConditionClass(
  condition
) {

  const value =
    String(
      condition || ""
    )
      .trim()
      .toLowerCase();


  if (
    value === "good"
  ) {

    return "good";

  }


  if (
    value === "fair"
  ) {

    return "fair";

  }


  if (
    value === "poor"
  ) {

    return "poor";

  }


  return "fair";

}


// =========================================================
// STATUS CLASS
// =========================================================

function getStatusClass(
  status
) {

  const value =
    String(
      status || ""
    )
      .trim()
      .toLowerCase();


  if (
    value === "archived"
  ) {

    return "archived";

  }


  return "active";

}


// =========================================================
// FORMAT ARTIFACT DATE
// =========================================================

function formatArtifactDate(
  value
) {

  if (!value) {

    return "—";

  }


  // HTML date input format:
  // YYYY-MM-DD

  const parts =
    String(value)
      .split("-");


  if (
    parts.length === 3
  ) {

    const year =
      Number(parts[0]);

    const month =
      Number(parts[1]) - 1;

    const day =
      Number(parts[2]);


    const date =
      new Date(
        year,
        month,
        day
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      return new Intl.DateTimeFormat(
        "en-PH",
        {
          month: "short",
          day: "numeric",
          year: "numeric"
        }
      ).format(
        date
      );

    }

  }


  return String(value);

}


// =========================================================
// RESET REPORT
// =========================================================

resetReportButton?.addEventListener(
  "click",
  () => {

    reportType.value =
      "all";


    reportCategory.value =
      "";

    reportCondition.value =
      "";

    reportStatus.value =
      "";


    updateReportFilters();

    resetPreviewOnly();

  }
);


// =========================================================
// RESET PREVIEW
// =========================================================

function resetPreviewOnly() {

  currentReportData =
    [];


  reportGenerated =
    false;


  if (reportTitle) {

    reportTitle.textContent =
      "All Artifact Records";

  }


  if (reportSubtitle) {

    reportSubtitle.textContent =
      "Generate a report to display artifact records.";

  }


  if (reportRecordCount) {

    reportRecordCount.textContent =
      "0";

  }


  if (printReportButton) {

    printReportButton.disabled =
      true;

  }


  if (reportTableBody) {

    reportTableBody.innerHTML = `
      <tr>

        <td colspan="7">

          <div class="report-empty-state">

            <strong>
              No report generated
            </strong>

            <p>
              Select a report type and click
              Generate Report.
            </p>

          </div>

        </td>

      </tr>
    `;

  }

}


// =========================================================
// PRINT REPORT
// =========================================================

printReportButton?.addEventListener(
  "click",
  () => {

    if (!reportGenerated) {

      alert(
        "Please generate a report before printing."
      );

      return;

    }


    window.print();

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
          "Museo User",

        userRole:
          currentProfile.role,

        timestamp:
          serverTimestamp()
      }
    );


  } catch (error) {

    // Report generation should still work
    // even if activity logging fails.

    console.error(
      "Activity log error:",
      error
    );

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


  if (
    value.seconds
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
    String(value);


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

  if (!pageLoader) {

    return;

  }


  pageLoader.classList.add(
    "hide"
  );

}


// =========================================================
// AUTHENTICATION GUARD
// =========================================================

onAuthStateChanged(
  auth,
  async user => {

    // NOT LOGGED IN
    if (!user) {

      window.location.replace(
        "login.html"
      );

      return;

    }


    try {

      // ===================================================
      // GET USER PROFILE
      // ===================================================

      currentProfile =
        await getUserProfile(
          user.uid
        );


      // ===================================================
      // CHECK ACCOUNT STATUS
      // ===================================================

      if (
        currentProfile.status !==
        "active"
      ) {

        await signOut(auth);

        window.location.replace(
          "login.html"
        );

        return;

      }


      // ===================================================
      // CHECK ROLE
      // ===================================================

      if (
        !["admin", "staff"].includes(
          currentProfile.role
        )
      ) {

        await signOut(auth);

        window.location.replace(
          "login.html"
        );

        return;

      }


      // ===================================================
      // DISPLAY USER
      // ===================================================

      displayUser(
        currentProfile
      );


      // ===================================================
      // SHOW PAGE IMMEDIATELY
      // ===================================================

      hidePageLoader();


      // Initial report controls
      updateReportFilters();

      resetPreviewOnly();


      // ===================================================
      // LOAD FIRESTORE DATA IN BACKGROUND
      // ===================================================

      const results =
        await Promise.allSettled([
          loadCategories(),
          loadArtifacts()
        ]);


      // CATEGORY ERROR
      if (
        results[0].status ===
        "rejected"
      ) {

        console.error(
          "Unable to load categories:",
          results[0].reason
        );

      }


      // ARTIFACT ERROR
      if (
        results[1].status ===
        "rejected"
      ) {

        console.error(
          "Unable to load artifacts:",
          results[1].reason
        );

      }


    } catch (error) {

      console.error(
        "Reports module initialization error:",
        error
      );


      try {

        await signOut(auth);

      } catch (_) {}


      window.location.replace(
        "login.html"
      );

    }

  }
);