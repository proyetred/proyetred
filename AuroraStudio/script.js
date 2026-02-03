document.addEventListener('DOMContentLoaded', function() {

    const heroTitle = document.querySelector('.hero-text h1');
    if (heroTitle) {
        const text = heroTitle.textContent.trim();
        heroTitle.innerHTML = '';
        heroTitle.classList.add('innovative-title');

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.innerHTML = char === ' ' ? '&nbsp;' : char;
            span.style.transitionDelay = `${index * 0.03}s`;
            heroTitle.appendChild(span);
        });

        setTimeout(() => {
            heroTitle.classList.add('visible');
        }, 100);
    }


    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-links a');
    const menuToggle = document.getElementById('menu-toggle');
    const sections = document.querySelectorAll('main section, header .hero');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(13, 13, 13, 0.95)';
        } else {
            navbar.style.backgroundColor = 'rgba(13, 13, 13, 0.8)';
        }
    });

    if (navLinks.length && menuToggle) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    menuToggle.checked = false;
                }
            });
        });
    }

    const scrollSpyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { rootMargin: '-50% 0px -50% 0px' });

    sections.forEach(section => {
        scrollSpyObserver.observe(section);
    });


    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });

    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const modal = document.getElementById('portfolio-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const closeModal = document.querySelector('.close-button');

    portfolioItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const title = item.getAttribute('data-title');
            const description = item.getAttribute('data-description');

            modalImg.src = img.src;
            modalTitle.textContent = title;
            modalDescription.textContent = description;
            modal.style.display = 'block';
        });
    });

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Mini-Game Initialization (only if the canvas exists on the page)
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        const rocketIcon = document.querySelector('.rocket-icon');
        const gameModal = document.getElementById('game-modal');
        const gameCloseButton = document.querySelector('.game-close-button');
        const startMenu = document.getElementById('start-menu');
        const shipSelection = document.getElementById('ship-selection');
        const playButton = document.getElementById('play-button');

        const game = new Game(gameCanvas);

        function showMenu() {
            if (startMenu) startMenu.style.display = 'block';
            if (gameCanvas) gameCanvas.style.display = 'none';
            if (game.audio && game.audio.menu) game.audio.menu.play();
        }

        if (game.canvas) {
            game.canvas.addEventListener('showMenu', showMenu);
        }

        if (rocketIcon) {
            rocketIcon.addEventListener('click', () => {
                if (gameModal) gameModal.style.display = 'flex';
                showMenu();
            });
        }

        if (gameCloseButton) {
            gameCloseButton.addEventListener('click', () => {
                if (gameModal) gameModal.style.display = 'none';
                if (game && typeof game.stop === 'function') game.stop();
            });
        }

        if (shipSelection) {
            shipSelection.addEventListener('click', (e) => {
                if (e.target.classList.contains('ship-option')) {
                    for (let child of shipSelection.children) {
                        child.classList.remove('selected');
                    }
                    e.target.classList.add('selected');
                    game.playerShip = e.target.dataset.ship;
                }
            });
        }

        if (playButton) {
            playButton.addEventListener('click', () => {
                if (game && typeof game.setupAudio === 'function') game.setupAudio();
                if (game.audioContext && game.audioContext.state === 'suspended') {
                    game.audioContext.resume();
                }
                if (startMenu) startMenu.style.display = 'none';
                if (gameCanvas) gameCanvas.style.display = 'block';
                if (game.audio && game.audio.menu) game.audio.menu.pause();
                if (game && typeof game.init === 'function') game.init();
                if (game && typeof game.start === 'function') game.start();
            });
        }

        window.addEventListener('keydown', (e) => { if (game && typeof game.handleKeyDown === 'function') game.handleKeyDown(e); });
        window.addEventListener('keyup', (e) => { if (game && typeof game.handleKeyUp === 'function') game.handleKeyUp(e); });

        // Mobile Controls Logic
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        const upBtn = document.getElementById('up-btn');
        const downBtn = document.getElementById('down-btn');
        const shootBtn = document.getElementById('shoot-btn');

        // Use a map to track active touches
        const activeTouches = new Map();

        const handleTouchStart = (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.target === leftBtn) {
                    game.keys['ArrowLeft'] = true;
                    activeTouches.set(touch.identifier, 'left');
                } else if (touch.target === rightBtn) {
                    game.keys['ArrowRight'] = true;
                    activeTouches.set(touch.identifier, 'right');
                } else if (touch.target === upBtn) {
                    game.keys['ArrowUp'] = true;
                    activeTouches.set(touch.identifier, 'up');
                } else if (touch.target === downBtn) {
                    game.keys['ArrowDown'] = true;
                    activeTouches.set(touch.identifier, 'down');
                } else if (touch.target === shootBtn) {
                    if (game && typeof game.shoot === 'function') game.shoot();
                }
            }
        };

        const handleTouchEnd = (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const control = activeTouches.get(touch.identifier);
                if (control === 'left') {
                    game.keys['ArrowLeft'] = false;
                } else if (control === 'right') {
                    game.keys['ArrowRight'] = false;
                } else if (control === 'up') {
                    game.keys['ArrowUp'] = false;
                } else if (control === 'down') {
                    game.keys['ArrowDown'] = false;
                }
                activeTouches.delete(touch.identifier);
            }
        };

        const controlsContainer = document.querySelector('.mobile-controls-container');
        if (controlsContainer) {
            controlsContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            controlsContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
            controlsContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        }
    } // end if (gameCanvas)

    // Policies modal: show only when policies version has changed
    const policyModal = document.getElementById('policy-modal');
    const acceptPoliciesBtn = document.getElementById('accept-policies');
    const versionMeta = document.querySelector('meta[name="policies-version"]');
    const currentVersion = versionMeta ? versionMeta.content : null;
    const urlParams = new URLSearchParams(window.location.search);
    const forceShowPolicies = urlParams.get('showPolicies') === '1';

    // Ensure the policy modal lives under document.body so fixed positioning works
    if (policyModal && policyModal.parentElement !== document.body) {
        try {
            document.body.appendChild(policyModal);
        } catch (e) {
            console.warn('Could not move policy modal to body', e);
        }
    }
    // Force overlay styles to avoid footer/stacking issues
    if (policyModal) {
        try {
            policyModal.style.position = 'fixed';
            policyModal.style.top = '0';
            policyModal.style.left = '0';
            policyModal.style.width = '100%';
            policyModal.style.height = '100%';
            policyModal.style.display = policyModal.hasAttribute('hidden') ? 'none' : 'flex';
            policyModal.style.alignItems = 'center';
            policyModal.style.justifyContent = 'center';
            policyModal.style.background = 'rgba(0,0,0,0.78)';
            policyModal.style.zIndex = '99999';
            policyModal.style.padding = '20px';
        } catch (e) {
            console.warn('Could not apply inline styles to policy modal', e);
        }
    }

    function hidePolicyModal() {
        if (policyModal) {
            policyModal.setAttribute('hidden', '');
            try { policyModal.style.display = 'none'; } catch(e){}
            document.body.style.overflow = '';
        }
    }

    if (policyModal && currentVersion) {
        const acceptedVersion = localStorage.getItem('policiesAcceptedVersion');
        if (forceShowPolicies) {
            // For testing/dev: force the modal visible regardless of stored acceptance
            policyModal.removeAttribute('hidden');
            try { policyModal.style.display = 'flex'; } catch (e) {}
        } else if (acceptedVersion === currentVersion) {
            hidePolicyModal();
        } else {
            policyModal.removeAttribute('hidden');
            try { policyModal.style.display = 'flex'; } catch(e){}
        }
    }

    if (acceptPoliciesBtn && currentVersion) {
        acceptPoliciesBtn.addEventListener('click', () => {
            localStorage.setItem('policiesAcceptedVersion', currentVersion);
            hidePolicyModal();
        });
    }

    // Safety: if body overflow remains hidden but modal is not visible, restore scrolling
    setTimeout(() => {
        try {
            const pm = document.getElementById('policy-modal');
            const bodyOverflow = window.getComputedStyle(document.body).overflow;
            if (bodyOverflow === 'hidden' && (!pm || pm.hasAttribute('hidden'))) {
                console.warn('Restoring body overflow (safety)');
                document.body.style.overflow = '';
            }
        } catch (e) {
            console.error('Error in overflow safety check', e);
        }
    }, 1500);

    // Observe policy-modal attribute changes to ensure scrolling is restored when hidden
    if (policyModal) {
        try {
            const mo = new MutationObserver((records) => {
                for (const r of records) {
                    if (r.type === 'attributes' && r.attributeName === 'hidden') {
                        if (policyModal.hasAttribute('hidden')) {
                            document.body.style.overflow = '';
                        }
                    }
                }
            });
            mo.observe(policyModal, { attributes: true });
        } catch (e) {
            console.error('MutationObserver failed', e);
        }
    }

});

