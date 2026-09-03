import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "_site");
const expectedSiteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
const requiredFiles = [
  "index.html",
  "services/index.html",
  "areas/index.html",
  "contact/index.html",
  "thank-you/index.html",
  "404.html",
  "sitemap.xml",
  "robots.txt",
  "assets/styles.css",
  "assets/site.js",
  "assets/images/hero-living-v3.webp",
  "assets/images/haven-homes-social.jpg",
];

for (const file of requiredFiles) {
  await access(path.join(output, file));
}

const pages = requiredFiles.filter((file) => file.endsWith(".html"));
for (const file of pages) {
  const html = await readFile(path.join(output, file), "utf8");
  const problems = [];
  if (!html.includes("<title>")) problems.push("title");
  if (!html.includes('name="description"')) problems.push("description");
  if (!html.includes('rel="canonical"')) problems.push("canonical");
  if (!html.includes("<h1")) problems.push("h1");
  if (!html.includes('lang="en-AU"')) problems.push("language");
  if (expectedSiteUrl && !html.includes(`href="${expectedSiteUrl}`)) {
    problems.push("production canonical domain");
  }
  if (
    !html.includes(
      'Website designed by <a href="https://www.anchorwebco.com.au/">Anchor Web Co.</a>',
    )
  ) {
    problems.push("Anchor Web Co. footer credit");
  }
  if (problems.length) {
    throw new Error(`${file} is missing: ${problems.join(", ")}`);
  }
}

const socialSize = (await stat(path.join(output, "assets/images/haven-homes-social.jpg"))).size;
if (socialSize > 900_000) {
  throw new Error(`Social image is too large: ${socialSize} bytes`);
}

const contact = await readFile(path.join(output, "contact/index.html"), "utf8");
for (const field of ["name", "address", "phone", "email", "service", "message"]) {
  if (!contact.includes(`name="${field}"`)) {
    throw new Error(`Contact form is missing ${field}`);
  }
}

for (const field of ["_idempotencyKey", "_turnstileToken"]) {
  if (!contact.includes(`name="${field}"`)) {
    throw new Error(`Contact form is missing ${field}`);
  }
}

const siteScript = await readFile(path.join(output, "assets/site.js"), "utf8");
if (!siteScript.includes("response.status < 500 && !result.pending")) {
  throw new Error("Contact retries must preserve idempotency for pending and server-error states");
}

if (expectedSiteUrl) {
  for (const file of ["sitemap.xml", "robots.txt"]) {
    const content = await readFile(path.join(output, file), "utf8");
    if (!content.includes(expectedSiteUrl)) {
      throw new Error(`${file} is missing the production domain`);
    }
  }
}

console.log(`Validated ${pages.length} HTML pages and ${requiredFiles.length} required files.`);
