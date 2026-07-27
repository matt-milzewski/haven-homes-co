import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(root, "_site");
const siteUrl = (process.env.SITE_URL || "http://localhost:4173").replace(/\/$/, "");
const formsApiBase = process.env.ANCHOR_FORMS_API_BASE || "";

const escapeAttribute = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const suburbTags = [
  "Bardon",
  "Paddington",
  "Red Hill",
  "Ashgrove",
  "Newmarket",
  "Kelvin Grove",
  "Spring Hill",
  "Auchenflower",
  "Milton",
  "The Gap",
];

const services = [
  {
    number: "01",
    slug: "domestic",
    title: "Domestic cleaning",
    summary:
      "Thoughtful recurring or one-off cleaning shaped around your home, routines and priorities.",
  },
  {
    number: "02",
    slug: "housekeeping",
    title: "Housekeeping",
    summary:
      "A considered home reset that can extend beyond cleaning to the details that keep life running smoothly.",
  },
  {
    number: "03",
    slug: "organising",
    title: "Home organising",
    summary:
      "Calm, practical systems for kitchens, wardrobes, pantries and everyday spaces.",
  },
  {
    number: "04",
    slug: "bond",
    title: "Bond cleaning",
    summary:
      "A detailed end-of-lease clean with a clear scope, designed to leave the property presentation-ready.",
  },
  {
    number: "05",
    slug: "commercial",
    title: "Commercial cleaning",
    summary:
      "Discreet, consistent care for boutique offices, studios, consulting rooms and small workplaces.",
  },
];

const navItems = [
  ["/", "Home"],
  ["/services/", "Services"],
  ["/areas/", "Areas"],
  ["/contact/", "Contact"],
];