/* -- Testimonios: revelado por scroll -- */
(function(){
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.stats-list .stat-card, .microtestimonials-grid .microtestimonial').forEach(el => el.classList.add('in-view'));
        return;
    }

    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18 });

    document.querySelectorAll('.stats-list .stat-card, .microtestimonials-grid .microtestimonial').forEach(el => io.observe(el));
})();

/* -- Comentarios: manejo de formulario (envío y visualización) -- */
(function(){
    const form = document.getElementById('comment-form');
    const list = document.getElementById('comments-list');
    const status = document.getElementById('comment-status');
    const endpoint = form ? form.getAttribute('action') : null;
    const STORAGE_KEY = 'pry_comments_v1';

    function generateAvatarDataUrl(name){
        const initials = (name || 'A').split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('') || 'A';
        const colors = ['#9370DB','#8058B8','#00FFF9','#FF80FF','#FF6B6B'];
        const color = colors[(initials.charCodeAt(0) + initials.charCodeAt(initials.length-1)) % colors.length];
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
            <defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='${color}'/><stop offset='1' stop-color='#2F2B52'/></linearGradient></defs>
            <rect width='100%' height='100%' rx='64' fill='url(#g)' />
            <text x='50%' y='56%' font-family='Poppins, Arial' font-size='54' fill='white' text-anchor='middle' dominant-baseline='middle'>${initials}</text>
        </svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    function appendComment(name, text, avatarUrl, dateLabel){
        const wrap = document.createElement('div');
        wrap.className = 'comment in-view';
        const avatar = document.createElement('div'); avatar.className = 'c-avatar';
        const img = document.createElement('img'); img.src = avatarUrl || generateAvatarDataUrl(name);
        img.alt = name || 'avatar';
        avatar.appendChild(img);
        const body = document.createElement('div'); body.className = 'c-body';
        const meta = document.createElement('div'); meta.className = 'c-meta'; meta.innerHTML = `<strong>${name}</strong> · <span class="c-date">${dateLabel || 'Ahora'}</span>`;
        const ctext = document.createElement('div'); ctext.className = 'c-text'; ctext.textContent = text;
        body.appendChild(meta); body.appendChild(ctext);
        wrap.appendChild(avatar); wrap.appendChild(body);
        if(list) list.insertBefore(wrap, list.firstChild);
    }

    function loadSavedComments(){
        try{
            const raw = localStorage.getItem(STORAGE_KEY);
            if(!raw) return;
            const arr = JSON.parse(raw);
            if(!Array.isArray(arr)) return;
            arr.slice().reverse().forEach(c => {
                appendComment(c.name || 'Anónimo', c.comment || '', c.avatar || generateAvatarDataUrl(c.name), c.dateLabel || formatDate(c.date));
            });
        }catch(e){ console.warn('loadSavedComments error', e); }
    }

    function saveCommentToStorage(obj){
        try{
            const raw = localStorage.getItem(STORAGE_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            arr.unshift(obj);
            if(arr.length > 50) arr.length = 50;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        }catch(e){ console.warn('saveCommentToStorage', e); }
    }

    function formatDate(iso){
        if(!iso) return 'Ahora';
        try{ const d = new Date(iso); return d.toLocaleDateString(); } catch(e){ return 'Ahora'; }
    }

    if(!form){ loadSavedComments(); return; }

    // load saved comments first (so user comments appear on top)
    loadSavedComments();

    form.addEventListener('submit', function(e){
        e.preventDefault();
        const name = document.getElementById('comment-name').value.trim() || 'Anónimo';
        const comment = document.getElementById('comment-text').value.trim();
        if(!comment) return;

        const avatar = generateAvatarDataUrl(name);
        const nowISO = new Date().toISOString();
        // Optimista: mostrar inmediatamente
        appendComment(name, comment, avatar, 'Ahora');
        saveCommentToStorage({ name, comment, avatar, date: nowISO, dateLabel: 'Ahora' });

        status.textContent = 'Enviando...';
        form.querySelector('button[type="submit"]').disabled = true;

        if(endpoint){
            const fd = new FormData();
            fd.append('name', name);
            fd.append('comment', comment);
            fd.append('_subject', form.querySelector('input[name="_subject"]').value || 'Nuevo comentario');

            fetch(endpoint, { method: 'POST', body: fd }).then(resp => {
                if(resp.ok){ status.textContent = 'Gracias — tu comentario se envió.'; }
                else { status.textContent = 'Error al enviar, comentario guardado localmente.'; }
            }).catch(() => { status.textContent = 'Error de red — comentario guardado localmente.'; })
            .finally(() => {
                form.reset();
                form.querySelector('button[type="submit"]').disabled = false;
                setTimeout(()=> status.textContent = '', 4000);
            });
        } else {
            status.textContent = 'Comentario añadido localmente.';
            form.reset();
            form.querySelector('button[type="submit"]').disabled = false;
            setTimeout(()=> status.textContent = '', 3000);
        }
    });
})();