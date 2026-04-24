(() => {
  const body = document.body;
  const menuButton = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuButton && navLinks) {
    const setOpen = (open) => {
      body.classList.toggle("nav-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      menuButton.textContent = open ? "Close" : "Menu";
    };

    menuButton.addEventListener("click", () => setOpen(!body.classList.contains("nav-open")));
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  document.querySelectorAll(".faq-item").forEach((item, index) => {
    const heading = item.querySelector("h3");
    const panel = item.querySelector("p");
    if (!heading || !panel) return;

    const panelId = panel.id || `faq-panel-${index + 1}`;
    panel.id = panelId;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-controls", panelId);
    item.setAttribute("aria-expanded", String(item.classList.contains("open")));

    const toggle = () => {
      const open = !item.classList.contains("open");
      item.classList.toggle("open", open);
      item.setAttribute("aria-expanded", String(open));
      track("FAQ Opened", { question: heading.textContent.trim(), open });
    };

    item.addEventListener("click", toggle);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  document.querySelectorAll('[onclick*="requestFullscreen"]').forEach((item) => {
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    if (!item.getAttribute("aria-label")) item.setAttribute("aria-label", "Open demo fullscreen");
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        item.requestFullscreen?.();
      }
    });
  });

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const syncVideoMotion = () => {
    document.querySelectorAll("video[autoplay]").forEach((video) => {
      if (reducedMotion?.matches) {
        video.pause();
        video.removeAttribute("autoplay");
      }
    });
  };
  syncVideoMotion();
  reducedMotion?.addEventListener?.("change", syncVideoMotion);

  const mobileBuy = document.querySelector(".mobile-buy");
  const heroBuy = document.querySelector("#buy");
  if (mobileBuy && heroBuy) {
    body.classList.add("has-mobile-buy");

    const finalPurchase = document.querySelector(".final-purchase");
    let heroPassed = false;
    let finalVisible = false;
    const syncStickyBuy = () => {
      body.classList.toggle("show-mobile-buy", heroPassed && !finalVisible);
    };

    if ("IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver(([entry]) => {
        heroPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        syncStickyBuy();
      }, { threshold: 0.15 });
      heroObserver.observe(heroBuy);

      if (finalPurchase) {
        const finalObserver = new IntersectionObserver(([entry]) => {
          finalVisible = entry.isIntersecting;
          syncStickyBuy();
        }, { threshold: 0.05 });
        finalObserver.observe(finalPurchase);
      }
    } else {
      const update = () => {
        heroPassed = heroBuy.getBoundingClientRect().bottom < 0;
        finalVisible = finalPurchase ? finalPurchase.getBoundingClientRect().top < window.innerHeight : false;
        syncStickyBuy();
      };
      update();
      window.addEventListener("scroll", update, { passive: true });
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-event]");
    if (!target) return;
    track(target.dataset.event, {
      label: target.dataset.eventLabel || target.textContent.trim(),
      href: target.getAttribute("href") || ""
    });
  });

  function track(name, props = {}) {
    if (!name) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...props });
    if (typeof window.plausible === "function") window.plausible(name, { props });
    if (typeof window.gtag === "function") window.gtag("event", name, props);
    if (window.posthog && typeof window.posthog.capture === "function") window.posthog.capture(name, props);
  }
})();
