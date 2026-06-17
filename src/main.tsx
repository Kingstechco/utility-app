import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BellOff,
  Bolt,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  CreditCard,
  Droplets,
  Gauge,
  Home,
  Landmark,
  LineChart,
  Lock,
  ReceiptText,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native-web";
import "./styles.css";

type Screen = "home" | "recharge" | "buy" | "usage" | "ledger" | "control";
type Utility = "Electricity" | "Water";
type PaymentMethod = "Instant EFT" | "Card" | "Manual EFT" | "Retail";

interface Token {
  date: string;
  amount: number;
  token: string;
  units: number;
  utility: Utility;
}

interface Transaction {
  id: string;
  date: string;
  label: string;
  detail: string;
  amount: number;
  in: boolean;
  utility?: Utility;
}

/* ─── Brand Tokens ────────────────────────────────────────────────────── */
const C = {
  /* Accent — lime green, the single brand colour */
  lime:        "#c9ff57",
  limeDim:     "rgba(201,255,87,0.12)",
  limeBorder:  "rgba(201,255,87,0.25)",

  /* Elevated card surfaces (sit on top of the gradient bg) */
  card:        "#152010",   /* primary card — dark green-tinted slate  */
  cardHigh:    "#1c2d16",   /* slightly lighter for inputs / segments   */
  cardBorder:  "rgba(255,255,255,0.07)",

  /* Text */
  t1: "#ffffff",
  t2: "rgba(255,255,255,0.6)",
  t3: "rgba(255,255,255,0.35)",

  /* Semantic */
  red:        "#ff4d6a",
  redDim:     "rgba(255,77,106,0.12)",
  redBorder:  "rgba(255,77,106,0.25)",
  amber:      "#ffb340",
  mint:       "#00d49a",

  /* Used only ON lime / coloured surfaces */
  ink: "#071a0c",
};

/* ─── Data ────────────────────────────────────────────────────────────── */
const PRICE_PER_UNIT: Record<Utility, number> = { Electricity: 4.97, Water: 22.4 };
const SPEND_LIMIT = 10000;

const SEED_TOKENS: Token[] = [
  { date: "12 Jun", amount: 300, token: "0736 4844 3944 8209 4274", units: 60.40, utility: "Electricity" },
  { date: "12 Jun", amount: 167, token: "0841 0205 5352 3480 5042", units: 33.60, utility: "Electricity" },
  { date: "11 Jun", amount: 80,  token: "7002 3413 1105 8044 4504", units: 16.10, utility: "Electricity" },
];

const SEED_TXS: Transaction[] = [
  { id: "t1", date: "13 Jun", label: "Wallet top-up",     detail: "Manual EFT",   amount: 550, in: true  },
  { id: "t2", date: "12 Jun", label: "Electricity token", detail: "60.40 units",  amount: 300, in: false, utility: "Electricity" },
  { id: "t3", date: "12 Jun", label: "Electricity token", detail: "33.60 units",  amount: 167, in: false, utility: "Electricity" },
  { id: "t4", date: "01 Jun", label: "Hosting",           detail: "Tenant alloc", amount: 90,  in: false },
];

const SEED_NOTIFS: Notif[] = [
  { id: "n1", type: "warning", title: "Low balance", body: "Wallet balance is R0.48. Recharge soon.", time: "13 Jun", read: false },
  { id: "n2", type: "success", title: "Electricity token generated", body: "60.40 kWh · R300.00", time: "12 Jun", read: true },
  { id: "n3", type: "info",    title: "Wallet recharged", body: "R550.00 added via Manual EFT.", time: "13 Jun", read: true },
];


const methods: Array<{ name: PaymentMethod; fee: string; icon: React.ElementType }> = [
  { name: "Instant EFT", fee: "1.6% min R1.50", icon: Smartphone  },
  { name: "Card",        fee: "2.95% + R1.25",  icon: CreditCard  },
  { name: "Manual EFT", fee: "R3.50 flat",      icon: Landmark    },
  { name: "Retail",     fee: "3.9% min R8.00",  icon: ReceiptText },
];

const nav: Array<{ screen: Screen; label: string; icon: React.ElementType }> = [
  { screen: "home",    label: "Home",    icon: Home         },
  { screen: "buy",     label: "Buy",     icon: Bolt         },
  { screen: "ledger",  label: "Ledger",  icon: ReceiptText  },
  { screen: "usage",   label: "Pulse",   icon: LineChart    },
  { screen: "control", label: "Control", icon: Settings     },
];

function money(v: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function genToken(): string {
  return Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  ).join(" ");
}

function uid() { return Math.random().toString(36).slice(2); }

