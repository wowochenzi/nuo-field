(function initOriginTimeline() {
    'use strict';

    const DESIGN_WIDTH = 1440;
    const DESIGN_HEIGHT = 813;
    const WHEEL_THRESHOLD = 70;
    const ANIMATION_LOCK_MS = 900;
    const WHEEL_GESTURE_GAP_MS = 180;
    const TIMELINE_REVEAL_MS = 3000;
    const THREE_SENSES_ENTRY_KEY = 'nuoOriginToThreeSenses';
    const TIMELINE_RIGHT_OFFSET = 48;
    const THREE_SENSES_PRELOAD_ASSETS = [
        '../assets/images/three-senses/figma-senses-bg-296-240.png',
        '../assets/images/three-senses/flow-ring.svg',
        '../assets/images/three-senses/frame-form-bg.png',
        '../assets/images/three-senses/frame-form-glyph-figma.png',
        '../assets/images/three-senses/frame-form-label-figma.png',
        '../assets/images/three-senses/frame-motion-bg.png',
        '../assets/images/three-senses/frame-motion-glyph-figma.png',
        '../assets/images/three-senses/frame-motion-label-figma.png',
        '../assets/images/three-senses/frame-sound-bg.png',
        '../assets/images/three-senses/frame-sound-glyph-figma.png',
        '../assets/images/three-senses/frame-sound-label-figma.png'
    ];

    const ERA_STAGES = [
        { id: 'shangzhou', label: '商周', translateX: 0 + TIMELINE_RIGHT_OFFSET },
        { id: 'hantang', label: '汉唐', translateX: -220 + TIMELINE_RIGHT_OFFSET },
        { id: 'song', label: '宋代', translateX: -560 + TIMELINE_RIGHT_OFFSET },
        { id: 'mingqing', label: '明清', translateX: -1180 + TIMELINE_RIGHT_OFFSET },
        { id: 'modern', label: '现代', translateX: -1560 + TIMELINE_RIGHT_OFFSET }
    ];

    const MODERN_MAP_HOTSPOTS = [
        {
            id: 'guizhou',
            region: '贵州',
            displayTitle: ['贵州', '德江傩堂戏', '贵州傩戏'],
            description: '贵州傩戏在祭祀、还愿与乡土信仰中延续至今，既保留驱邪纳吉的古老仪式，又吸收花灯、民间小戏等地方艺术。德江傩堂戏保存完整，被视为傩文化“活态遗存”，展现了傩从仪式走向戏剧的历史过程。'
        },
        {
            id: 'jiangxi-nanfeng',
            region: '江西南丰',
            displayTitle: ['江西南丰', '南丰跳傩'],
            description: '南丰跳傩从祭神驱疫的仪式舞蹈发展而来，历经长期演变，吸收戏曲、木偶、灯彩、武术等技艺，逐渐形成兼具仪式性与观赏性的民间表演。它以丰富的面具、舞步和仪式程序，展现赣地傩文化从神圣祭仪到民间娱乐的转化。'
        },
        {
            id: 'hubei-enshi',
            region: '湖北恩施',
            displayTitle: ['湖北恩施', '恩施傩戏'],
            description: '恩施傩戏在土家族聚居地区流传，兼具祭祀、还愿与戏剧表演功能。它由傩愿戏和坛傩构成，既保留开坛、请神等古老法事，也通过面具、唱念和表演呈现民间故事。恩施傩戏的特点在于“戏中有祭、祭中有戏”，体现了仪式与戏剧交融的发展路径。'
        },
        {
            id: 'zhejiang-dongyang',
            region: '浙江东阳',
            displayTitle: ['浙江东阳', '东阳傩戏', '傀儡戏'],
            description: '东阳傩戏又称傀儡戏，以面具、锣鼓和夸张肢体表演为主要特征。它不依赖唱词，而是通过动作、步法和角色造型推进剧情，既服务于祭祀五谷神的乡土仪式，也具有完整的戏剧叙事。东阳傩戏体现了江南地区傩文化与地方民间戏剧的融合。'
        },
        {
            id: 'hebei-wuan',
            region: '河北武安',
            displayTitle: ['河北武安', '武安傩戏'],
            description: '武安傩戏保留了北方傩文化粗犷、宏大的仪式特征，是集祭祀、队戏、赛戏和民间表演于一体的传统文化复合体。它通过面具、队列、锣鼓和戏剧情节，表现驱邪除灾、惩恶扬善与祈求丰年的愿望，是研究中国仪式戏剧发展的重要活态样本。'
        }
    ];

    document.addEventListener('DOMContentLoaded', () => {
        const stage = document.getElementById('origin-stage');
        const container = document.getElementById('origin-page');
        const viewport = document.getElementById('origin-timeline');
        const scrollLayer = document.getElementById('origin-scroll-layer');
        const eraSections = Array.from(document.querySelectorAll('[data-era]'));
        const eraMarkers = Array.from(document.querySelectorAll('.era-marker'));
        const previousButton = document.getElementById('timeline-prev');
        const nextButton = document.getElementById('timeline-next');
        const status = document.getElementById('origin-era-status');
        const openButton = document.getElementById('danuo-open');
        const closeButton = document.getElementById('danuo-close');
        const overlay = document.getElementById('danuo-overlay');
        const hotspotButtons = Array.from(document.querySelectorAll('.danuo-wrap [data-hotspot]'));
        const timelineDetails = Array.from(document.querySelectorAll('.era-song [data-detail]'));
        const modernMapTrigger = document.getElementById('modern-map-trigger');
        const modernMapModal = document.getElementById('modern-map-modal');
        const modernMapClose = document.getElementById('modern-map-close');
        const modernMapHotspotButtons = Array.from(document.querySelectorAll('[data-modern-hotspot]'));
        const modernMapVisuals = Array.from(document.querySelectorAll('[data-map-visual]'));
        const modernMapCard = document.getElementById('modern-map-card');
        const modernMapCardRegion = document.getElementById('modern-map-card-region');
        const modernMapCardTitles = document.getElementById('modern-map-card-titles');
        const modernMapCardDescription = document.getElementById('modern-map-card-description');

        if (!stage || !viewport || !scrollLayer || eraSections.length !== ERA_STAGES.length) return;

        let activeEraIndex = -1;
        let maxReachedEraIndex = -1;
        const activeDetails = new Set();
        let wheelAccumulator = 0;
        let isAnimating = false;
        let timelineReady = false;
        let gestureConsumed = false;
        let animationTimer = null;
        let gestureTimer = null;
        let resizeTimer = null;
        let lastFocusedElement = null;
        let lastModernMapFocusedElement = null;
        let activeModernMapHotspot = null;
        let modernMapCardTimer = null;
        let modernMapWasOpened = false;
        let modernMapContinueReady = false;
        let isNavigatingToThreeSenses = false;
        let threeSensesAssetsPreloaded = false;

        document.body.appendChild(overlay);

        function calculateScale() {
            const bounds = container?.getBoundingClientRect();
            const width = bounds?.width || window.innerWidth;
            const height = bounds?.height || window.innerHeight;
            return Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
        }

        function applyScale() {
            const bounds = container?.getBoundingClientRect();
            const width = bounds?.width || window.innerWidth;
            const height = bounds?.height || window.innerHeight;
            const scale = calculateScale();
            stage.style.setProperty('--origin-scale', scale.toFixed(6));
            stage.style.setProperty('--origin-stage-width', `${(width / scale).toFixed(3)}px`);
            stage.style.setProperty('--origin-stage-height', `${(height / scale).toFixed(3)}px`);
        }

        function revealTimeline() {
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            requestAnimationFrame(() => {
                stage.classList.add('is-timeline-ready');
            });

            window.setTimeout(() => {
                timelineReady = true;
                updateEraStates();
            }, reducedMotion ? 0 : TIMELINE_REVEAL_MS);
        }

        function updateTimelinePosition(withoutAnimation = false) {
            if (withoutAnimation) scrollLayer.classList.add('is-resizing');
            const translateX = activeEraIndex < 0 ? 0 : ERA_STAGES[activeEraIndex].translateX;
            scrollLayer.style.setProperty('--timeline-x', `${translateX}px`);

            if (withoutAnimation) {
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    scrollLayer.classList.remove('is-resizing');
                }));
            }
        }

        function updateEraStates() {
            eraSections.forEach(section => {
                const index = Number(section.dataset.eraIndex);
                section.classList.toggle('is-current', index === activeEraIndex);
                section.classList.toggle('is-past', index <= maxReachedEraIndex && index !== activeEraIndex);
                section.setAttribute('aria-hidden', index <= maxReachedEraIndex ? 'false' : 'true');
            });

            eraMarkers.forEach(marker => {
                const index = Number(marker.dataset.eraIndex);
                marker.classList.toggle('is-current', index === activeEraIndex);
                marker.classList.toggle('is-past', index <= maxReachedEraIndex && index !== activeEraIndex);
                marker.setAttribute('aria-current', index === activeEraIndex ? 'step' : 'false');
            });

            const isAtFinalEra = activeEraIndex >= ERA_STAGES.length - 1;
            const canContinueToThreeSenses = timelineReady && isAtFinalEra && modernMapContinueReady;

            previousButton.disabled = !timelineReady || activeEraIndex < 0;
            nextButton.disabled = !timelineReady || activeEraIndex < 0 || (isAtFinalEra && !canContinueToThreeSenses);
            nextButton.classList.toggle('is-continue-ready', canContinueToThreeSenses);
            nextButton.setAttribute('aria-label', canContinueToThreeSenses ? '继续进入三感入傩' : '下一个朝代');
            stage.classList.toggle('is-three-senses-ready', canContinueToThreeSenses);
            scrollLayer.dataset.activeEra = activeEraIndex < 0 ? 'initial' : ERA_STAGES[activeEraIndex].id;
            status.textContent = activeEraIndex < 0
                ? '历史时间轴待开启'
                : canContinueToThreeSenses
                    ? '地图面板已收起，可继续进入三感入傩'
                    : `当前时代：${ERA_STAGES[activeEraIndex].label}`;
        }

        function lockAnimation() {
            isAnimating = true;
            if (animationTimer) window.clearTimeout(animationTimer);
            animationTimer = window.setTimeout(() => {
                isAnimating = false;
                animationTimer = null;
            }, ANIMATION_LOCK_MS);
        }

        function clearDetail() {
            activeDetails.clear();
            timelineDetails.forEach(detail => detail.classList.remove('is-visible'));
            hotspotButtons.forEach(button => button.classList.remove('is-active'));
        }

        function setActiveEra(nextIndex, options = {}) {
            const boundedIndex = Math.max(-1, Math.min(nextIndex, ERA_STAGES.length - 1));
            const changed = boundedIndex !== activeEraIndex;
            activeEraIndex = boundedIndex;
            maxReachedEraIndex = Math.max(maxReachedEraIndex, activeEraIndex);

            if (activeEraIndex !== 2) {
                closeDanuo({ restoreFocus: false });
                clearDetail();
            }

            if (activeEraIndex !== 4) {
                closeModernMapModal({ restoreFocus: false });
            }

            updateEraStates();
            updateTimelinePosition(Boolean(options.withoutAnimation));

            if (changed && !options.withoutAnimation) lockAnimation();
            return changed;
        }

        function resetWheelGestureAfterPause() {
            if (gestureTimer) window.clearTimeout(gestureTimer);
            gestureTimer = window.setTimeout(() => {
                wheelAccumulator = 0;
                gestureConsumed = false;
                gestureTimer = null;
            }, WHEEL_GESTURE_GAP_MS);
        }

        function normalizeWheelDelta(event) {
            if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
            if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * viewport.clientHeight;
            return event.deltaY;
        }

        function preloadThreeSensesAssets() {
            if (threeSensesAssetsPreloaded) return;
            threeSensesAssetsPreloaded = true;

            const loadAssets = () => {
                THREE_SENSES_PRELOAD_ASSETS.forEach(src => {
                    const image = new Image();
                    image.decoding = 'async';
                    image.src = src;
                });
            };

            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(loadAssets, { timeout: 600 });
            } else {
                window.setTimeout(loadAssets, 0);
            }
        }

        function unlockThreeSensesContinue() {
            if (modernMapContinueReady) return;
            modernMapContinueReady = true;
            preloadThreeSensesAssets();
            if (window.NuoState?.markComplete) {
                window.NuoState.markComplete('completedOrigin');
            }
            updateEraStates();
        }

        function continueToThreeSenses() {
            if (isNavigatingToThreeSenses || !modernMapContinueReady || activeEraIndex < ERA_STAGES.length - 1) return false;
            isNavigatingToThreeSenses = true;
            try {
                sessionStorage.setItem(THREE_SENSES_ENTRY_KEY, '1');
            } catch (error) {
                // Session storage may be unavailable in strict privacy contexts; navigation should still work.
            }
            if (window.NuoState?.markComplete) {
                window.NuoState.markComplete('completedOrigin');
            }
            stage.classList.add('is-leaving-to-three-senses');
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.setTimeout(() => {
                window.location.href = 'three-senses.html';
            }, reducedMotion ? 0 : 90);
            return true;
        }

        function moveBy(direction) {
            if (
                !timelineReady ||
                isAnimating ||
                isNavigatingToThreeSenses ||
                overlay.classList.contains('is-open') ||
                modernMapModal.classList.contains('is-open')
            ) return false;

            if (direction > 0 && activeEraIndex >= ERA_STAGES.length - 1) {
                return continueToThreeSenses();
            }

            return setActiveEra(activeEraIndex + direction);
        }

        function showDetail(number) {
            activeDetails.add(String(number));
            timelineDetails.forEach(detail => {
                detail.classList.toggle('is-visible', activeDetails.has(detail.dataset.detail));
            });
            hotspotButtons.forEach(button => {
                button.classList.toggle('is-active', activeDetails.has(button.dataset.hotspot));
            });
        }

        function openDanuo() {
            if (activeEraIndex !== 2) return;
            lastFocusedElement = document.activeElement;
            overlay.classList.add('is-open');
            overlay.setAttribute('aria-hidden', 'false');
            closeButton.focus({ preventScroll: true });
        }

        function closeDanuo(options = {}) {
            if (!overlay.classList.contains('is-open')) return;
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
            if (options.restoreFocus !== false && lastFocusedElement instanceof HTMLElement) {
                lastFocusedElement.focus({ preventScroll: true });
            }
        }

        function renderModernMapCard(id, options = {}) {
            const item = MODERN_MAP_HOTSPOTS.find(hotspot => hotspot.id === id);
            if (!item || !modernMapCard || !modernMapCardRegion || !modernMapCardTitles || !modernMapCardDescription) return;

            const writeCard = () => {
                modernMapCardRegion.textContent = item.region;
                modernMapCardTitles.replaceChildren(...item.displayTitle.slice(1).map(title => {
                    const listItem = document.createElement('li');
                    listItem.textContent = title;
                    return listItem;
                }));
                modernMapCardDescription.textContent = item.description;
                modernMapCard.classList.toggle('is-compact', item.description.length > 105 || item.displayTitle.length > 2);
                modernMapCard.classList.remove('is-switching');
                modernMapCard.classList.add('is-visible');
                modernMapCard.setAttribute('aria-hidden', 'false');
            };

            if (modernMapCardTimer) window.clearTimeout(modernMapCardTimer);
            if (options.immediate) {
                writeCard();
                return;
            }

            modernMapCard.classList.add('is-switching');
            modernMapCardTimer = window.setTimeout(() => {
                writeCard();
                modernMapCardTimer = null;
            }, 120);
        }

        function resetModernMapCard() {
            activeModernMapHotspot = null;
            if (modernMapCardTimer) {
                window.clearTimeout(modernMapCardTimer);
                modernMapCardTimer = null;
            }
            modernMapHotspotButtons.forEach(button => {
                button.classList.remove('is-active');
                button.setAttribute('aria-pressed', 'false');
            });
            modernMapVisuals.forEach(visual => visual.classList.remove('is-active'));
            modernMapCard.classList.remove('is-visible', 'is-switching', 'is-compact');
            modernMapCard.setAttribute('aria-hidden', 'true');
            modernMapCardRegion.textContent = '';
            modernMapCardTitles.replaceChildren();
            modernMapCardDescription.textContent = '';
        }

        function setActiveMapHotspot(id, options = {}) {
            if (!MODERN_MAP_HOTSPOTS.some(hotspot => hotspot.id === id)) return false;
            activeModernMapHotspot = id;
            modernMapHotspotButtons.forEach(button => {
                const isActive = button.dataset.modernHotspot === id;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            modernMapVisuals.forEach(visual => {
                visual.classList.toggle('is-active', visual.dataset.mapVisual === id);
            });
            renderModernMapCard(id, options);
            return true;
        }

        function openModernMapModal() {
            if (activeEraIndex !== 4 || !modernMapModal || !modernMapClose) return;
            lastModernMapFocusedElement = document.activeElement;
            modernMapWasOpened = true;
            resetModernMapCard();
            modernMapModal.classList.add('is-open');
            modernMapModal.setAttribute('aria-hidden', 'false');
            modernMapClose.focus({ preventScroll: true });
        }

        function closeModernMapModal(options = {}) {
            if (!modernMapModal || !modernMapModal.classList.contains('is-open')) return;
            modernMapModal.classList.remove('is-open');
            modernMapModal.setAttribute('aria-hidden', 'true');
            if (activeEraIndex === ERA_STAGES.length - 1 && modernMapWasOpened) {
                window.setTimeout(unlockThreeSensesContinue, 220);
            }
            if (options.restoreFocus !== false && lastModernMapFocusedElement instanceof HTMLElement) {
                lastModernMapFocusedElement.focus({ preventScroll: true });
            }
        }

        viewport.addEventListener('wheel', event => {
            event.preventDefault();
            if (overlay.classList.contains('is-open')) return;

            resetWheelGestureAfterPause();
            if (isAnimating || gestureConsumed) return;

            wheelAccumulator += normalizeWheelDelta(event);
            if (Math.abs(wheelAccumulator) < WHEEL_THRESHOLD) return;

            const direction = wheelAccumulator > 0 ? 1 : -1;
            wheelAccumulator = 0;
            gestureConsumed = true;
            moveBy(direction);
        }, { passive: false });

        previousButton.addEventListener('click', () => moveBy(-1));
        nextButton.addEventListener('click', () => moveBy(1));

        eraMarkers.forEach(marker => {
            marker.addEventListener('click', () => {
                if (isAnimating || overlay.classList.contains('is-open')) return;
                const targetIndex = Number(marker.dataset.eraIndex);
                if (Number.isInteger(targetIndex)) setActiveEra(targetIndex);
            });
        });

        hotspotButtons.forEach(button => {
            button.addEventListener('click', event => {
                event.stopPropagation();
                showDetail(button.dataset.hotspot);
            });
        });

        openButton.addEventListener('click', openDanuo);
        closeButton.addEventListener('click', () => closeDanuo());
        overlay.addEventListener('click', event => {
            if (event.target.classList.contains('danuo-overlay-veil')) closeDanuo();
        });

        modernMapTrigger.addEventListener('click', openModernMapModal);
        modernMapClose.addEventListener('click', () => closeModernMapModal());
        modernMapHotspotButtons.forEach(button => {
            button.addEventListener('click', event => {
                event.stopPropagation();
                setActiveMapHotspot(button.dataset.modernHotspot);
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && modernMapModal.classList.contains('is-open')) {
                event.preventDefault();
                closeModernMapModal();
                return;
            }

            if (modernMapModal.classList.contains('is-open')) return;

            if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
                event.preventDefault();
                closeDanuo();
                return;
            }

            if (overlay.classList.contains('is-open')) return;
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveBy(-1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveBy(1);
            }
        });

        window.addEventListener('resize', () => {
            if (resizeTimer) window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                applyScale();
                updateTimelinePosition(true);
                resizeTimer = null;
            }, 80);
        });

        document.querySelectorAll('img').forEach(image => {
            image.addEventListener('error', () => {
                image.hidden = true;
                const holder = image.parentElement;
                if (holder) holder.classList.add('is-image-missing');
            }, { once: true });
        });

        window.originTimeline = {
            stages: ERA_STAGES.map(stageItem => ({ ...stageItem })),
            getActiveIndex: () => activeEraIndex,
            getMaxReachedIndex: () => maxReachedEraIndex,
            setActiveEra,
            openDanuo,
            closeDanuo,
            showDetail,
            openModernMapModal,
            closeModernMapModal,
            unlockThreeSensesContinue,
            continueToThreeSenses,
            setActiveMapHotspot,
            renderModernMapCard,
            resetModernMapCard
        };

        window.modernMap = {
            hotspots: MODERN_MAP_HOTSPOTS.map(hotspot => ({ ...hotspot, displayTitle: [...hotspot.displayTitle] })),
            getActiveHotspot: () => activeModernMapHotspot,
            openModernMapModal,
            closeModernMapModal,
            unlockThreeSensesContinue,
            setActiveMapHotspot,
            renderModernMapCard,
            resetModernMapCard
        };

        applyScale();
        setActiveEra(0, { withoutAnimation: true });
        resetModernMapCard();
        revealTimeline();
        viewport.focus({ preventScroll: true });
    });
})();
