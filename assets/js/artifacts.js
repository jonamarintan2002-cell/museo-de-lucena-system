// =========================================================
// MUSEO DE LUCENA
// ARTIFACT RECORD MANAGEMENT
// FIRESTORE + COMPRESSED IMAGE VERSION
// NO FIREBASE STORAGE REQUIRED
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
// IMAGE SETTINGS
// =========================================================

// Maximum original file selected by user
const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;


// Accepted image formats
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];


// Maximum image dimension after compression
const MAX_IMAGE_DIMENSION =
  1100;


// Target Data URL size.
// Keeps Firestore documents much smaller.
const TARGET_DATA_URL_LENGTH =
  180000;


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile = null;

let artifacts = [];

let categories = [];


// Existing saved Firestore image
let existingImageData = "";


// Backward compatibility with old Storage records
let existingImageUrl = "";

let existingImagePath = "";


// Newly selected compressed image
let selectedImageData = "";


// Image processing status
let imageProcessing = false;


// Existing image removed / replaced
let imageMarkedForRemoval = false;


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


const logoutButton =
  document.getElementById(
    "logoutButton"
  );


// =========================================================
// TABLE
// =========================================================

const artifactTableBody =
  document.getElementById(
    "artifactTableBody"
  );


const resultCount =
  document.getElementById(
    "resultCount"
  );


// =========================================================
// COUNTERS
// =========================================================

const totalArtifactCount =
  document.getElementById(
    "totalArtifactCount"
  );


const activeArtifactCount =
  document.getElementById(
    "activeArtifactCount"
  );


const archivedArtifactCount =
  document.getElementById(
    "archivedArtifactCount"
  );


// =========================================================
// FILTERS
// =========================================================

const artifactSearch =
  document.getElementById(
    "artifactSearch"
  );


const categoryFilter =
  document.getElementById(
    "categoryFilter"
  );


const conditionFilter =
  document.getElementById(
    "conditionFilter"
  );


const statusFilter =
  document.getElementById(
    "statusFilter"
  );


const resetFilters =
  document.getElementById(
    "resetFilters"
  );


// =========================================================
// ARTIFACT FORM MODAL
// =========================================================

const artifactModal =
  document.getElementById(
    "artifactModal"
  );


const openAddArtifact =
  document.getElementById(
    "openAddArtifact"
  );


const closeArtifactModal =
  document.getElementById(
    "closeArtifactModal"
  );


const cancelArtifact =
  document.getElementById(
    "cancelArtifact"
  );


const artifactModalTitle =
  document.getElementById(
    "artifactModalTitle"
  );


const artifactForm =
  document.getElementById(
    "artifactForm"
  );


const saveArtifact =
  document.getElementById(
    "saveArtifact"
  );


const artifactFormMessage =
  document.getElementById(
    "artifactFormMessage"
  );


// =========================================================
// FORM FIELDS
// =========================================================

const artifactId =
  document.getElementById(
    "artifactId"
  );


const accessionNumber =
  document.getElementById(
    "accessionNumber"
  );


const artifactName =
  document.getElementById(
    "artifactName"
  );


const artifactCategory =
  document.getElementById(
    "artifactCategory"
  );


const condition =
  document.getElementById(
    "condition"
  );


const artifactDescription =
  document.getElementById(
    "artifactDescription"
  );


const historicalBackground =
  document.getElementById(
    "historicalBackground"
  );


const origin =
  document.getElementById(
    "origin"
  );


const dateAcquired =
  document.getElementById(
    "dateAcquired"
  );


const currentLocation =
  document.getElementById(
    "currentLocation"
  );


const artifactStatus =
  document.getElementById(
    "artifactStatus"
  );


const remarks =
  document.getElementById(
    "remarks"
  );


// =========================================================
// IMAGE ELEMENTS
// =========================================================

const artifactImage =
  document.getElementById(
    "artifactImage"
  );


const imagePreview =
  document.getElementById(
    "imagePreview"
  );


const removeSelectedImage =
  document.getElementById(
    "removeSelectedImage"
  );


// =========================================================
// VIEW MODAL
// =========================================================

const viewArtifactModal =
  document.getElementById(
    "viewArtifactModal"
  );


const closeViewModal =
  document.getElementById(
    "closeViewModal"
  );


const viewArtifactName =
  document.getElementById(
    "viewArtifactName"
  );


const viewAccession =
  document.getElementById(
    "viewAccession"
  );


const viewArtifactImage =
  document.getElementById(
    "viewArtifactImage"
  );


