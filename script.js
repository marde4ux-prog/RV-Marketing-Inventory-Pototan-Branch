
const KEY = "rv_marketing_inventory_v1";

let inventory = JSON.parse(localStorage.getItem(KEY) || "[]");

const $ = id => document.getElementById(id);

function save() {
  localStorage.setItem(KEY, JSON.stringify(inventory));
  render();
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function money(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });
}

function today() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

// NAVIGATION
document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach(b =>
      b.classList.remove("active")
    );

    document.querySelectorAll(".tab").forEach(tab =>
      tab.classList.remove("active")
    );

    btn.classList.add("active");
    $(btn.dataset.tab).classList.add("active");

    render();
  });
});

// STOCK IN
$("stockInForm").addEventListener("submit", e => {
  e.preventDefault();

  const f = new FormData(e.target);
  const serial = f.get("serial").trim();

  if (inventory.some(item =>
    item.serial.toLowerCase() === serial.toLowerCase()
  )) {
    alert("Serial Number already exists!");
    return;
  }

  const item = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    code: f.get("code").trim(),
    supplier: f.get("supplier").trim(),
    chargeIn: f.get("chargeIn").trim(),
    receipt: f.get("receipt").trim(),
    dateIn: f.get("dateIn"),
    brand: f.get("brand").trim(),
    model: f.get("model").trim(),
    serial,
    price: Number(f.get("price")),
    dateOut: "",
    deliveryReceipt: "",
    chargeOut: "",
    customer: "",
    status: "Available",
    history: [{
      type: "Stock IN",
      date: f.get("dateIn")
    }]
  };

  inventory.push(item);
  save();

  e.target.reset();
  alert("Stock IN successfully saved!");

});

// STOCK OUT SELECT
function updateUnitSelect() {
  const available = inventory.filter(i =>
    i.status === "Available"
  );

  $("unitSelect").innerHTML =
    '<option value="">Select Available Unit</option>' +
    available.map(i => `
      <option value="${esc(i.id)}">
        ${esc(i.code)} | ${esc(i.brand)} ${esc(i.model)}
        | SN: ${esc(i.serial)}
      </option>
    `).join("");
}

$("unitSelect").addEventListener("change", () => {
  const item = inventory.find(i =>
    i.id === $("unitSelect").value
  );

  $("selectedDetails").innerHTML = item
    ? `<b>Product:</b> ${esc(item.brand)} ${esc(item.model)}<br>
       <b>Serial:</b> ${esc(item.serial)}<br>
       <b>Product Code:</b> ${esc(item.code)}<br>
       <b>Price:</b> ${money(item.price)}`
    : "";
});

// STOCK OUT
$("stockOutForm").addEventListener("submit", e => {
  e.preventDefault();

  const f = new FormData(e.target);
  const item = inventory.find(i =>
    i.id === f.get("unitId")
  );

  if (!item || item.status !== "Available") {
    alert("This unit is not available!");
    return;
  }

  item.dateOut = f.get("dateOut");
  item.deliveryReceipt = f.get("deliveryReceipt").trim();
  item.chargeOut = f.get("chargeOut").trim();
  item.customer = f.get("customer").trim();
  item.status = "Released";

  item.history.push({
    type: "Stock OUT",
    date: item.dateOut
  });

  save();
  e.target.reset();
  $("selectedDetails").innerHTML = "";

  alert("Stock OUT successfully recorded!");
});

// INVENTORY TABLE
function renderInventory() {
  const search = $("search").value.toLowerCase();
  const status = $("statusFilter").value;

  const filtered = inventory.filter(i => {
    const text = [
      i.code, i.supplier, i.brand, i.model,
      i.serial, i.customer, i.receipt,
      i.chargeIn, i.chargeOut, i.deliveryReceipt
    ].join(" ").toLowerCase();

    return text.includes(search) &&
      (status === "All" || i.status === status);
  });

  $("inventoryTable").innerHTML = filtered.map(i => `
    <tr>
      <td>${esc(i.code)}</td>
      <td>${esc(i.supplier)}</td>
      <td>${esc(i.brand)}</td>
      <td>${esc(i.model)}</td>
      <td>${esc(i.serial)}</td>
      <td>${money(i.price)}</td>
      <td>${esc(i.dateIn)}</td>
      <td>${esc(i.dateOut || "-")}</td>
      <td>${esc(i.customer || "-")}</td>
      <td><span class="status ${i.status}">
        ${i.status}
      </span></td>
      <td>
        <button class="secondary" onclick="viewItem('${esc(i.id)}')">
          VIEW
        </button>
        <button class="danger" onclick="deleteItem('${esc(i.id)}')">
          DELETE
        </button>
      </td>
    </tr>
  `).join("") || `
    <tr><td colspan="11">No inventory records found.</td></tr>
  `;
}

