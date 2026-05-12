;(function () {
  'use strict';

  // ── Page fade-in ──
  document.documentElement.classList.add('js-ready');

  // ── Button ripple effect ──
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn, button, input[type="submit"], .Details, .role-option, .filter-chip');
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'ripple';
    var size = Math.max(rect.width, rect.height);
    var x = e.clientX - rect.left - size / 2;
    var y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', function () { ripple.remove(); });
  });

  // ── Scroll reveal with IntersectionObserver ──
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal, .listing-card, .card-item, .home-card, .meeting-card, .request-card, .hero-card, .page-card, .listing-header, .page-section, .auth-card, .edit-card');
    if (!els.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { observer.observe(el); });
  }

  // ── Stagger children animation ──
  function initStagger() {
    var containers = document.querySelectorAll('.homes-list, .card-list, .role-options, .hero-filters, .hero-stats, .nav-links');
    containers.forEach(function (container) {
      var children = container.children;
      for (var i = 0; i < children.length; i++) {
        children[i].style.setProperty('--i', i);
      }
    });
  }

  // ── Image blur-up loading ──
  function initBlurLoad() {
    var imgs = document.querySelectorAll('.home-img, .detail-media img');
    imgs.forEach(function (img) {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function () { img.classList.add('loaded'); });
        img.addEventListener('error', function () { img.classList.add('loaded'); });
      }
    });
  }

  // ── Toast notification system ──
  window.showToast = function (message, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    var icons = { success: 'circle-check', error: 'circle-xmark', info: 'circle-info', warning: 'triangle-exclamation' };
    var icon = icons[type] || 'circle-info';

    toast.innerHTML = '<i class="fa-solid fa-' + icon + '"></i><span>' + message + '</span>';
    container.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', function () { toast.remove(); });
    }, 3500);
  };

  // ── Smooth anchor scroll ──
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ── Init on DOM ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initScrollReveal();
      initStagger();
      initBlurLoad();
    });
  } else {
    initScrollReveal();
    initStagger();
    initBlurLoad();
  }

  // ── Re-init on dynamic content (for modals etc) ──
  var origPushState = history.pushState;
  history.pushState = function () {
    origPushState.apply(this, arguments);
    setTimeout(function () {
      initScrollReveal();
      initBlurLoad();
    }, 100);
  };

  window.addEventListener('popstate', function () {
    setTimeout(function () {
      initScrollReveal();
      initBlurLoad();
    }, 100);
  });
})();
