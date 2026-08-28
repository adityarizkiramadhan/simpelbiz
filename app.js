// ============================================================
// SIMPELBIZ - APPLICATION (FULL FITUR DENGAN KENDALA)
// ============================================================

let allData = [];
let allPengiriman = [];
let editingId = null;
let editingPengirimanId = null;
let currentPage = 1;
const itemsPerPage = 10;
let filteredMonitoringData = [];

// ============================================================
// ELEMENTS
// ============================================================

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const berkasModal = document.getElementById("berkasModal");
const berkasForm = document.getElementById("berkasForm");
const pengirimanModal = document.getElementById("pengirimanModal");
const pengirimanForm = document.getElementById("pengirimanForm");

// ============================================================
// FUNGSI DETEKSI KENDALA
// ============================================================

function isDataTerkendala(item) {
    // Cek dari status
    const statusTerkendala = item.status && item.status.toLowerCase() === "terkendala";
    // Cek dari catatan
    const hasCatatan = (item.catatan && item.catatan.length > 0) || 
                       (item.catatan_kendala && item.catatan_kendala.length > 0);
    
    return statusTerkendala || hasCatatan;
}

function getCatatanKendala(item) {
    return item.catatan || item.catatan_kendala || "-";
}

// ============================================================
// START
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 SIMPELBIZ started");
    showLogin();
    
    // Event listener untuk kategori - hide/show stempel
    document.getElementById("kategori").addEventListener("change", function() {
        const stempelField = document.getElementById("stempelField");
        if (this.value === "Perubahan" || this.value === "Pembubaran") {
            stempelField.style.display = "none";
            document.getElementById("pesanStempel").value = "Tidak Perlu";
        } else {
            stempelField.style.display = "block";
        }
    });
});

// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const button = document.getElementById("loginButton");

    loginError.textContent = "";
    button.disabled = true;
    button.textContent = "Memproses...";

    if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
        loginForm.reset();
        showApp();
        loadData();
    } else {
        loginError.textContent = "Email atau password salah!";
    }

    button.disabled = false;
    button.textContent = "Login";
});

// ============================================================
// LOGOUT
// ============================================================

document.getElementById("logoutButton").addEventListener("click", function() {
    if (confirm("Apakah Anda yakin ingin logout?")) {
        showLogin();
        allData = [];
        allPengiriman = [];
    }
});

// ============================================================
// SHOW / HIDE
// ============================================================

function showLogin() {
    loginPage.classList.remove("hidden");
    appPage.classList.add("hidden");
}

function showApp() {
    loginPage.classList.add("hidden");
    appPage.classList.remove("hidden");
    document.getElementById("userEmail").textContent = DEFAULT_EMAIL;
    document.getElementById("userName").textContent = "Admin";
}

// ============================================================
// LOAD DATA DARI SUPABASE
// ============================================================

async function loadData() {
    console.log("📡 Mengambil data dari Supabase...");

    try {
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error("❌ Error:", error);
            alert("Gagal mengambil data!\n\n" + error.message);
            allData = [];
        } else if (data && data.length > 0) {
            console.log("✅ Data dari Supabase:", data.length, "berkas");
            allData = data;
        } else {
            console.log("ℹ️ Data kosong");
            allData = [];
        }
    } catch (error) {
        console.error("❌ Error:", error);
        alert("Gagal terhubung ke Supabase!\n\n" + error.message);
        allData = [];
    }

    loadPengirimanLocal();
    renderAll();
}

// ============================================================
// PENGIRIMAN - LOCAL STORAGE
// ============================================================

function loadPengirimanLocal() {
    const saved = localStorage.getItem("simpelbiz_pengiriman");
    if (saved) {
        try {
            allPengiriman = JSON.parse(saved);
        } catch {
            allPengiriman = [];
        }
    } else {
        allPengiriman = [];
    }
}

function savePengirimanLocal() {
    localStorage.setItem("simpelbiz_pengiriman", JSON.stringify(allPengiriman));
}

// ============================================================
// RENDER ALL
// ============================================================

function renderAll() {
    console.log("📊 Rendering", allData.length, "data");
    renderDashboard();
    renderRecentTable();
    renderBerkasTable(allData);
    currentPage = 1;
    renderMonitoringTable(allData);
    renderLegalitasTable(allData);
    renderStempelTable(allData);
    renderPengirimanTable(allPengiriman);
}

// ============================================================
// RENDER DASHBOARD
// ============================================================

function renderDashboard() {
    const total = allData.length;
    const selesai = allData.filter(x => x.status && x.status.toLowerCase() === "selesai").length;
    const proses = allData.filter(x => x.status && x.status.toLowerCase() === "proses").length;
    const seleksi = allData.filter(x => x.status && x.status.toLowerCase() === "seleksi").length;
    const terkendala = allData.filter(x => x.status && x.status.toLowerCase() === "terkendala").length;
    const menunggu = allData.filter(x => x.status && x.status.toLowerCase().includes("menunggu")).length;
    const pengiriman = allData.filter(x => x.pengiriman === "JNE" || x.pengiriman === "GoSend").length;

    document.getElementById("totalBerkas").textContent = total;
    document.getElementById("totalSelesai").textContent = selesai + seleksi;
    document.getElementById("totalProses").textContent = proses + menunggu;
    document.getElementById("totalKirim").textContent = pengiriman;
    document.getElementById("sidebarTotal").textContent = total;
    document.getElementById("recentCount").textContent = total + " berkas";

    const legalitasCount = allData.filter(x => x.tgl_sk_setuju || x.tgl_sk).length;
    document.getElementById("legalitasCount").textContent = legalitasCount;

    document.getElementById("jneCount").textContent = allData.filter(x => x.pengiriman === "JNE").length;
    document.getElementById("gosendCount").textContent = allData.filter(x => x.pengiriman === "GoSend").length;
    document.getElementById("clientCount").textContent = allData.filter(x => x.pengiriman === "Diambil Client").length;
    document.getElementById("belumKirimCount").textContent = allData.filter(x => x.pengiriman === "Belum Dikirim").length;

    const totalStatus = Math.max(selesai + seleksi + proses + terkendala + menunggu, 1);
    document.getElementById("statusChart").innerHTML = `
        ${chartRow("✅ Selesai/Seleksi", selesai + seleksi, totalStatus)}
        ${chartRow("🔄 Proses/Menunggu", proses + menunggu, totalStatus)}
        ${chartRow("⚠️ Terkendala", terkendala, totalStatus)}
    `;
}

function chartRow(label, count, total) {
    const percentage = Math.round((count / total) * 100);
    return `
        <div class="chart-row">
            <span>${label}</span>
            <div class="chart-bar">
                <div class="chart-fill" style="width:${Math.max(percentage, 5)}%"></div>
            </div>
            <strong>${count}</strong>
        </div>
    `;
}

// ============================================================
// RENDER RECENT TABLE - DENGAN DETEKSI KENDALA
// ============================================================

