const STORAGE_KEY = "analyse-financiere-app-v1";

const state = {
  fields: {},
  cashflows: [0, 0, 0, 0],
  evolution: {
    "Chiffre d’affaires": [0, 0, 0],
    "Résultat net": [0, 0, 0],
    "Total actif": [0, 0, 0],
    "Capitaux propres": [0, 0, 0],
    "EBE": [0, 0, 0]
  }
};

const numberFields = new Set([
  "bf_emplois_stables", "bf_ace", "bf_ache", "bf_tresorerie_active", "bf_ressources_stables", "bf_pce", "bf_pche", "bf_tresorerie_passive",
  "bfi_actif_immobilise", "bfi_stocks", "bfi_creances", "bfi_disponibilites", "bfi_capitaux_propres", "bfi_dettes_mlt", "bfi_dettes_ct",
  "sig_ventes_marchandises", "sig_achats_revendus", "sig_production_vendue", "sig_production_stockee", "sig_production_immobilisee", "sig_consommations",
  "sig_subventions", "sig_impots_taxes", "sig_charges_personnel", "sig_autres_produits_exp", "sig_autres_charges_exp", "sig_dotations_exp", "sig_reprises_exp",
  "sig_produits_financiers", "sig_charges_financieres", "sig_produits_non_courants", "sig_charges_non_courants", "sig_impot_resultat", "sig_dotations_caf", "sig_reprises_caf", "sig_produits_cession", "sig_vna_cession",
  "sr_ca", "sr_charges_variables", "sr_charges_fixes", "sr_jours", "inv_initial", "inv_taux", "emp_capital", "emp_taux", "emp_duree"
]);

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function n(key) {
  const value = Number(state.fields[key]);
  return Number.isFinite(value) ? value : 0;
}

function currency() {
  return (state.fields.currency || $("#currencyInput")?.value || "DH").trim() || "DH";
}

function formatMoney(value) {
  const val = Number(value);
  if (!Number.isFinite(val)) return "—";
  return `${val.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency()}`;
}

