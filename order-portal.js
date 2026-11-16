import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { https://ysmtysgavtvcujmbuwlc.supabase.co, sb_publishable_PAAXTKjIJyeUzv4A8TtqDA_oiaqhEuT } from "./tracking-config.js";

const $ = (id) => document.getElementById(id);

const STAGES = [
    { key: "pending", title: "Order Pending", description: "অর্ডার রেকর্ড করা হয়েছে" },
    { key: "accepted", title: "Order Accepted", description: "স্টোর অর্ডার গ্রহণ করেছে" },
    { key: "processing", title: "Order Processing", description: "পণ্য প্রস্তুত করা হচ্ছে" },
    { key: "shipped", title: "Order Shipped", description: "পার্সেল কুরিয়ারে হস্তান্তর করা হয়েছে" },
    { key: "out_for_delivery", title: "Out for Delivery", description: "পার্সেল ডেলিভারির জন্য বের হয়েছে" },
    { key: "delivered", title: "Delivered", description: "ডেলিভারি সম্পন্ন হয়েছে" }
];

const ALL_STATUSES = [
    ...STAGES,
    { key: "cancelled", title: "Order Cancelled", description: "অর্ডার বাতিল করা হয়েছে" }
];

const STATUS_MAP = Object.fromEntries(ALL_STATUSES.map((status) => [status.key, status]));

function element(tag, className = "", text = "") {
    const item = document.createElement(tag);
    if (className) item.className = className;
    item.textContent = text;
    return item;
}

function message(text, error = false) {
    const box = $("opMessage");
    if (!box) return;
    box.textContent = text;
    box.dataset.error = String(error);
}

function normalizeOrderId(value) {
    return String(value || "").trim().replace(/^#+/, "").trim().toUpperCase();
}

function normalizePhone(value) {
    let digits = String(value || "").replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit))).replace(/\D/g, "");
    if (digits.length === 13 && digits.startsWith("880")) digits = digits.slice(2);
    return /^01[3-9]\d{8}$/.test(digits) ? digits : "";
}

function formatDate(value) {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.getTime())) return "—";
    return new Intl.DateTimeFormat("bn-BD", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka"
    }).format(date);
}

function makeBadge(status) {
    const badge = element("span", "op-badge", STATUS_MAP[status]?.title || status);
    badge.dataset.cancelled = String(status === "cancelled");
    return badge;
}

