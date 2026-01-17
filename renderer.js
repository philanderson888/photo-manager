const { ipcRenderer } = require('electron');
const exifr = require('exifr');
const fs = require('fs');

let currentDirectory = '';
let photos = [];

async function init() {
  const savedPath = localStorage.getItem('lastUsedPath');

  if (savedPath && fs.existsSync(savedPath)) {
    currentDirectory = savedPath;
  } else {
    currentDirectory = await ipcRenderer.invoke('get-current-directory');
  }

  document.getElementById('currentPath').textContent = currentDirectory;
  await loadPhotos();

  document.getElementById('selectFolderBtn').addEventListener('click', async () => {
    const newPath = await ipcRenderer.invoke('select-directory');
    if (newPath) {
      currentDirectory = newPath;
      localStorage.setItem('lastUsedPath', currentDirectory);
      document.getElementById('currentPath').textContent = currentDirectory;
      await loadPhotos();
    }
  });

  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadPhotos();
  });

  document.getElementById('closeDetailBtn').addEventListener('click', () => {
    document.getElementById('detailPanel').classList.add('hidden');
  });

  document.getElementById('updateDateBtn').addEventListener('click', async () => {
    await handleUpdateExif();
  });
}

let currentPhotoIndex = -1;

async function loadPhotos() {
  const photoGrid = document.getElementById('photoGrid');
  photoGrid.innerHTML = '<div class="loading">Loading photos...</div>';

  try {
    const files = await ipcRenderer.invoke('read-directory', currentDirectory);
    photos = [];

    for (const file of files) {
      try {
        const exifData = await exifr.parse(file.path);
        photos.push({
          ...file,
          exif: exifData || {}
        });
      } catch (err) {
        photos.push({
          ...file,
          exif: {}
        });
      }
    }

    displayPhotos();
  } catch (err) {
    photoGrid.innerHTML = `<div class="error">Error loading photos: ${err.message}</div>`;
  }
}

function displayPhotos() {
  const photoGrid = document.getElementById('photoGrid');
  const photoCount = document.getElementById('photoCount');

  if (photos.length === 0) {
    photoGrid.innerHTML = '<div class="no-photos">No photos found in this directory</div>';
    photoCount.textContent = '';
    return;
  }

  photoCount.textContent = `${photos.length} photo${photos.length !== 1 ? 's' : ''} found`;

  photoGrid.innerHTML = '';

  photos.forEach((photo, index) => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.onclick = () => showPhotoDetail(index);

    const img = document.createElement('img');
    img.src = photo.path;
    img.alt = photo.name;
    img.onerror = () => {
      img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Error</text></svg>';
    };

    const info = document.createElement('div');
    info.className = 'photo-info';

    const name = document.createElement('div');
    name.className = 'photo-name';
    name.textContent = photo.name;
    name.title = photo.name;

    const dateTaken = document.createElement('div');
    dateTaken.className = 'photo-date';
    if (photo.exif.DateTimeOriginal) {
      dateTaken.textContent = formatDate(photo.exif.DateTimeOriginal);
    } else if (photo.exif.DateTime) {
      dateTaken.textContent = formatDate(photo.exif.DateTime);
    } else {
      dateTaken.textContent = 'Date unknown';
    }

    const title = document.createElement('div');
    title.className = 'photo-title';
    if (photo.exif.ImageDescription || photo.exif.XPTitle) {
      title.textContent = photo.exif.ImageDescription || photo.exif.XPTitle;
    }

    info.appendChild(name);
    info.appendChild(dateTaken);
    if (title.textContent) {
      info.appendChild(title);
    }

    card.appendChild(img);
    card.appendChild(info);
    photoGrid.appendChild(card);
  });
}

