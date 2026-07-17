// =========================================================
// CONFIGURATION — change BUCKET_NAME and REGION to your own
// =========================================================
const BUCKET_NAME = "image-resizer-bucket-2026"; // e.g. "my-image-resizer-bucket-123"
const REGION = "ap-south-1";           // e.g. "ap-south-1"
const BUCKET_URL = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com`;

const MAX_FILE_SIZE_MB = 100;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000; // stop polling after 60s (Lambda failure safeguard)

// =========================================================
// DOM references (declared ONCE, here only)
// =========================================================
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const errorBox = document.getElementById("errorBox");
const spinner = document.getElementById("spinner");
const successBox = document.getElementById("successBox");
const previewSection = document.getElementById("previewSection");
const originalImage = document.getElementById("originalImage");
const resizedImage = document.getElementById("resizedImage");
const downloadBtn = document.getElementById("downloadBtn");

let isUploading = false; // guards against duplicate uploads

// =========================================================
// UI helper functions
// =========================================================
function resetUI() {
  hide(errorBox);
  hide(successBox);
  hide(spinner);
  hide(previewSection);
  hide(progressContainer);
  progressFill.style.width = "0%";
  progressLabel.textContent = "Uploading... 0%";
}

function showError(message) {
  errorBox.textContent = "⚠️ " + message;
  show(errorBox);
  hide(spinner);
  hide(progressContainer);
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

// =========================================================
// Download button — fetch as blob so it downloads instead of
// opening in a new tab (native `download` attr is ignored
// cross-origin, e.g. website on s3-website vs image on s3.*)
// =========================================================
downloadBtn.addEventListener("click", async (e) => {
  e.preventDefault(); // stop default <a> navigation/open behavior
  const url = downloadBtn.dataset.resizedUrl;
  if (!url) return;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const tempLink = document.createElement("a");
    tempLink.href = blobUrl;
    tempLink.download = "resized-image.jpg";
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    showError("Could not download the image. Please try again.");
  }
});

// =========================================================
// Drag & Drop + Click-to-browse wiring
// =========================================================
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// =========================================================
// Main flow: validate -> upload -> poll -> display
// =========================================================
function handleFile(file) {
  if (isUploading) {
    showError("An upload is already in progress. Please wait.");
    return; // prevents duplicate/overlapping uploads
  }

  resetUI();

  // ---- Empty upload guard ----
  if (!file || file.size === 0) {
    showError("The selected file is empty. Please choose a valid image.");
    return;
  }

  // ---- Wrong file type guard ----
  if (!ALLOWED_TYPES.includes(file.type)) {
    showError("Unsupported file type. Please upload a PNG, JPG, or WEBP image.");
    return;
  }

  // ---- Large image guard ----
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    showError(`Image is too large (${sizeMB.toFixed(1)}MB). Max allowed is ${MAX_FILE_SIZE_MB}MB.`);
    return;
  }

  uploadFile(file);
}

function uploadFile(file) {
  isUploading = true;
  show(progressContainer);

  // Unique key so repeated uploads of the same filename don't collide
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const key = `${Date.now()}-${safeName}`;
  const uploadUrl = `${BUCKET_URL}/uploads/${key}`;
  const resizedUrl = `${BUCKET_URL}/resized/${key}`;

  // Show the original image immediately using a local preview (no network needed)
  const localPreviewUrl = URL.createObjectURL(file);

  const xhr = new XMLHttpRequest();
  xhr.open("PUT", uploadUrl, true);
  xhr.setRequestHeader("Content-Type", file.type);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      progressFill.style.width = percent + "%";
      progressLabel.textContent = `Uploading... ${percent}%`;
    }
  };

  xhr.onload = () => {
    isUploading = false;
    if (xhr.status === 200 || xhr.status === 204) {
      hide(progressContainer);
      originalImage.src = localPreviewUrl;
      show(spinner);
      pollForResizedImage(resizedUrl, localPreviewUrl);
    } else {
      showError(`Upload failed (HTTP ${xhr.status}). Check your bucket policy/CORS settings.`);
    }
  };

  xhr.onerror = () => {
    isUploading = false;
    showError("Network error during upload. Check your internet connection and try again.");
  };

  xhr.send(file);
}

// =========================================================
// Poll S3 until Lambda has created the resized/ version
// =========================================================
function pollForResizedImage(resizedUrl, localPreviewUrl) {
  const startTime = Date.now();

  const interval = setInterval(async () => {
    if (Date.now() - startTime > POLL_TIMEOUT_MS) {
      clearInterval(interval);
      hide(spinner);
      showError("Resizing is taking longer than expected. The Lambda function may have failed — check CloudWatch logs.");
      return;
    }

    try {
      // Cache-bust so we don't get a stale 404 cached by the browser
      const response = await fetch(resizedUrl + "?t=" + Date.now(), { method: "HEAD" });
      if (response.ok) {
        clearInterval(interval);
        hide(spinner);
        showSuccess(resizedUrl, localPreviewUrl);
      }
      // if 403/404, keep polling — the object simply isn't there yet
    } catch (err) {
      // Network hiccup during polling — keep trying until timeout
      console.warn("Polling error, retrying...", err);
    }
  }, POLL_INTERVAL_MS);
}

function showSuccess(resizedUrl, localPreviewUrl) {
  originalImage.src = localPreviewUrl;
  resizedImage.src = resizedUrl + "?t=" + Date.now();
  downloadBtn.dataset.resizedUrl = resizedUrl; // store URL for the click handler above
  downloadBtn.removeAttribute("href");          // prevent default <a> navigation
  show(downloadBtn);
  show(previewSection);
  show(successBox);
}