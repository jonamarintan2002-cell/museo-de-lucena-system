// =========================================================
// MUSEO DE LUCENA
// ARTIFACT EVALUATIONS MANAGEMENT
// assets/js/evaluations.js
// ADMIN ONLY
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
// SETTINGS
// =========================================================

const REQUEST_TIMEOUT =
  10000;


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile =
  null;


let evaluations =
  [];


// =========================================================
// SIDEBAR ELEMENTS
// =========================================================

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
// CURRENT ADMIN ELEMENTS
// =========================================================

const sidebarAvatar =
  document.getElementById(
    "sidebarAvatar"
  );


const sidebarUserName =
  document.getElementById(
    "sidebarUserName"
  );


const sidebarUserRole =
  document.getElementById(
    "sidebarUserRole"
  );


// =========================================================
// SUMMARY ELEMENTS
// =========================================================

const totalEvaluationCount =
  document.getElementById(
    "totalEvaluationCount"
  );


const averageEvaluationRating =
  document.getElementById(
    "averageEvaluationRating"
  );


const fiveStarEvaluationCount =
  document.getElementById(
    "fiveStarEvaluationCount"
  );


const uniqueEvaluatorCount =
  document.getElementById(
    "uniqueEvaluatorCount"
  );


// =========================================================
// FILTER ELEMENTS
// =========================================================

const evaluationSearch =
  document.getElementById(
    "evaluationSearch"
  );


const ratingFilter =
  document.getElementById(
    "ratingFilter"
  );


const evaluationCategoryFilter =
  document.getElementById(
    "evaluationCategoryFilter"
  );


const resetEvaluationFilters =
  document.getElementById(
    "resetEvaluationFilters"
  );


// =========================================================
// TABLE ELEMENTS
// =========================================================

const evaluationTableBody =
  document.getElementById(
    "evaluationTableBody"
  );


const evaluationResultCount =
  document.getElementById(
    "evaluationResultCount"
  );


// =========================================================
// REFRESH
// =========================================================

const refreshEvaluationsButton =
  document.getElementById(
    "refreshEvaluationsButton"
  );


// =========================================================
// MODAL
// =========================================================

const evaluationModal =
  document.getElementById(
    "evaluationModal"
  );


const closeEvaluationModal =
  document.getElementById(
    "closeEvaluationModal"
  );


const modalEvaluationArtifact =
  document.getElementById(
    "modalEvaluationArtifact"
  );


const modalEvaluatorName =
  document.getElementById(
    "modalEvaluatorName"
  );


const modalEvaluatorEmail =
  document.getElementById(
    "modalEvaluatorEmail"
  );


const modalEvaluationCategory =
  document.getElementById(
    "modalEvaluationCategory"
  );


const modalEvaluationRating =
  document.getElementById(
    "modalEvaluationRating"
  );


const modalEvaluationComment =
  document.getElementById(
    "modalEvaluationComment"
  );


const modalEvaluationDate =
  document.getElementById(
    "modalEvaluationDate"
  );


// =========================================================
// TIMEOUT HELPER
// =========================================================