function initTracking(db) {
    const form = $("opTrackForm");
    const submit = $("opTrackButton");
    const refresh = $("opRefresh");
    let query = null, busy = false, hasSnapshot = false;

    const orderFromURL = new URLSearchParams(window.location.search).get("order");
    if (orderFromURL) $("opOrderInput").value = normalizeOrderId(orderFromURL).slice(0, 64);
    submit.disabled = false;

    function renderTracking(order) {
        $("opOrderRef").textContent = order.order_id;
        $("opStatus").textContent = STATUS_MAP[order.status]?.title || order.status;
        $("opStatus").dataset.cancelled = String(order.status === "cancelled");
        $("opUpdated").textContent = formatDate(order.updated_at) + " · বাংলাদেশ সময়";
        $("opCancelled").hidden = order.status !== "cancelled";

        const currentIndex = STAGES.findIndex((stage) => stage.key === order.status);
        const events = Array.isArray(order.events) ? order.events : [];
        const timeline = document.createDocumentFragment();

        STAGES.forEach((stage, index) => {
            const matchingEvents = events.filter((e) => e.status === stage.key);
            const lastEvent = matchingEvents[matchingEvents.length - 1];
            const isCurrent = order.status === stage.key;
            const isDone = Boolean(lastEvent) && (index < currentIndex || order.status === "delivered" || order.status === "cancelled");

            const step = element("li", "op-step" + (isDone ? " is-done" : "") + (isCurrent ? " is-current" : ""));
            if (isCurrent) step.setAttribute("aria-current", "step");

            const dot = element("span", "op-step-dot", isDone ? "✓" : String(index + 1));
            const copy = element("div");
            copy.append(element("strong", "", stage.title), element("p", "", stage.description));

            const time = element("time", "", lastEvent ? formatDate(lastEvent.at) : "এখনো আপডেট হয়নি");
            if (lastEvent) time.dateTime = lastEvent.at;

            copy.append(time);
            step.append(dot, copy);
            timeline.append(step);
        });

        $("opStepper").replaceChildren(timeline);
        $("opEmpty").hidden = true;
        $("opResult").hidden = false;
    }

    async function readTracking(silent = false) {
        if (!query || busy) return;
        busy = true; submit.disabled = true; refresh.disabled = true;
        if (!silent) message("অর্ডারের তথ্য যাচাই করা হচ্ছে…");

        try {
            const { data, error } = await db.rpc("laf_track_order", { p_order_id: query.orderId, p_phone: query.phone });
            if (error) throw error;

            if (!data) {
                query = null; hasSnapshot = false;
                $("opResult").hidden = true; $("opEmpty").hidden = false;
                message("অর্ডার পাওয়া যায়নি অথবা ফোন নম্বর মেলেনি। তথ্য যাচাই করুন বা সাপোর্টে যোগাযোগ করুন।", true);
                return;
            }

            renderTracking(data);
            hasSnapshot = true;
            const checkedAt = new Intl.DateTimeFormat("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Dhaka" }).format(new Date());
            $("opSync").textContent = "সর্বশেষ যাচাই: " + checkedAt;
            message("পেজ খোলা থাকলে প্রতি ২০ সেকেন্ডে নতুন আপডেট পরীক্ষা হবে।");
        } catch {
            message(hasSnapshot ? "সংযোগে সমস্যা। শেষ তথ্য দেখানো হচ্ছে।" : "সার্ভারের সঙ্গে সংযোগ হচ্ছে না।", true);
        } finally {
            busy = false; submit.disabled = false; refresh.disabled = false;
        }
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (busy || !form.reportValidity()) return;
        const orderId = normalizeOrderId($("opOrderInput").value);
        const phone = normalizePhone($("opPhoneInput").value);

        if (orderId.length < 3 || orderId.length > 64) { message("সঠিক অর্ডার আইডি লিখুন।", true); return; }
        if (!phone) { message("সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।", true); return; }

        query = { orderId, phone }; hasSnapshot = false;
        $("opResult").hidden = true; $("opEmpty").hidden = false;
        readTracking();
    });

    refresh.addEventListener("click", () => readTracking());
    window.setInterval(() => { if (!document.hidden) readTracking(true); }, 20000);
}

