// =========================================================
// MUSEO DE LUCENA
// CATEGORY MANAGEMENT
// assets/js/categories.js
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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// GLOBAL DATA
// =========================================================

let currentProfile = null;

let categories = [];


// =========================================================
// DOM ELEMENTS
// =========================================================

const pageLoader =
  document.getElementById("pageLoader");

const categoryGrid =
  document.getElementById("categoryGrid");

const categoryCount =
  document.getElementById("categoryCount");

const searchCategory =
  document.getElementById("searchCategory");


// =========================================================
// MODAL ELEMENTS
// =========================================================

const categoryModal =
  document.getElementById("categoryModal");

const openAddCategory =
  document.getElementById("openAddCategory");

const closeCategoryModal =
  document.getElementById("closeCategoryModal");

const cancelCategory =
  document.getElementById("cancelCategory");


// =========================================================
// FORM ELEMENTS
// =========================================================

const categoryForm =
  document.getElementById("categoryForm");

const categoryId =
  document.getElementById("categoryId");

const categoryName =
  document.getElementById("categoryName");

const categoryDescription =
  document.getElementById("categoryDescription");

const modalTitle =
  document.getElementById("modalTitle");

const saveCategory =
  document.getElementById("saveCategory");

const formMessage =
  document.getElementById("formMessage");


// =========================================================
// SIDEBAR
// =========================================================

const sidebar =
  document.getElementById("sidebar");

const sidebarOverlay =
  document.getElementById("sidebarOverlay");

const menuButton =
  document.getElementById("menuButton");

const logoutButton =
  document.getElementById("logoutButton");


// =========================================================
// GET CURRENT USER PROFILE
// =========================================================

async function getUserProfile(uid) {

  const userReference =
    doc(
      db,
      "users",
      uid
    );


  const userSnapshot =
    await getDoc(
      userReference
    );


  if (!userSnapshot.exists()) {

    throw new Error(
      "PROFILE_NOT_FOUND"
    );

  }


  return {
    id: userSnapshot.id,
    ...userSnapshot.data()
  };

}


// =========================================================
// DISPLAY CURRENT USER
// =========================================================

function displayUser(profile) {

  const fullName =
    profile.fullName ||
    "Museo User";


  const formattedRole =
    profile.role === "admin"
      ? "Administrator"
      : "Museum Staff";


  const initial =
    fullName
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
      fullName;

  }


  if (roleElement) {

    roleElement.textContent =
      formattedRole;

  }


  if (avatarElement) {

    avatarElement.textContent =
      initial;

  }


  // STAFF: HIDE ADMIN CONTROLS

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
// SHOW CATEGORY LOADING STATE
// =========================================================

function showCategoryLoading() {

  if (!categoryGrid) {
    return;
  }


  categoryGrid.innerHTML = `
    <div class="empty-state">

      <div class="empty-symbol">
        ...
      </div>

      <h3>
        Loading categories
      </h3>

      <p>
        Retrieving category records...
      </p>

    </div>
  `;

}


// =========================================================
// LOAD CATEGORIES
// =========================================================

async function loadCategories() {

  showCategoryLoading();


  try {

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


    // ALPHABETICAL ORDER

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


    updateCategoryCount();

    renderCategories(
      categories
    );


  } catch (error) {

    console.error(
      "Error loading categories:",
      error
    );


    if (categoryGrid) {

      categoryGrid.innerHTML = `
        <div class="empty-state">

          <div class="empty-symbol">
            !
          </div>

          <h3>
            Unable to load categories
          </h3>

          <p>
            Please check your internet connection
            and Firebase configuration.
          </p>

        </div>
      `;

    }


    throw error;

  }

}


// =========================================================
// UPDATE CATEGORY COUNT
// =========================================================

function updateCategoryCount() {

  if (!categoryCount) {
    return;
  }


  categoryCount.textContent =
    categories.length;

}


// =========================================================
// RENDER CATEGORIES
// =========================================================

function renderCategories(list) {

  if (!categoryGrid) {
    return;
  }


  if (!list.length) {

    const hasSearch =
      searchCategory &&
      searchCategory.value
        .trim() !== "";


    categoryGrid.innerHTML = `
      <div class="empty-state">

        <div class="empty-symbol">
          C
        </div>

        <h3>
          ${
            hasSearch
              ? "No categories found"
              : "No categories yet"
          }
        </h3>

        <p>
          ${
            hasSearch
              ? "No category matches your search."
              : currentProfile?.role === "admin"
                ? "Create the first artifact category using the Add Category button."
                : "Artifact categories created by the Administrator will appear here."
          }
        </p>

      </div>
    `;


    return;

  }


  categoryGrid.innerHTML =
    list
      .map(
        (category, index) => {

          const safeName =
            escapeHTML(
              category.name ||
              "Unnamed Category"
            );


          const safeDescription =
            escapeHTML(
              category.description ||
              "No description provided."
            );


          let categoryActions =
            "";


          if (
            currentProfile?.role ===
            "admin"
          ) {

            categoryActions = `
              <div class="category-actions">

                <button
                  type="button"
                  class="edit-button"
                  data-action="edit"
                  data-id="${category.id}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="delete-button"
                  data-action="delete"
                  data-id="${category.id}"
                >
                  Delete
                </button>

              </div>
            `;

          }


          return `
            <article class="category-card">

              <span class="category-index">
                ${String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}
              </span>

              <h3>
                ${safeName}
              </h3>

              <p>
                ${safeDescription}
              </p>

              ${categoryActions}

            </article>
          `;

        }
      )
      .join("");

}


