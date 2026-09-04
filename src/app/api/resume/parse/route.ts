import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { pathToFileURL } from "url";
import { auth } from "@/lib/auth";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// pdfjs tries to load a worker module that webpack/Turbopack can't resolve
// for its "fake worker" fallback. Point it at the real worker file instead.
const PDF_WORKER_PATH = join(
  process.cwd(),
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
);
PDFParse.setWorker(pathToFileURL(PDF_WORKER_PATH).href);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
  "text/markdown": "txt",
  "application/msword": "docx", // legacy .doc best-effort
};

async function extractPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large — max 10 MB" },
        { status: 413 }
      );
    }

    const kind = ALLOWED[file.type];
    if (!kind) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${file.type}". Upload a PDF, DOCX, or TXT file.`,
        },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (kind === "pdf") {
      text = await extractPdf(buffer);
    } else if (kind === "docx") {
      text = await extractDocx(buffer);
    } else {
      text = buffer.toString("utf-8");
    }

    text = text.replace(/\u0000/g, "").replace(/\n{3,}/g, "\n\n").trim();

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "Could not extract readable text from the file." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type,
      length: text.length,
      text,
    });
  } catch (error) {
    console.error("Resume parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse file" },
      { status: 500 }
    );
  }
}