function showPhotoDetail(index) {
  currentPhotoIndex = index;
  const photo = photos[index];
  const panel = document.getElementById('detailPanel');

  document.getElementById('detailImage').src = photo.path;

  const filenameElement = document.getElementById('detailFilename');
  filenameElement.textContent = photo.name;
  filenameElement.className = '';

  const dateTaken = photo.exif.DateTimeOriginal || photo.exif.DateTime;
  const dateTakenElement = document.getElementById('detailDateTaken');
  dateTakenElement.textContent = dateTaken ? formatDate(dateTaken) : 'Not available';
  dateTakenElement.className = '';

  const filenameYYYYMM = extractYYYYMMFromFilename(photo.name);

  if (!dateTaken) {
    dateTakenElement.classList.add('missing-data');
  }

  if (!filenameYYYYMM) {
    filenameElement.classList.add('date-mismatch');
  } else if (dateTaken) {
    const dateTakenYYYYMM = getYYYYMMFromDate(dateTaken);
    if (filenameYYYYMM !== dateTakenYYYYMM) {
      dateTakenElement.classList.add('date-mismatch');
    }
  }

  document.getElementById('detailDateCreated').textContent = formatDate(photo.birthtime);
  document.getElementById('detailDateModified').textContent = formatDate(photo.mtime);

  const title = photo.exif.ImageDescription || photo.exif.XPTitle || 'Not available';
  document.getElementById('detailTitle').textContent = title;

  const camera = [];
  if (photo.exif.Make) camera.push(photo.exif.Make);
  if (photo.exif.Model) camera.push(photo.exif.Model);
  document.getElementById('detailCamera').textContent = camera.length > 0 ? camera.join(' ') : 'Not available';

  const dimensions = (photo.exif.ImageWidth && photo.exif.ImageHeight)
    ? `${photo.exif.ImageWidth} × ${photo.exif.ImageHeight}`
    : 'Not available';
  document.getElementById('detailDimensions').textContent = dimensions;

  document.getElementById('detailSize').textContent = formatFileSize(photo.size);

  const dateInput = document.getElementById('newDateInput');
  if (dateTaken) {
    const d = new Date(dateTaken);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  } else {
    dateInput.value = '';
  }

  const updateStatus = document.getElementById('updateStatus');
  updateStatus.className = 'update-status';
  updateStatus.textContent = '';

  panel.classList.remove('hidden');
}

function extractYYYYMMFromFilename(filename) {
  const match = filename.match(/^(\d{6})/);
  if (!match) return null;

  const yyyymm = match[1];
  const year = parseInt(yyyymm.substring(0, 4));
  const month = parseInt(yyyymm.substring(4, 6));

  if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
    return yyyymm;
  }

  return null;
}

function getYYYYMMFromDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');

  return `${year}${month}`;
}

function formatDate(date) {
  if (!date) return 'Not available';

  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function handleUpdateExif() {
  if (currentPhotoIndex < 0) return;

  const photo = photos[currentPhotoIndex];
  const dateInput = document.getElementById('newDateInput');
  const updateBtn = document.getElementById('updateDateBtn');
  const statusDiv = document.getElementById('updateStatus');
  const dateSource = document.querySelector('input[name="dateSource"]:checked').value;

  let dateParameter;

  if (dateSource === 'manual') {
    if (!dateInput.value) {
      statusDiv.className = 'update-status error';
      statusDiv.textContent = 'Please select a date and time';
      return;
    }

    const selectedDate = new Date(dateInput.value);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    const seconds = String(selectedDate.getSeconds()).padStart(2, '0');

    dateParameter = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } else {
    dateParameter = dateSource;
  }

  statusDiv.className = 'update-status loading';
  statusDiv.textContent = 'Updating EXIF data using Rust...';
  updateBtn.disabled = true;

  try {
    const result = await ipcRenderer.invoke('update-exif-rust', photo.path, dateParameter);

    statusDiv.className = 'update-status success';
    statusDiv.textContent = 'EXIF date updated successfully! Refreshing...';

    setTimeout(async () => {
      await loadPhotos();
      showPhotoDetail(currentPhotoIndex);
      statusDiv.className = 'update-status success';
      statusDiv.textContent = 'Update complete!';
    }, 1000);

  } catch (error) {
    statusDiv.className = 'update-status error';
    statusDiv.textContent = `Error: ${error.error || error.message || 'Unknown error'}`;
  } finally {
    updateBtn.disabled = false;
  }
}

init();
