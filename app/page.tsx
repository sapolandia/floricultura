'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
// hooks importados acima
import {
  Home, Package, Users, ClipboardCheck,
  Plus, Trash2, X, ChevronRight, TrendingUp, AlertCircle, Phone, LogOut,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";

/* =====================================================================
   SUPABASE CLIENT
===================================================================== */
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/* =====================================================================
   MAPPERS — converte snake_case do banco para camelCase do app
===================================================================== */
function mapProduct(row) {
  return {
    id: row.id,
    nome: row.nome,
    estoqueAtual: row.estoque_atual,
    valor: parseFloat(row.valor),
    estoqueMinimo: row.estoque_minimo,
  }
}
function mapSeller(row) {
  return { id: row.id, nome: row.nome, contato: row.contato || '', regiao: row.regiao || '', ativo: row.ativo }
}
function mapAllocation(row) {
  return {
    id: row.id,
    vendedorId: row.seller_id,
    produtoId: row.product_id,
    quantidade: row.quantidade,
    precoUnitario: parseFloat(row.preco_unitario),
    data: row.data,
    status: row.status,
  }
}
function mapSettlement(row) {
  return {
    id: row.id,
    alocacaoId: row.allocation_id,
    vendedorId: row.seller_id,
    produtoId: row.product_id,
    precoUnitario: parseFloat(row.preco_unitario),
    quantidadeAlocada: row.quantidade_alocada,
    quantidadeVendida: row.quantidade_vendida,
    quantidadeDevolvida: row.quantidade_devolvida,
    valorRecebido: parseFloat(row.valor_recebido),
    valorEsperado: parseFloat(row.valor_esperado),
    diferenca: parseFloat(row.diferenca),
    data: row.data,
  }
}


/* =====================================================================
   PRIMITIVOS estilo shadcn (design system local, tema grafite + verde neon)
===================================================================== */
function cn(...parts) { return parts.filter(Boolean).join(" "); }

function Button({ children, variant = "primary", size = "default", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";
  const variants = {
    primary: "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
    secondary: "bg-white/5 text-zinc-100 hover:bg-white/10 border border-white/10",
    ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-white/5",
    danger: "bg-rose-500 text-white hover:bg-rose-400",
    dangerGhost: "text-rose-400 hover:bg-rose-500/10 border border-rose-500/20",
  };
  const sizes = { default: "h-11 px-5 text-sm", sm: "h-9 px-3 text-xs", icon: "h-9 w-9", lg: "h-12 px-6 text-sm" };
  return (
    <button className={cn(base, variants[variant] || variants.primary, sizes[size] || sizes.default, className)} {...props}>
      {children}
    </button>
  );
}

function Label({ className = "", ...props }) {
  return <label className={cn("text-xs font-medium text-zinc-400", className)} {...props} />;
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-emerald-400 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function SelectField({ value, onChange, placeholder, children, className = "" }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3.5 pr-9 text-sm text-zinc-100 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-emerald-400",
          className
        )}
      >
        {placeholder !== undefined ? <option value="" disabled hidden>{placeholder}</option> : null}
        {children}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 rotate-90 pointer-events-none" />
    </div>
  );
}

function Card({ children, className = "", ...props }) {
  return <div className={cn("rounded-2xl border border-white/10 bg-white/5", className)} {...props}>{children}</div>;
}

function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-white/5 text-zinc-300 border border-white/10",
    neon: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20",
    amber: "bg-amber-400/15 text-amber-300 border border-amber-400/20",
    rose: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)}>{children}</span>;
}

function Stepper({ value, onChange, min = 0, max }) {
  const num = Number(value) || 0;
  const dec = () => onChange(Math.max(min, num - 1));
  const inc = () => onChange(max !== undefined ? Math.min(max, num + 1) : num + 1);
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={dec} className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-lg font-bold flex items-center justify-center active:scale-90 transition-transform hover:bg-white/10">−</button>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 text-center text-base font-bold tabular-nums text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" />
      <button type="button" onClick={inc} className="h-11 w-11 shrink-0 rounded-xl bg-emerald-400 text-emerald-950 text-lg font-bold flex items-center justify-center active:scale-90 transition-transform hover:bg-emerald-300">+</button>
    </div>
  );
}

function Sheet({ open, onOpenChange, children }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onOpenChange(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} />
      {children}
    </div>
  );
}
function SheetContent({ children, className = "" }) {
  return (
    <div className={cn("relative z-10 w-full mt-16 max-h-screen overflow-y-auto rounded-t-3xl border-t border-white/10 bg-zinc-900 p-5 pb-8", className)}>
      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
      {children}
    </div>
  );
}
function SheetHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-3">
      <div>
        <h2 className="text-lg font-bold text-zinc-50 leading-tight">{title}</h2>
        {subtitle ? <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p> : null}
      </div>
      <button onClick={onClose} className="h-8 w-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 active:scale-90 transition-transform hover:bg-white/10">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* =====================================================================
   DADOS (mock) + HELPERS