function withTimeout(
  promise,
  milliseconds = REQUEST_TIMEOUT
) {

  return Promise.race([

    promise,

    new Promise(
      (_, reject) => {

        setTimeout(
          () => {

            reject(
              new Error(
                "REQUEST_TIMEOUT"
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
// GET CURRENT USER PROFILE
// =========================================================

async function getUserProfile(
  uid
) {

  const snapshot =
    await withTimeout(

      getDoc(
        doc(
          db,
          "users",
          uid
        )
      )

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

  const name =
    profile.fullName ||
    "Museo Administrator";


  const initial =
    name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "M";


  if (sidebarUserName) {

    sidebarUserName.textContent =
      name;

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
// LOAD EVALUATIONS
// =========================================================

async function loadEvaluations() {

  showEvaluationLoading();


  try {

    const snapshot =
      await withTimeout(

        getDocs(
          collection(
            db,
            "artifact_evaluations"
          )
        )

      );


    evaluations =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    // =====================================================
    // NEWEST FIRST
    // =====================================================

    evaluations.sort(
      (a, b) =>
        getTimestampValue(
          b.updatedAt ||
          b.createdAt
        ) -
        getTimestampValue(
          a.updatedAt ||
          a.createdAt
        )
    );


    populateCategoryFilter();


    updateSummary();


    applyFilters();


  } catch (error) {

    console.error(
      "Load evaluations error:",
      error
    );


    showLoadError(
      error
    );


    throw error;

  }

}


// =========================================================
// SHOW LOADING
// =========================================================

function showEvaluationLoading() {

  if (!evaluationTableBody) {

    return;

  }


  evaluationTableBody.innerHTML = `
    <tr>

      <td colspan="6">

        <div class="evaluation-empty-state">

          <strong>
            Loading evaluations...
          </strong>

          <p>
            Retrieving evaluator ratings and feedback.
          </p>

        </div>

      </td>

    </tr>
  `;

}


// =========================================================
// LOAD ERROR
// =========================================================

function showLoadError(
  error
) {

  if (!evaluationTableBody) {

    return;

  }


  let message =
    "Unable to retrieve submitted evaluations.";


  if (
    error?.code ===
    "permission-denied"
  ) {

    message =
      "Firestore denied access to the evaluation records.";

  }


  if (
    error?.message ===
    "REQUEST_TIMEOUT"
  ) {

    message =
      "Evaluation records took too long to load. Please click Refresh.";

  }


  evaluationTableBody.innerHTML = `
    <tr>

      <td colspan="6">

        <div class="evaluation-empty-state">

          <strong>
            Unable to load evaluations
          </strong>

          <p>
            ${escapeHTML(
              message
            )}
          </p>

        </div>

      </td>

    </tr>
  `;


  if (evaluationResultCount) {

    evaluationResultCount.textContent =
      "—";

  }

}


// =========================================================
// POPULATE CATEGORY FILTER
// =========================================================

function populateCategoryFilter() {

  if (!evaluationCategoryFilter) {

    return;

  }


  const previousValue =
    evaluationCategoryFilter.value;


  const categories =
    [
      ...new Set(
        evaluations
          .map(
            evaluation =>
              String(
                evaluation.categoryName ||
                ""
              ).trim()
          )
          .filter(Boolean)
      )
    ].sort(
      (a, b) =>
        a.localeCompare(
          b
        )
    );


  evaluationCategoryFilter.innerHTML = `
    <option value="">
      All Categories
    </option>
  `;


  categories.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        category;


      option.textContent =
        category;


      evaluationCategoryFilter.appendChild(
        option
      );

    }
  );


  if (
    categories.includes(
      previousValue
    )
  ) {

    evaluationCategoryFilter.value =
      previousValue;

  }

}


// =========================================================
// UPDATE SUMMARY
// =========================================================

function updateSummary() {

  const total =
    evaluations.length;


  const validRatings =
    evaluations
      .map(
        evaluation =>
          Number(
            evaluation.rating ||
            0
          )
      )
      .filter(
        rating =>
          rating >= 1 &&
          rating <= 5
      );


  const ratingTotal =
    validRatings.reduce(
      (sum, rating) =>
        sum + rating,
      0
    );


  const average =
    validRatings.length
      ? (
          ratingTotal /
          validRatings.length
        )
      : 0;


  const fiveStars =
    evaluations.filter(
      evaluation =>
        Number(
          evaluation.rating
        ) === 5
    ).length;


  const evaluators =
    new Set(
      evaluations
        .map(
          evaluation =>
            evaluation.evaluatorId
        )
        .filter(Boolean)
    ).size;


  if (totalEvaluationCount) {

    totalEvaluationCount.textContent =
      total;

  }


  if (averageEvaluationRating) {

    averageEvaluationRating.textContent =
      average.toFixed(
        1
      );

  }


  if (fiveStarEvaluationCount) {

    fiveStarEvaluationCount.textContent =
      fiveStars;

  }


  if (uniqueEvaluatorCount) {

    uniqueEvaluatorCount.textContent =
      evaluators;

  }

}


// =========================================================
// APPLY FILTERS
// =========================================================

function applyFilters() {

  const keyword =
    evaluationSearch
      ? evaluationSearch.value
          .trim()
          .toLowerCase()
      : "";


  const selectedRating =
    ratingFilter
      ? ratingFilter.value
      : "";


  const selectedCategory =
    evaluationCategoryFilter
      ? evaluationCategoryFilter.value
      : "";


  const filtered =
    evaluations.filter(
      evaluation => {

        const searchable =
          [
            evaluation.artifactName,
            evaluation.accessionNumber,
            evaluation.evaluatorName,
            evaluation.evaluatorEmail,
            evaluation.categoryName,
            evaluation.comment
          ]
            .map(
              value =>
                String(
                  value || ""
                )
                  .toLowerCase()
            )
            .join(" ");


        const matchesSearch =
          !keyword ||
          searchable.includes(
            keyword
          );


        const matchesRating =
          !selectedRating ||
          Number(
            evaluation.rating
          ) ===
          Number(
            selectedRating
          );


        const matchesCategory =
          !selectedCategory ||
          evaluation.categoryName ===
            selectedCategory;


        return (
          matchesSearch &&
          matchesRating &&
          matchesCategory
        );

      }
    );


  renderEvaluations(
    filtered
  );

}


// =========================================================
// FILTER EVENTS
// =========================================================

evaluationSearch?.addEventListener(
  "input",
  applyFilters
);


ratingFilter?.addEventListener(
  "change",
  applyFilters
);


evaluationCategoryFilter?.addEventListener(
  "change",
  applyFilters
);


resetEvaluationFilters?.addEventListener(
  "click",
  () => {

    if (evaluationSearch) {

      evaluationSearch.value =
        "";

    }


    if (ratingFilter) {

      ratingFilter.value =
        "";

    }


    if (evaluationCategoryFilter) {

      evaluationCategoryFilter.value =
        "";

    }


    applyFilters();

  }
);


// =========================================================
// RENDER TABLE
// =========================================================

function renderEvaluations(
  list
) {

  if (!evaluationTableBody) {

    return;

  }


  if (evaluationResultCount) {

    evaluationResultCount.textContent =
      `${list.length} ${
        list.length === 1
          ? "evaluation"
          : "evaluations"
      }`;

  }


  if (!list.length) {

    evaluationTableBody.innerHTML = `
      <tr>

        <td colspan="6">

          <div class="evaluation-empty-state">

            <strong>
              No evaluations found
            </strong>

            <p>
              Submitted evaluator feedback will
              appear here.
            </p>

          </div>

        </td>

      </tr>
    `;


    return;

  }


  evaluationTableBody.innerHTML =
    list
      .map(
        evaluation => {

          const artifactName =
            escapeHTML(
              evaluation.artifactName ||
              "Untitled Artifact"
            );


          const accession =
            escapeHTML(
              evaluation.accessionNumber ||
              "No accession number"
            );


          const evaluatorName =
            escapeHTML(
              evaluation.evaluatorName ||
              "Unknown Evaluator"
            );


          const evaluatorEmail =
            escapeHTML(
              evaluation.evaluatorEmail ||
              "No email"
            );


          const rating =
            normalizeRating(
              evaluation.rating
            );


          const comment =
            evaluation.comment
              ? escapeHTML(
                  evaluation.comment
                )
              : "No written feedback";


          const date =
            formatTimestamp(
              evaluation.updatedAt ||
              evaluation.createdAt
            );


          return `
            <tr>


              <!-- ARTIFACT -->

              <td>

                <div class="evaluation-artifact-cell">

                  <strong>
                    ${artifactName}
                  </strong>

                  <span>
                    ${accession}
                  </span>

                </div>

              </td>


              <!-- EVALUATOR -->

              <td>

                <div class="evaluation-user-cell">

                  <strong>
                    ${evaluatorName}
                  </strong>

                  <span>
                    ${evaluatorEmail}
                  </span>

                </div>

              </td>


              <!-- RATING -->

              <td>

                <div class="evaluation-rating">

                  ${getStarCharacters(
                    rating
                  )}

                  <small>
                    ${rating}/5
                  </small>

                </div>

              </td>


              <!-- FEEDBACK -->

              <td>

                <div class="evaluation-comment-preview">
                  ${comment}
                </div>

              </td>


              <!-- DATE -->

              <td>
                ${escapeHTML(
                  date
                )}
              </td>


              <!-- ACTION -->

              <td>

                <button
                  type="button"
                  class="view-evaluation-button"
                  data-evaluation-id="${escapeAttribute(
                    evaluation.id
                  )}"
                >
                  View
                </button>

              </td>

            </tr>
          `;

        }
      )
      .join("");

}


// =========================================================
// TABLE ACTION
// =========================================================

evaluationTableBody?.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".view-evaluation-button"
      );


    if (!button) {

      return;

    }


    const id =
      button.dataset.evaluationId;


    const evaluation =
      evaluations.find(
        item =>
          item.id === id
      );


    if (!evaluation) {

      return;

    }


    openEvaluationModal(
      evaluation
    );

  }
);


// =========================================================
// OPEN MODAL
// =========================================================

function openEvaluationModal(
  evaluation
) {

  if (modalEvaluationArtifact) {

    modalEvaluationArtifact.textContent =
      evaluation.artifactName ||
      "Untitled Artifact";

  }


  setText(
    modalEvaluatorName,
    evaluation.evaluatorName
  );


  setText(
    modalEvaluatorEmail,
    evaluation.evaluatorEmail
  );


  setText(
    modalEvaluationCategory,
    evaluation.categoryName
  );


  const rating =
    normalizeRating(
      evaluation.rating
    );


  if (modalEvaluationRating) {

    modalEvaluationRating.textContent =
      `${getStarCharacters(
        rating
      )} ${rating} / 5`;

  }


  if (modalEvaluationComment) {

    modalEvaluationComment.textContent =
      String(
        evaluation.comment ||
        ""
      ).trim() ||
      "No written feedback was provided.";

  }


  if (modalEvaluationDate) {

    modalEvaluationDate.textContent =
      formatTimestamp(
        evaluation.updatedAt ||
        evaluation.createdAt,
        true
      );

  }


  evaluationModal?.classList.add(
    "show"
  );


  document.body.style.overflow =
    "hidden";

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeModal() {

  evaluationModal?.classList.remove(
    "show"
  );


  document.body.style.overflow =
    "";

}


closeEvaluationModal?.addEventListener(
  "click",
  closeModal
);


evaluationModal?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      evaluationModal
    ) {

      closeModal();

    }

  }
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape" &&
      evaluationModal?.classList.contains(
        "show"
      )
    ) {

      closeModal();

    }

  }
);


// =========================================================
// REFRESH EVALUATIONS
// =========================================================

refreshEvaluationsButton?.addEventListener(
  "click",
  async () => {

    refreshEvaluationsButton.disabled =
      true;


    const originalText =
      refreshEvaluationsButton.textContent;


    refreshEvaluationsButton.textContent =
      "Refreshing...";


    try {

      await loadEvaluations();


    } catch (_) {


    } finally {

      refreshEvaluationsButton.disabled =
        false;


      refreshEvaluationsButton.textContent =
        originalText ||
        "Refresh";

    }

  }
);


// =========================================================
// NORMALIZE RATING
// =========================================================

function normalizeRating(
  value
) {

  const rating =
    Math.round(
      Number(
        value || 0
      )
    );


  return Math.max(
    0,
    Math.min(
      5,
      rating
    )
  );

}


// =========================================================
// STAR DISPLAY
// =========================================================

function getStarCharacters(
  rating
) {

  const value =
    normalizeRating(
      rating
    );


  return (
    "★".repeat(
      value
    ) +
    "☆".repeat(
      5 - value
    )
  );

}


// =========================================================
// SET TEXT
// =========================================================

function setText(
  element,
  value
) {

  if (!element) {

    return;

  }


  element.textContent =
    String(
      value || ""
    ).trim() ||
    "Not specified";

}


// =========================================================
// TIMESTAMP VALUE
// =========================================================

function getTimestampValue(
  timestamp
) {

  if (!timestamp) {

    return 0;

  }


  if (
    typeof timestamp.toMillis ===
    "function"
  ) {

    return timestamp.toMillis();

  }


  if (
    typeof timestamp.seconds ===
    "number"
  ) {

    return (
      timestamp.seconds *
      1000
    );

  }


  const date =
    new Date(
      timestamp
    );


  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatTimestamp(
  timestamp,
  includeTime = false
) {

  if (!timestamp) {

    return "—";

  }


  let date;


  if (
    typeof timestamp.toDate ===
    "function"
  ) {

    date =
      timestamp.toDate();

  }

  else if (
    typeof timestamp.seconds ===
    "number"
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
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  if (includeTime) {

    return new Intl.DateTimeFormat(
      "en-PH",
      {
        month:
          "long",

        day:
          "numeric",

        year:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit"
      }
    ).format(
      date
    );

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


      const role =
        String(
          currentProfile.role ||
          ""
        )
          .trim()
          .toLowerCase();


      const status =
        String(
          currentProfile.status ||
          ""
        )
          .trim()
          .toLowerCase();


      // ===================================================
      // ACTIVE REQUIRED
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
      // ADMIN ONLY
      // ===================================================

      if (
        role !== "admin"
      ) {

        alert(
          "Administrator access is required to view Artifact Evaluations."
        );


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
      // LOAD EVALUATIONS
      // ===================================================

      try {

        await loadEvaluations();


      } catch (error) {

        console.error(
          "Evaluation list loading failed:",
          error
        );

      }


    } catch (error) {

      console.error(
        "Evaluation Management initialization error:",
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