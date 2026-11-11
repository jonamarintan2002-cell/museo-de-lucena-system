// =========================================================
// MUSEO DE LUCENA
// ARTIFACT RECORD MANAGEMENT
// FIRESTORE + COMPRESSED IMAGE VERSION
// NO FIREBASE STORAGE REQUIRED
//
// FAST VERSION:
// - Maliit na thumbnail (thumbData) ang nasa artifact document
// - Ang buong larawan ay nasa collection na "artifact_images"
//   at kinukuha lang kapag binuksan ang View
// - Sabay na kinukuha ang profile, categories, at artifacts
// - May "Optimize images" button (admin) para ilipat ang mga
//   lumang larawan na nasa loob pa ng artifact document
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
  deleteField,
  doc,
  getDoc,
  getDocs,
  getDocsFromCache,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// IMAGE SETTINGS
// =========================================================

// Maximum original file selected by user
const MAX_IMAGE_SIZE =
  20 * 1024 * 1024;


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
const TARGET_DATA_URL_LENGTH =
  180000;


// ADDED: laki ng thumbnail na nasa artifact document
const THUMBNAIL_DIMENSION =
  220;


// ADDED: hiwalay na collection para sa buong larawan
const IMAGE_COLLECTION =
  "artifact_images";


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile = null;

let artifacts = [];

let categories = [];


// Existing saved image (old style: nasa loob ng artifact document)
let existingImageData = "";


// ADDED: existing thumbnail (bagong style)
let existingThumbData = "";


// Backward compatibility with old Storage records
let existingImageUrl = "";

let existingImagePath = "";


// Newly selected compressed image
let selectedImageData = "";


// Image processing status
let imageProcessing = false;


// Existing image removed / replaced
let imageMarkedForRemoval = false;


// ADDED: para sa async na pag-load ng buong larawan sa View
let viewRequestToken = 0;


// ADDED: status ng image optimizer
let optimizingImages = false;


// =========================================================
// ADDED (1/7): IMAGE EDITOR + LIGHTBOX STATE
// =========================================================

// Cropper instance (image editor)
let cropper = null;


// Cache ng buong larawan para hindi paulit-ulit ang Firestore read
const fullImageCache = new Map();


// Para hindi magkapalit ang larawan sa lightbox
let lightboxToken = 0;


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
// ADDED (2/7): EDIT IMAGE / CROP MODAL / LIGHTBOX ELEMENTS
// =========================================================

const editImageButton =
  document.getElementById(
    "editImageButton"
  );


const cropModal =
  document.getElementById(
    "cropModal"
  );


const cropImage =
  document.getElementById(
    "cropImage"
  );


const cropApply =
  document.getElementById(
    "cropApply"
  );


const cropCancel =
  document.getElementById(
    "cropCancel"
  );


const cropClose =
  document.getElementById(
    "cropClose"
  );


const lightbox =
  document.getElementById(
    "lightbox"
  );


const lightboxImage =
  document.getElementById(
    "lightboxImage"
  );


