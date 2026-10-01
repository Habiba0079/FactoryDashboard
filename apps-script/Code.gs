/**
 * Factory Accounts — Google Apps Script backend
 *
 * القراءة : GET  ?action=models | payments | summary
 * الكتابة : POST (JSON كنص) { action, token, ...data }
 *           addModel / updateModel / deleteModel
 *           addPayment / updatePayment / deletePayment
 *
 * إعداد الـ token: Project Settings → Script properties → API_TOKEN
 * بعد أي تعديل: Deploy → Manage deployments → New version.
 */

const MODEL_HEADERS = ["id", "date", "modelName", "quantity", "pricePerPiece", "fabricCm", "totalPrice", "totalFabricCm"];
const PAYMENT_HEADERS = ["id", "date", "amount", "notes"];

// لو السكريبت مش مربوط بالشيت (standalone) استبدلها بـ SpreadsheetApp.openById("ID")
function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------- GET
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === "models") return json_(readRows_("Models", MODEL_HEADERS));
    if (action === "payments") return json_(readRows_("Payments", PAYMENT_HEADERS));
    if (action === "summary") return json_(getSummary_());
    return json_({ success: false, message: "Unknown action" });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

// ---------------------------------------------------------------- POST
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const body = JSON.parse(e.postData.contents);

    const expected = PropertiesService.getScriptProperties().getProperty("API_TOKEN");
    if (expected && body.token !== expected) {
      return json_({ success: false, message: "Unauthorized" });
    }

    switch (body.action) {
      case "addModel": return json_({ success: true, data: addModel_(body) });
      case "updateModel": return json_({ success: true, data: updateModel_(body) });
      case "deleteModel": return json_({ success: true, data: deleteRow_("Models", body.id) });
      case "addPayment": return json_({ success: true, data: addPayment_(body) });
      case "updatePayment": return json_({ success: true, data: updatePayment_(body) });
      case "deletePayment": return json_({ success: true, data: deleteRow_("Payments", body.id) });
      default: return json_({ success: false, message: "Unknown action" });
    }
  } catch (err) {
    return json_({ success: false, message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- Models
function cleanModel_(d) {
  const quantity = Number(d.quantity);
  const pricePerPiece = Number(d.pricePerPiece);
  const fabricCm = Number(d.fabricCm);
  if (!d.date) throw new Error("التاريخ مطلوب");
  if (!String(d.modelName || "").trim()) throw new Error("اسم الموديل مطلوب");
  if (!(quantity > 0)) throw new Error("عدد القطع لازم يكون أكبر من 0");
  if (!(pricePerPiece > 0)) throw new Error("سعر القطعة لازم يكون أكبر من 0");
  if (!(fabricCm > 0)) throw new Error("المتراج لازم يكون أكبر من 0");
  return {
    date: String(d.date).slice(0, 10),
    modelName: String(d.modelName).trim(),
    quantity: quantity,
    pricePerPiece: pricePerPiece,
    fabricCm: fabricCm,
    totalPrice: quantity * pricePerPiece,
    totalFabricCm: quantity * fabricCm,
  };
}

function addModel_(d) {
  const model = Object.assign({ id: Utilities.getUuid() }, cleanModel_(d));
  appendRow_("Models", MODEL_HEADERS, model);
  return model;
}

function updateModel_(d) {
  const model = Object.assign({ id: d.id }, cleanModel_(d));
  replaceRow_("Models", MODEL_HEADERS, model);
  return model;
}

// ---------------------------------------------------------------- Payments
function cleanPayment_(d) {
  const amount = Number(d.amount);
  if (!d.date) throw new Error("التاريخ مطلوب");
  if (!(amount > 0)) throw new Error("قيمة الدفعة لازم تكون أكبر من 0");
  return { date: String(d.date).slice(0, 10), amount: amount, notes: String(d.notes || "").trim() };
}

function addPayment_(d) {
  const payment = Object.assign({ id: Utilities.getUuid() }, cleanPayment_(d));
  appendRow_("Payments", PAYMENT_HEADERS, payment);
  return payment;
}

function updatePayment_(d) {
  const payment = Object.assign({ id: d.id }, cleanPayment_(d));
  replaceRow_("Payments", PAYMENT_HEADERS, payment);
  return payment;
}

// ---------------------------------------------------------------- Summary
function getSummary_() {
  const models = readRows_("Models", MODEL_HEADERS);
  const payments = readRows_("Payments", PAYMENT_HEADERS);
  const sum = function (rows, key) {
    return rows.reduce(function (t, r) { return t + Number(r[key] || 0); }, 0);
  };
  const totalWork = sum(models, "totalPrice");
  const totalPayments = sum(payments, "amount");
  return {
    totalWork: totalWork,
    totalPayments: totalPayments,
    balance: totalWork - totalPayments,
    totalPieces: sum(models, "quantity"),
    totalFabricCm: sum(models, "totalFabricCm"),
  };
}

// ---------------------------------------------------------------- Sheet helpers
function sheet_(name) {
  const s = getSpreadsheet_().getSheetByName(name);
  if (!s) throw new Error("Sheet not found: " + name);
  return s;
}

function normalize_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return value;
}

function readRows_(name, headers) {
  const s = sheet_(name);
  const last = s.getLastRow();
  if (last < 2) return [];
  const values = s.getRange(2, 1, last - 1, headers.length).getValues();
  return values
    .filter(function (row) { return row[0] !== ""; })
    .map(function (row) {
      const obj = {};
      headers.forEach(function (h, i) { obj[h] = normalize_(row[i]); });
      return obj;
    });
}

function toRow_(headers, obj) {
  return headers.map(function (h) { return obj[h] === undefined ? "" : obj[h]; });
}

function appendRow_(name, headers, obj) {
  sheet_(name).appendRow(toRow_(headers, obj));
}

// بندوّر على الصف بالـ id (مش برقم الصف) عشان الحذف مايبوظش الترتيب
function findRow_(s, id) {
  const last = s.getLastRow();
  if (last < 2 || !id) return -1;
  const ids = s.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function replaceRow_(name, headers, obj) {
  const s = sheet_(name);
  const row = findRow_(s, obj.id);
  if (row === -1) throw new Error("السجل غير موجود");
  s.getRange(row, 1, 1, headers.length).setValues([toRow_(headers, obj)]);
}

function deleteRow_(name, id) {
  const s = sheet_(name);
  const row = findRow_(s, id);
  if (row === -1) throw new Error("السجل غير موجود");
  s.deleteRow(row);
  return { id: id };
}
