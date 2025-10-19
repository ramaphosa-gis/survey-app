// ===============================
// app.js — Homeland Surveyors Dashboard (Firebase + Supabase) — MERGED + LOADING
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ---- Firebase Config ----
const firebaseConfig = {
  apiKey: "AIzaSyD3La6BOzBUnybZy_OhCt54UEeWjaAD0XY",
  authDomain: "homeland-d1159.firebaseapp.com",
  projectId: "homeland-d1159",
  storageBucket: "homeland-d1159.firebasestorage.app",
  messagingSenderId: "429299746991",
  appId: "1:429299746991:web:9d4f06f0051ba693ef2c5a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---- Supabase Config ----
const SUPABASE_URL = "https://alhcuhdabdlapywwskjl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsaGN1aGRhYmRsYXB5d3dza2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1ODkyMDUsImV4cCI6MjA3NjE2NTIwNX0.iOBcMvY15vuZqNQOUjjVAsYoVj2YzbA3GRdr6T6p86E";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- UI Elements (assumes these IDs exist in your HTML) ----
const logoutBtn = document.getElementById("logoutBtn");
const navButtons = document.querySelectorAll("nav button");
const sections = document.querySelectorAll("main section");

const searchInput = document.getElementById("parcelSearchInput");
const searchBtn = document.getElementById("parcelSearchBtn");

const modal = document.getElementById("parcelModal");
const addParcelBtn = document.getElementById("addParcelBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const parcelForm = document.getElementById("parcelForm");
const ownersList = document.getElementById("ownersList");
const addOwnerBtn = document.getElementById("addOwnerBtn");

const parcelList = document.getElementById("parcelList");

// Loading message element (you said: loadingMessage.textContent = "Loading parcels..."; )
let loadingMessage = document.getElementById("loadingMessage");
// Fallback: create it if missing and append above parcelList
if (!loadingMessage) {
  loadingMessage = document.createElement("p");
  loadingMessage.id = "loadingMessage";
  loadingMessage.classList.add("hidden");
  // try to put it near parcelList
  if (parcelList && parcelList.parentElement) {
    parcelList.parentElement.insertBefore(loadingMessage, parcelList);
  } else {
    document.body.insertBefore(loadingMessage, document.body.firstChild);
  }
}

// Helper: show/hide element (works with .hidden class or style fallback)
function showElement(el, show = true) {
  if (!el) return;
  if (show) {
    el.classList.remove("hidden");
    el.style.display = el.style.display === "none" ? "" : el.style.display;
  } else {
    // prefer using hidden class if available
    if (el.classList.contains("hidden")) {
      // already hidden
    } else {
      el.classList.add("hidden");
    }
    // also set style.display none to be safe
    el.style.display = "none";
  }
}

// Helper: disable/enable node list or single element
function setDisabled(nodes, value = true) {
  if (!nodes) return;
  if (nodes instanceof NodeList || Array.isArray(nodes)) {
    nodes.forEach((n) => {
      if (n) n.disabled = value;
    });
  } else {
    nodes.disabled = value;
  }
}

// ---- Redirect if not logged in ----
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    fetchParcels(user.uid);
  }
});

// ---- Logout ----
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// ===============================
// Navigation Tabs
// ===============================
if (navButtons && sections) {
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const targetId = btn.id.replace("nav-", "section-");
      sections.forEach((s) => s.classList.remove("active"));
      const target = document.getElementById(targetId);
      if (target) target.classList.add("active");
    });
  });
}

