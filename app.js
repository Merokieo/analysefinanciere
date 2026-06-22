const STORE_KEY = "analyse-financiere-pro-v2";

const fields = {
  functional: [
    ["capitauxPropres", "Capitaux propres", 980000],
    ["dettesFinancieres", "Dettes financières", 420000],
    ["amortProv", "Amort. & provisions", 160000],
    ["emploisStables", "Emplois stables", 1050000],
    ["actifExploitation", "Actif circulant exploitation", 340000],
    ["passifExploitation", "Passif circulant exploitation", 260000],
    ["actifHorsExploitation", "Actif hors exploitation", 55000],
    ["passifHorsExploitation", "Passif hors exploitation", 36000],
    ["tresorerieActif", "Trésorerie actif", 89000],
    ["tresoreriePassif", "Trésorerie passif", 42000]
  ],
  financial: [
    ["totalActif", "Total actif", 1680000],
    ["totalPassif", "Total passif", 1680000],
    ["actifsCourants", "Actifs courants", 484000],
    ["passifsCourants", "Passifs courants", 338000],
    ["stock", "Stocks", 126000],
    ["clients", "Clients", 170000],
    ["fournisseurs", "Fournisseurs", 138000],
    ["dettesTotales", "Total dettes", 700000]
  ],
  sig: [
    ["ventesMarchandises", "Ventes de marchandises", 720000],
    ["achatsMarchandises", "Achats de marchandises", 405000],
    ["variationStockMarch", "Variation stock marchandises", 18000],
    ["productionVendue", "Production vendue", 420000],
    ["productionStockee", "Production stockée", 25000],
    ["productionImmobilisee", "Production immobilisée", 10000],
    ["consommations", "Consommations de l’exercice", 310000],
    ["subventions", "Subventions d’exploitation", 12000],
    ["impotsTaxes", "Impôts et taxes", 28000],
    ["chargesPersonnel", "Charges de personnel", 190000],
    ["autresProduits", "Autres produits", 8000],
    ["autresCharges", "Autres charges", 14000],
    ["reprises", "Reprises", 9000],
    ["dotations", "Dotations", 44000],
    ["produitsFinanciers", "Produits financiers", 11000],
    ["chargesFinancieres", "Charges financières", 22000],
    ["produitsExceptionnels", "Produits non courants", 6000],
    ["chargesExceptionnelles", "Charges non courantes", 9000],
    ["impotResultat", "Impôt sur le résultat", 27000]
  ],
  breakEven: [
    ["caBreak", "Chiffre d’affaires", 1140000],
    ["chargesVariables", "Charges variables", 690000],
    ["chargesFixes", "Charges fixes", 280000],
    ["prixUnitaire", "Prix unitaire", 120],
    ["coutVariableUnitaire", "Coût variable unitaire", 72]
  ],
  investment: [
    ["investmentInitial", "Investissement initial", 300000],
    ["discountRate", "Taux d’actualisation (%)", 10],
    ["cf1", "Cash-flow année 1", 82000],
    ["cf2", "Cash-flow année 2", 94000],
    ["cf3", "Cash-flow année 3", 107000],
    ["cf4", "Cash-flow année 4", 120000],
    ["cf5", "Cash-flow année 5", 126000]
  ],
  loan: [
    ["loanAmount", "Capital emprunté", 250000],
    ["loanRate", "Taux annuel (%)", 7],
    ["loanYears", "Durée (années)", 5]
  ]
};

const evolutionRows = [
  ["ca", "Chiffre d’affaires"],
  ["ebe", "EBE"],
  ["rn", "Résultat net"],
  ["caf", "CAF"],
  ["asset", "Total actif"],
  ["equity", "Capitaux propres"],
  ["debt", "Dettes totales"]
];

const defaultEvolution = {
  ca: [920000, 1030000, 1140000],
  ebe: [150000, 181000, 219000],
  rn: [58000, 77000, 101000],
  caf: [96000, 118000, 145000],
  asset: [1420000, 1550000, 1680000],
  equity: [820000, 900000, 980000],
  debt: [600000, 650000, 700000]
};

const state = createDefaultState();

