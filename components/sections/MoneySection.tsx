"use client";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, Circle, Landmark, Pencil, Plus, Target, Trash2, TrendingUp, WalletCards } from "lucide-react";
import { useState } from "react";
import type { BankAccount, Expense, FinancialGoal, Loan, MoneyData, MoneyPayment } from "@/lib/types";
import { Field, Modal, inputStyle, selectStyle } from "@/components/ui/Modal";

const EXPENSE_CATS = ["Groceries", "Rent", "Transport", "Utilities", "Health", "Entertainment", "Clothing", "Education", "Dining", "Savings", "Subscription", "Insurance", "Other"];
const ACCOUNT_TYPES = ["cheque", "savings", "credit", "investment", "cash"] as const;
const GOAL_COLORS = ["coral", "blue", "purple", "green", "gold"];
const GOAL_COLOR_HEX: Record<string, string> = { coral: "#ed927d", blue: "#80a7ba", purple: "#9c8db2", green: "#7fa087", gold: "#c9980a" };

function fmt(n: number) {
  return "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Tab = "overview" | "accounts" | "expenses" | "cashflow" | "loans" | "goals";

function todayPeriod() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(p: string) {
  const [y, m] = p.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-ZA", { month: "long", year: "numeric" });
}

function nextPeriod(p: string) {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function prevPeriod(p: string) {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MoneySection({
  data,
  onChange,
  onToast,
}: {
  data: MoneyData;
  onChange: (d: MoneyData) => void;
  onToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [showSalary, setShowSalary] = useState(false);

  const totalAssets = data.accounts.filter((a) => a.type !== "credit").reduce((s, a) => s + a.balance, 0);
  const totalDebt = data.loans.reduce((s, l) => s + l.balance, 0) + data.accounts.filter((a) => a.type === "credit").reduce((s, a) => s + a.balance, 0);
  const netWorth = totalAssets - totalDebt;
  const monthExpenses = data.expenses.filter((e) => {
    const now = new Date();
    return e.date.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }).reduce((s, e) => s + e.amount, 0);
  const recurringTotal = data.expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="section-hero">
        <div className="section-icon"><WalletCards size={24} /></div>
        <div>
          <span className="eyebrow">Your space</span>
          <h1>Money</h1>
          <p>Know where you stand without living in a spreadsheet.</p>
        </div>
        <button className="secondary-btn" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }} onClick={() => setShowSalary(true)}>
          <Pencil size={14} /> Edit salary
        </button>
      </div>

      {/* Summary hero */}
      <div className="balance-hero" style={{ marginBottom: 16 }}>
        <span>Net worth</span>
        <strong style={{ fontSize: 38, fontFamily: "Georgia,serif", letterSpacing: "-.8px" }}>{fmt(netWorth)}</strong>
        <p style={{ margin: "8px 0 0" }}>Salary: {fmt(data.salary)} · Recurring commitments: {fmt(recurringTotal)}/mo</p>
        <svg viewBox="0 0 620 120" preserveAspectRatio="none" style={{ position: "absolute", right: -10, bottom: -8, width: "70%", height: 150, color: "#91b19a", opacity: .75 }}>
          <path d="M0 108 C90 86 105 102 170 72 S270 88 335 52 S430 66 490 31 S565 43 620 8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      {/* stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total assets", value: fmt(totalAssets), icon: <TrendingUp size={18} />, color: "#e3eee5" },
          { label: "Total debt", value: fmt(totalDebt), icon: <ArrowDownRight size={18} />, color: "#f9e9e2" },
          { label: "This month spent", value: fmt(monthExpenses), icon: <WalletCards size={18} />, color: "#ece8f4" },
          { label: "Income", value: fmt(data.salary), icon: <ArrowUpRight size={18} />, color: "#e2edf1" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "16px 18px", borderRadius: 16, background: s.color, border: "1px solid rgba(0,0,0,.04)" }}>
            <div style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 9, background: "rgba(255,255,255,.6)", marginBottom: 10 }}>{s.icon}</div>
            <p style={{ margin: 0, fontSize: 10, color: "#696d67" }}>{s.label}</p>
            <strong style={{ fontSize: 18, color: "#252724", letterSpacing: "-.4px" }}>{s.value}</strong>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {(["overview", "accounts", "cashflow", "expenses", "loans", "goals"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 18px", borderRadius: 20, border: "1px solid var(--line)", background: tab === t ? "var(--accent)" : "var(--surface)", color: tab === t ? "#fff" : "var(--text)", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab data={data} fmt={fmt} />}
      {tab === "accounts" && <AccountsTab data={data} onChange={onChange} onToast={onToast} fmt={fmt} />}
      {tab === "cashflow" && <CashflowTab data={data} onChange={onChange} onToast={onToast} fmt={fmt} />}
      {tab === "expenses" && <ExpensesTab data={data} onChange={onChange} onToast={onToast} fmt={fmt} />}
      {tab === "loans" && <LoansTab data={data} onChange={onChange} onToast={onToast} fmt={fmt} />}
      {tab === "goals" && <GoalsTab data={data} onChange={onChange} onToast={onToast} fmt={fmt} />}

      {showSalary && (
        <SalaryModal salary={data.salary} salaryDay={data.salaryDay} onSave={(salary, salaryDay) => { onChange({ ...data, salary, salaryDay }); onToast("Salary updated"); setShowSalary(false); }} onClose={() => setShowSalary(false)} />
      )}
    </div>
  );
}

function OverviewTab({ data, fmt }: { data: MoneyData; fmt: (n: number) => string }) {
  const recent = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const byCategory: Record<string, number> = {};
  data.expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount; });
  const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
      <section className="panel" style={{ padding: 22 }}>
        <div className="panel-head"><div><h2>Recent expenses</h2><p>Latest transactions</p></div></div>
        {recent.length === 0 && <p style={{ color: "var(--muted)", fontSize: 12 }}>No expenses logged yet.</p>}
        {recent.map((e) => (
          <div key={e.id} className="transaction">
            <span className="transaction-icon"><ArrowUpRight size={17} /></span>
            <span><strong>{e.name}</strong><small>{e.category} · {e.date}</small></span>
            <strong style={{ color: "#c0392b" }}>- {fmt(e.amount)}</strong>
          </div>
        ))}
      </section>
      <div style={{ display: "grid", gap: 14 }}>
        <section className="panel" style={{ padding: 22 }}>
          <div className="panel-head"><div><h2>Spending by category</h2></div></div>
          {topCats.length === 0 && <p style={{ color: "var(--muted)", fontSize: 12 }}>No data yet.</p>}
          {topCats.map(([cat, amount]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span>{cat}</span><span>{fmt(amount)}</span>
              </div>
              <div style={{ height: 5, borderRadius: 5, background: "var(--line)" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (amount / (data.salary || 1)) * 100)}%`, background: "var(--accent)", borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </section>
        <section className="panel" style={{ padding: 22 }}>
          <div className="panel-head"><div><h2>Accounts</h2></div></div>
          {data.accounts.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
              <span>{a.name}<small style={{ color: "var(--muted)", marginLeft: 6 }}>({a.type})</small></span>
              <strong>{fmt(a.balance)}</strong>
            </div>
          ))}
          {data.accounts.length === 0 && <p style={{ color: "var(--muted)", fontSize: 12 }}>No accounts added.</p>}
        </section>
      </div>
    </div>
  );
}

function AccountsTab({ data, onChange, onToast, fmt }: { data: MoneyData; onChange: (d: MoneyData) => void; onToast: (m: string) => void; fmt: (n: number) => string }) {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<BankAccount | null>(null);

  function save(acc: Omit<BankAccount, "id">) {
    if (edit) {
      onChange({ ...data, accounts: data.accounts.map((a) => a.id === edit.id ? { ...a, ...acc } : a) });
      onToast("Account updated"); setEdit(null);
    } else {
      onChange({ ...data, accounts: [...data.accounts, { id: Date.now(), ...acc }] });
      onToast("Account added"); setShow(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="primary-btn" onClick={() => setShow(true)}><Plus size={17} /> Add account</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {data.accounts.map((a) => (
          <div key={a.id} style={{ padding: 22, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}><Landmark size={14} /> {a.type}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setEdit(a)} style={{ ...iconBtnStyle }}><Pencil size={13} /></button>
                <button onClick={() => { onChange({ ...data, accounts: data.accounts.filter((x) => x.id !== a.id) }); onToast("Account removed"); }} style={{ ...iconBtnStyle, color: "#c0392b" }}><Trash2 size={13} /></button>
              </div>
            </div>
            <strong style={{ display: "block", fontFamily: "Georgia,serif", fontSize: 22 }}>{fmt(a.balance)}</strong>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>{a.name}</p>
          </div>
        ))}
        <button onClick={() => setShow(true)} style={addCardStyle}><Plus size={28} />Add account</button>
      </div>
      {(show || edit) && <AccountModal initial={edit ?? undefined} onSave={save} onClose={() => { setShow(false); setEdit(null); }} />}
    </div>
  );
}

function AccountModal({ initial, onSave, onClose }: { initial?: BankAccount; onSave: (a: Omit<BankAccount, "id">) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<BankAccount["type"]>(initial?.type ?? "cheque");
  const [balance, setBalance] = useState(String(initial?.balance ?? ""));
  return (
    <Modal title={initial ? "Edit account" : "Add account"} onClose={onClose}>
      <Field label="Account name"><input style={inputStyle} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FNB Cheque" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Type"><select style={selectStyle} value={type} onChange={(e) => setType(e.target.value as BankAccount["type"])}>{ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Balance (R)"><input style={inputStyle} type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" /></Field>
      </div>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => { if (name.trim()) onSave({ name: name.trim(), type, balance: parseFloat(balance) || 0 }); }}>{initial ? "Save" : "Add"}</button>
      </div>
    </Modal>
  );
}

function CashflowTab({ data, onChange, onToast, fmt }: { data: MoneyData; onChange: (d: MoneyData) => void; onToast: (m: string) => void; fmt: (n: number) => string }) {
  const period = data.currentPeriod ?? todayPeriod();
  const payments = data.payments ?? [];
  const archived = data.archivedExpenses ?? [];

  // recurring commitments always shown; one-off expenses logged in this period
  const recurring = data.expenses.filter((e) => e.recurring);
  const oneOff = data.expenses.filter((e) => !e.recurring && e.date.startsWith(period));

  // lookup payment record for a recurring expense in this period
  function getPayment(expenseId: number) {
    return payments.find((p) => p.expenseId === expenseId && p.period === period);
  }

  const totalCommitted = recurring.reduce((s, e) => s + e.amount, 0) + oneOff.reduce((s, e) => s + e.amount, 0);
  const totalPaid = payments.filter((p) => p.period === period && p.paid).reduce((s, p) => s + p.amount, 0);
  const outstanding = totalCommitted - totalPaid;

  // inline pay state
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payAccountId, setPayAccountId] = useState<number | undefined>(undefined);
  const [bankConfirm, setBankConfirm] = useState(false);

  function markPaid(expense: Expense) {
    if (!payAccountId) return;
    const amount = expense.amount;
    const newPayment: MoneyPayment = {
      id: Date.now(),
      expenseId: expense.id,
      period,
      paid: true,
      paidDate: new Date().toISOString().split("T")[0],
      paidAccountId: payAccountId,
      amount,
    };
    const accounts = data.accounts.map((a) => a.id === payAccountId ? { ...a, balance: a.balance - amount } : a);
    onChange({ ...data, accounts, payments: [...payments, newPayment] });
    onToast(`${expense.name} marked paid`);
    setPayingId(null);
    setPayAccountId(undefined);
  }

  function markUnpaid(expense: Expense) {
    const pmt = getPayment(expense.id);
    if (!pmt) return;
    const accounts = pmt.paidAccountId
      ? data.accounts.map((a) => a.id === pmt.paidAccountId ? { ...a, balance: a.balance + pmt.amount } : a)
      : data.accounts;
    onChange({ ...data, accounts, payments: payments.filter((p) => p.id !== pmt.id) });
    onToast(`${expense.name} marked unpaid`);
  }

  function bankPeriod() {
    // archive one-off expenses for this period
    const newArchived: typeof archived = [
      ...archived,
      ...oneOff.map((e) => ({ ...e, period })),
    ];
    // remove one-off expenses from active list
    const newExpenses = data.expenses.filter((e) => e.recurring || !e.date.startsWith(period));
    const np = nextPeriod(period);
    onChange({ ...data, expenses: newExpenses, archivedExpenses: newArchived, currentPeriod: np, payments });
    onToast(`Period banked — starting ${periodLabel(np)}`);
    setBankConfirm(false);
  }

  const paidItems = recurring.filter((e) => getPayment(e.id)?.paid);
  const unpaidItems = recurring.filter((e) => !getPayment(e.id)?.paid);

  const rowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 100px 110px 1fr 160px", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--line)", fontSize: 12 };
  const headStyle: React.CSSProperties = { ...rowStyle, color: "var(--muted)", fontWeight: 700, fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" as const, background: "var(--bg)" };

  return (
    <div>
      {/* Period nav + bank button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => onChange({ ...data, currentPeriod: prevPeriod(period) })} style={{ ...iconBtnStyle }}><ChevronLeft size={15} /></button>
        <strong style={{ fontSize: 16, fontFamily: "Georgia,serif" }}>{periodLabel(period)}</strong>
        <button onClick={() => onChange({ ...data, currentPeriod: nextPeriod(period) })} style={{ ...iconBtnStyle }}><ChevronRight size={15} /></button>
        <span style={{ flex: 1 }} />
        <button className="secondary-btn" onClick={() => setBankConfirm(true)} style={{ fontSize: 12 }}>Bank this period →</button>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total committed", value: fmt(totalCommitted), color: "#ece8f4" },
          { label: "Settled", value: fmt(totalPaid), color: "#e3eee5" },
          { label: "Outstanding", value: fmt(outstanding), color: outstanding > 0 ? "#f9e9e2" : "#e3eee5" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "16px 18px", borderRadius: 14, background: s.color, border: "1px solid rgba(0,0,0,.04)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, color: "#696d67" }}>{s.label}</p>
            <strong style={{ fontSize: 20, color: "#252724", letterSpacing: "-.4px" }}>{s.value}</strong>
          </div>
        ))}
      </div>

      {/* Outstanding recurring */}
      {unpaidItems.length > 0 && (
        <section className="panel" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
            <Circle size={14} style={{ color: "#c0392b" }} />
            <strong style={{ fontSize: 12 }}>Outstanding ({unpaidItems.length})</strong>
          </div>
          <div style={headStyle}><span>Name</span><span>Amount</span><span>Category</span><span>Account</span><span /></div>
          {unpaidItems.map((e) => (
            <div key={e.id}>
              <div style={{ ...rowStyle, background: payingId === e.id ? "var(--bg)" : undefined }}>
                <span style={{ fontWeight: 600 }}>{e.name}</span>
                <span style={{ color: "#c0392b", fontWeight: 700 }}>{fmt(e.amount)}</span>
                <span style={{ color: "var(--muted)" }}>{e.category}</span>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>{e.frequency}</span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {payingId === e.id ? null : (
                    <button onClick={() => { setPayingId(e.id); setPayAccountId(e.accountId); }} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--accent)", background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mark paid</button>
                  )}
                </div>
              </div>
              {payingId === e.id && (
                <div style={{ padding: "10px 18px 14px", background: "var(--bg)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>Paid from:</span>
                  <select style={{ ...selectStyle, height: 34, fontSize: 12, flex: 1, maxWidth: 240 }} value={payAccountId ?? ""} onChange={(ev) => setPayAccountId(ev.target.value ? Number(ev.target.value) : undefined)}>
                    <option value="">— Select account —</option>
                    {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({fmt(a.balance)})</option>)}
                  </select>
                  <button onClick={() => markPaid(e)} disabled={!payAccountId} style={{ padding: "6px 14px", borderRadius: 8, border: 0, background: payAccountId ? "var(--accent)" : "var(--line)", color: payAccountId ? "#fff" : "var(--muted)", fontSize: 11, fontWeight: 700, cursor: payAccountId ? "pointer" : "default" }}>Confirm</button>
                  <button onClick={() => { setPayingId(null); setPayAccountId(undefined); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 11, cursor: "pointer" }}>✕</button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* One-off this period */}
      {oneOff.length > 0 && (
        <section className="panel" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
            <Circle size={14} style={{ color: "#c0392b" }} />
            <strong style={{ fontSize: 12 }}>Once-off this period ({oneOff.length})</strong>
          </div>
          <div style={headStyle}><span>Name</span><span>Amount</span><span>Category</span><span>Date</span><span /></div>
          {oneOff.map((e) => {
            const acc = data.accounts.find((a) => a.id === e.accountId);
            return (
              <div key={e.id} style={rowStyle}>
                <span style={{ fontWeight: 600 }}>{e.name}</span>
                <span style={{ color: "#c0392b", fontWeight: 700 }}>{fmt(e.amount)}</span>
                <span style={{ color: "var(--muted)" }}>{e.category}</span>
                <span style={{ color: "var(--muted)" }}>{e.date}</span>
                <span style={{ color: "var(--muted)", fontSize: 11, textAlign: "right" }}>{acc?.name ?? "—"}</span>
              </div>
            );
          })}
        </section>
      )}

      {/* Settled recurring */}
      {paidItems.length > 0 && (
        <section className="panel" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={14} style={{ color: "#4f7d5d" }} />
            <strong style={{ fontSize: 12 }}>Settled ({paidItems.length})</strong>
          </div>
          <div style={headStyle}><span>Name</span><span>Amount</span><span>Category</span><span>Paid from</span><span>Date</span></div>
          {paidItems.map((e) => {
            const pmt = getPayment(e.id)!;
            const acc = data.accounts.find((a) => a.id === pmt.paidAccountId);
            return (
              <div key={e.id} style={{ ...rowStyle, opacity: .85 }}>
                <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={13} color="#4f7d5d" />{e.name}</span>
                <span style={{ color: "#4f7d5d", fontWeight: 700 }}>{fmt(e.amount)}</span>
                <span style={{ color: "var(--muted)" }}>{e.category}</span>
                <span style={{ color: "var(--muted)" }}>{acc?.name ?? "—"}</span>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <span style={{ color: "var(--muted)", fontSize: 11 }}>{pmt.paidDate}</span>
                  <button onClick={() => markUnpaid(e)} style={{ fontSize: 10, color: "var(--muted)", background: "none", border: 0, cursor: "pointer", textDecoration: "underline" }}>undo</button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {unpaidItems.length === 0 && oneOff.length === 0 && paidItems.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", marginTop: 40 }}>No expenses or commitments for this period.</p>
      )}

      {/* Archived history */}
      {archived.filter((e) => e.period === period).length > 0 && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer", marginBottom: 8 }}>Archived once-offs this period ({archived.filter((e) => e.period === period).length})</summary>
          {archived.filter((e) => e.period === period).map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "6px 0", borderBottom: "1px solid var(--line)", color: "var(--muted)" }}>
              <span>{e.name}</span><span>{e.category}</span><span>{fmt(e.amount)}</span><span>{e.date}</span>
            </div>
          ))}
        </details>
      )}

      {/* Bank confirm modal */}
      {bankConfirm && (
        <Modal title="Bank this period?" onClose={() => setBankConfirm(false)}>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            This will archive all <strong>once-off</strong> expenses logged in <strong>{periodLabel(period)}</strong> and start a fresh period for <strong>{periodLabel(nextPeriod(period))}</strong>. Recurring commitments carry forward as unpaid.
          </p>
          <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Recurring commitments (carry over)</span><strong>{recurring.length}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>Once-offs to archive</span><strong>{oneOff.length}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Settled this period</span><strong>{paidItems.length} / {recurring.length}</strong></div>
          </div>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setBankConfirm(false)}>Cancel</button>
            <button className="primary-btn" onClick={bankPeriod}>Bank {periodLabel(period)}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ExpensesTab({ data, onChange, onToast, fmt }: { data: MoneyData; onChange: (d: MoneyData) => void; onToast: (m: string) => void; fmt: (n: number) => string }) {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Expense | null>(null);
  const [filterRecurring, setFilterRecurring] = useState<"all" | "recurring" | "once">("all");

  const filtered = data.expenses.filter((e) =>
    filterRecurring === "all" ? true : filterRecurring === "recurring" ? e.recurring : !e.recurring
  );

  function save(exp: Omit<Expense, "id">) {
    if (edit) {
      const amountDiff = exp.amount - edit.amount;
      const accounts = exp.accountId
        ? data.accounts.map((a) => a.id === exp.accountId ? { ...a, balance: a.balance - amountDiff } : a)
        : data.accounts;
      onChange({ ...data, accounts, expenses: data.expenses.map((e) => e.id === edit.id ? { ...e, ...exp } : e) });
      onToast("Expense updated"); setEdit(null);
    } else {
      const accounts = exp.accountId
        ? data.accounts.map((a) => a.id === exp.accountId ? { ...a, balance: a.balance - exp.amount } : a)
        : data.accounts;
      onChange({ ...data, accounts, expenses: [...data.expenses, { id: Date.now(), ...exp }] });
      onToast("Expense added"); setShow(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "once", "recurring"] as const).map((f) => (
            <button key={f} onClick={() => setFilterRecurring(f)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid var(--line)", background: filterRecurring === f ? "var(--accent)" : "var(--surface)", color: filterRecurring === f ? "#fff" : "var(--text)", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
          ))}
        </div>
        <button className="primary-btn" onClick={() => setShow(true)}><Plus size={17} /> Log expense</button>
      </div>
      <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
              {["Name", "Category", "Amount", "Account", "Date", "Recurring", ""].map((h) => <th key={h} style={{ padding: "12px 18px", color: "var(--muted)", fontWeight: 700, fontSize: 10, letterSpacing: ".6px", textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: "24px 18px", color: "var(--muted)", textAlign: "center" }}>No expenses logged.</td></tr>}
              {filtered.sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
                const acc = data.accounts.find((a) => a.id === e.accountId);
                return (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 18px", fontWeight: 600 }}>{e.name}</td>
                  <td style={{ padding: "12px 18px", color: "var(--muted)" }}>{e.category}</td>
                  <td style={{ padding: "12px 18px", color: "#c0392b", fontWeight: 700 }}>{fmt(e.amount)}</td>
                  <td style={{ padding: "12px 18px", color: "var(--muted)" }}>{acc ? acc.name : <span style={{ opacity: .4 }}>—</span>}</td>
                  <td style={{ padding: "12px 18px", color: "var(--muted)" }}>{e.date}</td>
                  <td style={{ padding: "12px 18px" }}>{e.recurring ? <span style={{ padding: "3px 8px", borderRadius: 6, background: "#e3eee5", color: "#4f7d5d", fontSize: 10, fontWeight: 700 }}>{e.frequency}</span> : <span style={{ color: "var(--muted)", fontSize: 11 }}>once</span>}</td>
                  <td style={{ padding: "12px 18px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEdit(e)} style={iconBtnStyle}><Pencil size={13} /></button>
                      <button onClick={() => { onChange({ ...data, expenses: data.expenses.filter((x) => x.id !== e.id) }); onToast("Expense removed"); }} style={{ ...iconBtnStyle, color: "#c0392b" }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {(show || edit) && <ExpenseModal initial={edit ?? undefined} accounts={data.accounts} onSave={save} onClose={() => { setShow(false); setEdit(null); }} />}
    </div>
  );
}

function ExpenseModal({ initial, accounts, onSave, onClose }: { initial?: Expense; accounts: BankAccount[]; onSave: (e: Omit<Expense, "id">) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [category, setCategory] = useState(initial?.category ?? "Groceries");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [frequency, setFrequency] = useState<Expense["frequency"]>(initial?.frequency ?? "monthly");
  const [accountId, setAccountId] = useState<number | undefined>(initial?.accountId);
  return (
    <Modal title={initial ? "Edit expense" : "Log expense"} onClose={onClose}>
      <Field label="Name"><input style={inputStyle} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Amount (R)"><input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></Field>
        <Field label="Category"><select style={selectStyle} value={category} onChange={(e) => setCategory(e.target.value)}>{EXPENSE_CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Paid from account">
          <select style={selectStyle} value={accountId ?? ""} onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">— Select account —</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Date"><input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Recurring?">
          <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46 }}>
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13 }}>Yes, this repeats</span>
          </div>
        </Field>
        {recurring && <Field label="Frequency"><select style={selectStyle} value={frequency} onChange={(e) => setFrequency(e.target.value as Expense["frequency"])}>{["daily", "weekly", "monthly", "yearly"].map((f) => <option key={f}>{f}</option>)}</select></Field>}
      </div>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => { if (name.trim()) onSave({ name: name.trim(), amount: parseFloat(amount) || 0, category, date, recurring, frequency, accountId }); }}>{initial ? "Save" : "Log expense"}</button>
      </div>
    </Modal>
  );
}

function LoansTab({ data, onChange, onToast, fmt }: { data: MoneyData; onChange: (d: MoneyData) => void; onToast: (m: string) => void; fmt: (n: number) => string }) {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Loan | null>(null);

  function save(loan: Omit<Loan, "id">) {
    if (edit) { onChange({ ...data, loans: data.loans.map((l) => l.id === edit.id ? { ...l, ...loan } : l) }); onToast("Loan updated"); setEdit(null); }
    else { onChange({ ...data, loans: [...data.loans, { id: Date.now(), ...loan }] }); onToast("Loan added"); setShow(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="primary-btn" onClick={() => setShow(true)}><Plus size={17} /> Add loan</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {data.loans.map((l) => {
          const pct = Math.round(((l.totalAmount - l.balance) / l.totalAmount) * 100);
          return (
            <div key={l.id} style={{ padding: 22, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <strong style={{ fontSize: 14 }}>{l.name}</strong>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEdit(l)} style={iconBtnStyle}><Pencil size={13} /></button>
                  <button onClick={() => { onChange({ ...data, loans: data.loans.filter((x) => x.id !== l.id) }); onToast("Loan removed"); }} style={{ ...iconBtnStyle, color: "#c0392b" }}><Trash2 size={13} /></button>
                </div>
              </div>
              <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: 10 }}>Balance remaining</p>
              <strong style={{ fontSize: 22, color: "#c0392b", letterSpacing: "-.4px" }}>{fmt(l.balance)}</strong>
              <p style={{ margin: "8px 0 4px", color: "var(--muted)", fontSize: 10 }}>Monthly payment · {l.interestRate}% interest</p>
              <strong style={{ fontSize: 14 }}>{fmt(l.monthlyPayment)}</strong>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginBottom: 4 }}><span>Paid off</span><span>{pct}%</span></div>
                <div style={{ height: 5, borderRadius: 5, background: "var(--line)" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#7fa087", borderRadius: 5 }} />
                </div>
              </div>
            </div>
          );
        })}
        <button onClick={() => setShow(true)} style={addCardStyle}><Plus size={28} />Add loan</button>
      </div>
      {(show || edit) && <LoanModal initial={edit ?? undefined} onSave={save} onClose={() => { setShow(false); setEdit(null); }} />}
    </div>
  );
}

function LoanModal({ initial, onSave, onClose }: { initial?: Loan; onSave: (l: Omit<Loan, "id">) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [total, setTotal] = useState(String(initial?.totalAmount ?? ""));
  const [balance, setBalance] = useState(String(initial?.balance ?? ""));
  const [rate, setRate] = useState(String(initial?.interestRate ?? ""));
  const [payment, setPayment] = useState(String(initial?.monthlyPayment ?? ""));
  const [dueDay, setDueDay] = useState(String(initial?.dueDay ?? "1"));
  return (
    <Modal title={initial ? "Edit loan" : "Add loan"} onClose={onClose}>
      <Field label="Loan name"><input style={inputStyle} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home loan, Car, Personal loan" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Total amount (R)"><input style={inputStyle} type="number" value={total} onChange={(e) => setTotal(e.target.value)} /></Field>
        <Field label="Current balance (R)"><input style={inputStyle} type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></Field>
        <Field label="Interest rate (%)"><input style={inputStyle} type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Monthly payment (R)"><input style={inputStyle} type="number" value={payment} onChange={(e) => setPayment(e.target.value)} /></Field>
        <Field label="Due day of month"><input style={inputStyle} type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} /></Field>
      </div>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => { if (name.trim()) onSave({ name: name.trim(), totalAmount: parseFloat(total) || 0, balance: parseFloat(balance) || 0, interestRate: parseFloat(rate) || 0, monthlyPayment: parseFloat(payment) || 0, dueDay: parseInt(dueDay) || 1 }); }}>{initial ? "Save" : "Add loan"}</button>
      </div>
    </Modal>
  );
}

function GoalsTab({ data, onChange, onToast, fmt }: { data: MoneyData; onChange: (d: MoneyData) => void; onToast: (m: string) => void; fmt: (n: number) => string }) {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<FinancialGoal | null>(null);
  const [addFundsId, setAddFundsId] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  function save(goal: Omit<FinancialGoal, "id">) {
    if (edit) { onChange({ ...data, goals: data.goals.map((g) => g.id === edit.id ? { ...g, ...goal } : g) }); onToast("Goal updated"); setEdit(null); }
    else { onChange({ ...data, goals: [...data.goals, { id: Date.now(), ...goal }] }); onToast("Goal added"); setShow(false); }
  }

  function addFunds(id: number) {
    const amount = parseFloat(fundAmount) || 0;
    onChange({ ...data, goals: data.goals.map((g) => g.id === id ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g) });
    onToast("Funds added"); setAddFundsId(null); setFundAmount("");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="primary-btn" onClick={() => setShow(true)}><Plus size={17} /> Add goal</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {data.goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <div key={g.id} style={{ padding: 22, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: GOAL_COLOR_HEX[g.color] ?? GOAL_COLOR_HEX.coral, display: "grid", placeItems: "center" }}><Target size={14} color="#fff" /></span>
                  <strong style={{ fontSize: 14 }}>{g.name}</strong>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEdit(g)} style={iconBtnStyle}><Pencil size={13} /></button>
                  <button onClick={() => { onChange({ ...data, goals: data.goals.filter((x) => x.id !== g.id) }); onToast("Goal removed"); }} style={{ ...iconBtnStyle, color: "#c0392b" }}><Trash2 size={13} /></button>
                </div>
              </div>
              <p style={{ margin: "0 0 2px", color: "var(--muted)", fontSize: 10 }}>Saved / Target</p>
              <strong style={{ fontSize: 20, letterSpacing: "-.4px" }}>{fmt(g.saved)}</strong>
              <span style={{ color: "var(--muted)", fontSize: 12 }}> of {fmt(g.target)}</span>
              {g.deadline && <p style={{ margin: "4px 0 8px", color: "var(--muted)", fontSize: 10 }}>Deadline: {g.deadline}</p>}
              <div style={{ height: 6, borderRadius: 6, background: "var(--line)", margin: "10px 0 12px" }}>
                <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: GOAL_COLOR_HEX[g.color] ?? GOAL_COLOR_HEX.coral, borderRadius: 6 }} />
              </div>
              {addFundsId === g.id ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inputStyle, height: 36 }} type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="Amount" autoFocus />
                  <button className="primary-btn" style={{ height: 36, padding: "0 12px", fontSize: 12 }} onClick={() => addFunds(g.id)}>Add</button>
                  <button className="secondary-btn" style={{ height: 36, padding: "0 12px", fontSize: 12 }} onClick={() => setAddFundsId(null)}>✕</button>
                </div>
              ) : (
                <button onClick={() => setAddFundsId(g.id)} style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-dark)", background: "none", border: 0, cursor: "pointer", padding: 0 }}>+ Add funds</button>
              )}
            </div>
          );
        })}
        <button onClick={() => setShow(true)} style={addCardStyle}><Plus size={28} />Add goal</button>
      </div>
      {(show || edit) && <GoalModal initial={edit ?? undefined} onSave={save} onClose={() => { setShow(false); setEdit(null); }} />}
    </div>
  );
}

function GoalModal({ initial, onSave, onClose }: { initial?: FinancialGoal; onSave: (g: Omit<FinancialGoal, "id">) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(String(initial?.target ?? ""));
  const [saved, setSaved] = useState(String(initial?.saved ?? "0"));
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [color, setColor] = useState(initial?.color ?? "coral");
  return (
    <Modal title={initial ? "Edit goal" : "Add financial goal"} onClose={onClose}>
      <Field label="Goal name"><input style={inputStyle} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund, Holiday, New car" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Target amount (R)"><input style={inputStyle} type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
        <Field label="Already saved (R)"><input style={inputStyle} type="number" value={saved} onChange={(e) => setSaved(e.target.value)} /></Field>
        <Field label="Deadline (optional)"><input style={inputStyle} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
      </div>
      <Field label="Colour">
        <div style={{ display: "flex", gap: 8 }}>
          {GOAL_COLORS.map((c) => <button key={c} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: "50%", background: GOAL_COLOR_HEX[c], border: color === c ? "3px solid var(--text)" : "3px solid transparent", cursor: "pointer" }} />)}
        </div>
      </Field>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => { if (name.trim()) onSave({ name: name.trim(), target: parseFloat(target) || 0, saved: parseFloat(saved) || 0, deadline, color }); }}>{initial ? "Save" : "Add goal"}</button>
      </div>
    </Modal>
  );
}

function SalaryModal({ salary, salaryDay, onSave, onClose }: { salary: number; salaryDay: number; onSave: (s: number, d: number) => void; onClose: () => void }) {
  const [s, setS] = useState(String(salary));
  const [d, setD] = useState(String(salaryDay));
  return (
    <Modal title="Edit salary / income" onClose={onClose}>
      <Field label="Monthly salary / income (R)"><input style={inputStyle} type="number" autoFocus value={s} onChange={(e) => setS(e.target.value)} /></Field>
      <Field label="Salary day (day of month)"><input style={inputStyle} type="number" min={1} max={31} value={d} onChange={(e) => setD(e.target.value)} /></Field>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" onClick={() => onSave(parseFloat(s) || 0, parseInt(d) || 25)}>Save</button>
      </div>
    </Modal>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28, height: 28, display: "grid", placeItems: "center",
  borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)",
  cursor: "pointer", padding: 0,
};

const addCardStyle: React.CSSProperties = {
  minHeight: 180, display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", gap: 10,
  padding: 22, border: "2px dashed var(--line)", borderRadius: 18,
  background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 12,
};
