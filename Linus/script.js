// Simule une arborescence de fichiers
const fileSystem = {
  home: {
    type: "folder",
    name: "Dossier personnel",
    children: {
      "notes.txt": {
        type: "file",
        name: "notes.txt",
        content: "Voici quelques notes personnelles...\n\n- Faire le site du bureau Linux\n- Apprendre JavaScript\n- Tester l'interface"
      },
      "Projets": {
        type: "folder",
        name: "Projets",
        children: {
          "site-bureau-linux.txt": {
            type: "file",
            name: "site-bureau-linux.txt",
            content: "Description du projet :\nUn bureau Linux simulé en HTML, CSS, JavaScript."
          }
        }
      }
    }
  },
  document1: {
    type: "folder",
    name: "Documents",
    children: {
      "CV.pdf": {
        type: "file",
        name: "sladojevic_thomas_CV.pdf",
        path: "contenu/sladojevic_thomas_CV.pdf",
        content: "sladojevic_thomas_CV.pdf"
      },
      "": {
        type: "file",
        name: "sladojevic_thomas.pdf",
        path: "contenu/sladojevic_thomas.pdf",
        content: "sladojevic_thomas.pdf"
      }
    }
  },
  document2: {
    type: "folder",
    name: "Documents",
    children: {
      "Rapport.docx": {
        type: "file",
        name: "Rapport.docx",
        content: "Rapport de test.\nLe vrai fichier serait un doc, ici c'est juste du texte."
      }
    }
  },
  pictures: {
    type: "folder",
    name: "Images",
    children: {
      "vacances": {
        type: "folder",
        name: "vacances",
        children: {
          "plage.png": {
            type: "file",
            name: "plage.png",
            content: "(Image plage simulée - ici juste du texte)."
          }
        }
      }
    }
  }
};

let zIndexCounter = 10;
let windowIdCounter = 1;
let suggestionTimer = null;
let currentSuggestionData = null;

// Utilitaires pour parcourir les fichiers
function findItemInFolderByName(folder, name) {
  return Object.values(folder.children).find(child => child.name === name);
}

function getFolderAndChildrenFromPath(pathArr) {
  let folder = fileSystem[pathArr[0]];
  if (!folder || folder.type !== "folder") return null;
  for (let i = 1; i < pathArr.length - 1; i++) {
    folder = folder.children[pathArr[i]];
    if (!folder || folder.type !== "folder") return null;
  }
  const lastName = pathArr[pathArr.length - 1];
  return { folder, lastName };
}

function getNextFileInFolder(folder, currentFile) {
  const items = Object.values(folder.children).filter(c => c.type === "file");
  if (!items.length) return null;
  const idx = items.indexOf(currentFile);
  if (idx === -1) return items[0];
  return items[(idx + 1) % items.length];
}

function getNextFolder(currentFolderKey) {
  const keys = Object.keys(fileSystem);
  const idx = keys.indexOf(currentFolderKey);
  if (idx === -1) return fileSystem[keys[0]];
  return fileSystem[keys[(idx + 1) % keys.length]];
}

// Gestion de l'horloge
function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();
  const options = {
    hour: "2-digit",
    minute: "2-digit"
  };
  clock.textContent = now.toLocaleDateString("fr-FR") + " " + now.toLocaleTimeString("fr-FR", options);
}
setInterval(updateClock, 1000);
updateClock();

// Gestion des icônes du bureau
document.querySelectorAll(".icon").forEach(icon => {
  icon.addEventListener("dblclick", () => {
    const target = icon.getAttribute("data-target");
    openApp(target);
  });
});

// Ouvre l'application appropriée
function openApp(target) {
  if (target === "terminal") {
    createTerminalWindow();
  } else {
    const fsItem = fileSystem[target];
    if (fsItem && fsItem.type === "folder") {
      createFileManagerWindow(fsItem, [target]);
    }
  }
}

