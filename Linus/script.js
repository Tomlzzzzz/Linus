let zIndexCounter = 10;
let windowIdCounter = 1;

function updateClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;
  const now = new Date();
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: "2-digit",
    minute: "2-digit"
  };
  clock.textContent = now.toLocaleDateString("fr-FR", options).replace(',', '');
}
setInterval(updateClock, 1000);
updateClock();

document.querySelectorAll(".icon").forEach(icon => {
  icon.addEventListener("click", () => {
    const target = icon.getAttribute("data-target");
    openApp(target);
  });
});

function openApp(target) {
  if (target === "terminal") {
    createTerminalWindow();
    return;
  }

  const contentEl = document.getElementById("content-" + target);
  if (contentEl) {
    const title = contentEl.getAttribute("data-title") || "Document";
    const htmlContent = contentEl.innerHTML;
    createModalWindow(title, htmlContent);
  } else {
    console.warn("Contenu introuvable pour la cible: " + target);
  }
}

function createModalWindow(title, htmlContent) {
  const { win, body } = createWindow(title);
  body.innerHTML = htmlContent;
}

function createWindow(title) {
  const win = document.createElement("div");
  win.className = "window";
  win.dataset.id = "win-" + windowIdCounter++;

  win.style.zIndex = ++zIndexCounter;

  const header = document.createElement("div");
  header.className = "window-header";

  const buttons = document.createElement("div");
  buttons.className = "window-buttons";

  const btnClose = document.createElement("div");
  btnClose.className = "win-btn win-close";
  const btnMin = document.createElement("div");
  btnMin.className = "win-btn win-min";
  const btnMax = document.createElement("div");
  btnMax.className = "win-btn win-max";

  buttons.appendChild(btnClose);
  buttons.appendChild(btnMin);
  buttons.appendChild(btnMax);

  const titleEl = document.createElement("div");
  titleEl.className = "window-title";
  titleEl.textContent = title;

  const spacer = document.createElement("div");
  spacer.className = "window-spacer";

  header.appendChild(buttons);
  header.appendChild(titleEl);
  header.appendChild(spacer);

  const body = document.createElement("div");
  body.className = "window-body";

  win.appendChild(header);
  win.appendChild(body);

  document.getElementById("windows-container").appendChild(win);

  const offset = (windowIdCounter % 10) * 20;
  win.style.top = (80 + offset) + "px";
  win.style.left = (100 + offset) + "px";

  makeWindowDraggable(win, header);
  setupWindowControls(win, btnClose, btnMin, btnMax);
  addToTaskbar(win, title);

  win.addEventListener("mousedown", () => {
    win.style.zIndex = ++zIndexCounter;
    setActiveTaskbarItem(win.dataset.id);
  });

  return { win, body, titleEl };
}

function createTerminalWindow() {
  const { win, body } = createWindow("Terminal");

  const terminal = document.createElement("div");
  terminal.className = "terminal-body";

  const history = document.createElement("div");
  terminal.appendChild(history);

  const line = document.createElement("div");
  line.className = "terminal-line";
  line.style.display = "none";

  const prompt = document.createElement("span");
  prompt.className = "terminal-prompt";
  prompt.textContent = "user@linux-web:~$";

  const input = document.createElement("input");
  input.className = "terminal-input";
  input.autocomplete = "off";
  input.spellcheck = false;

  line.appendChild(prompt);
  line.appendChild(input);

  terminal.appendChild(line);
  body.appendChild(terminal);

  const themeText = "Bienvenue sur notre site mettant en avant les creations et inovations de Linus Torvald. Naviguez entre les fichiers classer par date et projets afin d'en savoir plus sur lui.";
  const typeTarget = document.createElement("div");
  typeTarget.style.color = "#22c55e";
  typeTarget.style.marginBottom = "10px";
  typeTarget.style.minHeight = "1.5em";
  typeTarget.style.lineHeight = "1.6";
  history.appendChild(typeTarget);

  let charIndex = 0;
  function typeWriter() {
    if (charIndex < themeText.length) {
      typeTarget.textContent += themeText.charAt(charIndex);
      charIndex++;
      body.scrollTop = body.scrollHeight;
      setTimeout(typeWriter, 50 );
    } else {
      const guide = document.createElement("div");
      guide.style.color = "#9ca3af";
      guide.style.marginTop = "10px";
      guide.style.marginBottom = "14px";
      guide.style.lineHeight = "1.6";
      guide.innerHTML = "---<br><b>Guide d'utilisation du Terminal</b><br>Tapez <strong style='color:#fbbf24'>ls</strong> pour voir la liste des dossiers / projets disponibles.<br>Tapez <strong style='color:#fbbf24'>cd [nom-du-dossier]</strong> pour les ouvrir (ex: <i>cd naissance</i>).<br>---";
      history.appendChild(guide);

      line.style.display = "flex";
      setTimeout(() => input.focus(), 10);
      body.scrollTop = body.scrollHeight;
    }
  }

  setTimeout(typeWriter, 400);

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const command = input.value.trim();
      const historyLine = document.createElement("div");
      historyLine.textContent = prompt.textContent + " " + command;
      history.appendChild(historyLine);

      if (command.toLowerCase() === "clear") {
          history.innerHTML = "";
      } else {
          const result = document.createElement("div");
          result.textContent = handleTerminalCommand(command);
          history.appendChild(result);
      }

      input.value = "";
      body.scrollTop = body.scrollHeight;
    }
  });

  win.addEventListener("mousedown", () => {
    input.focus();
  });
}