async function initAdmin(db) {
    let orders = [], updating = false;
    const loginForm = $("opLoginForm"), loginButton = $("opLoginButton"), addForm = $("opAddForm");

    ALL_STATUSES.forEach((s) => {
        const option = element("option", "", s.title); option.value = s.key;
        $("opFilter").append(option);
    });

    loginButton.disabled = false;

    function showLogin() {
        orders = []; $("opDashboard").hidden = true; $("opLogin").hidden = false;
        $("opOrders").replaceChildren(); $("opOwner").textContent = "";
    }

    function renderOrders() {
        const search = $("opSearch").value.trim().toLowerCase();
        const filter = $("opFilter").value;
        const visible = orders.filter((o) => (filter === "all" || o.status === filter) && [o.order_id, o.phone, o.label].join(" ").toLowerCase().includes(search));

        $("opCount").textContent = `${visible.length}টি অর্ডার দেখানো হচ্ছে`;
        const fragment = document.createDocumentFragment();

        if (!visible.length) fragment.append(element("p", "op-muted", "কোনো অর্ডার নেই।"));

        visible.forEach((order) => {
            const card = element("article", "op-panel op-order");
            const head = element("div", "op-order-head");
            head.append(element("h3", "", order.order_id), makeBadge(order.status));
            card.append(head);

            if (order.label) card.append(element("p", "op-subtext", order.label));
            card.append(element("p", "op-note", `ফোন: ${order.phone} · আপডেট: ${formatDate(order.updated_at)}`));

            const actions = element("div", "op-order-actions");
            const statusSelect = element("select", "op-select");

            ALL_STATUSES.forEach((s) => {
                const opt = element("option", "", s.title); opt.value = s.key; opt.selected = s.key === order.status;
                statusSelect.append(opt);
            });
            statusSelect.disabled = updating;
            statusSelect.addEventListener("change", () => changeStatus(order, statusSelect.value));

            const index = STAGES.findIndex((s) => s.key === order.status);
            const next = index >= 0 ? STAGES[index + 1] : null;

            const nextButton = element("button", "op-btn", next ? next.title + " →" : "সম্পন্ন");
            nextButton.type = "button"; nextButton.disabled = updating || !next;
            nextButton.addEventListener("click", () => next && changeStatus(order, next.key));

            actions.append(nextButton, statusSelect);
            card.append(actions);
            fragment.append(card);
        });

        $("opOrders").replaceChildren(fragment);
    }

    async function loadOrders() {
        $("opReload").disabled = true;
        try {
            const { data, error } = await db.from("laf_tracking_orders").select("*").order("created_at", { ascending: false }).limit(200);
            if (error) throw error;
            orders = data || []; renderOrders();
        } catch {
            message("অর্ডার লোড হয়নি।", true);
        } finally {
            $("opReload").disabled = false;
        }
    }

    async function changeStatus(order, targetStatus) {
        if (targetStatus === order.status || updating) return;
        updating = true; renderOrders(); message("সংরক্ষণ করা হচ্ছে…");

        try {
            const { data, error } = await db.from("laf_tracking_orders").update({ status: targetStatus }).eq("id", order.id).select();
            if (error) throw error;
            message("স্ট্যাটাস ১ ক্লিকে পরিবর্তন হয়েছে!");
        } catch {
            message("পরিবর্তন হয়নি।", true);
        } finally {
            updating = false; await loadOrders();
        }
    }

    async function authorizeAdmin() {
        const { data } = await db.auth.getUser();
        if (!data?.user) { showLogin(); return; }

        const { data: membership } = await db.from("laf_admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
        if (!membership) { await db.auth.signOut(); showLogin(); message("Admin অনুমতি নেই।", true); return; }

        $("opLogin").hidden = true; $("opDashboard").hidden = false;
        $("opOwner").textContent = data.user.email;
        await loadOrders();
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginButton.disabled = true; message("লগইন হচ্ছে…");
        try {
            const { error } = await db.auth.signInWithPassword({ email: $("opEmail").value.trim(), password: $("opPassword").value });
            if (error) throw error;
            await authorizeAdmin();
        } catch {
            message("ইমেইল বা পাসওয়ার্ড ভুল।", true);
        } finally { loginButton.disabled = false; }
    });

    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const orderId = normalizeOrderId($("opNewId").value);
        const phone = normalizePhone($("opNewPhone").value);
        if (!orderId || !phone) return;

        $("opAddButton").disabled = true;
        try {
            const { error } = await db.from("laf_tracking_orders").insert({ order_id: orderId, phone, label: $("opNewLabel").value.trim() });
            if (error) throw error;
            addForm.reset(); message("নতুন অর্ডার যুক্ত হয়েছে।");
            await loadOrders();
        } catch { message("যোগ করা যায়নি।", true); }
        finally { $("opAddButton").disabled = false; }
    });

    $("opSearch").addEventListener("input", renderOrders);
    $("opFilter").addEventListener("change", renderOrders);
    $("opReload").addEventListener("click", loadOrders);
    $("opLogout").addEventListener("click", async () => { await db.auth.signOut(); showLogin(); });

    await authorizeAdmin();
}

async function start() {
    document.querySelectorAll("[data-op-year]").forEach((i) => i.textContent = String(new Date().getFullYear()));
    const isAdmin = document.body.dataset.portal === "admin";
    const db = createClient(https://ysmtysgavtvcujmbuwlc.supabase.co, sb_publishable_PAAXTKjIJyeUzv4A8TtqDA_oiaqhEuT, { auth: { persistSession: isAdmin, autoRefreshToken: isAdmin } });
    if (isAdmin) await initAdmin(db); else initTracking(db);
}

start().catch(() => message("কানেকশন সমস্যা।", true));
