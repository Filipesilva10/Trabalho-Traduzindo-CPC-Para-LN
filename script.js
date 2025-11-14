// --- Lógica principal (variáveis e rótulos renomeados) ---
const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const trimSpaces = (s) => s.replace(/\s+/g, " ").trim();
const lower = (s) => s.toLowerCase();
const uniq = (arr) => Array.from(new Set(arr));
const copyToClipboard = async (text) => { try { await navigator.clipboard.writeText(text); } catch (e) { alert('Não foi possível copiar: '+e); } };

function tokenizeFormula(src) {
  let s = src
    .replace(/<->|<=>/g, "↔")
    .replace(/->/g, "→")
    .replace(/\bxor\b/gi, "⊕")
    .replace(/\biff\b/gi, "↔")
    .replace(/\bimplies\b/gi, "→")
    .replace(/[\s\t\n]+/g, " ")
    .trim();

  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") { i++; continue; }
    if (/[A-Za-z]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      tokens.push({ type: "id", value: s.slice(i, j).toUpperCase() });
      i = j; continue;
    }
    const map = {"¬":"NOT","!":"NOT","~":"NOT","∧":"AND","&":"AND","^":"AND","∨":"OR","|":"OR","v":"OR","⊕":"XOR","→":"IMP","↔":"IFF","(":"LP", ")":"RP"};
    if (map[c]) { tokens.push({ type: map[c], value: c }); i++; continue; }
    throw new Error(`Símbolo inválido: "${c}"`);
  }
  return tokens;
}

const PRECEDENCE = { IFF:1, IMP:2, OR:3, XOR:3, AND:4, NOT:5 };
function parseFormula(tokens) {
  let pos = 0; const peek = () => tokens[pos]; const eat = () => tokens[pos++];
  function parseAtom() {
    const t = peek(); if (!t) throw new Error('Fim inesperado');
    if (t.type === 'LP') { eat(); const e = parseExpr(0); if (!peek() || peek().type !== 'RP') throw new Error('Parêntese não fechado'); eat(); return e; }
    if (t.type === 'NOT') { eat(); return { type: 'NOT', sub: parseAtom() }; }
    if (t.type === 'id') { eat(); return { type: 'ID', name: t.value }; }
    throw new Error(`Token inesperado: ${t.type}`);
  }
  function lbp(type) { return PRECEDENCE[type] || 0; }
  function parseExpr(minBp) {
    let left = parseAtom();
    while (true) {
      const t = peek(); if (!t) break;
      if (["AND","OR","XOR","IMP","IFF"].includes(t.type) && lbp(t.type) >= minBp) {
        const op = t.type; eat(); const right = parseExpr(lbp(op) + 1); left = { type: op, left, right }; continue;
      }
      break;
    }
    return left;
  }
  const ast = parseExpr(0);
  if (pos !== tokens.length) throw new Error('Tokens extras após o fim da fórmula');
  return ast;
}

function evalAST(ast, val) {
  switch (ast.type) {
    case 'ID': return !!val[ast.name];
    case 'NOT': return !evalAST(ast.sub, val);
    case 'AND': return evalAST(ast.left, val) && evalAST(ast.right, val);
    case 'OR': return evalAST(ast.left, val) || evalAST(ast.right, val);
    case 'XOR': return !!(evalAST(ast.left, val) ^ evalAST(ast.right, val));
    case 'IMP': return (!evalAST(ast.left, val)) || evalAST(ast.right, val);
    case 'IFF': return evalAST(ast.left, val) === evalAST(ast.right, val);
    default: throw new Error('AST inválida');
  }
}
// collectAtoms removed (used only for truth table which is disabled in this demo)
function astToFormula(ast) {
  const prec = (t) => PRECEDENCE[t] || 9;
  switch (ast.type) {
    case 'ID': return ast.name;
    case 'NOT': {
      const inner = ast.sub; const s = astToFormula(inner);
      const needs = prec(inner.type) > prec('NOT') ? false : inner.type !== 'ID';
      return `¬${needs ? `(${s})` : s}`;
    }
    default: {
      const opMap = { AND:'∧', OR:'∨', XOR:'⊕', IMP:'→', IFF:'↔' };
      const L = ast.left, R = ast.right; const l = astToFormula(L), r = astToFormula(R);
      const lp = prec(L.type) < prec(ast.type) ? `(${l})` : l;
      const rp = prec(R.type) < prec(ast.type) ? `(${r})` : r;
      return `${lp} ${opMap[ast.type]} ${rp}`;
    }
  }
}

