// ===========================
// Tarot Agent - Application Logic & AI Spiritual Mentor
// ===========================

(function () {
    'use strict';

    // ---- Constants & Config ----
    const DEFAULT_AI_CONFIG = {
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        model: 'deepseek-chat',
        systemPrompt: 'You are an ancient, empathetic Tarot Master and Spiritual Mentor versed in sacred symbolism, archetypal astrology, and Jungian psychology. In your reading, synthesize the querent\'s question, card positions, upright/reversed meanings, and dynamic energetic interplays across all cards to provide deep, poetic, warm, and highly actionable counsel.'
    };

    const PROVIDER_PRESETS = {
        deepseek: {
            baseUrl: 'https://api.deepseek.com/v1',
            model: 'deepseek-chat'
        },
        siliconflow: {
            baseUrl: 'https://api.siliconflow.cn/v1',
            model: 'deepseek-ai/DeepSeek-V3'
        },
        openai: {
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini'
        },
        moonshot: {
            baseUrl: 'https://api.moonshot.cn/v1',
            model: 'moonshot-v1-8k'
        },
        zhipu: {
            baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            model: 'glm-4-flash'
        },
        custom: {
            baseUrl: '',
            model: ''
        }
    };

    // ---- State ----
    const state = {
        currentPage: 'landing',
        selectedSpread: null,
        selectedCategory: 'general',
        question: '',
        selectedCards: [],
        readingCards: [],
        cardsNeeded: 0,
        aiMode: true,
        isGenerating: false,
        chatHistory: [] // For follow-up conversation
    };

    // ---- Helpers ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    function getAiConfig() {
        try {
            const raw = localStorage.getItem('tarot_ai_config');
            if (raw) return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
        } catch (e) {}
        return { ...DEFAULT_AI_CONFIG };
    }

    function saveAiConfig(cfg) {
        localStorage.setItem('tarot_ai_config', JSON.stringify(cfg));
        updateAiBadgeStatus();
    }

    function updateAiBadgeStatus() {
        const cfg = getAiConfig();
        const badge = $('#ai-status-badge');
        const navIndicator = $('#nav-ai-indicator');
        const isConfigured = !!(cfg.apiKey && cfg.apiKey.trim().length > 0);

        if (badge) {
            if (isConfigured) {
                badge.className = 'badge badge-success';
                badge.textContent = `✅ AI Agent Configured (${cfg.model || 'Active'})`;
            } else {
                badge.className = 'badge badge-warning';
                badge.textContent = 'No API Key (Using Classic Offline Library)';
            }
        }

        if (navIndicator) {
            navIndicator.className = isConfigured ? 'nav-btn-indicator active' : 'nav-btn-indicator';
            navIndicator.title = isConfigured ? 'AI Agent Connected' : 'AI Key Not Configured';
        }
    }

    // ---- Initialization ----
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        createStars();
        bindNavigation();
        bindSpreadSelection();
        bindCategoryButtons();
        bindActionButtons();
        bindMeaningsFilter();
        bindAiSettingsModal();
        bindAiChat();
        updateAiBadgeStatus();
        loadMeaningsPage('major');
        initCard3DTilt();
    }

    // ---- Stars Background ----
    function createStars() {
        const container = $('#stars-bg');
        if (!container) return;
        const count = 150;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 3 + 1;
            star.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                --duration: ${Math.random() * 3 + 2}s;
                animation-delay: ${Math.random() * 3}s;
            `;
            container.appendChild(star);
        }
    }

    // ---- Navigation ----
    function bindNavigation() {
        // Nav links
        $$('.nav-link').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateTo(link.dataset.page);
            });
        });

        // Nav brand
        const brand = $('.nav-brand');
        if (brand) {
            brand.addEventListener('click', function (e) {
                e.preventDefault();
                navigateTo('landing');
            });
        }

        // Nav toggle (mobile)
        const toggle = $('#nav-toggle');
        const navLinks = $('#nav-links');
        if (toggle && navLinks) {
            toggle.addEventListener('click', function () {
                toggle.classList.toggle('open');
                navLinks.classList.toggle('open');
            });
        }

        // Back buttons
        $$('.btn-back').forEach(function (btn) {
            btn.addEventListener('click', function () {
                navigateTo(btn.dataset.page);
            });
        });
    }

    function navigateTo(pageId) {
        $$('.page').forEach(function (p) { p.classList.remove('active'); });

        const target = $('#' + pageId + '-page');
        if (target) {
            target.classList.add('active');
            target.style.animation = 'none';
            target.offsetHeight; // force reflow
            target.style.animation = '';
        }

        $$('.nav-link').forEach(function (link) {
            link.classList.toggle('active', link.dataset.page === pageId);
        });

        const toggle = $('#nav-toggle');
        if (toggle) toggle.classList.remove('open');
        const navLinks = $('#nav-links');
        if (navLinks) navLinks.classList.remove('open');

        window.scrollTo({ top: 0, behavior: 'smooth' });
        state.currentPage = pageId;

        if (window.CelestialSpace && typeof window.CelestialSpace.setMode === 'function') {
            if (pageId === 'landing') {
                window.CelestialSpace.setMode('idle');
            } else {
                window.CelestialSpace.setMode('divination');
            }
        }
    }

    // ---- AI Settings Modal Logic ----
    function bindAiSettingsModal() {
        const modal = $('#settings-modal');
        const openNavBtn = $('#open-settings-nav-btn');
        const quickBtn = $('#quick-settings-btn');
        const closeBtn = $('#settings-close-btn');
        const overlay = $('#settings-overlay');
        const saveBtn = $('#save-settings-btn');
        const testBtn = $('#test-api-btn');
        const providerSelect = $('#api-provider-select');
        const baseUrlInput = $('#api-base-url');
        const apiKeyInput = $('#api-key');
        const modelInput = $('#api-model');
        const systemPromptInput = $('#api-system-prompt');
        const toggleKeyBtn = $('#toggle-key-visibility');
        const statusBox = $('#settings-status-box');

        function openModal() {
            if (!modal) return;
            const cfg = getAiConfig();
            if (providerSelect) providerSelect.value = cfg.provider || 'deepseek';
            if (baseUrlInput) baseUrlInput.value = cfg.baseUrl || DEFAULT_AI_CONFIG.baseUrl;
            if (apiKeyInput) apiKeyInput.value = cfg.apiKey || '';
            if (modelInput) modelInput.value = cfg.model || DEFAULT_AI_CONFIG.model;
            if (systemPromptInput) systemPromptInput.value = cfg.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt;
            if (statusBox) statusBox.style.display = 'none';

            modal.style.display = 'flex';
            document.body.classList.add('modal-open');
        }

        function closeModal() {
            if (!modal) return;
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }

        if (openNavBtn) openNavBtn.addEventListener('click', openModal);
        if (quickBtn) quickBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);

        // ESC Key to close modal
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
                closeModal();
            }
        });

        // Toggle Key Visibility
        if (toggleKeyBtn && apiKeyInput) {
            toggleKeyBtn.addEventListener('click', function () {
                if (apiKeyInput.type === 'password') {
                    apiKeyInput.type = 'text';
                    toggleKeyBtn.textContent = '🔒';
                } else {
                    apiKeyInput.type = 'password';
                    toggleKeyBtn.textContent = '👁️';
                }
            });
        }

        // Provider Select Change
        if (providerSelect) {
            providerSelect.addEventListener('change', function () {
                const preset = PROVIDER_PRESETS[providerSelect.value];
                if (preset) {
                    if (preset.baseUrl && baseUrlInput) baseUrlInput.value = preset.baseUrl;
                    if (preset.model && modelInput) modelInput.value = preset.model;
                }
            });
        }

        // Test API Connection
        if (testBtn) {
            testBtn.addEventListener('click', async function () {
                const baseUrl = baseUrlInput.value.trim() || DEFAULT_AI_CONFIG.baseUrl;
                const key = apiKeyInput.value.trim();
                const model = modelInput.value.trim() || DEFAULT_AI_CONFIG.model;

                if (!key) {
                    showStatus('❌ Please enter an API Key first before testing connection.', 'error');
                    return;
                }

                showStatus('⚡ Testing connection to LLM...', 'info');
                testBtn.disabled = true;

                let endpoint = baseUrl;
                if (!endpoint.endsWith('/chat/completions')) {
                    endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
                }

                try {
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + key
                        },
                        body: JSON.stringify({
                            model: model || 'deepseek-chat',
                            messages: [{ role: 'user', content: 'Reply with one word: Ready' }],
                            max_tokens: 10
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const reply = data.choices?.[0]?.message?.content || 'Ready';
                        showStatus(`✅ Connection successful! Model response: "${reply.trim()}"`, 'success');
                    } else {
                        const err = await res.text();
                        showStatus(`❌ Connection failed (HTTP ${res.status}): ${err.slice(0, 150)}`, 'error');
                    }
                } catch (e) {
                    showStatus(`❌ Request error: ${e.message}. If blocked by CORS, ensure endpoint supports cross-origin requests.`, 'error');
                } finally {
                    testBtn.disabled = false;
                }
            });
        }

        // Save Settings
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                const newCfg = {
                    provider: providerSelect.value,
                    baseUrl: baseUrlInput.value.trim() || DEFAULT_AI_CONFIG.baseUrl,
                    apiKey: apiKeyInput.value.trim(),
                    model: modelInput.value.trim() || DEFAULT_AI_CONFIG.model,
                    systemPrompt: systemPromptInput.value.trim() || DEFAULT_AI_CONFIG.systemPrompt
                };

                saveAiConfig(newCfg);
                showToast('✅ AI configuration saved successfully!');
                closeModal();
            });
        }

        function showStatus(msg, type) {
            if (!statusBox) return;
            statusBox.style.display = 'block';
            statusBox.className = 'settings-status-box status-' + type;
            statusBox.textContent = msg;
        }
    }

    // ---- Spread Selection ----
    function bindSpreadSelection() {
        $$('.spread-card').forEach(function (card) {
            card.addEventListener('click', function () {
                state.selectedSpread = card.dataset.spread;
                navigateTo('question');
            });
        });
    }

    // ---- Category Buttons ----
    function bindCategoryButtons() {
        $$('.category-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                $$('.category-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                state.selectedCategory = btn.dataset.category;
            });
        });
    }

    // ---- Action Buttons ----
    function bindActionButtons() {
        const startBtn = $('#start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', function () {
                if (window.CelestialSpace && typeof window.CelestialSpace.triggerCosmicAlignment === 'function') {
                    startBtn.style.pointerEvents = 'none';
                    startBtn.style.opacity = '0.75';
                    window.CelestialSpace.triggerCosmicAlignment(function () {
                        startBtn.style.pointerEvents = '';
                        startBtn.style.opacity = '';
                        navigateTo('spread');
                    });
                } else {
                    navigateTo('spread');
                }
            });
        }

        const exploreBtn = $('#explore-meanings-btn');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', function () {
                navigateTo('meanings');
            });
        }

        const beginBtn = $('#begin-btn');
        if (beginBtn) {
            beginBtn.addEventListener('click', function () {
                state.question = ($('#question-text') || {}).value || '';
                const aiToggle = $('#ai-mode-toggle');
                state.aiMode = aiToggle ? aiToggle.checked : true;
                startReading();
            });
        }

        const revealBtn = $('#reveal-btn');
        if (revealBtn) {
            revealBtn.addEventListener('click', revealReading);
        }

        const shareBtn = $('#share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', shareReading);
        }

        const newBtn = $('#new-reading-btn');
        if (newBtn) {
            newBtn.addEventListener('click', function () {
                resetState();
                navigateTo('spread');
            });
        }
    }

    // ---- 3D Card Hover & Tilt Dynamic Response ----
    function initCard3DTilt() {
        document.addEventListener('mousemove', function (e) {
            const card = e.target.closest('.tarot-card:not(.disabled), .spread-card, .pillar-card');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = (y - centerY) / centerY * -8;
            const tiltY = (x - centerX) / centerX * 8;
            card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-8px)`;
        });

        document.addEventListener('mouseout', function (e) {
            const card = e.target.closest('.tarot-card, .spread-card, .pillar-card');
            if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
                card.style.transform = '';
            }
        });
    }

    // ---- Start Reading ----
    function startReading() {
        const spread = window.TarotSpreads[state.selectedSpread];
        if (!spread) return;

        state.cardsNeeded = spread.cardCount;
        state.selectedCards = [];
        state.readingCards = [];
        state.chatHistory = [];

        const cardsNeeded = $('#cards-needed');
        if (cardsNeeded) cardsNeeded.textContent = spread.cardCount;

        navigateTo('reading');
        generateCardDeck();
        updateSelectedArea();

        const revealBtn = $('#reveal-btn');
        if (revealBtn) revealBtn.style.display = 'none';
    }

    function generateCardDeck() {
        const deck = $('#card-deck');
        if (!deck) return;
        deck.innerHTML = '';

        const totalCards = Math.min(22, Math.max(state.cardsNeeded * 4, 14));

        for (let i = 0; i < totalCards; i++) {
            const cardEl = document.createElement('div');
            cardEl.className = 'tarot-card deal-animation';
            cardEl.style.animationDelay = (i * 0.04) + 's';
            cardEl.innerHTML =
                '<div class="tarot-card-inner">' +
                    '<div class="tarot-card-back">' +
                        '<div class="card-back-pattern">' +
                            '<div class="back-sacred-symbol">' +
                                '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                                    '<circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="0.75" stroke-dasharray="1.5 2"/>' +
                                    '<circle cx="20" cy="20" r="11" stroke="currentColor" stroke-width="0.8"/>' +
                                    '<path d="M20 4 L22.5 17.5 L36 20 L22.5 22.5 L20 36 L17.5 22.5 L4 20 L17.5 17.5 Z" fill="currentColor" fill-opacity="0.3"/>' +
                                    '<circle cx="20" cy="20" r="2" fill="currentColor"/>' +
                                '</svg>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="tarot-card-front"></div>' +
                '</div>';

            cardEl.addEventListener('click', function () {
                selectCard(cardEl, i);
            });

            deck.appendChild(cardEl);
        }
    }

    function selectCard(cardEl, index) {
        if (state.selectedCards.length >= state.cardsNeeded) return;
        if (cardEl.classList.contains('selected')) return;
        if (cardEl.classList.contains('disabled')) return;

        cardEl.classList.add('selected', 'flipped');

        const allCards = window.TarotDeck.getAllCards();
        let card;
        let attempts = 0;
        do {
            card = allCards[Math.floor(Math.random() * allCards.length)];
            attempts++;
        } while (
            state.selectedCards.some(function (sc) { return sc.card.id === card.id; }) &&
            attempts < 200
        );

        const isReversed = Math.random() < 0.35; // 35% chance reversed

        const front = cardEl.querySelector('.tarot-card-front');
        if (front) {
            front.innerHTML =
                '<span class="card-emoji"' + (isReversed ? ' style="transform: rotate(180deg)"' : '') + '>' + card.emoji + '</span>' +
                '<span class="card-name-cn">' + card.name + '</span>' +
                '<span class="card-name-en">' + (card.numeral ? card.numeral + (card.suit ? ' · ' + card.suit.toUpperCase() : '') : 'Major Arcana') + '</span>' +
                '<span class="card-orientation ' + (isReversed ? 'card-reversed' : 'card-upright') + '">' + (isReversed ? 'REVERSED' : 'UPRIGHT') + '</span>';
        }

        const selectedCard = { card: card, isReversed: isReversed, index: index };
        state.selectedCards.push(selectedCard);
        state.readingCards.push(selectedCard);

        updateSelectedArea();

        if (state.selectedCards.length >= state.cardsNeeded) {
            $$('.tarot-card:not(.selected)').forEach(function (c) {
                c.classList.add('disabled');
            });
            const revealBtn = $('#reveal-btn');
            if (revealBtn) {
                revealBtn.style.display = '';
                setTimeout(function () {
                    revealBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 150);
            }
        }
    }

    function updateSelectedArea() {
        const container = $('#selected-cards');
        if (!container) return;
        container.innerHTML = '';

        const spread = window.TarotSpreads[state.selectedSpread];
        if (!spread) return;

        state.selectedCards.forEach(function (sc, i) {
            const posName = (spread.positions[i] ? spread.positions[i].name : 'Position ' + (i + 1));
            const div = document.createElement('div');
            div.className = 'result-card-wrapper deal-animation';
            div.style.animationDelay = (i * 0.1) + 's';
            div.innerHTML =
                '<div class="result-position">' + posName + '</div>' +
                '<div class="result-card' + (sc.isReversed ? ' reversed-card' : '') + '">' +
                    '<span class="card-emoji">' + sc.card.emoji + '</span>' +
                    '<span class="card-name-cn">' + sc.card.name + '</span>' +
                    '<span class="card-orientation ' + (sc.isReversed ? 'card-reversed' : 'card-upright') + '">' + (sc.isReversed ? 'REVERSED' : 'UPRIGHT') + '</span>' +
                '</div>';
            container.appendChild(div);
        });
    }

    // ---- Reveal Reading ----
    function revealReading() {
        navigateTo('result');
        displayResults();
    }

    function displayResults() {
        const spread = window.TarotSpreads[state.selectedSpread];
        if (!spread) return;

        const resultQ = $('#result-question');
        if (resultQ) {
            if (state.question) {
                resultQ.textContent = '“' + state.question + '” · ' + spread.name;
            } else {
                resultQ.textContent = spread.name + ' · ' + getCategoryName(state.selectedCategory);
            }
        }

        // Display cards in spread layout
        const resultSpread = $('#result-spread');
        if (resultSpread) {
            resultSpread.innerHTML = '';

            state.readingCards.forEach(function (sc, i) {
                const pos = spread.positions[i] || { name: 'Position ' + (i + 1), description: '' };
                const wrapper = document.createElement('div');
                wrapper.className = 'result-card-wrapper deal-animation';
                wrapper.style.animationDelay = (i * 0.15) + 's';
                wrapper.innerHTML =
                    '<div class="result-position">' + pos.name + '</div>' +
                    '<div class="result-card">' +
                        '<span class="card-emoji"' + (sc.isReversed ? ' style="transform: rotate(180deg)"' : '') + '>' + sc.card.emoji + '</span>' +
                        '<span class="card-name-cn">' + sc.card.name + '</span>' +
                        '<span class="card-name-en">' + (sc.card.numeral ? sc.card.numeral : '') + '</span>' +
                        '<span class="card-orientation ' + (sc.isReversed ? 'card-reversed' : 'card-upright') + '">' + (sc.isReversed ? 'REVERSED' : 'UPRIGHT') + '</span>' +
                    '</div>' +
                    '<div class="card-tap-hint">Tap for card details ↗</div>';

                (function (selectedCard, position) {
                    wrapper.addEventListener('click', function () {
                        showCardDetail(selectedCard, position);
                    });
                })(sc, pos);

                resultSpread.appendChild(wrapper);
            });
        }

        // Determine AI or Classic Reading
        const aiContainer = $('#ai-reading-container');
        const chatSection = $('#ai-chat-section');
        const classicContainer = $('#overall-reading');
        const cfg = getAiConfig();

        if (state.aiMode) {
            if (cfg.apiKey && cfg.apiKey.trim().length > 0) {
                // Configured! Run AI Tarot Master Agent
                if (classicContainer) classicContainer.style.display = 'none';
                if (chatSection) chatSection.style.display = 'block';
                initAiReading();
            } else {
                // Not configured: Show gentle prompt banner + classic reading
                if (aiContainer) {
                    aiContainer.innerHTML =
                        '<div class="ai-agent-card" style="border-style:dashed;">' +
                            '<div class="ai-agent-header">' +
                                '<div class="ai-agent-profile">' +
                                    '<div class="ai-agent-avatar">🔮</div>' +
                                    '<div class="ai-agent-title">' +
                                        '<h3>AI Tarot Master</h3>' +
                                        '<p>Deep Archetypal Reading Mode</p>' +
                                    '</div>' +
                                '</div>' +
                                '<button type="button" class="btn btn-secondary" id="prompt-setup-key-btn">⚙️ Configure API Key</button>' +
                            '</div>' +
                            '<p style="color:var(--text-secondary); line-height:1.7;">' +
                                '💡 You have selected AI Mode, but an LLM API Key has not been configured yet (supports DeepSeek, SiliconFlow, OpenAI, Kimi, etc.). ' +
                                'Once configured, you will unlock deep streaming readings and conversational follow-ups. In the meantime, here is your classical offline interpretation:' +
                            '</p>' +
                        '</div>';

                    const promptBtn = $('#prompt-setup-key-btn');
                    if (promptBtn) {
                        promptBtn.addEventListener('click', function () {
                            const modal = $('#settings-modal');
                            if (modal) modal.style.display = 'flex';
                        });
                    }
                }
                if (classicContainer) {
                    classicContainer.style.display = 'block';
                    generateOverallReading();
                }
                if (chatSection) chatSection.style.display = 'none';
            }
        } else {
            // Offline Classic Mode
            if (aiContainer) aiContainer.innerHTML = '';
            if (classicContainer) {
                classicContainer.style.display = 'block';
                generateOverallReading();
            }
            if (chatSection) chatSection.style.display = 'none';
        }
    }

    // ---- AI Master Interpretation Execution ----
    async function initAiReading() {
        const container = $('#ai-reading-container');
        if (!container) return;

        const cfg = getAiConfig();
        const spread = window.TarotSpreads[state.selectedSpread];

        container.innerHTML =
            '<div class="ai-agent-card">' +
                '<div class="ai-agent-header">' +
                    '<div class="ai-agent-profile">' +
                        '<div class="ai-agent-avatar">🔮</div>' +
                        '<div class="ai-agent-title">' +
                            '<h3>AI Tarot Master · Spiritual Deep Consultation</h3>' +
                            '<p>Synthesizing celestial energies and card interplays...</p>' +
                        '</div>' +
                    '</div>' +
                    '<span class="ai-model-tag">🤖 ' + (cfg.model || 'AI') + '</span>' +
                '</div>' +
                '<div class="ai-prose" id="ai-reading-prose">' +
                    '<div class="ai-typing-indicator">' +
                        '<span>The crystal sphere is tuning into your destiny</span>' +
                        '<span class="typing-dot"></span>' +
                        '<span class="typing-dot"></span>' +
                        '<span class="typing-dot"></span>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // Prepare Prompt
        const cardsDesc = state.readingCards.map(function (sc, i) {
            const pos = spread.positions[i] || { name: 'Position ' + (i + 1), description: '' };
            const orientation = sc.isReversed ? 'REVERSED' : 'UPRIGHT';
            const kws = (sc.isReversed ? sc.card.reversed.keywords : sc.card.upright.keywords).join(', ');
            return `[Position ${i + 1} - ${pos.name}] (Significance: ${pos.description})\n` +
                   `Drawn Card: ${sc.card.name} - ${orientation}\n` +
                   `Core Keywords: ${kws}`;
        }).join('\n\n');

        const userPrompt =
            `Querent Information:\n` +
            `- Domain of Focus: ${getCategoryName(state.selectedCategory)}\n` +
            `- Inquiry/Specific Question: ${state.question ? state.question : '(No specific question provided; provide overall life guidance)'}\n` +
            `- Chosen Spread: ${spread.name} (${spread.description})\n\n` +
            `Arrangement of Drawn Cards:\n${cardsDesc}\n\n` +
            `As an ancient Tarot Master, provide a structured, poetic, and profound interpretation strictly following these modules:\n` +
            `### ✦ Core Verdict & Direct Answer ✦\n` +
            `- **Overall Destiny Verdict**: Give an unambiguous qualitative synthesis (e.g., [Highly Auspicious · Unstoppable Momentum], [Favorable · Steady Ascent], [Breakthrough · Clearing Mists], [Prudent · Hold Fast and Await Timing], etc.)\n` +
            `- **Direct Answer**: Speak plainly in 2-3 sentences addressing the querent's core query and unfolding direction directly.\n` +
            `- **Action Compass**: Clearly articulate [Recommended Actions (Do)] and [Cautions to Avoid (Don't)].\n\n` +
            `### ✦ Card-by-Card Archetypal Analysis ✦\n` +
            `Analyze each card deeply according to its position and upright/reversed energy.\n\n` +
            `### ✦ Synthetic Energy Flow & Progression ✦\n` +
            `Examine the elemental harmony, friction, and narrative evolution between all cards.\n\n` +
            `### ✦ Celestial Parting Benediction ✦\n` +
            `A warm, uplifting closing message for the querent's journey.`;

        const messages = [
            { role: 'system', content: cfg.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        state.chatHistory = [
            { role: 'system', content: cfg.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        const proseEl = $('#ai-reading-prose');

        await streamAiResponse(messages, function (fullText) {
            if (proseEl) {
                proseEl.innerHTML = renderMarkdown(fullText) + '<span class="typing-cursor"></span>';
            }
        }, function (finalText) {
            if (proseEl) {
                proseEl.innerHTML = renderMarkdown(finalText);
            }
            state.chatHistory.push({ role: 'assistant', content: finalText });
        }, function (err) {
            if (proseEl) {
                proseEl.innerHTML =
                    '<div class="status-error" style="padding:15px; border-radius:8px;">' +
                        '<h4>❌ AI Consultation Interrupted</h4>' +
                        '<p>' + err.message + '</p>' +
                        '<p style="margin-top:10px;"><button class="btn btn-secondary btn-sm" id="retry-ai-btn">Try Again</button></p>' +
                    '</div>';
                const retryBtn = $('#retry-ai-btn');
                if (retryBtn) retryBtn.onclick = initAiReading;
            }
        });
    }

    // ---- Generic Streaming AI Caller ----
    async function streamAiResponse(messages, onChunk, onDone, onError) {
        const cfg = getAiConfig();
        let endpoint = cfg.baseUrl.trim();
        if (!endpoint.endsWith('/chat/completions')) {
            endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + cfg.apiKey.trim()
                },
                body: JSON.stringify({
                    model: cfg.model.trim() || 'deepseek-chat',
                    messages: messages,
                    stream: true,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line || line.startsWith(':')) continue;
                    if (line === 'data: [DONE]') continue;
                    if (line.startsWith('data: ')) {
                        try {
                            const parsed = JSON.parse(line.slice(6));
                            const delta = parsed.choices?.[0]?.delta?.content || '';
                            if (delta) {
                                fullText += delta;
                                onChunk(fullText);
                            }
                        } catch (e) {}
                    }
                }
            }

            onDone(fullText);
        } catch (err) {
            onError(err);
        }
    }

    // ---- Interactive Follow-up Chat ----
    function bindAiChat() {
        const input = $('#chat-input');
        const sendBtn = $('#chat-send-btn');

        if (!sendBtn || !input) return;

        function submitChat() {
            const query = input.value.trim();
            if (!query) return;
            if (state.isGenerating) return;

            input.value = '';
            appendChatMessage('user', query);

            state.chatHistory.push({ role: 'user', content: query });
            state.isGenerating = true;

            const botMsgEl = appendChatMessage('bot', 'Contemplating your inquiry...');
            const botContentEl = botMsgEl.querySelector('.msg-content');

            streamAiResponse(state.chatHistory, function (fullText) {
                if (botContentEl) {
                    botContentEl.innerHTML = renderMarkdown(fullText) + '<span class="typing-cursor"></span>';
                    scrollChatToBottom();
                }
            }, function (finalText) {
                state.isGenerating = false;
                if (botContentEl) {
                    botContentEl.innerHTML = renderMarkdown(finalText);
                    scrollChatToBottom();
                }
                state.chatHistory.push({ role: 'assistant', content: finalText });
            }, function (err) {
                state.isGenerating = false;
                if (botContentEl) {
                    botContentEl.innerHTML = `<span style="color:#e74c3c;">❌ Response obstructed: ${err.message}</span>`;
                }
            });
        }

        sendBtn.addEventListener('click', submitChat);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitChat();
            }
        });
    }

    function appendChatMessage(sender, text) {
        const container = $('#chat-messages');
        if (!container) return null;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg chat-msg-${sender}`;
        msgDiv.innerHTML = `<div class="msg-content">${renderMarkdown(text)}</div>`;
        container.appendChild(msgDiv);
        scrollChatToBottom();
        return msgDiv;
    }

    function scrollChatToBottom() {
        const container = $('#chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Simple Markdown Renderer
    function renderMarkdown(md) {
        if (!md) return '';
        let escaped = md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Headings
        escaped = escaped.replace(/^### (.*$)/gim, '<h4>$1</h4>');
        escaped = escaped.replace(/^## (.*$)/gim, '<h3>$1</h3>');
        escaped = escaped.replace(/^# (.*$)/gim, '<h2>$1</h2>');

        // Bold
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Unordered lists
        escaped = escaped.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');

        // Paragraphs
        const paras = escaped.split(/\n\s*\n/);
        return paras.map(function (p) {
            p = p.trim();
            if (p.startsWith('<h3>') || p.startsWith('<h4>') || p.startsWith('<h2>') || p.startsWith('<li>')) {
                if (p.includes('<li>') && !p.startsWith('<ul>')) {
                    return `<ul>${p}</ul>`;
                }
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
        }).join('');
    }

    // ---- Card Detail Modal (Traditional/Offline Meaning Only, No AI) ----
    function showCardDetail(sc, position) {
        const modal = $('#card-detail-modal');
        const body = $('#modal-body');
        if (!modal || !body) return;

        const data = sc.isReversed ? sc.card.reversed : sc.card.upright;
        const category = state.selectedCategory;

        let categoryReading = '';
        if (category !== 'general' && data[category]) {
            categoryReading =
                '<div class="modal-section">' +
                    '<h4>🎯 ' + getCategoryName(category) + ' Specific Insight</h4>' +
                    '<p>' + data[category] + '</p>' +
                '</div>';
        }

        let keywordsHtml = '';
        if (data.keywords && data.keywords.length) {
            keywordsHtml = data.keywords.map(function (k) {
                return '<span class="modal-keyword">' + k + '</span>';
            }).join('');
        }

        body.innerHTML =
            '<div class="modal-emoji"' + (sc.isReversed ? ' style="transform: rotate(180deg);"' : '') + '>' + sc.card.emoji + '</div>' +
            '<h3>' + sc.card.name + '</h3>' +
            '<p class="modal-card-en">' + (sc.card.numeral ? sc.card.numeral + (sc.card.suit ? ' · ' + sc.card.suit.toUpperCase() : '') : 'Major Arcana') + '</p>' +
            '<span class="modal-orientation ' + (sc.isReversed ? 'card-reversed' : 'card-upright') + '">' + (sc.isReversed ? '🔄 REVERSED SHADOW' : '✨ UPRIGHT LIGHT') + '</span>' +
            '<div class="modal-section">' +
                '<h4>📍 Position Archetype: ' + position.name + '</h4>' +
                '<p>' + (position.description || 'Current energetic focal point') + '</p>' +
            '</div>' +
            '<div class="modal-section">' +
                '<h4>🔮 Traditional Archetypal Meaning</h4>' +
                '<p>' + (data.meaning || '') + '</p>' +
            '</div>' +
            categoryReading +
            '<div class="modal-section">' +
                '<h4>💡 Action & Mindset Counsel</h4>' +
                '<p>' + (data.advice || '') + '</p>' +
            '</div>' +
            '<div class="modal-section">' +
                '<h4>🏷️ Core Keywords</h4>' +
                '<div class="modal-keywords">' + keywordsHtml + '</div>' +
            '</div>';

        modal.style.display = 'flex';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) modalContent.scrollTop = 0;
        document.body.classList.add('modal-open');

        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        function closeModal() {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            document.removeEventListener('keydown', escHandler);
        }

        if (closeBtn) closeBtn.onclick = closeModal;
        if (overlay) overlay.onclick = closeModal;

        function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        }
        document.addEventListener('keydown', escHandler);
    }

    // ---- Classic Offline Overall Reading ----
    function generateOverallReading() {
        const container = $('#overall-reading');
        if (!container) return;

        const spread = window.TarotSpreads[state.selectedSpread];
        if (!spread) return;

        const cards = state.readingCards;
        const reversedCount = cards.filter(function (sc) { return sc.isReversed; }).length;

        let verdictHeadline = '';
        let verdictDesc = '';
        if (reversedCount === 0) {
            verdictHeadline = '【Auspicious · Flowing Forward】Energies Clear, Path Illuminated';
            verdictDesc = 'All cards manifest in upright radiance. Universal momentum flows unobstructed. Trust your instincts and step boldly into your power. This is your prime moment to coalesce intent into breakthrough. Recommended: Decisive action; Avoid: Hesitation.';
        } else if (reversedCount < cards.length / 2) {
            verdictHeadline = '【Favorable · Mindful Alignment】Mainstream Upward, Mind the Shadows';
            verdictDesc = 'The overarching trajectory progresses steadily. Occasional reversed cards advise examining habitual blind spots or subtle internal friction. Maintain self-awareness and slight strategic tuning to manifest your vision.';
        } else if (reversedCount === cards.length) {
            verdictHeadline = '【Introspection · Prudent Restructuring】Resistance Present, Gather Inner Power';
            verdictDesc = 'Reversed archetypes dominate the layout, signaling unresolved internal blockages or external friction. Refrain from forcing outcomes. Slow down, reflect deeply, and resolve foundational conflicts before taking flight.';
        } else {
            verdictHeadline = '【Breakthrough · Rebirth from Tension】Duality in Motion, Transforming the Old';
            verdictDesc = 'Opportunities and tests are dynamically intertwined. You stand at a pivotal threshold of metamorphosis. By releasing outdated assumptions and viewing the pattern from higher altitude, struggle swiftly becomes your catalyst for evolution.';
        }

        let html =
            '<div class="classic-reading-header">' +
                '<h3>📜 Holistic Synthesis & Card-by-Card Insight</h3>' +
                '<p class="classic-reading-sub">No clicks required. The core verdict, position symbolism, and comprehensive guidance are presented below</p>' +
            '</div>' +
            '<div class="reading-section" style="background:rgba(205, 187, 150, 0.08); border-radius:14px; padding:20px; margin-bottom:24px; border:1px solid var(--border-accent);">' +
                '<div style="font-family:var(--font-serif-en); font-size:1.22rem; font-weight:700; color:var(--gold-light); margin-bottom:8px;">' +
                    '✦ Core Verdict: ' + verdictHeadline +
                '</div>' +
                '<p style="color:#f6f5f1; line-height:1.75; font-size:0.96rem;">' + verdictDesc + '</p>' +
            '</div>';

        cards.forEach(function (sc, i) {
            const pos = spread.positions[i] || { name: 'Position ' + (i + 1), description: '' };
            const data = sc.isReversed ? sc.card.reversed : sc.card.upright;
            const orientation = sc.isReversed ? 'REVERSED' : 'UPRIGHT';
            const category = state.selectedCategory;

            let categoryDetail = '';
            if (category !== 'general' && data[category]) {
                categoryDetail =
                    '<div class="reading-category-tip">' +
                        '<strong>🎯 ' + getCategoryName(category) + ' Focus:</strong> ' + data[category] +
                    '</div>';
            }

            html +=
                '<div class="reading-section">' +
                    '<div class="reading-section-title">' +
                        '<span class="reading-section-num">' + (i + 1) + '</span>' +
                        '<h4>' + pos.name + ': ' + sc.card.name + ' · ' + orientation + ' (' + sc.card.emoji + ')</h4>' +
                    '</div>' +
                    '<p class="reading-pos-desc">📍 <strong>Position Significance:</strong> ' + (pos.description || '') + '</p>' +
                    '<p class="reading-card-meaning">🔮 <strong>Archetypal Interpretation:</strong> ' + (data.meaning || '') + '</p>' +
                    categoryDetail +
                    '<p class="reading-card-advice">💡 <strong>Action Guidance:</strong> ' + (data.advice || '') + '</p>' +
                '</div>';
        });

        html +=
            '<div class="reading-section reading-summary-section">' +
                '<h4>🌟 Synthesis & Final Reflection</h4>' +
                '<p>' + generateSummary() + '</p>' +
            '</div>';

        container.innerHTML = html;
    }

    function generateSummary() {
        const cards = state.readingCards;
        const majorCount = cards.filter(function (sc) { return !sc.card.suit; }).length;
        const reversedCount = cards.filter(function (sc) { return sc.isReversed; }).length;

        let summary = '';

        if (majorCount > cards.length / 2) {
            summary += 'A pronounced number of Major Arcana cards appeared, indicating that you are navigating a crucial turning point in life where the universe is signaling profound spiritual themes. ';
        } else if (majorCount > 0) {
            summary += 'Both Major and Minor Arcana cards appeared harmoniously, reflecting that your query bridges deep existential themes with practical, mundane reality. ';
        } else {
            summary += 'The presence of Minor Arcana cards suggests that your inquiry is anchored primarily in daily affairs, where practical details and incremental actions hold the key. ';
        }

        if (reversedCount > cards.length / 2) {
            summary += 'Multiple reversed archetypes invite you to examine internal hesitations, unaddressed emotional friction, and the need to perceive the pattern from an altered vantage point. ';
        } else if (reversedCount === 0 && cards.length > 1) {
            summary += 'All cards stand upright, demonstrating unimpeded energetic flow and affirming that you are aligned with your true current trajectory. ';
        } else if (reversedCount > 0) {
            summary += 'The intertwining of upright and reversed currents indicates dynamic transition. Flexibility, curiosity, and non-attachment are your greatest allies. ';
        }

        summary += 'Listen to the quiet inner resonance stirred by these symbols. Remember, destiny is crafted by your conscious choices; Tarot serves as a sacred mirror, revealing the wisdom already dormant within your soul.';

        return summary;
    }

    // ---- Share Reading ----
    function shareReading() {
        const spread = window.TarotSpreads[state.selectedSpread];
        if (!spread) return;

        let text = '✦ Tarot Agent Divination Reading ✦\n';
        text += 'Spread: ' + spread.name + '\n';
        if (state.question) text += 'Inquiry: ' + state.question + '\n';
        text += '\n';

        state.readingCards.forEach(function (sc, i) {
            const pos = spread.positions[i] || { name: 'Position ' + (i + 1) };
            const orientation = sc.isReversed ? 'REVERSED' : 'UPRIGHT';
            text += pos.name + ': ' + sc.card.name + ' (' + orientation + ')\n';
        });

        text += '\n✦ Generated by Tarot Agent (Cosmic Sanctuary & AI Archetypes)';

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showToast('✅ Reading copied to clipboard!');
            }).catch(function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast('✅ Reading copied to clipboard!');
        } catch (e) {
            showToast('❌ Copy failed. Please select and copy manually.');
        }
        document.body.removeChild(ta);
    }

    // ---- Meanings Page ----
    let currentFilter = 'major';
    function bindMeaningsFilter() {
        $$('.filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                $$('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                const searchInput = $('#meanings-search-input');
                const query = searchInput ? searchInput.value.trim() : '';
                loadMeaningsPage(currentFilter, query);
            });
        });

        const searchInput = $('#meanings-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                loadMeaningsPage(currentFilter, searchInput.value.trim());
            });
        }
    }

    function loadMeaningsPage(filter, query) {
        const grid = $('#meanings-grid');
        if (!grid) return;
        grid.innerHTML = '';

        if (!window.TarotDeck) return;

        let cards = [];
        if (filter === 'major') {
            cards = window.TarotDeck.majorArcana || [];
        } else {
            cards = (window.TarotDeck.minorArcana && window.TarotDeck.minorArcana[filter]) || [];
        }

        if (query) {
            const q = query.toLowerCase();
            cards = cards.filter(function (c) {
                const name = (c.name || '').toLowerCase();
                const kws = ((c.upright && c.upright.keywords) || []).join(' ').toLowerCase();
                const meaning = ((c.upright && c.upright.meaning) || '').toLowerCase();
                return name.includes(q) || kws.includes(q) || meaning.includes(q);
            });
        }

        if (cards.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">No matching cards found for your search.</div>';
            return;
        }

        cards.forEach(function (card, i) {
            const div = document.createElement('div');
            div.className = 'meaning-card';
            div.style.animationDelay = (i * 0.02) + 's';
            
            const excerpt = card.upright && card.upright.meaning ? card.upright.meaning.slice(0, 60) + '...' : '';
            const keywords = (card.upright && card.upright.keywords) || [];
            const tagsHtml = keywords.map(function (k) {
                return '<span class="tag-keyword">' + k + '</span>';
            }).join('');

            div.innerHTML =
                '<div class="meaning-card-header">' +
                    '<span class="meaning-card-emoji">' + card.emoji + '</span>' +
                    '<div class="meaning-card-titles">' +
                        '<h4>' + card.name + '</h4>' +
                        '<span class="card-en">' + (card.numeral ? card.numeral + (card.suit ? ' · ' + card.suit.toUpperCase() : '') : 'Major Arcana') + '</span>' +
                    '</div>' +
                '</div>' +
                '<p class="meaning-card-desc">' + excerpt + '</p>' +
                '<div class="meaning-card-tags">' + tagsHtml + '</div>';

            (function (c) {
                div.addEventListener('click', function () {
                    showCardDetail(
                        { card: c, isReversed: false },
                        { name: 'Card Archive', description: 'Upright Archetypal Essence' }
                    );
                });
            })(card);

            grid.appendChild(div);
        });
    }

    // ---- Utilities ----
    function getCategoryName(cat) {
        const names = {
            general: 'General Life',
            love: 'Love & Romance',
            career: 'Career & Purpose',
            health: 'Health & Mind',
            wealth: 'Wealth & Prosperity'
        };
        return names[cat] || 'General Life';
    }

    function showToast(message) {
        let toast = $('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2500);
    }

    function resetState() {
        state.selectedSpread = null;
        state.selectedCategory = 'general';
        state.question = '';
        state.selectedCards = [];
        state.readingCards = [];
        state.cardsNeeded = 0;
        state.chatHistory = [];

        const questionText = $('#question-text');
        if (questionText) questionText.value = '';

        $$('.category-btn').forEach(function (b) { b.classList.remove('active'); });
        const generalBtn = $('.category-btn[data-category="general"]');
        if (generalBtn) generalBtn.classList.add('active');
    }
})();
