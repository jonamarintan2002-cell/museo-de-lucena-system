// =========================================================
// MUSEO DE LUCENA
// CLIENT ARTIFACT COLLECTION / EVALUATOR PORTAL
// assets/js/client-artifacts.js
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
  getDocs,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile = null;

let artifacts = [];

let categories = [];

let currentArtifact = null;

let selectedRating = 0;


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


const clientLogoutButton =
  document.getElementById(
    "clientLogoutButton"
  );


// =========================================================
// CLIENT PROFILE ELEMENTS
// =========================================================

const clientSidebarAvatar =
  document.getElementById(
    "clientSidebarAvatar"
  );


const clientSidebarName =
  document.getElementById(
    "clientSidebarName"
  );


const clientTopbarAvatar =
  document.getElementById(
    "clientTopbarAvatar"
  );


const clientTopbarName =
  document.getElementById(
    "clientTopbarName"
  );


// =========================================================
// SEARCH / FILTERS
// =========================================================

const clientArtifactSearch =
  document.getElementById(
    "clientArtifactSearch"
  );


const clientCategoryFilter =
  document.getElementById(
    "clientCategoryFilter"
  );


const clientConditionFilter =
  document.getElementById(
    "clientConditionFilter"
  );


const resetClientFilters =
  document.getElementById(
    "resetClientFilters"
  );


const clientCategoryChips =
  document.getElementById(
    "clientCategoryChips"
  );


// =========================================================
// GALLERY
// =========================================================

const clientArtifactGallery =
  document.getElementById(
    "clientArtifactGallery"
  );


const clientResultCount =
  document.getElementById(
    "clientResultCount"
  );


const visibleArtifactCount =
  document.getElementById(
    "visibleArtifactCount"
  );


// =========================================================
// ARTIFACT MODAL
// =========================================================

const clientArtifactModal =
  document.getElementById(
    "clientArtifactModal"
  );


const closeClientArtifactModal =
  document.getElementById(
    "closeClientArtifactModal"
  );


const modalArtifactName =
  document.getElementById(
    "modalArtifactName"
  );


const modalAccessionNumber =
  document.getElementById(
    "modalAccessionNumber"
  );


const modalArtifactImage =
  document.getElementById(
    "modalArtifactImage"
  );


const modalImagePlaceholder =
  document.getElementById(
    "modalImagePlaceholder"
  );


const modalCategory =
  document.getElementById(
    "modalCategory"
  );


const modalCondition =
  document.getElementById(
    "modalCondition"
  );


const modalOrigin =
  document.getElementById(
    "modalOrigin"
  );


const modalDateAcquired =
  document.getElementById(
    "modalDateAcquired"
  );


const modalCurrentLocation =
  document.getElementById(
    "modalCurrentLocation"
  );


const modalDescription =
  document.getElementById(
    "modalDescription"
  );


const modalHistoricalBackground =
  document.getElementById(
    "modalHistoricalBackground"
  );


const modalRemarks =
  document.getElementById(
    "modalRemarks"
  );


// =========================================================
// EVALUATION ELEMENTS
// =========================================================

const artifactEvaluationForm =
  document.getElementById(
    "artifactEvaluationForm"
  );


const evaluationArtifactId =
  document.getElementById(
    "evaluationArtifactId"
  );


const evaluationRating =
  document.getElementById(
    "evaluationRating"
  );


const evaluationComment =
  document.getElementById(
    "evaluationComment"
  );


const starRating =
  document.getElementById(
    "starRating"
  );


const starButtons =
  document.querySelectorAll(
    ".star-button"
  );


const ratingText =
  document.getElementById(
    "ratingText"
  );


const evaluationMessage =
  document.getElementById(
    "evaluationMessage"
  );


const submitEvaluationButton =
  document.getElementById(
    "submitEvaluationButton"
  );


const submitEvaluationText =
  document.getElementById(
    "submitEvaluationText"
  );


const evaluationSpinner =
  document.getElementById(
    "evaluationSpinner"
  );


// =========================================================
// EXISTING EVALUATION
// =========================================================

const existingEvaluation =
  document.getElementById(
    "existingEvaluation"
  );


const existingEvaluationRating =
  document.getElementById(
    "existingEvaluationRating"
  );


const existingEvaluationComment =
  document.getElementById(
    "existingEvaluationComment"
  );


// =========================================================
// USER PROFILE
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
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}


