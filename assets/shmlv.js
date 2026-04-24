(() => {
  const body = document.body;
  const menuButton = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  document.querySelectorAll(".nav-links a.active").forEach((link) => {
    link.setAttribute("aria-current", "page");
  });

  if (menuButton && navLinks) {
    const navItems = Array.from(navLinks.querySelectorAll("a, button"));
    const mobileMenuQuery = window.matchMedia?.("(max-width: 820px)");
    const syncMenuFocus = (open) => {
      const isMobile = mobileMenuQuery?.matches ?? window.innerWidth <= 820;
      if (!isMobile) {
        navLinks.removeAttribute("aria-hidden");
        if ("inert" in navLinks) navLinks.inert = false;
        navItems.forEach((item) => item.removeAttribute("tabindex"));
        return;
      }
      navLinks.setAttribute("aria-hidden", String(!open));
      if ("inert" in navLinks) navLinks.inert = !open;
      navItems.forEach((item) => {
        if (open) item.removeAttribute("tabindex");
        else item.setAttribute("tabindex", "-1");
      });
    };

    const setOpen = (open) => {
      const focusWasInMenu = navLinks.contains(document.activeElement);
      body.classList.toggle("nav-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      menuButton.textContent = open ? "Close" : "Menu";
      syncMenuFocus(open);
      if (!open && focusWasInMenu) menuButton.focus({ preventScroll: true });
    };

    setOpen(false);
    menuButton.addEventListener("click", () => setOpen(!body.classList.contains("nav-open")));
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
    mobileMenuQuery?.addEventListener?.("change", () => syncMenuFocus(body.classList.contains("nav-open")));
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
    panel.setAttribute("aria-hidden", String(!item.classList.contains("open")));

    const toggle = () => {
      const open = !item.classList.contains("open");
      item.classList.toggle("open", open);
      item.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
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

  document.querySelectorAll("[data-youtube-id]").forEach((button) => {
    const frame = button.closest(".yt-lite");
    if (!frame) return;
    button.addEventListener("click", () => {
      const id = button.dataset.youtubeId;
      if (!id || frame.querySelector("iframe")) return;
      const iframe = document.createElement("iframe");
      iframe.title = button.dataset.youtubeTitle || "YouTube video";
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      frame.appendChild(iframe);
      button.hidden = true;
    });
  });

  const mobileBuy = document.querySelector(".mobile-buy");
  const heroBuy = document.querySelector("#buy");
  if (mobileBuy && heroBuy) {
    body.classList.add("has-mobile-buy");

    const finalPurchase = document.querySelector(".final-purchase");
    let heroPassed = false;
    let finalActive = false;
    const syncStickyBuy = () => {
      body.classList.toggle("show-mobile-buy", heroPassed && !finalActive);
    };

    if ("IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver(([entry]) => {
        heroPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        syncStickyBuy();
      }, { threshold: 0.15 });
      heroObserver.observe(heroBuy);

      if (finalPurchase) {
        const finalObserver = new IntersectionObserver(([entry]) => {
          finalActive = entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight;
          syncStickyBuy();
        }, { threshold: 0.05 });
        finalObserver.observe(finalPurchase);
      }
    } else {
      const update = () => {
        heroPassed = heroBuy.getBoundingClientRect().bottom < 0;
        finalActive = finalPurchase ? finalPurchase.getBoundingClientRect().top < window.innerHeight : false;
        syncStickyBuy();
      };
      update();
      window.addEventListener("scroll", update, { passive: true });
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-event]");
    if (!target) return;
    const href = target.getAttribute("href") || "";
    let linkType = "internal";
    let linkDomain = "";
    let linkPath = "";
    if (href.startsWith("mailto:")) {
      linkType = "email";
    } else if (href.startsWith("http")) {
      try {
        const url = new URL(href);
        linkDomain = url.hostname;
        linkPath = url.pathname;
        linkType = linkDomain.includes("payhip.com") ? "checkout" : "external";
      } catch {
        linkType = "external";
      }
    } else {
      linkPath = href;
    }
    track(target.dataset.event, {
      label: target.dataset.eventLabel || target.textContent.trim(),
      link_type: linkType,
      link_domain: linkDomain,
      link_path: linkPath
    });
  });

  function track(name, props = {}) {
    if (!name) return;
    document.dispatchEvent(new CustomEvent("shmlv:event", { detail: { name, ...props } }));
  }
})();