// NL helpers
function normalizeNL(text) {
  let s = " " + lower(text) + " ";
  s = s.replace(/[.,;:!?]+/g, " ");
  s = s.replace(/\bmas\b/g, " e ");
  s = s.replace(/\bssi\b/g, " se e somente se ");
  s = s.replace(/\bsomente se\b/g, " somente se ");
  s = s.replace(/\bapenas se\b/g, " somente se ");
  s = s.replace(/\bse,? e somente se\b/g, " se e somente se ");
  s = s.replace(/\bse e somente se\b/g, " se e somente se ");
  s = s.replace(/\bnao\b/g, " não ");
  s = s.replace(/\bnã o\b/g, " não ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// --- Modal / interação para confirmação dos átomos extraídos ---
function confirmarAtomos(initialDict) {
  return new Promise((resolve) => {
    const container = document.getElementById('confirmModalContainer');
    container.innerHTML = '';
    const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop';
    const modal = document.createElement('div'); modal.className = 'modal';
    const title = document.createElement('h3'); title.textContent = 'Confirmar/editar átomos detectados';
    modal.appendChild(title);
    const info = document.createElement('div'); info.className = 'small muted'; info.style.marginBottom='8px'; info.textContent = 'Revise os átomos extraídos e edite se necessário. Apague um valor para removê-lo.';
    modal.appendChild(info);
    const atomsBox = document.createElement('div'); atomsBox.className = 'atoms';

    // inicializar linhas a partir do dicionário
    for (const [k,v] of Object.entries(initialDict)) {
      const row = document.createElement('div'); row.className = 'atom-row';
      const key = document.createElement('div'); key.style.width='36px'; key.style.fontFamily='monospace'; key.textContent = k;
      const input = document.createElement('input'); input.type='text'; input.value = v; input.dataset.letter = k;
      const del = document.createElement('button'); del.textContent='✖'; del.title='Remover'; del.onclick = () => input.value = '';
      row.appendChild(key); row.appendChild(input); row.appendChild(del); atomsBox.appendChild(row);
    }

    // botão para adicionar novo átomo
    const addRowBtn = document.createElement('button'); addRowBtn.textContent = 'Novo átomo'; addRowBtn.onclick = () => {
      const used = new Set(Array.from(atomsBox.querySelectorAll('input')).map(i=>i.dataset.letter));
      const next = ALFABETO.find(L => !used.has(L));
      if (!next) return alert('Limite de átomos atingido');
      const row = document.createElement('div'); row.className='atom-row';
      const key = document.createElement('div'); key.style.width='36px'; key.style.fontFamily='monospace'; key.textContent = next;
      const input = document.createElement('input'); input.type='text'; input.value = ''; input.dataset.letter = next;
      const del = document.createElement('button'); del.textContent='✖'; del.title='Remover'; del.onclick = () => input.value = '';
      row.appendChild(key); row.appendChild(input); row.appendChild(del); atomsBox.appendChild(row);
      input.focus();
    };

    modal.appendChild(atomsBox);
    modal.appendChild(addRowBtn);

    const actions = document.createElement('div'); actions.className = 'modal-actions';
    const cancel = document.createElement('button'); cancel.textContent = 'Cancelar'; cancel.onclick = () => { container.removeChild(backdrop); resolve(null); };
    const accept = document.createElement('button'); accept.textContent = 'Confirmar'; accept.onclick = () => {
      // construir dicionário a partir dos inputs
      const out = {};
      for (const inp of atomsBox.querySelectorAll('input')) {
        const letter = inp.dataset.letter; const val = inp.value.trim();
        if (val) out[letter] = val;
      }
      container.removeChild(backdrop);
      resolve(out);
    };
  actions.appendChild(cancel); actions.appendChild(accept); modal.appendChild(actions);

    backdrop.appendChild(modal); container.appendChild(backdrop);
  });
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function extractAtomsFromNL(text) {
  const s = normalizeNL(text);
  const CONNECTIVES = [" se e somente se ", " se ", " então ", " somente se ", " e ", " ou "];
  let parts = [s];
  for (const c of CONNECTIVES) parts = parts.flatMap(p => p.split(c));
  const clauses = uniq(parts.map(trimSpaces).filter(x => x.length > 0));
  return clauses.map(c => c.replace(/^não (é verdade que )?/i, "").trim());
}
function construirMapaDeNL(text) {
  const atoms = extractAtomsFromNL(text);
  const map = {};
  atoms.forEach((clause, idx) => { const letter = ALFABETO[idx] || `P${idx+1}`; map[letter] = clause; });
  return map;
}
function enunciadoParaFormula(text, mapa) {
  let s = normalizeNL(text);
  const entries = Object.entries(mapa).filter(([, v]) => v && v.trim().length).sort((a,b) => b[1].length - a[1].length);
  for (const [k,v] of entries) { const re = new RegExp(`\\b${escapeRegex(lower(v))}\\b`, "g"); s = s.replace(re, ` ${k} `); }
  s = s.replace(/\bnão é verdade que\s+(\w+)\b/g, " ¬$1 ");
  s = s.replace(/\bnão\s+\(\s*([^\)]+)\s*\)/g, " ¬($1) ");
  s = s.replace(/\bnão\s+(\w+)\b/g, " ¬$1 ");
  s = s.replace(/\bse e somente se\b/g, " ↔ ");
  s = s.replace(/\bse\s+([^]+?)\s*então\s+([^]+)$/g, (m,p,q) => ` ( ${p} ) → ( ${q} ) `);
  s = s.replace(/\b(\w+)\s+somente se\s+(\w+)\b/g, " ($1) → ($2) ");
  s = s.replace(/\bou\s+(\w+)\s+ou\s+(\w+)\b/g, " ($1) ⊕ ($2) ");
  s = s.replace(/\se\b/g, " ∧ ");
  s = s.replace(/\bou\b/g, " ∨ ");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/\b([A-Z][A-Z0-9_]*)\b/g, (m) => m.toUpperCase());
  return s;
}

function formulaParaPT(ast, mapa) {
  const name = (id) => mapa && mapa[id] ? mapa[id] : id;
  function paren(s) { if (/\b(e|ou|então|somente|ambos)\b|,/.test(lower(s))) return `(${s})`; return s; }
  function go(node) {
    switch (node.type) {
      case 'ID': return name(node.name);
      case 'NOT': return `Não é verdade que ${paren(go(node.sub))}`;
      case 'AND': return `${paren(go(node.left))} e ${paren(go(node.right))}`;
      case 'OR': return `${paren(go(node.left))} ou ${paren(go(node.right))}`;
      case 'XOR': return `${paren(go(node.left))} ou ${paren(go(node.right))} (mas não ambos)`;
      case 'IMP': return `Se ${paren(go(node.left))}, então ${paren(go(node.right))}`;
      case 'IFF': return `${paren(go(node.left))} se e somente se ${paren(go(node.right))}`;
      default: return '?';
    }
  }
  return go(ast);

}

// --- UI wiring (IDs atualizados) ---
const enunciadoEl = document.getElementById('enunciado');
const formulaEl = document.getElementById('formulaCPC');
const operatorsContainer = document.getElementById('operatorsContainer');
const mapaCustomEl = document.getElementById('mapaCustom');

// Mapa dinâmico de átomos (construído automaticamente durante tradução)
let mapa = {};

// Operadores disponíveis
const OPERADORES = [
  { symbol: '¬', name: 'Negação', desc: 'não' },
  { symbol: '∧', name: 'Conjunção', desc: 'e' },
  { symbol: '∨', name: 'Disjunção', desc: 'ou' },
  { symbol: '⊕', name: 'Exclusivo', desc: 'ou...ou' },
  { symbol: '→', name: 'Condicional', desc: 'se...então' },
  { symbol: '↔', name: 'Bicondicional', desc: 'se e somente se' }
];

function renderOperadores() {
  operatorsContainer.innerHTML = '';
  for (const op of OPERADORES) {
    const box = document.createElement('div');
    box.className = 'operator-box';
    box.title = `Clique para copiar: ${op.symbol}`;
    box.onclick = () => copyToClipboard(op.symbol);
    
    const symbol = document.createElement('div');
    symbol.className = 'operator-symbol';
    symbol.textContent = op.symbol;
    
    const name = document.createElement('div');
    name.className = 'operator-name';
    name.innerHTML = `<strong>${op.name}</strong><br/><small>${op.desc}</small>`;
    
    box.appendChild(symbol);
    box.appendChild(name);
    operatorsContainer.appendChild(box);
  }
}

// Parsear mapa a partir do textarea (formato: A=descrição)
function parseCustomMap() {
  const text = mapaCustomEl.value || '';
  const newMap = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [letter, ...descParts] = trimmed.split('=');
    const desc = descParts.join('=').trim();
    if (letter && desc) {
      newMap[letter.trim().toUpperCase()] = desc;
    }
  }
  return newMap;
}