const viewImagePlaceholder =
  document.getElementById(
    "viewImagePlaceholder"
  );


const viewCategory =
  document.getElementById(
    "viewCategory"
  );


const viewCondition =
  document.getElementById(
    "viewCondition"
  );


const viewStatus =
  document.getElementById(
    "viewStatus"
  );


const viewDateAcquired =
  document.getElementById(
    "viewDateAcquired"
  );


const viewOrigin =
  document.getElementById(
    "viewOrigin"
  );


const viewLocation =
  document.getElementById(
    "viewLocation"
  );


const viewDescription =
  document.getElementById(
    "viewDescription"
  );


const viewHistory =
  document.getElementById(
    "viewHistory"
  );


const viewRemarks =
  document.getElementById(
    "viewRemarks"
  );


const viewCreatedBy =
  document.getElementById(
    "viewCreatedBy"
  );


const viewUpdatedBy =
  document.getElementById(
    "viewUpdatedBy"
  );


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
// DISPLAY CURRENT USER
// =========================================================

function displayUser(profile) {

  const name =
    profile.fullName ||
    "Museo User";


  const role =
    profile.role === "admin"
      ? "Administrator"
      : "Museum Staff";


  const initial =
    name
      .trim()
      .charAt(0)
      .toUpperCase();


  const nameElement =
    document.getElementById(
      "sidebarUserName"
    );


  const roleElement =
    document.getElementById(
      "sidebarUserRole"
    );


  const avatarElement =
    document.getElementById(
      "sidebarAvatar"
    );


  if (nameElement) {

    nameElement.textContent =
      name;

  }


  if (roleElement) {

    roleElement.textContent =
      role;

  }


  if (avatarElement) {

    avatarElement.textContent =
      initial;

  }


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
// CATEGORY OPTIONS
// =========================================================

function populateCategoryOptions() {

  if (
    !artifactCategory ||
    !categoryFilter
  ) {

    return;

  }


  artifactCategory.innerHTML = `
    <option value="">
      Select category
    </option>
  `;


  categoryFilter.innerHTML = `
    <option value="">
      All Categories
    </option>
  `;


  categories.forEach(
    category => {

      const formOption =
        document.createElement(
          "option"
        );


      formOption.value =
        category.id;


      formOption.textContent =
        category.name ||
        "Unnamed Category";


      artifactCategory.appendChild(
        formOption
      );


      const filterOption =
        document.createElement(
          "option"
        );


      filterOption.value =
        category.id;


      filterOption.textContent =
        category.name ||
        "Unnamed Category";


      categoryFilter.appendChild(
        filterOption
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

  applyFilters();

}


// =========================================================
// SUMMARY
// =========================================================

function updateSummary() {

  if (totalArtifactCount) {

    totalArtifactCount.textContent =
      artifacts.length;

  }


  const active =
    artifacts.filter(
      artifact =>
        String(
          artifact.status ||
          "Active"
        )
          .toLowerCase() ===
        "active"
    ).length;


  const archived =
    artifacts.filter(
      artifact =>
        String(
          artifact.status ||
          ""
        )
          .toLowerCase() ===
        "archived"
    ).length;


  if (activeArtifactCount) {

    activeArtifactCount.textContent =
      active;

  }


  if (archivedArtifactCount) {

    archivedArtifactCount.textContent =
      archived;

  }

}


// =========================================================
// FILTERING
// =========================================================

function applyFilters() {

  const keyword =
    artifactSearch
      ? artifactSearch.value
          .trim()
          .toLowerCase()
      : "";


  const selectedCategory =
    categoryFilter
      ? categoryFilter.value
      : "";


  const selectedCondition =
    conditionFilter
      ? conditionFilter.value
      : "";


  const selectedStatus =
    statusFilter
      ? statusFilter.value
      : "";


  const filtered =
    artifacts.filter(
      artifact => {

        const searchable =
          [
            artifact.name,
            artifact.artifactName,
            artifact.accessionNumber,
            artifact.category,
            artifact.categoryName,
            artifact.origin,
            artifact.description,
            artifact.currentLocation
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


        const matchesCategory =
          !selectedCategory ||
          artifact.categoryId ===
            selectedCategory;


        const matchesCondition =
          !selectedCondition ||
          artifact.condition ===
            selectedCondition;


        const matchesStatus =
          !selectedStatus ||
          artifact.status ===
            selectedStatus;


        return (
          matchesSearch &&
          matchesCategory &&
          matchesCondition &&
          matchesStatus
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

artifactSearch?.addEventListener(
  "input",
  applyFilters
);


categoryFilter?.addEventListener(
  "change",
  applyFilters
);


conditionFilter?.addEventListener(
  "change",
  applyFilters
);


statusFilter?.addEventListener(
  "change",
  applyFilters
);


resetFilters?.addEventListener(
  "click",
  () => {

    if (artifactSearch) {
      artifactSearch.value = "";
    }

    if (categoryFilter) {
      categoryFilter.value = "";
    }

    if (conditionFilter) {
      conditionFilter.value = "";
    }

    if (statusFilter) {
      statusFilter.value = "";
    }

    applyFilters();

  }
);


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
// RENDER ARTIFACT TABLE
// =========================================================

function renderArtifacts(list) {

  if (!artifactTableBody) {

    return;

  }


  if (resultCount) {

    resultCount.textContent =
      `${list.length} ${
        list.length === 1
          ? "record"
          : "records"
      }`;

  }


  if (!list.length) {

    artifactTableBody.innerHTML = `
      <tr>

        <td colspan="7">

          <div class="empty-state">

            <div class="empty-symbol">
              A
            </div>

            <h3>
              No artifact records found
            </h3>

            <p>
              No records match the current search
              or filter selection.
            </p>

          </div>

        </td>

      </tr>
    `;

    return;

  }


  artifactTableBody.innerHTML =
    list.map(
      artifact => {

        const name =
          escapeHTML(
            artifact.name ||
            artifact.artifactName ||
            "Untitled Artifact"
          );


        const accession =
          escapeHTML(
            artifact.accessionNumber ||
            "—"
          );


        const category =
          escapeHTML(
            artifact.category ||
            artifact.categoryName ||
            "Uncategorized"
          );


        const conditionValue =
          artifact.condition ||
          "Not specified";


        const status =
          artifact.status ||
          "Active";


        const date =
          artifact.dateAcquired ||
          "—";


        const originText =
          escapeHTML(
            artifact.origin ||
            "Origin not specified"
          );


        const firstLetter =
          String(
            artifact.name ||
            artifact.artifactName ||
            "A"
          )
            .charAt(0)
            .toUpperCase();


        const imageSource =
          getArtifactImageSource(
            artifact
          );


        const image =
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


        const deleteButton =
          currentProfile?.role ===
          "admin"
            ? `
              <button
                type="button"
                class="table-action delete-button"
                data-action="delete"
                data-id="${artifact.id}"
              >
                Delete
              </button>
            `
            : "";


        const archiveText =
          status === "Archived"
            ? "Restore"
            : "Archive";


        return `
          <tr>

            <td>

              <div class="artifact-cell">

                <div class="artifact-thumb">
                  ${image}
                </div>

                <div class="artifact-cell-info">

                  <strong>
                    ${name}
                  </strong>

                  <span>
                    ${originText}
                  </span>

                </div>

              </div>

            </td>


            <td>
              ${accession}
            </td>


            <td>
              ${category}
            </td>


            <td>

              <span class="
                condition-badge
                ${getConditionClass(
                  conditionValue
                )}
              ">
                ${escapeHTML(
                  conditionValue
                )}
              </span>

            </td>


            <td>

              <span class="
                status-badge
                ${
                  status === "Archived"
                    ? "status-archived"
                    : "status-active"
                }
              ">
                ${escapeHTML(
                  status
                )}
              </span>

            </td>


            <td>
              ${escapeHTML(
                date
              )}
            </td>


            <td>

              <div class="action-group">

                <button
                  type="button"
                  class="table-action view-button"
                  data-action="view"
                  data-id="${artifact.id}"
                >
                  View
                </button>


                <button
                  type="button"
                  class="table-action edit-button"
                  data-action="edit"
                  data-id="${artifact.id}"
                >
                  Edit
                </button>


                <button
                  type="button"
                  class="table-action archive-button"
                  data-action="archive"
                  data-id="${artifact.id}"
                >
                  ${archiveText}
                </button>


                ${deleteButton}

              </div>

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
  value
) {

  switch (
    String(
      value
    ).toLowerCase()
  ) {

    case "good":
      return "condition-good";

    case "fair":
      return "condition-fair";

    case "poor":
      return "condition-poor";

    default:
      return "condition-fair";

  }

}


// =========================================================
// OPEN ADD MODAL
// =========================================================

function openAddModal() {

  if (!categories.length) {

    alert(
      "Please create at least one artifact category before adding an artifact."
    );

    return;

  }


  resetArtifactForm();


  artifactModalTitle.textContent =
    "Add Artifact";


  saveArtifact.textContent =
    "Save Artifact";


  artifactStatus.value =
    "Active";


  artifactModal.classList.add(
    "show"
  );


  accessionNumber.focus();

}


openAddArtifact?.addEventListener(
  "click",
  openAddModal
);


// =========================================================
// RESET ARTIFACT FORM
// =========================================================

function resetArtifactForm() {

  artifactForm?.reset();


  if (artifactId) {

    artifactId.value =
      "";

  }


  existingImageData =
    "";


  existingImageUrl =
    "";


  existingImagePath =
    "";


  selectedImageData =
    "";


  imageMarkedForRemoval =
    false;


  imageProcessing =
    false;


  if (artifactStatus) {

    artifactStatus.value =
      "Active";

  }


  if (artifactImage) {

    artifactImage.value =
      "";

    artifactImage.disabled =
      false;

  }


  showNoImageSelected();


  updateRemoveImageButton();


  clearFormMessage();

}


// =========================================================
// SHOW NO IMAGE PLACEHOLDER
// =========================================================

function showNoImageSelected() {

  if (!imagePreview) {

    return;

  }


  imagePreview.innerHTML = `
    <div class="image-placeholder">

      <span>
        +
      </span>

      <strong>
        No image selected
      </strong>

      <small>
        Choose a clear photograph of the artifact.
      </small>

    </div>
  `;

}


// =========================================================
// SHOW PROCESSING IMAGE
// =========================================================

function showImageProcessing() {

  if (!imagePreview) {

    return;

  }


  imagePreview.innerHTML = `
    <div class="image-placeholder">

      <span>
        …
      </span>

      <strong>
        Optimizing image
      </strong>

      <small>
        Please wait a moment.
      </small>

    </div>
  `;

}


// =========================================================
// SHOW IMAGE PREVIEW
// =========================================================

function showImagePreview(
  imageSource,
  altText = "Artifact image preview"
) {

  if (!imagePreview) {

    return;

  }


  imagePreview.innerHTML =
    "";


  const image =
    document.createElement(
      "img"
    );


  image.src =
    imageSource;


  image.alt =
    altText;


  imagePreview.appendChild(
    image
  );

}


// =========================================================
// REMOVE BUTTON STATE
// =========================================================

function updateRemoveImageButton() {

  if (!removeSelectedImage) {

    return;

  }


  const existingSource =
    existingImageData ||
    existingImageUrl;


  const hasImage =
    Boolean(
      selectedImageData ||
      (
        existingSource &&
        !imageMarkedForRemoval
      )
    );


  removeSelectedImage.disabled =
    !hasImage;

}


// =========================================================
// READ FILE AS DATA URL
// =========================================================

function readFileAsDataURL(
  file
) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => {

          resolve(
            reader.result
          );

        };


      reader.onerror =
        () => {

          reject(
            new Error(
              "Unable to read image file."
            )
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


// =========================================================
// LOAD IMAGE ELEMENT
// =========================================================

function loadImage(
  source
) {

  return new Promise(
    (resolve, reject) => {

      const image =
        new Image();


      image.onload =
        () => resolve(
          image
        );


      image.onerror =
        () => reject(
          new Error(
            "Unable to process the selected image."
          )
        );


      image.src =
        source;

    }
  );

}


// =========================================================
// COMPRESS IMAGE
// =========================================================

async function compressImage(
  file
) {

  const originalDataUrl =
    await readFileAsDataURL(
      file
    );


  const image =
    await loadImage(
      originalDataUrl
    );


  let width =
    image.naturalWidth ||
    image.width;


  let height =
    image.naturalHeight ||
    image.height;


  // Resize large images

  if (
    width >
      MAX_IMAGE_DIMENSION ||
    height >
      MAX_IMAGE_DIMENSION
  ) {

    const scale =
      Math.min(
        MAX_IMAGE_DIMENSION /
          width,

        MAX_IMAGE_DIMENSION /
          height
      );


    width =
      Math.round(
        width * scale
      );


    height =
      Math.round(
        height * scale
      );

  }


  let quality =
    0.78;


  let compressedDataUrl =
    "";


  // Try multiple rounds until image
  // reaches a reasonable size.

  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {

    const canvas =
      document.createElement(
        "canvas"
      );


    canvas.width =
      width;


    canvas.height =
      height;


    const context =
      canvas.getContext(
        "2d"
      );


    if (!context) {

      throw new Error(
        "IMAGE_PROCESSING_FAILED"
      );

    }


    // White background prevents
    // transparent PNG from becoming black
    // after conversion to JPEG.

    context.fillStyle =
      "#ffffff";


    context.fillRect(
      0,
      0,
      width,
      height
    );


    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );


    compressedDataUrl =
      canvas.toDataURL(
        "image/jpeg",
        quality
      );


    if (
      compressedDataUrl.length <=
      TARGET_DATA_URL_LENGTH
    ) {

      break;

    }


    // First lower quality.

    if (
      quality >
      0.48
    ) {

      quality -=
        0.08;

    }

    // If still large,
    // reduce dimensions.

    else {

      width =
        Math.max(
          500,
          Math.round(
            width * 0.85
          )
        );


      height =
        Math.max(
          500,
          Math.round(
            height * 0.85
          )
        );

    }

  }


  // Final safety limit

  if (
    compressedDataUrl.length >
    500000
  ) {

    throw new Error(
      "IMAGE_TOO_LARGE_AFTER_COMPRESSION"
    );

  }


  return compressedDataUrl;

}


// =========================================================
// IMAGE SELECTION
// =========================================================

artifactImage?.addEventListener(
  "change",
  async () => {

    clearFormMessage();


    const file =
      artifactImage.files?.[0];


    if (!file) {

      return;

    }


    // FILE TYPE

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type
      )
    ) {

      artifactImage.value =
        "";


      showFormMessage(
        "Please select a JPG, PNG, or WEBP image.",
        "error"
      );


      restoreCurrentImagePreview();

      return;

    }


    // ORIGINAL FILE SIZE

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {

      artifactImage.value =
        "";


      showFormMessage(
        "The selected image is larger than 5 MB. Please choose a smaller image.",
        "error"
      );


      restoreCurrentImagePreview();

      return;

    }


    try {

      imageProcessing =
        true;


      artifactImage.disabled =
        true;


      showImageProcessing();


      const compressed =
        await compressImage(
          file
        );


      selectedImageData =
        compressed;


      imageMarkedForRemoval =
        Boolean(
          existingImageData ||
          existingImageUrl
        );


      showImagePreview(
        selectedImageData,
        file.name
      );


      updateRemoveImageButton();


      clearFormMessage();


    } catch (error) {

      console.error(
        "IMAGE PROCESSING ERROR:",
        error
      );


      selectedImageData =
        "";


      artifactImage.value =
        "";


      let message =
        "Unable to process the selected image.";


      if (
        error.message ===
        "IMAGE_TOO_LARGE_AFTER_COMPRESSION"
      ) {

        message =
          "The image is still too large after optimization. Please choose a smaller image.";

      }


      showFormMessage(
        message,
        "error"
      );


      restoreCurrentImagePreview();


    } finally {

      imageProcessing =
        false;


      artifactImage.disabled =
        false;

    }

  }
);


// =========================================================
// RESTORE CURRENT IMAGE PREVIEW
// =========================================================

function restoreCurrentImagePreview() {

  if (selectedImageData) {

    showImagePreview(
      selectedImageData
    );


  } else if (
    existingImageData &&
    !imageMarkedForRemoval
  ) {

    showImagePreview(
      existingImageData
    );


  } else if (
    existingImageUrl &&
    !imageMarkedForRemoval
  ) {

    showImagePreview(
      existingImageUrl
    );


  } else {

    showNoImageSelected();

  }


  updateRemoveImageButton();

}


// =========================================================
// REMOVE IMAGE
// =========================================================

removeSelectedImage?.addEventListener(
  "click",
  () => {

    clearFormMessage();


    selectedImageData =
      "";


    if (artifactImage) {

      artifactImage.value =
        "";

    }


    if (
      existingImageData ||
      existingImageUrl
    ) {

      imageMarkedForRemoval =
        true;

    }


    showNoImageSelected();


    updateRemoveImageButton();

  }
);


// =========================================================
// CLOSE FORM MODAL
// =========================================================

function closeArtifactFormModal() {

  artifactModal?.classList.remove(
    "show"
  );


  resetArtifactForm();

}


closeArtifactModal?.addEventListener(
  "click",
  closeArtifactFormModal
);


cancelArtifact?.addEventListener(
  "click",
  closeArtifactFormModal
);


artifactModal?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      artifactModal
    ) {

      closeArtifactFormModal();

    }

  }
);


// =========================================================
// TABLE ACTIONS
// =========================================================

artifactTableBody?.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {

      return;

    }


    const id =
      button.dataset.id;


    const action =
      button.dataset.action;


    const artifact =
      artifacts.find(
        item =>
          item.id === id
      );


    if (!artifact) {

      return;

    }


    if (
      action === "view"
    ) {

      openViewArtifact(
        artifact
      );

      return;

    }


    if (
      action === "edit"
    ) {

      openEditArtifact(
        artifact
      );

      return;

    }


    if (
      action === "archive"
    ) {

      await toggleArchive(
        artifact
      );

      return;

    }


    if (
      action === "delete"
    ) {

      await permanentlyDeleteArtifact(
        artifact
      );

    }

  }
);


// =========================================================
// EDIT ARTIFACT
// =========================================================

function openEditArtifact(
  artifact
) {

  resetArtifactForm();


  artifactId.value =
    artifact.id;


  accessionNumber.value =
    artifact.accessionNumber ||
    "";


  artifactName.value =
    artifact.name ||
    artifact.artifactName ||
    "";


  artifactCategory.value =
    artifact.categoryId ||
    "";


  condition.value =
    artifact.condition ||
    "";


  artifactDescription.value =
    artifact.description ||
    "";


  historicalBackground.value =
    artifact.historicalBackground ||
    "";


  origin.value =
    artifact.origin ||
    "";


  dateAcquired.value =
    artifact.dateAcquired ||
    "";


  currentLocation.value =
    artifact.currentLocation ||
    "";


  artifactStatus.value =
    artifact.status ||
    "Active";


  remarks.value =
    artifact.remarks ||
    "";


  // Firestore image

  existingImageData =
    artifact.imageData ||
    "";


  // Legacy Firebase Storage image

  existingImageUrl =
    artifact.imageUrl ||
    "";


  existingImagePath =
    artifact.imagePath ||
    "";


  selectedImageData =
    "";


  imageMarkedForRemoval =
    false;


  restoreCurrentImagePreview();


  artifactModalTitle.textContent =
    "Edit Artifact";


  saveArtifact.textContent =
    "Update Artifact";


  artifactModal.classList.add(
    "show"
  );

}


// =========================================================
// SAVE ARTIFACT
// =========================================================

artifactForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearFormMessage();


    // Do not save while image
    // is still being compressed.

    if (imageProcessing) {

      showFormMessage(
        "Please wait while the image is being optimized.",
        "error"
      );

      return;

    }


    const accession =
      accessionNumber.value
        .trim();


    const name =
      artifactName.value
        .trim();


    const selectedCategoryId =
      artifactCategory.value;


    const conditionValue =
      condition.value;


    const description =
      artifactDescription.value
        .trim();


    // REQUIRED FIELDS

    if (
      !accession ||
      !name ||
      !selectedCategoryId ||
      !conditionValue ||
      !description
    ) {

      showFormMessage(
        "Please complete all required fields.",
        "error"
      );

      return;

    }


    // DUPLICATE ACCESSION NUMBER

    const duplicate =
      artifacts.find(
        artifact =>
          String(
            artifact.accessionNumber ||
            ""
          )
            .trim()
            .toLowerCase() ===
          accession.toLowerCase() &&
          artifact.id !==
            artifactId.value
      );


    if (duplicate) {

      showFormMessage(
        "This accession or artifact number is already assigned to another record.",
        "error"
      );

      return;

    }


    // CATEGORY VALIDATION

    const selectedCategory =
      categories.find(
        item =>
          item.id ===
          selectedCategoryId
      );


    if (!selectedCategory) {

      showFormMessage(
        "Please select a valid category.",
        "error"
      );

      return;

    }


    saveArtifact.disabled =
      true;


    saveArtifact.textContent =
      "Saving...";


    try {

      const editingId =
        artifactId.value;


      const artifactReference =
        editingId
          ? doc(
              db,
              "artifacts",
              editingId
            )
          : doc(
              collection(
                db,
                "artifacts"
              )
            );


      // ===================================================
      // DETERMINE FINAL IMAGE
      // ===================================================

      let finalImageData =
        existingImageData;


      let finalLegacyImageUrl =
        existingImageUrl;


      let finalLegacyImagePath =
        existingImagePath;


      // NEW IMAGE SELECTED

      if (selectedImageData) {

        finalImageData =
          selectedImageData;


        // Remove old Storage reference
        // from the record.

        finalLegacyImageUrl =
          "";


        finalLegacyImagePath =
          "";

      }

      // IMAGE REMOVED

      else if (
        imageMarkedForRemoval
      ) {

        finalImageData =
          "";


        finalLegacyImageUrl =
          "";


        finalLegacyImagePath =
          "";

      }


      // ===================================================
      // PAYLOAD
      // ===================================================

      const payload = {

        accessionNumber:
          accession,

        name,

        artifactName:
          name,

        categoryId:
          selectedCategoryId,

        category:
          selectedCategory.name,

        categoryName:
          selectedCategory.name,

        description,

        historicalBackground:
          historicalBackground.value
            .trim(),

        origin:
          origin.value
            .trim(),

        dateAcquired:
          dateAcquired.value,

        condition:
          conditionValue,

        currentLocation:
          currentLocation.value
            .trim(),

        status:
          artifactStatus.value ||
          "Active",

        remarks:
          remarks.value
            .trim(),

        // COMPRESSED IMAGE STORED
        // DIRECTLY IN FIRESTORE

        imageData:
          finalImageData,

        // Backward compatibility

        imageUrl:
          finalLegacyImageUrl,

        imagePath:
          finalLegacyImagePath,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          auth.currentUser.uid,

        updatedByName:
          currentProfile.fullName ||
          "Museo User"

      };


      // ===================================================
      // UPDATE
      // ===================================================

      if (editingId) {

        await updateDoc(
          artifactReference,
          payload
        );


        await logActivity(
          "Updated artifact",
          `${accession} - ${name}`
        );


        showFormMessage(
          "Artifact record updated successfully.",
          "success"
        );

      }


      // ===================================================
      // CREATE
      // ===================================================

      else {

        await setDoc(
          artifactReference,
          {

            ...payload,

            createdAt:
              serverTimestamp(),

            createdBy:
              auth.currentUser.uid,

            createdByName:
              currentProfile.fullName ||
              "Museo User"

          }
        );


        await logActivity(
          "Added artifact",
          `${accession} - ${name}`
        );


        showFormMessage(
          "Artifact record added successfully.",
          "success"
        );

      }


      await loadArtifacts();


      setTimeout(
        () => {

          closeArtifactFormModal();

        },
        500
      );


    } catch (error) {

      console.error(
        "SAVE ARTIFACT ERROR:",
        error
      );


      let message =
        "Unable to save the artifact record. Please try again.";


      if (
        error.code ===
        "permission-denied"
      ) {

        message =
          "Permission denied by Firestore. Please check your Firestore security rules.";

      }


      if (
        error.code ===
        "unavailable"
      ) {

        message =
          "Firebase is currently unavailable. Please check your internet connection.";

      }


      if (
        String(
          error.message || ""
        ).toLowerCase()
          .includes(
            "maximum"
          )
      ) {

        message =
          "The record is too large. Please select a smaller artifact image.";

      }


      showFormMessage(
        message,
        "error"
      );


    } finally {

      saveArtifact.disabled =
        false;


      saveArtifact.textContent =
        artifactId.value
          ? "Update Artifact"
          : "Save Artifact";

    }

  }
);


// =========================================================
// ARCHIVE / RESTORE
// =========================================================

async function toggleArchive(
  artifact
) {

  const currentlyArchived =
    artifact.status ===
    "Archived";


  const newStatus =
    currentlyArchived
      ? "Active"
      : "Archived";


  const actionWord =
    currentlyArchived
      ? "restore"
      : "archive";


  const confirmed =
    confirm(
      `Are you sure you want to ${actionWord} "${artifact.name}"?`
    );


  if (!confirmed) {

    return;

  }


  try {

    await updateDoc(
      doc(
        db,
        "artifacts",
        artifact.id
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
          "Museo User"

      }
    );


    await logActivity(
      currentlyArchived
        ? "Restored artifact"
        : "Archived artifact",

      `${artifact.accessionNumber || ""} - ${artifact.name || ""}`
    );


    await loadArtifacts();


  } catch (error) {

    console.error(
      "Archive artifact error:",
      error
    );


    alert(
      "Unable to update the artifact status."
    );

  }

}


// =========================================================
// PERMANENT DELETE
// =========================================================

async function permanentlyDeleteArtifact(
  artifact
) {

  if (
    currentProfile?.role !==
    "admin"
  ) {

    alert(
      "Only the Administrator can permanently delete artifact records."
    );

    return;

  }


  const confirmed =
    confirm(
      `Permanently delete "${artifact.name}"?\n\nThis action cannot be undone. Consider archiving the record instead.`
    );


  if (!confirmed) {

    return;

  }


  try {

    await deleteDoc(
      doc(
        db,
        "artifacts",
        artifact.id
      )
    );


    await logActivity(
      "Deleted artifact",

      `${artifact.accessionNumber || ""} - ${artifact.name || ""}`
    );


    await loadArtifacts();


  } catch (error) {

    console.error(
      "Delete artifact error:",
      error
    );


    alert(
      "Unable to permanently delete the artifact record."
    );

  }

}


// =========================================================
// VIEW ARTIFACT
// =========================================================

function openViewArtifact(
  artifact
) {

  if (!viewArtifactModal) {

    return;

  }


  viewArtifactName.textContent =
    artifact.name ||
    artifact.artifactName ||
    "Untitled Artifact";


  viewAccession.textContent =
    artifact.accessionNumber
      ? `Accession No. ${artifact.accessionNumber}`
      : "No accession number";


  setText(
    viewCategory,
    artifact.category ||
    artifact.categoryName
  );


  setText(
    viewCondition,
    artifact.condition
  );


  setText(
    viewStatus,
    artifact.status
  );


  setText(
    viewDateAcquired,
    artifact.dateAcquired
  );


  setText(
    viewOrigin,
    artifact.origin
  );


  setText(
    viewLocation,
    artifact.currentLocation
  );


  setText(
    viewDescription,
    artifact.description
  );


  setText(
    viewHistory,
    artifact.historicalBackground
  );


  setText(
    viewRemarks,
    artifact.remarks
  );


  setText(
    viewCreatedBy,
    artifact.createdByName
  );


  setText(
    viewUpdatedBy,

    artifact.updatedByName ||
    artifact.createdByName
  );


  const imageSource =
    getArtifactImageSource(
      artifact
    );


  if (
    imageSource &&
    viewArtifactImage
  ) {

    viewArtifactImage.src =
      imageSource;


    viewArtifactImage.alt =
      artifact.name ||
      artifact.artifactName ||
      "Artifact image";


    viewArtifactImage.style.display =
      "block";


    if (
      viewImagePlaceholder
    ) {

      viewImagePlaceholder.style.display =
        "none";

    }

  } else {

    if (
      viewArtifactImage
    ) {

      viewArtifactImage.removeAttribute(
        "src"
      );


      viewArtifactImage.style.display =
        "none";

    }


    if (
      viewImagePlaceholder
    ) {

      viewImagePlaceholder.style.display =
        "grid";

    }

  }


  viewArtifactModal.classList.add(
    "show"
  );

}


// =========================================================
// CLOSE VIEW MODAL
// =========================================================

closeViewModal?.addEventListener(
  "click",
  () => {

    viewArtifactModal.classList.remove(
      "show"
    );

  }
);


viewArtifactModal?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      viewArtifactModal
    ) {

      viewArtifactModal.classList.remove(
        "show"
      );

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

  if (!artifactFormMessage) {

    return;

  }


  artifactFormMessage.textContent =
    message;


  artifactFormMessage.className =
    `form-message show ${type}`;

}


function clearFormMessage() {

  if (!artifactFormMessage) {

    return;

  }


  artifactFormMessage.textContent =
    "";


  artifactFormMessage.className =
    "form-message";

}


// =========================================================
// TIMESTAMP
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
      value
    );


  return div.innerHTML;

}


function escapeAttribute(
  value
) {

  return String(
    value
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

    }

  }
);


// =========================================================
// AUTH GUARD
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

        throw new Error(
          "ACCOUNT_INACTIVE"
        );

      }


      if (
        ![
          "admin",
          "staff"
        ].includes(
          currentProfile.role
        )
      ) {

        throw new Error(
          "ROLE_NOT_ALLOWED"
        );

      }


      displayUser(
        currentProfile
      );


      await Promise.all([
        loadCategories(),
        loadArtifacts()
      ]);


      if (artifactImage) {

        artifactImage.disabled =
          false;

      }


      showNoImageSelected();


      updateRemoveImageButton();


      if (pageLoader) {

        pageLoader.classList.add(
          "hide"
        );

      }


    } catch (error) {

      console.error(
        "Artifact module initialization error:",
        error
      );


      if (
        error.code ===
          "permission-denied" ||
        error.code ===
          "unavailable"
      ) {

        if (pageLoader) {

          pageLoader.classList.add(
            "hide"
          );

        }


        return;

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