function renderRecentTable() {
    const recent = allData.slice(0, 5);
    const table = document.getElementById("recentTable");

    if (!table) return;

    if (!recent.length) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#7b8497;">Belum ada data.</td></tr>`;
        return;
    }

    table.innerHTML = recent.map(item => {
        const isTerkendala = isDataTerkendala(item);
        
        let statusBadgeHtml;
        if (isTerkendala) {
            statusBadgeHtml = `
                <span class="status-badge terkendala" style="background:#fee2e2 !important; color:#dc2626 !important; border:2px solid #dc2626 !important; font-weight:700; animation:pulseKendala 1.5s infinite;">
                    ⚠️ ${escapeHTML(item.status || "Terkendala")}
                </span>
            `;
        } else {
            statusBadgeHtml = statusBadge(item.status);
        }
        
        return `
            <tr class="${isTerkendala ? 'row-terkendala' : ''}">
                <td><strong>${escapeHTML(item.nama_badan_hukum || "-")}</strong></td>
                <td>${escapeHTML(item.kategori_entitas || "-")}</td>
                <td>${escapeHTML(item.pesan_stempel || "-")}</td>
                <td>${statusBadgeHtml}</td>
                <td>${escapeHTML(item.pengiriman || "-")}</td>
                <td>
                    <button class="btn-outline btn-sm" onclick="editData(${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger btn-sm" onclick="deleteData(${item.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join("");
}

// ============================================================
// RENDER BERKAS TABLE - DENGAN DETEKSI KENDALA
// ============================================================

function renderBerkasTable(data) {
    const table = document.getElementById("berkasTable");

    if (!table) return;

    if (!data || !data.length) {
        table.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;color:#7b8497;">Tidak ada data.</td></tr>`;
        return;
    }

    table.innerHTML = data.map((item, index) => {
        const isTerkendala = isDataTerkendala(item);
        const stempelDisplay = item.kategori_entitas && (item.kategori_entitas === "Perubahan" || item.kategori_entitas === "Pembubaran") ? "Tidak Perlu" : (item.pesan_stempel || "-");
        const catatan = getCatatanKendala(item);
        
        let statusBadgeHtml;
        if (isTerkendala) {
            statusBadgeHtml = `
                <span class="status-badge terkendala" style="background:#fee2e2 !important; color:#dc2626 !important; border:2px solid #dc2626 !important; font-weight:700; animation:pulseKendala 1.5s infinite;">
                    ⚠️ ${escapeHTML(item.status || "Terkendala")}
                </span>
            `;
        } else {
            statusBadgeHtml = statusBadge(item.status);
        }
        
        return `
            <tr class="${isTerkendala ? 'row-terkendala' : ''}">
                <td>${index + 1}</td>
                <td><strong>${escapeHTML(item.nama_badan_hukum || "-")}</strong></td>
                <td>${escapeHTML(item.kategori_entitas || "-")}</td>
                <td>${escapeHTML(item.bentuk_entitas || "-")}</td>
                <td>${statusBadgeHtml}</td>
                <td>${escapeHTML(stempelDisplay)}</td>
                <td>${escapeHTML(item.pengiriman || "-")}</td>
                <td>${formatDate(item.kirim_notaris)}</td>
                <td>
                    <button class="btn-outline btn-sm" onclick="editData(${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger btn-sm" onclick="deleteData(${item.id})"><i class="fas fa-trash"></i></button>
                    ${isTerkendala ? `<span class="kendala-badge" onclick="showKendala('${escapeHTML(item.nama_badan_hukum)}', '${escapeHTML(catatan)}')" style="font-size:8px; padding:2px 10px; margin-left:4px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </span>` : ''}
                </td>
            </tr>
        `;
    }).join("");
}

// ============================================================
// RENDER LEGALITAS TABLE
// ============================================================

function renderLegalitasTable(data) {
    const table = document.getElementById("legalitasTable");
    const countEl = document.getElementById("legalitasCount");

    if (!table) return;

    const legalitasData = data.filter(item => item.tgl_sk_setuju || item.tgl_sk);

    if (countEl) countEl.textContent = legalitasData.length;

    if (!legalitasData || !legalitasData.length) {
        table.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;color:#7b8497;">Belum ada data legalitas yang selesai.</td></tr>`;
        return;
    }

    table.innerHTML = legalitasData.map((item, index) => {
        const isTerkendala = isDataTerkendala(item);
        const stempelDisplay = item.kategori_entitas && (item.kategori_entitas === "Perubahan" || item.kategori_entitas === "Pembubaran") ? "Tidak Perlu" : (item.pesan_stempel || "-");
        const skDate = item.tgl_sk_setuju || item.tgl_sk;
        
        let statusBadgeHtml;
        if (isTerkendala) {
            statusBadgeHtml = `
                <span class="status-badge terkendala" style="background:#fee2e2 !important; color:#dc2626 !important; border:2px solid #dc2626 !important; font-weight:700; animation:pulseKendala 1.5s infinite;">
                    ⚠️ ${escapeHTML(item.status || "Terkendala")}
                </span>
            `;
        } else {
            statusBadgeHtml = statusBadge(item.status);
        }
        
        return `
            <tr class="${isTerkendala ? 'row-terkendala' : ''}">
                <td>${index + 1}</td>
                <td><strong>${escapeHTML(item.nama_badan_hukum || "-")}</strong></td>
                <td>${escapeHTML(item.kategori_entitas || "-")}</td>
                <td>${escapeHTML(item.bentuk_entitas || "-")}</td>
                <td>${statusBadgeHtml}</td>
                <td>${skDate ? formatDate(skDate) : '-'}</td>
                <td>${escapeHTML(stempelDisplay)}</td>
                <td>${escapeHTML(item.pengiriman || "-")}</td>
                <td>
                    <button class="btn-outline btn-sm" onclick="editData(${item.id})"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `;
    }).join("");
}

// ============================================================
// RENDER STEMPEL TABLE - DENGAN DETEKSI KENDALA
// ============================================================

function renderStempelTable(data) {
    const table = document.getElementById("stempelTable");

    if (!table) return;

    const stempelData = data.filter(item => item.kategori_entitas === "Pendirian Baru");

    if (!stempelData || !stempelData.length) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#7b8497;">Tidak ada data stempel (khusus Pendirian).</td></tr>`;
        return;
    }

    table.innerHTML = stempelData.map((item, index) => {
        const isTerkendala = isDataTerkendala(item);
        const catatan = getCatatanKendala(item);
        
        let statusBadgeHtml;
        if (isTerkendala) {
            statusBadgeHtml = `
                <span class="status-badge terkendala" style="background:#fee2e2 !important; color:#dc2626 !important; border:2px solid #dc2626 !important; font-weight:700; animation:pulseKendala 1.5s infinite;">
                    ⚠️ ${escapeHTML(item.status || "Terkendala")}
                </span>
            `;
        } else {
            statusBadgeHtml = statusBadge(item.status);
        }
        
        return `
            <tr class="${isTerkendala ? 'row-terkendala' : ''}">
                <td>${index + 1}</td>
                <td><strong>${escapeHTML(item.nama_badan_hukum || "-")}</strong></td>
                <td>${escapeHTML(item.kategori_entitas || "-")}</td>
                <td>${escapeHTML(item.pesan_stempel || "-")}</td>
                <td>${statusBadgeHtml}</td>
                <td>
                    <button class="btn-outline btn-sm" onclick="editData(${item.id})"><i class="fas fa-edit"></i></button>
                    ${isTerkendala ? `<span class="kendala-badge" onclick="showKendala('${escapeHTML(item.nama_badan_hukum)}', '${escapeHTML(catatan)}')" style="font-size:8px; padding:2px 10px; margin-left:4px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </span>` : ''}
                </td>
            </tr>
        `;
    }).join("");
}

// ============================================================
// RENDER PENGIRIMAN TABLE
// ============================================================

function renderPengirimanTable(data) {
    const table = document.getElementById("pengirimanTable");

    if (!table) return;

    if (!data || !data.length) {
        table.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;color:#7b8497;">Tidak ada data pengiriman.</td></tr>`;
        return;
    }

    table.innerHTML = data.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHTML(item.nama_badan_hukum || "-")}</strong></td>
            <td>${escapeHTML(item.kategori || "-")}</td>
            <td>${escapeHTML(item.metode_pengiriman || "-")}</td>
            <td>${escapeHTML(item.no_resi || "-")}</td>
            <td>${item.tanggal_kirim ? formatDate(item.tanggal_kirim) : '-'}</td>
            <td>${escapeHTML(item.keterangan || "-")}</td>
            <td>${escapeHTML(item.status || "Belum Dikirim")}</td>
            <td>
                <button class="btn-outline btn-sm" onclick="editPengiriman(${item.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-danger btn-sm" onclick="deletePengiriman(${item.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join("");
}