// Atualizar o textarea com o mapa atual
function updateMapTextarea() {
  if (Object.keys(mapa).length === 0) {
    mapaCustomEl.value = '';
    return;
  }
  const lines = Object.entries(mapa).map(([k, v]) => `${k}=${v}`);
  mapaCustomEl.value = lines.join('\n');
}

// actions
function handleEnunciadoToCPC() {
  try {
    const candidates = construirMapaDeNL(enunciadoEl.value || '');
    confirmarAtomos(candidates).then((confirmed) => {
      if (!confirmed) return;
      mapa = { ...confirmed };
      updateMapTextarea();
      const f = enunciadoParaFormula(enunciadoEl.value || '', mapa);
      formulaEl.value = f;
    }).catch((err) => { alert('Erro: '+err.message); });
  } catch (e) { alert('Erro: '+e.message); }
}
function handleCPCtoNL() {
  try {
    if (Object.keys(mapa).length === 0) {
      alert('Por favor, defina o mapa de átomos (A=descrição, B=descrição, ...) antes de traduzir de CPC.');
      return;
    }
    const tokens = tokenizeFormula(formulaEl.value || '');
    const ast = parseFormula(tokens);
    const out = formulaParaPT(ast, mapa);
    enunciadoEl.value = out;
  } catch (e) { alert('Erro: '+e.message); }
}

function handleAplicarMapa() {
  try {
    const newMap = parseCustomMap();
    if (Object.keys(newMap).length === 0) {
      alert('Nenhum átomo foi definido. Use o formato: A=descrição');
      return;
    }
    mapa = newMap;
    alert(`Mapa aplicado com sucesso! ${Object.keys(mapa).length} átomo(s) definido(s).`);
  } catch (e) { alert('Erro ao aplicar mapa: '+e.message); }
}

// wire buttons
document.getElementById('gerarCPC').onclick = handleEnunciadoToCPC;
document.getElementById('limparEnunciado').onclick = () => { enunciadoEl.value=''; formulaEl.value=''; };
document.getElementById('copiarEnunciado').onclick = () => copyToClipboard(enunciadoEl.value);
document.getElementById('copiarFormula').onclick = () => copyToClipboard(formulaEl.value);
document.getElementById('gerarEnunciado').onclick = handleCPCtoNL;
document.getElementById('aplicarMapa').onclick = handleAplicarMapa;

// inicializar operadores
renderOperadores();

// expose some actions for convenience
window.translateCPCtoNL = handleCPCtoNL;