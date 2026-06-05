import fs from "fs";
import path from "path";

const TOV_PATH = path.join(process.cwd(), "data", "active-tov.txt");
const DEFAULT_TOV_PATH = path.join(process.cwd(), "data", "default-tov.txt");

export function getTov(): string {
  if (fs.existsSync(TOV_PATH)) {
    return fs.readFileSync(TOV_PATH, "utf-8");
  }
  return fs.readFileSync(DEFAULT_TOV_PATH, "utf-8");
}

export function saveTov(content: string): void {
  fs.writeFileSync(TOV_PATH, content, "utf-8");
}

export function getTovMeta(): { version: string; updatedAt: string } {
  const metaPath = path.join(process.cwd(), "data", "tov-meta.json");
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  }
  return { version: "Default (ACKO ToV v1)", updatedAt: "Bundled with app" };
}

export function saveTovMeta(version: string): void {
  const metaPath = path.join(process.cwd(), "data", "tov-meta.json");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ version, updatedAt: new Date().toISOString() }),
    "utf-8"
  );
}
