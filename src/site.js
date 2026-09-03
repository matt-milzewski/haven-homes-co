const body = document.body;
const menuButton = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");

if (menuButton && menu) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    body.classList.remove("nav-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menu.classList.toggle("is-open", !isOpen);
    body.classList.toggle("nav-open", !isOpen);
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      menuButton.focus();
    }
  });
}

document.querySelectorAll("[data-year]").forEach((item) => {
  item.textContent = String(new Date().getFullYear());
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll("[data-reveal]");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const form = document.querySelector("[data-enquiry-form]");

if (form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector("[data-form-status]");
  const startedAt = form.querySelector('input[name="_startedAt"]');
  const service = form.querySelector('select[name="service"]');
  const requestedService = new URLSearchParams(window.location.search).get("service");
  const idempotency = form.querySelector('input[name="_idempotencyKey"]');
  const turnstileToken = form.querySelector('input[name="_turnstileToken"]');
  const turnstileContainer = form.querySelector("[data-turnstile]");
  const turnstileSiteKey = body.dataset.turnstileSiteKey?.trim() || "";
  let turnstileWidgetId;

  if (startedAt) {
    startedAt.value = String(Date.now());
  }

  if (idempotency) {
    idempotency.value = crypto.randomUUID
      ? crypto.randomUUID()
      : "form_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  }

  if (turnstileSiteKey && turnstileContainer) {
    const challengeScript = document.createElement("script");
    challengeScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    challengeScript.async = true;
    challengeScript.defer = true;
    challengeScript.addEventListener("load", () => {
      turnstileWidgetId = window.turnstile.render(turnstileContainer, {
        sitekey: turnstileSiteKey,
        action: "contact_submit",
        callback: (token) => { turnstileToken.value = token; },
        "expired-callback": () => { turnstileToken.value = ""; },
        "error-callback": () => { turnstileToken.value = ""; },
      });
    });
    document.head.appendChild(challengeScript);
  }

  if (
    service &&
    requestedService &&
    [...service.options].some((option) => option.value === requestedService)
  ) {
    service.value = requestedService;
  }

  const setStatus = (message, state = "") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const apiBase = body.dataset.formsApiBase?.trim();
    if (!apiBase) {
      setStatus("The enquiry service is being connected. Please try again shortly.", "error");
      return;
    }

    if (turnstileSiteKey && !turnstileToken.value) {
      setStatus("Please complete the anti-spam check before sending.", "error");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    setStatus("Sending your enquiry…");

    try {
      const response = await fetch(
        `${apiBase.replace(/\/$/, "")}/api/forms/haven-homes-co`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.accepted !== true || !result.submissionId) {
        const submissionError = new Error(result.error || "Request failed with status " + response.status);
        // Preserve the key for pending/5xx delivery states so retries resume the
        // same durable submission rather than creating another email side effect.
        submissionError.rotateIdempotency = response.status < 500 && !result.pending;
        throw submissionError;
      }

      setStatus("Thank you. Your enquiry has been sent.", "success");
      window.location.assign("/thank-you/");
    } catch (error) {
      console.error("Unable to submit enquiry", error);
      setStatus(
        error.message || "We couldn’t send that just now. Please check your details and try again.",
        "error",
      );
      if (turnstileToken) turnstileToken.value = "";
      if (idempotency && error.rotateIdempotency) {
        idempotency.value = crypto.randomUUID
          ? crypto.randomUUID()
          : "form_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      }
      if (window.turnstile && turnstileWidgetId !== undefined) {
        window.turnstile.reset(turnstileWidgetId);
      }
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
    }
  });
}