// Création d'une fenêtre générique
function createWindow(title) {
  const win = document.createElement("div");
  win.className = "window";
  win.dataset.id = "win-" + windowIdCounter++;

  win.style.zIndex = ++zIndexCounter;

  const header = document.createElement("div");
  header.className = "window-header";

  const titleEl = document.createElement("div");
  titleEl.className = "window-title";
  titleEl.textContent = title;

  const buttons = document.createElement("div");
  buttons.className = "window-buttons";

  const btnClose = document.createElement("div");
  btnClose.className = "win-btn win-close";
  const btnMax = document.createElement("div");
  btnMax.className = "win-btn win-max";
  const btnMin = document.createElement("div");
  btnMin.className = "win-btn win-min";

  buttons.appendChild(btnMin);
  buttons.appendChild(btnMax);
  buttons.appendChild(btnClose);

  header.appendChild(titleEl);
  header.appendChild(buttons);

  const body = document.createElement("div");
  body.className = "window-body";

  win.appendChild(header);
  win.appendChild(body);

  document.getElementById("windows-container").appendChild(win);

  makeWindowDraggable(win, header);
  setupWindowControls(win, btnClose, btnMin, btnMax);
  addToTaskbar(win, title);

  win.addEventListener("mousedown", () => {
    win.style.zIndex = ++zIndexCounter;
    setActiveTaskbarItem(win.dataset.id);
  });

  return { win, body, titleEl };
}

// Fenêtre explorateur de fichiers
function createFileManagerWindow(folder, pathArr) {
  const pathString = "/" + pathArr.join("/");
  const { win, body, titleEl } = createWindow("Fichiers - " + pathString);

  renderFolderContent(body, folder, pathArr);

  body.dataset.path = JSON.stringify(pathArr);
  body.dataset.type = "file-manager";

  const backInfo = document.createElement("div");
  backInfo.style.fontSize = "11px";
  backInfo.style.marginBottom = "6px";
  backInfo.textContent = "Double-clique sur un dossier ou un fichier. (Dossier: ouvre un sous-dossier, Fichier: affiche le contenu)";
  body.prepend(backInfo);
}

function renderFolderContent(container, folder, pathArr) {
  container.innerHTML = "";

  const pathBar = document.createElement("div");
  pathBar.style.fontSize = "12px";
  pathBar.style.marginBottom = "6px";
  pathBar.textContent = "Chemin: /" + pathArr.join("/");
  container.appendChild(pathBar);

  const list = document.createElement("div");
  list.className = "file-list";

  const parentPath = pathArr.slice(0, -1);

  if (parentPath.length) {
    const upItem = document.createElement("div");
    upItem.className = "file-item";
    const upIcon = document.createElement("div");
    upIcon.className = "file-icon folder";
    const upLabel = document.createElement("div");
    upLabel.textContent = "..";
    upItem.appendChild(upIcon);
    upItem.appendChild(upLabel);

    upItem.addEventListener("dblclick", () => {
      let current = fileSystem[parentPath[0]];
      for (let i = 1; i < parentPath.length; i++) {
        current = current.children[parentPath[i]];
      }
      renderFolderContent(container, current, parentPath);
    });

    list.appendChild(upItem);
  }

  Object.values(folder.children).forEach(child => {
    const item = document.createElement("div");
    item.className = "file-item";

    const icon = document.createElement("div");
    icon.className = "file-icon " + (child.type === "folder" ? "folder" : "file");
    const label = document.createElement("div");
    label.textContent = child.name;

    item.appendChild(icon);
    item.appendChild(label);

    item.addEventListener("dblclick", () => {
      if (child.type === "folder") {
        renderFolderContent(container, child, [...pathArr, child.name]);
      } else if (child.type === "file") {
        openFileInViewer(container, folder, child, pathArr);
      }
    });

    list.appendChild(item);
  });

  container.appendChild(list);
}