// =========================================================
// NORMALIZE STATUS
// =========================================================

function normalizeStatus(
  value
) {

  return String(
    value || ""
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
    "Client Evaluator";


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


  populateCategoryFilter();


  renderCategoryChips();

}


// =========================================================
// POPULATE CATEGORY SELECT
// =========================================================

function populateCategoryFilter() {

  if (!clientCategoryFilter) {

    return;

  }


  clientCategoryFilter.innerHTML = `
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
        category.id;


      option.textContent =
        category.name ||
        "Unnamed Category";


      clientCategoryFilter.appendChild(
        option
      );

    }
  );

}


// =========================================================
// CATEGORY CHIPS
// =========================================================

function renderCategoryChips() {

  if (!clientCategoryChips) {

    return;

  }


  let html = `
    <button
      type="button"
      class="category-chip active"
      data-category=""
    >
      All
    </button>
  `;


  categories.forEach(
    category => {

      html += `
        <button
          type="button"
          class="category-chip"
          data-category="${escapeAttribute(
            category.id
          )}"
        >
          ${escapeHTML(
            category.name ||
            "Unnamed Category"
          )}
        </button>
      `;

    }
  );


  clientCategoryChips.innerHTML =
    html;

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


  // =======================================================
  // CLIENTS ONLY SEE ACTIVE RECORDS
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


  artifacts.sort(
    (a, b) =>
      getTimestampValue(
        b.createdAt
      ) -
      getTimestampValue(
        a.createdAt
      )
  );


  if (visibleArtifactCount) {

    visibleArtifactCount.textContent =
      artifacts.length;

  }


  applyFilters();

}


// =========================================================
// GET IMAGE SOURCE
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
// APPLY FILTERS
// =========================================================

function applyFilters() {

  const keyword =
    clientArtifactSearch
      ? clientArtifactSearch.value
          .trim()
          .toLowerCase()
      : "";


  const categoryId =
    clientCategoryFilter
      ? clientCategoryFilter.value
      : "";


  const conditionValue =
    clientConditionFilter
      ? clientConditionFilter.value
      : "";


  const filtered =
    artifacts.filter(
      artifact => {

        const searchableText =
          [
            artifact.name,
            artifact.artifactName,
            artifact.accessionNumber,
            artifact.category,
            artifact.categoryName,
            artifact.origin,
            artifact.description,
            artifact.historicalBackground
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
          searchableText.includes(
            keyword
          );


        const matchesCategory =
          !categoryId ||
          artifact.categoryId ===
            categoryId;


        const matchesCondition =
          !conditionValue ||
          artifact.condition ===
            conditionValue;


        return (
          matchesSearch &&
          matchesCategory &&
          matchesCondition
        );

      }
    );


  renderArtifacts(
    filtered
  );

}


// =========================================================
// FILTER EVENTS
// =========================================================

clientArtifactSearch?.addEventListener(
  "input",
  applyFilters
);


clientCategoryFilter?.addEventListener(
  "change",
  () => {

    updateActiveCategoryChip(
      clientCategoryFilter.value
    );


    applyFilters();

  }
);


clientConditionFilter?.addEventListener(
  "change",
  applyFilters
);


// =========================================================
// RESET FILTERS
// =========================================================

resetClientFilters?.addEventListener(
  "click",
  () => {

    if (clientArtifactSearch) {

      clientArtifactSearch.value =
        "";

    }


    if (clientCategoryFilter) {

      clientCategoryFilter.value =
        "";

    }


    if (clientConditionFilter) {

      clientConditionFilter.value =
        "";

    }


    updateActiveCategoryChip(
      ""
    );


    applyFilters();

  }
);


// =========================================================
// CATEGORY CHIP CLICK
// =========================================================

clientCategoryChips?.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".category-chip"
      );


    if (!button) {

      return;

    }


    const categoryId =
      button.dataset.category ||
      "";


    if (clientCategoryFilter) {

      clientCategoryFilter.value =
        categoryId;

    }


    updateActiveCategoryChip(
      categoryId
    );


    applyFilters();

  }
);


// =========================================================
// UPDATE ACTIVE CATEGORY CHIP
// =========================================================

function updateActiveCategoryChip(
  categoryId
) {

  document
    .querySelectorAll(
      ".category-chip"
    )
    .forEach(
      chip => {

        chip.classList.toggle(
          "active",
          (
            chip.dataset.category ||
            ""
          ) === categoryId
        );

      }
    );

}


// =========================================================
// RENDER ARTIFACTS
// =========================================================

function renderArtifacts(
  list
) {

  if (!clientArtifactGallery) {

    return;

  }


  if (clientResultCount) {

    clientResultCount.textContent =
      `${list.length} ${
        list.length === 1
          ? "artifact"
          : "artifacts"
      }`;

  }


  if (!list.length) {

    clientArtifactGallery.innerHTML = `
      <div class="client-gallery-empty">

        <div class="empty-mark">
          M
        </div>

        <h3>
          No artifacts found
        </h3>

        <p>
          No artifact records match your current
          search or filter selection.
        </p>

      </div>
    `;


    return;

  }


  clientArtifactGallery.innerHTML =
    list.map(
      artifact => {

        const name =
          artifact.name ||
          artifact.artifactName ||
          "Untitled Artifact";


        const category =
          artifact.category ||
          artifact.categoryName ||
          "Uncategorized";


        const accession =
          artifact.accessionNumber ||
          "No accession number";


        const description =
          artifact.description ||
          "No description is currently available.";


        const condition =
          artifact.condition ||
          "Not specified";


        const imageSource =
          getArtifactImageSource(
            artifact
          );


        const initial =
          String(
            name
          )
            .trim()
            .charAt(0)
            .toUpperCase() ||
          "A";


        const imageHTML =
          imageSource
            ? `
              <img
                src="${escapeAttribute(
                  imageSource
                )}"
                alt="${escapeAttribute(
                  name
                )}"
                loading="lazy"
              >
            `
            : escapeHTML(
                initial
              );


        return `
          <article class="client-artifact-card">

            <div class="client-artifact-image">
              ${imageHTML}
            </div>


            <div class="client-artifact-card-body">

              <span class="client-artifact-category">
                ${escapeHTML(
                  category
                )}
              </span>


              <h4>
                ${escapeHTML(
                  name
                )}
              </h4>


              <span class="client-artifact-accession">
                ${escapeHTML(
                  accession
                )}
              </span>


              <p class="client-artifact-description">
                ${escapeHTML(
                  description
                )}
              </p>


              <div class="client-artifact-meta">

                <span class="client-condition-tag">
                  ${escapeHTML(
                    condition
                  )}
                </span>


                <button
                  type="button"
                  class="view-artifact-button"
                  data-artifact-id="${escapeAttribute(
                    artifact.id
                  )}"
                >
                  View & Evaluate
                </button>

              </div>

            </div>

          </article>
        `;

      }
    )
    .join("");

}


// =========================================================
// GALLERY CLICK
// =========================================================

clientArtifactGallery?.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".view-artifact-button"
      );


    if (!button) {

      return;

    }


    const artifactId =
      button.dataset.artifactId;


    const artifact =
      artifacts.find(
        item =>
          item.id === artifactId
      );


    if (!artifact) {

      return;

    }


    openArtifactModal(
      artifact
    );

  }
);


// =========================================================
// OPEN ARTIFACT MODAL
// =========================================================

async function openArtifactModal(
  artifact
) {

  currentArtifact =
    artifact;


  resetEvaluationForm();


  // =======================================================
  // ARTIFACT DETAILS
  // =======================================================

  setText(
    modalArtifactName,
    artifact.name ||
    artifact.artifactName ||
    "Untitled Artifact"
  );


  if (modalAccessionNumber) {

    modalAccessionNumber.textContent =
      artifact.accessionNumber
        ? `Accession No. ${artifact.accessionNumber}`
        : "No accession number";

  }


  setText(
    modalCategory,
    artifact.category ||
    artifact.categoryName
  );


  setText(
    modalCondition,
    artifact.condition
  );


  setText(
    modalOrigin,
    artifact.origin
  );


  setText(
    modalDateAcquired,
    artifact.dateAcquired
  );


  setText(
    modalCurrentLocation,
    artifact.currentLocation
  );


  setText(
    modalDescription,
    artifact.description
  );


  setText(
    modalHistoricalBackground,
    artifact.historicalBackground
  );


  setText(
    modalRemarks,
    artifact.remarks
  );


  if (evaluationArtifactId) {

    evaluationArtifactId.value =
      artifact.id;

  }


  // =======================================================
  // IMAGE
  // =======================================================

  const imageSource =
    getArtifactImageSource(
      artifact
    );


  if (
    imageSource &&
    modalArtifactImage
  ) {

    modalArtifactImage.src =
      imageSource;


    modalArtifactImage.alt =
      artifact.name ||
      artifact.artifactName ||
      "Artifact image";


    modalArtifactImage.style.display =
      "block";


    if (modalImagePlaceholder) {

      modalImagePlaceholder.style.display =
        "none";

    }

  } else {

    if (modalArtifactImage) {

      modalArtifactImage.removeAttribute(
        "src"
      );


      modalArtifactImage.style.display =
        "none";

    }


    if (modalImagePlaceholder) {

      modalImagePlaceholder.style.display =
        "grid";

    }

  }


  clientArtifactModal?.classList.add(
    "show"
  );


  document.body.style.overflow =
    "hidden";


  // =======================================================
  // LOAD CLIENT'S EXISTING EVALUATION
  // =======================================================

  await loadExistingEvaluation(
    artifact
  );

}


// =========================================================
// EVALUATION DOCUMENT ID
// =========================================================
//
// One evaluator + one artifact = one evaluation.
//
// Example:
// artifact123_UID123
// =========================================================

function getEvaluationDocumentId(
  artifactId,
  evaluatorId
) {

  return `${artifactId}_${evaluatorId}`;

}


// =========================================================
// LOAD EXISTING EVALUATION
// =========================================================

async function loadExistingEvaluation(
  artifact
) {

  if (
    !auth.currentUser
  ) {

    return;

  }


  const evaluationId =
    getEvaluationDocumentId(
      artifact.id,
      auth.currentUser.uid
    );


  const evaluationReference =
    doc(
      db,
      "artifact_evaluations",
      evaluationId
    );


  try {

    const snapshot =
      await getDoc(
        evaluationReference
      );


    if (!snapshot.exists()) {

      hideExistingEvaluation();

      return;

    }


    const evaluation =
      snapshot.data();


    const rating =
      Number(
        evaluation.rating || 0
      );


    selectedRating =
      rating;


    if (evaluationRating) {

      evaluationRating.value =
        rating
          ? String(rating)
          : "";

    }


    if (evaluationComment) {

      evaluationComment.value =
        evaluation.comment ||
        "";

    }


    updateStars(
      rating
    );


    updateRatingText(
      rating
    );


    if (existingEvaluation) {

      existingEvaluation.hidden =
        false;

    }


    if (existingEvaluationRating) {

      existingEvaluationRating.textContent =
        `${rating} / 5 ${
          getStarCharacters(
            rating
          )
        }`;

    }


    if (existingEvaluationComment) {

      existingEvaluationComment.textContent =
        evaluation.comment ||
        "No written feedback was provided.";

    }


    if (submitEvaluationText) {

      submitEvaluationText.textContent =
        "Update Evaluation";

    }


  } catch (error) {

    console.error(
      "LOAD EVALUATION ERROR:",
      error
    );


    hideExistingEvaluation();


    if (
      error.code ===
      "permission-denied"
    ) {

      showEvaluationMessage(
        "Evaluation access is not yet enabled for this account.",
        "error"
      );

    }

  }

}


// =========================================================
// HIDE EXISTING EVALUATION
// =========================================================

function hideExistingEvaluation() {

  if (existingEvaluation) {

    existingEvaluation.hidden =
      true;

  }


  if (existingEvaluationRating) {

    existingEvaluationRating.textContent =
      "";

  }


  if (existingEvaluationComment) {

    existingEvaluationComment.textContent =
      "";

  }


  if (submitEvaluationText) {

    submitEvaluationText.textContent =
      "Submit Evaluation";

  }

}


// =========================================================
// STAR RATING
// =========================================================

starButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const rating =
          Number(
            button.dataset.rating
          );


        if (
          rating < 1 ||
          rating > 5
        ) {

          return;

        }


        selectedRating =
          rating;


        if (evaluationRating) {

          evaluationRating.value =
            String(
              rating
            );

        }


        updateStars(
          rating
        );


        updateRatingText(
          rating
        );


        clearEvaluationMessage();

      }
    );

  }
);


// =========================================================
// UPDATE STAR DISPLAY
// =========================================================

function updateStars(
  rating
) {

  starButtons.forEach(
    button => {

      const value =
        Number(
          button.dataset.rating
        );


      button.classList.toggle(
        "active",
        value <= rating
      );


      button.setAttribute(
        "aria-checked",
        value === rating
          ? "true"
          : "false"
      );

    }
  );

}


// =========================================================
// RATING TEXT
// =========================================================

function updateRatingText(
  rating
) {

  if (!ratingText) {

    return;

  }


  const labels = {
    1: "1 out of 5 — Poor",
    2: "2 out of 5 — Fair",
    3: "3 out of 5 — Good",
    4: "4 out of 5 — Very Good",
    5: "5 out of 5 — Excellent"
  };


  ratingText.textContent =
    labels[rating] ||
    "Select a rating from 1 to 5.";

}


// =========================================================
// STAR CHARACTERS
// =========================================================

function getStarCharacters(
  rating
) {

  const value =
    Math.max(
      0,
      Math.min(
        5,
        Number(
          rating || 0
        )
      )
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
// SUBMIT / UPDATE EVALUATION
// =========================================================

artifactEvaluationForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearEvaluationMessage();


    if (
      !currentArtifact ||
      !auth.currentUser ||
      !currentProfile
    ) {

      showEvaluationMessage(
        "Unable to identify the artifact or evaluator account.",
        "error"
      );


      return;

    }


    const rating =
      Number(
        evaluationRating?.value ||
        selectedRating ||
        0
      );


    const comment =
      evaluationComment
        ? evaluationComment.value
            .trim()
        : "";


    // =====================================================
    // VALIDATE RATING
    // =====================================================

    if (
      rating < 1 ||
      rating > 5
    ) {

      showEvaluationMessage(
        "Please select an overall rating from 1 to 5 stars.",
        "error"
      );


      return;

    }


    setEvaluationLoading(
      true
    );


    try {

      const evaluationId =
        getEvaluationDocumentId(
          currentArtifact.id,
          auth.currentUser.uid
        );


      const evaluationReference =
        doc(
          db,
          "artifact_evaluations",
          evaluationId
        );


      // Check whether this is a new
      // evaluation or an update.

      const existingSnapshot =
        await getDoc(
          evaluationReference
        );


      const isExisting =
        existingSnapshot.exists();


      const artifactName =
        currentArtifact.name ||
        currentArtifact.artifactName ||
        "Untitled Artifact";


      const categoryName =
        currentArtifact.category ||
        currentArtifact.categoryName ||
        "";


      const evaluationData = {

        // ===================================================
        // ARTIFACT
        // ===================================================

        artifactId:
          currentArtifact.id,

        artifactName:
          artifactName,

        accessionNumber:
          currentArtifact.accessionNumber ||
          "",

        categoryId:
          currentArtifact.categoryId ||
          "",

        categoryName:
          categoryName,


        // ===================================================
        // EVALUATOR
        // ===================================================

        evaluatorId:
          auth.currentUser.uid,

        evaluatorName:
          currentProfile.fullName ||
          currentProfile.name ||
          "Client Evaluator",

        evaluatorEmail:
          currentProfile.email ||
          auth.currentUser.email ||
          "",


        // ===================================================
        // EVALUATION
        // ===================================================

        rating:
          rating,

        comment:
          comment,

        updatedAt:
          serverTimestamp()

      };


      if (!isExisting) {

        evaluationData.createdAt =
          serverTimestamp();

      }


      // ===================================================
      // SAVE
      // ===================================================

      await setDoc(
        evaluationReference,
        evaluationData,
        {
          merge: true
        }
      );


      selectedRating =
        rating;


      showEvaluationMessage(
        isExisting
          ? "Your evaluation has been updated successfully."
          : "Thank you. Your evaluation has been submitted successfully.",
        "success"
      );


      // Refresh the current evaluation box.

      await loadExistingEvaluation(
        currentArtifact
      );


    } catch (error) {

      console.error(
        "SUBMIT EVALUATION ERROR:",
        error
      );


      let message =
        "Unable to submit your evaluation. Please try again.";


      if (
        error.code ===
        "permission-denied"
      ) {

        message =
          "Your account does not yet have permission to submit artifact evaluations.";

      }


      if (
        error.code ===
        "unavailable"
      ) {

        message =
          "Firebase is currently unavailable. Please check your internet connection.";

      }


      showEvaluationMessage(
        message,
        "error"
      );


    } finally {

      setEvaluationLoading(
        false
      );

    }

  }
);


// =========================================================
// EVALUATION LOADING
// =========================================================

function setEvaluationLoading(
  loading
) {

  if (submitEvaluationButton) {

    submitEvaluationButton.disabled =
      loading;

  }


  if (evaluationComment) {

    evaluationComment.disabled =
      loading;

  }


  starButtons.forEach(
    button => {

      button.disabled =
        loading;

    }
  );


  if (evaluationSpinner) {

    evaluationSpinner.classList.toggle(
      "show",
      loading
    );

  }


  if (
    loading &&
    submitEvaluationText
  ) {

    submitEvaluationText.textContent =
      "Saving evaluation...";

  }


  if (
    !loading &&
    submitEvaluationText
  ) {

    if (
      existingEvaluation &&
      !existingEvaluation.hidden
    ) {

      submitEvaluationText.textContent =
        "Update Evaluation";

    } else {

      submitEvaluationText.textContent =
        "Submit Evaluation";

    }

  }

}


// =========================================================
// RESET EVALUATION FORM
// =========================================================

function resetEvaluationForm() {

  selectedRating =
    0;


  artifactEvaluationForm?.reset();


  if (evaluationRating) {

    evaluationRating.value =
      "";

  }


  updateStars(
    0
  );


  updateRatingText(
    0
  );


  hideExistingEvaluation();


  clearEvaluationMessage();

}


// =========================================================
// EVALUATION MESSAGE
// =========================================================

function showEvaluationMessage(
  message,
  type = "error"
) {

  if (!evaluationMessage) {

    return;

  }


  evaluationMessage.textContent =
    message;


  evaluationMessage.className =
    `evaluation-message show ${type}`;

}


// =========================================================
// CLEAR EVALUATION MESSAGE
// =========================================================

function clearEvaluationMessage() {

  if (!evaluationMessage) {

    return;

  }


  evaluationMessage.textContent =
    "";


  evaluationMessage.className =
    "evaluation-message";

}


// =========================================================
// CLOSE ARTIFACT MODAL
// =========================================================

function closeArtifactModal() {

  clientArtifactModal?.classList.remove(
    "show"
  );


  document.body.style.overflow =
    "";


  currentArtifact =
    null;


  resetEvaluationForm();

}


// =========================================================
// CLOSE BUTTON
// =========================================================

closeClientArtifactModal?.addEventListener(
  "click",
  closeArtifactModal
);


// =========================================================
// CLICK OUTSIDE MODAL
// =========================================================

clientArtifactModal?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      clientArtifactModal
    ) {

      closeArtifactModal();

    }

  }
);


// =========================================================
// ESCAPE KEY
// =========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape" &&
      clientArtifactModal?.classList.contains(
        "show"
      )
    ) {

      closeArtifactModal();

    }

  }
);


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
    )
      .trim() ||
    "Not specified";

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
// MOBILE NAVIGATION
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
// SHOW PAGE LOAD ERROR
// =========================================================

function showPageLoadError(
  message
) {

  if (!clientArtifactGallery) {

    return;

  }


  clientArtifactGallery.innerHTML = `
    <div class="client-gallery-empty">

      <div class="empty-mark">
        !
      </div>

      <h3>
        Unable to load collection
      </h3>

      <p>
        ${escapeHTML(
          message
        )}
      </p>

    </div>
  `;


  if (clientResultCount) {

    clientResultCount.textContent =
      "—";

  }


  if (visibleArtifactCount) {

    visibleArtifactCount.textContent =
      "—";

  }

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

      window.location.replace(
        "login.html"
      );


      return;

    }


    try {

      // ===================================================
      // LOAD PROFILE
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
      // ADMIN / STAFF SHOULD USE INTERNAL SYSTEM
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
      // CLIENT / EVALUATOR ONLY
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
      // PROFILE
      // ===================================================

      displayClientProfile(
        currentProfile
      );


      // ===================================================
      // LOAD COLLECTION
      // ===================================================

      try {

        await Promise.all([
          loadCategories(),
          loadArtifacts()
        ]);


      } catch (error) {

        console.error(
          "LOAD COLLECTION ERROR:",
          error
        );


        if (
          error.code ===
          "permission-denied"
        ) {

          showPageLoadError(
            "Your account does not have permission to view the artifact collection."
          );

        } else {

          showPageLoadError(
            "Please check your internet connection and refresh the page."
          );

        }

      }


      // ===================================================
      // HIDE PAGE LOADER
      // ===================================================

      if (pageLoader) {

        pageLoader.classList.add(
          "hide"
        );

      }


    } catch (error) {

      console.error(
        "CLIENT ARTIFACT PAGE ERROR:",
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