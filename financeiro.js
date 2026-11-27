(() => {
  'use strict';

  const CLOUD_STORAGE_KEY = 'drakars_finance_cloud_v1';
  const OFFLINE_STORAGE_KEY = 'drakars_finance_local_fallback_v1';

  const DEFAULT_PHOTOS = {
    his: './assets/finance/avatar-ele.jpg',
    her: './assets/finance/avatar-ela.jpg',
    couple: './assets/finance/avatar-casal.jpg',
    travel: './assets/finance/goal-viagem.jpg',
    house: './assets/finance/goal-casa.jpg',
    emergency: './assets/finance/goal-reserva.jpg',
  };

  const BANKS = [
    { key: 'nubank', name: 'Nubank', short: 'Nu', bg: '#820AD1', fg: '#FFF' },
    { key: 'itau', name: 'Itaú', short: 'Itaú', bg: '#EC7000', fg: '#FFF' },
    { key: 'bradesco', name: 'Bradesco', short: 'Brad', bg: '#CC092F', fg: '#FFF' },
    { key: 'santander', name: 'Santander', short: 'Sant', bg: '#EC0000', fg: '#FFF' },
    { key: 'bb', name: 'Banco do Brasil', short: 'BB', bg: '#FFCC00', fg: '#0038A8' },
    { key: 'caixa', name: 'Caixa', short: 'Caixa', bg: '#005CA9', fg: '#FFF' },
    { key: 'inter', name: 'Inter', short: 'Inter', bg: '#FF7A00', fg: '#FFF' },
    { key: 'c6', name: 'C6 Bank', short: 'C6', bg: '#1D1D21', fg: '#FFF' },
    { key: 'btg', name: 'BTG Pactual', short: 'BTG', bg: '#001E62', fg: '#FFF' },
    { key: 'xp', name: 'XP Investimentos', short: 'XP', bg: '#111111', fg: '#FFCC00' },
    { key: 'mercadopago', name: 'Mercado Pago', short: 'MP', bg: '#009EE3', fg: '#FFF' },
    { key: 'picpay', name: 'PicPay', short: 'Pic', bg: '#11C76F', fg: '#FFF' },
    { key: 'sicredi', name: 'Sicredi', short: 'Sicr', bg: '#3FA110', fg: '#FFF' },
    { key: 'sicoob', name: 'Sicoob', short: 'Sicoob', bg: '#003641', fg: '#FFF' },
    { key: 'neon', name: 'Neon', short: 'Neon', bg: '#00A8E8', fg: '#FFF' },
    { key: 'pagbank', name: 'PagBank', short: 'Pag', bg: '#00A859', fg: '#FFF' },
    { key: 'will', name: 'Will Bank', short: 'Will', bg: '#F7D000', fg: '#111' },
    { key: 'stone', name: 'Stone', short: 'Stone', bg: '#00A868', fg: '#FFF' },
    { key: 'other', name: 'Outro / Carteira', short: 'R$', bg: '#8C3320', fg: '#FFF' },
  ];

  const CATEGORIES = [
    'Moradia',
    'Mercado',
    'Alimentação',
    'Contas',
    'Transporte',
    'Saúde',
    'Lazer',
    'Casa',
    'Compras',
    'Educação',
    'Salário',
    'Renda Extra',
    'Investimento',
    'Outros',
  ];

  const DONUT_COLORS = ['#B6492D', '#E8834A', '#F3B452', '#2E7D6B', '#547AA5', '#9D6B8E', '#8B7166'];

  const qs = new URLSearchParams(window.location.search);
  const localToken = qs.get('token') || '';

  const ui = {
    tab: 'dashboard',
    scope: 'casal', // 'casal' | 'eu' | 'esposa'
    monthKey: currentMonthKey(),
    syncMode: 'offline', // 'local' | 'cloud' | 'offline'
    cloudCreds: loadCloudCreds(),
    search: '',
    txFilterType: 'all',
    txFilterOwner: 'all',
    sim: {
      item: '',
      amount: '',
      installments: '1',
      owner: 'casal',
      method: 'credit',
      cardId: '',
    },
    simResult: null,
    chat: [
      {
        role: 'bot',
        html: 'Olá! Sou o consultor financeiro de vocês. Pode simular qualquer compra aqui ou perguntar algo como <strong>"Se eu comprar uma TV de R$ 2.800 em 10x eu me aperto?"</strong>.',
      },
    ],
    drawerOpen: false,
    notifOpen: false,
    loadingAction: false,
  };

  let appState = createStarterState();

  function createStarterState() {
    return {
      updatedAt: Date.now(),
      serverMode: 'offline',
      userName: 'Você',
      partnerName: 'Esposa',
      financeBrandName: 'Nós no Azul',
      hisPhotoDataUrl: '',
      herPhotoDataUrl: '',
      couplePhotoDataUrl: '',
      hasGeminiKey: false,
      cloudFinanceUrl: '',
      transactions: [],
      recurringBills: [],
      fixedIncomes: [],
      savingsGoals: [
        {
          id: 'demo-goal-1',
          title: 'Viagem dos Sonhos',
          targetAmount: 12000,
          currentAmount: 4200,
          icon: '✈️',
          imagePreset: 'travel',
          owner: 'casal',
        },
        {
          id: 'demo-goal-2',
          title: 'Reserva de Emergência',
          targetAmount: 30000,
          currentAmount: 14500,
          icon: '🛡️',
          imagePreset: 'emergency',
          owner: 'casal',
        },
      ],
      bankAccounts: [],
      creditCards: [],
      categoryBudgets: [
        { id: 'b-1', category: 'Moradia', monthlyLimit: 2200 },
        { id: 'b-2', category: 'Mercado', monthlyLimit: 1200 },
        { id: 'b-3', category: 'Alimentação', monthlyLimit: 600 },
        { id: 'b-4', category: 'Lazer', monthlyLimit: 450 },
      ],
      calendarEvents: [],
      shoppingList: [],
    };
  }

  // -------------------- Utilities --------------------
  function uid() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function esc(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }

  function currentMonthKey() {
    return todayIso().slice(0, 7);
  }

  function shiftMonthKey(mKey, delta) {
    const [y, m] = mKey.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function addMonthsIso(dateIso, addMonths) {
    const match = String(dateIso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return todayIso();
    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    const day = Number(match[3]);
    const target = new Date(y, m + addMonths, 1);
    const maxDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(
      Math.min(day, maxDay)
    ).padStart(2, '0')}`;
  }

  function formatMonthLabel(mKey) {
    const [y, m] = mKey.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  }

  function formatShortMonth(mKey) {
    const [y, m] = mKey.split('-').map(Number);
    return new Date(y, m - 1, 1)
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '');
  }

  function fmtBrl(n) {
    return (Number(n) || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function getBankDef(key) {
    return BANKS.find((b) => b.key === key) || BANKS[BANKS.length - 1];
  }

  function resolvePersonAvatar(owner) {
    if (owner === 'eu') return appState.hisPhotoDataUrl || DEFAULT_PHOTOS.his;
    if (owner === 'esposa') return appState.herPhotoDataUrl || DEFAULT_PHOTOS.her;
    return appState.couplePhotoDataUrl || DEFAULT_PHOTOS.couple;
  }

  function resolveOwnerName(owner) {
    if (owner === 'eu') return appState.userName || 'Você';
    if (owner === 'esposa') return appState.partnerName || 'Esposa';
    return 'Casal';
  }

  function resolveGoalPhoto(goal) {
    if (goal.imageUrl && (goal.imageUrl.startsWith('data:image/') || goal.imageUrl.startsWith('http'))) {
      return goal.imageUrl;
    }
    const preset = String(goal.imagePreset || '').toLowerCase();
    const title = String(goal.title || '').toLowerCase();
    if (preset === 'house' || preset === 'renovation' || /casa|apto|apartamento|im[oó]vel|reforma|entrada/.test(title)) {
      return DEFAULT_PHOTOS.house;
    }
    if (preset === 'emergency' || preset === 'invest' || /reserva|emerg[eê]ncia|poupan|segur|invest/.test(title)) {
      return DEFAULT_PHOTOS.emergency;
    }
    if (preset === 'travel' || preset === 'europe' || /viagem|chile|praia|ferias|f[eé]rias|europa|lua de mel/.test(title)) {
      return DEFAULT_PHOTOS.travel;
    }
    return DEFAULT_PHOTOS.travel;
  }

  function toast(msg) {
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#B6492D', '#EA944D', '#FFD6B8', '#18794E', '#E86C52', '#F7C948'];
    const parts = Array.from({ length: 68 }, () => ({
      x: canvas.width * (0.35 + Math.random() * 0.3),
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 13 - 4,
      size: 6 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }));
    let frames = 0;
    function step() {
      frames += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38;
        p.rot += p.vr;
        p.life -= 0.014;
        if (p.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        ctx.restore();
      }
      if (frames < 75) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(step);
  }

  function animateCounters() {
    document.querySelectorAll('[data-count-brl]').forEach((el) => {
      const target = Number(el.getAttribute('data-count-brl'));
      if (Number.isNaN(target)) return;
      const start = Number(el.getAttribute('data-prev-brl') || 0);
      if (Math.abs(target - start) < 0.01) {
        el.textContent = fmtBrl(target);
        return;
      }
      const t0 = performance.now();
      const dur = 480;
      function frame(now) {
        const p = Math.min(1, (now - t0) / dur);
        const ease = 1 - Math.pow(1 - p, 3);
        const cur = start + (target - start) * ease;
        el.textContent = fmtBrl(cur);
        if (p < 1) requestAnimationFrame(frame);
        else {
          el.textContent = fmtBrl(target);
          el.setAttribute('data-prev-brl', String(target));
        }
      }
      requestAnimationFrame(frame);
    });
  }

  function pickAndCompressPhoto(maxW, maxH, quality = 0.78) {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = () => {
        const file = inp.files && inp.files[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = maxW;
            canvas.height = maxH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            const targetRatio = maxW / maxH;
            const srcRatio = img.width / img.height;
            let sx = 0,
              sy = 0,
              sw = img.width,
              sh = img.height;
            if (srcRatio > targetRatio) {
              sw = img.height * targetRatio;
              sx = (img.width - sw) / 2;
            } else {
              sh = img.width / targetRatio;
              sy = (img.height - sh) / 2;
            }
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxW, maxH);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.onerror = () => resolve(null);
          img.src = String(reader.result || '');
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      inp.click();
    });
  }

  // -------------------- Sync Engine (Local / Cloud / Offline) --------------------
  function loadCloudCreds() {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const hp = new URLSearchParams(hash);
      const gistId = hp.get('gist') || '';
      const token = hp.get('token') || '';
      if (gistId && token) {
        const creds = { gistId, token };
        try {
          localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(creds));
        } catch {}
        return creds;
      }
    }
    try {
      const saved = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || 'null');
      if (saved && saved.gistId && saved.token) return saved;
    } catch {}
    return null;
  }

  function ghHeaders(token) {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  function normalizeState(raw) {
    const base = createStarterState();
    return {
      ...base,
      ...raw,
      userName: raw.userName || 'Você',
      partnerName: raw.partnerName || 'Esposa',
      financeBrandName: raw.financeBrandName || 'Nós no Azul',
      hisPhotoDataUrl: raw.hisPhotoDataUrl || '',
      herPhotoDataUrl: raw.herPhotoDataUrl || '',
      couplePhotoDataUrl: raw.couplePhotoDataUrl || '',
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
      recurringBills: Array.isArray(raw.recurringBills) ? raw.recurringBills : [],
      fixedIncomes: Array.isArray(raw.fixedIncomes) ? raw.fixedIncomes : [],
      savingsGoals: Array.isArray(raw.savingsGoals) ? raw.savingsGoals : [],
      bankAccounts: Array.isArray(raw.bankAccounts) ? raw.bankAccounts : [],
      creditCards: Array.isArray(raw.creditCards) ? raw.creditCards : [],
      categoryBudgets: Array.isArray(raw.categoryBudgets) ? raw.categoryBudgets : [],
      calendarEvents: Array.isArray(raw.calendarEvents) ? raw.calendarEvents : [],
    };
  }

  function applyLocalOptimisticOp(type, p) {
    const curM = currentMonthKey();
    if (type === 'add_transaction') {
      const n = p.type === 'expense' && Number(p.installments) > 1 ? Math.min(24, Number(p.installments)) : 1;
      const total = Math.max(0, Number(p.amount) || 0);
      const start = p.date || todayIso();
      if (n === 1) {
        appState.transactions.unshift({
          id: uid(),
          title: p.title,
          amount: total,
          type: p.type || 'expense',
          category: p.category || 'Outros',
          owner: p.owner || 'casal',
          date: start,
          paid: typeof p.paid === 'boolean' ? p.paid : p.paymentMethod !== 'credit',
          paymentMethod: p.paymentMethod || undefined,
          accountId: p.accountId || undefined,
          cardId: p.cardId || undefined,
          notes: p.notes || undefined,
        });
      } else {
        const slice = Math.round((total / n) * 100) / 100;
        for (let i = 0; i < n; i++) {
          appState.transactions.unshift({
            id: uid(),
            title: `${p.title} (${i + 1}/${n})`,
            amount: slice,
            type: 'expense',
            category: p.category || 'Outros',
            owner: p.owner || 'casal',
            date: addMonthsIso(start, i),
            paid: p.paymentMethod !== 'credit' && i === 0,
            paymentMethod: p.paymentMethod || 'credit',
            accountId: p.accountId || undefined,
            cardId: p.cardId || undefined,
            installmentIndex: i + 1,
            installmentTotal: n,
          });
        }
      }
    } else if (type === 'toggle_transaction_paid') {
      appState.transactions = appState.transactions.map((t) =>
        t.id === p.id ? { ...t, paid: !t.paid } : t
      );
    } else if (type === 'delete_transaction') {
      appState.transactions = appState.transactions.filter((t) => t.id !== p.id);
    } else if (type === 'save_bill') {
      const item = {
        id: p.id || uid(),
        title: p.title,
        amount: Number(p.amount) || 0,
        dueDay: Number(p.dueDay) || 5,
        category: p.category || 'Moradia',
        owner: p.owner || 'casal',
        accountId: p.accountId || undefined,
        paidMonths: [],
      };
      const idx = appState.recurringBills.findIndex((b) => b.id === item.id);
      if (idx >= 0) appState.recurringBills[idx] = { ...appState.recurringBills[idx], ...item };
      else appState.recurringBills.push(item);
    } else if (type === 'toggle_bill_paid') {
      const m = p.monthKey || curM;
      appState.recurringBills = appState.recurringBills.map((b) => {
        if (b.id !== p.id) return b;
        const paidMonths = Array.isArray(b.paidMonths) ? b.paidMonths : [];
        return {
          ...b,
          paidMonths: paidMonths.includes(m) ? paidMonths.filter((x) => x !== m) : [...paidMonths, m],
        };
      });
    } else if (type === 'delete_bill') {
      appState.recurringBills = appState.recurringBills.filter((b) => b.id !== p.id);
    } else if (type === 'save_fixed_income') {
      const item = {
        id: p.id || uid(),
        title: p.title,
        amount: Number(p.amount) || 0,
        payDay: Number(p.payDay) || 5,
        owner: p.owner || 'eu',
        accountId: p.accountId || undefined,
        active: p.active !== false,
        creditedMonths: [],
      };
      const idx = appState.fixedIncomes.findIndex((f) => f.id === item.id);
      if (idx >= 0) appState.fixedIncomes[idx] = { ...appState.fixedIncomes[idx], ...item };
      else appState.fixedIncomes.push(item);
    } else if (type === 'toggle_fixed_income_active') {
      appState.fixedIncomes = appState.fixedIncomes.map((f) =>
        f.id === p.id ? { ...f, active: !f.active } : f
      );
    } else if (type === 'toggle_fixed_income_credited') {
      const m = p.monthKey || curM;
      appState.fixedIncomes = appState.fixedIncomes.map((f) => {
        if (f.id !== p.id) return f;
        const cm = Array.isArray(f.creditedMonths) ? f.creditedMonths : [];
        return { ...f, creditedMonths: cm.includes(m) ? cm.filter((x) => x !== m) : [...cm, m] };
      });
    } else if (type === 'delete_fixed_income') {
      appState.fixedIncomes = appState.fixedIncomes.filter((f) => f.id !== p.id);
    } else if (type === 'save_goal') {
      const item = {
        id: p.id || uid(),
        title: p.title,
        targetAmount: Math.max(1, Number(p.targetAmount) || 1),
        currentAmount: Math.max(0, Number(p.currentAmount) || 0),
        icon: p.icon || '🎯',
        imagePreset: p.imagePreset || 'travel',
        imageUrl: p.imageUrl || undefined,
        targetDate: p.targetDate || undefined,
        owner: p.owner || 'casal',
      };
      const idx = appState.savingsGoals.findIndex((g) => g.id === item.id);
      if (idx >= 0) appState.savingsGoals[idx] = { ...appState.savingsGoals[idx], ...item };
      else appState.savingsGoals.push(item);
    } else if (type === 'contribute_goal') {
      appState.savingsGoals = appState.savingsGoals.map((g) =>
        g.id === p.id
          ? { ...g, currentAmount: Math.max(0, Number(g.currentAmount || 0) + Number(p.deltaAmount || 0)) }
          : g
      );
    } else if (type === 'delete_goal') {
      appState.savingsGoals = appState.savingsGoals.filter((g) => g.id !== p.id);
    } else if (type === 'save_bank') {
      const bal = Number(p.initialBalance) || 0;
      const item = {
        id: p.id || uid(),
        bankKey: p.bankKey || 'nubank',
        name: p.name,
        accountType: p.accountType || 'checking',
        owner: p.owner || 'casal',
        initialBalance: bal,
        balance: bal,
      };
      const idx = appState.bankAccounts.findIndex((a) => a.id === item.id);
      if (idx >= 0) appState.bankAccounts[idx] = { ...appState.bankAccounts[idx], ...item };
      else appState.bankAccounts.push(item);
    } else if (type === 'delete_bank') {
      appState.bankAccounts = appState.bankAccounts.filter((a) => a.id !== p.id);
    } else if (type === 'save_card') {
      const item = {
        id: p.id || uid(),
        bankKey: p.bankKey || 'nubank',
        name: p.name,
        brand: p.brand || 'mastercard',
        last4: p.last4 || '',
        limitAmount: Number(p.limitAmount) || 0,
        monthUsed: 0,
        closingDay: Number(p.closingDay) || 5,
        dueDay: Number(p.dueDay) || 12,
        owner: p.owner || 'casal',
      };
      const idx = appState.creditCards.findIndex((c) => c.id === item.id);
      if (idx >= 0) appState.creditCards[idx] = { ...appState.creditCards[idx], ...item };
      else appState.creditCards.push(item);
    } else if (type === 'delete_card') {
      appState.creditCards = appState.creditCards.filter((c) => c.id !== p.id);
    } else if (type === 'pay_card_invoice') {
      const m = p.monthKey || curM;
      appState.transactions = appState.transactions.map((t) =>
        t.cardId === p.cardId && t.date.startsWith(m) ? { ...t, paid: true } : t
      );
    } else if (type === 'save_budget') {
      const idx = appState.categoryBudgets.findIndex(
        (b) => b.category.toLowerCase() === String(p.category || '').toLowerCase()
      );
      if (idx >= 0) appState.categoryBudgets[idx].monthlyLimit = Number(p.monthlyLimit) || 0;
      else appState.categoryBudgets.push({ id: uid(), category: p.category, monthlyLimit: Number(p.monthlyLimit) || 0 });
    } else if (type === 'delete_budget') {
      appState.categoryBudgets = appState.categoryBudgets.filter((b) => b.id !== p.id);
    } else if (type === 'add_calendar_event') {
      appState.calendarEvents.unshift({
        id: uid(),
        title: p.title,
        date: p.date || todayIso(),
        time: p.time || '',
        category: p.category || 'casal',
        person: p.person || 'casal',
      });
    } else if (type === 'delete_calendar_event') {
      appState.calendarEvents = appState.calendarEvents.filter((e) => e.id !== p.id);
    } else if (type === 'update_finance_profile') {
      if (p.userName) appState.userName = p.userName;
      if (p.partnerName) appState.partnerName = p.partnerName;
      if (p.financeBrandName) appState.financeBrandName = p.financeBrandName;
      if (typeof p.hisPhotoDataUrl === 'string') appState.hisPhotoDataUrl = p.hisPhotoDataUrl;
      if (typeof p.herPhotoDataUrl === 'string') appState.herPhotoDataUrl = p.herPhotoDataUrl;
      if (typeof p.couplePhotoDataUrl === 'string') appState.couplePhotoDataUrl = p.couplePhotoDataUrl;
    }
  }

  async function initSync() {
    if (localToken && window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch(`/api/finance/state?token=${encodeURIComponent(localToken)}`);
        if (res.ok) {
          const data = await res.json();
          appState = normalizeState(data);
          ui.syncMode = 'local';
          updateSyncBadge();
          renderAll();
          startLocalSse();
          return;
        }
      } catch {}
    }

    if (ui.cloudCreds) {
      const ok = await pullCloudGist();
      if (ok) {
        ui.syncMode = 'cloud';
        updateSyncBadge();
        renderAll();
        setInterval(pullCloudGist, 12000);
        return;
      }
    }

    try {
      const saved = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || 'null');
      if (saved) appState = normalizeState(saved);
    } catch {}
    ui.syncMode = 'offline';
    updateSyncBadge();
    renderAll();
  }

  function startLocalSse() {
    if (!localToken || typeof EventSource === 'undefined') return;
    const es = new EventSource(`/api/events?token=${encodeURIComponent(localToken)}`);
    es.addEventListener('update', async () => {
      try {
        const res = await fetch(`/api/finance/state?token=${encodeURIComponent(localToken)}`);
        if (res.ok) {
          appState = normalizeState(await res.json());
          renderAll();
        }
      } catch {}
    });
  }

  async function pullCloudGist() {
    if (!ui.cloudCreds) return false;
    try {
      const res = await fetch(`https://api.github.com/gists/${ui.cloudCreds.gistId}`, {
        headers: ghHeaders(ui.cloudCreds.token),
      });
      if (!res.ok) return false;
      const gist = await res.json();
      const content = gist.files && gist.files['drakars-sync.json'] && gist.files['drakars-sync.json'].content;
      if (!content) return false;
      const parsed = JSON.parse(content);
      appState = normalizeState(parsed);
      return true;
    } catch {
      return false;
    }
  }

  async function dispatchAction(type, payload = {}) {
    if (ui.syncMode === 'local' && localToken) {
      try {
        const res = await fetch(`/api/finance/action?token=${encodeURIComponent(localToken)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, payload }),
        });
        const data = await res.json();
        if (data.ok && data.state) {
          appState = normalizeState(data.state);
          renderAll();
          return true;
        }
      } catch {}
    }

    applyLocalOptimisticOp(type, payload);
    renderAll();

    if (ui.syncMode === 'cloud' && ui.cloudCreds) {
      try {
        const getRes = await fetch(`https://api.github.com/gists/${ui.cloudCreds.gistId}`, {
          headers: ghHeaders(ui.cloudCreds.token),
        });
        if (getRes.ok) {
          const gist = await getRes.json();
          const curRaw = gist.files?.['drakars-sync.json']?.content || '{}';
          const curJson = JSON.parse(curRaw);
          const pending = Array.isArray(curJson.pendingMobileOps) ? curJson.pendingMobileOps : [];
          pending.push({ id: uid(), type, payload, createdAt: Date.now() });
          curJson.pendingMobileOps = pending;
          // Also keep snapshot updated so phone/wife sees changes immediately before PC polls
          if (type === 'update_finance_profile') {
            Object.assign(curJson, payload);
          }
          await fetch(`https://api.github.com/gists/${ui.cloudCreds.gistId}`, {
            method: 'PATCH',
            headers: ghHeaders(ui.cloudCreds.token),
            body: JSON.stringify({
              files: { 'drakars-sync.json': { content: JSON.stringify(curJson, null, 2) } },
            }),
          });
        }
      } catch {
        toast('Salvo localmente; sincronizará ao reconectar.');
      }
    } else {
      try {
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(appState));
      } catch {}
    }
    return true;
  }

  function updateSyncBadge() {
    const dot = document.getElementById('syncDot');
    const txt = document.getElementById('syncText');
    if (!dot || !txt) return;
    dot.className = 'sync-dot';
    if (ui.syncMode === 'local') {
      txt.textContent = 'Conectado ao Drakars (PC)';
    } else if (ui.syncMode === 'cloud') {
      dot.classList.add('cloud');
      txt.textContent = 'Sincronizado via Nuvem';
    } else {
      dot.classList.add('offline');
      txt.textContent = 'Modo Navegador Local';
    }
  }

  // -------------------- Calculations --------------------
  function getBankBalance(acc) {
    if (typeof acc.balance === 'number' && ui.syncMode === 'local') {
      return acc.balance;
    }
    let bal = Number(acc.initialBalance ?? acc.balance ?? 0);
    if (ui.syncMode === 'cloud' && typeof acc.initialBalance !== 'number') {
      bal = Number(acc.balance || 0);
    } else {
      for (const t of appState.transactions) {
        if (!t.paid) continue;
        if (t.accountId === acc.id) {
          bal += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
        }
        if (t.type === 'transfer' && t.toAccountId === acc.id) bal += Number(t.amount);
      }
      for (const b of appState.recurringBills) {
        if (b.accountId === acc.id) bal -= Number(b.amount) * (b.paidMonths?.length || 0);
      }
      for (const f of appState.fixedIncomes) {
        if (f.accountId === acc.id) bal += Number(f.amount) * (f.creditedMonths?.length || 0);
      }
    }
    return Number(bal.toFixed(2));
  }

  function computeMetrics(mKey, scope = ui.scope) {
    const matchScope = (owner) => {
      if (scope === 'casal') return true;
      return owner === scope;
    };

    const mTx = appState.transactions.filter(
      (t) => String(t.date || '').startsWith(mKey) && matchScope(t.owner || 'casal')
    );
    const activeSalaries = appState.fixedIncomes.filter(
      (f) => f.active && matchScope(f.owner || 'eu')
    );
    const mBills = appState.recurringBills.filter((b) => matchScope(b.owner || 'casal'));

    const salaryTotal = activeSalaries.reduce((s, f) => s + Number(f.amount || 0), 0);
    const txIncome = mTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const txExpense = mTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const billsTotal = mBills.reduce((s, b) => s + Number(b.amount || 0), 0);

    const totalIncome = txIncome + salaryTotal;
    const totalExpense = txExpense + billsTotal;
    const monthFree = totalIncome - totalExpense;

    const totalBanks = appState.bankAccounts.reduce((s, a) => s + getBankBalance(a), 0);
    const herBanks = appState.bankAccounts
      .filter((a) => a.owner === 'esposa')
      .reduce((s, a) => s + getBankBalance(a), 0);
    const hisBanks = appState.bankAccounts
      .filter((a) => a.owner === 'eu')
      .reduce((s, a) => s + getBankBalance(a), 0);
    const jointBanks = appState.bankAccounts
      .filter((a) => a.owner === 'casal')
      .reduce((s, a) => s + getBankBalance(a), 0);

    const herMonthNet =
      appState.fixedIncomes
        .filter((f) => f.active && f.owner === 'esposa')
        .reduce((s, f) => s + Number(f.amount || 0), 0) +
      appState.transactions
        .filter((t) => t.date.startsWith(mKey) && t.owner === 'esposa')
        .reduce((s, t) => s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);

    const hisMonthNet =
      appState.fixedIncomes
        .filter((f) => f.active && f.owner === 'eu')
        .reduce((s, f) => s + Number(f.amount || 0), 0) +
      appState.transactions
        .filter((t) => t.date.startsWith(mKey) && t.owner === 'eu')
        .reduce((s, t) => s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);

    const jointBalance = (appState.bankAccounts.length ? totalBanks : 0) + (jointBanks === totalBanks ? 0 : 0);
    const heroJoint = appState.bankAccounts.length > 0 ? totalBanks : monthFree;
    const heroHer = herBanks !== 0 ? herBanks : Math.max(0, herMonthNet);
    const heroHis = hisBanks !== 0 ? hisBanks : Math.max(0, hisMonthNet);

    const catMap = {};
    for (const t of mTx) {
      if (t.type === 'expense') {
        const c = t.category || 'Outros';
        catMap[c] = (catMap[c] || 0) + Number(t.amount || 0);
      }
    }
    for (const b of mBills) {
      const c = b.category || 'Moradia';
      catMap[c] = (catMap[c] || 0) + Number(b.amount || 0);
    }
    const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    const unpaidBills = mBills.filter((b) => !(b.paidMonths || []).includes(mKey));
    const unpaidBillsTotal = unpaidBills.reduce((s, b) => s + Number(b.amount || 0), 0);

    return {
      mTx,
      activeSalaries,
      mBills,
      unpaidBills,
      unpaidBillsTotal,
      salaryTotal,
      totalIncome,
      totalExpense,
      monthFree,
      totalBanks,
      heroJoint,
      heroHer,
      heroHis,
      herMonthNet,
      hisMonthNet,
      catEntries,
    };
  }

  function computeSixMonthSeries(anchorMonthKey) {
    const out = [];
    for (let i = -5; i <= 0; i++) {
      const k = shiftMonthKey(anchorMonthKey, i);
      const met = computeMetrics(k, ui.scope);
      out.push({
        key: k,
        label: formatShortMonth(k),
        expense: met.totalExpense,
        income: met.totalIncome,
      });
    }
    return out;
  }

  // -------------------- Charts (SVG) --------------------
  function renderDonutSvg(catEntries, totalExpense) {
    if (!catEntries.length || totalExpense <= 0) {
      return `
        <div class="donut-wrap">
          <svg class="donut-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="44" fill="none" stroke="#EFE4D8" stroke-width="18" />
            <text x="60" y="57" text-anchor="middle" font-size="11" font-weight="800" fill="#2A1811">R$ 0,00</text>
            <text x="60" y="72" text-anchor="middle" font-size="9" fill="#8B7166">Sem gastos</text>
          </svg>
          <div style="font-size:12.5px;color:var(--muted)">Lance gastos neste mês para ver a divisão por categoria.</div>
        </div>
      `;
    }
    const r = 44;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const top = catEntries.slice(0, 6);
    const segs = top
      .map(([name, val], i) => {
        const pct = val / totalExpense;
        const dash = Math.max(2, pct * circ - 2);
        const color = DONUT_COLORS[i % DONUT_COLORS.length];
        const seg = `<circle class="donut-seg" cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="18" stroke-dasharray="${dash.toFixed(
          2
        )} ${(circ - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(
          2
        )}" transform="rotate(-90 60 60)" data-donut-cat="${esc(name)}" data-donut-val="${esc(
          fmtBrl(val)
        )}" data-donut-pct="${Math.round(pct * 100)}%" />`;
        offset += pct * circ;
        return seg;
      })
      .join('');

    const legend = top
      .map(([name, val], i) => {
        const pct = Math.round((val / totalExpense) * 100);
        const color = DONUT_COLORS[i % DONUT_COLORS.length];
        return `
          <div class="legend-item">
            <span class="legend-dot" style="background:${color}"></span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</span>
            <strong class="num">${pct}%</strong>
          </div>
        `;
      })
      .join('');

    return `
      <div class="donut-wrap">
        <svg class="donut-svg" viewBox="0 0 120 120">
          ${segs}
          <text id="donutCenterVal" x="60" y="57" text-anchor="middle" font-size="11.5" font-weight="800" fill="#2A1811">${esc(
            fmtBrl(totalExpense)
          )}</text>
          <text id="donutCenterSub" x="60" y="72" text-anchor="middle" font-size="9" font-weight="600" fill="#8B7166">Total do mês</text>
        </svg>
        <div class="donut-legend">${legend}</div>
      </div>
    `;
  }

  function renderSplineSvg(series) {
    const W = 280;
    const H = 132;
    const padX = 18;
    const padTop = 26;
    const padBot = 24;
    const maxVal = Math.max(100, ...series.map((s) => s.expense));
    const pts = series.map((s, idx) => {
      const x = padX + (idx / Math.max(1, series.length - 1)) * (W - padX * 2);
      const y = H - padBot - (s.expense / maxVal) * (H - padTop - padBot);
      return { x, y, ...s };
    });

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(
        1
      )} ${p1.y.toFixed(1)}`;
    }
    const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)} ${H - padBot} L ${pts[0].x.toFixed(
      1
    )} ${H - padBot} Z`;
    const last = pts[pts.length - 1];

    const grid = [0.25, 0.5, 0.75, 1]
      .map((f) => {
        const y = H - padBot - f * (H - padTop - padBot);
        return `<line x1="${padX}" y1="${y.toFixed(1)}" x2="${W - padX}" y2="${y.toFixed(
          1
        )}" stroke="rgba(138,66,44,0.1)" stroke-dasharray="3 3" />`;
      })
      .join('');

    const dots = pts
      .map(
        (p, i) => `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${
          i === pts.length - 1 ? 5 : 3.5
        }" fill="#FFFDF9" stroke="#B6492D" stroke-width="2.4">
          <title>${esc(p.label)}: ${esc(fmtBrl(p.expense))}</title>
        </circle>
        <text x="${p.x.toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="#8B7166">${esc(
          p.label
        )}</text>
      `
      )
      .join('');

    const pillW = 86;
    const pillX = Math.min(W - pillW - 4, Math.max(4, last.x - pillW / 2));
    const pillY = Math.max(2, last.y - 24);

    return `
      <svg class="spline-svg" viewBox="0 0 ${W} ${H}">
        <defs>
          <linearGradient id="splineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#DE704B" stop-opacity="0.32" />
            <stop offset="100%" stop-color="#DE704B" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        ${grid}
        <path d="${area}" fill="url(#splineAreaGrad)" />
        <path class="spline-line" d="${d}" fill="none" stroke="#B6492D" stroke-width="2.8" stroke-linecap="round" />
        <circle class="dot-ping" cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="5" fill="#B6492D" />
        ${dots}
        <rect x="${pillX.toFixed(1)}" y="${pillY.toFixed(1)}" width="${pillW}" height="19" rx="9" fill="#9C371E" />
        <text x="${(pillX + pillW / 2).toFixed(1)}" y="${(pillY + 13).toFixed(
      1
    )}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#FFFFFF">${esc(fmtBrl(last.expense))}</text>
      </svg>
    `;
  }

  // -------------------- AI Advisor & Purchase Simulator --------------------
  function evaluateSimulation(sim) {
    const met = computeMetrics(ui.monthKey, sim.owner || 'casal');
    const amount = Math.max(0, Number(sim.amount) || 0);
    const installments = Math.max(1, Math.min(24, Math.round(Number(sim.installments) || 1)));
    const monthlySlice = amount / installments;
    const item = (sim.item || '').trim() || 'esta compra';

    // Check next 2 months committed installments already scheduled
    let nextMonthLoad = 0;
    const mNext = shiftMonthKey(ui.monthKey, 1);
    for (const t of appState.transactions) {
      if (t.type === 'expense' && String(t.date || '').startsWith(mNext)) {
        nextMonthLoad += Number(t.amount || 0);
      }
    }
    const projectedNextBills = nextMonthLoad + met.mBills.reduce((s, b) => s + Number(b.amount || 0), 0);

    const afterMonth = met.monthFree - monthlySlice;
    const safetyBuffer = Math.max(250, met.totalIncome * 0.15);

    const selectedCard = appState.creditCards.find((c) => c.id === sim.cardId);
    let cardWarning = '';
    if (selectedCard && sim.method === 'credit') {
      const freeLimit = Number(selectedCard.limitAmount || 0) - Number(selectedCard.monthUsed || 0);
      if (amount > freeLimit) {
        cardWarning = `O limite disponível do cartão ${selectedCard.name} (${fmtBrl(
          freeLimit
        )}) é menor que o valor total (${fmtBrl(amount)}).`;
      }
    }

    let level = 'green';
    let title = 'Pode ir tranquilo — não aperta o mês!';
    let detail = '';

    if (amount <= 0) {
      level = 'amber';
      title = 'Informe o valor da compra';
      detail = 'Digite quanto custa para eu calcular o impacto exato nas suas contas e metas.';
    } else if (met.totalIncome <= 0 && met.totalBanks < amount) {
      level = 'amber';
      title = 'Falta salário ou saldo cadastrado neste mês';
      detail = `Vocês têm ${fmtBrl(met.totalBanks)} em bancos e R$ 0 de entradas cadastradas em ${formatMonthLabel(
        ui.monthKey
      )}. Cadastre seu salário fixo em Planejamento para uma análise exata.`;
    } else if (afterMonth < 0 || cardWarning) {
      level = 'red';
      title = 'Vai apertar esse mês!';
      const deficit = Math.abs(afterMonth);
      const maxSafeMonthly = Math.max(50, met.monthFree * 0.55);
      const suggestedInst = met.monthFree > 80 ? Math.min(24, Math.ceil(amount / maxSafeMonthly)) : 0;
      const topCat = met.catEntries[0];
      detail =
        (cardWarning ? cardWarning + ' ' : '') +
        (afterMonth < 0
          ? `A parcela de <strong>${fmtBrl(monthlySlice)}/mês</strong> deixa o saldo do mês negativo em <strong>-${fmtBrl(
              deficit
            )}</strong>.`
          : '') +
        (suggestedInst >= 2 && suggestedInst <= 12
          ? ` Se parcelar em <strong>${suggestedInst}x de ${fmtBrl(
              amount / suggestedInst
            )}</strong>, já cabe na sua sobra atual.`
          : topCat
            ? ` Para viabilizar, seria necessário segurar cerca de ${fmtBrl(deficit)} em <strong>${esc(
                topCat[0]
              )}</strong> (atual ${fmtBrl(topCat[1])}) ou aguardar o próximo salário.`
            : '');
    } else if (afterMonth < safetyBuffer || (installments === 1 && amount > met.totalBanks && met.totalBanks > 0)) {
      level = 'amber';
      title = 'Dá para comprar, mas com atenção (leva uma apertada)';
      const betterInst = Math.min(12, Math.max(installments + 2, Math.ceil(amount / Math.max(100, met.monthFree * 0.4))));
      detail = `Sua sobra cai de ${fmtBrl(met.monthFree)} para <strong>${fmtBrl(
        afterMonth
      )}</strong> (abaixo da reserva de segurança de ${fmtBrl(
        safetyBuffer
      )}), considerando ${fmtBrl(met.unpaidBillsTotal)} em contas fixas ainda pendentes.${
        installments < betterInst
          ? ` Em <strong>${betterInst}x (${fmtBrl(amount / betterInst)}/mês)</strong> o impacto mensal fica mais confortável.`
          : ''
      }`;
    } else {
      level = 'green';
      title = `Tranquilo! "${esc(item)}" cabe bem no mês`;
      detail = `Mesmo pagando <strong>${fmtBrl(monthlySlice)}/mês</strong>${
        installments > 1 ? ` (${installments}x)` : ' à vista'
      }, ainda sobram <strong>${fmtBrl(afterMonth)}</strong> livres neste mês além de <strong>${fmtBrl(
        met.totalBanks
      )}</strong> acumulados em bancos.`;
    }

    return {
      level,
      title,
      detail,
      monthlySlice,
      afterMonth,
      projectedNextBills,
      met,
    };
  }

  async function handleAskAdvisor(question) {
    const clean = question.trim();
    if (!clean) return;
    ui.chat.push({ role: 'user', html: esc(clean) });
    renderAdvisorContent();

    // Parse purchase intent if numbers present
    const instM = clean.match(/(\d{1,2})\s*(?:x|vezes|parcelas?)/i);
    const cleaned = clean.replace(/\d{1,2}\s*(?:x|vezes|parcelas?)/gi, '');
    const amtM = cleaned.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);

    let localHtml = '';
    if (amtM) {
      const rawN = amtM[1];
      const norm = rawN.includes(',') ? rawN.replace(/\./g, '').replace(',', '.') : rawN.replace(/\.(?=\d{3}\b)/g, '');
      const val = Number(norm);
      if (val > 0) {
        const inst = instM ? Math.min(24, Math.max(1, Number(instM[1]))) : 1;
        const ev = evaluateSimulation({ item: clean, amount: val, installments: inst, owner: ui.scope, method: inst > 1 ? 'credit' : 'pix' });
        localHtml = `<div class="verdict-box verdict-${ev.level}" style="padding:10px 12px;margin-bottom:6px"><strong>${ev.title}</strong><div style="margin-top:4px;font-size:12.5px">${ev.detail}</div></div>`;
      }
    }

    if (ui.syncMode === 'local' && localToken) {
      try {
        const res = await fetch(`/api/finance/ask-ai?token=${encodeURIComponent(localToken)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: clean }),
        });
        const data = await res.json();
        if (data.ok && data.answer) {
          ui.chat.push({
            role: 'bot',
            html: localHtml + esc(data.answer).replace(/\n/g, '<br/>'),
          });
          renderAdvisorContent();
          return;
        }
      } catch {}
    }

    if (localHtml) {
      ui.chat.push({ role: 'bot', html: localHtml });
    } else {
      const met = computeMetrics(ui.monthKey, ui.scope);
      const q = clean.toLowerCase();
      if (/conta|pagar|venc|pendente/.test(q)) {
        const list = met.unpaidBills.map((b) => `${esc(b.title)} (dia ${b.dueDay}: ${fmtBrl(b.amount)})`).join('<br/>');
        ui.chat.push({
          role: 'bot',
          html: met.unpaidBills.length
            ? `Faltam <strong>${met.unpaidBills.length} contas</strong> neste mês (${fmtBrl(met.unpaidBillsTotal)}):<br/>${list}`
            : 'Todas as contas fixas desse mês já estão pagas! 🎉',
        });
      } else {
        ui.chat.push({
          role: 'bot',
          html: `Resumo de <strong>${esc(formatMonthLabel(ui.monthKey))}</strong>:<br/>Entradas: <strong>${fmtBrl(
            met.totalIncome
          )}</strong> • Saídas: <strong>${fmtBrl(met.totalExpense)}</strong> • Sobra prevista: <strong>${fmtBrl(
            met.monthFree
          )}</strong>.<br/>Se quiser testar uma compra, digite por exemplo: <em>"Comprar airfryer de 450 em 3x aperta?"</em>`,
        });
      }
    }
    renderAdvisorContent();
  }

  // -------------------- Views Rendering --------------------
  function renderDashboard() {
    const met = computeMetrics(ui.monthKey, ui.scope);
    const series = computeSixMonthSeries(ui.monthKey);
    const hisName = appState.userName || 'Você';
    const herName = appState.partnerName || 'Esposa';

    const pctLabel = (v) =>
      met.totalIncome > 0
        ? `${v >= 0 ? '↗' : '↘'} ${Math.min(999, Math.abs(Math.round((v / met.totalIncome) * 100)))}% do mês`
        : v >= 0
          ? 'Saldo positivo'
          : 'Atenção no mês';

    const goalsHtml =
      appState.savingsGoals.length === 0
        ? `<div style="padding:18px;text-align:center;color:var(--muted);font-size:13px">Nenhuma meta ainda. <button type="button" class="link-btn" data-action="open-goal-modal">Criar primeira meta</button></div>`
        : appState.savingsGoals
            .slice(0, 3)
            .map((g) => {
              const pct = Math.min(100, Math.round((Number(g.currentAmount || 0) / Math.max(1, g.targetAmount)) * 100));
              return `
                <div class="goal-row">
                  <div class="goal-thumb-wrap" data-action="change-goal-photo" data-id="${esc(g.id)}" title="Clique para trocar a foto da meta">
                    <img src="${esc(resolveGoalPhoto(g))}" alt="${esc(g.title)}" />
                  </div>
                  <div class="goal-info">
                    <div class="goal-name">${esc(g.icon || '🎯')} ${esc(g.title)}</div>
                    <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
                    <div class="goal-sub">
                      <span class="num">${esc(fmtBrl(g.currentAmount))} de ${esc(fmtBrl(g.targetAmount))}</span>
                      <span class="goal-pct num">${pct}%</span>
                    </div>
                  </div>
                  <button type="button" class="btn-secondary" style="padding:6px 10px;font-size:11.5px" data-action="quick-deposit" data-id="${esc(
                    g.id
                  )}">+ R$</button>
                </div>
              `;
            })
            .join('');

    const houseCats = met.catEntries.slice(0, 5);
    const breakdownHtml = houseCats.length
      ? houseCats
          .map(
            ([cat, val]) => `
            <div class="kv-row">
              <span>${esc(cat)}</span>
              <strong class="num">${esc(fmtBrl(val))}</strong>
            </div>
          `
          )
          .join('')
      : `<div style="padding:16px 0;color:var(--muted);font-size:13px">Sem despesas registradas em ${esc(
          formatMonthLabel(ui.monthKey)
        )}.</div>`;

    const recentFeed = met.mTx.filter((t) => t.type === 'expense').slice(0, 4);
    const feedHtml = recentFeed.length
      ? recentFeed
          .map(
            (t) => `
            <div class="feed-item">
              <img class="feed-avatar" src="${esc(resolvePersonAvatar(t.owner || 'casal'))}" alt="${esc(
              resolveOwnerName(t.owner || 'casal')
            )}" />
              <div class="feed-text">
                <strong>${esc(resolveOwnerName(t.owner || 'casal'))}</strong> pagou<br/>
                <span style="color:var(--muted)">${esc(t.title)}</span>
              </div>
              <div class="feed-amt num">${esc(fmtBrl(t.amount))}</div>
            </div>
          `
          )
          .join('')
      : `<div style="padding:16px 0;color:var(--muted);font-size:13px">Nenhum pagamento recente neste mês.</div>`;

    const billsHtml = met.mBills.length
      ? met.mBills
          .slice(0, 5)
          .map((b) => {
            const done = (b.paidMonths || []).includes(ui.monthKey);
            return `
              <div class="bill-row">
                <button type="button" class="chk-box ${done ? 'done' : ''}" data-action="toggle-bill" data-id="${esc(
              b.id
            )}">${done ? '✓' : ''}</button>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:700;${
                    done ? 'text-decoration:line-through;opacity:.55' : ''
                  }">${esc(b.title)}</div>
                  <div style="font-size:11px;color:var(--muted)">Vence dia ${b.dueDay}</div>
                </div>
                <strong class="num" style="font-size:13px">${esc(fmtBrl(b.amount))}</strong>
              </div>
            `;
          })
          .join('')
      : `<div style="padding:12px 0;color:var(--muted);font-size:12.5px">Sem contas fixas cadastradas. <button type="button" class="link-btn" data-nav="planning">Cadastrar →</button></div>`;

    const upcomingCal = [
      ...met.activeSalaries.map((s) => ({ day: s.payDay, title: s.title, amt: s.amount, kind: 'income' })),
      ...met.mBills.map((b) => ({ day: b.dueDay, title: b.title, amt: b.amount, kind: 'bill' })),
      ...appState.calendarEvents
        .filter((e) => String(e.date || '').startsWith(ui.monthKey))
        .map((e) => ({ day: Number(e.date.slice(8, 10)), title: e.title, amt: null, kind: 'event' })),
    ]
      .sort((a, b) => a.day - b.day)
      .slice(0, 5);

    const calMiniHtml = upcomingCal.length
      ? upcomingCal
          .map(
            (item) => `
            <div class="cal-mini-row">
              <span class="cal-day-pill num">${String(item.day).padStart(2, '0')}</span>
              <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600">${esc(
                item.title
              )}</span>
              ${
                item.amt !== null
                  ? `<strong class="num" style="font-size:12.5px;color:${
                      item.kind === 'income' ? 'var(--green)' : 'var(--ink)'
                    }">${item.kind === 'income' ? '+' : ''}${esc(fmtBrl(item.amt))}</strong>`
                  : `<span style="font-size:11px;color:var(--muted)">Evento</span>`
              }
            </div>
          `
          )
          .join('')
      : `<div style="padding:12px 0;color:var(--muted);font-size:12.5px">Sem vencimentos ou eventos neste mês.</div>`;

    return `
      <div class="view-enter" style="display:flex;flex-direction:column;gap:18px">
        <!-- Row 1: 3 Hero Wallets -->
        <div class="hero-wallets-grid">
          <div class="wallet-card wallet-joint anim-card delay-1">
            <div>
              <div class="wallet-label"><span>👫</span><span>Saldo conjunto</span></div>
              <div class="wallet-amount num" data-count-brl="${met.heroJoint}">${esc(fmtBrl(met.heroJoint))}</div>
              <span class="wallet-badge ${met.monthFree < 0 ? 'neg' : ''}">${esc(pctLabel(met.monthFree))}</span>
            </div>
            <div class="avatar-editable" data-action="upload-person-photo" data-person="casal" title="Trocar foto do casal">
              <img src="${esc(resolvePersonAvatar('casal'))}" alt="Casal" />
              <span class="avatar-overlay">📷 Trocar</span>
            </div>
          </div>

          <div class="wallet-card wallet-her anim-card delay-2">
            <div>
              <div class="wallet-label"><span>👩</span><span>Carteira pessoal • ${esc(herName)}</span></div>
              <div class="wallet-amount num" data-count-brl="${met.heroHer}">${esc(fmtBrl(met.heroHer))}</div>
              <span class="wallet-badge ${met.herMonthNet < 0 ? 'neg' : ''}">${esc(
      met.herMonthNet >= 0 ? `+ ${fmtBrl(met.herMonthNet)} no mês` : `${fmtBrl(met.herMonthNet)} no mês`
    )}</span>
            </div>
            <div class="avatar-editable" data-action="upload-person-photo" data-person="esposa" title="Trocar foto de ${esc(herName)}">
              <img src="${esc(resolvePersonAvatar('esposa'))}" alt="${esc(herName)}" />
              <span class="avatar-overlay">📷 Trocar</span>
            </div>
          </div>

          <div class="wallet-card wallet-his anim-card delay-3">
            <div>
              <div class="wallet-label"><span>👤</span><span>Carteira pessoal • ${esc(hisName)}</span></div>
              <div class="wallet-amount num" data-count-brl="${met.heroHis}">${esc(fmtBrl(met.heroHis))}</div>
              <span class="wallet-badge ${met.hisMonthNet < 0 ? 'neg' : ''}">${esc(
      met.hisMonthNet >= 0 ? `+ ${fmtBrl(met.hisMonthNet)} no mês` : `${fmtBrl(met.hisMonthNet)} no mês`
    )}</span>
            </div>
            <div class="avatar-editable" data-action="upload-person-photo" data-person="eu" title="Trocar foto de ${esc(hisName)}">
              <img src="${esc(resolvePersonAvatar('eu'))}" alt="${esc(hisName)}" />
              <span class="avatar-overlay">📷 Trocar</span>
            </div>
          </div>
        </div>

        <!-- Row 2: Metas + Despesas da casa + Quem pagou o quê -->
        <div class="middle-grid">
          <div class="card anim-card delay-4">
            <div class="card-head">
              <div class="card-title"><span>🎯</span><span>Metas compartilhadas</span></div>
              <button type="button" class="link-btn" data-nav="goals">Ver todas →</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px">${goalsHtml}</div>
          </div>

          <div class="card anim-card delay-5">
            <div class="card-head">
              <div class="card-title"><span>🏡</span><span>Despesas da casa</span></div>
              <strong class="num" style="font-size:17px">${esc(fmtBrl(met.totalExpense))}</strong>
            </div>
            <div class="kv-list">${breakdownHtml}</div>
          </div>

          <div class="card anim-card delay-6">
            <div class="card-head">
              <div class="card-title"><span>⇄</span><span>Quem pagou o quê</span></div>
              <button type="button" class="link-btn" data-nav="transactions">Histórico →</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">${feedHtml}</div>
          </div>
        </div>

        <!-- Row 3: Contas do mês + Donut + Evolução + Calendário -->
        <div class="bottom-grid">
          <div class="card anim-card delay-5">
            <div class="card-head">
              <div class="card-title"><span>🧾</span><span>Contas do mês</span></div>
              <span class="pill-count ${met.unpaidBills.length === 0 ? 'ok' : ''}">${
      met.unpaidBills.length ? `${met.unpaidBills.length} pendentes` : 'Tudo pago'
    }</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">${billsHtml}</div>
          </div>

          <div class="card anim-card delay-6">
            <div class="card-head">
              <div class="card-title"><span>🍩</span><span>Gastos por categoria</span></div>
            </div>
            ${renderDonutSvg(met.catEntries, met.totalExpense)}
          </div>

          <div class="card anim-card delay-7">
            <div class="card-head">
              <div class="card-title"><span>📈</span><span>Evolução dos gastos</span></div>
              <span style="font-size:11.5px;color:var(--muted);font-weight:700">6 meses</span>
            </div>
            ${renderSplineSvg(series)}
          </div>

          <div class="card anim-card delay-8">
            <div class="card-head">
              <div class="card-title"><span>📅</span><span>Calendário financeiro</span></div>
              <button type="button" class="link-btn" data-nav="calendar">Abrir →</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px">${calMiniHtml}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTransactions() {
    const met = computeMetrics(ui.monthKey, ui.scope);
    let rows = met.mTx;
    if (ui.txFilterType !== 'all') rows = rows.filter((t) => t.type === ui.txFilterType);
    if (ui.txFilterOwner !== 'all') rows = rows.filter((t) => (t.owner || 'casal') === ui.txFilterOwner);
    if (ui.search.trim()) {
      const q = ui.search.trim().toLowerCase();
      rows = rows.filter(
        (t) =>
          String(t.title).toLowerCase().includes(q) ||
          String(t.category || '').toLowerCase().includes(q)
      );
    }

    const tbody = rows.length
      ? rows
          .map(
            (t) => `
          <tr>
            <td class="num">${esc(t.date.split('-').reverse().join('/'))}</td>
            <td><strong>${esc(t.title)}</strong>${
              t.installmentTotal > 1 ? ` <span class="pill-count">${t.installmentIndex}/${t.installmentTotal}</span>` : ''
            }</td>
            <td>${esc(t.category || 'Outros')}</td>
            <td>
              <span style="display:inline-flex;align-items:center;gap:6px">
                <img src="${esc(resolvePersonAvatar(t.owner || 'casal'))}" style="width:22px;height:22px;border-radius:999px;object-fit:cover" />
                ${esc(resolveOwnerName(t.owner || 'casal'))}
              </span>
            </td>
            <td class="num" style="font-weight:800;color:${
              t.type === 'income' ? 'var(--green)' : t.type === 'transfer' ? 'var(--amber)' : 'var(--red)'
            }">${t.type === 'income' ? '+' : '-'}${esc(fmtBrl(t.amount))}</td>
            <td>
              <button type="button" class="pill-count ${t.paid ? 'ok' : ''}" data-action="toggle-tx-paid" data-id="${esc(
              t.id
            )}">${t.paid ? '✓ Pago' : 'Pendente'}</button>
            </td>
            <td style="text-align:right">
              <button type="button" class="btn-secondary" style="padding:5px 9px;font-size:11px" data-action="delete-tx" data-id="${esc(
                t.id
              )}">🗑</button>
            </td>
          </tr>
        `
          )
          .join('')
      : `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--muted)">Nenhum lançamento encontrado para os filtros selecionados.</td></tr>`;

    return `
      <div class="view-enter card" style="display:flex;flex-direction:column;gap:14px">
        <div class="card-head" style="margin:0;flex-wrap:wrap">
          <div class="card-title"><span>⇄</span><span>Extrato Completo (${esc(formatMonthLabel(ui.monthKey))})</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input id="txSearchInp" class="input" style="width:200px;padding:8px 12px" placeholder="Buscar título ou categoria..." value="${esc(
              ui.search
            )}" />
            <select id="txTypeSel" class="input" style="width:130px;padding:8px">
              <option value="all" ${ui.txFilterType === 'all' ? 'selected' : ''}>Todos tipos</option>
              <option value="expense" ${ui.txFilterType === 'expense' ? 'selected' : ''}>Despesas</option>
              <option value="income" ${ui.txFilterType === 'income' ? 'selected' : ''}>Receitas</option>
            </select>
            <button type="button" class="btn-primary" data-action="open-tx-modal">＋ Novo Lançamento</button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="fin-table">
            <thead>
              <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Quem</th><th>Valor</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAccounts() {
    const banksHtml = appState.bankAccounts.length
      ? appState.bankAccounts
          .map((a) => {
            const b = getBankDef(a.bankKey);
            const bal = getBankBalance(a);
            return `
              <div class="card" style="display:flex;align-items:center;gap:14px;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:12px">
                  <div class="bank-pill-logo" style="background:${b.bg};color:${b.fg}">${esc(b.short)}</div>
                  <div>
                    <div style="font-weight:800;font-size:15px">${esc(a.name)}</div>
                    <div style="font-size:12px;color:var(--muted)">${esc(b.name)} • ${esc(resolveOwnerName(a.owner))}</div>
                  </div>
                </div>
                <div style="text-align:right">
                  <div class="num" style="font-size:18px;font-weight:800;color:${
                    bal >= 0 ? 'var(--green)' : 'var(--red)'
                  }">${esc(fmtBrl(bal))}</div>
                  <button type="button" class="link-btn" style="font-size:11px;color:var(--muted)" data-action="delete-bank" data-id="${esc(
                    a.id
                  )}">Remover</button>
                </div>
              </div>
            `;
          })
          .join('')
      : `<div class="card" style="color:var(--muted);font-size:13.5px">Nenhuma conta bancária cadastrada ainda. Adicione Nubank, Itaú, Inter, Caixa, etc.</div>`;

    const cardsHtml = appState.creditCards.length
      ? appState.creditCards
          .map((c) => {
            const b = getBankDef(c.bankKey);
            const used = appState.transactions
              .filter(
                (t) =>
                  t.cardId === c.id && t.type === 'expense' && !t.paid && String(t.date || '').startsWith(ui.monthKey)
              )
              .reduce((s, t) => s + Number(t.amount || 0), 0);
            const pct = Math.min(100, Math.round((used / Math.max(1, c.limitAmount)) * 100));
            return `
              <div class="credit-card-visual" style="background:linear-gradient(135deg, ${b.bg}, #221612)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-weight:800;font-size:16px">${esc(c.name)}</span>
                  <span style="font-size:12px;opacity:.85">${esc(b.name)} •••• ${esc(c.last4 || '0000')}</span>
                </div>
                <div style="margin:18px 0 8px">
                  <div style="font-size:11.5px;opacity:.8">Fatura aberta (${esc(ui.monthKey)})</div>
                  <div class="num" style="font-size:24px;font-weight:800">${esc(fmtBrl(used))}</div>
                </div>
                <div style="height:7px;background:rgba(255,255,255,.22);border-radius:999px;overflow:hidden;margin-bottom:8px">
                  <div style="height:100%;width:${pct}%;background:#FFD6B8;border-radius:999px"></div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;opacity:.9">
                  <span>Limite: ${esc(fmtBrl(c.limitAmount))} • Fecha dia ${c.closingDay} / Vence ${c.dueDay}</span>
                  <div style="display:flex;gap:8px">
                    <button type="button" style="padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.22);color:#FFF;font-weight:700" data-action="pay-card" data-id="${esc(
                      c.id
                    )}">Pagar fatura</button>
                    <button type="button" style="color:rgba(255,255,255,.7)" data-action="delete-card" data-id="${esc(
                      c.id
                    )}">🗑</button>
                  </div>
                </div>
              </div>
            `;
          })
          .join('')
      : `<div class="card" style="color:var(--muted);font-size:13.5px">Nenhum cartão de crédito cadastrado ainda.</div>`;

    return `
      <div class="view-enter" style="display:flex;flex-direction:column;gap:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <h2 class="serif-display" style="font-size:22px">Bancos e Cartões do Casal</h2>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn-secondary" data-action="open-bank-modal">＋ Adicionar Banco</button>
            <button type="button" class="btn-primary" data-action="open-card-modal">＋ Adicionar Cartão</button>
          </div>
        </div>
        <div class="grid-2">${banksHtml}</div>
        <h3 class="serif-display" style="font-size:19px;margin-top:6px">Cartões de Crédito</h3>
        <div class="grid-2">${cardsHtml}</div>
      </div>
    `;
  }

  function renderGoals() {
    const cards = appState.savingsGoals.length
      ? appState.savingsGoals
          .map((g) => {
            const pct = Math.min(100, Math.round((Number(g.currentAmount || 0) / Math.max(1, g.targetAmount)) * 100));
            return `
              <div class="card goal-big-card">
                <div class="goal-hero-img">
                  <img src="${esc(resolveGoalPhoto(g))}" alt="${esc(g.title)}" />
                  <button type="button" class="goal-photo-chip" data-action="change-goal-photo" data-id="${esc(
                    g.id
                  )}">📷 Trocar foto</button>
                </div>
                <div style="padding:16px 18px;display:flex;flex-direction:column;gap:10px">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong style="font-size:16px">${esc(g.icon || '🎯')} ${esc(g.title)}</strong>
                    <span class="pill-count ok num">${pct}%</span>
                  </div>
                  <div class="goal-bar-track" style="height:10px"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
                  <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--muted)">
                    <span class="num">Guardado: <strong style="color:var(--ink)">${esc(fmtBrl(g.currentAmount))}</strong></span>
                    <span class="num">Alvo: ${esc(fmtBrl(g.targetAmount))}</span>
                  </div>
                  <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
                    <button type="button" class="btn-secondary" style="flex:1;justify-content:center" data-action="dep-goal" data-id="${esc(
                      g.id
                    )}" data-amt="100">+ R$ 100</button>
                    <button type="button" class="btn-secondary" style="flex:1;justify-content:center" data-action="dep-goal" data-id="${esc(
                      g.id
                    )}" data-amt="500">+ R$ 500</button>
                    <button type="button" class="btn-primary" style="padding:8px 12px" data-action="quick-deposit" data-id="${esc(
                      g.id
                    )}">Outro</button>
                    <button type="button" class="btn-secondary" style="padding:8px 10px" data-action="delete-goal" data-id="${esc(
                      g.id
                    )}">🗑</button>
                  </div>
                </div>
              </div>
            `;
          })
          .join('')
      : `<div class="card">Nenhuma meta cadastrada. Clique em "＋ Nova Meta" para começar com fotos personalizadas!</div>`;

    return `
      <div class="view-enter" style="display:flex;flex-direction:column;gap:18px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h2 class="serif-display" style="font-size:22px">Metas e Sonhos do Casal</h2>
          <button type="button" class="btn-primary" data-action="open-goal-modal">＋ Nova Meta</button>
        </div>
        <div class="grid-3">${cards}</div>
      </div>
    `;
  }

  function renderPlanning() {
    const salariesHtml = appState.fixedIncomes.length
      ? appState.fixedIncomes
          .map((f) => {
            const credited = (f.creditedMonths || []).includes(ui.monthKey);
            return `
              <div class="kv-row">
                <div>
                  <strong>${esc(f.title)}</strong>
                  <div style="font-size:11.5px;color:var(--muted)">Dia ${f.payDay} • ${esc(resolveOwnerName(f.owner))}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <strong class="num" style="color:var(--green)">+${esc(fmtBrl(f.amount))}</strong>
                  <button type="button" class="pill-count ${credited ? 'ok' : ''}" data-action="credit-salary" data-id="${esc(
              f.id
            )}">${credited ? '✓ Recebido' : 'Receber'}</button>
                  <button type="button" class="btn-secondary" style="padding:4px 8px" data-action="delete-salary" data-id="${esc(
                    f.id
                  )}">🗑</button>
                </div>
              </div>
            `;
          })
          .join('')
      : `<div style="color:var(--muted);font-size:13px;padding:10px 0">Cadastre seu salário fixo para ele entrar todo mês automaticamente sem digitar toda hora.</div>`;

    const billsHtml = appState.recurringBills.length
      ? appState.recurringBills
          .map((b) => {
            const paid = (b.paidMonths || []).includes(ui.monthKey);
            return `
              <div class="kv-row">
                <div>
                  <strong>${esc(b.title)}</strong>
                  <div style="font-size:11.5px;color:var(--muted)">Dia ${b.dueDay} • ${esc(b.category || 'Moradia')}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <strong class="num">${esc(fmtBrl(b.amount))}</strong>
                  <button type="button" class="pill-count ${paid ? 'ok' : ''}" data-action="toggle-bill" data-id="${esc(
              b.id
            )}">${paid ? '✓ Pago' : 'Pagar'}</button>
                  <button type="button" class="btn-secondary" style="padding:4px 8px" data-action="delete-bill" data-id="${esc(
                    b.id
                  )}">🗑</button>
                </div>
              </div>
            `;
          })
          .join('')
      : `<div style="color:var(--muted);font-size:13px;padding:10px 0">Nenhuma conta fixa cadastrada ainda (Aluguel, Luz, Internet, etc.).</div>`;

    const met = computeMetrics(ui.monthKey, ui.scope);
    const catTotals = Object.fromEntries(met.catEntries);
    const budgetsHtml = appState.categoryBudgets.length
      ? appState.categoryBudgets
          .map((b) => {
            const spent = Number(catTotals[b.category] || 0);
            const pct = Math.min(100, Math.round((spent / Math.max(1, b.monthlyLimit)) * 100));
            return `
              <div style="padding:8px 0;border-bottom:1px dashed var(--border)">
                <div style="display:flex;justify-content:space-between;font-size:13px">
                  <strong>${esc(b.category)}</strong>
                  <span class="num">${esc(fmtBrl(spent))} / ${esc(fmtBrl(b.monthlyLimit))} (${pct}%)</span>
                </div>
                <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${pct}%;background:${
              pct >= 95 ? 'var(--red)' : pct >= 75 ? 'var(--amber)' : 'var(--green)'
            }"></div></div>
              </div>
            `;
          })
          .join('')
      : `<div style="color:var(--muted);font-size:13px">Defina limites por categoria.</div>`;

    return `
      <div class="view-enter" style="display:flex;flex-direction:column;gap:18px">
        <div class="grid-2">
          <div class="card">
            <div class="card-head">
              <div class="card-title"><span>💵</span><span>Salário Fixo Mensal</span></div>
              <button type="button" class="btn-primary" style="padding:7px 12px;font-size:12px" data-action="open-salary-modal">＋ Adicionar Salário</button>
            </div>
            ${salariesHtml}
          </div>

          <div class="card">
            <div class="card-head">
              <div class="card-title"><span>🏠</span><span>Contas Fixas da Casa</span></div>
              <button type="button" class="btn-primary" style="padding:7px 12px;font-size:12px" data-action="open-bill-modal">＋ Adicionar Conta</button>
            </div>
            ${billsHtml}
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title"><span>🎚️</span><span>Orçamentos por Categoria (${esc(formatMonthLabel(ui.monthKey))})</span></div>
            <button type="button" class="btn-secondary" data-action="open-budget-modal">＋ Definir Limite</button>
          </div>
          ${budgetsHtml}
        </div>
      </div>
    `;
  }

  function renderCalendar() {
    const [y, m] = ui.monthKey.split('-').map(Number);
    const firstDow = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const today = todayIso();

    const headers = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      .map((d) => `<div style="text-align:center;font-size:11.5px;font-weight:800;color:var(--muted)">${d}</div>`)
      .join('');

    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += `<div></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${ui.monthKey}-${String(day).padStart(2, '0')}`;
      const tags = [];
      for (const f of appState.fixedIncomes.filter((x) => x.active && x.payDay === day)) {
        tags.push(`<div class="cal-tag income">+ ${esc(f.title)}</div>`);
      }
      for (const b of appState.recurringBills.filter((x) => x.dueDay === day)) {
        tags.push(`<div class="cal-tag bill">${esc(b.title)} ${esc(fmtBrl(b.amount))}</div>`);
      }
      for (const ev of appState.calendarEvents.filter((x) => x.date === iso)) {
        tags.push(`<div class="cal-tag event">${esc(ev.title)}</div>`);
      }
      cells += `
        <div class="cal-cell ${iso === today ? 'today' : ''}">
          <div style="font-size:12px;font-weight:800">${day}</div>
          ${tags.slice(0, 3).join('')}
        </div>
      `;
    }

    return `
      <div class="view-enter card" style="display:flex;flex-direction:column;gap:14px">
        <div class="card-head" style="margin:0">
          <div class="card-title"><span>📅</span><span>Calendário Financeiro • ${esc(formatMonthLabel(ui.monthKey))}</span></div>
          <button type="button" class="btn-primary" data-action="open-event-modal">＋ Novo Evento</button>
        </div>
        <div class="cal-grid-7">${headers}${cells}</div>
      </div>
    `;
  }

  function renderReports() {
    const met = computeMetrics(ui.monthKey, ui.scope);
    const series = computeSixMonthSeries(ui.monthKey);
    const hisName = appState.userName || 'Você';
    const herName = appState.partnerName || 'Esposa';

    const byOwner = { eu: 0, esposa: 0, casal: 0 };
    for (const t of met.mTx) {
      if (t.type === 'expense') byOwner[t.owner || 'casal'] = (byOwner[t.owner || 'casal'] || 0) + Number(t.amount || 0);
    }
    const maxO = Math.max(1, byOwner.eu, byOwner.esposa, byOwner.casal);

    const barsHtml = series
      .map((s) => {
        const mx = Math.max(1, s.income, s.expense);
        return `
          <div style="display:flex;flex-direction:column;gap:4px;padding:6px 0">
            <div style="display:flex;justify-content:space-between;font-size:12px">
              <strong style="text-transform:capitalize">${esc(s.label)}</strong>
              <span class="num">+${esc(fmtBrl(s.income))} / -${esc(fmtBrl(s.expense))}</span>
            </div>
            <div class="goal-bar-track" style="height:7px"><div class="goal-bar-fill" style="width:${Math.round(
              (s.income / mx) * 100
            )}%;background:var(--green)"></div></div>
            <div class="goal-bar-track" style="height:7px"><div class="goal-bar-fill" style="width:${Math.round(
              (s.expense / mx) * 100
            )}%;background:var(--terracotta)"></div></div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="view-enter grid-2">
        <div class="card">
          <div class="card-head"><div class="card-title"><span>📊</span><span>Entradas vs Saídas (6 meses)</span></div></div>
          ${barsHtml}
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title"><span>👫</span><span>Gastos por Pessoa no Mês</span></div></div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><strong>${esc(hisName)}</strong><strong class="num">${esc(fmtBrl(byOwner.eu))}</strong></div>
              <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${Math.round((byOwner.eu / maxO) * 100)}%"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><strong>${esc(herName)}</strong><strong class="num">${esc(fmtBrl(byOwner.esposa))}</strong></div>
              <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${Math.round((byOwner.esposa / maxO) * 100)}%"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><strong>Casal / Compartilhado</strong><strong class="num">${esc(fmtBrl(byOwner.casal))}</strong></div>
              <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${Math.round((byOwner.casal / maxO) * 100)}%"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdvisorPanelHtml(isDrawer) {
    const res = ui.simResult;
    const cardsOpts = appState.creditCards
      .map((c) => `<option value="${esc(c.id)}" ${ui.sim.cardId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`)
      .join('');

    const verdictHtml = res
      ? `
        <div class="verdict-box verdict-${res.level}">
          <div style="font-weight:800;font-size:14.5px">${res.title}</div>
          <div style="font-size:12.5px;margin-top:5px;line-height:1.45">${res.detail}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;font-size:11.5px">
            <div style="padding:7px 9px;background:rgba(255,255,255,.55);border-radius:10px">Impacto/mês: <strong class="num">${esc(
              fmtBrl(res.monthlySlice)
            )}</strong></div>
            <div style="padding:7px 9px;background:rgba(255,255,255,.55);border-radius:10px">Sobra após: <strong class="num">${esc(
              fmtBrl(res.afterMonth)
            )}</strong></div>
          </div>
        </div>
      `
      : '';

    const chatHtml = ui.chat
      .map((m) => `<div class="chat-bubble ${m.role === 'user' ? 'user' : 'bot'}">${m.html}</div>`)
      .join('');

    const prefix = isDrawer ? 'drw' : 'tab';

    return `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card" style="background:var(--bg-card-soft);padding:14px 16px">
          <div style="font-weight:800;font-size:14px;margin-bottom:10px">🧮 Simulador: Se eu comprar, me aperto?</div>
          <div style="display:grid;grid-template-columns:1fr 110px;gap:8px;margin-bottom:8px">
            <input id="${prefix}SimItem" class="input" placeholder="Ex: Geladeira, Tênis, Viagem..." value="${esc(ui.sim.item)}" />
            <input id="${prefix}SimAmt" class="input" type="number" step="0.01" placeholder="Valor R$" value="${esc(ui.sim.amount)}" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
            <select id="${prefix}SimInst" class="input" style="padding:8px">
              ${[1, 2, 3, 4, 5, 6, 8, 10, 12]
                .map(
                  (n) =>
                    `<option value="${n}" ${Number(ui.sim.installments) === n ? 'selected' : ''}>${
                      n === 1 ? 'À vista (1x)' : n + 'x'
                    }</option>`
                )
                .join('')}
            </select>
            <select id="${prefix}SimOwner" class="input" style="padding:8px">
              <option value="casal" ${ui.sim.owner === 'casal' ? 'selected' : ''}>Casal</option>
              <option value="eu" ${ui.sim.owner === 'eu' ? 'selected' : ''}>${esc(appState.userName || 'Ele')}</option>
              <option value="esposa" ${ui.sim.owner === 'esposa' ? 'selected' : ''}>${esc(appState.partnerName || 'Ela')}</option>
            </select>
            <select id="${prefix}SimCard" class="input" style="padding:8px">
              <option value="">Sem cartão</option>
              ${cardsOpts}
            </select>
          </div>
          <button type="button" class="btn-primary" style="width:100%;justify-content:center" data-action="run-sim" data-prefix="${prefix}">Analisar se cabe no orçamento →</button>
        </div>

        ${verdictHtml}

        <div class="card" style="display:flex;flex-direction:column;gap:10px">
          <div style="font-weight:800;font-size:14px">💬 Pergunte ao Consultor</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn-secondary" style="font-size:11px;padding:5px 10px" data-action="quick-ask" data-q="Quanto ainda sobra livre esse mês?">Quanto sobra?</button>
            <button type="button" class="btn-secondary" style="font-size:11px;padding:5px 10px" data-action="quick-ask" data-q="Se eu comprar algo de R$ 1.800 em 6x eu me aperto esse mês?">Testar R$ 1.800 em 6x</button>
            <button type="button" class="btn-secondary" style="font-size:11px;padding:5px 10px" data-action="quick-ask" data-q="Quais contas ainda faltam pagar esse mês?">Contas pendentes</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;padding:4px 2px">${chatHtml}</div>
          <form data-action="ask-form" data-prefix="${prefix}" style="display:flex;gap:8px">
            <input id="${prefix}AskInp" class="input" placeholder="Ex: Posso gastar R$ 350 hoje no shopping?" />
            <button type="submit" class="btn-primary" style="padding:10px 14px">Perguntar</button>
          </form>
        </div>
      </div>
    `;
  }

  function renderSettings() {
    const hisName = appState.userName || 'Você';
    const herName = appState.partnerName || 'Esposa';
    const brand = appState.financeBrandName || 'Nós no Azul';
    const shareLink =
      appState.cloudFinanceUrl ||
      (ui.cloudCreds
        ? `https://gustavohenriquemm.github.io/drakars-mobile/financeiro.html#gist=${encodeURIComponent(
            ui.cloudCreds.gistId
          )}&token=${encodeURIComponent(ui.cloudCreds.token)}`
        : '');

    return `
      <div class="view-enter grid-2">
        <div class="card" style="display:flex;flex-direction:column;gap:14px">
          <div class="card-title"><span>👫</span><span>Nomes, Marca e Fotos Personalizadas</span></div>
          <div>
            <label class="field-label">Título do Painel</label>
            <input id="cfgBrandInp" class="input" value="${esc(brand)}" />
          </div>
          <div class="grid-2">
            <div>
              <label class="field-label">Seu nome (Ele)</label>
              <input id="cfgHisInp" class="input" value="${esc(hisName)}" />
            </div>
            <div>
              <label class="field-label">Nome dela (Ela)</label>
              <input id="cfgHerInp" class="input" value="${esc(herName)}" />
            </div>
          </div>
          <button type="button" class="btn-primary" data-action="save-profile">Salvar Nomes e Título</button>

          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding-top:8px">
            <div style="text-align:center">
              <div class="avatar-editable" style="margin:0 auto" data-action="upload-person-photo" data-person="casal">
                <img src="${esc(resolvePersonAvatar('casal'))}" />
                <span class="avatar-overlay">📷</span>
              </div>
              <div style="font-size:12px;font-weight:700;margin-top:6px">Foto Casal</div>
            </div>
            <div style="text-align:center">
              <div class="avatar-editable" style="margin:0 auto" data-action="upload-person-photo" data-person="eu">
                <img src="${esc(resolvePersonAvatar('eu'))}" />
                <span class="avatar-overlay">📷</span>
              </div>
              <div style="font-size:12px;font-weight:700;margin-top:6px">${esc(hisName)}</div>
            </div>
            <div style="text-align:center">
              <div class="avatar-editable" style="margin:0 auto" data-action="upload-person-photo" data-person="esposa">
                <img src="${esc(resolvePersonAvatar('esposa'))}" />
                <span class="avatar-overlay">📷</span>
              </div>
              <div style="font-size:12px;font-weight:700;margin-top:6px">${esc(herName)}</div>
            </div>
          </div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;gap:12px">
          <div class="card-title"><span>☁️</span><span>Sincronização Drakars &amp; Link para Esposa</span></div>
          <p style="font-size:13px;color:var(--muted);line-height:1.5">
            Modo atual: <strong>${esc(
              ui.syncMode === 'local'
                ? 'Conectado direto ao Drakars no PC'
                : ui.syncMode === 'cloud'
                  ? 'Conectado ao GitHub Gist na Nuvem'
                  : 'Navegador Local'
            )}</strong>
          </p>
          ${
            shareLink
              ? `<div>
                  <label class="field-label">Link online (abre sincronizado no celular/PC da esposa)</label>
                  <div style="display:flex;gap:8px">
                    <input id="shareUrlBox" class="input" readonly value="${esc(shareLink)}" />
                    <button type="button" class="btn-primary" data-action="copy-share-link">Copiar</button>
                  </div>
                </div>`
              : ''
          }
          <div style="border-top:1px dashed var(--border);padding-top:12px">
            <label class="field-label">Conectar manualmente via GitHub Gist (opcional)</label>
            <input id="cfgGistInp" class="input" style="margin-bottom:8px" placeholder="Gist ID" value="${esc(
              ui.cloudCreds?.gistId || ''
            )}" />
            <input id="cfgTokInp" class="input" style="margin-bottom:8px" type="password" placeholder="GitHub Token (gist)" value="${esc(
              ui.cloudCreds?.token || ''
            )}" />
            <button type="button" class="btn-secondary" data-action="connect-cloud">Conectar à Nuvem</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdvisorContent() {
    if (ui.drawerOpen) {
      const drw = document.getElementById('drawerBody');
      if (drw) drw.innerHTML = renderAdvisorPanelHtml(true);
    }
    if (ui.tab === 'assistant') {
      const vr = document.getElementById('viewRoot');
      if (vr) vr.innerHTML = `<div class="view-enter">${renderAdvisorPanelHtml(false)}</div>`;
    }
  }

  function renderHeader() {
    const his = appState.userName || 'Você';
    const her = appState.partnerName || 'Esposa';
    const brandEl = document.getElementById('brandTitle');
    if (brandEl) brandEl.textContent = appState.financeBrandName || 'Nós no Azul';
    const grEl = document.getElementById('greetingTitle');
    if (grEl) grEl.textContent = `Olá, ${his} e ${her}! 👋`;
    const mEl = document.getElementById('monthLabel');
    if (mEl) mEl.textContent = formatMonthLabel(ui.monthKey);
    const hisBtn = document.getElementById('scopeHisBtn');
    if (hisBtn) hisBtn.textContent = `👤 ${his}`;
    const herBtn = document.getElementById('scopeHerBtn');
    if (herBtn) herBtn.textContent = `👩 ${her}`;
    const av = document.getElementById('coupleAvatarImg');
    if (av) av.src = resolvePersonAvatar('casal');

    document.querySelectorAll('.mode-chip').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-scope') === ui.scope);
    });
    document.querySelectorAll('.nav-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-tab') === ui.tab);
    });

    const met = computeMetrics(ui.monthKey, 'casal');
    const nb = document.getElementById('notifCount');
    if (nb) {
      const cnt = met.unpaidBills.length;
      nb.textContent = String(cnt);
      nb.classList.toggle('hidden', cnt === 0);
    }
  }

  function renderAll() {
    renderHeader();
    const root = document.getElementById('viewRoot');
    if (!root) return;
    if (ui.tab === 'dashboard') root.innerHTML = renderDashboard();
    else if (ui.tab === 'transactions') root.innerHTML = renderTransactions();
    else if (ui.tab === 'accounts') root.innerHTML = renderAccounts();
    else if (ui.tab === 'goals') root.innerHTML = renderGoals();
    else if (ui.tab === 'planning') root.innerHTML = renderPlanning();
    else if (ui.tab === 'calendar') root.innerHTML = renderCalendar();
    else if (ui.tab === 'reports') root.innerHTML = renderReports();
    else if (ui.tab === 'assistant') root.innerHTML = `<div class="view-enter">${renderAdvisorPanelHtml(false)}</div>`;
    else if (ui.tab === 'settings') root.innerHTML = renderSettings();

    animateCounters();
    if (ui.drawerOpen) renderAdvisorContent();
  }

  // -------------------- Modals --------------------
  function openModal(html) {
    const mr = document.getElementById('modalRoot');
    if (!mr) return;
    mr.innerHTML = `<div class="modal-backdrop" data-action="close-modal-bg"><div class="modal-card">${html}</div></div>`;
  }

  function closeModal() {
    const mr = document.getElementById('modalRoot');
    if (mr) mr.innerHTML = '';
  }

  function openTxModal() {
    const bankOpts = appState.bankAccounts.map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
    const cardOpts = appState.creditCards.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 class="serif-display" style="font-size:20px">Novo Lançamento</h3>
        <button type="button" data-action="close-modal">✕</button>
      </div>
      <form data-action="submit-tx" style="display:flex;flex-direction:column;gap:10px">
        <div class="grid-2">
          <div>
            <label class="field-label">Tipo</label>
            <select name="type" class="input">
              <option value="expense">Despesa (-)</option>
              <option value="income">Receita (+)</option>
            </select>
          </div>
          <div>
            <label class="field-label">Valor (R$)</label>
            <input name="amount" type="number" step="0.01" required class="input" placeholder="0,00" />
          </div>
        </div>
        <div>
          <label class="field-label">Descrição</label>
          <input name="title" required class="input" placeholder="Ex: Mercado, Aluguel, Restaurante..." />
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Categoria</label>
            <select name="category" class="input">
              ${CATEGORIES.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label">Quem pagou / recebeu</label>
            <select name="owner" class="input">
              <option value="casal">Casal</option>
              <option value="eu">${esc(appState.userName || 'Ele')}</option>
              <option value="esposa">${esc(appState.partnerName || 'Ela')}</option>
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Forma</label>
            <select name="paymentMethod" class="input">
              <option value="pix">Pix</option>
              <option value="credit">Cartão Crédito</option>
              <option value="debit">Débito</option>
              <option value="cash">Dinheiro</option>
            </select>
          </div>
          <div>
            <label class="field-label">Parcelas</label>
            <select name="installments" class="input">
              ${[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => `<option value="${n}">${n}x</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Conta Bancária</label>
            <select name="accountId" class="input"><option value="">Opcional</option>${bankOpts}</select>
          </div>
          <div>
            <label class="field-label">Cartão de Crédito</label>
            <select name="cardId" class="input"><option value="">Opcional</option>${cardOpts}</select>
          </div>
        </div>
        <div>
          <label class="field-label">Data</label>
          <input name="date" type="date" class="input" value="${todayIso()}" />
        </div>
        <button type="submit" class="btn-primary" style="justify-content:center;margin-top:6px">Salvar Lançamento</button>
      </form>
    `);
  }

  function openGoalModal() {
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 class="serif-display" style="font-size:20px">Nova Meta do Casal</h3>
        <button type="button" data-action="close-modal">✕</button>
      </div>
      <form data-action="submit-goal" style="display:flex;flex-direction:column;gap:10px">
        <div>
          <label class="field-label">Título da Meta</label>
          <input name="title" required class="input" placeholder="Ex: Viagem para o Chile, Entrada do Apê..." />
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Valor Alvo (R$)</label>
            <input name="targetAmount" type="number" step="0.01" required class="input" placeholder="10000" />
          </div>
          <div>
            <label class="field-label">Já Guardado (R$)</label>
            <input name="currentAmount" type="number" step="0.01" class="input" value="0" />
          </div>
        </div>
        <div>
          <label class="field-label">Foto Pronta (ou troque depois por uma foto sua!)</label>
          <select name="imagePreset" class="input">
            <option value="travel">✈️ Viagem / Montanhas</option>
            <option value="house">🏡 Apartamento / Casa</option>
            <option value="emergency">🛡️ Reserva / Cofrinho</option>
          </select>
        </div>
        <button type="submit" class="btn-primary" style="justify-content:center;margin-top:6px">Criar Meta</button>
      </form>
    `);
  }

  function openBankModal() {
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 class="serif-display" style="font-size:20px">Adicionar Conta Bancária</h3>
        <button type="button" data-action="close-modal">✕</button>
      </div>
      <form data-action="submit-bank" style="display:flex;flex-direction:column;gap:10px">
        <div>
          <label class="field-label">Banco</label>
          <select name="bankKey" class="input">
            ${BANKS.map((b) => `<option value="${esc(b.key)}">${esc(b.name)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="field-label">Apelido da Conta</label>
          <input name="name" required class="input" placeholder="Ex: Nubank Conta Conjunta" />
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Titular</label>
            <select name="owner" class="input">
              <option value="casal">Casal</option>
              <option value="eu">${esc(appState.userName || 'Ele')}</option>
              <option value="esposa">${esc(appState.partnerName || 'Ela')}</option>
            </select>
          </div>
          <div>
            <label class="field-label">Saldo Atual (R$)</label>
            <input name="initialBalance" type="number" step="0.01" class="input" value="0" />
          </div>
        </div>
        <button type="submit" class="btn-primary" style="justify-content:center;margin-top:6px">Salvar Conta</button>
      </form>
    `);
  }

  function openCardModal() {
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 class="serif-display" style="font-size:20px">Adicionar Cartão de Crédito</h3>
        <button type="button" data-action="close-modal">✕</button>
      </div>
      <form data-action="submit-card" style="display:flex;flex-direction:column;gap:10px">
        <div class="grid-2">
          <div>
            <label class="field-label">Banco</label>
            <select name="bankKey" class="input">
              ${BANKS.map((b) => `<option value="${esc(b.key)}">${esc(b.name)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label">Nome do Cartão</label>
            <input name="name" required class="input" placeholder="Ex: Ultravioleta" />
          </div>
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Limite (R$)</label>
            <input name="limitAmount" type="number" step="0.01" required class="input" placeholder="5000" />
          </div>
          <div>
            <label class="field-label">Final (4 dígitos)</label>
            <input name="last4" maxlength="4" class="input" placeholder="1234" />
          </div>
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Dia Fechamento</label>
            <input name="closingDay" type="number" min="1" max="31" class="input" value="5" />
          </div>
          <div>
            <label class="field-label">Dia Vencimento</label>
            <input name="dueDay" type="number" min="1" max="31" class="input" value="12" />
          </div>
        </div>
        <button type="submit" class="btn-primary" style="justify-content:center;margin-top:6px">Salvar Cartão</button>
      </form>
    `);
  }

  function openSalaryModal() {
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 class="serif-display" style="font-size:20px">Cadastrar Salário / Renda Fixa</h3>
        <button type="button" data-action="close-modal">✕</button>
      </div>
      <form data-action="submit-salary" style="display:flex;flex-direction:column;gap:10px">
        <div>
          <label class="field-label">Descrição</label>
          <input name="title" required class="input" placeholder="Ex: Salário Mensal" />
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Valor Líquido (R$)</label>
            <input name="amount" type="number" step="0.01" required class="input" placeholder="4500" />
          </div>
          <div>
            <label class="field-label">Dia do Pagamento</label>
            <input name="payDay" type="number" min="1" max="31" class="input" value="5" />
          </div>
        </div>
        <div>
          <label class="field-label">Pessoa</label>
          <select name="owner" class="input">
            <option value="eu">${esc(appState.userName || 'Ele')}</option>
            <option value="esposa">${esc(appState.partnerName || 'Ela')}</option>
            <option value="casal">Casal</option>
          </select>
        </div>
        <button type="submit" class="btn-primary" style="justify-content:center;margin-top:6px">Salvar Salário Fixo</button>
      </form>
    `);
  }

  function openBillModal() {
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 class="serif-display" style="font-size:20px">Nova Conta Fixa</h3>
        <button type="button" data-action="close-modal">✕</button>
      </div>
      <form data-action="submit-bill" style="display:flex;flex-direction:column;gap:10px">
        <div>
          <label class="field-label">Nome da Conta</label>
          <input name="title" required class="input" placeholder="Ex: Aluguel, Internet, Energia..." />
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Valor (R$)</label>
            <input name="amount" type="number" step="0.01" required class="input" />
          </div>
          <div>
            <label class="field-label">Dia Vencimento</label>
            <input name="dueDay" type="number" min="1" max="31" class="input" value="10" />
          </div>
        </div>
        <div class="grid-2">
          <div>
            <label class="field-label">Categoria</label>
            <select name="category" class="input">
              ${CATEGORIES.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="field-label">Responsável</label>
            <select name="owner" class="input">
              <option value="casal">Casal</option>
              <option value="eu">${esc(appState.userName || 'Ele')}</option>
              <option value="esposa">${esc(appState.partnerName || 'Ela')}</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn-primary" style="justify-content:center;margin-top:6px">Salvar Conta</button>
      </form>
    `);
  }

  // -------------------- Event Delegation --------------------
  document.addEventListener('click', async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const navEl = target.closest('[data-nav], [data-tab]');
    if (navEl) {
      const t = navEl.getAttribute('data-nav') || navEl.getAttribute('data-tab');
      if (t) {
        ui.tab = t;
        document.getElementById('sidebar')?.classList.remove('open');
        renderAll();
        return;
      }
    }

    const scopeEl = target.closest('[data-scope]');
    if (scopeEl) {
      ui.scope = scopeEl.getAttribute('data-scope') || 'casal';
      renderAll();
      return;
    }

    const actEl = target.closest('[data-action]');
    if (!actEl) return;
    const act = actEl.getAttribute('data-action');
    const id = actEl.getAttribute('data-id') || '';

    if (act === 'close-modal' || (act === 'close-modal-bg' && target === actEl)) {
      closeModal();
    } else if (act === 'open-tx-modal') {
      openTxModal();
    } else if (act === 'open-goal-modal') {
      openGoalModal();
    } else if (act === 'open-bank-modal') {
      openBankModal();
    } else if (act === 'open-card-modal') {
      openCardModal();
    } else if (act === 'open-salary-modal') {
      openSalaryModal();
    } else if (act === 'open-bill-modal') {
      openBillModal();
    } else if (act === 'open-budget-modal') {
      const cat = prompt('Categoria do orçamento (ex: Mercado, Lazer):', 'Mercado');
      const lim = cat ? prompt(`Limite mensal em R$ para ${cat}:`, '1000') : null;
      if (cat && lim && Number(lim) >= 0) {
        await dispatchAction('save_budget', { category: cat, monthlyLimit: Number(lim) });
        toast('Orçamento salvo!');
      }
    } else if (act === 'open-event-modal') {
      const title = prompt('Nome do evento/lembrete:');
      const date = title ? prompt('Data (AAAA-MM-DD):', todayIso()) : null;
      if (title && date) {
        await dispatchAction('add_calendar_event', { title, date });
        toast('Evento adicionado!');
      }
    } else if (act === 'toggle-bill') {
      await dispatchAction('toggle_bill_paid', { id, monthKey: ui.monthKey });
      launchConfetti();
      toast('Conta atualizada!');
    } else if (act === 'delete-bill') {
      await dispatchAction('delete_bill', { id });
    } else if (act === 'credit-salary') {
      await dispatchAction('toggle_fixed_income_credited', { id, monthKey: ui.monthKey });
      launchConfetti();
      toast('Salário atualizado!');
    } else if (act === 'delete-salary') {
      await dispatchAction('delete_fixed_income', { id });
    } else if (act === 'toggle-tx-paid') {
      await dispatchAction('toggle_transaction_paid', { id });
    } else if (act === 'delete-tx') {
      await dispatchAction('delete_transaction', { id });
    } else if (act === 'delete-bank') {
      await dispatchAction('delete_bank', { id });
    } else if (act === 'pay-card') {
      await dispatchAction('pay_card_invoice', { cardId: id, monthKey: ui.monthKey });
      launchConfetti();
      toast('Fatura marcada como paga!');
    } else if (act === 'delete-card') {
      await dispatchAction('delete_card', { id });
    } else if (act === 'dep-goal') {
      const amt = Number(actEl.getAttribute('data-amt') || 100);
      await dispatchAction('contribute_goal', { id, deltaAmount: amt });
      launchConfetti();
      toast(`+${fmtBrl(amt)} na meta!`);
    } else if (act === 'quick-deposit') {
      const v = prompt('Quanto deseja guardar nesta meta? (R$)', '250');
      const amt = Number(String(v || '').replace(',', '.'));
      if (amt > 0) {
        await dispatchAction('contribute_goal', { id, deltaAmount: amt });
        launchConfetti();
        toast(`+${fmtBrl(amt)} adicionado à meta!`);
      }
    } else if (act === 'delete-goal') {
      await dispatchAction('delete_goal', { id });
    } else if (act === 'upload-person-photo') {
      const person = actEl.getAttribute('data-person') || 'casal';
      const dataUrl = await pickAndCompressPhoto(180, 180, 0.78);
      if (dataUrl) {
        const key =
          person === 'eu'
            ? 'hisPhotoDataUrl'
            : person === 'esposa'
              ? 'herPhotoDataUrl'
              : 'couplePhotoDataUrl';
        await dispatchAction('update_finance_profile', { [key]: dataUrl });
        toast('Foto atualizada com sucesso!');
      }
    } else if (act === 'change-goal-photo') {
      const goal = appState.savingsGoals.find((g) => g.id === id);
      if (!goal) return;
      const dataUrl = await pickAndCompressPhoto(320, 210, 0.76);
      if (dataUrl) {
        await dispatchAction('save_goal', { ...goal, imageUrl: dataUrl });
        toast('Foto da meta atualizada!');
      }
    } else if (act === 'run-sim') {
      const px = actEl.getAttribute('data-prefix') || 'tab';
      ui.sim.item = document.getElementById(`${px}SimItem`)?.value || '';
      ui.sim.amount = document.getElementById(`${px}SimAmt`)?.value || '';
      ui.sim.installments = document.getElementById(`${px}SimInst`)?.value || '1';
      ui.sim.owner = document.getElementById(`${px}SimOwner`)?.value || 'casal';
      ui.sim.cardId = document.getElementById(`${px}SimCard`)?.value || '';
      ui.sim.method = ui.sim.cardId || Number(ui.sim.installments) > 1 ? 'credit' : 'pix';
      ui.simResult = evaluateSimulation(ui.sim);
      renderAdvisorContent();
    } else if (act === 'quick-ask') {
      const q = actEl.getAttribute('data-q') || '';
      await handleAskAdvisor(q);
    } else if (act === 'save-profile') {
      const brand = document.getElementById('cfgBrandInp')?.value?.trim() || 'Nós no Azul';
      const his = document.getElementById('cfgHisInp')?.value?.trim() || 'Você';
      const her = document.getElementById('cfgHerInp')?.value?.trim() || 'Esposa';
      await dispatchAction('update_finance_profile', {
        financeBrandName: brand,
        userName: his,
        partnerName: her,
      });
      toast('Perfil atualizado no painel e no Drakars!');
    } else if (act === 'copy-share-link') {
      const box = document.getElementById('shareUrlBox');
      if (box && navigator.clipboard) {
        await navigator.clipboard.writeText(box.value);
        toast('Link copiado! Pode enviar para sua esposa.');
      }
    } else if (act === 'connect-cloud') {
      const gistId = document.getElementById('cfgGistInp')?.value?.trim() || '';
      const token = document.getElementById('cfgTokInp')?.value?.trim() || '';
      if (!gistId || !token) return toast('Preencha o Gist ID e o Token.');
      ui.cloudCreds = { gistId, token };
      localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(ui.cloudCreds));
      const ok = await pullCloudGist();
      if (ok) {
        ui.syncMode = 'cloud';
        updateSyncBadge();
        renderAll();
        toast('Conectado ao Gist na nuvem!');
      } else {
        toast('Não foi possível ler esse Gist. Verifique ID e Token.');
      }
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    const act = form.getAttribute('data-action');
    if (!act) return;
    e.preventDefault();
    const fd = new FormData(form);
    const obj = Object.fromEntries(fd.entries());

    if (act === 'ask-form') {
      const px = form.getAttribute('data-prefix') || 'tab';
      const inp = document.getElementById(`${px}AskInp`);
      const q = inp ? inp.value : '';
      if (inp) inp.value = '';
      await handleAskAdvisor(q);
      return;
    }

    if (act === 'submit-tx') {
      await dispatchAction('add_transaction', obj);
      closeModal();
      launchConfetti();
      toast('Lançamento registrado!');
    } else if (act === 'submit-goal') {
      await dispatchAction('save_goal', obj);
      closeModal();
      launchConfetti();
      toast('Meta criada!');
    } else if (act === 'submit-bank') {
      await dispatchAction('save_bank', obj);
      closeModal();
      toast('Banco adicionado!');
    } else if (act === 'submit-card') {
      await dispatchAction('save_card', obj);
      closeModal();
      toast('Cartão adicionado!');
    } else if (act === 'submit-salary') {
      await dispatchAction('save_fixed_income', { ...obj, active: true });
      closeModal();
      toast('Salário fixo cadastrado!');
    } else if (act === 'submit-bill') {
      await dispatchAction('save_bill', obj);
      closeModal();
      toast('Conta fixa cadastrada!');
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.id === 'txSearchInp') {
      ui.search = t.value;
      renderAll();
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.id === 'txTypeSel') {
      ui.txFilterType = t.value;
      renderAll();
    }
  });

  document.addEventListener('mouseover', (e) => {
    const seg = e.target && e.target.closest ? e.target.closest('[data-donut-cat]') : null;
    if (!seg) return;
    const valEl = document.getElementById('donutCenterVal');
    const subEl = document.getElementById('donutCenterSub');
    if (valEl) valEl.textContent = seg.getAttribute('data-donut-val') || '';
    if (subEl) subEl.textContent = `${seg.getAttribute('data-donut-cat')} (${seg.getAttribute('data-donut-pct')})`;
  });

  // Top Header Controls
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
  document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    ui.monthKey = shiftMonthKey(ui.monthKey, -1);
    renderAll();
  });
  document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    ui.monthKey = shiftMonthKey(ui.monthKey, 1);
    renderAll();
  });
  document.getElementById('newTxTopBtn')?.addEventListener('click', openTxModal);
  document.getElementById('coupleAvatarBtn')?.addEventListener('click', () => {
    ui.tab = 'settings';
    renderAll();
  });
  document.getElementById('advisorFab')?.addEventListener('click', () => {
    ui.drawerOpen = true;
    document.getElementById('advisorDrawer')?.classList.remove('hidden');
    renderAdvisorContent();
  });
  document.getElementById('closeAdvisorBtn')?.addEventListener('click', () => {
    ui.drawerOpen = false;
    document.getElementById('advisorDrawer')?.classList.add('hidden');
  });
  document.getElementById('notifBellBtn')?.addEventListener('click', () => {
    const pop = document.getElementById('notifPopover');
    if (!pop) return;
    ui.notifOpen = !ui.notifOpen;
    pop.classList.toggle('hidden', !ui.notifOpen);
    if (ui.notifOpen) {
      const met = computeMetrics(ui.monthKey, 'casal');
      pop.innerHTML = `
        <div style="font-weight:800;font-size:14px;margin-bottom:8px">🔔 Lembretes do Mês</div>
        ${
          met.unpaidBills.length
            ? met.unpaidBills
                .map(
                  (b) =>
                    `<div class="kv-row"><span>${esc(b.title)} (dia ${b.dueDay})</span><strong class="num">${esc(
                      fmtBrl(b.amount)
                    )}</strong></div>`
                )
                .join('')
            : '<div style="font-size:13px;color:var(--muted)">Nenhuma conta pendente neste mês 🎉</div>'
        }
      `;
    }
  });

  initSync();
})();