/* ─── Notifications ───────────────────────────────────────────────────── */
interface Notif {
  id: string;
  type: "info" | "warning" | "success";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

/* ─── Persistence ─────────────────────────────────────────────────────── */
type CostOwner = "owner" | "tenant";
interface CostAlloc { hosting: CostOwner; sewerage: CostOwner; waterLevy: CostOwner }

const DEFAULT_ALLOC: CostAlloc = { hosting: "tenant", sewerage: "owner", waterLevy: "owner" };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

/* ─── App Shell ───────────────────────────────────────────────────────── */
function App() {
  const [screen, setScreen]       = useState<Screen>("home");
  const [balance, setBalance]     = useState(() => load("balance", 0.48));
  const [tokenList, setTokenList] = useState<Token[]>(() => load("tokens", SEED_TOKENS));
  const [txList, setTxList]       = useState<Transaction[]>(() => load("txs", SEED_TXS));
  const [alloc, setAlloc]         = useState<CostAlloc>(() => load("alloc", DEFAULT_ALLOC));
  const [notifs, setNotifs]       = useState<Notif[]>(() => load("notifs", SEED_NOTIFS));
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast]         = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { save("balance",  balance);   }, [balance]);
  useEffect(() => { save("tokens",   tokenList); }, [tokenList]);
  useEffect(() => { save("txs",      txList);    }, [txList]);
  useEffect(() => { save("alloc",    alloc);     }, [alloc]);
  useEffect(() => { save("notifs",   notifs);    }, [notifs]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  function openNotifs() {
    setNotifOpen(true);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function pushNotif(n: Omit<Notif, "id" | "read" | "time">) {
    setNotifs((prev) => [
      { ...n, id: uid(), read: false, time: fmtDate(new Date()) },
      ...prev,
    ]);
  }

  const spent = useMemo(
    () => txList.filter((t) => !t.in).reduce((s, t) => s + t.amount, 0),
    [txList]
  );

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  function copyReference() {
    navigator.clipboard?.writeText("100477911");
    showToast("Reference copied");
  }

  function handleRecharge(amount: number, method: PaymentMethod) {
    const today = fmtDate(new Date());
    setBalance((b) => {
      const next = +(b + amount).toFixed(2);
      return next;
    });
    setTxList((prev) => [
      { id: uid(), date: today, label: "Wallet top-up", detail: method, amount, in: true },
      ...prev,
    ]);
    pushNotif({
      type: "success",
      title: "Wallet recharged",
      body: `${money(amount)} added via ${method}.`,
    });
    showToast("Wallet recharged");
    setScreen("home");
  }

  function handleBuyToken(utility: Utility, amount: number) {
    const units   = +(amount / PRICE_PER_UNIT[utility]).toFixed(2);
    const today   = fmtDate(new Date());
    const code    = genToken();
    const newBal  = +(balance - amount).toFixed(2);
    setBalance(newBal);
    setTokenList((prev) => [
      { date: today, amount, token: code, units, utility },
      ...prev,
    ]);
    setTxList((prev) => [
      { id: uid(), date: today, label: `${utility} token`, detail: `${units} units`, amount, in: false, utility },
      ...prev,
    ]);
    pushNotif({
      type: "success",
      title: `${utility} token generated`,
      body: `${units} ${utility === "Electricity" ? "kWh" : "L"} · ${money(amount)}`,
    });
    if (newBal < 50) {
      pushNotif({
        type: "warning",
        title: "Low balance",
        body: `Wallet balance is ${money(newBal)}. Recharge soon.`,
      });
    }
    showToast("Token generated");
    setScreen("home");
  }

  const title = {
    home: "Metering", recharge: "Recharge", buy: "Buy token",
    usage: "Usage pulse", ledger: "Ledger", control: "Control",
  }[screen];

  return (
    <View style={S.app}>
      {/* Header */}
      <View style={S.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {screen === "recharge" && (
            <Pressable style={S.backBtn} onPress={() => setScreen("home")}>
              <ArrowLeft size={18} color={C.t1} />
            </Pressable>
          )}
          <View>
            <Text style={S.eyebrow}>Unit 28-05</Text>
            <Text style={S.pageTitle}>{title}</Text>
          </View>
        </View>
        <Pressable style={S.bellBtn} onPress={openNotifs}>
          <Bell size={18} color={C.t1} />
          {unreadCount > 0 && (
            <View style={S.bellDot}>
              {unreadCount < 10 && (
                <Text style={S.bellDotText}>{unreadCount}</Text>
              )}
            </View>
          )}
        </Pressable>
      </View>

      {/* Notification panel */}
      {notifOpen && (
        <NotifPanel
          notifs={notifs}
          onClose={() => setNotifOpen(false)}
          onClear={() => setNotifs([])}
        />
      )}

      {/* Toast */}
      {toast && (
        <View style={S.toast}>
          <Check size={14} color={C.ink} />
          <Text style={S.toastText}>{toast}</Text>
        </View>
      )}

      {/* Screen content */}
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {screen === "home"     && (
          <HomeScreen
            balance={balance}
            spent={spent}
            tokens={tokenList}
            setScreen={setScreen}
            copyRef={copyReference}
          />
        )}
        {screen === "recharge" && (
          <RechargeScreen
            onConfirm={handleRecharge}
            copyRef={copyReference}
          />
        )}
        {screen === "buy" && (
          <BuyScreen
            balance={balance}
            onConfirm={handleBuyToken}
            setScreen={setScreen}
          />
        )}
        {screen === "usage"   && <UsageScreen tokens={tokenList} txList={txList} />}
        {screen === "ledger"  && <LedgerScreen txList={txList} />}
        {screen === "control" && (
          <ControlScreen
            alloc={alloc}
            onSave={(a) => { setAlloc(a); showToast("Allocation saved"); }}
          />
        )}
      </ScrollView>

      {/* Tab bar */}
      <View style={S.tabBar}>
        {nav.map((item) => {
          const active = item.screen === screen;
          return (
            <Pressable
              key={item.screen}
              style={[S.tab, active && S.tabActive]}
              onPress={() => setScreen(item.screen)}
            >
              <item.icon size={20} color={active ? C.ink : C.t2} />
              <Text style={[S.tabLabel, active && S.tabLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ─── Home ────────────────────────────────────────────────────────────── */
function HomeScreen({
  balance, spent, tokens, setScreen, copyRef,
}: {
  balance: number; spent: number; tokens: Token[];
  setScreen: (s: Screen) => void; copyRef: () => void;
}) {
  const progressPct = Math.min(100, (spent / SPEND_LIMIT) * 100);
  const lowBalance  = balance < 50;

  return (
    <View style={S.stack}>
      {/* Hero balance */}
      <View style={S.hero}>
        <Text style={S.heroLabel}>Available balance</Text>
        <Text style={S.heroAmount}>{money(balance)}</Text>
        <Pressable style={S.refPill} onPress={copyRef}>
          <Text style={S.refLabel}>Wallet ref</Text>
          <Text style={S.refValue}>100477911</Text>
          <Clipboard size={13} color={C.t3} />
        </Pressable>
        <View style={S.heroStats}>
          <View>
            <Text style={S.heroStatLabel}>Spent this month</Text>
            <Text style={S.heroStatValue}>{money(spent)}</Text>
          </View>
          <View style={S.alignRight}>
            <Text style={S.heroStatLabel}>Limit</Text>
            <Text style={S.heroStatValue}>{money(SPEND_LIMIT)}</Text>
          </View>
        </View>
        <View style={S.progressTrack}>
          <View style={[S.progressFill, { width: `${progressPct}%` as unknown as number }]} />
        </View>
      </View>

      {/* Quick-action dock */}
      <View style={S.dock}>
        <ActionBtn label="Recharge" sub="Add funds" icon={Wallet}   tint={C.lime}  onPress={() => setScreen("recharge")} />
        <ActionBtn label="Buy"      sub="Token"     icon={Bolt}     tint={C.mint}  onPress={() => setScreen("buy")}      />
        <ActionBtn label="Pulse"    sub="Usage"     icon={LineChart} tint={C.amber} onPress={() => setScreen("usage")}   />
      </View>

      {/* Low balance alert */}
      {lowBalance && (
        <View style={S.alertCard}>
          <View style={S.alertIcon}>
            <Lock size={15} color={C.red} />
          </View>
          <View style={S.flex1}>
            <Text style={S.alertTitle}>Low balance lock</Text>
            <Text style={S.alertBody}>Recharge before buying your next prepaid token.</Text>
          </View>
        </View>
      )}

      {/* Latest tokens */}
      <SectionHead title="Latest tokens" action="Ledger" onPress={() => setScreen("ledger")} />
      {tokens.length === 0
        ? <Text style={[S.cardLabel, { textAlign: "center", paddingVertical: 24 }]}>No tokens yet</Text>
        : tokens.slice(0, 5).map((t) => <TokenCard key={t.token} token={t} />)
      }
    </View>
  );
}

/* ─── Recharge ────────────────────────────────────────────────────────── */
function RechargeScreen({
  onConfirm, copyRef,
}: { onConfirm: (amount: number, method: PaymentMethod) => void; copyRef: () => void }) {
  const [amount, setAmount] = useState(250);
  const [custom, setCustom]   = useState("");
  const [method, setMethod]   = useState<PaymentMethod>("Instant EFT");

  const effectiveAmount = custom ? Math.max(0, Number(custom) || 0) : amount;
  const fee = useMemo(() => {
    const a = effectiveAmount;
    if (method === "Instant EFT") return Math.max(1.5, a * 0.016);
    if (method === "Card")        return a * 0.0295 + 1.25;
    if (method === "Retail")      return Math.max(8, a * 0.039);
    return 3.5;
  }, [effectiveAmount, method]);

  function selectPreset(v: number) { setCustom(""); setAmount(v); }

  return (
    <View style={S.stack}>
      {/* Amount picker */}
      <View style={S.card}>
        <Text style={S.cardLabel}>Recharge value</Text>
        <Text style={S.bigNumber}>{money(effectiveAmount)}</Text>
        <View style={S.chipRow}>
          {[100, 250, 500, 1000].map((v) => (
            <Pressable
              key={v}
              style={[S.chip, !custom && amount === v && S.chipActive]}
              onPress={() => selectPreset(v)}
            >
              <Text style={[S.chipText, !custom && amount === v && S.chipTextActive]}>{money(v)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[S.numInput, { marginTop: 12 }]}>
          <Text style={S.numCurrency}>R</Text>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            placeholder="Other amount"
            placeholderTextColor={C.t3}
            keyboardType="numeric"
            style={S.numField}
          />
        </View>
      </View>

      <SectionHead title="Payment rail" />
      <View style={S.stack}>
        {methods.map((item) => {
          const sel = method === item.name;
          return (
            <Pressable
              key={item.name}
              style={[S.methodRow, sel && S.methodRowActive]}
              onPress={() => setMethod(item.name)}
            >
              <View style={[S.methodIcon, sel && S.methodIconActive]}>
                <item.icon size={17} color={sel ? C.ink : C.t2} />
              </View>
              <View style={S.flex1}>
                <Text style={S.methodName}>{item.name}</Text>
                <Text style={S.methodFee}>{item.fee}</Text>
              </View>
              {sel && <Check size={16} color={C.lime} />}
            </Pressable>
          );
        })}
      </View>

      {method === "Manual EFT" && (
        <View style={S.card}>
          <Text style={S.cardTitle}>Manual EFT details</Text>
          <BankRow label="Account" value="SmS" />
          <BankRow label="Bank"    value="FNB" />
          <BankRow label="Number"  value="62937164614" />
          <Pressable style={S.greenRow} onPress={copyRef}>
            <Text style={S.greenRowText}>Use reference 100477911</Text>
            <Clipboard size={15} color={C.ink} />
          </Pressable>
        </View>
      )}

      {/* Checkout */}
      <View style={S.card}>
        <View style={S.checkoutMetrics}>
          <CardMetric label="Amount" value={money(effectiveAmount)} />
          <CardMetric label="Fees"   value={money(fee)} alignRight />
        </View>
        <View style={S.divider} />
        <View style={S.checkoutTotal}>
          <Text style={S.totalLabel}>Total to pay</Text>
          <Text style={S.totalValue}>{money(effectiveAmount + fee)}</Text>
        </View>
        <GreenBtn
          label="Confirm recharge"
          icon={ArrowUpRight}
          disabled={effectiveAmount <= 0}
          onPress={() => onConfirm(effectiveAmount, method)}
        />
      </View>
    </View>
  );
}

/* ─── Buy ─────────────────────────────────────────────────────────────── */
function BuyScreen({
  balance, onConfirm, setScreen,
}: { balance: number; onConfirm: (u: Utility, a: number) => void; setScreen: (s: Screen) => void }) {
  const [utility, setUtility] = useState<Utility>("Electricity");
  const [amount, setAmount]   = useState("100");

  const numAmount = Math.max(0, Number(amount) || 0);
  const units     = +(numAmount / PRICE_PER_UNIT[utility]).toFixed(2);
  const canBuy    = numAmount > 0 && balance >= numAmount;
  const tooLow    = numAmount > 0 && balance < numAmount;

  return (
    <View style={S.stack}>
      <View style={S.card}>
        <Seg
          options={["Electricity", "Water"] as Utility[]}
          active={utility}
          onChange={(v) => setUtility(v as Utility)}
          icons={{ Electricity: Bolt, Water: Droplets }}
        />
        <Text style={[S.cardLabel, { marginTop: 18 }]}>Token amount</Text>
        <View style={S.numInput}>
          <Text style={S.numCurrency}>R</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={S.numField}
          />
        </View>
        {numAmount > 0 && (
          <View style={S.estimateRow}>
            <Gauge size={16} color={C.lime} />
            <Text style={S.estimateLabel}>
              Estimated {utility === "Electricity" ? "kWh" : "litres"}
            </Text>
            <Text style={S.estimateValue}>{units.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {/* Quick presets */}
      <View style={S.chipRow}>
        {[50, 100, 200, 500].map((v) => (
          <Pressable
            key={v}
            style={[S.chip, numAmount === v && S.chipActive]}
            onPress={() => setAmount(String(v))}
          >
            <Text style={[S.chipText, numAmount === v && S.chipTextActive]}>{money(v)}</Text>
          </Pressable>
        ))}
      </View>

      {/* Balance display */}
      <View style={[S.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
        <Text style={S.cardLabel}>Wallet balance</Text>
        <Text style={[S.metricValue, { color: balance >= numAmount ? C.lime : C.red }]}>{money(balance)}</Text>
      </View>

      {tooLow && (
        <View style={S.alertCard}>
          <View style={S.alertIcon}>
            <Lock size={15} color={C.red} />
          </View>
          <View style={S.flex1}>
            <Text style={S.alertTitle}>Balance too low</Text>
            <Text style={S.alertBody}>
              Need {money(numAmount - balance)} more. Recharge your wallet first.
            </Text>
          </View>
        </View>
      )}

      {tooLow
        ? <GreenBtn label="Recharge wallet" icon={Wallet} onPress={() => setScreen("recharge")} />
        : <GreenBtn label="Buy token" icon={Bolt} disabled={!canBuy} onPress={() => onConfirm(utility, numAmount)} />
      }
    </View>
  );
}

/* ─── Usage ───────────────────────────────────────────────────────────── */
function UsageScreen({ tokens, txList }: { tokens: Token[]; txList: Transaction[] }) {
  const [utility, setUtility] = useState<Utility>("Electricity");

  /* Last-7-days chart derived from real purchases */
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr  = fmtDate(d);
      const dayLabel = d.toLocaleDateString("en-ZA", { weekday: "short" }).slice(0, 1);
      const amount   = txList
        .filter((t) => !t.in && t.utility === utility && t.date === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      return { label: dayLabel, amount, dateStr };
    });
  }, [txList, utility]);

  const maxAmount  = Math.max(...chartData.map((d) => d.amount), 1);
  const weekSpend  = chartData.reduce((s, d) => s + d.amount, 0);
  const totalUnits = tokens.filter((t) => t.utility === utility).reduce((s, t) => s + t.units, 0);
  const unit       = utility === "Electricity" ? "kWh" : "L";

  const peakIdx    = chartData.reduce((pi, d, i) => (d.amount > chartData[pi].amount ? i : pi), 0);
  const peakLabel  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][peakIdx] ?? "";
  const hasSpend   = weekSpend > 0;

  return (
    <View style={S.stack}>
      <View style={S.card}>
        <Seg
          options={["Electricity", "Water"] as Utility[]}
          active={utility}
          onChange={(v) => setUtility(v as Utility)}
          icons={{ Electricity: Bolt, Water: Droplets }}
        />
        <View style={S.usageMetrics}>
          <CardMetric label="Spent this week" value={money(weekSpend)} />
          <CardMetric label="Total units"      value={`${totalUnits.toFixed(1)} ${unit}`} alignRight />
        </View>
        <View style={S.chart}>
          {chartData.map((item, i) => {
            const pct = item.amount / maxAmount;
            const h   = item.amount > 0 ? Math.max(pct * 100, 6) : 2;
            return (
              <View key={i} style={S.chartCol}>
                <View style={S.barTrack}>
                  <View style={[
                    S.bar,
                    { height: `${h}%` as unknown as number },
                    i === peakIdx && item.amount > 0 && { backgroundColor: C.mint },
                  ]} />
                </View>
                <Text style={S.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Total purchased */}
      <View style={[S.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
        <Text style={S.cardLabel}>All-time {utility.toLowerCase()} purchased</Text>
        <Text style={[S.metricValue, { color: C.lime }]}>{totalUnits.toFixed(1)} {unit}</Text>
      </View>

      <View style={S.insightCard}>
        <View style={S.insightIcon}>
          <Sparkles size={15} color={C.lime} />
        </View>
        <View style={S.flex1}>
          {hasSpend ? (
            <>
              <Text style={S.insightTitle}>Peak day: {peakLabel}</Text>
              <Text style={S.insightBody}>
                Highest {utility.toLowerCase()} spend this week was on {peakLabel} — {money(chartData[peakIdx].amount)}.
              </Text>
            </>
          ) : (
            <>
              <Text style={S.insightTitle}>No purchases this week</Text>
              <Text style={S.insightBody}>Buy a token to see your spending trend here.</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/* ─── Ledger ──────────────────────────────────────────────────────────── */
type LedgerFilter = "All" | "Electricity" | "Water" | "Top-ups";
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function LedgerScreen({ txList }: { txList: Transaction[] }) {
  const [filter, setFilter]           = useState<LedgerFilter>("All");
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month

  const filters: LedgerFilter[] = ["All", "Electricity", "Water", "Top-ups"];

  const now         = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset);
  const monthKey    = MONTH_NAMES[targetMonth.getMonth()];
  const monthLabel  = `${monthKey} ${targetMonth.getFullYear()}`;

  const visible = txList.filter((tx) => {
    const txMonth = tx.date.split(" ")[1];   // "Jun" from "12 Jun"
    if (txMonth !== monthKey)  return false;
    if (filter === "All")      return true;
    if (filter === "Top-ups")  return tx.in;
    return tx.utility === filter;
  });

  const totalIn  = visible.filter((t) => t.in).reduce((s, t) => s + t.amount, 0);
  const totalOut = visible.filter((t) => !t.in).reduce((s, t) => s + t.amount, 0);

  return (
    <View style={S.stack}>
      {/* Month navigator */}
      <View style={S.monthNav}>
        <Pressable
          style={S.monthChevron}
          onPress={() => setMonthOffset((o) => o - 1)}
        >
          <ChevronLeft size={18} color={C.t2} />
        </Pressable>
        <Text style={S.monthLabel}>{monthLabel}</Text>
        <Pressable
          style={[S.monthChevron, monthOffset === 0 && { opacity: 0.3 }]}
          onPress={() => monthOffset < 0 && setMonthOffset((o) => o + 1)}
        >
          <ChevronRight size={18} color={C.t2} />
        </Pressable>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[S.filterRow, { paddingBottom: 4 }]}>
          {filters.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)}>
              <Text style={f === filter ? S.filterActive : S.filterItem}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Summary row */}
      <View style={[S.card, { flexDirection: "row", justifyContent: "space-between" }]}>
        <View>
          <Text style={S.cardLabel}>Credits</Text>
          <Text style={[S.metricValue, { color: C.lime }]}>+{money(totalIn)}</Text>
        </View>
        <View style={S.alignRight}>
          <Text style={S.cardLabel}>Debits</Text>
          <Text style={[S.metricValue, { color: C.t1 }]}>-{money(totalOut)}</Text>
        </View>
      </View>

      {visible.length === 0
        ? <Text style={[S.cardLabel, { textAlign: "center", paddingVertical: 24 }]}>No transactions</Text>
        : (() => {
            /* Group by date */
            const groups: Array<{ date: string; items: Transaction[] }> = [];
            for (const tx of visible) {
              const g = groups.find((x) => x.date === tx.date);
              if (g) g.items.push(tx);
              else groups.push({ date: tx.date, items: [tx] });
            }
            return groups.map((g) => (
              <View key={g.date} style={{ gap: 6 }}>
                <Text style={S.ledgerDate}>{g.date}</Text>
                {g.items.map((item) => (
                  <View key={item.id} style={S.txRow}>
                    <View style={[S.txIcon, item.in ? S.txIn : S.txOut]}>
                      {item.in
                        ? <ArrowDownLeft size={16} color={C.ink} />
                        : <ArrowUpRight  size={16} color={C.ink} />}
                    </View>
                    <View style={S.flex1}>
                      <Text style={S.txTitle}>{item.label}</Text>
                      <Text style={S.txSub}>{item.detail}</Text>
                    </View>
                    <View style={S.alignRight}>
                      <Text style={[S.txAmount, item.in ? S.txAmtIn : S.txAmtOut]}>
                        {item.in ? "+" : "-"}{money(item.amount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ));
          })()
      }
    </View>
  );
}

/* ─── Control ─────────────────────────────────────────────────────────── */
function ControlScreen({ alloc, onSave }: { alloc: CostAlloc; onSave: (a: CostAlloc) => void }) {
  const [draft, setDraft] = useState<CostAlloc>(alloc);

  function set(key: keyof CostAlloc, val: CostOwner) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <View style={S.stack}>
      <View style={[S.card, { flexDirection: "row", alignItems: "center", gap: 14 }]}>
        <View style={S.avatar}>
          <ShieldCheck size={22} color={C.ink} />
        </View>
        <View style={S.flex1}>
          <Text style={S.profileName}>cube.musa@gmail.com</Text>
          <Text style={S.profileSub}>Unit 28-05 · Wallet 100477911</Text>
        </View>
      </View>

      <SectionHead title="Cost responsibility" />
      <CtrlRow title="Hosting"           amount={90}     owner={draft.hosting === "owner"}  onChange={(v) => set("hosting",  v ? "owner" : "tenant")} />
      <CtrlRow title="Sewerage"          amount={697.73} owner={draft.sewerage === "owner"} onChange={(v) => set("sewerage", v ? "owner" : "tenant")} />
      <CtrlRow title="Water Demand Levy" amount={65.08}  owner={draft.waterLevy === "owner"} onChange={(v) => set("waterLevy", v ? "owner" : "tenant")} />
      <GreenBtn label="Save allocation" icon={Check} onPress={() => onSave(draft)} />
    </View>
  );
}

/* ─── Notification panel ──────────────────────────────────────────────── */
function NotifPanel({ notifs, onClose, onClear }: {
  notifs: Notif[];
  onClose: () => void;
  onClear: () => void;
}) {
  const tint: Record<Notif["type"], string> = {
    warning: C.amber,
    success: C.lime,
    info:    C.mint,
  };
  const dimTint: Record<Notif["type"], string> = {
    warning: "rgba(255,179,64,0.12)",
    success: C.limeDim,
    info:    "rgba(0,212,154,0.12)",
  };

  return (
    <View style={S.notifOverlay}>
      <Pressable style={S.notifBackdrop} onPress={onClose} />
      <View style={S.notifPanel}>
        <View style={S.notifHeader}>
          <Text style={S.notifPanelTitle}>Notifications</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {notifs.length > 0 && (
              <Pressable style={S.notifClearBtn} onPress={onClear}>
                <Text style={S.notifClearText}>Clear all</Text>
              </Pressable>
            )}
            <Pressable style={S.notifCloseBtn} onPress={onClose}>
              <X size={16} color={C.t2} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          {notifs.length === 0 ? (
            <View style={S.notifEmpty}>
              <BellOff size={28} color={C.t3} />
              <Text style={S.notifEmptyText}>No notifications</Text>
            </View>
          ) : (
            <View style={{ gap: 8, paddingBottom: 4 }}>
              {notifs.map((n) => (
                <View key={n.id} style={[S.notifItem, { backgroundColor: dimTint[n.type] }]}>
                  <View style={[S.notifDot, { backgroundColor: tint[n.type] }]} />
                  <View style={S.flex1}>
                    <Text style={S.notifTitle}>{n.title}</Text>
                    <Text style={S.notifBody}>{n.body}</Text>
                  </View>
                  <Text style={S.notifTime}>{n.time}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

/* ─── Shared components ───────────────────────────────────────────────── */
function ActionBtn({ label, sub, icon: Icon, tint, onPress }:
  { label: string; sub: string; icon: React.ElementType; tint: string; onPress: () => void }) {
  return (
    <Pressable style={S.actionBtn} onPress={onPress}>
      <View style={[S.actionIcon, { backgroundColor: `${tint}1a` }]}>
        <Icon size={20} color={tint} />
      </View>
      <Text style={S.actionSub}>{label}</Text>
      <Text style={S.actionLabel}>{sub}</Text>
    </Pressable>
  );
}

function Seg({ options, active, onChange, icons }:
  { options: string[]; active: string; onChange: (v: string) => void; icons: Record<string, React.ElementType> }) {
  return (
    <View style={S.seg}>
      {options.map((opt) => {
        const on = opt === active;
        const Icon = icons[opt];
        return (
          <Pressable key={opt} style={[S.segItem, on && S.segItemActive]} onPress={() => onChange(opt)}>
            {Icon && <Icon size={15} color={on ? C.ink : C.t2} />}
            <Text style={[S.segLabel, on && S.segLabelActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SectionHead({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={S.sectionHead}>
      <Text style={S.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onPress}>
          <Text style={S.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function CardMetric({ label, value, alignRight }: { label: string; value: string; alignRight?: boolean }) {
  return (
    <View style={alignRight ? S.alignRight : undefined}>
      <Text style={S.metricLabel}>{label}</Text>
      <Text style={S.metricValue}>{value}</Text>
    </View>
  );
}

function TokenCard({ token }: { token: Token }) {
  const [copied, setCopied] = useState(false);
  const UtilIcon = token.utility === "Water" ? Droplets : Bolt;
  const unitLabel = token.utility === "Water" ? "L" : "kWh";

  function copyToken() {
    navigator.clipboard?.writeText(token.token.replace(/ /g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <View style={S.card}>
      <View style={S.tokenHead}>
        <View style={S.tokenBadge}>
          <UtilIcon size={10} color={C.ink} />
          <Text style={S.tokenBadgeText}>{token.utility}</Text>
        </View>
        <Text style={S.tokenDate}>{token.date}</Text>
      </View>
      <Text style={S.tokenCode}>{token.token}</Text>
      <View style={S.tokenFoot}>
        <Text style={S.tokenMeta}>{money(token.amount)}</Text>
        <Text style={S.tokenMeta}>{token.units.toFixed(2)} {unitLabel}</Text>
        <Pressable onPress={copyToken}>
          {copied
            ? <Check size={14} color={C.lime} />
            : <Clipboard size={14} color={C.t3} />}
        </Pressable>
      </View>
    </View>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={S.bankRow}>
      <Text style={S.bankLabel}>{label}</Text>
      <Text style={S.bankValue}>{value}</Text>
    </View>
  );
}

function CtrlRow({ title, amount, owner, onChange }:
  { title: string; amount: number; owner: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={S.ctrlRow}>
      <View style={S.flex1}>
        <Text style={S.ctrlTitle}>{title}</Text>
        <Text style={S.ctrlAmt}>{money(amount)}</Text>
      </View>
      <View style={S.toggle}>
        <Pressable style={[S.toggleOpt, owner && S.toggleOn]} onPress={() => onChange(true)}>
          <Text style={[S.toggleLabel, owner && S.toggleLabelOn]}>Owner</Text>
        </Pressable>
        <Pressable style={[S.toggleOpt, !owner && S.toggleOn]} onPress={() => onChange(false)}>
          <Text style={[S.toggleLabel, !owner && S.toggleLabelOn]}>Tenant</Text>
        </Pressable>
      </View>
    </View>
  );
}

function GreenBtn({ label, icon: Icon, onPress, disabled }: {
  label: string; icon: React.ElementType;
  onPress?: () => void; disabled?: boolean;
}) {
  return (
    <Pressable
      style={[S.greenBtn, disabled && { opacity: 0.4 }]}
      onPress={disabled ? undefined : onPress}
    >
      <Text style={S.greenBtnText}>{label}</Text>
      <Icon size={17} color={C.ink} />
    </Pressable>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────── */

const S = {
  /* Shell — transparent so #root gradient shows through */
  app: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative" as const,
    overflow: "hidden" as const,
  },

  /* Header */
  header: {
    paddingTop: 54,
    paddingHorizontal: 22,
    paddingBottom: 16,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    zIndex: 2,
  },
  eyebrow: {
    color: C.t3,
    fontWeight: "800" as const,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
  pageTitle: {
    marginTop: 2,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontWeight: "700" as const,
    fontSize: 30,
    letterSpacing: -0.3,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 13,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  bellBtn: {
    width: 44, height: 44,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  bellDot: {
    position: "absolute" as const,
    top: 8, right: 8,
    minWidth: 14, height: 14,
    borderRadius: 999,
    backgroundColor: C.red,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 3,
  },

  /* Toast */
  toast: {
    position: "absolute" as const,
    zIndex: 10,
    top: 114,
    alignSelf: "center" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: C.lime,
  },
  toastText: { color: C.ink, fontWeight: "900" as const, fontSize: 13 },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 110,
    gap: 12,
  },
  stack: { gap: 12 },
  flex1: { flex: 1 },
  alignRight: { alignItems: "flex-end" as const },

  /* ── Hero ── */
  hero: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  heroLabel: {
    color: C.t3,
    fontWeight: "800" as const,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.9,
  },
  heroAmount: {
    marginTop: 6,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 52,
    fontWeight: "700" as const,
    letterSpacing: -1,
  },
  refPill: {
    marginTop: 16,
    alignSelf: "flex-start" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  refLabel: {
    color: C.t3,
    fontWeight: "800" as const,
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  refValue: {
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontWeight: "700" as const,
    fontSize: 14,
  },
  heroStats: {
    marginTop: 20,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  heroStatLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.7,
  },
  heroStatValue: {
    marginTop: 4,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  progressTrack: {
    marginTop: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden" as const,
  },
  progressFill: {
    width: "6%",
    height: 4,
    borderRadius: 999,
    backgroundColor: C.lime,
  },

  /* ── Dock ── */
  dock: { flexDirection: "row" as const, gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 22,
    padding: 14,
    minHeight: 120,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  actionIcon: {
    width: 40, height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  actionSub: {
    marginTop: 14,
    color: C.t3,
    fontSize: 10,
    fontWeight: "900" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.7,
  },
  actionLabel: {
    marginTop: 2,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 16,
    fontWeight: "700" as const,
  },

  /* ── Alert ── */
  alertCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: C.redDim,
    borderWidth: 1,
    borderColor: C.redBorder,
  },
  alertIcon: {
    width: 34, height: 34,
    borderRadius: 11,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,59,92,0.15)",
  },
  alertTitle: { color: C.red, fontWeight: "900" as const, fontSize: 14 },
  alertBody:  { marginTop: 2, color: "#ff8099", fontWeight: "700" as const, fontSize: 12 },

  /* ── Section header ── */
  sectionHead: {
    marginTop: 4,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  sectionTitle: { color: C.t1, fontFamily: "Space Grotesk", fontSize: 20, fontWeight: "700" as const },
  sectionAction: { color: C.lime, fontWeight: "900" as const, fontSize: 14 },

  /* ── Card ── */
  card: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cardLabel: {
    color: C.t3,
    fontWeight: "900" as const,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontWeight: "700" as const,
    fontSize: 18,
    marginBottom: 8,
  },
  bigNumber: {
    marginTop: 4,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 44,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },

  /* Metrics */
  metricLabel: { color: C.t3, fontSize: 10, fontWeight: "800" as const, textTransform: "uppercase" as const, letterSpacing: 0.7 },
  metricValue: { marginTop: 4, color: C.t1, fontFamily: "Space Grotesk", fontSize: 18, fontWeight: "700" as const },

  /* ── Chips ── */
  chipRow: { marginTop: 16, flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  chip: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: C.cardHigh,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  chipActive: { backgroundColor: C.lime, borderColor: C.lime },
  chipText: { color: C.t2, fontWeight: "900" as const, fontSize: 13 },
  chipTextActive: { color: C.ink },

  /* ── Payment method rows ── */
  methodRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    borderRadius: 18,
    padding: 14,
    minHeight: 66,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  methodRowActive: { borderColor: C.lime, borderWidth: 1.5 },
  methodIcon: {
    width: 40, height: 40,
    borderRadius: 13,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: C.cardHigh,
  },
  methodIconActive: { backgroundColor: C.lime },
  methodName: { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  methodFee:  { marginTop: 2, color: C.t3, fontWeight: "700" as const, fontSize: 12 },

  /* ── Bank rows ── */
  bankRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, paddingVertical: 5 },
  bankLabel: { color: C.t3, fontWeight: "800" as const, fontSize: 13 },
  bankValue: { color: C.t1, fontWeight: "900" as const, fontSize: 13 },
  greenRow: {
    marginTop: 8, borderRadius: 13, padding: 12,
    flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const,
    backgroundColor: C.lime,
  },
  greenRowText: { color: C.ink, fontWeight: "900" as const, fontSize: 13 },

  /* ── Checkout ── */
  checkoutMetrics: { flexDirection: "row" as const, justifyContent: "space-between" as const, marginBottom: 14 },
  divider: { height: 1, backgroundColor: C.cardBorder, marginBottom: 14 },
  checkoutTotal: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  totalLabel: { color: C.t2, fontWeight: "900" as const, fontSize: 14 },
  totalValue: { color: C.t1, fontFamily: "Space Grotesk", fontSize: 24, fontWeight: "700" as const },

  /* ── Lime CTA button ── */
  greenBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 8,
    backgroundColor: C.lime,
  },
  greenBtnText: { color: C.ink, fontWeight: "900" as const, fontSize: 15 },

  /* ── Amount input ── */
  numInput: {
    marginTop: 8,
    height: 76,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: C.cardHigh,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  numCurrency: { color: C.t3, fontSize: 26, fontWeight: "900" as const },
  numField: {
    flex: 1,
    outlineStyle: "none" as unknown as never,
    borderWidth: 0,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 40,
    fontWeight: "700" as const,
    backgroundColor: "transparent",
  },
  estimateRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    borderRadius: 13,
    padding: 14,
    marginTop: 0,
    backgroundColor: C.limeDim,
    borderWidth: 1,
    borderColor: C.limeBorder,
  },
  estimateLabel: { flex: 1, color: C.t2, fontWeight: "800" as const, fontSize: 13 },
  estimateValue: { color: C.lime, fontFamily: "Space Grotesk", fontSize: 20, fontWeight: "700" as const },

  /* ── Segment toggle ── */
  seg: {
    flexDirection: "row" as const,
    gap: 4,
    borderRadius: 14,
    padding: 4,
    backgroundColor: C.cardHigh,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  segItem: {
    flex: 1, height: 40,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 6,
  },
  segItemActive: { backgroundColor: C.lime },
  segLabel: { color: C.t2, fontWeight: "900" as const, fontSize: 13 },
  segLabelActive: { color: C.ink },

  /* ── Chart ── */
  usageMetrics: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 18, marginBottom: 10,
  },
  chart: {
    height: 148,
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    justifyContent: "space-between" as const,
  },
  chartCol: { flex: 1, height: "100%", alignItems: "center" as const, justifyContent: "flex-end" as const, gap: 7 },
  barTrack: {
    flex: 1, width: 18,
    justifyContent: "flex-end" as const,
    borderRadius: 999,
    overflow: "hidden" as const,
    backgroundColor: C.cardHigh,
  },
  bar: { width: "100%", borderRadius: 999, backgroundColor: C.lime },
  barLabel: { color: C.t3, fontWeight: "900" as const, fontSize: 11 },

  /* ── Insight card ── */
  insightCard: {
    flexDirection: "row" as const,
    gap: 12,
    alignItems: "center" as const,
    borderRadius: 18,
    padding: 14,
    backgroundColor: C.limeDim,
    borderWidth: 1,
    borderColor: C.limeBorder,
  },
  insightIcon: {
    width: 34, height: 34,
    borderRadius: 11,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(201,255,87,0.15)",
  },
  insightTitle: { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  insightBody:  { marginTop: 2, color: C.t2, fontWeight: "700" as const, fontSize: 12 },

  /* ── Token card ── */
  tokenHead: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
  tokenBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    borderRadius: 999,
    paddingVertical: 5, paddingHorizontal: 10,
    backgroundColor: C.lime,
  },
  tokenBadgeText: { color: C.ink, fontWeight: "900" as const, fontSize: 11 },
  tokenDate: { color: C.t3, fontWeight: "800" as const, fontSize: 12 },
  tokenCode: { marginTop: 14, color: C.t1, fontFamily: "Space Grotesk", fontSize: 22, fontWeight: "700" as const, letterSpacing: 0.4 },
  tokenFoot: { marginTop: 14, flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
  tokenMeta: { color: C.t3, fontWeight: "800" as const, fontSize: 12 },

  /* ── Ledger filters ── */
  filterRow: { flexDirection: "row" as const, gap: 8 },
  filterActive: {
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16,
    overflow: "hidden" as const,
    color: C.ink, backgroundColor: C.lime,
    fontWeight: "900" as const, fontSize: 13,
  },
  filterItem: {
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16,
    overflow: "hidden" as const,
    color: C.t2,
    backgroundColor: C.cardHigh,
    borderWidth: 1, borderColor: C.cardBorder,
    fontWeight: "900" as const, fontSize: 13,
  },

  /* ── Transaction rows ── */
  txRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  txIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center" as const, justifyContent: "center" as const },
  txIn:   { backgroundColor: C.lime },
  txOut:  { backgroundColor: "rgba(255,179,64,0.15)", borderWidth: 1, borderColor: "rgba(255,179,64,0.25)" },
  txTitle:  { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  txSub:    { marginTop: 2, color: C.t3, fontWeight: "700" as const, fontSize: 12 },
  txAmount: { fontWeight: "900" as const, fontSize: 14 },
  txAmtIn:  { color: C.lime },
  txAmtOut: { color: C.t1 },
  txDate:   { marginTop: 2, color: C.t3, fontWeight: "700" as const, fontSize: 12 },

  /* ── Profile / Control ── */
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.lime, alignItems: "center" as const, justifyContent: "center" as const },
  profileName: { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  profileSub:  { marginTop: 3, color: C.t3, fontWeight: "700" as const, fontSize: 12 },
  ctrlRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  ctrlTitle: { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  ctrlAmt:   { marginTop: 3, color: C.t3, fontWeight: "700" as const, fontSize: 12 },
  toggle: {
    flexDirection: "row" as const,
    borderRadius: 999,
    padding: 3,
    backgroundColor: C.cardHigh,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  toggleOpt:     { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  toggleOn:      { backgroundColor: C.lime },
  toggleLabel:   { color: C.t3, fontWeight: "900" as const, fontSize: 11 },
  toggleLabelOn: { color: C.ink },

  /* ── Ledger month nav ── */
  monthNav: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  monthChevron: {
    width: 34, height: 34,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: C.cardHigh,
  },
  monthLabel: {
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontWeight: "700" as const,
    fontSize: 17,
  },

  /* ── Ledger date group ── */
  ledgerDate: {
    color: C.t3,
    fontWeight: "900" as const,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    paddingTop: 6,
  },

  /* ── Notification panel ── */
  notifOverlay: {
    position: "absolute" as const,
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 30,
  },
  notifBackdrop: {
    position: "absolute" as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  notifPanel: {
    position: "absolute" as const,
    top: 100, left: 14, right: 14,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#152010",
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  notifHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 14,
  },
  notifPanelTitle: {
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  notifCloseBtn: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  notifClearBtn: {
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  notifClearText: { color: C.t3, fontWeight: "900" as const, fontSize: 11 },
  notifItem: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  notifDot: { width: 8, height: 8, borderRadius: 999, marginTop: 4 },
  notifTitle: { color: C.t1, fontWeight: "900" as const, fontSize: 13 },
  notifBody:  { marginTop: 2, color: C.t2, fontWeight: "700" as const, fontSize: 12 },
  notifTime:  { color: C.t3, fontWeight: "800" as const, fontSize: 11, marginTop: 1 },
  notifEmpty: {
    paddingVertical: 32,
    alignItems: "center" as const,
    gap: 10,
  },
  notifEmptyText: { color: C.t3, fontWeight: "800" as const, fontSize: 13 },

  /* ── Bell dot ── */
  bellDotText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900" as const,
    lineHeight: 9,
  },

  /* ── Tab bar ── */
  tabBar: {
    position: "absolute" as const,
    bottom: 14, left: 14, right: 14,
    height: 70,
    borderRadius: 26,
    flexDirection: "row" as const,
    padding: 6,
    backgroundColor: "rgba(4,14,7,0.92)",
    borderWidth: 1,
    borderColor: C.limeBorder,
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    zIndex: 20,
  },
  tab: {
    flex: 1, borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 3,
  },
  tabActive: { backgroundColor: C.lime },
  tabLabel: { color: C.t3, fontWeight: "900" as const, fontSize: 10, letterSpacing: 0.2 },
  tabLabelActive: { color: C.ink },
};

createRoot(document.getElementById("root")!).render(<App />);