function handleTerminalCommand(cmd) {
  if (!cmd) return "";
  if (cmd === "help") {
    return "Commandes: help, clear, echo [texte], whoami, date, ls, cd [dossier]";
  }
  if (cmd === "ls") {
    return "naissance   linux   famille   git   reconnaissance   heritage";
  }
  if (cmd.startsWith("cd ")) {
    const target = cmd.slice(3).trim();
    const map = {
      "naissance": "linus-born",
      "linux": "linux-born",
      "famille": "family",
      "git": "git-born",
      "reconnaissance": "reconnaissance",
      "heritage": "heritage"
    };
    if (map[target]) {
       openApp(map[target]);
       return `Ouverture de ${target}...`;
    } else if (target === ".." || target === "~" || target === "/") {
       return "";
    } else {
       return `cd: ${target}: Aucun fichier ou dossier de ce type`;
    }
  }
  if (cmd === "whoami") return "linus_fan";
  if (cmd === "date") return new Date().toString();
  if (cmd.startsWith("echo ")) {
    return cmd.slice(5);
  }
  return "Commande non trouvée: " + cmd;
}

function makeWindowDraggable(win, header) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", e => {

    if(e.target.classList.contains('win-btn')) return;

    isDragging = true;
    win.classList.add("dragging");
    const rect = win.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    win.style.zIndex = ++zIndexCounter;

    e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;

    const minY = 36;
    y = Math.max(minY, y);

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

function setupWindowControls(win, btnClose, btnMin, btnMax) {
  btnClose.addEventListener("click", () => {
    removeFromTaskbar(win.dataset.id);
    win.style.animation = "windowOpen 0.2s reverse forwards";
    setTimeout(() => {
        win.remove();
    }, 200);
  });

  btnMin.addEventListener("click", () => {
    win.style.display = "none";
    toggleTaskbarItemActive(win.dataset.id, false);
  });

  btnMax.addEventListener("click", () => {
    const isMax = win.dataset.maximized === "true";
    if (!isMax) {
      win.dataset.prevLeft = win.style.left;
      win.dataset.prevTop = win.style.top;
      win.dataset.prevWidth = win.style.width;
      win.dataset.prevHeight = win.style.height;

      win.style.left = "0px";
      win.style.top = "36px";
      win.style.width = "100%";
      win.style.height = (window.innerHeight - 36 - 54) + "px";
      win.dataset.maximized = "true";
    } else {
      win.style.left = win.dataset.prevLeft || "100px";
      win.style.top = win.dataset.prevTop || "80px";
      win.style.width = win.dataset.prevWidth || "600px";
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
  item.title = title;

  item.addEventListener("click", () => {
    if (win.style.display === "none") {
      win.style.display = "flex";
      win.style.zIndex = ++zIndexCounter;
      setActiveTaskbarItem(win.dataset.id);
    } else {
      if (win.style.zIndex == zIndexCounter) {

        win.style.display = "none";
        item.classList.remove("active");
      } else {

        win.style.zIndex = ++zIndexCounter;
        setActiveTaskbarItem(win.dataset.id);
      }
    }
  });

  taskbar.appendChild(item);
  setActiveTaskbarItem(win.dataset.id);
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