// ============================================================
// STATUS BADGE
// ============================================================

function statusBadge(status) {
    let cls = String(status || "").toLowerCase();
    let displayStatus = status || "-";
    
    if (cls.includes("selesai")) { cls = "selesai"; }
    else if (cls.includes("seleksi")) { cls = "seleksi"; }
    else if (cls.includes("terkendala")) { cls = "terkendala"; }
    else if (cls.includes("menunggu")) { cls = "menunggu"; }
    else if (cls.includes("proses")) { cls = "proses"; }
    else { cls = "proses"; }
    
    return `<span class="status-badge ${cls}">${escapeHTML(displayStatus)}</span>`;
}

// ============================================================
// GET STATUS CLASS
// ============================================================

function getStatusClass(status) {
    let cls = String(status || "").toLowerCase();
    if (cls.includes("selesai")) return "selesai";
    if (cls.includes("seleksi")) return "seleksi";
    if (cls.includes("terkendala")) return "terkendala";
    if (cls.includes("menunggu")) return "menunggu";
    if (cls.includes("proses")) return "proses";
    return "proses";
}

// ============================================================
// GET PROGRESS STEPS
// ============================================================

function getProgressSteps(item) {
    const steps = [
        { key: 'kirim_notaris', done: !!item.kirim_notaris },
        { key: 'terima_minuta', done: !!item.terima_minuta },
        { key: 'jadwal_ttd', done: !!item.jadwal_ttd },
        { key: 'tgl_sk_setuju', done: !!(item.tgl_sk_setuju || item.tgl_sk) },
        { key: 'pengiriman', done: item.pengiriman && item.pengiriman !== 'Belum Dikirim' }
    ];
    
    let result = [];
    let allDone = true;
    
    steps.forEach((step, index) => {
        const isDone = step.done;
        const isPending = !isDone;
        const isActive = isPending && allDone;
        
        let dotStatus = 'pending';
        if (isDone) dotStatus = 'done';
        else if (isActive) dotStatus = 'active';
        
        result.push({ type: 'dot', status: dotStatus });
        
        if (index < steps.length - 1) {
            let lineStatus = 'pending';
            if (isDone) lineStatus = 'done';
            else if (isActive) lineStatus = 'active';
            result.push({ type: 'line', status: lineStatus });
        }
        
        if (!isDone) allDone = false;
    });
    
    return result;
}

// ============================================================
// RENDER MONITORING TABLE - DENGAN DETEKSI KENDALA OTOMATIS
// ============================================================

function renderMonitoringTable(data) {
    const table = document.getElementById("monitoringTable");
    const countEl = document.getElementById("monitoringTableCount");

    if (!table) return;

    filteredMonitoringData = filterMonitoringData(data);
    const totalItems = filteredMonitoringData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (countEl) countEl.textContent = totalItems + " berkas";

    if (!filteredMonitoringData || !filteredMonitoringData.length) {
        table.innerHTML = `<tr><td colspan="14" style="text-align:center;padding:30px;color:#7b8497;">Belum ada data untuk monitoring.</td></tr>`;
        updatePagination(0, 0);
        return;
    }

    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageData = filteredMonitoringData.slice(startIndex, endIndex);

    table.innerHTML = pageData.map((item, index) => {
        const progressSteps = getProgressSteps(item);
        const isTerkendala = isDataTerkendala(item);
        const catatan = getCatatanKendala(item);
        const stempelDisplay = item.kategori_entitas && (item.kategori_entitas === "Perubahan" || item.kategori_entitas === "Pembubaran") ? "Tidak Perlu" : (item.pesan_stempel || "-");
        
        let statusBadgeHtml;
        if (isTerkendala) {
            statusBadgeHtml = `
                <span class="status-badge terkendala" style="background:#fee2e2 !important; color:#dc2626 !important; border:2px solid #dc2626 !important; font-weight:700; animation:pulseKendala 1.5s infinite;">
                    ⚠️ ${escapeHTML(item.status || "Terkendala")}
                </span>
            `;
        } else {
            statusBadgeHtml = statusBadge(item.status);
        }
        
        const rowClass = isTerkendala ? 'row-terkendala' : '';
        
        return `
            <tr class="${rowClass}">
                <td>${startIndex + index + 1}</td>
                <td><strong>${escapeHTML(item.nama_badan_hukum || "-")}</strong></td>
                <td>${escapeHTML(item.kategori_entitas || "-")}</td>
                <td>${escapeHTML(item.bentuk_entitas || "-")}</td>
                <td>${statusBadgeHtml}</td>
                <td>${item.kirim_notaris ? formatDate(item.kirim_notaris) : '-'}</td>
                <td>${item.terima_minuta ? formatDate(item.terima_minuta) : '-'}</td>
                <td>${item.jadwal_ttd ? formatDate(item.jadwal_ttd) : '-'}</td>
                <td>${item.tgl_sk_setuju ? formatDate(item.tgl_sk_setuju) : '-'}</td>
                <td>${escapeHTML(stempelDisplay)}</td>
                <td>${escapeHTML(item.pengiriman || "-")}</td>
                <td>
                    <div class="progress-dots">
                        ${progressSteps.map(s => `
                            ${s.type === 'dot' ? `<span class="progress-dot ${s.status}" title="${s.status === 'done' ? '✅ Selesai' : s.status === 'active' ? '🔄 Proses' : '⏳ Belum'}"></span>` : `<span class="progress-line ${s.status}"></span>`}
                        `).join('')}
                    </div>
                </td>
                <td class="kendala-col">
                    ${isTerkendala ? `<span class="kendala-badge" onclick="showKendala('${escapeHTML(item.nama_badan_hukum)}', '${escapeHTML(catatan)}')">
                        <i class="fas fa-exclamation-triangle"></i> ${escapeHTML(catatan.length > 30 ? catatan.substring(0, 30) + '...' : catatan)}
                    </span>` : '-'}
                </td>
                <td>
                    <button class="btn-outline btn-sm" onclick="editData(${item.id})"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `;
    }).join("");

    updatePagination(currentPage, totalPages);
}

// ============================================================
// FILTER MONITORING DATA
// ============================================================