function createDefaultState() {
  const base = { evolution: structuredClone(defaultEvolution) };
  for (const group of Object.values(fields)) {
    for (const [key, , value] of group) base[key] = value;
  }
  return base;
}

function n(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function money(value) {
  const number = n(value);
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(number) + " DH";
}

function pct(value, decimals = 1) {
  const number = n(value);
  return Number.isFinite(number) ? number.toFixed(decimals).replace(".", ",") + " %" : "—";
}

function ratio(value, decimals = 2) {
  const number = n(value);
  if (!Number.isFinite(number)) return "—";
  return number.toFixed(decimals).replace(".", ",");
}

function safeDiv(a, b) {
  return Math.abs(n(b)) < 1e-9 ? 0 : n(a) / n(b);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cssClass(value) {
  if (value > 0) return "good-text";
  if (value < 0) return "bad-text";
  return "";
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(state, createDefaultState(), saved);
  } catch (_) {}
}

function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  toast("Enregistré");
}

function bindNavigation() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
}

function setView(id) {
  document.querySelectorAll(".nav-tab").forEach((button) => button.classList.toggle("active", button.dataset.view === id));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === id));
  const view = document.getElementById(id);
  document.getElementById("viewTitle").textContent = view.dataset.title;
}

function renderForms() {
  for (const [group, list] of Object.entries(fields)) {
    const holder = document.querySelector(`[data-form="${group}"]`);
    if (!holder) continue;
    holder.innerHTML = list.map(([key, label]) => `
      <div class="field">
        <label for="${key}">${label}</label>
        <div class="input-wrap"><input id="${key}" data-key="${key}" type="number" step="0.01" value="${state[key] ?? 0}"></div>
      </div>
    `).join("");
  }

  document.querySelectorAll("input[data-key]").forEach((input) => {
    input.addEventListener("input", () => {
      state[input.dataset.key] = n(input.value);
      calculate();
    });
  });
}

function calcSIG() {
  const achatsRev = n(state.achatsMarchandises) + n(state.variationStockMarch);
  const margeCommerciale = n(state.ventesMarchandises) - achatsRev;
  const production = n(state.productionVendue) + n(state.productionStockee) + n(state.productionImmobilisee);
  const valeurAjoutee = margeCommerciale + production - n(state.consommations);
  const ebe = valeurAjoutee + n(state.subventions) - n(state.impotsTaxes) - n(state.chargesPersonnel);
  const rex = ebe + n(state.reprises) + n(state.autresProduits) - n(state.dotations) - n(state.autresCharges);
  const resultatFinancier = n(state.produitsFinanciers) - n(state.chargesFinancieres);
  const rcai = rex + resultatFinancier;
  const resultatNonCourant = n(state.produitsExceptionnels) - n(state.chargesExceptionnelles);
  const resultatNet = rcai + resultatNonCourant - n(state.impotResultat);
  const caf = resultatNet + n(state.dotations) - n(state.reprises);
  return { achatsRev, margeCommerciale, production, valeurAjoutee, ebe, rex, resultatFinancier, rcai, resultatNonCourant, resultatNet, caf };
}

function calcFunctional() {
  const ressourcesStables = n(state.capitauxPropres) + n(state.dettesFinancieres) + n(state.amortProv);
  const frng = ressourcesStables - n(state.emploisStables);
  const bfre = n(state.actifExploitation) - n(state.passifExploitation);
  const bfrhe = n(state.actifHorsExploitation) - n(state.passifHorsExploitation);
  const bfr = bfre + bfrhe;
  const tn = frng - bfr;
  const tnDirect = n(state.tresorerieActif) - n(state.tresoreriePassif);
  return { ressourcesStables, frng, bfre, bfrhe, bfr, tn, tnDirect };
}