===================================================================== */
const productsSeed = [
  { id: "p1", nome: "Buquê de Girassóis", estoqueAtual: 60, valor: 45.00, estoqueMinimo: 25 },
  { id: "p2", nome: "Buquê de Rosas", estoqueAtual: 14, valor: 89.90, estoqueMinimo: 25 },
  { id: "p3", nome: "Buquê de Orquídeas", estoqueAtual: 22, valor: 120.00, estoqueMinimo: 0 },
];
const sellersSeed = [
  { id: "v1", nome: "Carlos Mendes", contato: "(13) 99811-2234", regiao: "Praia do Tombo — Guarujá", ativo: true },
  { id: "v2", nome: "Patrícia Souza", contato: "(13) 99722-3345", regiao: "Praia da Enseada — Guarujá", ativo: true },
  { id: "v3", nome: "Jonas Ferreira", contato: "(11) 98655-4456", regiao: "Parque Ibirapuera — SP", ativo: true },
  { id: "v4", nome: "Marisa Lima", contato: "(11) 97544-5567", regiao: "Feira de Pinheiros — SP", ativo: true },
  { id: "v5", nome: "Eduardo Tavares", contato: "(13) 99633-6678", regiao: "Orla de Santos", ativo: false },
];
const settlementsTuples = [
  { v: "v1", p: "p1", data: "2026-06-13", alocada: 10, vendida: 9, devolvida: 1, recebido: 405, preco: 45 },
  { v: "v1", p: "p2", data: "2026-06-13", alocada: 6, vendida: 5, devolvida: 1, recebido: 449.50, preco: 89.90 },
  { v: "v2", p: "p3", data: "2026-06-13", alocada: 5, vendida: 4, devolvida: 1, recebido: 480, preco: 120 },
  { v: "v3", p: "p1", data: "2026-06-14", alocada: 8, vendida: 8, devolvida: 0, recebido: 360, preco: 45 },
  { v: "v4", p: "p2", data: "2026-06-14", alocada: 7, vendida: 6, devolvida: 1, recebido: 500, preco: 89.90 },
  { v: "v5", p: "p3", data: "2026-06-14", alocada: 4, vendida: 3, devolvida: 1, recebido: 360, preco: 120 },
  { v: "v1", p: "p1", data: "2026-06-16", alocada: 12, vendida: 10, devolvida: 2, recebido: 450, preco: 45 },
  { v: "v2", p: "p2", data: "2026-06-16", alocada: 8, vendida: 7, devolvida: 1, recebido: 629.30, preco: 89.90 },
  { v: "v3", p: "p3", data: "2026-06-17", alocada: 6, vendida: 5, devolvida: 1, recebido: 600, preco: 120 },
  { v: "v4", p: "p1", data: "2026-06-17", alocada: 9, vendida: 9, devolvida: 0, recebido: 405, preco: 45 },
  { v: "v5", p: "p2", data: "2026-06-18", alocada: 5, vendida: 4, devolvida: 1, recebido: 380, preco: 89.90 },
  { v: "v1", p: "p3", data: "2026-06-18", alocada: 7, vendida: 6, devolvida: 1, recebido: 720, preco: 120 },
  { v: "v2", p: "p1", data: "2026-06-19", alocada: 10, vendida: 9, devolvida: 1, recebido: 405, preco: 45 },
  { v: "v3", p: "p2", data: "2026-06-19", alocada: 6, vendida: 5, devolvida: 1, recebido: 449.50, preco: 89.90 },
  { v: "v4", p: "p3", data: "2026-06-19", alocada: 4, vendida: 4, devolvida: 0, recebido: 480, preco: 120 },
];
const openAllocTuples = [
  { v: "v1", p: "p1", q: 10, data: "2026-06-20", preco: 45 },
  { v: "v2", p: "p2", q: 6, data: "2026-06-20", preco: 89.90 },
  { v: "v3", p: "p3", q: 5, data: "2026-06-20", preco: 120 },
  { v: "v5", p: "p1", q: 8, data: "2026-06-20", preco: 45 },
];
function buildSeedData() {
  const products = productsSeed.map((p) => ({ ...p }));
  const sellers = sellersSeed.map((s) => ({ ...s }));
  const allocations = [];
  const settlements = [];
  settlementsTuples.forEach((t, i) => {
    const allocId = "a" + (i + 1);
    allocations.push({ id: allocId, vendedorId: t.v, produtoId: t.p, quantidade: t.alocada, data: t.data, status: "fechado", precoUnitario: t.preco });
    const valorEsperado = +(t.vendida * t.preco).toFixed(2);
    const diferenca = +(t.recebido - valorEsperado).toFixed(2);
    settlements.push({
      id: "s" + (i + 1), alocacaoId: allocId, vendedorId: t.v, produtoId: t.p, data: t.data, precoUnitario: t.preco,
      quantidadeAlocada: t.alocada, quantidadeVendida: t.vendida, quantidadeDevolvida: t.devolvida,
      valorRecebido: t.recebido, valorEsperado, diferenca,
    });
  });
  openAllocTuples.forEach((t, i) => {
    allocations.push({ id: "a" + (settlementsTuples.length + i + 1), vendedorId: t.v, produtoId: t.p, quantidade: t.q, data: t.data, status: "aberto", precoUnitario: t.preco });
  });
  return { products, sellers, allocations, settlements };
}

function uid(prefix) { return prefix + "-" + Math.random().toString(36).slice(2, 9); }
function fmtBRL(n) {
  const v = Math.round((n || 0) * 100) / 100;
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtBRLshort(n) {
  const v = n || 0;
  if (v >= 1000) return "R$" + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
  return "R$" + Math.round(v);
}
function fmtDate(iso) { const p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
function fmtDayMonth(iso) { const p = iso.split("-"); return p[2] + "/" + p[1]; }
function todayISO() { return new Date().toISOString().split('T')[0]; }
function stockSeverity(atual, minimo) {
  if (!minimo || minimo <= 0) return "ok";
  const ratio = atual / minimo;
  if (ratio <= 0.5) return "danger";
  if (ratio < 1) return "warn";
  return "ok";
}
function sevVariant(sev) { return sev === "danger" ? "rose" : sev === "warn" ? "amber" : "neon"; }
function sevLabel(sev) { return sev === "danger" ? "Crítico" : sev === "warn" ? "Baixo" : "OK"; }
function initials(name) { return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }

function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 shadow-xl">
      {label ? <p className="text-xs text-zinc-500 mb-0.5">{label}</p> : null}
      <p className="text-sm font-bold text-emerald-300 tabular-nums">{fmt ? fmt(payload[0].value) : payload[0].value}</p>
    </div>
  );
}