function formatNumber(value, decimals = 2) {
  const val = Number(value);
  if (!Number.isFinite(val)) return "—";
  return val.toLocaleString("fr-FR", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function formatPercent(value) {
  const val = Number(value);
  if (!Number.isFinite(val)) return "—";
  return `${(val * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

function safeDiv(a, b) {
  const denominator = Number(b);
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) return NaN;
  return Number(a) / denominator;
}

function signClass(value, higherIsBetter = true) {
  const val = Number(value);
  if (!Number.isFinite(val) || Math.abs(val) < 1e-9) return "muted";
  if (higherIsBetter) return val > 0 ? "good" : "bad";
  return val > 0 ? "bad" : "good";
}

function ratioClass(value, goodLimit, warnLimit) {
  const val = Number(value);
  if (!Number.isFinite(val)) return "muted";
  if (val >= goodLimit) return "good";
  if (val >= warnLimit) return "warn";
  return "bad";
}

function row(label, value, formula = "", interpretation = "", options = {}) {
  const display = options.type === "percent" ? formatPercent(value)
    : options.type === "number" ? formatNumber(value)
    : options.type === "raw" ? String(value)
    : formatMoney(value);
  const cls = options.className || "";
  return { label, value, display, formula, interpretation, className: cls };
}

function renderTable(selector, columns, rows) {
  const table = $(selector);
  if (!table) return;
  table.innerHTML = `
    <thead><tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map(r => `
        <tr>
          <td>${r.label ?? ""}</td>
          <td class="result-value ${r.className ?? ""}">${r.display ?? ""}</td>
          <td>${r.formula ?? ""}</td>
          <td>${r.interpretation ?? ""}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
}

function renderSimpleTable(selector, columns, rows) {
  const table = $(selector);
  if (!table) return;
  table.innerHTML = `
    <thead><tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(cols => `<tr>${cols.map(col => `<td>${col}</td>`).join("")}</tr>`).join("")}</tbody>
  `;
}

function bilanFonctionnel() {
  const frng = n("bf_ressources_stables") - n("bf_emplois_stables");
  const bfre = n("bf_ace") - n("bf_pce");
  const bfrhe = n("bf_ache") - n("bf_pche");
  const bfr = bfre + bfrhe;
  const tn = n("bf_tresorerie_active") - n("bf_tresorerie_passive");
  const check = frng - bfr;
  return { frng, bfre, bfrhe, bfr, tn, check };
}

function bilanFinancier() {
  const actifCirculant = n("bfi_stocks") + n("bfi_creances") + n("bfi_disponibilites");
  const totalActif = n("bfi_actif_immobilise") + actifCirculant;
  const capitauxPermanents = n("bfi_capitaux_propres") + n("bfi_dettes_mlt");
  const totalDettes = n("bfi_dettes_mlt") + n("bfi_dettes_ct");
  const passif = n("bfi_capitaux_propres") + totalDettes;
  const fdr = capitauxPermanents - n("bfi_actif_immobilise");
  const liquiditeGenerale = safeDiv(actifCirculant, n("bfi_dettes_ct"));
  const liquiditeReduite = safeDiv(n("bfi_creances") + n("bfi_disponibilites"), n("bfi_dettes_ct"));
  const liquiditeImmediate = safeDiv(n("bfi_disponibilites"), n("bfi_dettes_ct"));
  const autonomie = safeDiv(n("bfi_capitaux_propres"), passif || totalActif);
  const endettement = safeDiv(totalDettes, n("bfi_capitaux_propres"));
  return { actifCirculant, totalActif, capitauxPermanents, totalDettes, passif, fdr, liquiditeGenerale, liquiditeReduite, liquiditeImmediate, autonomie, endettement };
}

function sig() {
  const margeCommerciale = n("sig_ventes_marchandises") - n("sig_achats_revendus");
  const production = n("sig_production_vendue") + n("sig_production_stockee") + n("sig_production_immobilisee");
  const ca = n("sig_ventes_marchandises") + n("sig_production_vendue");
  const valeurAjoutee = margeCommerciale + production - n("sig_consommations");
  const ebe = valeurAjoutee + n("sig_subventions") - n("sig_impots_taxes") - n("sig_charges_personnel");
  const rex = ebe + n("sig_autres_produits_exp") + n("sig_reprises_exp") - n("sig_autres_charges_exp") - n("sig_dotations_exp");
  const resultatFinancier = n("sig_produits_financiers") - n("sig_charges_financieres");
  const rcai = rex + resultatFinancier;
  const resultatNonCourant = n("sig_produits_non_courants") - n("sig_charges_non_courants");
  const resultatAvantImpot = rcai + resultatNonCourant;
  const resultatNet = resultatAvantImpot - n("sig_impot_resultat");
  const caf = resultatNet + n("sig_dotations_caf") - n("sig_reprises_caf") + n("sig_vna_cession") - n("sig_produits_cession");
  return { margeCommerciale, production, ca, valeurAjoutee, ebe, rex, resultatFinancier, rcai, resultatNonCourant, resultatAvantImpot, resultatNet, caf };
}

function seuilRentabilite() {
  const ca = n("sr_ca");
  const cv = n("sr_charges_variables");
  const cf = n("sr_charges_fixes");
  const jours = n("sr_jours") || 360;
  const mcv = ca - cv;
  const tauxMcv = safeDiv(mcv, ca);
  const sr = safeDiv(cf, tauxMcv);
  const margeSecurite = ca - sr;
  const indiceSecurite = safeDiv(margeSecurite, ca);
  const pointMort = safeDiv(sr, ca) * jours;
  return { ca, cv, cf, mcv, tauxMcv, sr, margeSecurite, indiceSecurite, pointMort };
}

function npv(initial, rate, flows) {
  return flows.reduce((sum, cf, idx) => sum + cf / Math.pow(1 + rate, idx + 1), -initial);
}

function irr(initial, flows) {
  let low = -0.9999;
  let high = 10;
  let lowVal = npv(initial, low, flows);
  let highVal = npv(initial, high, flows);
  if (!Number.isFinite(lowVal) || !Number.isFinite(highVal) || lowVal * highVal > 0) return NaN;
  for (let i = 0; i < 120; i += 1) {
    const mid = (low + high) / 2;
    const midVal = npv(initial, mid, flows);
    if (Math.abs(midVal) < 1e-7) return mid;
    if (lowVal * midVal <= 0) {
      high = mid;
      highVal = midVal;
    } else {
      low = mid;
      lowVal = midVal;
    }
  }
  return (low + high) / 2;
}

function payback(initial, flows) {
  let cumulative = -initial;
  for (let i = 0; i < flows.length; i += 1) {
    const before = cumulative;
    cumulative += flows[i];
    if (cumulative >= 0) {
      const missing = Math.abs(before);
      const fraction = flows[i] === 0 ? 0 : missing / flows[i];
      return i + fraction;
    }
  }
  return NaN;
}

function investissement() {
  const initial = n("inv_initial");
  const rate = n("inv_taux") / 100;
  const flows = state.cashflows.map(Number).filter(v => Number.isFinite(v));
  const van = npv(initial, rate, flows);
  const tri = irr(initial, flows);
  const vaFlux = flows.reduce((sum, cf, idx) => sum + cf / Math.pow(1 + rate, idx + 1), 0);
  const ip = safeDiv(vaFlux, initial);
  const dr = payback(initial, flows);
  return { initial, rate, flows, van, tri, vaFlux, ip, dr };
}

function emprunt() {
  const capital = n("emp_capital");
  const rate = n("emp_taux") / 100;
  const years = Math.max(0, Math.round(n("emp_duree")));
  const methode = state.fields.emp_methode || "annuite";
  const rows = [];
  let remaining = capital;
  let totalInterest = 0;
  let totalPaid = 0;

  if (capital <= 0 || years <= 0) return { rows, totalInterest, totalPaid, annuity: 0 };

  const annuity = rate === 0 ? capital / years : capital * rate / (1 - Math.pow(1 + rate, -years));
  const amortConst = capital / years;

  for (let year = 1; year <= years; year += 1) {
    const interest = remaining * rate;
    const amortization = methode === "amortissement" ? amortConst : annuity - interest;
    const payment = methode === "amortissement" ? amortization + interest : annuity;
    const end = Math.max(0, remaining - amortization);
    totalInterest += interest;
    totalPaid += payment;
    rows.push({ year, beginning: remaining, interest, amortization, payment, end });
    remaining = end;
  }
  return { rows, totalInterest, totalPaid, annuity: methode === "annuite" ? annuity : 0 };
}

function renderBilanFonctionnel() {
  const b = bilanFonctionnel();
  renderTable("#bilanFonctionnelTable", ["Élément", "Montant", "Formule", "Lecture"], [
    row("FRNG", b.frng, "Ressources stables − Emplois stables", b.frng >= 0 ? "Ressources stables suffisantes." : "Risque de financement des immobilisations.", { className: signClass(b.frng) }),
    row("BFRE", b.bfre, "Actif circ. exploitation − Passif circ. exploitation", b.bfre >= 0 ? "Besoin lié au cycle d’exploitation." : "Excédent d’exploitation.", { className: signClass(b.bfre, false) }),
    row("BFRHE", b.bfrhe, "Actif hors exploitation − Passif hors exploitation", "Besoin ou ressource hors exploitation.", { className: signClass(b.bfrhe, false) }),
    row("BFR total", b.bfr, "BFRE + BFRHE", b.bfr >= 0 ? "Besoin global à financer." : "Ressource globale dégagée.", { className: signClass(b.bfr, false) }),
    row("Trésorerie nette", b.tn, "Trésorerie active − Trésorerie passive", b.tn >= 0 ? "Trésorerie positive." : "Trésorerie négative.", { className: signClass(b.tn) }),
    row("Contrôle FRNG − BFR", b.check, "Doit être proche de la TN", Math.abs(b.check - b.tn) < 0.01 ? "Équilibre vérifié." : "Écart avec la TN saisie : vérifier les montants.", { className: Math.abs(b.check - b.tn) < 0.01 ? "good" : "warn" })
  ]);
}

function renderBilanFinancier() {
  const b = bilanFinancier();
  renderTable("#bilanFinancierTable", ["Élément", "Valeur", "Formule", "Lecture"], [
    row("Total actif", b.totalActif, "Actif immobilisé + stocks + créances + disponibilités", "Taille du bilan."),
    row("Total dettes", b.totalDettes, "Dettes M/LT + Dettes CT", "Endettement global."),
    row("Fonds de roulement financier", b.fdr, "Capitaux permanents − Actif immobilisé", b.fdr >= 0 ? "Couverture correcte des immobilisations." : "Financement long insuffisant.", { className: signClass(b.fdr) }),
    row("Liquidité générale", b.liquiditeGenerale, "Actif circulant / Dettes CT", b.liquiditeGenerale >= 1 ? "Actif court terme couvre les dettes CT." : "Tension potentielle à court terme.", { type: "number", className: ratioClass(b.liquiditeGenerale, 1, 0.8) }),
    row("Liquidité réduite", b.liquiditeReduite, "Créances + disponibilités / Dettes CT", "Mesure sans les stocks.", { type: "number", className: ratioClass(b.liquiditeReduite, 0.8, 0.5) }),
    row("Liquidité immédiate", b.liquiditeImmediate, "Disponibilités / Dettes CT", "Capacité à payer immédiatement.", { type: "number", className: ratioClass(b.liquiditeImmediate, 0.3, 0.1) }),
    row("Autonomie financière", b.autonomie, "Capitaux propres / Total passif", "Part financée par les fonds propres.", { type: "percent", className: ratioClass(b.autonomie, 0.35, 0.2) }),
    row("Ratio d’endettement", b.endettement, "Total dettes / Capitaux propres", "Plus il est élevé, plus la dépendance aux dettes augmente.", { type: "number", className: b.endettement <= 1 ? "good" : b.endettement <= 2 ? "warn" : "bad" })
  ]);
}

function renderSig() {
  const s = sig();
  renderTable("#sigTable", ["SIG", "Montant", "Formule", "Lecture"], [
    row("Marge commerciale", s.margeCommerciale, "Ventes marchandises − Achats revendus", "Marge sur activité commerciale.", { className: signClass(s.margeCommerciale) }),
    row("Production de l’exercice", s.production, "Production vendue + stockée + immobilisée", "Niveau de production."),
    row("Chiffre d’affaires", s.ca, "Ventes marchandises + production vendue", "Activité vendue."),
    row("Valeur ajoutée", s.valeurAjoutee, "Marge commerciale + Production − Consommations", "Richesse créée par l’entreprise.", { className: signClass(s.valeurAjoutee) }),
    row("EBE", s.ebe, "VA + Subventions − Impôts/taxes − Personnel", "Performance pure d’exploitation.", { className: signClass(s.ebe) }),
    row("Résultat d’exploitation", s.rex, "EBE + produits/reprises − charges/dotations", "Résultat de l’activité normale.", { className: signClass(s.rex) }),
    row("Résultat financier", s.resultatFinancier, "Produits financiers − Charges financières", "Impact du financement et placements.", { className: signClass(s.resultatFinancier) }),
    row("Résultat courant avant impôt", s.rcai, "Résultat exploitation + Résultat financier", "Résultat récurrent avant impôt.", { className: signClass(s.rcai) }),
    row("Résultat non courant", s.resultatNonCourant, "Produits non courants − Charges non courantes", "Éléments exceptionnels / non courants.", { className: signClass(s.resultatNonCourant) }),
    row("Résultat net", s.resultatNet, "Résultat avant impôt − Impôt", "Résultat final de l’exercice.", { className: signClass(s.resultatNet) }),
    row("CAF", s.caf, "RN + dotations − reprises + VNA cédée − produits de cession", "Capacité de financement générée.", { className: signClass(s.caf) })
  ]);
}

function renderRatios() {
  const s = sig();
  const b = bilanFinancier();
  const bf = bilanFonctionnel();
  const ratios = [
    row("Marge nette", safeDiv(s.resultatNet, s.ca), "Résultat net / CA", "Rentabilité finale des ventes.", { type: "percent", className: signClass(safeDiv(s.resultatNet, s.ca)) }),
    row("Taux d’EBE", safeDiv(s.ebe, s.ca), "EBE / CA", "Performance d’exploitation avant amortissements.", { type: "percent", className: signClass(safeDiv(s.ebe, s.ca)) }),
    row("Taux de valeur ajoutée", safeDiv(s.valeurAjoutee, s.ca), "VA / CA", "Richesse créée par rapport au CA.", { type: "percent", className: signClass(safeDiv(s.valeurAjoutee, s.ca)) }),
    row("ROE", safeDiv(s.resultatNet, n("bfi_capitaux_propres")), "Résultat net / Capitaux propres", "Rentabilité des fonds propres.", { type: "percent", className: signClass(safeDiv(s.resultatNet, n("bfi_capitaux_propres"))) }),
    row("ROA", safeDiv(s.resultatNet, b.totalActif), "Résultat net / Total actif", "Rentabilité économique de l’actif.", { type: "percent", className: signClass(safeDiv(s.resultatNet, b.totalActif)) }),
    row("Rotation de l’actif", safeDiv(s.ca, b.totalActif), "CA / Total actif", "Efficacité d’utilisation des actifs.", { type: "number", className: ratioClass(safeDiv(s.ca, b.totalActif), 1, 0.5) }),
    row("BFR en jours de CA", safeDiv(bf.bfr, s.ca) * 360, "BFR / CA × 360", "Nombre de jours de CA immobilisés dans le BFR.", { type: "number", className: Number.isFinite(safeDiv(bf.bfr, s.ca)) && safeDiv(bf.bfr, s.ca) * 360 <= 90 ? "good" : "warn" }),
    row("CAF / Dettes", safeDiv(s.caf, b.totalDettes), "CAF / Total dettes", "Capacité théorique de remboursement.", { type: "percent", className: ratioClass(safeDiv(s.caf, b.totalDettes), 0.25, 0.1) })
  ];
  renderTable("#ratiosTable", ["Ratio", "Valeur", "Formule", "Lecture"], ratios);
}

function renderRentabilite() {
  const sr = seuilRentabilite();
  renderTable("#rentabiliteTable", ["Élément", "Valeur", "Formule", "Lecture"], [
    row("Marge sur coût variable", sr.mcv, "CA − Charges variables", "Marge qui couvre les charges fixes.", { className: signClass(sr.mcv) }),
    row("Taux de MCV", sr.tauxMcv, "MCV / CA", "Pourcentage de CA disponible après charges variables.", { type: "percent", className: signClass(sr.tauxMcv) }),
    row("Seuil de rentabilité", sr.sr, "Charges fixes / Taux MCV", "CA minimum pour résultat nul.", { className: signClass(sr.sr) }),
    row("Marge de sécurité", sr.margeSecurite, "CA − SR", sr.margeSecurite >= 0 ? "Zone de sécurité positive." : "CA insuffisant pour atteindre le seuil.", { className: signClass(sr.margeSecurite) }),
    row("Indice de sécurité", sr.indiceSecurite, "Marge sécurité / CA", "Part de CA qui peut baisser avant perte.", { type: "percent", className: signClass(sr.indiceSecurite) }),
    row("Point mort", sr.pointMort, "SR / CA × jours", "Jour approximatif où le seuil est atteint.", { type: "number", className: Number.isFinite(sr.pointMort) && sr.pointMort <= (n("sr_jours") || 360) ? "good" : "warn" })
  ]);
}

function renderCashflowInputs() {
  const tbody = $("#cashflowInputTable tbody");
  if (!tbody) return;
  tbody.innerHTML = state.cashflows.map((cf, index) => `
    <tr>
      <td>Année ${index + 1}</td>
      <td><input type="number" step="0.01" value="${Number(cf) || 0}" data-cf-index="${index}" /></td>
      <td><button class="icon-btn" type="button" data-remove-cf="${index}" aria-label="Supprimer">×</button></td>
    </tr>
  `).join("");

  $all("[data-cf-index]").forEach(input => {
    input.addEventListener("input", event => {
      const idx = Number(event.target.dataset.cfIndex);
      state.cashflows[idx] = Number(event.target.value) || 0;
      renderAll();
    });
  });

  $all("[data-remove-cf]").forEach(btn => {
    btn.addEventListener("click", event => {
      const idx = Number(event.target.dataset.removeCf);
      state.cashflows.splice(idx, 1);
      renderAll();
    });
  });
}

function renderInvestissement() {
  const inv = investissement();
  renderTable("#investissementTable", ["Élément", "Valeur", "Formule", "Lecture"], [
    row("Valeur actuelle des flux", inv.vaFlux, "Σ CF actualisés", "Valeur actuelle des cash-flows futurs."),
    row("VAN", inv.van, "VA des flux − Investissement initial", inv.van >= 0 ? "Projet créateur de valeur." : "Projet destructeur de valeur.", { className: signClass(inv.van) }),
    row("TRI", inv.tri, "Taux qui annule la VAN", Number.isFinite(inv.tri) ? (inv.tri >= inv.rate ? "TRI supérieur au taux exigé." : "TRI inférieur au taux exigé.") : "TRI non calculable avec ces flux.", { type: "percent", className: Number.isFinite(inv.tri) && inv.tri >= inv.rate ? "good" : "warn" }),
    row("Indice de profitabilité", inv.ip, "VA des flux / Investissement", inv.ip >= 1 ? "Projet acceptable selon IP." : "IP inférieur à 1.", { type: "number", className: ratioClass(inv.ip, 1, 0.8) }),
    row("Délai de récupération", inv.dr, "Moment où les flux cumulés remboursent I0", Number.isFinite(inv.dr) ? `Environ ${formatNumber(inv.dr)} année(s).` : "Non récupéré sur la période.", { type: "number", className: Number.isFinite(inv.dr) ? "good" : "warn" })
  ]);
}

function renderEmprunt() {
  const e = emprunt();
  renderTable("#empruntSummaryTable", ["Élément", "Valeur", "Formule", "Lecture"], [
    row("Total intérêts", e.totalInterest, "Σ intérêts", "Coût financier de l’emprunt.", { className: signClass(e.totalInterest, false) }),
    row("Total payé", e.totalPaid, "Capital + intérêts", "Total des décaissements."),
    row("Annuité constante", e.annuity, "C × i / (1 − (1+i)^−n)", state.fields.emp_methode === "amortissement" ? "Non utilisée avec amortissements constants." : "Paiement annuel constant.")
  ]);

  const rows = e.rows.map(r => [
    r.year,
    formatMoney(r.beginning),
    formatMoney(r.interest),
    formatMoney(r.amortization),
    formatMoney(r.payment),
    formatMoney(r.end)
  ]);
  renderSimpleTable("#empruntTable", ["Année", "Capital début", "Intérêt", "Amortissement", "Annuité", "Capital fin"], rows.length ? rows : [["—", "—", "—", "—", "—", "—"]]);
}

function renderEvolutionInputs() {
  const tbody = $("#evolutionInputTable tbody");
  if (!tbody) return;
  tbody.innerHTML = Object.entries(state.evolution).map(([label, values]) => `
    <tr>
      <td>${label}</td>
      ${values.map((value, idx) => `<td><input type="number" step="0.01" value="${Number(value) || 0}" data-evo-label="${label}" data-evo-index="${idx}" /></td>`).join("")}
    </tr>
  `).join("");

  $all("[data-evo-label]").forEach(input => {
    input.addEventListener("input", event => {
      const label = event.target.dataset.evoLabel;
      const index = Number(event.target.dataset.evoIndex);
      state.evolution[label][index] = Number(event.target.value) || 0;
      renderAll();
    });
  });
}

function renderEvolution() {
  const rows = Object.entries(state.evolution).map(([label, values]) => {
    const [n2, n1, current] = values.map(Number);
    const evo1 = safeDiv(n1 - n2, n2);
    const evo2 = safeDiv(current - n1, n1);
    const absolute = current - n2;
    return [
      label,
      formatMoney(n2),
      formatMoney(n1),
      formatMoney(current),
      `<span class="${signClass(evo1)}">${formatPercent(evo1)}</span>`,
      `<span class="${signClass(evo2)}">${formatPercent(evo2)}</span>`,
      `<span class="${signClass(absolute)}">${formatMoney(absolute)}</span>`
    ];
  });
  renderSimpleTable("#evolutionTable", ["Indicateur", "N-2", "N-1", "N", "Évolution N-1/N-2", "Évolution N/N-1", "Variation absolue N/N-2"], rows);
}

function renderDashboard() {
  const bf = bilanFonctionnel();
  const s = sig();
  const b = bilanFinancier();
  const sr = seuilRentabilite();
  const inv = investissement();
  const kpis = [
    { label: "FRNG", value: formatMoney(bf.frng), note: bf.frng >= 0 ? "Structure stable" : "À renforcer", cls: signClass(bf.frng) },
    { label: "BFR", value: formatMoney(bf.bfr), note: bf.bfr >= 0 ? "Besoin à financer" : "Ressource dégagée", cls: signClass(bf.bfr, false) },
    { label: "Résultat net", value: formatMoney(s.resultatNet), note: s.resultatNet >= 0 ? "Bénéfice" : "Perte", cls: signClass(s.resultatNet) },
    { label: "CAF", value: formatMoney(s.caf), note: s.caf >= 0 ? "Autofinancement positif" : "CAF négative", cls: signClass(s.caf) },
    { label: "Liquidité générale", value: formatNumber(b.liquiditeGenerale), note: b.liquiditeGenerale >= 1 ? "Court terme couvert" : "Tension CT", cls: ratioClass(b.liquiditeGenerale, 1, 0.8) },
    { label: "Marge nette", value: formatPercent(safeDiv(s.resultatNet, s.ca)), note: "Résultat net / CA", cls: signClass(safeDiv(s.resultatNet, s.ca)) },
    { label: "Seuil de rentabilité", value: formatMoney(sr.sr), note: "CA minimum", cls: Number.isFinite(sr.sr) ? "muted" : "warn" },
    { label: "VAN", value: formatMoney(inv.van), note: inv.van >= 0 ? "Projet favorable" : "Projet défavorable", cls: signClass(inv.van) }
  ];

  $("#dashboardKpis").innerHTML = kpis.map(k => `
    <article class="kpi-card">
      <small>${k.label}</small>
      <strong class="${k.cls}">${k.value}</strong>
      <span>${k.note}</span>
    </article>
  `).join("");

  const comments = [];
  if (bf.frng < 0) comments.push("Le FRNG est négatif : les ressources stables ne couvrent pas les emplois stables.");
  if (bf.tn < 0) comments.push("La trésorerie nette est négative : l’entreprise dépend probablement du financement bancaire court terme.");
  if (s.resultatNet < 0) comments.push("Le résultat net est négatif : il faut analyser l’exploitation, les charges financières et les éléments non courants.");
  if (b.liquiditeGenerale < 1 && Number.isFinite(b.liquiditeGenerale)) comments.push("La liquidité générale est inférieure à 1 : attention à la capacité de paiement à court terme.");
  if (inv.van >= 0 && n("inv_initial") > 0) comments.push("La VAN est positive : l’investissement semble rentable au taux choisi.");
  if (!comments.length) comments.push("Remplis les champs pour obtenir une lecture automatique. Les indicateurs favorables apparaissent en vert, les points sensibles en orange ou rouge.");
  $("#globalComment").innerHTML = `<strong>Lecture rapide :</strong> ${comments.join(" ")}`;
}

function renderAll() {
  renderBilanFonctionnel();
  renderBilanFinancier();
  renderSig();
  renderRatios();
  renderRentabilite();
  renderCashflowInputs();
  renderInvestissement();
  renderEmprunt();
  renderEvolutionInputs();
  renderEvolution();
  renderDashboard();
}

function bindInputs() {
  $all("[data-field]").forEach(input => {
    const key = input.dataset.field;
    if (state.fields[key] !== undefined) {
      input.value = state.fields[key];
    }
    input.addEventListener("input", event => {
      state.fields[key] = numberFields.has(key) ? Number(event.target.value) || 0 : event.target.value;
      renderAll();
    });
    input.addEventListener("change", event => {
      state.fields[key] = numberFields.has(key) ? Number(event.target.value) || 0 : event.target.value;
      renderAll();
    });
  });

  const currencyInput = $("#currencyInput");
  const companyInput = $("#companyInput");
  const periodInput = $("#periodInput");
  [currencyInput, companyInput, periodInput].forEach(input => {
    if (!input) return;
    const key = input.id.replace("Input", "");
    if (state.fields[key]) input.value = state.fields[key];
    input.addEventListener("input", () => {
      state.fields[key] = input.value;
      renderAll();
    });
  });
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  toast("Dossier sauvegardé.");
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(state.fields, parsed.fields || {});
    state.cashflows = Array.isArray(parsed.cashflows) ? parsed.cashflows : state.cashflows;
    state.evolution = parsed.evolution || state.evolution;
  } catch (error) {
    console.warn("Impossible de charger la sauvegarde", error);
  }
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = (state.fields.company || "analyse-financiere").toString().trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `${name || "analyse-financiere"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state.fields = parsed.fields || {};
      state.cashflows = Array.isArray(parsed.cashflows) ? parsed.cashflows : [0, 0, 0, 0];
      state.evolution = parsed.evolution || state.evolution;
      $all("[data-field]").forEach(input => {
        const key = input.dataset.field;
        input.value = state.fields[key] ?? "";
      });
      ["currency", "company", "period"].forEach(key => {
        const input = $(`#${key}Input`);
        if (input) input.value = state.fields[key] ?? (key === "currency" ? "DH" : "");
      });
      renderAll();
      toast("Fichier importé.");
    } catch (error) {
      toast("Fichier JSON invalide.");
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm("Effacer toutes les données du dossier ?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state.fields = {};
  state.cashflows = [0, 0, 0, 0];
  state.evolution = {
    "Chiffre d’affaires": [0, 0, 0],
    "Résultat net": [0, 0, 0],
    "Total actif": [0, 0, 0],
    "Capitaux propres": [0, 0, 0],
    "EBE": [0, 0, 0]
  };
  $all("input").forEach(input => {
    if (input.type !== "file") input.value = input.id === "currencyInput" ? "DH" : "";
  });
  $all("select[data-field]").forEach(select => { select.selectedIndex = 0; });
  state.fields.currency = "DH";
  renderAll();
  toast("Dossier réinitialisé.");
}

function toast(message) {
  const existing = $(".toast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function fillDemo() {
  state.fields = {
    currency: "DH",
    company: "Exemple SA",
    period: "Exercice N",
    bf_emplois_stables: 820000,
    bf_ace: 360000,
    bf_ache: 50000,
    bf_tresorerie_active: 70000,
    bf_ressources_stables: 980000,
    bf_pce: 210000,
    bf_pche: 35000,
    bf_tresorerie_passive: 25000,
    bfi_actif_immobilise: 780000,
    bfi_stocks: 160000,
    bfi_creances: 220000,
    bfi_disponibilites: 70000,
    bfi_capitaux_propres: 560000,
    bfi_dettes_mlt: 420000,
    bfi_dettes_ct: 250000,
    sig_ventes_marchandises: 600000,
    sig_achats_revendus: 370000,
    sig_production_vendue: 900000,
    sig_production_stockee: 20000,
    sig_production_immobilisee: 0,
    sig_consommations: 430000,
    sig_subventions: 0,
    sig_impots_taxes: 35000,
    sig_charges_personnel: 270000,
    sig_autres_produits_exp: 10000,
    sig_autres_charges_exp: 22000,
    sig_dotations_exp: 65000,
    sig_reprises_exp: 8000,
    sig_produits_financiers: 7000,
    sig_charges_financieres: 32000,
    sig_produits_non_courants: 5000,
    sig_charges_non_courants: 9000,
    sig_impot_resultat: 41000,
    sig_dotations_caf: 70000,
    sig_reprises_caf: 10000,
    sig_produits_cession: 0,
    sig_vna_cession: 0,
    sr_ca: 1500000,
    sr_charges_variables: 850000,
    sr_charges_fixes: 360000,
    sr_jours: 360,
    inv_initial: 300000,
    inv_taux: 10,
    emp_capital: 250000,
    emp_taux: 6,
    emp_duree: 5,
    emp_methode: "annuite"
  };
  state.cashflows = [90000, 95000, 105000, 110000, 120000];
  state.evolution = {
    "Chiffre d’affaires": [1200000, 1380000, 1500000],
    "Résultat net": [72000, 91000, 112000],
    "Total actif": [1050000, 1160000, 1230000],
    "Capitaux propres": [470000, 520000, 560000],
    "EBE": [230000, 280000, 305000]
  };
  $all("[data-field]").forEach(input => {
    const key = input.dataset.field;
    input.value = state.fields[key] ?? "";
  });
  $("#currencyInput").value = state.fields.currency;
  $("#companyInput").value = state.fields.company;
  $("#periodInput").value = state.fields.period;
  renderAll();
  toast("Exemple chargé.");
}

function setup() {
  load();
  if (!state.fields.currency) state.fields.currency = "DH";
  bindInputs();
  renderAll();

  $("#saveBtn")?.addEventListener("click", save);
  $("#saveBtn2")?.addEventListener("click", save);
  $("#printBtn")?.addEventListener("click", () => window.print());
  $("#downloadJsonBtn")?.addEventListener("click", downloadJson);
  $("#importJsonInput")?.addEventListener("change", event => importJson(event.target.files?.[0]));
  $("#resetBtn")?.addEventListener("click", resetAll);
  $("#addCfRow")?.addEventListener("click", () => {
    state.cashflows.push(0);
    renderAll();
  });
  $("#clearCfRows")?.addEventListener("click", () => {
    state.cashflows = [];
    renderAll();
  });
  $("[data-fill-demo]")?.addEventListener("click", fillDemo);
}

document.addEventListener("DOMContentLoaded", setup);