function calcFinancial(sig, functional) {
  const dettes = n(state.dettesTotales) || Math.max(0, n(state.totalPassif) - n(state.capitauxPropres));
  const liquiditeGenerale = safeDiv(state.actifsCourants, state.passifsCourants);
  const liquiditeReduite = safeDiv(n(state.actifsCourants) - n(state.stock), state.passifsCourants);
  const solvabilite = safeDiv(state.totalActif, dettes);
  const autonomie = safeDiv(state.capitauxPropres, state.totalPassif);
  const endettement = safeDiv(dettes, state.capitauxPropres);
  const couvertureImmobilisations = safeDiv(n(state.capitauxPropres) + n(state.dettesFinancieres), state.emploisStables);
  const bfrDays = safeDiv(functional.bfr, n(state.ventesMarchandises) + n(state.productionVendue)) * 360;
  const dso = safeDiv(state.clients, n(state.ventesMarchandises) + n(state.productionVendue)) * 360;
  const dpo = safeDiv(state.fournisseurs, n(state.achatsMarchandises) + n(state.consommations)) * 360;
  const stockDays = safeDiv(state.stock, n(state.achatsMarchandises) + n(state.consommations)) * 360;
  const margeNette = safeDiv(sig.resultatNet, n(state.ventesMarchandises) + n(state.productionVendue));
  const margeEbe = safeDiv(sig.ebe, n(state.ventesMarchandises) + n(state.productionVendue));
  const roe = safeDiv(sig.resultatNet, state.capitauxPropres);
  const roa = safeDiv(sig.resultatNet, state.totalActif);
  const cafDettes = safeDiv(sig.caf, n(state.dettesFinancieres));
  return { dettes, liquiditeGenerale, liquiditeReduite, solvabilite, autonomie, endettement, couvertureImmobilisations, bfrDays, dso, dpo, stockDays, margeNette, margeEbe, roe, roa, cafDettes };
}

function calcBreakEven() {
  const ca = n(state.caBreak);
  const cv = n(state.chargesVariables);
  const cf = n(state.chargesFixes);
  const mcv = ca - cv;
  const tauxMcv = safeDiv(mcv, ca);
  const seuil = tauxMcv ? safeDiv(cf, tauxMcv) : 0;
  const pointMort = safeDiv(seuil, ca) * 360;
  const resultat = mcv - cf;
  const margeUnitaire = n(state.prixUnitaire) - n(state.coutVariableUnitaire);
  const quantiteCritique = margeUnitaire ? safeDiv(cf, margeUnitaire) : 0;
  return { mcv, tauxMcv, seuil, pointMort, resultat, margeUnitaire, quantiteCritique };
}

function calcInvestment() {
  const initial = n(state.investmentInitial);
  const rate = n(state.discountRate) / 100;
  const flows = [n(state.cf1), n(state.cf2), n(state.cf3), n(state.cf4), n(state.cf5)];
  const rows = flows.map((cf, index) => {
    const year = index + 1;
    const factor = 1 / Math.pow(1 + rate, year);
    const discounted = cf * factor;
    return { year, cf, factor, discounted };
  });
  const pv = rows.reduce((sum, row) => sum + row.discounted, 0);
  const van = pv - initial;
  const ip = safeDiv(pv, initial);
  const tri = calcIRR(initial, flows);
  const payback = calcPayback(initial, flows);
  return { rows, pv, van, ip, tri, payback };
}

function calcIRR(initial, flows) {
  let low = -0.95;
  let high = 10;
  const npv = (r) => flows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + r, i + 1), -initial);
  let fLow = npv(low);
  let fHigh = npv(high);
  if (fLow * fHigh > 0) return 0;
  for (let i = 0; i < 120; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 0.000001) return mid;
    if (fLow * fMid <= 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return (low + high) / 2;
}

function calcPayback(initial, flows) {
  let acc = 0;
  for (let i = 0; i < flows.length; i++) {
    const previous = acc;
    acc += flows[i];
    if (acc >= initial) {
      const fraction = flows[i] ? (initial - previous) / flows[i] : 0;
      return i + fraction;
    }
  }
  return null;
}

function calcLoan() {
  const capital = n(state.loanAmount);
  const years = Math.max(1, Math.round(n(state.loanYears)));
  const rate = n(state.loanRate) / 100;
  const annuity = rate ? capital * rate / (1 - Math.pow(1 + rate, -years)) : capital / years;
  let remaining = capital;
  const rows = [];
  for (let year = 1; year <= years; year++) {
    const interest = remaining * rate;
    const amortization = annuity - interest;
    remaining = Math.max(0, remaining - amortization);
    rows.push({ year, beginning: year === 1 ? capital : rows[rows.length - 1].remaining, annuity, interest, amortization, remaining });
  }
  return { rows, annuity };
}