function header(currentPath, inner = false) {
  const nav = navItems
    .map(([href, label]) => {
      const isCurrent = currentPath === href;
      const current = isCurrent ? ' aria-current="page"' : "";
      const cta = label === "Contact" ? " nav-cta" : "";
      return `<a class="nav-link${cta}" href="${href}"${current}>${label}</a>`;
    })
    .join("");

  return `
    <header class="site-header${inner ? " site-header--inner" : ""}">
      <div class="container nav-shell">
        <a class="brand" href="/" aria-label="Haven Homes Co. home">
          Haven Homes Co.
          <small>Beautifully cared for.</small>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" aria-label="Open navigation" data-menu-toggle><span></span></button>
        <nav class="nav" id="site-navigation" aria-label="Primary navigation" data-menu>${nav}</nav>
      </div>
    </header>`;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-brand">Haven Homes Co.</div>
            <p class="footer-tagline">Beautifully cared for homes across Brisbane’s inner west and nearby inner-city suburbs.</p>
          </div>
          <div>
            <p class="footer-title">Explore</p>
            <div class="footer-links">
              <a href="/services/">Services</a>
              <a href="/areas/">Service areas</a>
              <a href="/contact/">Request a quote</a>
            </div>
          </div>
          <div>
            <p class="footer-title">Services</p>
            <div class="footer-links">
              <a href="/services/#domestic">Domestic cleaning</a>
              <a href="/services/#housekeeping">Housekeeping</a>
              <a href="/services/#organising">Home organising</a>
              <a href="/services/#bond">Bond cleaning</a>
              <a href="/services/#commercial">Commercial cleaning</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© <span data-year></span> Haven Homes Co.</span>
          <span>Brisbane, Queensland</span>
        </div>
      </div>
    </footer>`;
}

function layout({
  path: pagePath,
  title,
  description,
  content,
  innerHeader = true,
  noIndex = false,
}) {
  const canonical = `${siteUrl}${pagePath}`;
  const robots = noIndex ? "noindex, follow" : "index, follow";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Haven Homes Co.",
    description:
      "Premium cleaning, housekeeping and home organising across Brisbane’s inner west and nearby inner-city suburbs.",
    url: siteUrl,
    image: `${siteUrl}/assets/images/haven-homes-social.jpg`,
    areaServed: suburbTags.map((name) => ({
      "@type": "Place",
      name: `${name}, Queensland`,
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Home care and cleaning services",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.summary,
        },
      })),
    },
  };

  return `<!doctype html>
<html lang="en-AU">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${escapeAttribute(description)}">
    <meta name="robots" content="${robots}">
    <meta name="theme-color" content="#f7f3ec">
    <link rel="canonical" href="${canonical}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/styles.css">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="en_AU">
    <meta property="og:site_name" content="Haven Homes Co.">
    <meta property="og:title" content="${escapeAttribute(title)}">
    <meta property="og:description" content="${escapeAttribute(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${siteUrl}/assets/images/haven-homes-social.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="628">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
    <script src="/assets/site.js" defer></script>
  </head>
  <body data-forms-api-base="${escapeAttribute(formsApiBase)}">
    <a class="skip-link" href="#main-content">Skip to content</a>
    ${header(pagePath, innerHeader)}
    <main id="main-content">${content}</main>
    ${footer()}
  </body>
</html>`;
}

function homePage() {
  const serviceCards = services
    .map(
      (service) => `
        <article class="service-card" data-reveal>
          <span class="service-number">${service.number}</span>
          <h3>${service.title}</h3>
          <p>${service.summary}</p>
          <a class="text-link" href="/services/#${service.slug}">Discover the service</a>
        </article>`,
    )
    .join("");

  return `
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Premium home care · Brisbane</p>
          <h1>A beautifully cared-for home, without the mental load.</h1>
          <p class="lede">Considered cleaning, housekeeping and home organisation for people who value calm spaces, thoughtful details and a consistently high standard.</p>
          <div class="button-row">
            <a class="button" href="/contact/">Request a tailored quote</a>
            <a class="button button--ghost" href="/services/">Explore our services</a>
          </div>
        </div>
        <div class="hero-media">
          <img src="/assets/images/hero-living-v3.webp" alt="Bright, beautifully presented living room with soft neutral furnishings and natural timber" width="2200" height="1467" fetchpriority="high">
          <div class="hero-note">
            <strong>Brisbane’s inner west</strong>
            <span>Serving Bardon, Paddington, Red Hill, Ashgrove and nearby suburbs.</span>
          </div>
        </div>
      </div>
    </section>

    <div class="service-marquee" aria-label="Services offered">
      <div class="service-marquee-inner container">
        <span>Domestic cleaning</span><span>Housekeeping</span><span>Home organising</span><span>Bond cleaning</span><span>Commercial cleaning</span><span>Brisbane inner west</span>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="intro-grid">
          <div data-reveal>
            <p class="eyebrow">A quieter kind of service</p>
            <h2>Care you can see. Calm you can feel.</h2>
          </div>
          <div class="intro-aside" data-reveal>
            <p class="lede">Haven Homes is for clients who want more than a surface clean. Every service begins with your priorities and ends with the small finishing details that make a home feel settled again.</p>
            <a class="text-link" href="/services/">See how we care for your space</a>
          </div>
        </div>
        <div class="service-grid">${serviceCards}</div>
      </div>
    </section>

    <section class="section section--paper">
      <div class="container standard-grid">
        <div class="image-frame" data-reveal>
          <img src="/assets/images/detail-cleaning-v3.webp" alt="Considered, neutral-toned home cleaning essentials beside a kitchen sink" width="1600" height="1067" loading="lazy">
        </div>
        <div data-reveal>
          <p class="eyebrow">The Haven Standard</p>
          <h2>The difference is in the details.</h2>
          <p class="lede">A premium service should feel considered from the first enquiry to the final room. We work from a clear, tailored scope and pay attention to how the whole space presents—not just the obvious surfaces.</p>
          <ul class="standard-list">
            <li><div><strong>A tailored scope</strong><span>Your priorities, rooms and service rhythm are clarified before work begins.</span></div></li>
            <li><div><strong>Detail-led care</strong><span>Edges, touchpoints, presentation and finishing details receive the same attention as larger tasks.</span></div></li>
            <li><div><strong>A considered finish</strong><span>Rooms are left feeling calm, ordered and ready to enjoy.</span></div></li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section section--dark">
      <div class="container">
        <div class="process-head">
          <div data-reveal>
            <p class="eyebrow">How it works</p>
            <h2>Simple from the start.</h2>
          </div>
          <p class="lede" data-reveal>A clear, personal process that makes it easy to find the right level of care for your home or workplace.</p>
        </div>
        <div class="process-grid">
          <article class="process-step" data-reveal><span class="service-number">01</span><h3>Tell us about your space</h3><p>Share your suburb, service needs and what a beautifully cared-for space means to you.</p></article>
          <article class="process-step" data-reveal><span class="service-number">02</span><h3>Receive a tailored scope</h3><p>We shape the service around the property, priorities and level of support you’re looking for.</p></article>
          <article class="process-step" data-reveal><span class="service-number">03</span><h3>Come home to calm</h3><p>Your space is cared for with a consistent standard and an exacting eye for detail.</p></article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container areas-panel" data-reveal>
        <div class="areas-copy">
          <p class="eyebrow">Local to Brisbane</p>
          <h2>Thoughtful home care, close to home.</h2>
          <p>Haven Homes focuses on Brisbane’s inner west and nearby inner-city suburbs, allowing for a more personal, locally considered service.</p>
          <div class="suburb-cloud">${suburbTags.slice(0, 8).map((suburb) => `<span>${suburb}</span>`).join("")}</div>
          <div class="button-row"><a class="button button--ghost" href="/areas/">View service areas</a></div>
        </div>
        <div class="areas-image">
          <img src="/assets/images/hero-living-v2.webp" alt="Bright, tidy living room with natural textures and a soft green sofa" width="2200" height="1467" loading="lazy">
        </div>
      </div>
    </section>

    <section class="section section--paper">
      <div class="container faq-grid">
        <div data-reveal><p class="eyebrow">Good to know</p><h2>Your questions, considered.</h2></div>
        <div data-reveal>
          <details><summary>Can the service be tailored to my home?</summary><p>Yes. Your priorities, the size and condition of the property, and the type of support you need all inform the scope. The enquiry form is the best place to start.</p></details>
          <details><summary>Do you offer recurring and one-off cleaning?</summary><p>Haven Homes can discuss both ongoing home care and one-off services. Recurring work is ideal for maintaining a consistent finish; one-off work can suit resets, special occasions or changing needs.</p></details>
          <details><summary>What is the difference between cleaning and housekeeping?</summary><p>Cleaning focuses on the cleanliness and presentation of your space. Housekeeping can include a broader reset—such as bed presentation, light tidying and other agreed household details—within a tailored scope.</p></details>
          <details><summary>Do you service my suburb?</summary><p>The primary area includes Bardon, Paddington, Red Hill, Ashgrove, Newmarket, Kelvin Grove and Spring Hill, with nearby suburbs considered by enquiry.</p></details>
        </div>
      </div>
    </section>

    <section class="section section--dark">
      <div class="container final-cta">
        <h2 data-reveal>Let your home feel like a haven again.</h2>
        <div class="button-row" data-reveal><a class="button button--light" href="/contact/">Request a tailored quote</a></div>
      </div>
    </section>`;
}

function servicesPage() {
  const details = [
    {
      id: "domestic",
      number: "01",
      title: "Domestic cleaning",
      copy: "A refined recurring or one-off clean for homes that deserve consistent, detail-led care. The scope is shaped around your property and priorities, from the rooms you use most to the finishing touches that make the whole home feel refreshed.",
      inclusions: ["Kitchen surfaces and presentation", "Bathrooms and wet areas", "Dusting and touchpoints", "Floors throughout", "Bedrooms and living areas", "Agreed finishing details"],
    },
    {
      id: "housekeeping",
      number: "02",
      title: "Housekeeping",
      copy: "For households that need more than a clean. A housekeeping visit can combine core cleaning with an agreed home reset, helping busy homes feel composed and easier to enjoy.",
      inclusions: ["Cleaning within the agreed scope", "Bed presentation", "Light household tidying", "Room-by-room reset", "Kitchen presentation", "Other agreed household details"],
    },
    {
      id: "organising",
      number: "03",
      title: "Home organising",
      copy: "Thoughtful organisation for the spaces that carry the most daily friction. We work toward simple, practical systems that feel natural to maintain—never a showroom solution that stops working once real life begins.",
      inclusions: ["Pantries and kitchen storage", "Wardrobes and linen storage", "Everyday drop zones", "Utility and laundry spaces", "Decluttering support", "Practical category systems"],
    },
    {
      id: "bond",
      number: "04",
      title: "Bond cleaning",
      copy: "A detailed end-of-lease service based on the property and required scope. The focus is a thorough, presentation-ready finish across the home, with expectations clarified before the clean.",
      inclusions: ["Kitchen and appliance exteriors", "Bathrooms and wet areas", "Interior surfaces and touchpoints", "Floors and skirting", "Cupboards where agreed", "Property-specific priorities"],
    },
    {
      id: "commercial",
      number: "05",
      title: "Commercial cleaning",
      copy: "Consistent, discreet care for smaller professional environments where presentation matters. Ideal for boutique offices, consulting rooms, studios and other carefully maintained workplaces.",
      inclusions: ["Work areas and meeting spaces", "Kitchenette and amenities", "High-touch surfaces", "Floors and presentation", "Agreed periodic details", "A scope shaped around operating hours"],
    },
  ];

  return `
    <section class="page-hero page-hero--image">
      <div class="container page-hero-grid">
        <div><p class="eyebrow">Our services</p><h1>Care, tailored to the way you live.</h1></div>
        <div class="page-hero-aside"><p class="lede">From beautifully maintained homes to calm pantries and presentation-ready workplaces, every service is defined by your priorities and delivered with the Haven standard of detail.</p><div class="button-row"><a class="button" href="/contact/">Request a tailored quote</a></div></div>
      </div>
      <img class="wide-image" src="/assets/images/organised-pantry.webp" alt="Beautifully organised kitchen cabinetry in a calm, contemporary home" width="1600" height="1067">
    </section>
    <section class="section section--paper">
      <div class="container">
        ${details
          .map(
            (item) => `<article class="service-detail" id="${item.id}">
              <div class="service-detail-title" data-reveal><span class="service-number">${item.number}</span><h2>${item.title}</h2></div>
              <div class="service-detail-copy" data-reveal><p>${item.copy}</p><ul class="inclusion-grid">${item.inclusions.map((inclusion) => `<li>${inclusion}</li>`).join("")}</ul><a class="text-link" href="/contact/?service=${encodeURIComponent(item.title)}">Enquire about ${item.title.toLowerCase()}</a></div>
            </article>`,
          )
          .join("")}
        <div class="detail-image-pair" data-reveal>
          <img src="/assets/images/bathroom-v2.webp" alt="Bright modern bathroom with a clean, presentation-ready finish" width="1600" height="1067" loading="lazy">
          <img src="/assets/images/commercial-v2.webp" alt="Stylish boutique office meeting area with natural timber and indoor planting" width="1600" height="1067" loading="lazy">
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container standard-banner section--dark">
        <div data-reveal><p class="eyebrow">One standard, every service</p><h2>High standards are built into the process.</h2><p>We clarify priorities before work begins, care for the less obvious details and leave each space feeling thoughtfully finished.</p></div>
        <ul class="standard-list" data-reveal>
          <li><div><strong>Clear expectations</strong><span>A tailored scope keeps priorities and inclusions understood.</span></div></li>
          <li><div><strong>Whole-room thinking</strong><span>We consider how each room feels and presents, not just a checklist of surfaces.</span></div></li>
          <li><div><strong>Careful finishing</strong><span>The final reset is part of the service, helping the space feel calm and complete.</span></div></li>
        </ul>
      </div>
    </section>
    <section class="section section--dark">
      <div class="container final-cta"><h2 data-reveal>Tell us what your space needs.</h2><div class="button-row" data-reveal><a class="button button--light" href="/contact/">Start your enquiry</a></div></div>
    </section>`;
}

function areasPage() {
  const areaDescriptions = {
    Bardon: "Character homes and leafy hillside living, supported with flexible home care.",
    Paddington: "Thoughtful cleaning for cottages, renovated homes and busy inner-city households.",
    "Red Hill": "Detail-led care for character properties and contemporary homes close to the city.",
    Ashgrove: "Recurring and one-off home services for established family homes and apartments.",
    Newmarket: "Premium cleaning and home support for modern townhomes, apartments and houses.",
    "Kelvin Grove": "Considered cleaning for apartments, townhomes, households and small workplaces.",
    "Spring Hill": "Home and boutique commercial care close to Brisbane’s CBD.",
    Auchenflower: "Tailored home care for riverside apartments, Queenslanders and contemporary residences.",
  };

  return `
    <section class="page-hero">
      <div class="container page-hero-grid">
        <div><p class="eyebrow">Service areas</p><h1>Premium cleaning, local to Brisbane.</h1></div>
        <div class="page-hero-aside"><p class="lede">Haven Homes is focused on Brisbane’s inner west and neighbouring inner-city suburbs—bringing considered cleaning, housekeeping and home organisation closer to home.</p><div class="button-row"><a class="button" href="/contact/">Check availability</a></div></div>
      </div>
    </section>
    <section class="section section--paper">
      <div class="container">
        <div class="areas-intro">
          <div data-reveal><p class="eyebrow">Our local focus</p><h2>More personal by design.</h2></div>
          <div data-reveal><p class="lede">A focused service area supports a more consistent, locally responsive service. The primary area centres on Bardon, Paddington, Red Hill and Ashgrove, extending to nearby suburbs including Newmarket, Kelvin Grove, Spring Hill and Auchenflower.</p><p>If you are close to these areas but do not see your suburb below, you are welcome to enquire. Availability is considered based on the service, location and schedule.</p></div>
        </div>
        <div class="area-list">
          ${Object.entries(areaDescriptions).map(([name, copy]) => `<article class="area-card" data-reveal><h3>${name}</h3><p>${copy}</p></article>`).join("")}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container location-note" data-reveal>
        <div><p class="eyebrow">Nearby suburbs</p><h3>Just outside the core area?</h3></div>
        <div><p>Nearby locations such as Milton, The Gap and surrounding inner-west or inner-city suburbs may be considered. Send through your address and preferred service so availability can be assessed accurately.</p><a class="text-link" href="/contact/">Ask about your suburb</a></div>
      </div>
    </section>
    <section class="section section--dark">
      <div class="container final-cta"><h2 data-reveal>Beautifully cared for, right where you live.</h2><div class="button-row" data-reveal><a class="button button--light" href="/contact/">Request a tailored quote</a></div></div>
    </section>`;
}

function contactPage() {
  return `
    <section class="section">
      <div class="container contact-wrap">
        <div class="contact-intro">
          <p class="eyebrow">Request a quote</p>
          <h1>Tell us about your space.</h1>
          <p class="lede">A few details will help shape the right service and scope for your home or workplace.</p>
          <ul class="contact-notes">
            <li><strong>Your space, your priorities</strong>Every enquiry is considered individually.</li>
            <li><strong>Brisbane focused</strong>Serving the inner west and nearby inner-city suburbs.</li>
            <li><strong>No obligation</strong>Start with a simple enquiry and discuss what would suit.</li>
          </ul>
        </div>
        <div class="contact-card">
          <form data-enquiry-form novalidate>
            <div class="form-grid">
              <div class="field"><label for="name">Name <span aria-hidden="true">*</span></label><input id="name" name="name" autocomplete="name" required></div>
              <div class="field"><label for="phone">Phone <span aria-hidden="true">*</span></label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div>
              <div class="field field--full"><label for="email">Email <span aria-hidden="true">*</span></label><input id="email" name="email" type="email" autocomplete="email" required></div>
              <div class="field field--full"><label for="address">Service address <span aria-hidden="true">*</span></label><input id="address" name="address" autocomplete="street-address" required></div>
              <div class="field field--full"><label for="service">Service <span aria-hidden="true">*</span></label><select id="service" name="service" required><option value="">Select a service</option>${services.map((service) => `<option>${service.title}</option>`).join("")}<option>Not sure yet</option></select></div>
              <div class="field field--full"><label for="message">Tell us a little more</label><textarea id="message" name="message" placeholder="Property size, preferred frequency, priorities or anything else that would help…"></textarea></div>
              <div class="form-honeypot" aria-hidden="true"><label for="company">Company</label><input id="company" name="company" tabindex="-1" autocomplete="off"></div>
              <input type="hidden" name="_startedAt" value="">
            </div>
            <div class="form-footer"><p class="form-note">By submitting this form, you agree that Haven Homes Co. may use these details to respond to your enquiry.</p><button class="button" type="submit">Send enquiry</button></div>
            <p class="form-status" data-form-status role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>`;
}

const pages = [
  {
    output: "index.html",
    path: "/",
    title: "Premium House Cleaning Brisbane Inner West | Haven Homes",
    description:
      "Premium domestic cleaning, housekeeping, bond cleaning and home organising in Bardon, Paddington, Red Hill, Ashgrove and Brisbane’s inner west.",
    content: homePage(),
    innerHeader: false,
  },
  {
    output: "services/index.html",
    path: "/services/",
    title: "Cleaning, Housekeeping & Home Organising Brisbane | Haven Homes",
    description:
      "Explore premium domestic cleaning, housekeeping, home organising, bond cleaning and boutique commercial cleaning from Haven Homes Co.",
    content: servicesPage(),
  },
  {
    output: "areas/index.html",
    path: "/areas/",
    title: "House Cleaning Brisbane Inner West | Haven Homes Co.",
    description:
      "Haven Homes Co. serves Bardon, Paddington, Red Hill, Ashgrove, Newmarket, Kelvin Grove, Spring Hill and nearby Brisbane suburbs.",
    content: areasPage(),
  },
  {
    output: "contact/index.html",
    path: "/contact/",
    title: "Request a Cleaning Quote | Haven Homes Co.",
    description:
      "Request a tailored cleaning, housekeeping or home organising quote from Haven Homes Co. in Brisbane.",
    content: contactPage(),
  },
  {
    output: "thank-you/index.html",
    path: "/thank-you/",
    title: "Thank You | Haven Homes Co.",
    description: "Thank you for contacting Haven Homes Co.",
    noIndex: true,
    content: `<section class="thank-you section"><div><p class="eyebrow">Enquiry received</p><h1>Thank you.</h1><p class="lede">Your details have been sent. We’ll use the contact information you provided to follow up about your space.</p><div class="button-row" style="justify-content:center"><a class="button" href="/">Return home</a></div></div></section>`,
  },
  {
    output: "404.html",
    path: "/404.html",
    title: "Page Not Found | Haven Homes Co.",
    description: "The page you requested could not be found.",
    noIndex: true,
    content: `<section class="error-page section"><div><p class="eyebrow">Page not found</p><h1>404</h1><p class="lede">This page seems to have stepped out. Let’s take you back to a beautifully cared-for place.</p><div class="button-row" style="justify-content:center"><a class="button" href="/">Return home</a></div></div></section>`,
  },
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(path.join(root, "public"), outputDir, { recursive: true });
await copySourceAsset("styles.css");
await copySourceAsset("site.js");

for (const page of pages) {
  const target = path.join(outputDir, page.output);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, layout(page), "utf8");
}

const sitemap = pages
  .filter((page) => !page.noIndex && page.path !== "/404.html")
  .map((page) => `  <url><loc>${siteUrl}${page.path}</loc></url>`)
  .join("\n");

await writeFile(
  path.join(outputDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`,
  "utf8",
);
await writeFile(
  path.join(outputDir, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
  "utf8",
);
await writeFile(
  path.join(outputDir, "site.webmanifest"),
  JSON.stringify(
    {
      name: "Haven Homes Co.",
      short_name: "Haven Homes",
      start_url: "/",
      display: "standalone",
      background_color: "#f7f3ec",
      theme_color: "#2f473b",
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`Built ${pages.length} pages for ${siteUrl}`);

async function copySourceAsset(fileName) {
  const content = await readFile(path.join(root, "src", fileName), "utf8");
  const assetDir = path.join(outputDir, "assets");
  await mkdir(assetDir, { recursive: true });
  await writeFile(path.join(assetDir, fileName), content, "utf8");
}
