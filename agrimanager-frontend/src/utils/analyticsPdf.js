import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DEFAULT_CHART_COLORS = ["#059669", "#0f766e", "#84a98c", "#22c55e", "#14b8a6", "#64748b"];
const DEFAULT_TASK_STATUS_COLORS = {
  PENDING: "#f59e0b",
  COMPLETED: "#10b981",
  UNKNOWN: "#64748b",
};

// Εξάγει αρχείο PDF.
export async function exportAnalyticsPdf({
  elementId = "pdf-export-area",
  filename = "AgriManager_Analytics.pdf",
  cropColors = DEFAULT_CHART_COLORS,
  taskStatusColors = DEFAULT_TASK_STATUS_COLORS,
} = {}) {
  const exportArea = document.getElementById(elementId);
  if (!exportArea) return;

  const previousWidth = exportArea.style.width;
  const previousMinWidth = exportArea.style.minWidth;
  const previousMaxWidth = exportArea.style.maxWidth;
  const previousBackground = exportArea.style.backgroundColor;
  const previousColor = exportArea.style.color;
  const previousPadding = exportArea.style.padding;
  const previousBoxSizing = exportArea.style.boxSizing;

  try {
    exportArea.style.width = "1100px";
    exportArea.style.minWidth = "1100px";
    exportArea.style.maxWidth = "none";
    exportArea.style.padding = "40px";
    exportArea.style.boxSizing = "border-box";
    exportArea.style.backgroundColor = "#ffffff";
    exportArea.style.color = "#0f172a";

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(exportArea, {
      backgroundColor: null,
      logging: false,
      scale: 2,
      useCORS: true,
      width: 1100,
      windowWidth: 1100,
      onclone: (clonedDocument) => {
        const clonedArea = clonedDocument.getElementById(elementId);
        if (!clonedArea) return;
        const problematicColorPattern = /(oklab|oklch)/i;

        // Επιστρέφει εφεδρική τιμή.
        const fallbackForProperty = (propertyName) => {
          const name = propertyName.toLowerCase();

          if (name.includes("background") || name.includes("shadow")) return "#ffffff";
          if (name.includes("border") || name.includes("outline") || name.includes("stroke")) return "#e2e8f0";
          return "#0f172a";
        };

        // Καθαρίζει CSS τιμές.
        const sanitizeStyleDeclaration = (element, styles) => {
          if (!styles) return;

          Array.from(styles).forEach((propertyName) => {
            const value = styles.getPropertyValue(propertyName);
            if (!value || !problematicColorPattern.test(value)) return;

            try {
              element.style.setProperty(
                propertyName,
                fallbackForProperty(propertyName),
                styles.getPropertyPriority(propertyName)
              );
            } catch {
              return;
            }
          });
        };

        // Καθαρίζει CSS τιμές.
        const sanitizeComputedColors = (element) => {
          const styles = clonedDocument.defaultView?.getComputedStyle(element);
          if (!styles) return;

          if (problematicColorPattern.test(styles.color)) {
            element.style.color = "#1e293b";
          }

          if (problematicColorPattern.test(styles.backgroundColor)) {
            element.style.backgroundColor = "#ffffff";
          }

          if (problematicColorPattern.test(styles.borderColor)) {
            element.style.borderColor = "#e2e8f0";
          }
        };

        clonedDocument.documentElement.style.backgroundColor = "#ffffff";
        clonedDocument.body.style.backgroundColor = "#ffffff";

        clonedArea.style.width = "1100px";
        clonedArea.style.minWidth = "1100px";
        clonedArea.style.maxWidth = "none";
        clonedArea.style.padding = "40px";
        clonedArea.style.boxSizing = "border-box";
        clonedArea.style.backgroundColor = "#ffffff";
        clonedArea.style.color = "#0f172a";

        clonedDocument.querySelectorAll("*").forEach((node) => {
          sanitizeStyleDeclaration(node, node.style);
          sanitizeStyleDeclaration(node, clonedDocument.defaultView?.getComputedStyle(node));
          sanitizeComputedColors(node);
        });

        const existingTitle = clonedDocument.querySelector("h1");
        if (existingTitle && !clonedArea.querySelector("[data-pdf-export-title]")) {
          const title = clonedDocument.createElement("h1");
          title.dataset.pdfExportTitle = "true";
          title.textContent = existingTitle.textContent;
          title.style.margin = "0 0 24px";
          title.style.color = "#0f172a";
          title.style.backgroundColor = "#ffffff";
          title.style.fontSize = "36px";
          title.style.fontWeight = "900";
          title.style.lineHeight = "1.15";
          clonedArea.prepend(title);
        }

        clonedArea.querySelectorAll("*").forEach((node) => {
          node.style.color = "#0f172a";
          node.style.borderColor = "#e2e8f0";
          node.style.boxShadow = "none";

          if (!node.closest("svg")) {
            node.style.backgroundColor = "#ffffff";
          }
        });

        clonedArea.querySelectorAll(".recharts-responsive-container, .recharts-wrapper").forEach((node) => {
          if (node.parentElement) {
            node.parentElement.style.height = "auto";
            node.parentElement.style.minHeight = "420px";
            node.parentElement.style.paddingBottom = "36px";
            node.parentElement.style.boxSizing = "border-box";
            node.parentElement.style.overflow = "visible";
          }

          node.style.height = "380px";
          node.style.minHeight = "380px";
          node.style.paddingBottom = "32px";
          node.style.boxSizing = "border-box";
          node.style.overflow = "visible";
        });

        const chartColors = [...cropColors, ...Object.values(taskStatusColors), "#0f172a", "#94a3b8"];
        clonedArea.querySelectorAll("svg").forEach((svg) => {
          svg.style.backgroundColor = "transparent";
          svg.style.overflow = "visible";
          svg.setAttribute("fill", "#ffffff");
          svg.setAttribute("stroke", "#e2e8f0");
        });

        clonedArea.querySelectorAll("svg *").forEach((node, index) => {
          const tagName = node.tagName.toLowerCase();
          const color = chartColors[index % chartColors.length];
          const currentFill = node.getAttribute("fill");
          const currentStroke = node.getAttribute("stroke");
          // Ελέγχει εγκυρότητα.
          const isHexColor = (value) => /^#[0-9a-f]{3,8}$/i.test(value || "");

          node.style.removeProperty("fill");
          node.style.removeProperty("stroke");

          if (tagName === "text" || tagName === "tspan") {
            node.setAttribute("fill", "#0f172a");
            node.setAttribute("stroke", "#ffffff");
            return;
          }

          if (tagName === "line" || tagName === "polyline") {
            node.setAttribute("fill", "#ffffff");
            node.setAttribute("stroke", "#e2e8f0");
            return;
          }

          node.setAttribute("fill", isHexColor(currentFill) ? currentFill : color);
          node.setAttribute("stroke", isHexColor(currentStroke) ? currentStroke : "#ffffff");
        });
      },
    });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 6;
    const imageWidth = pageWidth - margin * 2;
    const imageRatio = canvas.height / canvas.width;
    const imageHeight = imageWidth * imageRatio;

    let remainingHeight = imageHeight;
    let position = margin;

    pdf.addImage(imageData, "PNG", margin, position, imageWidth, imageHeight);
    remainingHeight -= pageHeight - margin * 2;

    while (remainingHeight > 0) {
      position = remainingHeight - imageHeight + margin;
      pdf.addPage();
      pdf.addImage(imageData, "PNG", margin, position, imageWidth, imageHeight);
      remainingHeight -= pageHeight - margin * 2;
    }

    pdf.save(filename);
  } finally {
    exportArea.style.width = previousWidth;
    exportArea.style.minWidth = previousMinWidth;
    exportArea.style.maxWidth = previousMaxWidth;
    exportArea.style.backgroundColor = previousBackground;
    exportArea.style.color = previousColor;
    exportArea.style.padding = previousPadding;
    exportArea.style.boxSizing = previousBoxSizing;
  }
}