function calculate() {
  const sig = calcSIG();
  const functional = calcFunctional();
  const financial = calcFinancial(sig, functional);
  const breakEven = calcBreakEven();
  const investment = calcInvestment();
  const loan = calcLoan();

  renderDashboard(sig, functional, financial, investment);
  renderFunctional(functional);
  renderFinancial(financial);
  renderSIG(sig);
  renderRatios(sig, functional, financial);
  renderBreakEven(breakEven);
  renderInvestment(investment);
  renderLoan(loan);
  renderEvolution();
}

function renderDashboard(sig, functional, financial, investment) {
  const ca = n(state.ventesMarchandises) + n(state.productionVendue);
  const kpis = [
    ["Chiffre d’affaires", ca, "activité"],
    ["EBE", sig.ebe, "exploitation"],
    ["Résultat net", sig.resultatNet, "performance"],
    ["Trésorerie nette", functional.tn, "équilibre"]
  ];
  document.getElementById("kpiGrid").innerHTML = kpis.map(([label, value, note]) => `
    <article class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${cssClass(value)}">${money(value)}</div>
      <div class="kpi-note">${note}</div>
    </article>
  `).join("");

  let score = 50;
  score += functional.tn >= 0 ? 12 : -12;
  score += functional.frng >= functional.bfr ? 12 : -12;
  score += sig.ebe >= 0 ? 10 : -12;
  score += sig.resultatNet >= 0 ? 8 : -14;
  score += financial.liquiditeGenerale >= 1 ? 8 : -8;
  score = Math.round(clamp(score, 0, 100));

  const cls = score >= 70 ? "good" : score >= 45 ? "warn" : "bad";
  const label = score >= 70 ? "Solide" : score >= 45 ? "À surveiller" : "Fragile";
  const ring = document.getElementById("scoreRing");
  ring.style.background = `conic-gradient(var(--${cls === "good" ? "good" : cls === "warn" ? "warn" : "bad"}) ${score * 3.6}deg, rgba(255,255,255,.08) 0deg 360deg)`;
  document.getElementById("scoreValue").textContent = score;
  document.getElementById("scoreTitle").textContent = label;
  document.getElementById("scoreLine").textContent = `${money(sig.resultatNet)} de résultat net, ${money(functional.frng)} de FRNG, ${money(functional.bfr)} de BFR.`;
  const pill = document.getElementById("healthPill");
  pill.textContent = label;
  pill.className = `status-pill ${cls}`;

  const bars = [
    ["FRNG", functional.frng],
    ["BFR", functional.bfr],
    ["TN", functional.tn],
    ["VAN", investment.van]
  ];
  const max = Math.max(...bars.map(([, value]) => Math.abs(value)), 1);
  document.getElementById("summaryBars").innerHTML = bars.map(([label, value]) => `
    <div class="bar-row">
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${clamp(Math.abs(value) / max * 100, 4, 100)}%"></div></div>
      <span class="bar-value ${cssClass(value)}">${money(value)}</span>
    </div>
  `).join("");

  const signals = [
    signal(functional.frng >= 0, "FRNG", `${money(functional.frng)}`),
    signal(functional.tn >= 0, "Trésorerie nette", `${money(functional.tn)}`),
    signal(financial.liquiditeGenerale >= 1, "Liquidité générale", ratio(financial.liquiditeGenerale)),
    signal(sig.ebe >= 0, "EBE", `${money(sig.ebe)}`),
    signal(investment.van >= 0, "VAN", `${money(investment.van)}`)
  ];
  document.getElementById("signals").innerHTML = signals.join("");
}

function signal(ok, title, value) {
  const cls = ok ? "good" : "bad";
  return `<div class="signal ${cls}"><div class="signal-dot"></div><div><strong>${title}</strong><span>${value}</span></div></div>`;
}

