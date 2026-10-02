const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

/* ============================================================
 * الـ API
 * القراءة : GET  ?action=models | payments | summary
 * الكتابة : GET ?action=addModel&token=...&date=...  (أو POST بـ JSON)
 *   addModel / updateModel / deleteModel
 *   addPayment / updatePayment / deletePayment
 *
 * الـ token (اختياري لكن مُوصى به):
 *   Project Settings → Script properties → API_TOKEN
 * ============================================================ */

const WRITE_ACTIONS = [
  "addModel",
  "updateModel",
  "deleteModel",
  "addPayment",
  "updatePayment",
  "deletePayment",
  "addSettlement",
  "deleteSettlement",
];

function doGet(e) {
  const action = e.parameter.action;

  if (action === "models") {
    return getModels();
  }

  if (action === "payments") {
    return getPayments();
  }

  if (action === "summary") {
    return getSummary();
  }

  if (action === "settlements") {
    return jsonResponse(readRows("Settlements"));
  }

  // طلب واحد بيجيب كل البيانات (أسرع من 3 طلبات منفصلة)
  if (action === "all") {
    return jsonResponse({
      models: readRows("Models"),
      payments: readRows("Payments"),
      settlements: readRows("Settlements"),
    });
  }

  // الكتابة: بتتقبل بس لو الـ token صح (شوفي handleWrite).
  // بنستخدم GET لأن رد الـ POST في Apps Script بيوصل غلط للمتصفح عندنا.
  if (WRITE_ACTIONS.indexOf(action) !== -1) {
    return handleWrite(e.parameter);
  }

  return jsonResponse({
    success: false,
    message: "Invalid action",
  });
}

/* ---------------------------------------------------------- القراءة */

function getModels() {
  return jsonResponse(readRows("Models"));
}

function getPayments() {
  return jsonResponse(readRows("Payments"));
}

