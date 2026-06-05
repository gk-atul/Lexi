// Client-side only — uses Packer.toBlob (browser-safe)
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";

interface CrmScores {
  key_hook: number;
  contextualisation: number;
  personalisation: number;
  user_first: number;
  cta_clarity: number;
  positive_tone: number;
  emotional_appeal: number;
  trust_building: number;
}

export interface ExportVariant {
  copy: string;
  crm_scores: CrmScores;
  crm_total: number;
}

export interface ExportOptions {
  channel: string;
  product: string;
  userState?: string;
  context: string;
  variants: ExportVariant[];
}

const CRM_LABELS: Record<string, string> = {
  key_hook: "Key hook",
  contextualisation: "Contextualisation",
  personalisation: "Personalisation",
  user_first: "User-first",
  cta_clarity: "CTA clarity",
  positive_tone: "Positive tone",
  emotional_appeal: "Emotional appeal",
  trust_building: "Trust building",
};

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "E0E0E1" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "EAEAFD", space: 1 } },
    spacing: { before: 320, after: 320 },
    children: [],
  });
}

function crmTable(scores: CrmScores, total: number): Table {
  const scoreRows = Object.entries(scores).map(([key, val]) =>
    new TableRow({
      children: [
        new TableCell({
          borders: BORDERS,
          width: { size: 4800, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          shading: { fill: "FAFAFA", type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [new TextRun({ text: CRM_LABELS[key] ?? key, font: "Arial", size: 18, color: "605F63" })],
            }),
          ],
        }),
        new TableCell({
          borders: BORDERS,
          width: { size: 1560, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: `${val} / 5`,
                  font: "Arial",
                  size: 18,
                  bold: true,
                  color: val >= 4 ? "15803D" : val >= 3 ? "A76406" : "DC2626",
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Total row
  const totalRow = new TableRow({
    children: [
      new TableCell({
        borders: BORDERS,
        width: { size: 4800, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        shading: { fill: "EAEAFD", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "CRM Total", font: "Arial", size: 20, bold: true, color: "141414" })],
          }),
        ],
      }),
      new TableCell({
        borders: BORDERS,
        width: { size: 1560, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        shading: { fill: "EAEAFD", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `${total.toFixed(1)} / 5`,
                font: "Arial",
                size: 20,
                bold: true,
                color: "6841E6",
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return new Table({
    width: { size: 6360, type: WidthType.DXA },
    columnWidths: [4800, 1560],
    rows: [...scoreRows, totalRow],
  });
}

export async function exportToDoc(opts: ExportOptions): Promise<void> {
  const { channel, product, userState, context, variants } = opts;
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const children: (Paragraph | Table)[] = [];

  // ── Title ────────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "ACKO Copy — ", font: "Arial", size: 36, bold: true, color: "141414" }),
        new TextRun({ text: `${channel}`, font: "Arial", size: 36, bold: true, color: "6841E6" }),
      ],
    })
  );

  // ── Meta ─────────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Product: ", font: "Arial", size: 20, bold: true, color: "605F63" }),
        new TextRun({ text: product, font: "Arial", size: 20, color: "141414" }),
        new TextRun({ text: "    Generated: ", font: "Arial", size: 20, bold: true, color: "605F63" }),
        new TextRun({ text: date, font: "Arial", size: 20, color: "141414" }),
      ],
    })
  );

  if (userState) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "User state: ", font: "Arial", size: 20, bold: true, color: "605F63" }),
          new TextRun({ text: userState, font: "Arial", size: 20, color: "141414" }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({ text: "Context: ", font: "Arial", size: 20, bold: true, color: "605F63" }),
        new TextRun({ text: context, font: "Arial", size: 20, color: "141414" }),
      ],
    })
  );

  children.push(divider());

  // ── Variants ─────────────────────────────────────────────────────────────
  variants.forEach((v, i) => {
    // Variant heading
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 160 },
        children: [
          new TextRun({
            text: `Variant ${i + 1}`,
            font: "Arial",
            size: 24,
            bold: true,
            color: "141414",
          }),
        ],
      })
    );

    // Copy body — handle PN headline/body split
    if (channel.toLowerCase().includes("push")) {
      const lines = v.copy.split("\n").filter(Boolean);
      const headline = lines[0] ?? "";
      const body = lines.slice(1).join(" ");

      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Headline  ", font: "Arial", size: 18, bold: true, color: "6841E6" }),
            new TextRun({ text: `(${headline.length}/33)`, font: "Arial", size: 16, color: headline.length > 33 ? "DC2626" : "B7B7B8" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: headline, font: "Arial", size: 22, bold: true, color: "141414" })],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Body  ", font: "Arial", size: 18, bold: true, color: "6841E6" }),
            new TextRun({ text: `(${body.length}/75)`, font: "Arial", size: 16, color: body.length > 75 ? "DC2626" : "B7B7B8" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun({ text: body, font: "Arial", size: 22, color: "141414" })],
        })
      );
    } else {
      // For WA/Email/In-app — render copy as paragraphs split by newlines
      const lines = v.copy.split("\n");
      lines.forEach((line, li) => {
        children.push(
          new Paragraph({
            spacing: { after: line.trim() === "" ? 80 : 120 },
            children: [
              new TextRun({ text: line, font: "Arial", size: 22, color: "141414" }),
            ],
          })
        );
        void li;
      });
      children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }

    // CRM score table
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "CRM Scores", font: "Arial", size: 18, bold: true, color: "605F63" })],
      })
    );
    children.push(crmTable(v.crm_scores, v.crm_total));

    if (i < variants.length - 1) {
      children.push(divider());
    }
  });

  // ── Build + download ─────────────────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 0, after: 120 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const slug = `${channel.replace(/\s+/g, "-").toLowerCase()}-${product.replace(/\s+/g, "-").toLowerCase()}`;
  const filename = `acko-copy-${slug}-${Date.now()}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