function renderFunctional(f) {
  const rows = [
    ["Ressources stables", "CP + Dettes financières + Amort./Prov.", f.ressourcesStables],
    ["Emplois stables", "Actif immobilisé / emplois stables", n(state.emploisStables)],
    ["FRNG", "Ressources stables - Emplois stables", f.frng, true],
    ["BFRE", "Actif exploitation - Passif exploitation", f.bfre],
    ["BFRHE", "Actif hors exploitation - Passif hors exploitation", f.bfrhe],
    ["BFR", "BFRE + BFRHE", f.bfr, true],
    ["Trésorerie nette", "FRNG - BFR", f.tn, true],
    ["Contrôle trésorerie", "Trésorerie actif - Trésorerie passif", f.tnDirect]
  ];
  renderTable("functionalTable", ["Élément", "Formule", "Montant"], rows.map(([a,b,c,total]) => [a,b,c,total]));
}

function renderFinancial(fin) {
  const rows = [
    ["Actifs courants", "", n(state.actifsCourants)],
    ["Passifs courants", "", n(state.passifsCourants)],
    ["Liquidité générale", "Actifs courants / Passifs courants", fin.liquiditeGenerale, true, "x"],
    ["Liquidité réduite", "(Actifs courants - Stocks) / Passifs courants", fin.liquiditeReduite, true, "x"],
    ["Solvabilité générale", "Total actif / Total dettes", fin.solvabilite, false, "x"],
    ["Autonomie financière", "Capitaux propres / Total passif", fin.autonomie, false, "%"],
    ["Endettement", "Total dettes / Capitaux propres", fin.endettement, false, "x"],
    ["Couverture immobilisations", "Capitaux permanents / Emplois stables", fin.couvertureImmobilisations, false, "x"]
  ];
  const body = rows.map(([a,b,c,total,unit]) => [a,b,unit === "%" ? c * 100 : c,total,unit]);
  renderTable("financialTable", ["Élément", "Formule", "Valeur"], body, (value, unit) => unit === "%" ? pct(value) : unit === "x" ? ratio(value) + "x" : money(value));
}

function renderSIG(sig) {
  const rows = [
    ["Coût d’achat revendu", "Achats marchandises + Variation stock", sig.achatsRev],
    ["Marge commerciale", "Ventes marchandises - Coût d’achat revendu", sig.margeCommerciale, true],
    ["Production de l’exercice", "Vendue + Stockée + Immobilisée", sig.production],
    ["Valeur ajoutée", "Marge commerciale + Production - Consommations", sig.valeurAjoutee, true],
    ["EBE", "VA + Subventions - Impôts - Personnel", sig.ebe, true],
    ["Résultat d’exploitation", "EBE + Reprises + Autres produits - Dotations - Autres charges", sig.rex, true],
    ["Résultat financier", "Produits financiers - Charges financières", sig.resultatFinancier],
    ["RCAI", "Résultat exploitation + Résultat financier", sig.rcai, true],
    ["Résultat non courant", "Produits non courants - Charges non courantes", sig.resultatNonCourant],
    ["Résultat net", "RCAI + Non courant - Impôt", sig.resultatNet, true],
    ["CAF", "Résultat net + Dotations - Reprises", sig.caf, true]
  ];
  renderTable("sigTable", ["Solde", "Formule", "Montant"], rows);
}

function renderRatios(sig, functional, fin) {
  const ca = n(state.ventesMarchandises) + n(state.productionVendue);
  const ratios = [
    ["Marge nette", fin.margeNette * 100, "%", "Résultat net / Chiffre d’affaires"],
    ["Marge EBE", fin.margeEbe * 100, "%", "EBE / Chiffre d’affaires"],
    ["ROE", fin.roe * 100, "%", "Résultat net / Capitaux propres"],
    ["ROA", fin.roa * 100, "%", "Résultat net / Total actif"],
    ["Liquidité générale", fin.liquiditeGenerale, "x", "Actifs courants / Passifs courants"],
    ["Liquidité réduite", fin.liquiditeReduite, "x", "Actifs courants hors stocks / Passifs courants"],
    ["Autonomie", fin.autonomie * 100, "%", "Capitaux propres / Total passif"],
    ["Endettement", fin.endettement, "x", "Total dettes / Capitaux propres"],
    ["CAF / Dettes financières", fin.cafDettes * 100, "%", "CAF / Dettes financières"],
    ["BFR en jours CA", fin.bfrDays, "j", "BFR / CA × 360"],
    ["Délai clients", fin.dso, "j", "Clients / CA × 360"],
    ["Délai fournisseurs", fin.dpo, "j", "Fournisseurs / Achats × 360"]
  ];
  document.getElementById("ratioBoard").innerHTML = ratios.map(([name, value, unit, note]) => {
    const formatted = unit === "%" ? pct(value) : unit === "x" ? ratio(value) + "x" : ratio(value, 0) + unit;
    return `<article class="ratio-card"><h3>${name}</h3><div class="ratio-main"><strong>${formatted.replace(unit === "%" ? " %" : unit, "")}</strong><span>${unit}</span></div><p>${note}</p></article>`;
  }).join("");
}