const lightboxClose =
  document.getElementById(
    "lightboxClose"
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

function applyArtifactsSnapshot(snapshot) {

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

  refreshOptimizeButton();

}


async function loadArtifacts() {

  // 1. ADDED: ipakita agad ang laman ng lokal na cache (kung meron)

  try {

    const cachedSnapshot =
      await getDocsFromCache(
        collection(
          db,
          "artifacts"
        )
      );


    if (!cachedSnapshot.empty) {

      applyArtifactsSnapshot(
        cachedSnapshot
      );

    }

  } catch (_) {

    // Walang cache pa; ituloy sa server.

  }


  // 2. Kunin ang pinakabago mula sa server

  const snapshot =
    await getDocs(
      collection(
        db,
        "artifacts"
      )
    );


  applyArtifactsSnapshot(
    snapshot
  );

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
// GET ARTIFACT IMAGE SOURCE (PARA SA TABLE: THUMBNAIL MUNA)
// =========================================================

function getArtifactImageSource(
  artifact
) {

  return (
    artifact.thumbData ||
    artifact.imageData ||
    artifact.imageUrl ||
    ""
  );

}


// =========================================================
// SHOW TABLE ERROR
// =========================================================

function showTableError(message) {

  if (!artifactTableBody) {

    return;

  }


  artifactTableBody.innerHTML = `
    <tr>

      <td colspan="7">

        <div class="empty-state">

          <div class="empty-symbol">
            !
          </div>

          <h3>
            Unable to load records
          </h3>

          <p>
            ${escapeHTML(message)}
          </p>

        </div>

      </td>

    </tr>
  `;

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


  existingThumbData =
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
    existingThumbData ||
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


  // ADDED (3/7): i-enable din ang Edit Image button

  if (editImageButton) {

    editImageButton.disabled =
      !hasImage;

  }

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
// ADDED: CREATE SMALL THUMBNAIL (mga ~10 KB)
// =========================================================

async function createThumbnail(
  source,
  maxDimension = THUMBNAIL_DIMENSION
) {

  const image =
    await loadImage(
      source
    );


  let width =
    image.naturalWidth ||
    image.width;


  let height =
    image.naturalHeight ||
    image.height;


  const scale =
    Math.min(
      1,
      maxDimension /
        Math.max(
          width,
          height
        )
    );


  width =
    Math.max(
      1,
      Math.round(
        width * scale
      )
    );


  height =
    Math.max(
      1,
      Math.round(
        height * scale
      )
    );


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


  return canvas.toDataURL(
    "image/jpeg",
    0.65
  );

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
        `The selected image is larger than ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)} MB. Please choose a smaller image.`,
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
          existingThumbData ||
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
    existingThumbData &&
    !imageMarkedForRemoval
  ) {

    showImagePreview(
      existingThumbData
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
      existingThumbData ||
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
// ADDED (4/7): KUNIN ANG BUONG LARAWAN (may cache)
// =========================================================

async function fetchFullImage(id) {

  if (fullImageCache.has(id)) {

    return fullImageCache.get(id);

  }


  const snapshot =
    await getDoc(
      doc(
        db,
        IMAGE_COLLECTION,
        id
      )
    );


  const data =
    snapshot.exists()
      ? snapshot.data().imageData || ""
      : "";


  if (data) {

    fullImageCache.set(
      id,
      data
    );

  }


  return data;

}


// =========================================================
// ADDED (5/7): IMAGE EDITOR (CROP / ROTATE / ZOOM / FLIP)
// =========================================================

function openCropper(source) {

  if (typeof Cropper === "undefined") {

    showFormMessage(
      "Image editor failed to load. Please refresh the page.",
      "error"
    );

    return;

  }


  cropper?.destroy();

  cropper = null;


  cropImage.onload = () => {

    cropper?.destroy();


    cropper =
      new Cropper(
        cropImage,
        {
          viewMode: 1,
          autoCropArea: 1,
          background: false,
          dragMode: "move",
          responsive: true
        }
      );

  };


  cropImage.src =
    source;


  cropModal.classList.add(
    "show"
  );


  // Balik sa "Free" ang shape

  cropModal
    .querySelectorAll(
      "[data-ratio]"
    )
    .forEach(
      button =>
        button.classList.toggle(
          "active",
          button.dataset.ratio === "NaN"
        )
    );

}


function closeCropper() {

  cropper?.destroy();

  cropper = null;


  cropImage.onload = null;

  cropImage.removeAttribute(
    "src"
  );


  cropModal.classList.remove(
    "show"
  );

}


editImageButton?.addEventListener(
  "click",
  async () => {

    clearFormMessage();


    let source =
      selectedImageData;


    if (
      !source &&
      !imageMarkedForRemoval
    ) {

      source =
        existingImageData;


      // Bagong style: kunin ang buong larawan, hindi thumbnail

      if (
        !source &&
        artifactId.value
      ) {

        const originalText =
          editImageButton.textContent;


        editImageButton.disabled =
          true;


        editImageButton.textContent =
          "Loading...";


        try {

          source =
            await fetchFullImage(
              artifactId.value
            );

        } catch (error) {

          console.error(
            "Unable to load full image:",
            error
          );

        }


        editImageButton.textContent =
          originalText;


        editImageButton.disabled =
          false;

      }


      source =
        source ||
        existingThumbData ||
        existingImageUrl;

    }


    if (!source) {

      return;

    }


    openCropper(
      source
    );

  }
);


// Toolbar buttons (rotate, zoom, flip, reset, shape)

cropModal?.addEventListener(
  "click",
  event => {

    const toolButton =
      event.target.closest(
        "[data-crop]"
      );


    const ratioButton =
      event.target.closest(
        "[data-ratio]"
      );


    if (!cropper) {

      return;

    }


    if (toolButton) {

      switch (
        toolButton.dataset.crop
      ) {

        case "rotate-left":
          cropper.rotate(-90);
          break;

        case "rotate-right":
          cropper.rotate(90);
          break;

        case "zoom-in":
          cropper.zoom(0.15);
          break;

        case "zoom-out":
          cropper.zoom(-0.15);
          break;

        case "flip":
          cropper.scaleX(
            -(cropper.getData().scaleX || 1)
          );
          break;

        case "reset":
          cropper.reset();
          break;

      }

    }


    if (ratioButton) {

      cropper.setAspectRatio(
        Number(
          ratioButton.dataset.ratio
        )
      );


      cropModal
        .querySelectorAll(
          "[data-ratio]"
        )
        .forEach(
          button =>
            button.classList.toggle(
              "active",
              button === ratioButton
            )
        );

    }

  }
);


cropCancel?.addEventListener(
  "click",
  closeCropper
);


cropClose?.addEventListener(
  "click",
  closeCropper
);


// Apply: i-crop, tapos i-compress gamit ang compressImage()

cropApply?.addEventListener(
  "click",
  async () => {

    if (!cropper) {

      return;

    }


    cropApply.disabled =
      true;


    cropApply.textContent =
      "Processing...";


    try {

      const canvas =
        cropper.getCroppedCanvas(
          {
            maxWidth: 2000,
            maxHeight: 2000,
            fillColor: "#ffffff",
            imageSmoothingQuality: "high"
          }
        );


      const blob =
        await new Promise(
          resolve =>
            canvas.toBlob(
              resolve,
              "image/jpeg",
              0.92
            )
        );


      const file =
        new File(
          [blob],
          "edited.jpg",
          {
            type: "image/jpeg"
          }
        );


      const compressed =
        await compressImage(
          file
        );


      selectedImageData =
        compressed;


      imageMarkedForRemoval =
        Boolean(
          existingImageData ||
          existingThumbData ||
          existingImageUrl
        );


      showImagePreview(
        selectedImageData,
        "Edited artifact image"
      );


      updateRemoveImageButton();


      closeCropper();


    } catch (error) {

      console.error(
        "CROP ERROR:",
        error
      );


      closeCropper();


      showFormMessage(
        "Unable to edit this image. If it is an old Storage image, please upload it again.",
        "error"
      );


    } finally {

      cropApply.disabled =
        false;


      cropApply.textContent =
        "Apply";

    }

  }
);


// =========================================================
// ADDED (6/7): LIGHTBOX (CLICK PARA LUMAKI ANG LARAWAN)
// =========================================================

async function openLightbox(
  fallbackSrc,
  id = "",
  needsFull = false
) {

  if (!fallbackSrc) {

    return;

  }


  const token =
    ++lightboxToken;


  lightboxImage.src =
    fallbackSrc;


  lightbox.classList.add(
    "show"
  );


  if (
    !id ||
    !needsFull
  ) {

    return;

  }


  try {

    const full =
      await fetchFullImage(
        id
      );


    if (
      full &&
      token === lightboxToken &&
      lightbox.classList.contains(
        "show"
      )
    ) {

      lightboxImage.src =
        full;

    }

  } catch (error) {

    console.error(
      "Lightbox image error:",
      error
    );

  }

}


function closeLightbox() {

  lightboxToken++;


  lightbox.classList.remove(
    "show"
  );


  lightboxImage.removeAttribute(
    "src"
  );

}


lightbox?.addEventListener(
  "click",
  closeLightbox
);


lightboxClose?.addEventListener(
  "click",
  closeLightbox
);


// ESC key: isara ang lightbox o ang image editor

document.addEventListener(
  "keydown",
  event => {

    if (event.key !== "Escape") {

      return;

    }


    if (
      lightbox?.classList.contains(
        "show"
      )
    ) {

      closeLightbox();

    } else if (
      cropModal?.classList.contains(
        "show"
      )
    ) {

      closeCropper();

    }

  }
);


// Click sa preview ng form (Section 04)

imagePreview?.addEventListener(
  "click",
  event => {

    const image =
      event.target.closest(
        "img"
      );


    if (!image) {

      return;

    }


    const usingThumbOnly =
      !selectedImageData &&
      !existingImageData &&
      existingThumbData &&
      artifactId.value;


    openLightbox(
      image.src,
      artifactId.value,
      Boolean(
        usingThumbOnly
      )
    );

  }
);


// Click sa larawan ng View modal

viewArtifactImage?.addEventListener(
  "click",
  () => {

    openLightbox(
      viewArtifactImage.src
    );

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

    // ADDED (7/7): click sa thumbnail ng table para lumaki

    const thumbImage =
      event.target.closest(
        ".artifact-thumb img"
      );


    if (thumbImage) {

      const row =
        thumbImage.closest(
          "tr"
        );


      const rowId =
        row?.querySelector(
          "[data-id]"
        )?.dataset.id;


      const rowArtifact =
        artifacts.find(
          item =>
            item.id === rowId
        );


      openLightbox(
        thumbImage.src,
        rowId,
        Boolean(
          rowArtifact?.hasImage &&
          !rowArtifact?.imageData
        )
      );

      return;

    }


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


  // Old style: larawan na nasa loob ng artifact document

  existingImageData =
    artifact.imageData ||
    "";


  // New style: thumbnail lang ang nasa artifact document

  existingThumbData =
    artifact.thumbData ||
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


      const imageReference =
        doc(
          db,
          IMAGE_COLLECTION,
          artifactReference.id
        );


      // ===================================================
      // IMAGE FIELDS
      // ===================================================
      // - Bagong larawan: thumbnail sa artifact document,
      //   buong larawan sa artifact_images
      // - Tinanggal na larawan: burahin pareho
      // - Walang binago: huwag galawin ang image fields
      // ===================================================

      let imageFields = {};

      let writeFullImage = false;

      let deleteFullImage = false;


      if (selectedImageData) {

        const thumbnail =
          await createThumbnail(
            selectedImageData
          );


        imageFields = {

          thumbData:
            thumbnail,

          hasImage:
            true,

          imageUrl:
            "",

          imagePath:
            ""

        };


        // Alisin ang lumang larawan na nasa loob
        // ng artifact document (kung meron).

        if (editingId) {

          imageFields.imageData =
            deleteField();

        }


        writeFullImage =
          true;

      }

      else if (
        imageMarkedForRemoval
      ) {

        imageFields = {

          thumbData:
            "",

          hasImage:
            false,

          imageUrl:
            "",

          imagePath:
            ""

        };


        if (editingId) {

          imageFields.imageData =
            deleteField();

        }


        deleteFullImage =
          true;

      }

      else if (!editingId) {

        // Bagong record na walang larawan

        imageFields = {

          thumbData:
            "",

          hasImage:
            false,

          imageUrl:
            "",

          imagePath:
            ""

        };

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

        ...imageFields,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          auth.currentUser.uid,

        updatedByName:
          currentProfile.fullName ||
          "Museo User"

      };


      const batch =
        writeBatch(
          db
        );


      // ===================================================
      // UPDATE
      // ===================================================

      if (editingId) {

        batch.update(
          artifactReference,
          payload
        );

      }


      // ===================================================
      // CREATE
      // ===================================================

      else {

        batch.set(
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

      }


      // ===================================================
      // FULL IMAGE (HIWALAY NA COLLECTION)
      // ===================================================

      if (writeFullImage) {

        batch.set(
          imageReference,
          {

            artifactId:
              artifactReference.id,

            imageData:
              selectedImageData,

            updatedAt:
              serverTimestamp()

          }
        );

      }

      else if (deleteFullImage) {

        batch.delete(
          imageReference
        );

      }


      await batch.commit();


      // ADDED: alisin sa cache para hindi lumang larawan ang lumabas

      fullImageCache.delete(
        artifactReference.id
      );


      await logActivity(
        editingId
          ? "Updated artifact"
          : "Added artifact",

        `${accession} - ${name}`
      );


      showFormMessage(
        editingId
          ? "Artifact record updated successfully."
          : "Artifact record added successfully.",
        "success"
      );


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
          `Permission denied by Firestore. Please check your Firestore security rules (including the "${IMAGE_COLLECTION}" collection).`;

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


    // Burahin din ang buong larawan (kung meron).

    try {

      await deleteDoc(
        doc(
          db,
          IMAGE_COLLECTION,
          artifact.id
        )
      );

    } catch (imageError) {

      console.error(
        "Delete artifact image error:",
        imageError
      );

    }


    // ADDED: alisin din sa cache

    fullImageCache.delete(
      artifact.id
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


  // Una: ipakita ang pinakamabilis na magagamit na larawan.

  const imageSource =
    artifact.imageData ||
    artifact.thumbData ||
    artifact.imageUrl ||
    "";


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


  viewRequestToken++;


  // Pangalawa: kunin sa background ang buong larawan.

  if (
    artifact.hasImage &&
    !artifact.imageData
  ) {

    loadFullImageForView(
      artifact,
      viewRequestToken
    );

  }


  viewArtifactModal.classList.add(
    "show"
  );

}


// =========================================================
// ADDED: LOAD FULL IMAGE FOR VIEW MODAL
// =========================================================

async function loadFullImageForView(
  artifact,
  token
) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          IMAGE_COLLECTION,
          artifact.id
        )
      );


    // Kung ibang artifact na ang nakabukas, huwag nang ipakita.

    if (token !== viewRequestToken) {

      return;

    }


    const fullImage =
      snapshot.exists()
        ? snapshot.data().imageData
        : "";


    if (
      fullImage &&
      viewArtifactImage
    ) {

      viewArtifactImage.src =
        fullImage;


      viewArtifactImage.style.display =
        "block";


      if (
        viewImagePlaceholder
      ) {

        viewImagePlaceholder.style.display =
          "none";

      }

    }

  } catch (error) {

    console.error(
      "Unable to load full artifact image:",
      error
    );

  }

}


// =========================================================
// CLOSE VIEW MODAL
// =========================================================

closeViewModal?.addEventListener(
  "click",
  () => {

    viewRequestToken++;

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

      viewRequestToken++;

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
// ADDED: IMAGE OPTIMIZER (ADMIN ONLY)
// Inililipat ang mga lumang larawan (nasa loob ng artifact
// document) papunta sa "artifact_images" at gumagawa ng
// thumbnail. Isang beses lang ito kailangan.
// =========================================================

function getLegacyImageArtifacts() {

  return artifacts.filter(
    artifact =>
      typeof artifact.imageData ===
        "string" &&
      artifact.imageData.length > 0
  );

}


function refreshOptimizeButton() {

  if (optimizingImages) {

    return;

  }


  const header =
    document.querySelector(
      ".records-header"
    );


  if (!header) {

    return;

  }


  const legacy =
    getLegacyImageArtifacts();


  let button =
    document.getElementById(
      "optimizeImagesButton"
    );


  if (
    currentProfile?.role !==
      "admin" ||
    !legacy.length
  ) {

    button?.remove();

    return;

  }


  if (!button) {

    button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.id =
      "optimizeImagesButton";


    button.className =
      "reset-filter";


    button.style.marginLeft =
      "12px";


    button.addEventListener(
      "click",
      () =>
        optimizeLegacyImages(
          button
        )
    );


    header.appendChild(
      button
    );

  }


  button.textContent =
    `Optimize ${legacy.length} images`;

}


async function optimizeLegacyImages(
  button
) {

  const legacy =
    getLegacyImageArtifacts();


  if (!legacy.length) {

    return;

  }


  const confirmed =
    confirm(
      `Optimize ${legacy.length} artifact images?\n\nThis makes the system much faster. Please keep this page open until it finishes. It is safe to run again if interrupted.`
    );


  if (!confirmed) {

    return;

  }


  optimizingImages =
    true;


  button.disabled =
    true;


  let done = 0;

  let failed = 0;


  // 4 na larawan ang sabay na pinoproseso para mas mabilis.

  const CONCURRENCY =
    4;


  let nextIndex =
    0;


  async function optimizeWorker() {

    while (nextIndex < legacy.length) {

      const artifact =
        legacy[nextIndex++];


      try {

        const thumbnail =
          await createThumbnail(
            artifact.imageData
          );


        const batch =
          writeBatch(
            db
          );


        batch.set(
          doc(
            db,
            IMAGE_COLLECTION,
            artifact.id
          ),
          {

            artifactId:
              artifact.id,

            imageData:
              artifact.imageData,

            updatedAt:
              serverTimestamp()

          }
        );


        batch.update(
          doc(
            db,
            "artifacts",
            artifact.id
          ),
          {

            thumbData:
              thumbnail,

            hasImage:
              true,

            imageData:
              deleteField()

          }
        );


        await batch.commit();


        done++;


      } catch (error) {

        console.error(
          "Optimize image error:",
          artifact.id,
          error
        );


        failed++;

      }


      button.textContent =
        `Optimizing... ${done + failed}/${legacy.length}`;

    }

  }


  await Promise.all(
    Array.from(
      { length: CONCURRENCY },
      optimizeWorker
    )
  );


  optimizingImages =
    false;


  button.disabled =
    false;


  await loadArtifacts();


  alert(
    failed
      ? `Finished. ${done} optimized, ${failed} failed. Check the Firestore rules for "${IMAGE_COLLECTION}", then click the button again.`
      : `Finished. ${done} images optimized.`
  );

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
// ADDED: DATA LOAD ERROR MESSAGE
// =========================================================

function handleDataError(error) {

  console.error(
    "Artifact data loading error:",
    error
  );


  let message =
    "Please check your internet connection and try again.";


  if (
    error?.code ===
    "permission-denied"
  ) {

    message =
      "Permission denied by Firestore. Please check your Firestore security rules.";

  }


  showTableError(
    message
  );

}


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


    // =====================================================
    // ADDED: SIMULAN AGAD ANG PAGKUHA NG DATA
    // Sabay na tumatakbo sa pagkuha ng profile.
    // =====================================================

    const categoriesPromise =
      loadCategories()
        .catch(
          handleDataError
        );


    const artifactsPromise =
      loadArtifacts()
        .catch(
          handleDataError
        );


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


      if (artifactImage) {

        artifactImage.disabled =
          false;

      }


      showNoImageSelected();


      updateRemoveImageButton();


      // Ipakita agad ang page (hindi na hinihintay ang data).

      if (pageLoader) {

        pageLoader.classList.add(
          "hide"
        );

      }


      await Promise.all([
        categoriesPromise,
        artifactsPromise
      ]);


      // I-render ulit para lumabas ang tamang buttons
      // ayon sa role (halimbawa Delete para sa admin).

      if (artifacts.length) {

        applyFilters();

      }


      refreshOptimizeButton();


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