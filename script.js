document.addEventListener('DOMContentLoaded', () => {
    
    // ════════════════════════════════
    // 1. FETCH & RENDER PRODUCTS FROM data.json
    // ════════════════════════════════
    const productsGrid = document.getElementById('productsGrid');

    if (productsGrid) {
        fetch('data.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Could not fetch the product data.');
                }
                return response.json();
            })
            .then(products => {
                // Clear the default loading placeholder text
                productsGrid.innerHTML = '';

                // Generate HTML cards dynamically for each product found in JSON
                products.forEach(product => {
                    const tagsHTML = product.tags.map(tag => `<span class="p-tag">${tag}</span>`).join('');
                    
                    const cardHTML = `
                        <div class="p-card sr">
                            <div class="p-badge badge-${product.badgeColor || 'green'}">${product.badge}</div>
                            <div class="p-thumb">${product.icon || '🥭'}</div>
                            <div class="p-body">
                                <h3 class="p-name">${product.name}</h3>
                                <p class="p-name-bn">${product.nameBn}</p>
                                <div class="p-tags">
                                    ${tagsHTML}
                                </div>
                                <p class="p-desc">${product.description}</p>
                                <div class="p-footer">
                                    <div class="p-price">৳${product.price} <span>${product.unit || '/ kg'}</span></div>
                                    <button class="p-btn">Add to Cart</button>
                                </div>
                            </div>
                        </div>
                    `;
                    productsGrid.insertAdjacentHTML('beforeend', cardHTML);
                });

                // Initialize animations and interactive buttons AFTER cards are injected into the DOM
                setupScrollReveal();
                setupCartHandlers();
            })
            .catch(error => {
                console.error('Error rendering products:', error);
                productsGrid.innerHTML = '<p style="color: var(--muted);">Failed to load fresh mangoes. Please ensure you are using a local server environment.</p>';
                
                // Fallback: still reveal the rest of the static elements if the database fails
                setupScrollReveal();
            });
    } else {
        setupScrollReveal();
    }

    // ════════════════════════════════
    // 2. STICKY NAVIGATION BAR EFFECT
    // ════════════════════════════════
    const mainNav = document.getElementById('mainNav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            mainNav.classList.add('scrolled');
        } else {
            mainNav.classList.remove('scrolled');
        }
    });

    // ════════════════════════════════
    // 3. RESPONSIVE MOBILE MENU TOGGLE
    // ════════════════════════════════
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });

        // Close mobile dropdown cleanly when any link inside it is tapped
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('open');
                mobileMenu.classList.remove('open');
            });
        });
    }

    // ════════════════════════════════
    // 4. SCROLL REVEAL ANIMATIONS
    // ════════════════════════════════
    function setupScrollReveal() {
        const srEls = document.querySelectorAll('.sr');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const siblings = e.target.parentElement.querySelectorAll('.sr');
                    siblings.forEach((sib, idx) => {
                        if (!sib.classList.contains('in')) {
                            setTimeout(() => sib.classList.add('in'), idx * 80);
                        }
                    });
                    e.target.classList.add('in');
                    observer.unobserve(e.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        
        srEls.forEach(el => observer.observe(el));
    }

    // ════════════════════════════════
    // 5. ADD TO CART INTERACTION
    // ════════════════════════════════
    function setupCartHandlers() {
        document.querySelectorAll('.p-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const name = this.closest('.p-card').querySelector('.p-name').textContent;
                const orig = this.textContent;
                
                this.textContent = '✓ Added!';
                this.style.background = 'var(--moss)';
                this.disabled = true;
                
                setTimeout(() => {
                    this.textContent = orig;
                    this.style.background = '';
                    this.disabled = false;
                }, 2000);
            });
        });
    }
});

// ════════════════════════════════
// 6. NEWSLETTER SUBSCRIBE FORM
// (Kept globally-scoped because index.html utilizes inline 'onclick')
// ════════════════════════════════
function handleSubscribe(btn) {
    const input = btn.previousElementSibling;
    if (!input.value.trim()) {
        input.style.borderColor = 'var(--honey)';
        input.placeholder = 'Please enter your phone or email';
        input.focus();
        return;
    }
    
    const origText = btn.textContent;
    btn.textContent = 'Subscribed! 🎉';
    btn.disabled = true;
    input.value = '';
    
    setTimeout(() => {
        btn.textContent = origText;
        btn.disabled = false;
    }, 3000);
}
