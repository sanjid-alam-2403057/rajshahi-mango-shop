// ════════════════════════════════════════════════════════
// CONFIG — your deployed Apps Script URL
// ════════════════════════════════════════════════════════
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLRmAKvW4U2fjoZ0Yr9v9k634jAqRXPqtBGasSV_GcevhaQOwPh6gqY6lSHvetbGIn/exec';


document.addEventListener('DOMContentLoaded', () => {

  // ════════════════════════════════════════════════════════
  // 1. FETCH & RENDER PRODUCTS FROM data.json
  // ════════════════════════════════════════════════════════
  const productsGrid = document.getElementById('productsGrid');

  if (productsGrid) {
    showSkeletons(productsGrid, 6);

    fetch('data.json')
      .then(res => {
        if (!res.ok) throw new Error('Could not fetch product data.');
        return res.json();
      })
      .then(products => {
        productsGrid.innerHTML = '';

        products.forEach(product => {
          const tagsHTML = product.tags
            .map(tag => `<span class="p-tag">${tag}</span>`)
            .join('');

          const btnLabel    = product.available ? 'Add to Cart' : product.badge;
          const btnDisabled = product.available ? '' : 'disabled';
          const btnStyle    = product.available ? '' : 'style="background: var(--badge-gray); cursor: not-allowed; box-shadow: none;"';

          const seasonHTML = product.season
            ? `<span class="p-season">${product.season}</span>`
            : '';

          const cardHTML = `
            <div class="p-card sr">
              <div class="p-thumb ${product.bgClass || 'bg-default'}">
                ${product.icon || '🥭'}
                <span class="p-badge badge-${product.badgeColor || 'green'}">${product.badge}</span>
              </div>
              <div class="p-body">
                <div class="p-name-row">
                  <h3 class="p-name">${product.name}</h3>
                  ${seasonHTML}
                </div>
                <p class="p-name-bn">${product.nameBn}</p>
                <div class="p-tags">${tagsHTML}</div>
                <p class="p-desc">${product.description}</p>
                <div class="p-footer">
                  <div class="p-price">৳${product.price} <span>${product.unit || '/ kg'}</span></div>
                  <div class="p-actions">
                    <button class="p-btn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" ${btnDisabled} ${btnStyle}>
                      ${btnLabel}
                    </button>
                    <button class="p-whatsapp-btn" data-name="${product.name}" data-price="${product.price}" title="Order via WhatsApp">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L0 24l6.335-1.513A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.366l-.359-.214-3.761.898.938-3.65-.234-.374A9.818 9.818 0 112 12c0-5.414 4.404-9.818 9.818-9.818 5.415 0 9.818 4.404 9.818 9.818 0 5.415-4.403 9.818-9.818 9.818z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;

          productsGrid.insertAdjacentHTML('beforeend', cardHTML);
        });

        setupCartHandlers();
        setupWhatsAppHandlers();
        setupScrollReveal();
      })
      .catch(err => {
        console.error('Product load error:', err);
        productsGrid.innerHTML = `
          <p style="color:var(--muted); grid-column:1/-1; text-align:center; padding:40px 0;">
            ⚠️ Failed to load products. Please run this on a local server (e.g. VS Code Live Server).
          </p>`;
        setupScrollReveal();
      });

  } else {
    setupScrollReveal();
  }


  // ════════════════════════════════════════════════════════
  // 2. SKELETON LOADERS
  // ════════════════════════════════════════════════════════
  function showSkeletons(grid, count) {
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      grid.insertAdjacentHTML('beforeend', `
        <div class="p-skeleton">
          <div class="p-skeleton-thumb"></div>
          <div class="p-skeleton-body">
            <div class="p-skeleton-line med"></div>
            <div class="p-skeleton-line short"></div>
            <div class="p-skeleton-line med"></div>
            <div class="p-skeleton-line short"></div>
          </div>
        </div>
      `);
    }
  }


  // ════════════════════════════════════════════════════════
  // 3. CART STATE
  // ════════════════════════════════════════════════════════
  let cart = [];

  function setupCartHandlers() {
    document.querySelectorAll('.p-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', function () {
        const id    = this.dataset.id;
        const name  = this.dataset.name;
        const price = parseInt(this.dataset.price);

        const existing = cart.find(item => item.id === id);
        if (existing) {
          existing.qty += 1;
        } else {
          cart.push({ id, name, price, qty: 1 });
        }

        updateCartBadge();
        showAddedFeedback(this);
        renderCartModal();
      });
    });
  }

  function updateCartBadge() {
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    let badge = document.getElementById('cartBadge');

    if (!badge) {
      const navBtn = document.querySelector('.btn-nav');
      if (navBtn) {
        badge = document.createElement('span');
        badge.id = 'cartBadge';
        badge.style.cssText = `
          position: absolute;
          top: -7px; right: -7px;
          background: var(--moss);
          color: #fff;
          font-size: 0.62rem;
          font-weight: 800;
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          line-height: 1;
        `;
        navBtn.style.position = 'relative';
        navBtn.appendChild(badge);
      }
    }

    if (badge) {
      badge.textContent = total;
      badge.style.transform = 'scale(1.5)';
      setTimeout(() => badge.style.transform = 'scale(1)', 200);
      badge.style.transition = 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)';

      // Make nav button open cart on click
      const navBtn = document.querySelector('.btn-nav');
      if (navBtn && !navBtn.dataset.cartWired) {
        navBtn.dataset.cartWired = 'true';
        navBtn.addEventListener('click', (e) => {
          if (cart.length > 0) {
            e.preventDefault();
            openModal();
          }
        });
      }
    }
  }

  function showAddedFeedback(btn) {
    const orig = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.disabled = true;
    btn.style.background = 'var(--moss)';
    btn.style.boxShadow  = 'none';

    setTimeout(() => {
      btn.textContent    = orig;
      btn.disabled       = false;
      btn.style.background = '';
      btn.style.boxShadow  = '';
    }, 2000);
  }


  // ════════════════════════════════════════════════════════
  // 4. CART MODAL — render & open/close
  // ════════════════════════════════════════════════════════
  const modal       = document.getElementById('cartModal');
  const modalClose  = document.getElementById('modalClose');
  const stepCart    = document.getElementById('stepCart');
  const stepForm    = document.getElementById('stepForm');
  const stepSuccess = document.getElementById('stepSuccess');

  function openModal() {
    renderCartModal();
    showStep('cart');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showStep(step) {
    stepCart.style.display    = step === 'cart'    ? '' : 'none';
    stepForm.style.display    = step === 'form'    ? '' : 'none';
    stepSuccess.style.display = step === 'success' ? '' : 'none';
  }

  // Close on overlay click or X button
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  if (modalClose) modalClose.addEventListener('click', closeModal);

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  function renderCartModal() {
    const cartItemsEl  = document.getElementById('cartItems');
    const cartEmptyEl  = document.getElementById('cartEmpty');
    const cartTotalRow = document.getElementById('cartTotalRow');
    const cartTotalEl  = document.getElementById('cartTotal');
    const btnProceed   = document.getElementById('btnProceed');

    if (!cartItemsEl) return;

    if (cart.length === 0) {
      cartItemsEl.innerHTML  = '';
      cartEmptyEl.style.display  = '';
      cartTotalRow.style.display = 'none';
      btnProceed.style.display   = 'none';
      return;
    }

    cartEmptyEl.style.display  = 'none';
    cartTotalRow.style.display = '';
    btnProceed.style.display   = '';

    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-icon">🥭</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">৳${item.price} / kg</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
        </div>
        <div class="cart-item-subtotal">৳${item.price * item.qty}</div>
      </div>
    `).join('');

    // Quantity buttons
    cartItemsEl.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id     = btn.dataset.id;
        const action = btn.dataset.action;
        const item   = cart.find(i => i.id === id);
        if (!item) return;

        if (action === 'inc') {
          item.qty += 1;
        } else {
          item.qty -= 1;
          if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
        }

        updateCartBadge();
        renderCartModal();
      });
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    cartTotalEl.textContent = '৳' + total;
  }

  // Proceed to form
  const btnProceed = document.getElementById('btnProceed');
  if (btnProceed) {
    btnProceed.addEventListener('click', () => {
      if (cart.length === 0) return;
      renderOrderSummaryMini();
      showStep('form');
    });
  }

  // Back to cart
  const btnBack = document.getElementById('btnBack');
  if (btnBack) {
    btnBack.addEventListener('click', () => showStep('cart'));
  }

  // Done button (success screen)
  const btnDone = document.getElementById('btnDone');
  if (btnDone) {
    btnDone.addEventListener('click', () => {
      cart = [];
      updateCartBadge();
      closeModal();
    });
  }

  function renderOrderSummaryMini() {
    const el = document.getElementById('orderSummaryMini');
    if (!el) return;
    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const lines = cart.map(i => `<strong>${i.name}</strong> × ${i.qty} kg = ৳${i.price * i.qty}`).join('<br>');
    el.innerHTML = lines + `<br><strong>Total: ৳${total}</strong>`;
  }


  // ════════════════════════════════════════════════════════
  // 5. FORM SUBMISSION → APPS SCRIPT
  // ════════════════════════════════════════════════════════
  const btnSubmit = document.getElementById('btnSubmit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', submitOrder);
  }

  function submitOrder() {
    // Collect & validate fields
    const name    = document.getElementById('fName').value.trim();
    const phone   = document.getElementById('fPhone').value.trim();
    const address = document.getElementById('fAddress').value.trim();
    const district = document.getElementById('fDistrict').value;
    const note    = document.getElementById('fNote').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked')?.value || 'Cash on Delivery';

    let valid = true;

    function markError(id) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('error');
        el.addEventListener('input', () => el.classList.remove('error'), { once: true });
      }
      valid = false;
    }

    if (!name)     markError('fName');
    if (!phone || !/^[0-9+\-\s]{7,15}$/.test(phone)) markError('fPhone');
    if (!address)  markError('fAddress');
    if (!district) markError('fDistrict');

    if (!valid) return;

    // Build payload
    const payload = {
      action:        'placeOrder',
      customerName:  name,
      phone:         phone,
      address:       address,
      district:      district,
      note:          note,
      paymentMethod: payment,
      items:         cart.map(item => ({
        name:  item.name,
        qty:   item.qty,
        price: item.price,
      })),
    };

    // Loading state
    btnSubmit.classList.add('btn-loading');
    btnSubmit.textContent = 'Placing Order…';
    btnSubmit.disabled = true;

    fetch(APPS_SCRIPT_URL, {
      method:  'POST',
      mode:    'no-cors',   // Apps Script requires no-cors
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(payload),
    })
    .then(() => {
      // no-cors means we can't read the response body,
      // so we assume success if no network error occurred
      const orderId = 'RM-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' +
        Math.random().toString(36).substring(2,6).toUpperCase();

      showSuccessScreen({
        orderId,
        name,
        phone,
        total: cart.reduce((s, i) => s + i.price * i.qty, 0),
        payment,
        items: [...cart],
      });
    })
    .catch(err => {
      console.error('Order submission error:', err);
      btnSubmit.classList.remove('btn-loading');
      btnSubmit.textContent = '✅ Place Order';
      btnSubmit.disabled = false;
      alert('❌ Something went wrong. Please try via WhatsApp instead.');
    });
  }

  function showSuccessScreen(order) {
    document.getElementById('successOrderId').textContent = 'Order ID: ' + order.orderId;

    const itemLines = order.items.map(i =>
      `<strong>${i.name}</strong> × ${i.qty} kg = ৳${i.price * i.qty}`
    ).join('<br>');

    document.getElementById('successDetails').innerHTML =
      itemLines +
      `<br><strong>Total: ৳${order.total}</strong><br>` +
      `Payment: ${order.payment}<br>` +
      `Phone: ${order.phone}`;

    showStep('success');

    // Reset button for if they open modal again
    btnSubmit.classList.remove('btn-loading');
    btnSubmit.textContent = '✅ Place Order';
    btnSubmit.disabled = false;
  }


  // ════════════════════════════════════════════════════════
  // 6. WHATSAPP ORDER HANDLER
  // ════════════════════════════════════════════════════════
  function setupWhatsAppHandlers() {
    document.querySelectorAll('.p-whatsapp-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const name  = this.dataset.name;
        const price = this.dataset.price;
        const phone = '8801863232179';
        const msg   = encodeURIComponent(
          `হ্যালো! আমি ${name} আম অর্ডার করতে চাই।\nদাম: ৳${price}/kg\n\nআমার অর্ডার কনফার্ম করুন।`
        );
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      });
    });
  }


  // ════════════════════════════════════════════════════════
  // 7. STICKY NAV
  // ════════════════════════════════════════════════════════
  const mainNav = document.getElementById('mainNav');
  if (mainNav) {
    window.addEventListener('scroll', () => {
      mainNav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }


  // ════════════════════════════════════════════════════════
  // 8. MOBILE MENU TOGGLE
  // ════════════════════════════════════════════════════════
  const navToggle  = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  }


  // ════════════════════════════════════════════════════════
  // 9. SCROLL REVEAL
  // ════════════════════════════════════════════════════════
  function setupScrollReveal() {
    const srEls = document.querySelectorAll('.sr:not(.in)');
    if (!srEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const parent   = entry.target.parentElement;
        const siblings = parent.querySelectorAll('.sr:not(.in)');
        siblings.forEach((sib, idx) => {
          setTimeout(() => sib.classList.add('in'), idx * 90);
        });
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

    srEls.forEach(el => observer.observe(el));
  }

});


// ════════════════════════════════════════════════════════
// 10. NEWSLETTER / SUBSCRIBE FORM
// Global scope — called via inline onclick in index.html
// ════════════════════════════════════════════════════════
function handleSubscribe(btn) {
  const input = btn.previousElementSibling;
  const value = input.value.trim();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhone = /^[0-9+\-\s]{7,15}$/.test(value);

  if (!value || (!isEmail && !isPhone)) {
    input.style.borderColor = '#E84040';
    input.placeholder = '⚠ Enter a valid email or phone number';
    input.focus();
    setTimeout(() => {
      input.style.borderColor = '';
      input.placeholder = 'Email or Phone Number';
    }, 2500);
    return;
  }

  const origText = btn.textContent;
  btn.textContent  = '✓ Subscribed!';
  btn.disabled     = true;
  btn.style.background = 'var(--moss)';
  input.value      = '';
  input.disabled   = true;
  input.style.opacity = '0.5';

  setTimeout(() => {
    btn.textContent     = origText;
    btn.disabled        = false;
    btn.style.background = '';
    input.disabled      = false;
    input.style.opacity  = '';
  }, 4000);
}
