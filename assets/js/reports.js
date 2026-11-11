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


    // =====================================================
    // ADDED (1/2): GUMAWA AT I-DOWNLOAD ANG PDF
    // =====================================================

    await downloadReportPdf(
      filteredArtifacts,
      title,
      subtitle
    );


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
// ADDED (2/2): PDF REPORT (jsPDF + AutoTable)
// Ang dalawang library ay ilo-load mula sa cdnjs kapag
// kailangan na, kaya hindi na kailangang baguhin ang
// reports.html.
// =========================================================

const JSPDF_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";


const AUTOTABLE_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";


const scriptPromises =
  {};


function loadExternalScript(
  source
) {

  if (scriptPromises[source]) {

    return scriptPromises[source];

  }


  scriptPromises[source] =
    new Promise(
      (resolve, reject) => {

        const script =
          document.createElement(
            "script"
          );


        script.src =
          source;


        script.onload =
          () => resolve();


        script.onerror =
          () => {

            delete scriptPromises[source];

            reject(
              new Error(
                `Unable to load ${source}`
              )
            );

          };


        document.head.appendChild(
          script
        );

      }
    );


  return scriptPromises[source];

}


async function loadPdfLibraries() {

  if (!window.jspdf) {

    await loadExternalScript(
      JSPDF_URL
    );

  }


  if (
    !window.jspdf?.jsPDF?.API?.autoTable
  ) {

    await loadExternalScript(
      AUTOTABLE_URL
    );

  }

}


// Linisin ang text para hindi masira ang PDF font

function pdfText(
  value
) {

  return String(
    value ?? ""
  )
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "?")
    .trim();

}