function renderBreakEven(b) {
  const rows = [
    ["Marge sur coût variable", "CA - Charges variables", b.mcv],
    ["Taux de MCV", "MCV / CA", b.tauxMcv * 100, false, "%"],
    ["Seuil de rentabilité", "Charges fixes / Taux de MCV", b.seuil, true],
    ["Point mort", "Seuil / CA × 360", b.pointMort, false, "j"],
    ["Résultat prévisionnel", "MCV - Charges fixes", b.resultat, true],
    ["Marge unitaire", "Prix unitaire - Coût variable unitaire", b.margeUnitaire],
    ["Quantité critique", "Charges fixes / Marge unitaire", b.quantiteCritique, false, "u"]
  ];
  renderTable("breakEvenTable", ["Élément", "Formule", "Valeur"], rows, formatMixed);
  const progress = clamp(safeDiv(n(state.caBreak), b.seuil) * 100, 0, 160);
  document.getElementById("breakEvenMeter").innerHTML = `<div style="width:${Math.min(progress, 100)}%"></div>`;
}

function renderInvestment(inv) {
  const rows = inv.rows.map(row => [`Année ${row.year}`, money(row.cf), ratio(row.factor, 4), money(row.discounted)]);
  rows.push(["Valeur actuelle", "", "", money(inv.pv), true]);
  rows.push(["VAN", "", "", money(inv.van), true]);
  rows.push(["Indice de profitabilité", "", "", ratio(inv.ip), false]);
  rows.push(["TRI", "", "", pct(inv.tri * 100), false]);
  rows.push(["Délai de récupération", "", "", inv.payback === null ? "Non récupéré" : `${ratio(inv.payback, 2)} années`, false]);
  renderPlainTable("investmentTable", ["Période", "Cash-flow", "Facteur", "Actualisé"], rows);
}

function renderLoan(loan) {
  const rows = loan.rows.map(row => [
    row.year,
    money(row.beginning),
    money(row.annuity),
    money(row.interest),
    money(row.amortization),
    money(row.remaining)
  ]);
  renderPlainTable("loanTable", ["Année", "Capital début", "Annuité", "Intérêt", "Amortissement", "Capital fin"], rows);
}

function renderEvolutionInputs() {
  const head = `<thead><tr><th>Indicateur</th><th class="num">N-2</th><th class="num">N-1</th><th class="num">N</th></tr></thead>`;
  const body = evolutionRows.map(([key, label]) => `
    <tr>
      <td>${label}</td>
      ${[0,1,2].map(i => `<td><input class="evolution-input" data-evo="${key}" data-year="${i}" type="number" step="0.01" value="${state.evolution[key][i]}"></td>`).join("")}
    </tr>
  `).join("");
  document.getElementById("evolutionInputs").innerHTML = head + `<tbody>${body}</tbody>`;
  document.querySelectorAll(".evolution-input").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.evo;
      const year = Number(input.dataset.year);
      state.evolution[key][year] = n(input.value);
      renderEvolution();
    });
  });
}

function renderEvolution() {
  const rows = evolutionRows.map(([key, label]) => {
    const values = state.evolution[key];
    const growth1 = safeDiv(values[1] - values[0], values[0]) * 100;
    const growth2 = safeDiv(values[2] - values[1], values[1]) * 100;
    return [label, money(values[0]), money(values[1]), money(values[2]), pct(growth1), pct(growth2)];
  });
  renderPlainTable("evolutionTable", ["Indicateur", "N-2", "N-1", "N", "N-1/N-2", "N/N-1"], rows);
  renderEvolutionChart();
}

