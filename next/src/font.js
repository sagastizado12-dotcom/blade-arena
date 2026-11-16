// Original 5×7 pixel letters. Missing glyphs draw as a small gap, not a box.

const G = {};
function rows(s) {
  const o = [];
  for (let i = 0; i < 7; i++) o.push(parseInt(s.slice(i * 2, i * 2 + 2), 16));
  return o;
}
function put(chars, hexes) {
  for (let i = 0; i < chars.length; i++) G[chars[i]] = rows(hexes[i]);
}
put("ABCDEFGHIJKLMNOPQRSTUVWXYZ", [
  "0e111f11111111","1e111e11111e11","0e11101110110e","1e11111111111e","1f100f11101f10","1f100f11101010",
  "0e11101d11110e","1111111f111111","0e04040404040e","0702020212120c","11121418141211","1010101010101f",
  "111b1511111111","11191513111111","0e11111111110e","1e11111e101010","0e11111115120d","1e11111e141211",
  "0e11100e01110e","1f040404040404","1111111111110e","11111111110a04","11111115151b11","11110a040a1111",
  "11110a04040404","1f02040810101f"
]);
put("abcdefghijklmnopqrstuvwxyz", [
  "00000e011f110e","10101e11111e10","00000e1110110e","01011e1111111e","00000e111f100e","0608101c101010",
  "00000e11110e017f","10101e11111111","04000404040404","0200020202120c","10101218141211","04040404040404",
  "00001b15151111","00001e11111111","00000e1111110e","00001e11111e1010","00001e1111111e01","00001619001010",
  "00000f100e011e","08080e08080806","0000111111110e","00001111110a04","0000111115150a","0000110a040a11",
  "00001111110e017f","00001f020c101f"
]);
put("0123456789", [
  "0e11151319110e","040c040404040e","0e11020408101f","1f02040802040e","02060a121f0202",
  "1f101e0101110e","0e101e1111110e","1f010204080808","0e11110e11110e","0e1111110f010e"
]);
put(" .,!?'-:;+/%", [
  "00000000000000","00000000000004","00000000000404","00040a110a0400","00040400040400",
  "040a1104040400","00040e10100e00","00060600000000","0000001f000000","04040400040404",
  "0004041f040400","00040c06040c00","00000204080000"
]);

export function textWidth(text, scale = 1) {
  return text.length * 6 * scale;
}

export function drawText(g, text, x, y, color, scale = 1) {
  g.fillStyle = color;
  let cx = x | 0;
  const cy = y | 0;
  for (let i = 0; i < text.length; i++) {
    const rows = G[text[i]] || G[text[i].toLowerCase()] || G[text[i].toUpperCase()];
    if (rows) {
      for (let r = 0; r < 7; r++) {
        const bits = rows[r];
        for (let c = 0; c < 5; c++) if (bits & (16 >> c)) g.fillRect(cx + c * scale, cy + r * scale, scale, scale);
      }
    }
    cx += 6 * scale;
  }
}

export function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (next.length > maxChars && line) { lines.push(line); line = w; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