// ===============================
// Parcel Search (parcel_number only)
// ===============================
if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    const user = auth.currentUser;
    if (!user) return;

    // Feedback: show loading and disable search controls
    loadingMessage.textContent = query ? `Searching for "${query}"...` : "Loading parcels...";
    showElement(loadingMessage, true);
    setDisabled([searchInput, searchBtn], true);

    try {
      let parcels;
      if (!query) {
        parcels = await fetchParcels(user.uid, { showLoading: false });
      } else {
        const { data, error } = await supabase
          .from("parcels")
          .select("*")
          .eq("user_id", user.uid)
          .ilike("parcel_number", `%${query}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) {
          alert("No results found.");
          renderParcels([]);
        } else {
          renderParcels(data);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Search failed. Check console.");
    } finally {
      setDisabled([searchInput, searchBtn], false);
      showElement(loadingMessage, false);
    }
  });

  // Enter key triggers search
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") searchBtn.click();
  });
}

// ===============================
// Add Parcel Modal
// ===============================
if (addParcelBtn && modal && closeModalBtn) {
  addParcelBtn.addEventListener("click", () => {
    showElement(modal, true);
  });
  closeModalBtn.addEventListener("click", () => {
    showElement(modal, false);
  });
}

// ===============================
// Owner Rows
// ===============================
if (addOwnerBtn && ownersList) {
  addOwnerBtn.addEventListener("click", () => {
    const ownerRow = document.createElement("div");
    ownerRow.classList.add("owner-row");
    ownerRow.innerHTML = `
      <input type="text" placeholder="Full Name" class="ownerName" required>
      <input type="text" placeholder="ID Number" class="ownerID" required>
      <input type="text" placeholder="KRA PIN" class="ownerKRA" required>
      <button type="button" class="deleteOwnerBtn">🗑</button>
    `;
    ownersList.appendChild(ownerRow);
  });

  ownersList.addEventListener("click", (e) => {
    if (e.target.classList && e.target.classList.contains("deleteOwnerBtn")) {
      e.target.parentElement.remove();
    }
  });
}

// ===============================
// Supabase Parcel Functions
// ===============================

// fetchParcels: returns the data (and optionally shows loading)
async function fetchParcels(userId, options = { showLoading: true }) {
  if (!userId) return [];
  const { showLoading } = options;

  try {
    if (showLoading) {
      loadingMessage.textContent = "Loading parcels...";
      showElement(loadingMessage, true);
    }

    // Disable main buttons while loading
    setDisabled([searchInput, searchBtn, addParcelBtn], true);

    const { data, error } = await supabase
      .from("parcels")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching parcels:", error);
      alert("Error fetching parcels. Check console.");
      return [];
    }

    renderParcels(data || []);
    return data || [];
  } catch (err) {
    console.error("fetchParcels error:", err);
    alert("Failed to load parcels. Check console.");
    return [];
  } finally {
    setDisabled([searchInput, searchBtn, addParcelBtn], false);
    showElement(loadingMessage, false);
  }
}

function renderParcels(parcels) {
  if (!parcelList) return;
  parcelList.innerHTML = "";

  if (!parcels || parcels.length === 0) {
    parcelList.innerHTML = `<li class="empty">No parcels found.</li>`;
    return;
  }

  parcels.forEach((parcel) => {
    const li = document.createElement("li");
    li.classList.add("parcel-item");
    // sanitize minimal: parcel fields used directly are from your DB; consider escaping if content is user-provided
    const ownersCount = parcel.owners ? parcel.owners.length : 0;

    li.innerHTML = `
      <div class="parcel-info">
        <strong class="parcel-number">${parcel.parcel_number || "—"}</strong><br>
        <small>${ownersCount} Owner(s)</small>
      </div>
      <div class="parcel-actions">
        <button class="viewBtn" data-id="${parcel.id}">View</button>
        <button class="editBtn" data-id="${parcel.id}">Edit</button>
        <button class="deleteParcelBtn" data-id="${parcel.id}">Delete</button>
      </div>
    `;
    parcelList.appendChild(li);
  });
}

// ===============================
// Save Parcel to Supabase (create)
// ===============================
if (parcelForm) {
  let saving = false;
  parcelForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (saving) return; // prevent double submit
    saving = true;

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in.");
      saving = false;
      return;
    }

    // Basic validation
    const parcelNumberInput = document.getElementById("parcelNumber");
    const parcelNumber = parcelNumberInput ? parcelNumberInput.value.trim() : "";
    if (!parcelNumber) {
      alert("Parcel number is required.");
      saving = false;
      return;
    }

    // owners
    const owners = Array.from(document.querySelectorAll(".owner-row")).map((row) => ({
      name: row.querySelector(".ownerName") ? row.querySelector(".ownerName").value : "",
      id: row.querySelector(".ownerID") ? row.querySelector(".ownerID").value : "",
      kra: row.querySelector(".ownerKRA") ? row.querySelector(".ownerKRA").value : "",
    }));

    const parcelData = {
      user_id: user.uid,
      parcel_number: parcelNumber,
      owners,
      survey_fees: {
        paid: document.getElementById("surveyFees") ? document.getElementById("surveyFees").value : "",
        pending: document.getElementById("surveyPending") ? document.getElementById("surveyPending").value : "",
      },
      board_fees: {
        paid: document.getElementById("boardFees") ? document.getElementById("boardFees").value : "",
        pending: document.getElementById("boardPending") ? document.getElementById("boardPending").value : "",
      },
      title_fees: {
        paid: document.getElementById("titleFees") ? document.getElementById("titleFees").value : "",
        pending: document.getElementById("titlePending") ? document.getElementById("titlePending").value : "",
      },
      survey_date: document.getElementById("surveyDate") ? document.getElementById("surveyDate").value : null,
    };

    try {
      // UI feedback
      loadingMessage.textContent = "Saving parcel...";
      showElement(loadingMessage, true);
      setDisabled([parcelForm.querySelector("button[type='submit']"), addParcelBtn], true);

      // Insert
      const { data, error } = await supabase.from("parcels").insert([parcelData]).select();

      if (error) {
        throw error;
      }

      alert("✅ Parcel saved successfully!");
      parcelForm.reset();
      showElement(modal, false);

      // Refresh list
      await fetchParcels(user.uid);
    } catch (err) {
      console.error("Error saving parcel:", err);
      alert("Error saving parcel: " + (err.message || err));
    } finally {
      saving = false;
      setDisabled([parcelForm.querySelector("button[type='submit']"), addParcelBtn], false);
      showElement(loadingMessage, false);
    }
  });
}

// ===============================
// Delete, View, Edit Handlers (event delegation on parcelList)
// ===============================
if (parcelList) {
  parcelList.addEventListener("click", async (e) => {
    const target = e.target;
    if (!target) return;

    // DELETE
    if (target.classList.contains("deleteParcelBtn")) {
      const id = target.getAttribute("data-id");
      if (!id) return;

      if (!confirm("Delete this parcel? This action cannot be undone.")) return;

      try {
        loadingMessage.textContent = "Deleting parcel...";
        showElement(loadingMessage, true);
        setDisabled([searchInput, searchBtn, addParcelBtn], true);

        const { error } = await supabase.from("parcels").delete().eq("id", id);
        if (error) throw error;

        // refresh
        await fetchParcels(auth.currentUser ? auth.currentUser.uid : null);
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete parcel. Check console.");
      } finally {
        setDisabled([searchInput, searchBtn, addParcelBtn], false);
        showElement(loadingMessage, false);
      }
      return;
    }

    // VIEW (open parcel-view.html?id=...)
    if (target.classList.contains("viewBtn")) {
      const id = target.getAttribute("data-id");
      if (!id) return;
      window.location.href = `parcel-view.html?id=${id}`;
      return;
    }

    // EDIT (open parcel-edit.html?id=...)
    if (target.classList.contains("editBtn")) {
      const id = target.getAttribute("data-id");
      if (!id) return;
      window.location.href = `parcel-edit.html?id=${id}`;
      return;
    }
  });
}

// ===============================
// Misc: small UX improvements
// ===============================
// Prevent accidental form double-submission by disabling Enter on certain fields
document.addEventListener("submit", (e) => {
  // nothing extra here for now; reserved if you want further validation
});

// Optionally fetch fresh data every X minutes (disabled by default)
// setInterval(() => {
//   if (auth.currentUser) fetchParcels(auth.currentUser.uid, { showLoading: false });
// }, 5 * 60 * 1000);

