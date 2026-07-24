(function () {
  var script = document.currentScript;

  if (!script) {
    return;
  }

  var dataset = script.dataset || {};
  var apiUrl = String(dataset.apiUrl || "").trim().replace(/\/+$/, "");

  if (!apiUrl) {
    return;
  }

  var config = {
    apiUrl: apiUrl,
    accent: String(dataset.accent || "#6366f1").trim() || "#6366f1",
    layout: normalizeLayout(dataset.layout),
    limit: parseLimit(dataset.limit),
    title: String(dataset.title || "What our customers say").trim() || "What our customers say",
    theme: dataset.theme === "dark" ? "dark" : "light",
  };

  var mountDiv = document.createElement("div");
  script.insertAdjacentElement("afterend", mountDiv);

  var shadow = mountDiv.attachShadow({ mode: "open" });

  renderLoading();
  fetchTestimonials();

  function normalizeLayout(value) {
    return value === "list" || value === "carousel" ? value : "grid";
  }

  function parseLimit(value) {
    var parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 6;
  }

  function getStyles() {
    return [
      ":host {",
      "  --accent: " + config.accent + ";",
      "  --card-bg: " + (config.theme === "dark" ? "#1f2937" : "#ffffff") + ";",
      "  --surface-bg: " + (config.theme === "dark" ? "#111827" : "#f8fafc") + ";",
      "  --surface-border: " + (config.theme === "dark" ? "#374151" : "#e5e7eb") + ";",
      "  --text: " + (config.theme === "dark" ? "#f9fafb" : "#111827") + ";",
      "  --muted: " + (config.theme === "dark" ? "#9ca3af" : "#6b7280") + ";",
      "  --soft: " + (config.theme === "dark" ? "#d1d5db" : "#374151") + ";",
      "  --subtle: " + (config.theme === "dark" ? "#6b7280" : "#9ca3af") + ";",
      "  color-scheme: " + (config.theme === "dark" ? "dark" : "light") + ";",
      "}",
      "* { box-sizing: border-box; }",
      ".widget-container {",
      "  max-width: 1000px;",
      "  margin: 0 auto;",
      "  padding: 0;",
      "  color: var(--text);",
      "  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;",
      "}",
      ".widget-title {",
      "  margin: 0 0 1.5rem;",
      "  font-size: 1.5rem;",
      "  font-weight: 700;",
      "  line-height: 1.2;",
      "  text-align: center;",
      "}",
      ".grid-layout {",
      "  display: grid;",
      "  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));",
      "  gap: 1rem;",
      "}",
      ".list-layout {",
      "  display: flex;",
      "  flex-direction: column;",
      "  gap: 0.75rem;",
      "}",
      ".card {",
      "  height: 100%;",
      "  padding: 1.25rem;",
      "  border: 1px solid var(--surface-border);",
      "  border-radius: 12px;",
      "  background: var(--card-bg);",
      "  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);",
      "  transition: border-color 0.15s ease, transform 0.15s ease;",
      "}",
      ".card:hover {",
      "  border-color: var(--accent);",
      "  transform: translateY(-1px);",
      "}",
      ".card-header {",
      "  display: flex;",
      "  align-items: center;",
      "  gap: 0.75rem;",
      "  margin-bottom: 0.75rem;",
      "}",
      ".avatar {",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  width: 2.5rem;",
      "  height: 2.5rem;",
      "  border-radius: 999px;",
      "  flex-shrink: 0;",
      "  overflow: hidden;",
      "  background: color-mix(in srgb, var(--accent) 16%, transparent);",
      "  color: var(--accent);",
      "  font-size: 0.875rem;",
      "  font-weight: 600;",
      "}",
      ".avatar img {",
      "  width: 100%;",
      "  height: 100%;",
      "  object-fit: cover;",
      "  border-radius: 999px;",
      "}",
      ".meta { flex: 1; min-width: 0; }",
      ".name {",
      "  color: var(--text);",
      "  font-size: 0.875rem;",
      "  font-weight: 600;",
      "}",
      ".company {",
      "  color: var(--muted);",
      "  font-size: 0.75rem;",
      "  margin-top: 0.125rem;",
      "}",
      ".stars {",
      "  color: var(--accent);",
      "  font-size: 0.875rem;",
      "  letter-spacing: 0.05em;",
      "  margin-bottom: 0.5rem;",
      "}",
      ".text {",
      "  color: var(--soft);",
      "  font-size: 0.875rem;",
      "  line-height: 1.6;",
      "  font-style: italic;",
      "  white-space: pre-wrap;",
      "}",
      ".date {",
      "  color: var(--subtle);",
      "  font-size: 0.75rem;",
      "  margin-top: 0.75rem;",
      "}",
      ".loading, .error, .empty {",
      "  padding: 2rem;",
      "  text-align: center;",
      "  border: 1px dashed var(--surface-border);",
      "  border-radius: 12px;",
      "  background: var(--surface-bg);",
      "}",
      ".loading, .empty { color: var(--subtle); }",
      ".error { color: #ef4444; font-size: 0.875rem; }",
      ".branding {",
      "  margin-top: 1.5rem;",
      "  text-align: center;",
      "  font-size: 0.7rem;",
      "  color: #d1d5db;",
      "}",
      ".branding a {",
      "  color: var(--accent);",
      "  text-decoration: none;",
      "}",
      ".branding a:hover { text-decoration: underline; }",
      ".carousel-shell { position: relative; padding: 0 1rem; }",
      ".carousel-wrapper { overflow: hidden; position: relative; }",
      ".carousel-track {",
      "  display: flex;",
      "  transition: transform 0.4s ease;",
      "  will-change: transform;",
      "}",
      ".carousel-item {",
      "  min-width: 100%;",
      "  flex-shrink: 0;",
      "  padding: 0 0.5rem;",
      "}",
      ".carousel-btn {",
      "  position: absolute;",
      "  top: 50%;",
      "  transform: translateY(-50%);",
      "  width: 2rem;",
      "  height: 2rem;",
      "  border: none;",
      "  border-radius: 999px;",
      "  background: var(--accent);",
      "  color: #ffffff;",
      "  cursor: pointer;",
      "  z-index: 1;",
      "  font-size: 1rem;",
      "  line-height: 1;",
      "  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);",
      "}",
      ".carousel-btn:disabled {",
      "  opacity: 0.4;",
      "  cursor: default;",
      "}",
      ".carousel-prev { left: -0.1rem; }",
      ".carousel-next { right: -0.1rem; }",
      "@media (min-width: 720px) {",
      "  .carousel-item { min-width: 50%; }",
      "}",
      "@media (min-width: 980px) {",
      "  .carousel-item { min-width: 33.3333%; }",
      "}",
      "@media (max-width: 640px) {",
      "  .widget-title { font-size: 1.25rem; }",
      "  .carousel-shell { padding: 0 0.25rem; }",
      "  .carousel-btn { display: none; }",
      "}",
    ].join("");
  }

  function renderLoading() {
    shadow.innerHTML =
      "<style>" +
      getStyles() +
      "</style>" +
      '<div class="widget-container" data-theme="' +
      escapeHtml(config.theme) +
      '" style="--accent: ' +
      escapeHtml(config.accent) +
      ';">' +
      '<div class="loading">Loading testimonials...</div>' +
      "</div>";
  }

  function fetchTestimonials() {
    fetch(config.apiUrl + "/api/testimonials/public?limit=" + encodeURIComponent(config.limit))
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Request failed");
        }

        return response.json();
      })
      .then(function (payload) {
        var testimonials = payload && Array.isArray(payload.data) ? payload.data : [];
        renderTestimonials(testimonials);
      })
      .catch(function () {
        renderError();
      });
  }

  function renderError() {
    shadow.innerHTML =
      "<style>" +
      getStyles() +
      "</style>" +
      '<div class="widget-container" data-theme="' +
      escapeHtml(config.theme) +
      '" style="--accent: ' +
      escapeHtml(config.accent) +
      ';">' +
      '<div class="error">Unable to load testimonials right now.</div>' +
      brandingHtml() +
      "</div>";
  }

  function renderTestimonials(testimonials) {
    if (!testimonials.length) {
      shadow.innerHTML =
        "<style>" +
        getStyles() +
        "</style>" +
        '<div class="widget-container" data-theme="' +
        escapeHtml(config.theme) +
        '" style="--accent: ' +
        escapeHtml(config.accent) +
        ';">' +
        titleHtml() +
        '<div class="empty">No testimonials available yet.</div>' +
        brandingHtml() +
        "</div>";
      return;
    }

    var contentHtml = "";

    if (config.layout === "list") {
      contentHtml = '<div class="list-layout">' + testimonials.map(renderCard).join("") + "</div>";
    } else if (config.layout === "carousel") {
      contentHtml =
        '<div class="carousel-shell">' +
        '<button class="carousel-btn carousel-prev" type="button" aria-label="Previous testimonials">&#8249;</button>' +
        '<div class="carousel-wrapper">' +
        '<div class="carousel-track">' +
        testimonials
          .map(function (testimonial) {
            return '<div class="carousel-item">' + renderCard(testimonial) + "</div>";
          })
          .join("") +
        "</div>" +
        "</div>" +
        '<button class="carousel-btn carousel-next" type="button" aria-label="Next testimonials">&#8250;</button>' +
        "</div>";
    } else {
      contentHtml = '<div class="grid-layout">' + testimonials.map(renderCard).join("") + "</div>";
    }

    shadow.innerHTML =
      "<style>" +
      getStyles() +
      "</style>" +
      '<div class="widget-container" data-theme="' +
      escapeHtml(config.theme) +
      '" style="--accent: ' +
      escapeHtml(config.accent) +
      ';">' +
      titleHtml() +
      contentHtml +
      brandingHtml() +
      "</div>";

    if (config.layout === "carousel") {
      bindCarousel(testimonials.length);
    }
  }

  function titleHtml() {
    return '<div class="widget-title">' + escapeHtml(config.title) + "</div>";
  }

  function brandingHtml() {
    return (
      '<div class="branding">Powered by <a href="#" target="_blank" rel="noreferrer">Testimonial-Platform</a></div>'
    );
  }

  function renderCard(testimonial) {
    var safeName = escapeHtml(testimonial.name || "Anonymous");
    var safeCompany = testimonial.company
      ? '<div class="company">' + escapeHtml(testimonial.company) + "</div>"
      : "";
    var photoUrl = testimonial.photo_url ? resolvePhotoUrl(testimonial.photo_url) : "";
    var avatarHtml = photoUrl
      ? '<img src="' + escapeAttribute(photoUrl) + '" alt="' + safeName + '">'
      : escapeHtml(initials(testimonial.name));

    return (
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="avatar">' +
      avatarHtml +
      "</div>" +
      '<div class="meta">' +
      '<div class="name">' +
      safeName +
      "</div>" +
      safeCompany +
      "</div>" +
      "</div>" +
      '<div class="stars">' +
      escapeHtml(stars(testimonial.rating)) +
      "</div>" +
      '<div class="text">' +
      escapeHtml(testimonial.text || "") +
      "</div>" +
      '<div class="date">' +
      escapeHtml(formatDate(testimonial.created_at)) +
      "</div>" +
      "</div>"
    );
  }

  function resolvePhotoUrl(photoUrl) {
    if (/^https?:\/\//i.test(photoUrl)) {
      return photoUrl;
    }

    if (photoUrl.charAt(0) === "/") {
      return config.apiUrl + photoUrl;
    }

    return config.apiUrl + "/" + photoUrl;
  }

  function stars(rating) {
    var safeRating = Number.parseInt(rating, 10);
    var clamped = Number.isInteger(safeRating) ? Math.max(1, Math.min(5, safeRating)) : 5;
    return "\u2605".repeat(clamped) + "\u2606".repeat(5 - clamped);
  }

  function initials(name) {
    var words = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) {
      return "?";
    }

    if (words.length === 1) {
      return words[0].slice(0, 1).toUpperCase();
    }

    return (words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)).toUpperCase();
  }

  function formatDate(value) {
    var date = value ? new Date(value) : null;

    if (!date || Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function bindCarousel(itemCount) {
    var track = shadow.querySelector(".carousel-track");
    var prevButton = shadow.querySelector(".carousel-prev");
    var nextButton = shadow.querySelector(".carousel-next");

    if (!track || !prevButton || !nextButton) {
      return;
    }

    var index = 0;

    function getVisibleCount() {
      if (window.innerWidth >= 980) {
        return 3;
      }

      if (window.innerWidth >= 720) {
        return 2;
      }

      return 1;
    }

    function updateCarousel() {
      var visibleCount = getVisibleCount();
      var maxIndex = Math.max(0, itemCount - visibleCount);
      index = Math.min(index, maxIndex);
      var translatePercent = -(index * (100 / visibleCount));
      track.style.transform = "translateX(" + translatePercent + "%)";
      prevButton.disabled = index <= 0;
      nextButton.disabled = index >= maxIndex;
    }

    prevButton.addEventListener("click", function () {
      if (index > 0) {
        index -= 1;
        updateCarousel();
      }
    });

    nextButton.addEventListener("click", function () {
      var maxIndex = Math.max(0, itemCount - getVisibleCount());

      if (index < maxIndex) {
        index += 1;
        updateCarousel();
      }
    });

    window.addEventListener("resize", updateCarousel);
    updateCarousel();
  }
})();
