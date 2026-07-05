// ==========================================================
// Canvas Resizer — a Sandboxels mod
// Make the simulation canvas bigger or smaller, on the fly,
// WITHOUT wiping your pixels (out-of-bounds pixels are
// deleted when shrinking; everything else is kept).
//
// Controls:
//   Panel  : floating "Canvas Size" panel above the canvas
//   .      : grow width+height by 10 cells
//   ,      : shrink width+height by 10 cells
//   Shift+.: grow width only     Shift+,: shrink width only
//   Alt+. : grow height only     Alt+,  : shrink height only
//   /      : type an exact size, e.g. "250x120" (grid cells)
//
// Install: Mods menu -> paste this file's name/URL -> refresh
// ==========================================================

var canvasResizerStep = 10;   // cells added/removed per press
var canvasResizerMin  = 20;   // minimum cells per axis
var canvasResizerMax  = 1200; // safety cap (huge grids = low FPS)

// Resize the grid to (newW x newH) CELLS, preserving pixels.
function resizeCanvasKeepPixels(newW, newH) {
    newW = Math.round(newW);
    newH = Math.round(newH);
    if (isNaN(newW) || isNaN(newH)) { return; }
    newW = Math.min(canvasResizerMax, Math.max(canvasResizerMin, newW));
    newH = Math.min(canvasResizerMax, Math.max(canvasResizerMin, newH));

    var oldPixels = currentPixels;

    // resizeCanvas(heightPx, widthPx, pixelSize, clear, noFix)
    // It sets: width = round(widthPx/pixelSize) - 1, so add one cell.
    // clear=false so it doesn't call clearAll() (which would also
    // reset save data, ticks, etc.) — we rebuild the map ourselves.
    resizeCanvas((newH + 1) * pixelSize, (newW + 1) * pixelSize, pixelSize, false, true);

    // Rebuild pixelMap at the new dimensions
    pixelMap = [];
    for (var i = 0; i <= width; i++) {
        pixelMap[i] = [];
        for (var j = 0; j <= height; j++) {
            pixelMap[i][j] = undefined;
        }
    }

    // Re-place surviving pixels; delete ones that no longer fit
    currentPixels = [];
    for (var k = 0; k < oldPixels.length; k++) {
        var p = oldPixels[k];
        if (!p || p.del) { continue; }
        if (p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height && pixelMap[p.x][p.y] === undefined) {
            pixelMap[p.x][p.y] = p;
            currentPixels.push(p);
        }
        else {
            p.del = true;
            if (elements[p.element] && elements[p.element].onDelete) {
                try { elements[p.element].onDelete(p); } catch(e) {}
            }
        }
    }

    updateBorder();
    canvasResizerUpdateLabel();
    if (paused) { drawPixels(true); }
}

function canvasResizerNudge(dw, dh) {
    resizeCanvasKeepPixels(width + dw, height + dh);
}

function canvasResizerPrompt() {
    promptInput("Enter a canvas size in cells, like 250x120 (current: " + width + "x" + height + ")", function(r) {
        if (!r) { return; }
        var parts = r.toLowerCase().split(/[x, ]+/);
        if (parts.length < 2) { return; }
        resizeCanvasKeepPixels(parseInt(parts[0]), parseInt(parts[1]));
    }, "Canvas Resizer");
}

function canvasResizerUpdateLabel() {
    var label = document.getElementById("canvasResizerLabel");
    if (label) { label.innerText = width + " x " + height; }
}

// ---------------- Keybinds ----------------
// "." grows, "," shrinks. Shift = width only, Alt = height only.
keybinds["Period"] = function(e) {
    var dw = canvasResizerStep, dh = canvasResizerStep;
    if (e && e.shiftKey) { dh = 0; }
    else if (e && e.altKey) { dw = 0; }
    canvasResizerNudge(dw, dh);
};
keybinds["Comma"] = function(e) {
    var dw = -canvasResizerStep, dh = -canvasResizerStep;
    if (e && e.shiftKey) { dh = 0; }
    else if (e && e.altKey) { dw = 0; }
    canvasResizerNudge(dw, dh);
};
keybinds["Slash"] = function(e) {
    canvasResizerPrompt();
};

// ---------------- UI panel ----------------
runAfterLoad(function() {
    var panel = document.createElement("div");
    panel.id = "canvasResizerPanel";
    panel.style.cssText = "display:inline-block;margin:4px auto;padding:4px 8px;" +
        "background:#1e1e1e;border:1px solid #555;border-radius:6px;" +
        "font-family:inherit;color:#eee;font-size:14px;user-select:none;";

    function makeButton(text, title, onclick) {
        var b = document.createElement("button");
        b.innerText = text;
        b.title = title;
        b.style.cssText = "margin:0 2px;padding:1px 7px;background:#333;color:#eee;" +
            "border:1px solid #666;border-radius:4px;cursor:pointer;font-size:13px;";
        b.onclick = function() { onclick(); this.blur(); };
        return b;
    }

    var title = document.createElement("span");
    title.innerText = "Canvas: ";
    panel.appendChild(title);

    var label = document.createElement("span");
    label.id = "canvasResizerLabel";
    label.style.cssText = "margin-right:6px;color:#8fd;";
    label.innerText = width + " x " + height;
    panel.appendChild(label);

    panel.appendChild(makeButton("\u2212", "Shrink both (,)", function(){ canvasResizerNudge(-canvasResizerStep, -canvasResizerStep); }));
    panel.appendChild(makeButton("+", "Grow both (.)", function(){ canvasResizerNudge(canvasResizerStep, canvasResizerStep); }));
    panel.appendChild(makeButton("W\u2212", "Shrink width (Shift+,)", function(){ canvasResizerNudge(-canvasResizerStep, 0); }));
    panel.appendChild(makeButton("W+", "Grow width (Shift+.)", function(){ canvasResizerNudge(canvasResizerStep, 0); }));
    panel.appendChild(makeButton("H\u2212", "Shrink height (Alt+,)", function(){ canvasResizerNudge(0, -canvasResizerStep); }));
    panel.appendChild(makeButton("H+", "Grow height (Alt+.)", function(){ canvasResizerNudge(0, canvasResizerStep); }));
    panel.appendChild(makeButton("Set\u2026", "Type an exact size (/)", canvasResizerPrompt));
    panel.appendChild(makeButton("Reset", "Restore the default auto size (clears canvas)", function(){ autoResizeCanvas(); canvasResizerUpdateLabel(); }));

    var gameDiv = document.getElementById("gameDiv");
    if (gameDiv && gameDiv.parentNode) {
        gameDiv.parentNode.insertBefore(panel, gameDiv);
    }
    else {
        document.body.appendChild(panel);
    }
});