function getSummary() {
  const models = readRows("Models");
  const payments = readRows("Payments");

  const totalWork = models.reduce(
    (sum, model) => sum + Number(model.totalPrice || 0),
    0
  );

  const totalPayments = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const balance = totalWork - totalPayments;

  return jsonResponse({
    totalWork,
    totalPayments,
    balance,
    totalPieces: models.reduce(
      (sum, model) => sum + Number(model.quantity || 0),
      0
    ),
    totalFabricCm: models.reduce(
      (sum, model) => sum + Number(model.totalFabricCm || 0),
      0
    ),
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------------------------------------------------- الكتابة */

function doPost(e) {
  try {
    return handleWrite(JSON.parse(e.postData.contents));
  } catch (error) {
    return jsonResponse({ success: false, message: String(error) });
  }
}

// منطق الكتابة المشترك (GET و POST): token + lock + تنفيذ الـ action
function handleWrite(body) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    // لو API_TOKEN متضبط في Script properties لازم يطابق اللي جاي من التطبيق
    const expected = PropertiesService
      .getScriptProperties()
      .getProperty("API_TOKEN");

    if (expected && body.token !== expected) {
      return jsonResponse({ success: false, message: "Unauthorized" });
    }

    switch (body.action) {
      case "addModel":
        return addModel(body);
      case "updateModel":
        return updateModel(body);
      case "deleteModel":
        return deleteRow("Models", body.id);
      case "addPayment":
        return addPayment(body);
      case "updatePayment":
        return updatePayment(body);
      case "deletePayment":
        return deleteRow("Payments", body.id);
      case "addSettlement":
        return addSettlement(body);
      case "deleteSettlement":
        return deleteRow("Settlements", body.id);
      default:
        return jsonResponse({ success: false, message: "Invalid action" });
    }
  } catch (error) {
    return jsonResponse({ success: false, message: String(error) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------------------------------------------------------- Models */

// تحقق + حسابات الإجماليات (مكان واحد للإضافة والتعديل)
function buildModel(data) {
  const modelName = String(data.modelName || "").trim();
  const date = String(data.date || "").slice(0, 10);
  const quantity = Number(data.quantity);
  const pricePerPiece = Number(data.pricePerPiece);
  const fabricCm = Number(data.fabricCm);

  if (
    !modelName ||
    !date ||
    !(quantity > 0) ||
    !(pricePerPiece > 0) ||
    !(fabricCm > 0)
  ) {
    return null;
  }

  return {
    date,
    modelName,
    quantity,
    pricePerPiece,
    fabricCm,
    totalPrice: quantity * pricePerPiece,
    totalFabricCm: quantity * fabricCm,
  };
}

function addModel(data) {
  const fields = buildModel(data);

  if (!fields) {
    return jsonResponse({
      success: false,
      message: "Missing or invalid model data",
    });
  }

  const model = Object.assign({ id: `M-${Date.now()}` }, fields);

  appendRowByHeaders("Models", model);

  return jsonResponse({ success: true, data: model });
}

function updateModel(data) {
  const fields = buildModel(data);

  if (!fields) {
    return jsonResponse({
      success: false,
      message: "Missing or invalid model data",
    });
  }

  const model = Object.assign({ id: data.id }, fields);

  if (!updateRowById("Models", model)) {
    return jsonResponse({ success: false, message: "Model not found" });
  }

  return jsonResponse({ success: true, data: model });
}

/* ---------------------------------------------------------- Payments */

function buildPayment(data) {
  const amount = Number(data.amount);
  const date = String(data.date || "").slice(0, 10);
  const notes = String(data.notes || "").trim();

  if (!date || !(amount > 0)) {
    return null;
  }

  return { date, amount, notes };
}

function addPayment(data) {
  const fields = buildPayment(data);

  if (!fields) {
    return jsonResponse({
      success: false,
      message: "Missing or invalid payment data",
    });
  }

  const payment = Object.assign({ id: `P-${Date.now()}` }, fields);

  appendRowByHeaders("Payments", payment);

  return jsonResponse({ success: true, data: payment });
}

function updatePayment(data) {
  const fields = buildPayment(data);

  if (!fields) {
    return jsonResponse({
      success: false,
      message: "Missing or invalid payment data",
    });
  }

  const payment = Object.assign({ id: data.id }, fields);

  if (!updateRowById("Payments", payment)) {
    return jsonResponse({ success: false, message: "Payment not found" });
  }

  return jsonResponse({ success: true, data: payment });
}

/* ---------------------------------------------------------- Settlements */

// تسوية = "الحساب اتقفل لحد التاريخ ده"، والتطبيق بيبدأ يحسب من اليوم اللي بعده
function addSettlement(data) {
  const date = String(data.date || "").slice(0, 10);
  const notes = String(data.notes || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonResponse({
      success: false,
      message: "Missing or invalid settlement date",
    });
  }

  const settlement = { id: `S-${Date.now()}`, date, notes };

  appendRowByHeaders("Settlements", settlement);

  return jsonResponse({ success: true, data: settlement });
}

/* ---------------------------------------------------------- Helpers */

// شيت التسويات بيتعمل لوحده أول مرة لو مش موجود
const SHEET_HEADERS = {
  Settlements: ["id", "date", "notes"],
};

// بنفتح الشيت وبنجيب التوقيت مرة واحدة بس في كل طلب (كانت بتتكرر مع كل صف)
let cachedSpreadsheet = null;
let cachedTimeZone = null;

function getSpreadsheet() {
  if (!cachedSpreadsheet) {
    cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return cachedSpreadsheet;
}

function getTimeZone() {
  if (!cachedTimeZone) {
    cachedTimeZone = getSpreadsheet().getSpreadsheetTimeZone();
  }
  return cachedTimeZone;
}

// الشيت عندك أسماء أعمدته (ID, Model, TotalFabric...) مختلفة عن اللي التطبيق بيفهمه،
// فبنترجمها هنا. الحروف الكبيرة والصغيرة والمسافات مابتفرقش.
const HEADER_ALIASES = {
  id: "id",
  date: "date",
  model: "modelName",
  modelname: "modelName",
  quantity: "quantity",
  priceperpiece: "pricePerPiece",
  fabriccm: "fabricCm",
  totalprice: "totalPrice",
  totalfabric: "totalFabricCm",
  totalfabriccm: "totalFabricCm",
  amount: "amount",
  notes: "notes",
};

function canonicalHeader(header) {
  const key = String(header).toLowerCase().replace(/[^a-z]/g, "");
  return HEADER_ALIASES[key] || String(header);
}

function getHeaders(sheet) {
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(canonicalHeader);
}

function getSheet(name) {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet && SHEET_HEADERS[name]) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(SHEET_HEADERS[name]);
  }

  return sheet;
}

// الشيت بيحول التواريخ لـ Date، و JSON.stringify بيحولها UTC،
// وده بيطلّع التاريخ يوم قبل (توقيت مصر +2/+3). فبنرجّعها yyyy-MM-dd بتوقيت الشيت.
function normalizeValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, getTimeZone(), "yyyy-MM-dd");
  }

  return value;
}

function readRows(name) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return [];
  }

  const headers = data[0].map(canonicalHeader);
  const rows = data.slice(1);

  return rows
    .filter(row => row[0] !== "")
    .map(row => {
      const item = {};

      headers.forEach((header, index) => {
        item[header] = normalizeValue(row[index]);
      });

      return item;
    });
}

// بنكتب حسب أسماء الأعمدة في الصف الأول، فترتيب الأعمدة مايفرقش
function rowFromHeaders(headers, item) {
  return headers.map(header =>
    item[header] === undefined ? "" : item[header]
  );
}

function appendRowByHeaders(name, item) {
  const sheet = getSheet(name);
  const headers = getHeaders(sheet);

  sheet.appendRow(rowFromHeaders(headers, item));
}

// بندوّر على الصف بالـ id (مش برقم الصف) عشان الحذف مايبوظش الباقي
function findRowById(sheet, id) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2 || !id) {
    return -1;
  }

  const headers = getHeaders(sheet);
  const idColumn = headers.indexOf("id") + 1;

  if (idColumn === 0) {
    return -1;
  }

  const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();

  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      return i + 2;
    }
  }

  return -1;
}

function updateRowById(name, item) {
  const sheet = getSheet(name);
  const rowNumber = findRowById(sheet, item.id);

  if (rowNumber === -1) {
    return false;
  }

  const headers = getHeaders(sheet);

  sheet
    .getRange(rowNumber, 1, 1, headers.length)
    .setValues([rowFromHeaders(headers, item)]);

  return true;
}

function deleteRow(name, id) {
  const sheet = getSheet(name);
  const rowNumber = findRowById(sheet, id);

  if (rowNumber === -1) {
    return jsonResponse({ success: false, message: "Record not found" });
  }

  sheet.deleteRow(rowNumber);

  return jsonResponse({ success: true, data: { id } });
}
