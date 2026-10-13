import './styles.css';

document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopLayout = window.matchMedia('(min-width: 900px)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

function setupReveal() {
  const elements = [...document.querySelectorAll('[data-reveal]')];

  elements.forEach((element) => {
    const delay = Number(element.dataset.revealDelay || 0);
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  });

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -9% 0px', threshold: 0.08 },
  );

  elements.forEach((element) => observer.observe(element));
}

function setupHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const updateHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

function setupMenu() {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const navigation = document.querySelector('[data-navigation]');

  if (!header || !toggle || !navigation) return;

  const setMenuState = (open, returnFocus = false) => {
    const isMobile = !desktopLayout.matches;
    const shouldOpen = isMobile && open;

    toggle.setAttribute('aria-expanded', String(shouldOpen));
    toggle.setAttribute('aria-label', shouldOpen ? 'Закрыть меню' : 'Открыть меню');
    navigation.classList.toggle('is-open', shouldOpen);
    header.classList.toggle('is-menu-open', shouldOpen);
    document.body.classList.toggle('menu-open', shouldOpen);

    if (isMobile) {
      navigation.inert = !shouldOpen;
      navigation.setAttribute('aria-hidden', String(!shouldOpen));
    } else {
      navigation.inert = false;
      navigation.removeAttribute('aria-hidden');
    }

    if (!shouldOpen && returnFocus && isMobile) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    setMenuState(toggle.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuState(false);
  });

  document.addEventListener('click', (event) => {
    if (
      toggle.getAttribute('aria-expanded') === 'true' &&
      !header.contains(event.target)
    ) {
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuState(false, true);
    }
  });

  desktopLayout.addEventListener('change', () => setMenuState(false));
  setMenuState(false);
}

function setupHeroParallax() {
  const hero = document.querySelector('[data-hero]');
  const tiltTarget = document.querySelector('[data-tilt]');
  if (!hero || !tiltTarget || reducedMotion.matches || !finePointer.matches) return;

  let frameId = 0;
  let nextX = 0;
  let nextY = 0;

  const render = () => {
    hero.style.setProperty('--mx', nextX.toFixed(3));
    hero.style.setProperty('--my', nextY.toFixed(3));
    frameId = 0;
  };

  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    nextX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    nextY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));

    if (!frameId) frameId = requestAnimationFrame(render);
  });

  hero.addEventListener('pointerleave', () => {
    nextX = 0;
    nextY = 0;
    if (!frameId) frameId = requestAnimationFrame(render);
  });
}

const validators = {
  name: (field) => {
    if (!field.value.trim()) return 'Укажите имя';
    if (field.value.trim().length < 2) return 'Введите не менее двух символов';
    return '';
  },
  email: (field) => {
    if (!field.value.trim()) return 'Укажите рабочий email';
    if (!field.validity.valid) return 'Введите email в формате name@company.ru';
    return '';
  },
  company: (field) => {
    if (!field.value.trim()) return 'Укажите компанию';
    if (field.value.trim().length < 2) return 'Введите не менее двух символов';
    return '';
  },
  teamSize: (field) => (field.value ? '' : 'Выберите размер команды'),
  consent: (field) => (field.checked ? '' : 'Подтвердите согласие'),
};

function setupForm() {
  const form = document.querySelector('[data-lead-form]');
  if (!form) return;

  const content = form.querySelector('[data-form-content]');
  const success = form.querySelector('[data-form-success]');
  const resetButton = form.querySelector('[data-form-reset]');
  const fields = [...form.elements].filter((field) => field.name && validators[field.name]);

  const validateField = (field) => {
    const message = validators[field.name](field);
    const error = document.getElementById(`${field.id}-error`);

    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) error.textContent = message;
    return !message;
  };

  const clearFieldError = (field) => {
    const error = document.getElementById(`${field.id}-error`);
    field.removeAttribute('aria-invalid');
    if (error) error.textContent = '';
  };

  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener(field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  function submitLead() {
    content.hidden = true;
    success.hidden = false;
    resetButton.focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const validity = fields.map((field) => ({ field, valid: validateField(field) }));
    const firstInvalid = validity.find(({ valid }) => !valid);

    if (firstInvalid) {
      firstInvalid.field.focus();
      return;
    }

    submitLead();
  });

  resetButton.addEventListener('click', () => {
    form.reset();
    fields.forEach(clearFieldError);
    success.hidden = true;
    content.hidden = false;
    requestAnimationFrame(() => fields[0].focus());
  });
}

function setCurrentYear() {
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
}

setupReveal();
setupHeader();
setupMenu();
setupHeroParallax();
setupForm();
setCurrentYear();
