/*
 * wordlist-core.js — motor de geração de wordlist (puro, sem estado nem DOM).
 * Espelha a lógica de wordgenerator.py. Usado pela interface matrix (index.html)
 * e pelo app Electron. Funções recebem config explícita → testáveis e sem divergência.
 *
 * Config esperada por estimar()/gerar():
 *   { words:[], nums:[], leet:"off"|"basico"|"completo",
 *     comuns:bool, padroes:bool, depth:int, chars:[] }
 */
(function (root) {
  "use strict";

  const HARD_CAP = 300000;      // teto de linhas geradas
  const LEET_WORD_CAP = 48;     // máx. variantes leet por palavra (anti-explosão)
  const SPECIALS = "!@#$%&*?".split("");
  const PATTERNS = ["123", "1234", "12345", "123456", "321", "12", "01", "00", "11", "69", "007", "111", "000"];
  const LEET1 = { a: "4", b: "8", e: "3", g: "9", i: "1", o: "0", s: "5", t: "7" };
  const LEETN = { a: ["4", "@"], e: ["3"], i: ["1", "!"], o: ["0"], s: ["5", "$"], t: ["7"], b: ["8"], g: ["9"] };

  const cap = s => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
  const uniq = a => [...new Set(a)];

  function leetBasico(w) {
    return [...w].map(c => LEET1[c.toLowerCase()] ?? c).join("");
  }
  function leetCompleto(w) {
    let results = [""];
    for (const ch of w) {
      const subs = LEETN[ch.toLowerCase()];
      const opts = subs ? [ch, ...subs] : [ch];
      const next = [];
      for (const r of results) for (const o of opts) next.push(r + o);
      results = next;
      if (results.length > LEET_WORD_CAP) { results = results.slice(0, LEET_WORD_CAP); break; }
    }
    return results;
  }

  function variacoes(p) {
    return uniq([p.toLowerCase(), p.toUpperCase(), cap(p)]);
  }

  function construirPalavras(words, leet) {
    const base = uniq(words.flatMap(variacoes));
    if (leet === "off") return base;
    const extra = [];
    for (const w of base) {
      if (leet === "basico") { const l = leetBasico(w); if (l !== w) extra.push(l); }
      else { for (const l of leetCompleto(w)) if (l !== w) extra.push(l); }
    }
    return uniq(base.concat(extra));
  }

  function* permutations(arr, size) {
    const n = arr.length, used = new Array(n).fill(false), cur = [];
    function* rec() {
      if (cur.length === size) { yield cur.join(""); return; }
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        used[i] = true; cur.push(arr[i]);
        yield* rec();
        cur.pop(); used[i] = false;
      }
    }
    yield* rec();
  }

  function* combinarPalavras(palavras, prof) {
    for (const p of palavras) yield p;
    const teto = Math.min(prof, palavras.length);
    for (let tam = 2; tam <= teto; tam++) yield* permutations(palavras, tam);
  }

  function quebrarNumero(numeroAlvo) {
    const partes = new Set([numeroAlvo]);
    const limpo = numeroAlvo.replace(/[\/\-. ]/g, "");
    partes.add(limpo);
    const t = limpo.length, digits = /^\d+$/.test(limpo);
    if (t === 8 && digits) {
      const dia = limpo.slice(0, 2), mes = limpo.slice(2, 4), ano = limpo.slice(4, 8), anoC = limpo.slice(6, 8);
      [dia, mes, ano, anoC, dia + mes, mes + anoC].forEach(x => partes.add(x));
    } else if (t === 4 && digits) {
      partes.add(limpo.slice(2, 4));
    } else if (t > 8 && digits) {
      partes.add(limpo.slice(-4));
    }
    return [...partes];
  }

  function poolNumeros(nums, comuns, padroes) {
    let finais = [];
    if (comuns) finais.push("1", "123", "2025", "2026");
    if (padroes) finais.push(...PATTERNS);
    for (const nm of nums) finais.push(...quebrarNumero(nm));
    finais = uniq(finais);
    if (finais.length >= 2) {
      const comb = [];
      for (const par of permutations(finais, 2)) comb.push(par);
      finais = uniq(finais.concat(comb));
    }
    return finais;
  }

  function* addNumeros(gen, pool) {
    for (const senha of gen) {
      yield senha;
      for (const n of pool) { yield senha + n; yield n + senha; }
    }
  }
  function* addChars(gen, chars) {
    if (!chars.length) { yield* gen; return; }
    chars = uniq(chars);
    for (const senha of gen) {
      yield senha;
      for (const c of chars) { yield senha + c; yield c + senha; }
    }
  }

  function contarCombos(V, prof) {
    const teto = Math.min(prof, V);
    let total = 0;
    for (let k = 1; k <= teto; k++) { let p = 1; for (let j = 0; j < k; j++) p *= (V - j); total += p; }
    return total;
  }

  function estimar(cfg) {
    const V = construirPalavras(cfg.words, cfg.leet).length;
    const M = poolNumeros(cfg.nums, cfg.comuns, cfg.padroes).length;
    const C = cfg.chars.length;
    const total = contarCombos(V, cfg.depth) * (1 + 2 * M) * (1 + 2 * C);
    return { V, total };
  }

  function gerar(cfg) {
    let g = combinarPalavras(construirPalavras(cfg.words, cfg.leet), cfg.depth);
    g = addNumeros(g, poolNumeros(cfg.nums, cfg.comuns, cfg.padroes));
    g = addChars(g, cfg.chars);
    const seen = new Set();
    for (const s of g) {
      if (seen.has(s)) continue;
      seen.add(s);
      if (seen.size > HARD_CAP) break; // rede de segurança (estimar() já bloqueia antes)
    }
    return [...seen];
  }

  root.WL = { HARD_CAP, SPECIALS, estimar, gerar, construirPalavras, poolNumeros, leetBasico, leetCompleto, quebrarNumero };
})(typeof window !== "undefined" ? window : globalThis);
