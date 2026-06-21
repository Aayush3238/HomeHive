;(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-ready');

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function initNavScroll() {
    var nav = $('.site-nav');
    if (!nav) return;
    var scrollThreshold = 10;
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        nav.classList.toggle('scrolled', window.scrollY > scrollThreshold);
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initNav() {
    var toggle = $('[data-nav-toggle]');
    var panel = $('[data-nav-panel]');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      panel.classList.toggle('is-open', !expanded);
    });

    document.addEventListener('click', function (event) {
      if (!panel.classList.contains('is-open')) return;
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function revealElements() {
    var targets = $$('.reveal, .home-card, .card-item, .meeting-card, .request-card, .page-card, .page-section, .auth-card, .listing-form, .dashboard-main, .dashboard-sidebar');
    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (node) { node.classList.add('revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (node) { observer.observe(node); });
  }

  function initImages() {
    $$('.home-media, .detail-media').forEach(function (frame) {
      frame.classList.add('image-frame', 'loading');
    });

    $$('.home-img, .detail-media img').forEach(function (img) {
      function done() {
        img.classList.add('loaded');
        if (img.parentElement) {
          img.parentElement.classList.remove('loading');
        }
      }

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

    document.addEventListener('click', function (event) {
      var target = event.target.closest('.btn, button, input[type="submit"], .Details');
      if (!target || window.matchMedia('(pointer: coarse)').matches) return;

      var rect = target.getBoundingClientRect();
      var ripple = document.createElement('span');
      var size = Math.max(rect.width, rect.height);

      ripple.className = 'ripple';
      ripple.style.cssText = [
        'position:absolute',
        'pointer-events:none',
        'border-radius:999px',
        'background:rgba(255,255,255,.2)',
        'transform:scale(0)',
        'animation:ripple .6s cubic-bezier(0.25,0.1,0.25,1) forwards',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'left:' + (event.clientX - rect.left - size / 2) + 'px',
        'top:' + (event.clientY - rect.top - size / 2) + 'px'
      ].join(';');

      if (getComputedStyle(target).position === 'static') {
        target.style.position = 'relative';
      }
      target.style.overflow = 'hidden';
      target.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); }, { once: true });
    });

    if (!$('#ripple-style')) {
      var style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = '@keyframes ripple{to{transform:scale(2.5);opacity:0}}';
      document.head.appendChild(style);
    }
  }

  function initForms() {
    $$('form').forEach(function (form) {
      if (form.hasAttribute('novalidate')) return;
      form.setAttribute('novalidate', 'novalidate');

      form.addEventListener('submit', function (event) {
        var fields = $$('input, textarea, select', form).filter(function (field) {
          return !field.disabled && field.type !== 'hidden' && field.type !== 'submit' && field.type !== 'button';
        });

        var firstInvalid = null;
        fields.forEach(function (field) {
          var container = field.closest('.field');
          var message = container ? $('.validation-message', container) : null;
          if (container) container.classList.remove('invalid');
          if (message) message.remove();

          if (!field.checkValidity()) {
            if (!firstInvalid) firstInvalid = field;
            if (container) {
              container.classList.add('invalid');
              var validation = document.createElement('small');
              validation.className = 'validation-message';
              validation.textContent = field.validationMessage;
              container.appendChild(validation);
            }
          }
        });

        if (firstInvalid) {
          event.preventDefault();
          firstInvalid.focus();
          if (window.showToast) {
            window.showToast('Please fix the highlighted fields before continuing.', 'warning');
          }
          return;
        }

        var submit = event.submitter || $('[type="submit"]', form);
        if (submit) {
          submit.dataset.originalText = submit.innerHTML;
          submit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Working...</span>';
          submit.disabled = true;
          submit.classList.add('loading-label');
        }
      });
    });
  }

  function initScrollLinks() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function initDetails() {
    $$('details').forEach(function (detail) {
      detail.addEventListener('toggle', function () {
        if (detail.open && window.showToast && detail.dataset.toast && !detail.dataset.seenToast) {
          detail.dataset.seenToast = 'true';
          window.showToast(detail.dataset.toast, 'info');
        }
      });
    });
  }

  function initSessionToasts() {
    try {
      var message = sessionStorage.getItem('homehive.toast');
      var type = sessionStorage.getItem('homehive.toastType') || 'success';
      if (message && window.showToast) {
        window.showToast(message, type);
        sessionStorage.removeItem('homehive.toast');
        sessionStorage.removeItem('homehive.toastType');
      }
    } catch (error) {
      void error;
    }
  }

  function initToastTriggers() {
    $$('[data-toast-submit]').forEach(function (form) {
      form.addEventListener('submit', function () {
        try {
          sessionStorage.setItem('homehive.toast', form.getAttribute('data-toast-submit'));
          sessionStorage.setItem('homehive.toastType', form.getAttribute('data-toast-type') || 'success');
        } catch (error) {
          void error;
        }
      });
    });
  }

  function initSidebar() {
    var toggle = $('[data-sidebar-toggle]');
    var sidebar = $('[data-sidebar]');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('is-collapsed');
      document.body.classList.toggle('dashboard-sidebar-collapsed');
    });
  }

  function initSmoothHover() {
    if (prefersReducedMotion) return;

    $$('.home-card, .info-card, .stat-card').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        this.style.willChange = 'transform, box-shadow';
      });
      card.addEventListener('mouseleave', function () {
        this.style.willChange = 'auto';
      });
    });
  }

  window.showToast = function (message, type) {
    type = type || 'success';
    var container = $('#toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<i class="fa-solid ' + ({
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      info: 'fa-circle-info',
      warning: 'fa-triangle-exclamation'
    }[type] || 'fa-circle-info') + '"></i><span>' + message + '</span>';
    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    window.setTimeout(function () {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', function () {
        toast.remove();
      }, { once: true });
    }, 3500);
  };

  function init() {
    initNavScroll();
    initNav();
    revealElements();
    initImages();
    initRipple();
    initForms();
    initScrollLinks();
    initDetails();
    initSessionToasts();
    initToastTriggers();
    initSidebar();
    initSmoothHover();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