function buildPdfFileName(
  title
) {

  const slug =
    String(title || "report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);


  const now =
    new Date();


  const date =
    [
      now.getFullYear(),

      String(
        now.getMonth() + 1
      ).padStart(2, "0"),

      String(
        now.getDate()
      ).padStart(2, "0")
    ].join("-");


  return `Museo-de-Lucena_${slug}_${date}.pdf`;

}


function buildReportPdf(
  records,
  title,
  subtitle
) {

  const { jsPDF } =
    window.jspdf;


  const pdf =
    new jsPDF(
      {
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      }
    );


  const pageWidth =
    pdf.internal.pageSize.getWidth();


  const pageHeight =
    pdf.internal.pageSize.getHeight();


  const margin =
    14;


  const maroon =
    [109, 41, 43];


  const gold =
    [215, 188, 131];


  const generatedBy =
    currentProfile?.fullName ||
    "Museo User";


  const generatedOn =
    new Intl.DateTimeFormat(
      "en-PH",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    ).format(
      new Date()
    );


  // -------------------------------------------------------
  // HEADER BAND
  // -------------------------------------------------------

  pdf.setFillColor(...maroon);

  pdf.rect(
    0,
    0,
    pageWidth,
    28,
    "F"
  );


  pdf.setFillColor(...gold);

  pdf.rect(
    0,
    28,
    pageWidth,
    1.2,
    "F"
  );


  pdf.setTextColor(
    255,
    255,
    255
  );


  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(18);

  pdf.text(
    "MUSEO DE LUCENA",
    margin,
    13
  );


  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(9);

  pdf.text(
    "Artifact Records System",
    margin,
    20
  );


  pdf.setFontSize(8);

  pdf.text(
    "COLLECTION REPORT",
    pageWidth - margin,
    13,
    { align: "right" }
  );


  // -------------------------------------------------------
  // TITLE + DETAILS
  // -------------------------------------------------------

  let y =
    40;


  pdf.setTextColor(
    48,
    38,
    32
  );

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(16);


  const titleLines =
    pdf.splitTextToSize(
      pdfText(title),
      pageWidth - margin * 2
    );


  pdf.text(
    titleLines,
    margin,
    y
  );


  y +=
    titleLines.length * 7;


  pdf.setTextColor(
    110,
    100,
    92
  );

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(9.5);


  const subtitleLines =
    pdf.splitTextToSize(
      pdfText(subtitle),
      pageWidth - margin * 2
    );


  pdf.text(
    subtitleLines,
    margin,
    y
  );


  y +=
    subtitleLines.length * 5 + 2;


  pdf.setFontSize(8.5);

  pdf.text(
    pdfText(
      `Generated on: ${generatedOn}     |     Generated by: ${generatedBy}     |     Total records: ${records.length}`
    ),
    margin,
    y
  );


  y +=
    5;


  // -------------------------------------------------------
  // TABLE
  // -------------------------------------------------------

  const body =
    records.length
      ? records.map(
          artifact => [

            pdfText(
              artifact.accessionNumber ||
              "-"
            ),

            pdfText(
              artifact.name ||
              artifact.artifactName ||
              "Untitled Artifact"
            ),

            pdfText(
              artifact.category ||
              artifact.categoryName ||
              "Uncategorized"
            ),

            pdfText(
              artifact.condition ||
              "Not specified"
            ),

            pdfText(
              artifact.status ||
              "Active"
            ),

            pdfText(
              formatArtifactDate(
                artifact.dateAcquired
              )
            ),

            pdfText(
              artifact.currentLocation ||
              "Not specified"
            )

          ]
        )
      : [
          [
            {
              content:
                "No matching artifact records were found for the selected report criteria.",

              colSpan:
                7,

              styles: {
                halign: "center",
                fontStyle: "italic",
                textColor: [130, 120, 112]
              }
            }
          ]
        ];


  pdf.autoTable(
    {
      startY:
        y,

      margin: {
        left: margin,
        right: margin,
        top: 16,
        bottom: 18
      },

      head: [
        [
          "Accession No.",
          "Artifact Name",
          "Category",
          "Condition",
          "Status",
          "Date Acquired",
          "Current Location"
        ]
      ],

      body,

      theme:
        "grid",

      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 2.2,
        lineColor: [225, 218, 208],
        lineWidth: 0.2,
        textColor: [60, 50, 45],
        overflow: "linebreak",
        valign: "middle"
      },

      headStyles: {
        fillColor: maroon,
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },

      alternateRowStyles: {
        fillColor: [250, 247, 241]
      },

      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 62, fontStyle: "bold" },
        2: { cellWidth: 40 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 30 },
        6: { cellWidth: 61 }
      },

      // Kulay ng Condition at Status

      didParseCell:
        data => {

          if (
            data.section !== "body" ||
            !records.length
          ) {

            return;

          }


          const value =
            String(
              data.cell.text[0] || ""
            ).toLowerCase();


          if (
            data.column.index === 3
          ) {

            if (value === "good") {

              data.cell.styles.textColor =
                [62, 105, 79];

            } else if (value === "poor") {

              data.cell.styles.textColor =
                [150, 61, 66];

            } else {

              data.cell.styles.textColor =
                [146, 101, 46];

            }

            data.cell.styles.fontStyle =
              "bold";

          }


          if (
            data.column.index === 4
          ) {

            data.cell.styles.textColor =
              value === "archived"
                ? [117, 105, 95]
                : [70, 104, 83];

            data.cell.styles.fontStyle =
              "bold";

          }

        }
    }
  );


  // -------------------------------------------------------
  // TOTAL SA DULO
  // -------------------------------------------------------

  let endY =
    pdf.lastAutoTable.finalY + 8;


  if (
    endY > pageHeight - 22
  ) {

    pdf.addPage();

    endY =
      20;

  }


  pdf.setTextColor(
    ...maroon
  );

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(10);

  pdf.text(
    `Total records: ${records.length}`,
    margin,
    endY
  );


  pdf.setTextColor(
    150,
    140,
    132
  );

  pdf.setFont(
    "helvetica",
    "italic"
  );

  pdf.setFontSize(8);

  pdf.text(
    "- End of report -",
    pageWidth - margin,
    endY,
    { align: "right" }
  );


  // -------------------------------------------------------
  // FOOTER SA BAWAT PAGE
  // -------------------------------------------------------

  const pageCount =
    pdf.getNumberOfPages();


  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {

    pdf.setPage(page);


    pdf.setDrawColor(
      225,
      218,
      208
    );

    pdf.setLineWidth(0.3);

    pdf.line(
      margin,
      pageHeight - 12,
      pageWidth - margin,
      pageHeight - 12
    );


    pdf.setTextColor(
      140,
      130,
      122
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(8);


    pdf.text(
      "Museo de Lucena Artifact Records System",
      margin,
      pageHeight - 7
    );


    pdf.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: "right" }
    );

  }


  return pdf;

}


async function downloadReportPdf(
  records,
  title,
  subtitle
) {

  const originalLabel =
    generateReportButton
      ? generateReportButton.textContent
      : "";


  try {

    if (generateReportButton) {

      generateReportButton.disabled =
        true;


      generateReportButton.textContent =
        "Generating PDF...";

    }


    await loadPdfLibraries();


    const pdf =
      buildReportPdf(
        records,
        title,
        subtitle
      );


    // I-download ang PDF.
    // Kung gusto mong magbukas sa bagong tab sa halip,
    // palitan ng:
    // window.open(pdf.output("bloburl"), "_blank");

    pdf.save(
      buildPdfFileName(
        title
      )
    );


  } catch (error) {

    console.error(
      "PDF REPORT ERROR:",
      error
    );


    alert(
      "Unable to create the PDF report. Please check your internet connection and try again."
    );


  } finally {

    if (generateReportButton) {

      generateReportButton.disabled =
        false;


      generateReportButton.textContent =
        originalLabel;

    }

  }

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