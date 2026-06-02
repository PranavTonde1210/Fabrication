const BUSINESS = {
  name: 'Sai Enterprises Fabrication',
  phone: '918007700702',
  displayPhone: '+91 80077 00702',
  email: 'info@saienterprisespune.com',
};

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu?.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
    });
  });

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    link.setAttribute('rel', [...rel].join(' '));
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll('.fade-up').forEach((el) => el.classList.add('visible'));
  }

  initGalleryFilters();
  initContactForm();
  initCalculatorDefaults();
});

function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (!filterBtns.length || !galleryItems.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((item) => item.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.filter;
      galleryItems.forEach((item) => {
        const shouldShow = category === 'all' || item.dataset.cat === category;
        item.style.display = shouldShow ? '' : 'none';
        item.style.opacity = shouldShow ? '1' : '0';
      });
    });
  });
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('contactFormStatus');
  const button = form.querySelector('[type="submit"]');
  const originalButtonText = button?.innerHTML || 'Send Enquiry';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFormErrors(form);

    const invalidFields = [...form.querySelectorAll('[required]')]
      .filter((field) => !field.value.trim());

    const emailField = form.elements.email;
    if (emailField?.value && !emailField.checkValidity()) {
      invalidFields.push(emailField);
    }

    if (invalidFields.length) {
      invalidFields.forEach((field) => field.classList.add('error'));
      invalidFields[0].focus();
      setFormStatus(status, 'Please fill the required details before sending.', 'error');
      return;
    }

    const data = new FormData(form);
    const lines = [
      `Hi ${BUSINESS.name}, I would like a fabrication quote.`,
      '',
      `Name: ${data.get('name')}`,
      `Phone: ${data.get('phone')}`,
      `Email: ${data.get('email') || 'Not provided'}`,
      `Service: ${data.get('service')}`,
      `Material: ${data.get('material') || 'Not sure'}`,
      `Budget: ${data.get('budget') || 'Not specified'}`,
      '',
      `Project details: ${data.get('details')}`,
    ];

    const whatsappUrl = `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(whatsappUrl, '_blank', 'noopener');

    if (button) {
      button.innerHTML = 'Enquiry Ready on WhatsApp';
      button.disabled = true;
    }
    setFormStatus(status, 'Your enquiry is ready in WhatsApp. Send it there to complete the request.', 'success');

    setTimeout(() => {
      if (button) {
        button.innerHTML = originalButtonText;
        button.disabled = false;
      }
    }, 3000);
  });
}

function clearFormErrors(form) {
  form.querySelectorAll('.error').forEach((field) => field.classList.remove('error'));
}

function setFormStatus(status, message, type) {
  if (!status) return;
  status.textContent = message;
  status.className = `form-status ${type || ''}`.trim();
}

const MATERIALS = {
  MS: { label: 'Mild Steel (MS)', ratePerSqFt: 65, ratePerKg: 55, density: 7.85 },
  SS: { label: 'Stainless Steel (SS)', ratePerSqFt: 180, ratePerKg: 165, density: 8.0 },
  AL: { label: 'Aluminum', ratePerSqFt: 145, ratePerKg: 140, density: 2.7 },
  GI: { label: 'Galvanized Iron (GI)', ratePerSqFt: 85, ratePerKg: 72, density: 7.85 },
};

const SERVICES_EXTRA = {
  cutting: { label: 'Cutting and Shearing', pct: 0 },
  welding: { label: 'Welding', pct: 0.2 },
  polishing: { label: 'Polishing / Finish', pct: 0.3 },
  painting: { label: 'Painting', pct: 0.18 },
};

let latestEstimate = null;

function initCalculatorDefaults() {
  if (!document.getElementById('priceAmount')) return;
  ensureHiddenInput('calcMaterial', 'MS');
  ensureHiddenInput('calcThickness', '2.0');
  ensureHiddenInput('calcQty', '1');
  updateDisplay(null);
}

function ensureHiddenInput(id, value) {
  if (document.getElementById(id)) return;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.id = id;
  input.value = value;
  document.body.appendChild(input);
}

function formatINR(value) {
  return `\u20b9${Math.round(value).toLocaleString('en-IN')}`;
}

function runCalc() {
  const matKey = document.getElementById('calcMaterial')?.value || 'MS';
  const thickMM = parseFloat(document.getElementById('calcThickness')?.value || 2);
  const length = parseFloat(document.getElementById('calcLength')?.value || 0);
  const width = parseFloat(document.getElementById('calcWidth')?.value || 0);
  const qty = Math.max(1, parseInt(document.getElementById('calcQty')?.value || 1, 10));
  const serviceKey = document.getElementById('calcService')?.value || 'cutting';
  const pricingMode = document.getElementById('pricingMode')?.value || 'sqft';

  const material = MATERIALS[matKey];
  const service = SERVICES_EXTRA[serviceKey] || SERVICES_EXTRA.cutting;

  if (!material || length <= 0 || width <= 0 || thickMM <= 0) {
    latestEstimate = null;
    updateDisplay(null);
    return;
  }

  const areaSqFt = (length * width) / 144;
  const thickIn = thickMM / 25.4;
  const volumeCuIn = length * width * thickIn;
  const weightKg = volumeCuIn * 0.0000163871 * material.density * 1000;
  const thicknessFactor = Math.max(0.6, thickMM / 2);

  const basePrice = pricingMode === 'sqft'
    ? areaSqFt * material.ratePerSqFt * thicknessFactor
    : weightKg * material.ratePerKg;

  const serviceCost = basePrice * service.pct;
  const unitPrice = basePrice + serviceCost;
  const subtotal = unitPrice * qty;
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;

  latestEstimate = {
    material,
    thickMM,
    length,
    width,
    qty,
    service,
    pricingMode,
    areaSqFt,
    weightKg,
    thicknessFactor,
    basePrice,
    serviceCost,
    unitPrice,
    subtotal,
    gst,
    grandTotal,
  };

  updateDisplay(latestEstimate);
}

function updateDisplay(estimate) {
  const priceEl = document.getElementById('priceAmount');
  const breakdownEl = document.getElementById('priceBreakdown');
  const quoteBtn = document.getElementById('calcWhatsAppBtn');
  if (!priceEl || !breakdownEl) return;

  if (!estimate) {
    priceEl.textContent = '\u20b90';
    breakdownEl.innerHTML = '<p style="color:var(--text-dim);font-size:.85rem;text-align:center;padding:1rem 0;">Enter dimensions to calculate</p>';
    if (quoteBtn) {
      quoteBtn.href = `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(`Hi ${BUSINESS.name}, I would like a confirmed fabrication quote.`)}`;
    }
    return;
  }

  priceEl.textContent = formatINR(estimate.grandTotal);
  priceEl.classList.remove('pulse-update');
  void priceEl.offsetWidth;
  priceEl.classList.add('pulse-update');

  breakdownEl.innerHTML = `
    <div class="price-row">
      <span class="price-row-label">Material</span>
      <span class="price-row-value">${estimate.material.label}</span>
    </div>
    <div class="price-row">
      <span class="price-row-label">Thickness</span>
      <span class="price-row-value">${estimate.thickMM} mm</span>
    </div>
    <div class="price-row">
      <span class="price-row-label">Dimensions</span>
      <span class="price-row-value">${estimate.length} x ${estimate.width} in</span>
    </div>
    <div class="price-row">
      <span class="price-row-label">Area</span>
      <span class="price-row-value">${estimate.areaSqFt.toFixed(2)} sq.ft</span>
    </div>
    <div class="price-row">
      <span class="price-row-label">Approx. Weight</span>
      <span class="price-row-value">${estimate.weightKg.toFixed(2)} kg</span>
    </div>
    <div class="price-row">
      <span class="price-row-label">Base (${estimate.pricingMode === 'sqft' ? 'Area + Thickness' : 'Weight'})</span>
      <span class="price-row-value">${formatINR(estimate.basePrice)}</span>
    </div>
    ${estimate.service.pct > 0 ? `<div class="price-row">
      <span class="price-row-label">${estimate.service.label}</span>
      <span class="price-row-value">+${formatINR(estimate.serviceCost)}</span>
    </div>` : ''}
    <div class="price-row">
      <span class="price-row-label">Unit Price</span>
      <span class="price-row-value">${formatINR(estimate.unitPrice)}</span>
    </div>
    <div class="price-row">
      <span class="price-row-label">Quantity</span>
      <span class="price-row-value">x ${estimate.qty}</span>
    </div>
    <div class="price-row">
      <span class="price-row-label">Subtotal</span>
      <span class="price-row-value">${formatINR(estimate.subtotal)}</span>
    </div>
    <div class="price-row">
      <span class="price-row-label">GST (18%)</span>
      <span class="price-row-value">+${formatINR(estimate.gst)}</span>
    </div>
    <div class="price-row total">
      <span class="price-row-label">Grand Total</span>
      <span class="price-row-value">${formatINR(estimate.grandTotal)}</span>
    </div>
  `;

  if (quoteBtn) {
    quoteBtn.href = `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(buildEstimateMessage(estimate))}`;
  }
}

function buildEstimateMessage(estimate) {
  return [
    `Hi ${BUSINESS.name}, I would like a confirmed fabrication quote.`,
    '',
    `Material: ${estimate.material.label}`,
    `Thickness: ${estimate.thickMM} mm`,
    `Dimensions: ${estimate.length} x ${estimate.width} inches`,
    `Quantity: ${estimate.qty}`,
    `Service: ${estimate.service.label}`,
    `Pricing basis: ${estimate.pricingMode === 'sqft' ? 'Per sq.ft' : 'Per kg'}`,
    `Estimated total: ${formatINR(estimate.grandTotal)} including GST`,
    '',
    'Please confirm final pricing and timeline.',
  ].join('\n');
}

function selectMaterial(key, el) {
  document.querySelectorAll('.mat-card').forEach((card) => card.classList.remove('selected'));
  el?.classList.add('selected');
  ensureHiddenInput('calcMaterial', 'MS');
  document.getElementById('calcMaterial').value = key;
  runCalc();
}

function selectThickness(mm, el) {
  document.querySelectorAll('.thick-btn').forEach((button) => button.classList.remove('selected'));
  el?.classList.add('selected');
  ensureHiddenInput('calcThickness', '2.0');
  document.getElementById('calcThickness').value = String(mm);
  runCalc();
}

function changeQty(delta) {
  const qtyInput = document.getElementById('calcQty');
  const currentQty = Math.max(1, parseInt(qtyInput?.value || '1', 10) + delta);
  ensureHiddenInput('calcQty', '1');
  document.getElementById('calcQty').value = String(currentQty);
  const qtyDisplay = document.getElementById('qtyDisplay');
  if (qtyDisplay) qtyDisplay.textContent = String(currentQty);
  runCalc();
}

function setPricing(mode, el) {
  ensureHiddenInput('pricingMode', 'sqft');
  document.getElementById('pricingMode').value = mode;
  document.querySelectorAll('.tab-btn').forEach((button) => button.classList.remove('active'));
  el?.classList.add('active');
  runCalc();
}

window.runCalc = runCalc;
window.selectMaterial = selectMaterial;
window.selectThickness = selectThickness;
window.changeQty = changeQty;
window.setPricing = setPricing;
