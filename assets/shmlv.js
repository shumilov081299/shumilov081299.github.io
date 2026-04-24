(() => {
  const body = document.body;
  const menuButton = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  const currentPath = `${window.location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "")}/`;
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    const targetPath = `${new URL(href, window.location.origin).pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "")}/`;
    if (targetPath === currentPath) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else if (link.classList.contains("active")) {
      link.setAttribute("aria-current", "location");
    }
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
      menuButton.textContent = open ? "Close menu" : "Open menu";
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

  document.querySelectorAll("details.faq-item").forEach((item) => {
    const summary = item.querySelector("summary");
    if (!summary) return;
    item.addEventListener("toggle", () => {
      track("FAQ Toggled", { question: summary.textContent.trim(), open: item.open });
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
  const demoVideos = Array.from(document.querySelectorAll(".demo-video"));
  const playDemo = (video) => video.play().catch(() => {
    video.closest(".video-shell")?.classList.add("is-paused");
  });

  demoVideos.forEach((video, index) => {
    const parent = video.parentElement;
    if (!parent || parent.querySelector(".video-toggle")) return;
    parent.classList.add("video-shell");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "video-toggle";
    const syncButton = () => {
      parent.classList.toggle("is-paused", video.paused);
      button.setAttribute("aria-pressed", String(!video.paused));
      button.textContent = video.paused ? "Play" : "Pause";
      button.setAttribute("aria-label", `${button.textContent} demo video ${index + 1}`);
    };
    syncButton();
    button.addEventListener("click", () => {
      if (video.paused) {
        playDemo(video);
      } else {
        video.pause();
      }
      track("Demo Video Toggled", { label: video.getAttribute("aria-label") || `Demo video ${index + 1}`, playing: !video.paused });
    });
    video.addEventListener("play", syncButton);
    video.addEventListener("pause", syncButton);
    parent.appendChild(button);
    requestAnimationFrame(syncButton);
  });

  const syncVideoMotion = () => {
    demoVideos.forEach((video) => {
      if (reducedMotion?.matches) video.pause();
      else if (video.hasAttribute("autoplay") && isElementVisible(video)) playDemo(video);
    });
  };

  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && video.hasAttribute("autoplay") && !reducedMotion?.matches) {
          playDemo(video);
        } else if (!entry.isIntersecting) {
          video.pause();
        }
      });
    }, { threshold: 0.35 });
    demoVideos.forEach((video) => videoObserver.observe(video));
  }

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
      iframe.tabIndex = -1;
      frame.appendChild(iframe);
      button.hidden = true;
      iframe.focus({ preventScroll: true });
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

  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }
})();