function filterMonitoringData(data) {
    const search = document.getElementById("searchMonitoring")?.value?.toLowerCase().trim() || "";
    const kategori = document.getElementById("filterMonitoringKategori")?.value || "";
    const status = document.getElementById("filterMonitoringStatus")?.value || "";
    const kendala = document.getElementById("filterKendala")?.value || "";

    return (data || allData).filter(item => {
        const text = (item.nama_badan_hukum || "") + " " + (item.kategori_entitas || "");
        const isTerkendala = isDataTerkendala(item);
        const hasKendala = (item.catatan && item.catatan.length > 0) || (item.catatan_kendala && item.catatan_kendala.length > 0);
        
        let matchKendala = true;
        if (kendala === 'ada') matchKendala = isTerkendala || hasKendala;
        else if (kendala === 'tidak') matchKendala = !isTerkendala && !hasKendala;
        
        return (
            (!search || text.toLowerCase().includes(search)) &&
            (!kategori || item.kategori_entitas === kategori) &&
            (!status || item.status === status) &&
            matchKendala
        );
    });
}

// ============================================================
// PAGINATION
// ============================================================

function updatePagination(current, total) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    if (total <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-wrapper">';
    html += `<button class="pagination-btn" onclick="changePage(${current - 1})" ${current <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, current + 2);
    
    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) html += `<span class="pagination-dots">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === current ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    if (endPage < total) {
        if (endPage < total - 1) html += `<span class="pagination-dots">...</span>`;
        html += `<button class="pagination-btn" onclick="changePage(${total})">${total}</button>`;
    }
    
    html += `<button class="pagination-btn" onclick="changePage(${current + 1})" ${current >= total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    html += `<span class="pagination-info">Halaman ${current} dari ${total}</span>`;
    html += '</div>';
    
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    const totalItems = filteredMonitoringData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderMonitoringTable(allData);
}

// ============================================================
// SHOW KENDALA POPUP
// ============================================================

function showKendala(nama, catatan) {
    Swal.fire({
        title: '⚠️ Detail Kendala',
        html: `
            <div style="text-align:left; padding:10px;">
                <p><strong>📋 Nama Badan Hukum:</strong><br> ${escapeHTML(nama)}</p>
                <hr style="margin:10px 0; border-color:#e5e7eb;">
                <p><strong>📝 Catatan Kendala:</strong></p>
                <div style="background:#fef2f2; padding:14px; border-radius:10px; border-left:4px solid #EF4444; margin-top:6px; color:#1A1A2E; font-size:14px;">
                    ${escapeHTML(catatan)}
                </div>
                <p style="margin-top:10px; font-size:12px; color:#9CA3AF;">
                    <i class="fas fa-info-circle"></i> Segera selesaikan kendala untuk melanjutkan proses.
                </p>
            </div>
        `,
        icon: 'warning',
        confirmButtonColor: '#6C63FF',
        confirmButtonText: 'Tutup',
        width: '500px'
    });
}

// ============================================================
// REFRESH DATA
// ============================================================

function refreshData() {
    Swal.fire({
        title: '🔄 Memuat ulang data...',
        text: 'Mengambil data terbaru dari database',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    loadData().then(() => {
        Swal.close();
        Swal.fire({
            icon: 'success',
            title: '✅ Data diperbarui!',
            timer: 1000,
            showConfirmButton: false
        });
    });
}

// ============================================================
// SEARCH & FILTER - BERKAS
// ============================================================

document.getElementById("globalSearch").addEventListener("input", function() {
    const value = this.value.toLowerCase().trim();
    navigateToPage('berkas');
    if (!value) {
        renderBerkasTable(allData);
        return;
    }
    const result = allData.filter(item =>
        JSON.stringify(item).toLowerCase().includes(value)
    );
    renderBerkasTable(result);
});

document.getElementById("searchBerkas").addEventListener("input", function() {
    renderBerkasTable(filterBerkas());
});

document.getElementById("filterKategori").addEventListener("change", function() {
    renderBerkasTable(filterBerkas());
});

document.getElementById("filterStatus").addEventListener("change", function() {
    renderBerkasTable(filterBerkas());
});

function filterBerkas() {
    const search = document.getElementById("searchBerkas").value.toLowerCase().trim();
    const kategori = document.getElementById("filterKategori").value;
    const status = document.getElementById("filterStatus").value;

    return allData.filter(item => {
        const text = (item.nama_badan_hukum || "") + " " + (item.kategori_entitas || "");
        return (
            (!search || text.toLowerCase().includes(search)) &&
            (!kategori || item.kategori_entitas === kategori) &&
            (!status || item.status === status)
        );
    });
}

// ============================================================
// SEARCH & FILTER - MONITORING
// ============================================================

document.getElementById("searchMonitoring").addEventListener("input", function() {
    currentPage = 1;
    renderMonitoringTable(allData);
});

document.getElementById("filterMonitoringKategori").addEventListener("change", function() {
    currentPage = 1;
    renderMonitoringTable(allData);
});

document.getElementById("filterMonitoringStatus").addEventListener("change", function() {
    currentPage = 1;
    renderMonitoringTable(allData);
});

document.getElementById("filterKendala").addEventListener("change", function() {
    currentPage = 1;
    renderMonitoringTable(allData);
});

// ============================================================
// SEARCH & FILTER - LEGALITAS
// ============================================================

document.getElementById("searchLegalitas").addEventListener("input", function() {
    renderLegalitasTable(filterLegalitas());
});

document.getElementById("filterLegalitasKategori").addEventListener("change", function() {
    renderLegalitasTable(filterLegalitas());
});

function filterLegalitas() {
    const search = document.getElementById("searchLegalitas").value.toLowerCase().trim();
    const kategori = document.getElementById("filterLegalitasKategori").value;

    return allData.filter(item => {
        const text = (item.nama_badan_hukum || "") + " " + (item.kategori_entitas || "");
        const isSelesai = item.tgl_sk_setuju || item.tgl_sk;
        return (
            isSelesai &&
            (!search || text.toLowerCase().includes(search)) &&
            (!kategori || item.kategori_entitas === kategori)
        );
    });
}

// ============================================================
// SEARCH & FILTER - STEMPEL
// ============================================================

document.getElementById("searchStempel").addEventListener("input", function() {
    renderStempelTable(filterStempel());
});

document.getElementById("filterStempel").addEventListener("change", function() {
    renderStempelTable(filterStempel());
});

function filterStempel() {
    const search = document.getElementById("searchStempel").value.toLowerCase().trim();
    const stempel = document.getElementById("filterStempel").value;

    return allData.filter(item => {
        if (item.kategori_entitas !== "Pendirian Baru") return false;
        const text = (item.nama_badan_hukum || "") + " " + (item.pesan_stempel || "");
        return (
            (!search || text.toLowerCase().includes(search)) &&
            (!stempel || item.pesan_stempel === stempel)
        );
    });
}

// ============================================================
// SEARCH & FILTER - PENGIRIMAN
// ============================================================

document.getElementById("searchPengiriman").addEventListener("input", function() {
    renderPengirimanTable(filterPengiriman());
});

document.getElementById("filterPengiriman").addEventListener("change", function() {
    renderPengirimanTable(filterPengiriman());
});

function filterPengiriman() {
    const search = document.getElementById("searchPengiriman").value.toLowerCase().trim();
    const metode = document.getElementById("filterPengiriman").value;

    return allPengiriman.filter(item => {
        const text = (item.nama_badan_hukum || "") + " " + (item.metode_pengiriman || "");
        return (
            (!search || text.toLowerCase().includes(search)) &&
            (!metode || item.metode_pengiriman === metode)
        );
    });
}

// ============================================================
// NAVIGATION
// ============================================================

function navigateToPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    
    const target = document.getElementById(page + 'Page');
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    const titles = {
        dashboard: ['Dashboard Monitoring', 'Pantau progress setiap berkas notaris secara real-time'],
        berkas: ['Data Berkas', 'Kelola seluruh data berkas notaris dengan mudah'],
        monitoring: ['Monitoring Semua Berkas', 'Lihat progress seluruh berkas dari awal hingga selesai'],
        legalitas: ['Legalitas Sudah Selesai', 'Daftar berkas yang legalitasnya sudah selesai'],
        stempel: ['Pesan / Status Stempel', 'Kelola status pemesanan stempel perusahaan (Khusus Pendirian)'],
        pengiriman: ['Data Pengiriman', 'Kelola metode pengiriman berkas'],
        laporan: ['Laporan PDF', 'Cetak laporan data berkas dengan berbagai format']
    };
    
    const titleData = titles[page] || ['Halaman', ''];
    document.getElementById('pageTitle').textContent = titleData[0];
    document.getElementById('pageSubtitle').textContent = titleData[1];
}

// ============================================================
// NAVIGATION EVENTS
// ============================================================

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', function() {
        const page = this.dataset.page;
        navigateToPage(page);
        if (page === 'berkas') {
            renderBerkasTable(filterBerkas());
        } else if (page === 'monitoring') {
            currentPage = 1;
            renderMonitoringTable(allData);
        } else if (page === 'legalitas') {
            renderLegalitasTable(filterLegalitas());
        } else if (page === 'stempel') {
            renderStempelTable(filterStempel());
        } else if (page === 'pengiriman') {
            renderPengirimanTable(filterPengiriman());
        }
    });
});

document.querySelectorAll('.nav-item[data-category]').forEach(item => {
    item.addEventListener('click', function() {
        navigateToPage('monitoring');
        document.getElementById('filterMonitoringKategori').value = this.dataset.category;
        currentPage = 1;
        renderMonitoringTable(allData);
    });
});

// ============================================================
// OPEN ADD MODAL
// ============================================================

function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = '📋 Input Folder Baru Client';
    document.getElementById('modalSubtitle').textContent = 'Isi data client dengan lengkap dan akurat ✨';
    
    berkasForm.reset();
    
    document.getElementById('status').value = 'Sedang Dalam Proses';
    document.getElementById('metodePengiriman').value = 'Belum Dikirim';
    document.getElementById('pesanStempel').value = 'Dipesan lewat SIMPELBIZ';
    document.getElementById('berkasId').value = '';
    
    document.getElementById('stempelField').style.display = 'block';
    
    const saveButton = document.getElementById('saveButton');
    saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Data Folder';
    saveButton.disabled = false;
    
    document.getElementById('formError').textContent = '';
    
    document.getElementById('berkasModal').classList.remove('hidden');
    updateProgress(1);
    
    console.log('📋 Modal Tambah dibuka');
}

// ============================================================
// EDIT DATA
// ============================================================

window.editData = function(id) {
    const item = allData.find(x => x.id === id);
    if (!item) {
        Swal.fire({ icon: 'error', title: 'Data tidak ditemukan!' });
        return;
    }

    editingId = id;
    document.getElementById('modalTitle').textContent = '✏️ Edit Folder Client';
    document.getElementById('modalSubtitle').textContent = 'Perbarui data client dengan akurat 📝';
    
    document.getElementById('berkasId').value = item.id;
    document.getElementById('namaBadanHukum').value = item.nama_badan_hukum || '';
    document.getElementById('kategori').value = item.kategori_entitas || '';
    document.getElementById('bentukEntitas').value = item.bentuk_entitas || '';
    
    if (item.kategori_entitas === 'Perubahan' || item.kategori_entitas === 'Pembubaran') {
        document.getElementById('stempelField').style.display = 'none';
        document.getElementById('pesanStempel').value = 'Tidak Perlu';
    } else {
        document.getElementById('stempelField').style.display = 'block';
        document.getElementById('pesanStempel').value = item.pesan_stempel || 'Dipesan lewat SIMPELBIZ';
    }
    
    document.getElementById('status').value = item.status || 'Sedang Dalam Proses';
    document.getElementById('tglDikirimNotaris').value = item.tgl_dikirim_notaris || item.kirim_notaris || '';
    document.getElementById('jadwalTTD').value = item.jadwal_ttd || '';
    document.getElementById('terimaMinuta').value = item.terima_minuta || '';
    document.getElementById('salinanDiberikan').value = item.salinan_diberikan || '';
    document.getElementById('tglSK').value = item.tgl_sk || item.tgl_sk_setuju || '';
    document.getElementById('metodePengiriman').value = item.pengiriman || 'Belum Dikirim';
    document.getElementById('noResi').value = item.no_resi || '';
    document.getElementById('tglKirimAmbil').value = item.tgl_kirim_ambil || '';
    document.getElementById('catatanKendala').value = item.catatan || '';
    
    const saveButton = document.getElementById('saveButton');
    saveButton.innerHTML = '<i class="fas fa-save"></i> Update Data Folder';
    saveButton.disabled = false;
    
    document.getElementById('formError').textContent = '';
    
    document.getElementById('berkasModal').classList.remove('hidden');
    updateProgress(2);
    
    console.log('✏️ Edit data ID:', id);
};

// ============================================================
// UPDATE PROGRESS
// ============================================================

function updateProgress(step) {
    const steps = document.querySelectorAll('.progress-steps .step');
    const lines = document.querySelectorAll('.progress-steps .step-line');
    const fill = document.querySelector('.progress-fill');
    
    steps.forEach((s, i) => {
        s.classList.toggle('active', i < step);
    });
    lines.forEach((l, i) => {
        l.classList.toggle('active', i < step - 1);
    });
    if (fill) {
        fill.style.width = (step / 3 * 100) + '%';
    }
}

// ============================================================
// SAVE / UPDATE KE SUPABASE
// ============================================================

berkasForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const button = document.getElementById('saveButton');
    const formError = document.getElementById('formError');
    formError.textContent = '';
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    const kategori = document.getElementById('kategori').value;
    const isPerubahan = kategori === 'Perubahan' || kategori === 'Pembubaran';
    
    const payload = {
        nama_badan_hukum: document.getElementById('namaBadanHukum').value.trim(),
        kategori_entitas: kategori,
        bentuk_entitas: document.getElementById('bentukEntitas').value,
        pesan_stempel: isPerubahan ? 'Tidak Perlu' : document.getElementById('pesanStempel').value,
        status: document.getElementById('status').value,
        tgl_dikirim_notaris: document.getElementById('tglDikirimNotaris').value || null,
        jadwal_ttd: document.getElementById('jadwalTTD').value || null,
        terima_minuta: document.getElementById('terimaMinuta').value || null,
        salinan_diberikan: document.getElementById('salinanDiberikan').value || null,
        tgl_sk: document.getElementById('tglSK').value || null,
        pengiriman: document.getElementById('metodePengiriman').value,
        no_resi: document.getElementById('noResi').value.trim(),
        tgl_kirim_ambil: document.getElementById('tglKirimAmbil').value || null,
        catatan: document.getElementById('catatanKendala').value.trim(),
        kirim_notaris: document.getElementById('tglDikirimNotaris').value || null,
        tgl_sk_setuju: document.getElementById('tglSK').value || null
    };

    if (!payload.nama_badan_hukum || !payload.kategori_entitas) {
        formError.textContent = '⚠️ Nama Badan Hukum dan Kategori Layanan wajib diisi!';
        button.disabled = false;
        button.innerHTML = editingId ? '<i class="fas fa-save"></i> Update Data Folder' : '<i class="fas fa-save"></i> Simpan Data Folder';
        return;
    }

    console.log('📝 Menyimpan data:', payload);

    try {
        let result;
        if (editingId) {
            result = await supabaseClient.from(TABLE_NAME).update(payload).eq('id', editingId);
        } else {
            result = await supabaseClient.from(TABLE_NAME).insert(payload);
        }

        if (result.error) {
            console.error('❌ Supabase error:', result.error);
            if (editingId) {
                const index = allData.findIndex(x => x.id === editingId);
                if (index !== -1) {
                    allData[index] = { ...allData[index], ...payload };
                }
            } else {
                const newId = allData.length > 0 ? Math.max(...allData.map(x => x.id)) + 1 : 1;
                allData.unshift({ id: newId, ...payload });
            }
            renderAll();
            Swal.fire({ icon: 'success', title: '✅ Data disimpan secara lokal.', timer: 1500, showConfirmButton: false });
        } else {
            console.log('✅ Data tersimpan di Supabase!');
            await loadData();
            Swal.fire({ 
                icon: 'success', 
                title: editingId ? '✅ Data berhasil diperbarui!' : '✅ Data berhasil ditambahkan!',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('❌ Error:', error);
        if (editingId) {
            const index = allData.findIndex(x => x.id === editingId);
            if (index !== -1) {
                allData[index] = { ...allData[index], ...payload };
            }
        } else {
            const newId = allData.length > 0 ? Math.max(...allData.map(x => x.id)) + 1 : 1;
            allData.unshift({ id: newId, ...payload });
        }
        renderAll();
        Swal.fire({ icon: 'success', title: '✅ Data disimpan secara lokal.', timer: 1500, showConfirmButton: false });
    } finally {
        button.disabled = false;
        button.innerHTML = editingId ? '<i class="fas fa-save"></i> Update Data Folder' : '<i class="fas fa-save"></i> Simpan Data Folder';
        closeModal();
    }
});

// ============================================================
// DELETE
// ============================================================

window.deleteData = async function(id) {
    const item = allData.find(x => x.id === id);
    if (!item) return;
    
    const result = await Swal.fire({
        title: '⚠️ Hapus Data?',
        text: `Anda yakin ingin menghapus "${item.nama_badan_hukum}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6C63FF',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
        const { error } = await supabaseClient.from(TABLE_NAME).delete().eq('id', id);
        if (error) throw error;
        await loadData();
        Swal.fire({ icon: 'success', title: '✅ Data berhasil dihapus!', timer: 1500, showConfirmButton: false });
    } catch (error) {
        allData = allData.filter(x => x.id !== id);
        renderAll();
        Swal.fire({ icon: 'success', title: '✅ Data dihapus secara lokal.', timer: 1500, showConfirmButton: false });
    }
};

// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {
    document.getElementById('berkasModal').classList.add('hidden');
    berkasForm.reset();
    editingId = null;
    document.getElementById('formError').textContent = '';
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);

document.getElementById('berkasModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ============================================================
// BUTTONS
// ============================================================

document.getElementById('menuTambah').addEventListener('click', openAddModal);
document.getElementById('addBerkasButton').addEventListener('click', openAddModal);
document.getElementById('dashboardTambah').addEventListener('click', openAddModal);
document.getElementById('monitoringTambah').addEventListener('click', openAddModal);

document.getElementById('dashboardToBerkas').addEventListener('click', function() {
    navigateToPage('berkas');
    renderBerkasTable(filterBerkas());
});

// ============================================================
// PENGIRIMAN CRUD
// ============================================================

document.getElementById('tambahPengirimanBtn').addEventListener('click', function() {
    editingPengirimanId = null;
    document.getElementById('pengirimanForm').reset();
    document.getElementById('pengirimanError').textContent = '';
    document.getElementById('savePengirimanBtn').innerHTML = '<i class="fas fa-save"></i> Simpan Pengiriman';
    document.getElementById('pengirimanModal').classList.remove('hidden');
});

document.getElementById('closePengirimanModal').addEventListener('click', function() {
    document.getElementById('pengirimanModal').classList.add('hidden');
});

document.getElementById('cancelPengirimanModal').addEventListener('click', function() {
    document.getElementById('pengirimanModal').classList.add('hidden');
});

document.getElementById('pengirimanModal').addEventListener('click', function(e) {
    if (e.target === this) {
        document.getElementById('pengirimanModal').classList.add('hidden');
    }
});

window.editPengiriman = function(id) {
    const item = allPengiriman.find(x => x.id === id);
    if (!item) {
        Swal.fire({ icon: 'error', title: 'Data tidak ditemukan!' });
        return;
    }

    editingPengirimanId = id;
    document.getElementById('pNamaBadanHukum').value = item.nama_badan_hukum || '';
    document.getElementById('pKategori').value = item.kategori || '';
    document.getElementById('pMetodePengiriman').value = item.metode_pengiriman || '';
    document.getElementById('pNoResi').value = item.no_resi || '';
    document.getElementById('pTglKirim').value = item.tanggal_kirim || '';
    document.getElementById('pKeterangan').value = item.keterangan || '';
    document.getElementById('pengirimanError').textContent = '';
    document.getElementById('savePengirimanBtn').innerHTML = '<i class="fas fa-save"></i> Update Pengiriman';
    document.getElementById('pengirimanModal').classList.remove('hidden');
};

pengirimanForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const button = document.getElementById('savePengirimanBtn');
    const errorEl = document.getElementById('pengirimanError');
    errorEl.textContent = '';
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    const payload = {
        nama_badan_hukum: document.getElementById('pNamaBadanHukum').value.trim(),
        kategori: document.getElementById('pKategori').value,
        metode_pengiriman: document.getElementById('pMetodePengiriman').value,
        no_resi: document.getElementById('pNoResi').value.trim(),
        tanggal_kirim: document.getElementById('pTglKirim').value,
        keterangan: document.getElementById('pKeterangan').value.trim(),
        status: document.getElementById('pMetodePengiriman').value === 'Belum Dikirim' ? 'Belum Dikirim' : 'Dikirim'
    };

    if (!payload.nama_badan_hukum || !payload.kategori || !payload.metode_pengiriman || !payload.tanggal_kirim) {
        errorEl.textContent = '⚠️ Nama, Kategori, Metode Pengiriman, dan Tanggal Kirim wajib diisi!';
        button.disabled = false;
        button.innerHTML = editingPengirimanId ? '<i class="fas fa-save"></i> Update Pengiriman' : '<i class="fas fa-save"></i> Simpan Pengiriman';
        return;
    }

    if (editingPengirimanId) {
        const index = allPengiriman.findIndex(x => x.id === editingPengirimanId);
        if (index !== -1) {
            allPengiriman[index] = { ...allPengiriman[index], ...payload };
        }
    } else {
        const newId = allPengiriman.length > 0 ? Math.max(...allPengiriman.map(x => x.id)) + 1 : 1;
        allPengiriman.unshift({ id: newId, ...payload });
    }

    savePengirimanLocal();
    renderPengirimanTable(filterPengiriman());
    document.getElementById('pengirimanModal').classList.add('hidden');
    button.disabled = false;
    button.innerHTML = editingPengirimanId ? '<i class="fas fa-save"></i> Update Pengiriman' : '<i class="fas fa-save"></i> Simpan Pengiriman';
    
    Swal.fire({
        icon: 'success',
        title: editingPengirimanId ? '✅ Pengiriman diperbarui!' : '✅ Pengiriman ditambahkan!',
        timer: 1500,
        showConfirmButton: false
    });
    
    editingPengirimanId = null;
});

