;(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-ready');

  function markVisible(el) {
    if (el) el.classList.add('revealed');
  }

  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal, .listing-card, .card-item, .home-card, .meeting-card, .request-card, .page-card, .listing-header, .page-section, .auth-card, .edit-card, .hero-aside');
    if (!els.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(markVisible);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight * 0.9) {
          markVisible(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02, rootMargin: '0px 0px -24px 0px' });

    els.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        markVisible(el);
      } else {
        observer.observe(el);
      }
    });
  }

  function initStagger() {
    var containers = document.querySelectorAll('.homes-list, .card-list, .role-options, .hero-filters, .hero-stats, .nav-links');
    containers.forEach(function (container) {
      var children = container.children;
      for (var i = 0; i < children.length; i++) {
        children[i].style.setProperty('--i', i);
      }
    });
  }

  function initImageLoading() {
    var imgs = document.querySelectorAll('.home-img, .detail-media img');
    imgs.forEach(function (img) {
      var done = function () {
        img.classList.add('loaded');
      };

      if (img.complete) {
        done();
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }

  function initRipple() {
    if (prefersReducedMotion) return;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn, button, input[type="submit"], .Details, .role-option');
      if (!btn || window.matchMedia('(pointer: coarse)').matches) return;

      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      var size = Math.max(rect.width, rect.height);

      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function () {
        ripple.remove();
      }, { once: true });
    });
  }

  function initSmoothAnchors() {
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      var target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  }

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
    var icons = {
      success: 'circle-check',
      error: 'circle-xmark',
      info: 'circle-info',
      warning: 'triangle-exclamation'
    };

    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<i class="fa-solid fa-' + (icons[type] || icons.info) + '"></i><span>' + message + '</span>';
    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    window.setTimeout(function () {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', function () {
        toast.remove();
      }, { once: true });
    }, 3200);
  };

  function init() {
    initScrollReveal();
    initStagger();
    initImageLoading();
    initRipple();
    initSmoothAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
