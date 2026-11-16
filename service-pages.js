(() => {
    "use strict";

    const SUPPORT_NUMBER = "8801601866686";

    // Footer year
    document.querySelectorAll("[data-svc-year]").forEach((element) => {
        element.textContent = String(new Date().getFullYear());
    });

    // ======================================
    // Delivery estimate
    // Reads your existing DELIVERY settings.
    // ======================================

    const deliveryConfig =
        typeof DELIVERY !== "undefined" &&
        DELIVERY &&
        typeof DELIVERY === "object"
            ? DELIVERY
            : {};

    function getFee(value, fallback) {
        const number = Number(value);

        return value !== null &&
            value !== undefined &&
            value !== "" &&
            Number.isFinite(number) &&
            number >= 0
                ? number
                : fallback;
    }

    const deliveryZones = {
        inside: {
            fee: getFee(deliveryConfig.inside, 60),
            eta: "১–২ কর্মদিবস"
        },
        outside: {
            fee: getFee(deliveryConfig.outside, 120),
            eta: "২–৪ কর্মদিবস"
        }
    };

    function formatMoney(amount) {
        return "৳" + new Intl.NumberFormat("bn-BD", {
            maximumFractionDigits: 2
        }).format(amount);
    }

    document.querySelectorAll("[data-svc-rate]").forEach((element) => {
        const zone = deliveryZones[element.dataset.svcRate];

        if (zone) {
            element.textContent = formatMoney(zone.fee);
        }
    });

    const areaSelect = document.getElementById("svcArea");
    const estimateFee = document.getElementById("svcEstimateFee");
    const estimateEta = document.getElementById("svcEstimateEta");

    function updateDeliveryEstimate() {
        if (!areaSelect || !estimateFee || !estimateEta) return;

        const zone = deliveryZones[areaSelect.value];
        if (!zone) return;

        estimateFee.textContent = formatMoney(zone.fee);
        estimateEta.textContent = zone.eta;
    }

    if (areaSelect) {
        areaSelect.addEventListener("change", updateDeliveryEstimate);
        updateDeliveryEstimate();
    }

    // ======================================
    // Exchange request -> WhatsApp
    // No fake submission or auto-approval.
    // ======================================

    const exchangeForm = document.getElementById("svcExchangeForm");

    if (exchangeForm) {
        exchangeForm.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!exchangeForm.reportValidity()) return;

            const orderField = document.getElementById("svcOrderId");
            const reasonField = document.getElementById("svcExchangeReason");
            const detailsField = document.getElementById("svcExchangeDetails");
            const errorBox = document.getElementById("svcExchangeError");

            const orderId = orderField.value.trim();
            const reason = reasonField.value;
            const details = detailsField.value.trim();

            if (orderId.length < 3) {
                errorBox.textContent = "অনুগ্রহ করে সঠিক অর্ডার আইডি লিখুন।";
                errorBox.hidden = false;
                orderField.focus();
                return;
            }

            errorBox.hidden = true;

            const message = [
                "আসসালামু আলাইকুম, Loyalty Access Fashion।",
                "আমি এক্সচেঞ্জ সংক্রান্ত সহায়তা চাই।",
                "",
                `অর্ডার আইডি: ${orderId}`,
                `সমস্যার ধরন: ${reason}`,
                `বিস্তারিত: ${details || "চ্যাটে জানাব।"}`,
                "",
                "অনুগ্রহ করে পরবর্তী করণীয় জানাবেন।"
            ].join("\n");

            const whatsappURL =
                `https://wa.me/${SUPPORT_NUMBER}?text=` +
                encodeURIComponent(message);

            // Opens WhatsApp; the customer must press Send there.
            window.location.assign(whatsappURL);
        });
    }

    // ======================================
    // Click feedback: audio + optional haptic
    // Starts only after user interaction.
    // ======================================

    let audioContext = null;

    function playClickPop() {
        try {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) return;

            if (!audioContext) {
                audioContext = new AudioContextClass();
            }

            const play = () => {
                if (audioContext.state !== "running") return;

                const now = audioContext.currentTime;
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(850, now);
                oscillator.frequency.exponentialRampToValueAtTime(
                    180,
                    now + 0.045
                );

                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(0.055, now + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

                oscillator.connect(gain);
                gain.connect(audioContext.destination);

                oscillator.start(now);
                oscillator.stop(now + 0.065);
            };

            if (audioContext.state === "suspended") {
                audioContext.resume().then(play).catch(() => {});
            } else {
                play();
            }
        } catch (error) {
            // Unsupported/blocked audio must not break navigation.
        }
    }

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;

        const control = event.target.closest("a, button, summary");
        if (!control) return;

        playClickPop();

        try {
            if (typeof navigator.vibrate === "function") {
                navigator.vibrate(10);
            }
        } catch (error) {
            // Vibration is optional and not supported everywhere.
        }
    });

    document.addEventListener("pointerdown", (event) => {
        if (!(event.target instanceof Element)) return;
        if (event.button !== 0) return;

        const control = event.target.closest("a, button, summary");
        if (!control) return;

        control.classList.add("svc-pressed");

        window.setTimeout(() => {
            control.classList.remove("svc-pressed");
        }, 160);
    }, { passive: true });
})();