// Gestion des suggestions de documents
function clearSuggestionTimer() {
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
    suggestionTimer = null;
  }
  hideDocSuggestion();
}

function scheduleDocSuggestion(pathArr, folder, file) {
  clearSuggestionTimer();
  suggestionTimer = setTimeout(() => {
    const suggestion = computeNextSuggestion(pathArr, folder, file);
    if (suggestion) {
      currentSuggestionData = suggestion;
      showDocSuggestion(suggestion);
    }
  }, 30000);
}

function computeNextSuggestion(pathArr, folder, file) {
  const nextFile = getNextFileInFolder(folder, file);
  if (nextFile && nextFile !== file) {
    return {
      type: "file",
      targetFolderPath: pathArr,
      folderName: folder.name,
      file: nextFile
    };
  }

  const currentFolderKey = pathArr[0];
  const nextFolder = getNextFolder(currentFolderKey);
  if (!nextFolder || nextFolder === folder) return null;

  const filesInNextFolder = Object.values(nextFolder.children || {}).filter(c => c.type === "file");
  if (!filesInNextFolder.length) return null;

  return {
    type: "folder",
    targetFolderPath: [Object.keys(fileSystem).find(k => fileSystem[k] === nextFolder)],
    folderName: nextFolder.name,
    file: filesInNextFolder[0]
  };
}

function showDocSuggestion(suggestion) {
  hideDocSuggestion();

  const notif = document.createElement("div");
  notif.className = "doc-suggestion";
  notif.id = "doc-suggestion";

  const thumb = document.createElement("div");
  thumb.className = "doc-suggestion-thumbnail";

  const extension = suggestion.file.name.split('.').pop().toLowerCase();
  let icon = "📄";
  const videoExts = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv'];
  const pdfExts = ['pdf'];
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];

  if (videoExts.includes(extension)) icon = "🎬";
  else if (pdfExts.includes(extension)) icon = "📕";
  else if (imageExts.includes(extension)) icon = "🖼️";

  thumb.textContent = icon;

  const info = document.createElement("div");
  info.className = "doc-suggestion-info";

  const title = document.createElement("div");
  title.className = "doc-suggestion-title";
  title.textContent = suggestion.file.name || "(Sans nom)";

  const meta = document.createElement("div");
  meta.className = "doc-suggestion-meta";
  meta.textContent = extension.toUpperCase() + " – Dossier: " + suggestion.folderName;

  info.appendChild(title);
  info.appendChild(meta);

  const close = document.createElement("div");
  close.className = "doc-suggestion-close";
  close.textContent = "×";

  close.addEventListener("click", (e) => {
    e.stopPropagation();
    hideDocSuggestion();
  });

  notif.appendChild(thumb);
  notif.appendChild(info);
  notif.appendChild(close);

  notif.addEventListener("click", () => {
    if (!currentSuggestionData) return;
    openSuggestedDocument(currentSuggestionData);
    hideDocSuggestion();
  });

  document.body.appendChild(notif);
}

function hideDocSuggestion() {
  const existing = document.getElementById("doc-suggestion");
  if (existing) existing.remove();
  currentSuggestionData = null;
}

function openSuggestedDocument(suggestion) {
  const folderKey = suggestion.targetFolderPath[0];
  const rootFolder = fileSystem[folderKey];
  if (!rootFolder) return;

  const { win, body } = createWindow("Fichiers - /" + suggestion.targetFolderPath.join("/"));
  renderFolderContent(body, rootFolder, suggestion.targetFolderPath);

  setTimeout(() => {
    const items = body.querySelectorAll(".file-item");
    items.forEach(item => {
      const label = item.querySelector("div:nth-child(2)");
      if (label && label.textContent === suggestion.file.name) {
        openFileInViewer(body, rootFolder, suggestion.file, suggestion.targetFolderPath);
      }
    });
  }, 0);
}