// =========================================================
// SEARCH CATEGORY
// =========================================================

searchCategory?.addEventListener(
  "input",
  () => {

    const keyword =
      searchCategory.value
        .trim()
        .toLowerCase();


    if (!keyword) {

      renderCategories(
        categories
      );

      return;

    }


    const filteredCategories =
      categories.filter(
        category => {

          const name =
            String(
              category.name ||
              ""
            ).toLowerCase();


          const description =
            String(
              category.description ||
              ""
            ).toLowerCase();


          return (
            name.includes(
              keyword
            ) ||
            description.includes(
              keyword
            )
          );

        }
      );


    renderCategories(
      filteredCategories
    );

  }
);


// =========================================================
// OPEN ADD CATEGORY MODAL
// =========================================================

function openAddCategoryModal() {

  if (
    currentProfile?.role !==
    "admin"
  ) {

    alert(
      "Only the Administrator can create categories."
    );

    return;

  }


  categoryForm?.reset();


  if (categoryId) {

    categoryId.value =
      "";

  }


  if (modalTitle) {

    modalTitle.textContent =
      "Add Category";

  }


  if (saveCategory) {

    saveCategory.textContent =
      "Save Category";

  }


  clearMessage();


  categoryModal?.classList.add(
    "show"
  );


  setTimeout(
    () => {

      categoryName?.focus();

    },
    100
  );

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeModal() {

  categoryModal?.classList.remove(
    "show"
  );


  categoryForm?.reset();


  if (categoryId) {

    categoryId.value =
      "";

  }


  clearMessage();

}


// =========================================================
// MODAL EVENTS
// =========================================================

openAddCategory?.addEventListener(
  "click",
  openAddCategoryModal
);


closeCategoryModal?.addEventListener(
  "click",
  closeModal
);


cancelCategory?.addEventListener(
  "click",
  closeModal
);


categoryModal?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      categoryModal
    ) {

      closeModal();

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
      event.key === "Escape" &&
      categoryModal?.classList.contains(
        "show"
      )
    ) {

      closeModal();

    }

  }
);


// =========================================================
// EDIT / DELETE CATEGORY
// =========================================================

categoryGrid?.addEventListener(
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

      alert(
        "Only the Administrator can manage categories."
      );

      return;

    }


    const documentId =
      button.dataset.id;


    const action =
      button.dataset.action;


    const selectedCategory =
      categories.find(
        category =>
          category.id ===
          documentId
      );


    if (!selectedCategory) {

      console.error(
        "Category not found."
      );

      return;

    }


    // =====================================================
    // EDIT
    // =====================================================

    if (
      action === "edit"
    ) {

      categoryId.value =
        selectedCategory.id;


      categoryName.value =
        selectedCategory.name ||
        "";


      categoryDescription.value =
        selectedCategory.description ||
        "";


      modalTitle.textContent =
        "Edit Category";


      saveCategory.textContent =
        "Update Category";


      clearMessage();


      categoryModal.classList.add(
        "show"
      );


      setTimeout(
        () => {

          categoryName.focus();

        },
        100
      );


      return;

    }


    // =====================================================
    // DELETE
    // =====================================================

    if (
      action === "delete"
    ) {

      const confirmed =
        confirm(
          `Delete category "${selectedCategory.name}"?\n\nThis action cannot be undone.`
        );


      if (!confirmed) {

        return;

      }


      button.disabled =
        true;


      try {

        await deleteDoc(
          doc(
            db,
            "categories",
            selectedCategory.id
          )
        );


        await logActivity(
          "Deleted category",
          `Category: ${selectedCategory.name}`
        );


        await loadCategories();


      } catch (error) {

        console.error(
          "Delete category error:",
          error
        );


        alert(
          "Unable to delete the category. Please try again."
        );


      } finally {

        button.disabled =
          false;

      }

    }

  }
);


// =========================================================
// SAVE / UPDATE CATEGORY
// =========================================================

categoryForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    clearMessage();


    if (
      currentProfile?.role !==
      "admin"
    ) {

      showMessage(
        "Only the Administrator can manage categories.",
        "error"
      );

      return;

    }


    const name =
      categoryName.value.trim();


    const description =
      categoryDescription.value.trim();


    // CATEGORY NAME REQUIRED

    if (!name) {

      showMessage(
        "Category name is required.",
        "error"
      );


      categoryName.focus();

      return;

    }


    // DUPLICATE CHECK

    const duplicate =
      categories.find(
        category => {

          const existingName =
            String(
              category.name ||
              ""
            )
              .trim()
              .toLowerCase();


          return (
            existingName ===
              name.toLowerCase() &&
            category.id !==
              categoryId.value
          );

        }
      );


    if (duplicate) {

      showMessage(
        "A category with this name already exists.",
        "error"
      );

      return;

    }


    const editingId =
      categoryId.value;


    saveCategory.disabled =
      true;


    saveCategory.textContent =
      editingId
        ? "Updating..."
        : "Saving...";


    try {

      // ===================================================
      // UPDATE EXISTING CATEGORY
      // ===================================================

      if (editingId) {

        await updateDoc(
          doc(
            db,
            "categories",
            editingId
          ),
          {
            name,

            description,

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
          "Updated category",
          `Category: ${name}`
        );


        showMessage(
          "Category updated successfully.",
          "success"
        );

      }


      // ===================================================
      // CREATE NEW CATEGORY
      // ===================================================

      else {

        await addDoc(
          collection(
            db,
            "categories"
          ),
          {
            name,

            description,

            createdAt:
              serverTimestamp(),

            createdBy:
              auth.currentUser.uid,

            createdByName:
              currentProfile.fullName ||
              "Museo Administrator"
          }
        );


        await logActivity(
          "Added category",
          `Category: ${name}`
        );


        showMessage(
          "Category added successfully.",
          "success"
        );

      }


      // REFRESH CATEGORY LIST

      await loadCategories();


      setTimeout(
        () => {

          closeModal();

        },
        500
      );


    } catch (error) {

      console.error(
        "Save category error:",
        error
      );


      let message =
        "Unable to save the category. Please try again.";


      if (
        error.code ===
        "permission-denied"
      ) {

        message =
          "Permission denied. Please check your Firestore security rules.";

      }


      showMessage(
        message,
        "error"
      );


    } finally {

      saveCategory.disabled =
        false;


      saveCategory.textContent =
        categoryId.value
          ? "Update Category"
          : "Save Category";

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
          "Museo User",

        userRole:
          currentProfile.role,

        timestamp:
          serverTimestamp()
      }
    );


  } catch (error) {

    // Logging failure should NOT stop
    // category create/update/delete.

    console.error(
      "Activity log error:",
      error
    );

  }

}


// =========================================================
// FORM MESSAGE
// =========================================================

function showMessage(
  message,
  type = "error"
) {

  if (!formMessage) {
    return;
  }


  formMessage.textContent =
    message;


  formMessage.className =
    `form-message show ${type}`;

}


function clearMessage() {

  if (!formMessage) {
    return;
  }


  formMessage.textContent =
    "";


  formMessage.className =
    "form-message";

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

  const temporaryElement =
    document.createElement(
      "div"
    );


  temporaryElement.textContent =
    String(value);


  return temporaryElement.innerHTML;

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
// HIDE FULL-SCREEN LOADER
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

    // =====================================================
    // USER NOT LOGGED IN
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
      // VALIDATE STATUS
      // ===================================================

      if (
        currentProfile.status !==
        "active"
      ) {

        throw new Error(
          "ACCOUNT_INACTIVE"
        );

      }


      // ===================================================
      // VALIDATE ROLE
      // ===================================================

      const allowedRoles = [
        "admin",
        "staff"
      ];


      if (
        !allowedRoles.includes(
          currentProfile.role
        )
      ) {

        throw new Error(
          "ROLE_NOT_ALLOWED"
        );

      }


      // ===================================================
      // DISPLAY CURRENT USER
      // ===================================================

      displayUser(
        currentProfile
      );


      // ===================================================
      // IMPORTANT PERFORMANCE CHANGE
      //
      // User is already authenticated and authorized.
      // Remove the full-screen loader NOW.
      //
      // Do not make the user wait for getDocs(categories).
      // ===================================================

      hidePageLoader();


      // ===================================================
      // LOAD CATEGORIES AFTER PAGE IS VISIBLE
      // ===================================================

      try {

        await loadCategories();


      } catch (categoryError) {

        console.error(
          "Category loading failed:",
          categoryError
        );

      }


    } catch (error) {

      console.error(
        "Category module initialization error:",
        error
      );


      // Invalid user/profile: log out.

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