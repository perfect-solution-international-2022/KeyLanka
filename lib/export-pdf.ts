export interface PdfColumn {
  key: string;
  label: string;
  width: number;
  align?: "left" | "right";
}

export interface PdfSection {
  title: string;
  columns: PdfColumn[];
  rows: Record<string, string | number | null | undefined>[];
}

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ROW_HEIGHT = 18;

function cleanText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function fitText(value: unknown, width: number, fontSize = 8): string {
  const text = cleanText(value);
  const maxChars = Math.max(1, Math.floor((width - 8) / (fontSize * 0.52)));
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(1, maxChars - 3))}...`;
}

function textCommand(
  value: unknown,
  x: number,
  y: number,
  size: number,
  color = "0.12 0.16 0.22",
  font = "F1"
) {
  return `BT /${font} ${size} Tf ${color} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${cleanText(value)}) Tj ET`;
}

function rightAlignedX(value: unknown, rightEdge: number, fontSize: number) {
  return rightEdge - cleanText(value).length * fontSize * 0.52;
}

export function buildReportPdf(title: string, sections: PdfSection[], generatedAt = new Date()): Uint8Array {
  const pages: string[] = [];
  let commands: string[] = [];
  let y = 0;
  let rowIndex = 0;

  function startPage() {
    commands = [
      "q 0.91 0.25 0.05 rg 0 555 842 40 re f Q",
      textCommand("KEYLANKA", MARGIN, 570, 15, "1 1 1", "F2"),
      textCommand(title, MARGIN, 527, 18, "0.08 0.12 0.18", "F2"),
      textCommand(
        `Generated ${generatedAt.toLocaleDateString("en-CA")} ${generatedAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        MARGIN,
        509,
        8,
        "0.42 0.46 0.52"
      ),
      "q 0.88 0.89 0.91 RG 36 498 m 806 498 l S Q",
    ];
    y = 478;
    rowIndex = 0;
  }

  function finishPage() {
    const pageNumber = pages.length + 1;
    commands.push("q 0.88 0.89 0.91 RG 36 29 m 806 29 l S Q");
    commands.push(textCommand("KeyLanka Admin Reports", MARGIN, 16, 7, "0.48 0.52 0.58"));
    commands.push(textCommand(`Page ${pageNumber}`, 770, 16, 7, "0.48 0.52 0.58"));
    pages.push(commands.join("\n"));
  }

  function ensureSpace(height: number) {
    if (y - height < 38) {
      finishPage();
      startPage();
      return true;
    }
    return false;
  }

  function drawTableHeader(columns: PdfColumn[]) {
    commands.push(`q 0.12 0.16 0.22 rg ${MARGIN} ${y - 16} ${CONTENT_WIDTH} 18 re f Q`);
    let x = MARGIN;
    for (const column of columns) {
      const label = fitText(column.label, column.width, 8);
      const labelX =
        column.align === "right"
          ? rightAlignedX(label, x + column.width - 4, 8)
          : x + 4;
      commands.push(textCommand(label, labelX, y - 12, 8, "1 1 1", "F2"));
      x += column.width;
    }
    y -= ROW_HEIGHT;
  }

  function drawRow(columns: PdfColumn[], row: PdfSection["rows"][number]) {
    if (rowIndex % 2 === 1) {
      commands.push(`q 0.965 0.97 0.98 rg ${MARGIN} ${y - 16} ${CONTENT_WIDTH} 18 re f Q`);
    }
    let x = MARGIN;
    for (const column of columns) {
      const value = fitText(row[column.key], column.width, 8);
      const valueX =
        column.align === "right"
          ? rightAlignedX(value, x + column.width - 4, 8)
          : x + 4;
      commands.push(textCommand(value, valueX, y - 12, 8));
      x += column.width;
    }
    commands.push(`q 0.9 0.91 0.93 RG ${MARGIN} ${y - 16} m ${MARGIN + CONTENT_WIDTH} ${y - 16} l S Q`);
    y -= ROW_HEIGHT;
    rowIndex += 1;
  }

  startPage();

  for (const section of sections) {
    ensureSpace(48);
    commands.push(textCommand(section.title, MARGIN, y, 11, "0.12 0.16 0.22", "F2"));
    y -= 20;
    drawTableHeader(section.columns);

    if (section.rows.length === 0) {
      drawRow(section.columns, { [section.columns[0]?.key ?? "value"]: "No data available" });
    } else {
      for (const row of section.rows) {
        const pageChanged = ensureSpace(ROW_HEIGHT);
        if (pageChanged) {
          commands.push(textCommand(`${section.title} - continued`, MARGIN, y, 10, "0.12 0.16 0.22", "F2"));
          y -= 18;
          drawTableHeader(section.columns);
        }
        drawRow(section.columns, row);
      }
    }
    y -= 14;
  }

  finishPage();

  const objects: string[] = [""];
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  pages.forEach((content, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    const contentLength = new TextEncoder().encode(content).length;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`;
  });

  const encoder = new TextEncoder();
  let pdf = "%PDF-1.4\n%KeyLanka\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = encoder.encode(pdf).length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

export function exportToPdf(filename: string, title: string, sections: PdfSection[]) {
  const bytes = buildReportPdf(title, sections);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