function renderEvolutionChart() {
  const chart = document.getElementById("evolutionChart");
  const ca = state.evolution.ca;
  const rn = state.evolution.rn;
  const all = [...ca, ...rn];
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const points = (arr) => arr.map((value, i) => {
    const x = 70 + i * 210;
    const y = 190 - ((value - min) / (max - min || 1)) * 140;
    return `${x},${y}`;
  }).join(" ");
  chart.innerHTML = `
    <svg viewBox="0 0 560 238" preserveAspectRatio="none" role="img" aria-label="Évolution">
      <defs>
        <linearGradient id="lineA" x1="0" x2="1"><stop stop-color="#7dd3fc"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
      </defs>
      <line x1="50" y1="190" x2="530" y2="190" stroke="rgba(255,255,255,.18)"/>
      <line x1="50" y1="50" x2="50" y2="190" stroke="rgba(255,255,255,.18)"/>
      <polyline points="${points(ca)}" fill="none" stroke="url(#lineA)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${points(rn)}" fill="none" stroke="rgba(52,211,153,.9)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="70" y="220" fill="rgba(255,255,255,.62)" font-size="12">N-2</text>
      <text x="280" y="220" fill="rgba(255,255,255,.62)" font-size="12">N-1</text>
      <text x="490" y="220" fill="rgba(255,255,255,.62)" font-size="12">N</text>
      <text x="390" y="34" fill="#7dd3fc" font-size="12">CA</text>
      <text x="430" y="34" fill="#34d399" font-size="12">RN</text>
    </svg>`;
}

function renderTable(id, headers, rows, customFormatter = null) {
  const thead = `<thead><tr>${headers.map((h, i) => `<th class="${i === headers.length - 1 ? "num" : ""}">${h}</th>`).join("")}</tr></thead>`;
  const body = rows.map((row) => {
    const [label, formula, value, total, unit] = row;
    const formatted = customFormatter ? customFormatter(value, unit) : money(value);
    return `<tr class="${total ? "total" : ""}"><td>${label}</td><td>${formula}</td><td class="num ${cssClass(value)}">${formatted}</td></tr>`;
  }).join("");
  document.getElementById(id).innerHTML = thead + `<tbody>${body}</tbody>`;
}

function renderPlainTable(id, headers, rows) {
  const thead = `<thead><tr>${headers.map((h, i) => `<th class="${i > 0 ? "num" : ""}">${h}</th>`).join("")}</tr></thead>`;
  const body = rows.map((row) => {
    const flag = row[row.length - 1];
    const hasFlag = typeof flag === "boolean";
    const total = flag === true;
    const clean = hasFlag ? row.slice(0, -1) : row;
    return `<tr class="${total ? "total" : ""}">${clean.map((cell, i) => `<td class="${i > 0 ? "num" : ""}">${cell}</td>`).join("")}</tr>`;
  }).join("");
  document.getElementById(id).innerHTML = thead + `<tbody>${body}</tbody>`;
}

function formatMixed(value, unit) {
  if (unit === "%") return pct(value);
  if (unit === "j") return `${ratio(value, 1)} jours`;
  if (unit === "u") return `${ratio(value, 0)} unités`;
  return money(value);
}

function bindActions() {
  document.getElementById("saveBtn").addEventListener("click", persist);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("resetBtn").addEventListener("click", () => {
    Object.assign(state, createDefaultState());
    localStorage.removeItem(STORE_KEY);
    renderForms();
    renderEvolutionInputs();
    calculate();
    toast("Réinitialisé");
  });
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analyse-financiere.json";
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const content = await file.text();
      Object.assign(state, createDefaultState(), JSON.parse(content));
      renderForms();
      renderEvolutionInputs();
      calculate();
      toast("Importé");
    } catch (_) {
      toast("Fichier invalide");
    }
    event.target.value = "";
  });
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 1700);
}

hydrate();
bindNavigation();
renderForms();
renderEvolutionInputs();
bindActions();
calculate();