function openFileInViewer(container, folder, file, pathArr) {
  clearSuggestionTimer();
  container.innerHTML = "";

  const pathBar = document.createElement("div");
  pathBar.style.fontSize = "12px";
  pathBar.style.marginBottom = "6px";
  pathBar.textContent = "Fichier: /" + pathArr.join("/") + "/" + file.name;
  container.appendChild(pathBar);

  const btnBack = document.createElement("button");
  btnBack.textContent = "← Retour au dossier";
  btnBack.style.fontSize = "11px";
  btnBack.style.marginBottom = "6px";
  btnBack.style.padding = "2px 6px";
  btnBack.style.background = "#374151";
  btnBack.style.border = "1px solid #4b5563";
  btnBack.style.color = "#e5e7eb";
  btnBack.style.borderRadius = "4px";
  btnBack.style.cursor = "pointer";

  btnBack.addEventListener("click", () => {
    renderFolderContent(container, folder, pathArr);
  });

  container.appendChild(btnBack);

  const viewer = document.createElement("div");
  viewer.className = "file-viewer";
  viewer.style.padding = "15px";
  viewer.style.borderRadius = "4px";

  const extension = file.name.split('.').pop().toLowerCase();
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
  const videoExts = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
  const pdfExts = ['pdf'];

  if (imageExts.includes(extension)) {
    viewer.style.background = "#1f2937";
    viewer.style.textAlign = "center";
    const img = document.createElement("img");
    img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    img.alt = file.name;
    img.style.maxWidth = "100%";
    img.style.maxHeight = "500px";
    img.style.marginTop = "10px";
    viewer.appendChild(img);
  } else if (videoExts.includes(extension)) {
    viewer.style.background = "#1f2937";
    viewer.style.textAlign = "center";
    const video = document.createElement("video");
    video.src = file.path || "contenu/videos/" + file.name;
    video.style.maxWidth = "100%";
    video.style.maxHeight = "500px";
    video.style.marginTop = "10px";
    video.controls = true;
    viewer.appendChild(video);
  } else if (audioExts.includes(extension)) {
    viewer.style.background = "#1f2937";
    viewer.style.textAlign = "center";
    const audio = document.createElement("audio");
    audio.src = "data:audio/mp3;base64,";
    audio.style.marginTop = "10px";
    audio.controls = true;
    viewer.appendChild(audio);
  } else if (pdfExts.includes(extension)) {
    viewer.style.background = "#fff";
    const iframe = document.createElement("iframe");
    iframe.src = file.path || "contenu/documents/" + file.name;
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "1px solid #ccc";
    iframe.style.marginTop = "10px";
    viewer.appendChild(iframe);
  } else {
    viewer.style.padding = "15px";
    viewer.style.background = "#f3f4f6";
    viewer.style.color = "#1f2937";
    
    const title = document.createElement("h2");
    title.textContent = file.name;
    title.style.marginTop = "0";
    title.style.color = "#1f2937";
    viewer.appendChild(title);
    
    const content = document.createElement("div");
    content.style.whiteSpace = "pre-wrap";
    content.style.wordWrap = "break-word";
    content.textContent = file.content || "(Fichier vide)";
    viewer.appendChild(content);
  }

  container.appendChild(viewer);

  // Planifier la suggestion vers le prochain document
  scheduleDocSuggestion(pathArr, folder, file);
}

// Fenêtre terminal
function createTerminalWindow() {
  const { win, body } = createWindow("Terminal");

  const terminal = document.createElement("div");
  terminal.className = "terminal-body";

  const history = document.createElement("div");
  terminal.appendChild(history);

  const line = document.createElement("div");
  line.className = "terminal-line";

  const prompt = document.createElement("span");
  prompt.className = "terminal-prompt";
  prompt.textContent = "user@linux-web:~$";

  const input = document.createElement("input");
  input.className = "terminal-input";
  input.autocomplete = "off";

  line.appendChild(prompt);
  line.appendChild(input);

  terminal.appendChild(line);
  body.appendChild(terminal);

  input.focus();

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const command = input.value.trim();
      const historyLine = document.createElement("div");
      historyLine.textContent = prompt.textContent + " " + command;
      history.appendChild(historyLine);

      const result = document.createElement("div");
      result.textContent = handleTerminalCommand(command);
      history.appendChild(result);

      input.value = "";
      terminal.scrollTop = terminal.scrollHeight;
    }
  });

  win.addEventListener("mousedown", () => {
    input.focus();
  });
}

