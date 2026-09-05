(() => {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mobileNav");

  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      nav.inert = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    window.matchMedia("(max-width: 900px)").addEventListener("change", () => setOpen(false));
  }

  const tabs = [...document.querySelectorAll(".flow-tab")];
  const selectTab = (selected) => {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls"))?.classList.toggle("active", active);
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });

  const banner = document.querySelector(".mobile-bottom-banner");
  if (banner) {
    const updateBanner = () => banner.classList.toggle("visible", window.scrollY > 200);
    window.addEventListener("scroll", updateBanner, { passive: true });
    updateBanner();
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        entry.target.classList.remove("is-observed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0 });
    document.querySelectorAll(".fade-in").forEach((element) => {
      element.classList.add("is-observed");
      observer.observe(element);
    });
    reducedMotion.addEventListener("change", (event) => {
      if (!event.matches) return;
      observer.disconnect();
      document.querySelectorAll(".is-observed").forEach((element) => element.classList.remove("is-observed"));
    });
  }
})();