/* =====================================================================
   PAINEL
===================================================================== */
function PainelTab({ products, sellers, settlements, alertList }) {
  const mesAtual = "2026-06";
  const settlementsMes = settlements.filter((s) => s.data.startsWith(mesAtual));
  const faturamentoMes = settlementsMes.reduce((s, x) => s + x.valorRecebido, 0);
  const qtdVendidaMes = settlementsMes.reduce((s, x) => s + x.quantidadeVendida, 0);

  const porDiaMap = {};
  settlements.forEach((s) => { porDiaMap[s.data] = (porDiaMap[s.data] || 0) + s.valorRecebido; });
  const chartData = Object.keys(porDiaMap).sort().map((d) => ({ dia: fmtDayMonth(d), valor: +porDiaMap[d].toFixed(2) }));

  return (
    <div className="px-5 pt-5 pb-6 flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 to-transparent p-6">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-emerald-300">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Faturamento · junho</p>
          </div>
          <p className="text-4xl font-extrabold text-zinc-50 tabular-nums mt-2 tracking-tight">{fmtBRL(faturamentoMes)}</p>
          <p className="text-sm text-zinc-500 mt-1">{qtdVendidaMes} unidades vendidas no mês</p>
        </div>
      </div>

      <Card className="p-5">
        <p className="text-sm font-semibold text-zinc-200 mb-4">Faturamento por dia</p>
        <div className="h-44 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={44} tickFormatter={fmtBRLshort} />
              <Tooltip content={<ChartTooltip fmt={fmtBRL} />} cursor={{ stroke: "#4ade80", strokeOpacity: 0.2 }} />
              <Area type="monotone" dataKey="valor" stroke="#4ade80" strokeWidth={2.5} fill="url(#gradVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Produtos</p>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums mt-1">{products.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Vendedores ativos</p>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums mt-1">{sellers.filter((s) => s.ativo !== false).length}</p>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-bold text-zinc-200">Alertas de estoque</h2>
          {alertList.length > 0 && <Badge variant="rose">{alertList.length}</Badge>}
        </div>
        {alertList.length === 0 ? (
          <Card className="p-4"><p className="text-sm text-zinc-500">Tudo certo — nenhum produto abaixo do limite. 🌱</p></Card>
        ) : (
          <div className="flex flex-col gap-2">
            {alertList.map((p) => {
              const sev = stockSeverity(p.estoqueAtual, p.estoqueMinimo);
              return (
                <Card key={p.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{p.nome}</p>
                    <p className="text-xs text-zinc-500 tabular-nums mt-0.5">{p.estoqueAtual} / {p.estoqueMinimo} mínimo</p>
                  </div>
                  <Badge variant={sevVariant(sev)}>{sevLabel(sev)}</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================================================================
   ESTOQUE
===================================================================== */
function EstoqueTab({ products, onEdit, onDelete }) {
  return (
    <div className="px-5 pt-5 pb-6 flex flex-col gap-3">
      {products.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-10">Nenhum produto cadastrado. Toque no + para começar.</p>
      ) : products.map((p) => {
        const sev = stockSeverity(p.estoqueAtual, p.estoqueMinimo);
        const temLimite = p.estoqueMinimo > 0;
        return (
          <Card key={p.id} className="p-4 flex items-center gap-3 transition-colors hover:bg-white/10">
            <button className="flex-1 min-w-0 text-left" onClick={() => onEdit(p.id)}>
              <p className="font-semibold text-sm text-zinc-100 truncate">{p.nome}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {temLimite ? <Badge variant={sevVariant(sev)}>{sevLabel(sev)}</Badge> : null}
                <span className="text-xs text-zinc-500 tabular-nums">{p.estoqueAtual} un. em estoque</span>
              </div>
            </button>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <p className="text-sm font-bold text-emerald-300 tabular-nums">{fmtBRL(p.valor)}</p>
              <button onClick={() => onDelete(p.id)} className="text-zinc-600 hover:text-rose-400 active:scale-90 transition-all"><Trash2 className="h-4 w-4" /></button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ProductSheet({ open, editing, onClose, onSave }) {
  const [quantidade, setQuantidade] = useState(0);
  useEffect(() => { if (open) setQuantidade(editing ? editing.estoqueAtual : 0); }, [open, editing]);
  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const minimoRaw = fd.get("estoqueMinimo");
    onSave({
      nome: (fd.get("nome") || "").toString().trim(),
      valor: parseFloat(fd.get("valor")) || 0,
      estoqueAtual: Number(quantidade) || 0,
      estoqueMinimo: minimoRaw ? parseInt(minimoRaw, 10) || 0 : 0,
    });
  }
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent>
        <SheetHeader title={editing ? "Editar produto" : "Novo produto"} onClose={onClose} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5"><Label htmlFor="nome">Nome do produto</Label><Input id="nome" name="nome" required defaultValue={editing?.nome || ""} /></div>
          <div className="space-y-1.5"><Label>Quantidade em estoque</Label><Stepper value={quantidade} onChange={setQuantidade} min={0} /></div>
          <div className="space-y-1.5"><Label htmlFor="valor">Valor (R$)</Label><Input id="valor" name="valor" type="number" step="0.01" min="0" required defaultValue={editing?.valor ?? ""} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="estoqueMinimo">Limite para alerta (opcional)</Label>
            <Input id="estoqueMinimo" name="estoqueMinimo" type="number" min="0" defaultValue={editing?.estoqueMinimo || ""} placeholder="deixe vazio para não alertar" />
          </div>
          <Button type="submit" className="w-full mt-1">{editing ? "Salvar alterações" : "Cadastrar produto"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ConfirmDeleteSheet({ open, productName, onClose, onConfirm }) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent>
        <SheetHeader title="Excluir produto" onClose={onClose} />
        <p className="text-sm text-zinc-400 mb-5">Tem certeza que deseja excluir <strong className="text-zinc-100">{productName}</strong>? Essa ação não pode ser desfeita.</p>
        <div className="flex flex-col gap-2">
          <Button variant="danger" className="w-full" onClick={onConfirm}>Excluir produto</Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>Cancelar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* =====================================================================
   VENDEDORES
===================================================================== */
function SellerCard({ seller, faturamento, onOpen }) {
  const ativo = seller.ativo !== false;
  return (
    <button onClick={() => onOpen(seller.id)} className={cn("w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3 transition-colors hover:bg-white/10", !ativo && "opacity-50")}>
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0", ativo ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-zinc-500")}>
        {initials(seller.nome)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-zinc-100 truncate">{seller.nome}</p>
          {!ativo ? <Badge>Inativo</Badge> : null}
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">{seller.regiao}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-zinc-500">Faturamento</p>
        <p className="text-sm font-bold text-emerald-300 tabular-nums">{fmtBRL(faturamento)}</p>
      </div>
    </button>
  );
}

function VendedoresTab({ sellers, settlements, onOpenDetail }) {
  const [filtro, setFiltro] = useState("ativos");
  const filtered = sellers.filter((v) => {
    const ativo = v.ativo !== false;
    if (filtro === "ativos") return ativo;
    if (filtro === "inativos") return !ativo;
    return true;
  });
  return (
    <div className="px-5 pt-5 pb-6 flex flex-col gap-4">
      <div className="flex gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
        {[{ v: "ativos", l: "Ativos" }, { v: "inativos", l: "Inativos" }, { v: "todos", l: "Todos" }].map((o) => (
          <button key={o.v} onClick={() => setFiltro(o.v)} className={cn("flex-1 rounded-lg py-2 text-xs font-semibold transition-all", filtro === o.v ? "bg-emerald-400 text-emerald-950" : "text-zinc-500 hover:text-zinc-300")}>{o.l}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-10">Nenhum vendedor {filtro === "inativos" ? "inativo" : filtro === "ativos" ? "ativo" : "cadastrado"}.</p>
        ) : filtered.map((v) => (
          <SellerCard key={v.id} seller={v} faturamento={settlements.filter((s) => s.vendedorId === v.id).reduce((sum, s) => sum + s.valorRecebido, 0)} onOpen={onOpenDetail} />
        ))}
      </div>
    </div>
  );
}

function SellerFormSheet({ open, onClose, onSave }) {
  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSave({ nome: (fd.get("nome") || "").toString().trim(), contato: (fd.get("contato") || "").toString().trim(), regiao: (fd.get("regiao") || "").toString().trim() });
  }
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent>
        <SheetHeader title="Novo vendedor" onClose={onClose} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5"><Label htmlFor="snome">Nome</Label><Input id="snome" name="nome" required /></div>
          <div className="space-y-1.5"><Label htmlFor="scontato">Contato</Label><Input id="scontato" name="contato" required placeholder="(11) 90000-0000" /></div>
          <div className="space-y-1.5"><Label htmlFor="sregiao">Região / ponto de venda</Label><Input id="sregiao" name="regiao" required /></div>
          <Button type="submit" className="w-full mt-1">Cadastrar vendedor</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AllocateSheet({ open, seller, products, onClose, onSave, showToast }) {
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  useEffect(() => { if (open) { setProdutoId(""); setQuantidade(1); } }, [open]);
  const prod = products.find((p) => p.id === produtoId);
  function handleSubmit(e) {
    e.preventDefault();
    if (!produtoId) { showToast("Selecione um produto.", "error"); return; }
    const fd = new FormData(e.target);
    onSave({ produtoId, quantidade: Number(quantidade) || 0, data: fd.get("data"), precoUnitario: prod?.valor || 0 });
  }
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent>
        <SheetHeader title="Alocar produto" subtitle={seller?.nome} onClose={onClose} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Produto</Label>
            <SelectField value={produtoId} onChange={setProdutoId} placeholder="Selecione...">
              {products.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.estoqueAtual} un. · {fmtBRL(p.valor)}</option>)}
            </SelectField>
          </div>
          {prod ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-emerald-300/80">Preço travado nesta alocação</p>
              <p className="text-sm font-bold text-emerald-300 tabular-nums">{fmtBRL(prod.valor)}</p>
            </div>
          ) : null}
          <div className="space-y-1.5"><Label>Quantidade</Label><Stepper value={quantidade} onChange={setQuantidade} min={1} max={prod?.estoqueAtual} /></div>
          <div className="space-y-1.5"><Label htmlFor="adata">Data</Label><Input id="adata" name="data" type="date" required defaultValue={todayISO()} /></div>
          <Button type="submit" className="w-full mt-1">Confirmar alocação</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* =====================================================================
   CONTAS — agrupado por vendedor, com visão macro
===================================================================== */
function ContasTab({ sellers, allocations, settlements, onOpenSeller }) {
  // monta linha por vendedor: pendências, faturamento, divergência acumulada
  const linhas = sellers.map((v) => {
    const abertos = allocations.filter((a) => a.vendedorId === v.id && a.status === "aberto");
    const fechados = settlements.filter((s) => s.vendedorId === v.id);
    const faturamento = fechados.reduce((sum, s) => sum + s.valorRecebido, 0);
    const divergencia = fechados.reduce((sum, s) => sum + s.diferenca, 0);
    return { seller: v, pendentes: abertos.length, faturamento, divergencia, totalPrestacoes: fechados.length };
  });
  // ordena: quem tem pendência primeiro, depois por faturamento
  linhas.sort((a, b) => (b.pendentes - a.pendentes) || (b.faturamento - a.faturamento));

  const totalPendentes = linhas.reduce((s, l) => s + l.pendentes, 0);

  return (
    <div className="px-5 pt-5 pb-6 flex flex-col gap-4">
      {totalPendentes > 0 ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-300 shrink-0" />
          <p className="text-sm text-amber-200"><strong className="font-bold">{totalPendentes}</strong> {totalPendentes === 1 ? "acerto pendente" : "acertos pendentes"} aguardando.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {linhas.map((l) => (
          <button key={l.seller.id} onClick={() => onOpenSeller(l.seller.id)} className={cn("w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10", l.seller.ativo === false && "opacity-50")}>
            <div className="flex items-center gap-3">
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0", l.seller.ativo !== false ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-zinc-500")}>
                {initials(l.seller.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-zinc-100 truncate">{l.seller.nome}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{l.totalPrestacoes} {l.totalPrestacoes === 1 ? "prestação" : "prestações"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {l.pendentes > 0 ? <Badge variant="amber">{l.pendentes} pendente{l.pendentes > 1 ? "s" : ""}</Badge> : null}
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <div>
                <p className="text-xs text-zinc-500">Faturamento</p>
                <p className="text-sm font-bold text-zinc-100 tabular-nums">{fmtBRL(l.faturamento)}</p>
              </div>
              {Math.abs(l.divergencia) >= 0.01 ? (
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Divergência</p>
                  <p className={cn("text-sm font-bold tabular-nums", l.divergencia < 0 ? "text-rose-300" : "text-amber-300")}>{l.divergencia > 0 ? "+" : ""}{fmtBRL(l.divergencia)}</p>
                </div>
              ) : (
                <Badge variant="neon">Em dia</Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Detalhe do vendedor — visão macro + histórico + acertar */
function SellerDetailSheet({ open, seller, products, allocations, settlements, onClose, onAllocate, onSettle, onToggleActive }) {
  if (!seller) return null;
  const ativo = seller.ativo !== false;
  const abertos = allocations.filter((a) => a.vendedorId === seller.id && a.status === "aberto").sort((a, b) => b.data.localeCompare(a.data));
  const fechados = settlements.filter((s) => s.vendedorId === seller.id).sort((a, b) => b.data.localeCompare(a.data));
  const productById = (id) => products.find((p) => p.id === id);

  const faturamento = fechados.reduce((sum, s) => sum + s.valorRecebido, 0);
  const unidades = fechados.reduce((sum, s) => sum + s.quantidadeVendida, 0);
  const divergencia = fechados.reduce((sum, s) => sum + s.diferenca, 0);

  // gráfico: faturamento por produto
  const porProduto = {};
  fechados.forEach((s) => { porProduto[s.produtoId] = (porProduto[s.produtoId] || 0) + s.valorRecebido; });
  const chartData = Object.keys(porProduto).map((pid) => ({ nome: (productById(pid)?.nome || "?").replace("Buquê de ", ""), valor: +porProduto[pid].toFixed(2) }));

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="bg-zinc-900">
        <SheetHeader title={seller.nome} subtitle={seller.regiao} onClose={onClose} />

        <div className="flex items-center gap-4 mb-5 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{seller.contato}</span>
          <Badge variant={ativo ? "neon" : "default"}>{ativo ? "Ativo" : "Inativo"}</Badge>
        </div>

        {/* visão macro */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="p-3">
            <p className="text-xs text-zinc-500">Faturou</p>
            <p className="text-base font-bold text-emerald-300 tabular-nums mt-0.5">{fmtBRLshort(faturamento)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-zinc-500">Vendeu</p>
            <p className="text-base font-bold text-zinc-100 tabular-nums mt-0.5">{unidades} un.</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-zinc-500">Divergência</p>
            <p className={cn("text-base font-bold tabular-nums mt-0.5", Math.abs(divergencia) < 0.01 ? "text-emerald-300" : divergencia < 0 ? "text-rose-300" : "text-amber-300")}>{divergencia > 0 ? "+" : ""}{fmtBRLshort(divergencia)}</p>
          </Card>
        </div>

        {chartData.length > 0 ? (
          <Card className="p-4 mb-5">
            <p className="text-xs font-semibold text-zinc-400 mb-3">Faturamento por produto</p>
            <div className="h-32 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
                  <XAxis dataKey="nome" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={fmtBRLshort} />
                  <Tooltip content={<ChartTooltip fmt={fmtBRL} />} cursor={{ fill: "rgba(74,222,128,0.08)" }} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {chartData.map((e, i) => <Cell key={i} fill="#4ade80" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : null}

        {/* pendentes */}
        {abertos.length > 0 ? (
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300/80 mb-2">Aguardando acerto</p>
            <div className="flex flex-col gap-2">
              {abertos.map((a) => (
                <div key={a.id} className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{productById(a.produtoId)?.nome || "produto removido"}</p>
                    <p className="text-xs text-zinc-500 tabular-nums mt-0.5">{a.quantidade} un. · {fmtBRL(a.precoUnitario)}/un · {fmtDate(a.data)}</p>
                  </div>
                  <Button size="sm" onClick={() => onSettle(a.id)}>Acertar</Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* histórico */}
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Histórico</p>
        {fechados.length === 0 ? (
          <p className="text-sm text-zinc-600 mb-5">Nenhuma prestação registrada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-5">
            {fechados.map((s) => {
              const ok = Math.abs(s.diferenca) < 0.01;
              return (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{productById(s.produtoId)?.nome || "produto removido"}</p>
                    <p className="text-xs text-zinc-500 tabular-nums mt-0.5">{s.quantidadeVendida} vend. · {s.quantidadeDevolvida} dev. · {fmtDate(s.data)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-zinc-100 tabular-nums">{fmtBRL(s.valorRecebido)}</p>
                    {ok ? <Badge variant="neon" className="mt-0.5">Confere</Badge> : <Badge variant={s.diferenca < 0 ? "rose" : "amber"} className="mt-0.5">{s.diferenca > 0 ? "+" : ""}{fmtBRL(s.diferenca)}</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ações */}
        <div className="flex flex-col gap-2">
          {ativo ? (
            <>
              <Button className="w-full" onClick={() => onAllocate(seller.id)}><Plus className="h-4 w-4" />Alocar produto</Button>
              <Button variant="dangerGhost" className="w-full" onClick={() => onToggleActive(seller.id)}>Inativar vendedor</Button>
            </>
          ) : (
            <Button className="w-full" onClick={() => onToggleActive(seller.id)}>Reativar vendedor</Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SettlementSheet({ open, allocation, seller, product, onClose, onSave }) {
  const [vendida, setVendida] = useState(0);
  const [devolvida, setDevolvida] = useState(0);
  const [recebido, setRecebido] = useState(0);
  useEffect(() => { if (open) { setVendida(0); setDevolvida(0); setRecebido(0); } }, [open, allocation?.id]);
  if (!allocation) return null;
  const preco = allocation.precoUnitario || product?.valor || 0;
  const esperado = (Number(vendida) || 0) * preco;
  const diferenca = (Number(recebido) || 0) - esperado;
  const restante = allocation.quantidade - (Number(vendida) || 0) - (Number(devolvida) || 0);
  function handleSubmit(e) { e.preventDefault(); onSave({ vendida: Number(vendida) || 0, devolvida: Number(devolvida) || 0, recebido: Number(recebido) || 0 }); }
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent>
        <SheetHeader title="Acertar contas" subtitle={seller?.nome} onClose={onClose} />
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
          <p className="text-sm font-semibold text-zinc-100">{product?.nome || "produto removido"}</p>
          <p className="text-xs text-zinc-500 tabular-nums mt-1">{allocation.quantidade} un. · {fmtDate(allocation.data)} · travado a {fmtBRL(preco)}/un</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5"><Label>Quantos foram vendidos?</Label><Stepper value={vendida} onChange={setVendida} min={0} max={allocation.quantidade} /></div>
          <div className="space-y-1.5"><Label>Quantos estão devolvendo?</Label><Stepper value={devolvida} onChange={setDevolvida} min={0} max={allocation.quantidade} /></div>
          <div className="space-y-1.5"><Label htmlFor="rec">Valor entregue (R$)</Label><Input id="rec" type="number" min="0" step="0.01" value={recebido} onChange={(e) => setRecebido(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-3 gap-3">
            <div><p className="text-xs text-zinc-500">Esperado</p><p className="text-sm font-bold text-zinc-100 tabular-nums mt-0.5">{fmtBRL(esperado)}</p></div>
            <div><p className="text-xs text-zinc-500">Diferença</p><p className={cn("text-sm font-bold tabular-nums mt-0.5", Math.abs(diferenca) < 0.01 ? "text-emerald-300" : diferenca < 0 ? "text-rose-300" : "text-amber-300")}>{diferenca > 0 ? "+" : ""}{fmtBRL(diferenca)}</p></div>
            <div><p className="text-xs text-zinc-500">Sem acerto</p><p className={cn("text-sm font-bold tabular-nums mt-0.5", restante === 0 ? "text-emerald-300" : "text-rose-300")}>{restante} un.</p></div>
          </div>
          <Button type="submit" className="w-full mt-1">Confirmar acerto</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* =====================================================================
   NAV + APP SHELL
===================================================================== */
const TAB_TITLES = { painel: "Painel", estoque: "Estoque", vendedores: "Vendedores", contas: "Contas" };
const NAV_ITEMS = [
  { id: "painel", label: "Painel", icon: Home },
  { id: "estoque", label: "Estoque", icon: Package },
  { id: "vendedores", label: "Vendedores", icon: Users },
  { id: "contas", label: "Contas", icon: ClipboardCheck },
];

function TopBar({ title, onSignOut }) {
  return (
    <div className="shrink-0 border-b border-white/10 px-5 pt-5 pb-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-950" fill="currentColor"><path d="M12 2C8 6 7 9 9 13c.5 1 1.5 2 3 2s2.5-1 3-2c2-4 1-7-3-11z" /><path d="M12 15v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Floricultura</p>
        <h1 className="text-lg font-bold text-zinc-50 leading-tight">{title}</h1>
      </div>
      <button onClick={onSignOut} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors active:scale-90" title="Sair">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function BottomNav({ tab, setTab, pendingCount }) {
  return (
    <nav className="shrink-0 border-t border-white/10 bg-zinc-950/50 px-2 pt-2 pb-4 flex items-stretch justify-between">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button key={item.id} onClick={() => setTab(item.id)} className="flex-1 flex flex-col items-center gap-1 py-1 active:scale-95 transition-transform">
            <span className={cn("relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors", active ? "bg-emerald-400/15" : "")}>
              <Icon className={cn("h-5 w-5 transition-colors", active ? "text-emerald-400" : "text-zinc-600")} />
              {item.id === "contas" && pendingCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-amber-400 text-zinc-950 text-xs font-bold flex items-center justify-center leading-none">{pendingCount}</span>
              ) : null}
            </span>
            <span className={cn("text-xs font-semibold transition-colors", active ? "text-emerald-400" : "text-zinc-600")}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function FAB({ onClick }) {
  return (
    <button onClick={onClick} className="absolute bottom-24 right-5 z-30 h-14 w-14 rounded-2xl bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/30 flex items-center justify-center active:scale-90 transition-transform hover:bg-emerald-300">
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}

export default function App() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [sellers, setSellers] = useState([])
  const [allocations, setAllocations] = useState([])
  const [settlements, setSettlements] = useState([])

  const [tab, setTab] = useState('painel')
  const [sheet, setSheet] = useState(null)
  const [toasts, setToasts] = useState([])

  // ——— Carregamento inicial ———
  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [p, s, a, se] = await Promise.all([
      supabase.from('products').select('*').order('created_at'),
      supabase.from('sellers').select('*').order('created_at'),
      supabase.from('allocations').select('*').order('created_at'),
      supabase.from('settlements').select('*').order('created_at'),
    ])
    setProducts((p.data || []).map(mapProduct))
    setSellers((s.data || []).map(mapSeller))
    setAllocations((a.data || []).map(mapAllocation))
    setSettlements((se.data || []).map(mapSettlement))
    setLoading(false)
  }

  // ——— Auth ———
  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const productById = (id) => products.find((p) => p.id === id)
  const sellerById = (id) => sellers.find((s) => s.id === id)
  const alertList = products.filter((p) => p.estoqueMinimo > 0 && p.estoqueAtual <= p.estoqueMinimo).sort((a, b) => a.estoqueAtual / a.estoqueMinimo - b.estoqueAtual / b.estoqueMinimo)
  const pendingCount = allocations.filter((a) => a.status === 'aberto').length

  function showToast(message, type = 'success') {
    const id = uid('t')
    setToasts((ts) => [...ts, { id, message, type }])
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3200)
  }
  function closeSheet() { setSheet(null) }

  // ——— Produto: criar / editar ———
  async function handleSaveProduct(values, editingId) {
    const payload = { nome: values.nome, valor: values.valor, estoque_atual: values.estoqueAtual, estoque_minimo: values.estoqueMinimo }
    if (editingId) {
      const { data, error } = await supabase.from('products').update(payload).eq('id', editingId).select().single()
      if (error) { showToast('Erro ao atualizar produto.', 'error'); return }
      setProducts(ps => ps.map(p => p.id === editingId ? mapProduct(data) : p))
      showToast('Produto atualizado.')
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single()
      if (error) { showToast('Erro ao criar produto.', 'error'); return }
      setProducts(ps => [...ps, mapProduct(data)])
      showToast('Produto cadastrado.')
    }
    closeSheet()
  }

  // ——— Produto: excluir ———
  async function handleDeleteProduct(id) {
    const p = productById(id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { showToast('Erro ao excluir.', 'error'); return }
    setProducts(ps => ps.filter(x => x.id !== id))
    closeSheet()
    showToast(`"${p ? p.nome : ''}" excluído.`, 'warn')
  }

  // ——— Vendedor: criar ———
  async function handleAddSeller(values) {
    const { data, error } = await supabase.from('sellers').insert({ nome: values.nome, contato: values.contato, regiao: values.regiao, ativo: true }).select().single()
    if (error) { showToast('Erro ao cadastrar vendedor.', 'error'); return }
    setSellers(vs => [...vs, mapSeller(data)])
    closeSheet()
    showToast('Vendedor cadastrado.')
  }

  // ——— Vendedor: ativar / inativar ———
  async function handleToggleActive(id) {
    const seller = sellerById(id)
    if (!seller) return
    const newAtivo = seller.ativo === false ? true : false
    const { data, error } = await supabase.from('sellers').update({ ativo: newAtivo }).eq('id', id).select().single()
    if (error) { showToast('Erro ao atualizar vendedor.', 'error'); return }
    setSellers(vs => vs.map(s => s.id === id ? mapSeller(data) : s))
    setSheet({ type: 'seller-detail', vendedorId: id })
    showToast(`${seller.nome} ${newAtivo ? 'reativado' : 'inativado'}.`, newAtivo ? 'success' : 'warn')
  }

  // ——— Alocação: criar ———
  async function handleAllocate(vendedorId, values) {
    const prod = productById(values.produtoId)
    if (!prod) return
    if (values.quantidade > prod.estoqueAtual) { showToast(`Estoque insuficiente. Disponível: ${prod.estoqueAtual} un.`, 'error'); return }

    const newStock = prod.estoqueAtual - values.quantidade

    // Atualiza estoque do produto
    const { error: pe } = await supabase.from('products').update({ estoque_atual: newStock }).eq('id', values.produtoId)
    if (pe) { showToast('Erro ao atualizar estoque.', 'error'); return }

    // Cria alocação com preço travado
    const { data, error } = await supabase.from('allocations').insert({
      seller_id: vendedorId, product_id: values.produtoId, quantidade: values.quantidade,
      preco_unitario: values.precoUnitario, data: values.data, status: 'aberto'
    }).select().single()

    if (error) {
      // rollback estoque
      await supabase.from('products').update({ estoque_atual: prod.estoqueAtual }).eq('id', values.produtoId)
      showToast('Erro ao criar alocação.', 'error'); return
    }

    setProducts(ps => ps.map(p => p.id === values.produtoId ? { ...p, estoqueAtual: newStock } : p))
    setAllocations(as => [...as, mapAllocation(data)])
    const v = sellerById(vendedorId)
    setSheet({ type: 'seller-detail', vendedorId })
    showToast(`${values.quantidade} un. de ${prod.nome} alocadas para ${v?.nome}.`)
  }

  // ——— Acerto de contas ———
  async function handleSettlement(allocId, values) {
    const a = allocations.find(x => x.id === allocId)
    if (!a) return
    if (values.vendida + values.devolvida > a.quantidade) { showToast('Vendido + devolvido não pode passar do alocado.', 'error'); return }

    const prod = productById(a.produtoId)
    const preco = a.precoUnitario || (prod ? prod.valor : 0)
    const valorEsperado = +(values.vendida * preco).toFixed(2)
    const diferenca = +(values.recebido - valorEsperado).toFixed(2)

    // Retorna unidades devolvidas ao estoque
    if (values.devolvida > 0 && prod) {
      const { error: pe } = await supabase.from('products').update({ estoque_atual: prod.estoqueAtual + values.devolvida }).eq('id', a.produtoId)
      if (pe) { showToast('Erro ao atualizar estoque.', 'error'); return }
    }

    // Fecha a alocação
    const { error: ae } = await supabase.from('allocations').update({ status: 'fechado' }).eq('id', allocId)
    if (ae) { showToast('Erro ao fechar alocação.', 'error'); return }

    // Cria o registro de acerto
    const { data, error } = await supabase.from('settlements').insert({
      allocation_id: allocId, seller_id: a.vendedorId, product_id: a.produtoId,
      preco_unitario: preco, quantidade_alocada: a.quantidade,
      quantidade_vendida: values.vendida, quantidade_devolvida: values.devolvida,
      valor_recebido: values.recebido, valor_esperado: valorEsperado, diferenca,
      data: todayISO()
    }).select().single()

    if (error) { showToast('Erro ao registrar acerto.', 'error'); return }

    if (values.devolvida > 0 && prod) {
      setProducts(ps => ps.map(p => p.id === a.produtoId ? { ...p, estoqueAtual: p.estoqueAtual + values.devolvida } : p))
    }
    setAllocations(as => as.map(x => x.id === allocId ? { ...x, status: 'fechado' } : x))
    setSettlements(ss => [...ss, mapSettlement(data)])
    setSheet({ type: 'seller-detail', vendedorId: a.vendedorId })

    if (Math.abs(diferenca) >= 0.01) showToast(`Acerto com divergência de ${fmtBRL(diferenca)}.`, 'warn')
    else showToast('Acerto registrado com sucesso.')
  }

  const fabAction =
    tab === 'estoque' ? { onClick: () => setSheet({ type: 'product', editingId: null }) } :
    tab === 'vendedores' ? { onClick: () => setSheet({ type: 'seller-form' }) } : null

  const detailSeller = sheet?.vendedorId ? sellerById(sheet.vendedorId) : null
  const settleAlloc = sheet?.type === 'settlement' ? allocations.find((a) => a.id === sheet.allocId) : null

  // ——— Tela de carregamento ———
  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 animate-pulse" />
      <p className="text-zinc-500 text-sm">Carregando...</p>
    </div>
  )

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="min-h-screen w-full bg-black flex justify-center">
        <div className="relative w-full max-w-md h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}>
          <TopBar title={TAB_TITLES[tab]} onSignOut={handleSignOut} />
          <main className="flex-1 overflow-y-auto">
            {tab === 'painel' && <PainelTab products={products} sellers={sellers} settlements={settlements} alertList={alertList} />}
            {tab === 'estoque' && <EstoqueTab products={products} onEdit={(id) => setSheet({ type: 'product', editingId: id })} onDelete={(id) => setSheet({ type: 'delete-product', id })} />}
            {tab === 'vendedores' && <VendedoresTab sellers={sellers} settlements={settlements} onOpenDetail={(id) => setSheet({ type: 'seller-detail', vendedorId: id })} />}
            {tab === 'contas' && <ContasTab sellers={sellers} allocations={allocations} settlements={settlements} onOpenSeller={(id) => setSheet({ type: 'seller-detail', vendedorId: id })} />}
          </main>

          {fabAction ? <FAB onClick={fabAction.onClick} /> : null}
          <BottomNav tab={tab} setTab={setTab} pendingCount={pendingCount} />

          {sheet?.type === 'product' && <ProductSheet open editing={sheet.editingId ? productById(sheet.editingId) : null} onClose={closeSheet} onSave={(v) => handleSaveProduct(v, sheet.editingId)} />}
          {sheet?.type === 'delete-product' && <ConfirmDeleteSheet open productName={productById(sheet.id)?.nome || ''} onClose={closeSheet} onConfirm={() => handleDeleteProduct(sheet.id)} />}
          {sheet?.type === 'seller-form' && <SellerFormSheet open onClose={closeSheet} onSave={handleAddSeller} />}
          {sheet?.type === 'seller-detail' && (
            <SellerDetailSheet open seller={detailSeller} products={products} allocations={allocations} settlements={settlements}
              onClose={closeSheet}
              onAllocate={(id) => setSheet({ type: 'allocate', vendedorId: id })}
              onSettle={(allocId) => setSheet({ type: 'settlement', allocId })}
              onToggleActive={handleToggleActive} />
          )}
          {sheet?.type === 'allocate' && (
            <AllocateSheet open seller={detailSeller} products={products}
              onClose={() => setSheet({ type: 'seller-detail', vendedorId: sheet.vendedorId })}
              onSave={(v) => handleAllocate(sheet.vendedorId, v)} showToast={showToast} />
          )}
          {sheet?.type === 'settlement' && (
            <SettlementSheet open allocation={settleAlloc}
              seller={settleAlloc ? sellerById(settleAlloc.vendedorId) : null}
              product={settleAlloc ? productById(settleAlloc.produtoId) : null}
              onClose={() => settleAlloc ? setSheet({ type: 'seller-detail', vendedorId: settleAlloc.vendedorId }) : closeSheet()}
              onSave={(v) => handleSettlement(sheet.allocId, v)} />
          )}

          <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 60 }}>
            {toasts.map((t) => {
              const border = t.type === 'error' ? 'border-l-rose-400' : t.type === 'warn' ? 'border-l-amber-400' : 'border-l-emerald-400'
              return <div key={t.id} className={cn('rounded-xl border border-white/10 border-l-4 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-100 shadow-xl', border)}>{t.message}</div>
            })}
          </div>
        </div>
      </div>
    </>
  )
}