function handleTerminalCommand(cmd) {
  if (!cmd) return "";
  if (cmd === "help") {
    return "Commandes disponibles: help, ls, echo, clear (simulé: pour effacer, ferme la fenêtre).";
  }
  if (cmd === "ls") {
    return "home  documents  pictures  (simulé)";
  }
  if (cmd.startsWith("echo ")) {
    return cmd.slice(5);
  }
  return "Commande non reconnue: " + cmd;
}

// Drag & drop des fenêtres
function makeWindowDraggable(win, header) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", e => {
    isDragging = true;
    win.classList.add("dragging");
    const rect = win.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    win.style.zIndex = ++zIndexCounter;
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;

    const minX = 0;
    const minY = 32;
    const maxX = window.innerWidth - win.offsetWidth;
    const maxY = window.innerHeight - 32 - win.offsetHeight;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    win.style.left = x + "px";
    win.style.top = y + "px";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      win.classList.remove("dragging");
    }
  });
}

// Boutons fenêtre + taskbar
function setupWindowControls(win, btnClose, btnMin, btnMax) {
  btnClose.addEventListener("click", () => {
    clearSuggestionTimer();
    removeFromTaskbar(win.dataset.id);
    win.remove();
  });

  btnMin.addEventListener("click", () => {
    const isHidden = win.style.display === "none";
    win.style.display = isHidden ? "flex" : "none";
    toggleTaskbarItemActive(win.dataset.id, !isHidden);
  });

  btnMax.addEventListener("click", () => {
    const isMax = win.dataset.maximized === "true";
    if (!isMax) {
      win.dataset.prevLeft = win.style.left;
      win.dataset.prevTop = win.style.top;
      win.dataset.prevWidth = win.style.width;
      win.dataset.prevHeight = win.style.height;

      win.style.left = "0px";
      win.style.top = "32px";
      win.style.width = "100%";
      win.style.height = (window.innerHeight - 64) + "px";
      win.dataset.maximized = "true";
    } else {
      win.style.left = win.dataset.prevLeft || "80px";
      win.style.top = win.dataset.prevTop || "70px";
      win.style.width = win.dataset.prevWidth || "480px";
      win.style.height = win.dataset.prevHeight || "";
      win.dataset.maximized = "false";
    }
  });
}

function addToTaskbar(win, title) {
  const taskbar = document.getElementById("taskbar");
  const item = document.createElement("div");
  item.className = "task-item active";
  item.textContent = title;
  item.dataset.id = win.dataset.id;

  item.addEventListener("click", () => {
    if (win.style.display === "none") {
      win.style.display = "flex";
      setActiveTaskbarItem(win.dataset.id);
    } else {
      win.style.display = "none";
      item.classList.remove("active");
    }
  });

  taskbar.appendChild(item);
}

function removeFromTaskbar(id) {
  const taskbar = document.getElementById("taskbar");
  const item = taskbar.querySelector(`.task-item[data-id="${id}"]`);
  if (item) item.remove();
}

function setActiveTaskbarItem(id) {
  document.querySelectorAll(".task-item").forEach(el => {
    el.classList.toggle("active", el.dataset.id === id);
  });
}

function toggleTaskbarItemActive(id, active) {
  const item = document.querySelector(`.task-item[data-id="${id}"]`);
  if (!item) return;
  if (active) item.classList.add("active");
  else item.classList.remove("active");
}
