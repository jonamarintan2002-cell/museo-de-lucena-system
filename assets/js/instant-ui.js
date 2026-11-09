// MUSEO DE LUCENA - INSTANT UI (assets/js/instant-ui.js)
// Itinatago ang loading screen at pinapalitan agad ang "Loading..."
// ng pangalan at role mula sa cache ng huling login.

(function () {

  "use strict";

  var PROFILE_KEY = "museo_dashboard_profile_v1";

  // 1. Itago agad ang loading screen
  var style = document.createElement("style");
  style.textContent = ".page-loader,#pageLoader{display:none!important}";
  (document.head || document.documentElement).appendChild(style);

  function formatRole(role) {
    if (role === "admin") { return "Administrator"; }
    if (role === "staff") { return "Museum Staff"; }
    return role || "\u2014";
  }

  function isPlaceholder(element) {
    var text = (element.textContent || "").trim();
    return text === "" || text === "Loading..." || text === "\u2014" || text === "-";
  }

  function fillAll(selectors, value) {
    for (var s = 0; s < selectors.length; s++) {
      var elements = document.querySelectorAll(selectors[s]);
      for (var i = 0; i < elements.length; i++) {
        if (isPlaceholder(elements[i])) { elements[i].textContent = value; }
      }
    }
  }

  // 2. Ipakita agad ang pangalan at role
  function fillUser() {

    var profile = null;

    try {
      profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    } catch (error) {
      profile = null;
    }

    var fullName = (profile && profile.fullName) || "Museo User";
    var role = profile ? formatRole(profile.role) : "\u2014";
    var initial = fullName.trim().charAt(0).toUpperCase() || "M";

    fillAll(["#sidebarUserName", ".sidebar-user-info strong", "#topbarUserName", ".topbar-profile strong"], fullName);
    fillAll(["#sidebarUserRole", ".sidebar-user-info span", "#topbarUserRole", ".topbar-profile span"], role);

    var avatars = document.querySelectorAll("#sidebarAvatar, .sidebar-avatar, #topbarAvatar, .topbar-avatar");
    for (var a = 0; a < avatars.length; a++) {
      if ((avatars[a].textContent || "").trim().length <= 1) { avatars[a].textContent = initial; }
    }

    // Staff: itago ang admin-only na menu
    if (profile && profile.role && profile.role !== "admin") {
      var adminItems = document.querySelectorAll(".admin-only");
      for (var k = 0; k < adminItems.length; k++) { adminItems[k].classList.add("hidden"); }
    }

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fillUser);
  } else {
    fillUser();
  }

})();