// VIEW RECORD
function viewItem(id) {
  const i = inventory.find(x => x.id === id);
  if (!i) return;

  alert(
    "PRODUCT DETAILS\n\n" +
    "Product Code: " + i.code +
    "\nSupplier: " + i.supplier +
    "\nWarehouse Charge IN: " + i.chargeIn +
    "\nWarehouse Receipt: " + i.receipt +
    "\nDate IN: " + i.dateIn +
    "\nBrand: " + i.brand +
    "\nModel: " + i.model +
    "\nSerial: " + i.serial +
    "\nPrice: " + money(i.price) +
    "\n\nDATE OUT: " + (i.dateOut || "-") +
    "\nDelivery Receipt: " + i.deliveryReceipt +
    "\nWarehouse Charge OUT: " + i.chargeOut +
    "\nCustomer / Branch: " + i.customer +
    "\nStatus: " + i.status
  );
}

// DELETE
function deleteItem(id) {
  if (!confirm("Delete this inventory record?")) return;

  inventory = inventory.filter(i => i.id !== id);
  save();
}

// DASHBOARD
function renderDashboard() {
  const available = inventory.filter(i =>
    i.status === "Available"
  );

  const released = inventory.filter(i =>
    i.status === "Released"
  );

  $("totalUnits").textContent = inventory.length;
  $("available").textContent = available.length;
  $("released").textContent = released.length;

  $("stockValue").textContent = money(
    available.reduce((sum, i) => sum + i.price, 0)
  );

  $("reportIn").textContent = inventory.length;
  $("reportOut").textContent = released.length;
  $("reportAvailable").textContent = available.length;

  const recent = [...inventory].sort((a, b) =>
    (b.dateOut || b.dateIn).localeCompare(a.dateOut || a.dateIn)
  ).slice(0, 10);

  $("recentTable").innerHTML = recent.map(i => `
    <tr>
      <td>${esc(i.dateOut || i.dateIn)}</td>
      <td>${esc(i.code)}</td>
      <td>${esc(i.brand)} ${esc(i.model)}</td>
      <td>${esc(i.serial)}</td>
      <td>${i.status === "Available" ? "Stock IN" : "Stock OUT"}</td>
    </tr>
  `).join("") || `
    <tr><td colspan="5">No transactions yet.</td></tr>
  `;
}

// REPORTS
function printReport() {
  const type = $("reportType").value;

  const rows = inventory.filter(i =>
    type === "All" ||
    (type === "Stock IN" && true) ||
    (type === "Stock OUT" && i.status === "Released")
  );

  const heading = type === "All"
    ? "COMPLETE INVENTORY REPORT"
    : type === "Stock IN"
      ? "STOCK IN REPORT"
      : "STOCK OUT REPORT";

  $("printArea").innerHTML = `
    <h2>RV MARKETING</h2>
    <h3>${heading}</h3>
    <p>Printed: ${new Date().toLocaleString()}</p>

    <table>
      <thead>
        <tr>
          <th>Product Code</th>
          <th>Supplier / Branch</th>
          <th>Brand / Model</th>
          <th>Serial Number</th>
          <th>Price</th>
          <th>Date IN</th>
          <th>Date OUT</th>
          <th>Delivery Receipt</th>
          <th>Charge IN</th>
          <th>Charge OUT</th>
          <th>Customer / Branch</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(i => `
          <tr>
            <td>${esc(i.code)}</td>
            <td>${esc(i.supplier)}</td>
            <td>${esc(i.brand)} ${esc(i.model)}</td>
            <td>${esc(i.serial)}</td>
            <td>${money(i.price)}</td>
            <td>${esc(i.dateIn)}</td>
            <td>${esc(i.dateOut || "-")}</td>
            <td>${esc(i.deliveryReceipt || "-")}</td>
            <td>${esc(i.chargeIn || "-")}</td>
            <td>${esc(i.chargeOut || "-")}</td>
            <td>${esc(i.customer || "-")}</td>
            <td>${esc(i.status)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <p>Total Records: ${rows.length}</p>
    <br><br>
    <p>Prepared by: _____________________</p>
    <p>Checked by: _____________________</p>
    <p>Approved by: ____________________</p>
  `;

  window.print();
}

// EXPORT CSV
function exportCSV() {
  const headers = [
    "Product Code", "Branch/Supplier",
    "Warehouse Charge IN", "Warehouse Receipt",
    "Date Stock IN", "Brand", "Model",
    "Serial Number", "Price per Unit",
    "Date Stock OUT", "Delivery Receipt",
    "Warehouse Charge OUT", "Customer/Branch",
    "Status"
  ];

  const rows = inventory.map(i => [
    i.code, i.supplier, i.chargeIn, i.receipt,
    i.dateIn, i.brand, i.model, i.serial,
    i.price, i.dateOut, i.deliveryReceipt,
    i.chargeOut, i.customer, i.status
  ]);

  const csv = [headers, ...rows].map(row =>
    row.map(value =>
      '"' + String(value ?? "").replace(/"/g, '""') + '"'
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "RV_Marketing_Inventory.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// SEARCH
$("search").addEventListener("input", renderInventory);
$("statusFilter").addEventListener("change", renderInventory);

// MAIN RENDER
function render() {
  renderDashboard();
  renderInventory();
  updateUnitSelect();
}

render();

// DEFAULT DATES
document.querySelectorAll('input[type="date"]').forEach(input => {
  input.value = today();
});