window.deletePengiriman = function(id) {
    const item = allPengiriman.find(x => x.id === id);
    if (!item) return;
    
    Swal.fire({
        title: '⚠️ Hapus Pengiriman?',
        text: `Anda yakin ingin menghapus pengiriman "${item.nama_badan_hukum}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6C63FF',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            allPengiriman = allPengiriman.filter(x => x.id !== id);
            savePengirimanLocal();
            renderPengirimanTable(filterPengiriman());
            Swal.fire({ icon: 'success', title: '✅ Pengiriman dihapus!', timer: 1500, showConfirmButton: false });
        }
    });
};

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

function exportAllPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        
        doc.setFontSize(20);
        doc.setTextColor('#6C63FF');
        doc.text('SIMPELBIZ - Laporan Semua Data', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor('#666');
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
        doc.text(`Total Data: ${allData.length} berkas`, 14, 33);
        
        const tableData = allData.map(item => {
            const stempelDisplay = item.kategori_entitas && (item.kategori_entitas === "Perubahan" || item.kategori_entitas === "Pembubaran") ? "Tidak Perlu" : (item.pesan_stempel || "-");
            return [
                item.nama_badan_hukum || '-',
                item.kategori_entitas || '-',
                item.bentuk_entitas || '-',
                item.status || '-',
                stempelDisplay,
                item.pengiriman || '-',
                item.kirim_notaris ? formatDate(item.kirim_notaris) : '-',
                item.tgl_sk_setuju ? formatDate(item.tgl_sk_setuju) : '-'
            ];
        });
        
        doc.autoTable({
            head: [['Nama', 'Kategori', 'Bentuk', 'Status', 'Stempel', 'Pengiriman', 'Kirim Notaris', 'SK Setuju']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 7 },
            headStyles: { fillColor: '#6C63FF', textColor: '#fff' },
            alternateRowStyles: { fillColor: '#F0F2F8' }
        });
        
        doc.save('Laporan_Semua_Data_SIMPELBIZ.pdf');
        Swal.fire({ icon: 'success', title: '✅ PDF Berhasil Diekspor!', timer: 1500, showConfirmButton: false });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Export PDF!', text: err.message });
    }
}

function exportLegalitasPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const legalitasData = allData.filter(item => item.tgl_sk_setuju || item.tgl_sk);
        
        doc.setFontSize(22);
        doc.setTextColor('#6C63FF');
        doc.text('SIMPELBIZ - Laporan Legalitas Selesai', 14, 25);
        doc.setFontSize(10);
        doc.setTextColor('#666');
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 33);
        doc.text(`Total Legalitas Selesai: ${legalitasData.length} berkas`, 14, 40);
        
        const tableData = legalitasData.map((item, index) => {
            const stempelDisplay = item.kategori_entitas && (item.kategori_entitas === "Perubahan" || item.kategori_entitas === "Pembubaran") ? "Tidak Perlu" : (item.pesan_stempel || "-");
            return [
                index + 1,
                item.nama_badan_hukum || '-',
                item.kategori_entitas || '-',
                item.bentuk_entitas || '-',
                item.status || '-',
                item.tgl_sk_setuju ? formatDate(item.tgl_sk_setuju) : '-',
                stempelDisplay
            ];
        });
        
        doc.autoTable({
            head: [['No', 'Nama Badan Hukum', 'Kategori', 'Bentuk', 'Status', 'Tgl SK Setuju', 'Stempel']],
            body: tableData,
            startY: 48,
            styles: { fontSize: 9 },
            headStyles: { fillColor: '#10B981', textColor: '#fff' },
            alternateRowStyles: { fillColor: '#F0F2F8' }
        });
        
        doc.setFontSize(10);
        doc.setTextColor('#666');
        doc.text('© 2026 Penerbit Aditya Rizki Ramadhan S.Kom - All Rights Reserved', 14, doc.internal.pageSize.height - 10);
        
        doc.save('Laporan_Legalitas_Selesai_SIMPELBIZ.pdf');
        Swal.fire({ icon: 'success', title: '✅ PDF Berhasil Diekspor!', timer: 1500, showConfirmButton: false });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Export PDF!', text: err.message });
    }
}

function exportDashboardPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        
        doc.setFontSize(22);
        doc.setTextColor('#6C63FF');
        doc.text('SIMPELBIZ - Dashboard', 14, 25);
        doc.setFontSize(10);
        doc.setTextColor('#666');
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 33);
        
        const total = allData.length;
        const selesai = allData.filter(d => d.status && d.status.toLowerCase() === 'selesai').length;
        const proses = allData.filter(d => d.status && d.status.toLowerCase() === 'proses').length;
        const seleksi = allData.filter(d => d.status && d.status.toLowerCase() === 'seleksi').length;
        const terkendala = allData.filter(d => d.status && d.status.toLowerCase() === 'terkendala').length;
        const pengiriman = allData.filter(d => d.pengiriman === 'JNE' || d.pengiriman === 'GoSend').length;
        const legalitas = allData.filter(d => d.tgl_sk_setuju || d.tgl_sk).length;
        
        doc.autoTable({
            head: [['Statistik', 'Jumlah']],
            body: [
                ['Total Berkas', total],
                ['Selesai / Seleksi', selesai + seleksi],
                ['Dalam Proses', proses],
                ['Terkendala', terkendala],
                ['Dalam Pengiriman', pengiriman],
                ['Legalitas Selesai', legalitas]
            ],
            startY: 40,
            styles: { fontSize: 12 },
            headStyles: { fillColor: '#6C63FF', textColor: '#fff' }
        });
        
        doc.save('Laporan_Dashboard_SIMPELBIZ.pdf');
        Swal.fire({ icon: 'success', title: '✅ PDF Berhasil Diekspor!', timer: 1500, showConfirmButton: false });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Export PDF!', text: err.message });
    }
}

function exportMonitoringPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        
        doc.setFontSize(18);
        doc.setTextColor('#6C63FF');
        doc.text('SIMPELBIZ - Monitoring Progress', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor('#666');
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
        doc.text(`Total Berkas: ${allData.length}`, 14, 33);
        
        const tableData = allData.map((item, index) => {
            const stempelDisplay = item.kategori_entitas && (item.kategori_entitas === "Perubahan" || item.kategori_entitas === "Pembubaran") ? "Tidak Perlu" : (item.pesan_stempel || "-");
            return [
                index + 1,
                item.nama_badan_hukum || '-',
                item.kategori_entitas || '-',
                item.bentuk_entitas || '-',
                item.status || '-',
                item.kirim_notaris ? formatDate(item.kirim_notaris) : '-',
                item.terima_minuta ? formatDate(item.terima_minuta) : '-',
                item.jadwal_ttd ? formatDate(item.jadwal_ttd) : '-',
                item.tgl_sk_setuju ? formatDate(item.tgl_sk_setuju) : '-',
                stempelDisplay,
                item.pengiriman || '-',
                item.catatan || '-'
            ];
        });
        
        doc.autoTable({
            head: [['#', 'Nama', 'Kategori', 'Bentuk', 'Status', 'Kirim Notaris', 'Terima Minuta', 'Jadwal TTD', 'SK Setuju', 'Stempel', 'Pengiriman', 'Kendala']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 7 },
            headStyles: { fillColor: '#6C63FF', textColor: '#fff' },
            alternateRowStyles: { fillColor: '#F0F2F8' },
            columnStyles: {
                11: { cellWidth: 30, fontSize: 6 }
            }
        });
        
        doc.save('Laporan_Monitoring_SIMPELBIZ.pdf');
        Swal.fire({ icon: 'success', title: '✅ PDF Berhasil Diekspor!', timer: 1500, showConfirmButton: false });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Export PDF!', text: err.message });
    }
}

function exportKategoriPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const categories = ['Pendirian Baru', 'Perubahan', 'Pembubaran', 'Lainnya'];
        let yPos = 45;
        
        doc.setFontSize(18);
        doc.setTextColor('#6C63FF');
        doc.text('SIMPELBIZ - Data Per Kategori', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor('#666');
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
        doc.text(`Total: ${allData.length} berkas`, 14, 33);
        
        categories.forEach(cat => {
            const items = allData.filter(d => d.kategori_entitas === cat);
            if (items.length === 0) return;
            
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(14);
            doc.setTextColor('#6C63FF');
            doc.text(`📁 ${cat} (${items.length} berkas)`, 14, yPos);
            yPos += 6;
            
            items.forEach((item, idx) => {
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
                const stempelDisplay = item.kategori_entitas && (item.kategori_entitas === "Perubahan" || item.kategori_entitas === "Pembubaran") ? "Tidak Perlu" : (item.pesan_stempel || "-");
                doc.setFontSize(9);
                doc.setTextColor('#1A1A2E');
                doc.text(`  ${idx + 1}. ${item.nama_badan_hukum || '-'}`, 18, yPos);
                doc.setTextColor('#666');
                doc.text(`  Status: ${item.status || '-'} | Stempel: ${stempelDisplay} | Pengiriman: ${item.pengiriman || '-'}`, 22, yPos + 5);
                yPos += 12;
            });
            
            yPos += 6;
        });
        
        doc.save('Laporan_Per_Kategori_SIMPELBIZ.pdf');
        Swal.fire({ icon: 'success', title: '✅ PDF Berhasil Diekspor!', timer: 1500, showConfirmButton: false });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Export PDF!', text: err.message });
    }
}

function exportExecutivePDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        doc.setFillColor('#6C63FF');
        doc.rect(0, 0, 210, 50, 'F');
        
        doc.setFontSize(24);
        doc.setTextColor('#FFFFFF');
        doc.text('SIMPELBIZ', 14, 22);
        doc.setFontSize(14);
        doc.text('Ringkasan Eksekutif', 14, 34);
        doc.setFontSize(9);
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 44);
        
        let yPos = 60;
        const total = allData.length;
        const selesai = allData.filter(d => d.status && (d.status.toLowerCase() === 'selesai' || d.status.toLowerCase() === 'seleksi')).length;
        const proses = allData.filter(d => d.status && d.status.toLowerCase() === 'proses').length;
        const terkendala = allData.filter(d => d.status && d.status.toLowerCase() === 'terkendala').length;
        const legalitas = allData.filter(d => d.tgl_sk_setuju || d.tgl_sk).length;
        
        doc.setFontSize(12);
        doc.setTextColor('#1A1A2E');
        doc.text('📊 STATISTIK', 14, yPos);
        yPos += 8;
        
        const stats = [
            ['Total Berkas', total],
            ['Selesai / Seleksi', selesai],
            ['Dalam Proses', proses],
            ['Terkendala', terkendala],
            ['Legalitas Selesai', legalitas],
            ['Persentase Selesai', total > 0 ? Math.round((selesai / total) * 100) + '%' : '0%']
        ];
        
        stats.forEach(stat => {
            doc.setFontSize(10);
            doc.text(`  ${stat[0]}: ${stat[1]}`, 20, yPos);
            yPos += 6;
        });
        
        yPos += 6;
        
        doc.setFontSize(12);
        doc.setTextColor('#1A1A2E');
        doc.text('📋 DAFTAR BERKAS', 14, yPos);
        yPos += 8;
        
        allData.forEach((item, idx) => {
            if (yPos > 260) {
                doc.addPage();
                yPos = 20;
                doc.setFontSize(12);
                doc.setTextColor('#1A1A2E');
                doc.text('📋 DAFTAR BERKAS (lanjutan)', 14, yPos);
                yPos += 8;
            }
            doc.setFontSize(9);
            const statusIcon = item.status && item.status.toLowerCase() === 'selesai' ? '✅' :
                              item.status && item.status.toLowerCase() === 'terkendala' ? '⚠️' : '🔄';
            const stempelDisplay = item.kategori_entitas && (item.kategori_entitas === "Perubahan" || item.kategori_entitas === "Pembubaran") ? "Tidak Perlu" : (item.pesan_stempel || "-");
            doc.text(`${statusIcon} ${idx + 1}. ${item.nama_badan_hukum || '-'}`, 20, yPos);
            doc.setTextColor('#666');
            doc.text(`  Status: ${item.status || '-'} | ${item.kategori_entitas || '-'} | Stempel: ${stempelDisplay}`, 22, yPos + 4);
            if (isDataTerkendala(item)) {
                doc.setTextColor('#ef4444');
                doc.text(`  ⚠️ Kendala: ${getCatatanKendala(item) || '-'}`, 22, yPos + 8);
                yPos += 4;
            }
            doc.setTextColor('#1A1A2E');
            yPos += 10;
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor('#999');
            doc.text(`© ${new Date().getFullYear()} Penerbit Aditya Rizki Ramadhan S.Kom - All Rights Reserved`, 14, doc.internal.pageSize.height - 10);
            doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        }
        
        doc.save('Ringkasan_Eksekutif_SIMPELBIZ.pdf');
        Swal.fire({ icon: 'success', title: '✅ PDF Berhasil Diekspor!', timer: 1500, showConfirmButton: false });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal Export PDF!', text: err.message });
    }
}

// ============================================================
// HELPERS
// ============================================================

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(date) {
    if (!date) return "-";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return date;
    }
}

// ============================================================
// GLOBAL EXPOSURE
// ============================================================

window.navigateToPage = navigateToPage;
window.openAddModal = openAddModal;
window.editData = editData;
window.deleteData = deleteData;
window.editPengiriman = editPengiriman;
window.deletePengiriman = deletePengiriman;
window.refreshData = refreshData;
window.exportAllPDF = exportAllPDF;
window.exportLegalitasPDF = exportLegalitasPDF;
window.exportDashboardPDF = exportDashboardPDF;
window.exportMonitoringPDF = exportMonitoringPDF;
window.exportKategoriPDF = exportKategoriPDF;
window.exportExecutivePDF = exportExecutivePDF;
window.showKendala = showKendala;
window.changePage = changePage;

console.log("✅ SIMPELBIZ APP READY!");