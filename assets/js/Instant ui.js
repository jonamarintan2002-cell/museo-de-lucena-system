// =========================================================
// MUSEO DE LUCENA
// INSTANT UI (shared by all dashboard pages)
// assets/js/instant-ui.js
//
// - Itinatago agad ang loading screen (sa lahat ng page)
// - Pinapalitan agad ang "Loading..." ng pangalan at role
//   mula sa cache ng huling login
// - Hindi ginagalaw ang auth o data loading ng page; ang
//   sariling script ng bawat page ang magpapalit pa rin ng
//   totoong value pagdating ng data.
//
// GAMIT: ilagay sa <head> ng bawat dashboard page, bilang
// NORMAL na script (hindi type="module"):
//
//   <script src="assets/js/instant-ui.js"></script>
// =========================================================

(function () {

  "use strict";

  var PROFILE_KEY =
    "museo_dashboard_profile_v1";


  // -------------------------------------------------------
  // 1. ITAGO AGAD ANG LOADING SCREEN (CSS, hindi na hihintayin
  //    ang pag-load ng body)
  // -------------------------------------------------------

  var style =
    document.createElement("style");

  style.textContent =
    ".page-loader,#pageLoader{display:none!important}";

  (document.head || document.documentElement)
    .appendChild(style);


  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------

  function formatRole(role) {

    if (role === "admin") {
      return "Administrator";
    }

    if (role === "staff") {
      return "Museum Staff";
    }

    return role || "\u2014";

  }


  function isPlaceholder(element) {

    var text =
      (element.textContent || "").trim();

    return (
      text === "" ||
      text === "Loading..." ||
      text === "\u2014" ||
      text === "-"
    );

  }


  function fillAll(selectors, value) {

    for (var s = 0; s < selectors.length; s++) {

      var elements =
        document.querySelectorAll(selectors[s]);

      for (var i = 0; i < elements.length; i++) {

        if (isPlaceholder(elements[i])) {
          elements[i].textContent = value;
        }

      }

    }

  }


  // -------------------------------------------------------
  // 2. IPAKITA AGAD ANG PANGALAN AT ROLE
  // -------------------------------------------------------

  function fillUser() {

    var profile = null;

    try {

      profile = JSON.parse(
        localStorage.getItem(PROFILE_KEY) || "null"
      );

    } catch (error) {
      profile = null;
    }


    var fullName =
      (profile && profile.fullName) ||
      "Museo User";

    var role =
      profile
        ? formatRole(profile.role)
        : "\u2014";

    var initial =
      fullName.trim().charAt(0).toUpperCase() ||
      "M";


    fillAll(
      [
        "#sidebarUserName",
        ".sidebar-user-info strong",
        "#topbarUserName",
        ".topbar-profile strong"
      ],
      fullName
    );

    fillAll(
      [
        "#sidebarUserRole",
        ".sidebar-user-info span",
        "#topbarUserRole",
        ".topbar-profile span"
      ],
      role
    );


    // Avatar (isang titik): papalitan lang kung "M" pa ang default.

    var avatars =
      document.querySelectorAll(
        "#sidebarAvatar, .sidebar-avatar, #topbarAvatar, .topbar-avatar"
      );

    for (var a = 0; a < avatars.length; a++) {

      if (
        (avatars[a].textContent || "").trim().length <= 1
      ) {
        avatars[a].textContent = initial;
      }

    }


    // Staff: itago ang admin-only na menu.

    if (
      profile &&
      profile.role &&
      profile.role !== "admin"
    ) {

      var adminItems =
        document.querySelectorAll(".admin-only");

      for (var k = 0; k < adminItems.length; k++) {
        adminItems[k].classList.add("hidden");
      }

    }

  }


  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      fillUser
    );

  } else {

    fillUser();

  }

})();