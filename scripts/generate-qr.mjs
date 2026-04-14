import QRCode from "qrcode";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://lobby-day-companion.vercel.app";
const YEAR = new Date().getFullYear();

const ORGS = [
  { key: "AMVETS", folder: "AMVETS" },
  { key: "AL", folder: "American Legion" },
  { key: "CSCVC", folder: "CSCVC" },
  { key: "MOAA", folder: "MOAA" },
  { key: "VVA", folder: "VVA" },
];

const ONEDRIVE_BASE =
  "C:/Users/sethr/OneDrive - water-warrior.com/RGR/01 Clients";
const PROJECT_OUT = path.resolve("qr-output");

await fs.mkdir(PROJECT_OUT, { recursive: true });

const QR_OPTS = {
  errorCorrectionLevel: "M",
  type: "png",
  width: 1024,
  margin: 2,
  color: { dark: "#1e40af", light: "#ffffff" },
};

for (const org of ORGS) {
  const url = `${BASE_URL}/?org=${org.key}`;
  const filename = `LobbyDay-QR-${org.key}-${YEAR}.png`;

  const projectPath = path.join(PROJECT_OUT, filename);
  await QRCode.toFile(projectPath, url, QR_OPTS);
  console.log(`✓ ${projectPath}`);

  const onedrivePath = path.join(ONEDRIVE_BASE, org.folder, filename);
  await fs.mkdir(path.dirname(onedrivePath), { recursive: true });
  await QRCode.toFile(onedrivePath, url, QR_OPTS);
  console.log(`✓ ${onedrivePath}`);
}

console.log(`\nDone. Generated ${ORGS.length} QR codes (10 files total).`);
