import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Bolt,
  Check,
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

const usageData = [
  { day: "M", water: 42, electricity: 58 },
  { day: "T", water: 54, electricity: 62 },
  { day: "W", water: 36, electricity: 71 },
  { day: "T", water: 66, electricity: 74 },
  { day: "F", water: 72, electricity: 88 },
  { day: "S", water: 46, electricity: 49 },
  { day: "S", water: 38, electricity: 44 },
];

const methods: Array<{ name: PaymentMethod; fee: string; icon: React.ElementType }> = [
  { name: "Instant EFT", fee: "1.6% min R1.50", icon: Smartphone  },
  { name: "Card",        fee: "2.95% + R1.25",  icon: CreditCard  },
  { name: "Manual EFT", fee: "R3.50 flat",      icon: Landmark    },
  { name: "Retail",     fee: "3.9% min R8.00",  icon: ReceiptText },
];

const nav: Array<{ screen: Screen; label: string; icon: React.ElementType }> = [
  { screen: "home",     label: "Home",    icon: Home      },
  { screen: "recharge", label: "Recharge",icon: Wallet    },
  { screen: "buy",      label: "Buy",     icon: Bolt      },
  { screen: "usage",    label: "Pulse",   icon: LineChart },
  { screen: "control",  label: "Control", icon: Settings  },
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

/* ─── App Shell ───────────────────────────────────────────────────────── */
function App() {
  const [screen, setScreen]     = useState<Screen>("home");
  const [balance, setBalance]   = useState(0.48);
  const [tokenList, setTokenList] = useState<Token[]>(SEED_TOKENS);
  const [txList, setTxList]     = useState<Transaction[]>(SEED_TXS);
  const [toast, setToast]       = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setBalance((b) => +(b + amount).toFixed(2));
    setTxList((prev) => [
      { id: uid(), date: today, label: "Wallet top-up", detail: method, amount, in: true },
      ...prev,
    ]);
    showToast("Wallet recharged");
    setScreen("home");
  }

  function handleBuyToken(utility: Utility, amount: number) {
    const units = +(amount / PRICE_PER_UNIT[utility]).toFixed(2);
    const today = fmtDate(new Date());
    const code  = genToken();
    setBalance((b) => +(b - amount).toFixed(2));
    setTokenList((prev) => [
      { date: today, amount, token: code, units, utility },
      ...prev,
    ]);
    setTxList((prev) => [
      { id: uid(), date: today, label: `${utility} token`, detail: `${units} units`, amount, in: false, utility },
      ...prev,
    ]);
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
        <View>
          <Text style={S.eyebrow}>Unit 28-05</Text>
          <Text style={S.pageTitle}>{title}</Text>
        </View>
        <Pressable style={S.bellBtn}>
          <Bell size={18} color={C.t1} />
          <View style={S.bellDot} />
        </Pressable>
      </View>

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
        {screen === "usage"   && <UsageScreen tokens={tokenList} />}
        {screen === "ledger"  && <LedgerScreen txList={txList} />}
        {screen === "control" && <ControlScreen />}
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
function UsageScreen({ tokens }: { tokens: Token[] }) {
  const [utility, setUtility] = useState<Utility>("Electricity");

  const max = Math.max(...usageData.map((u) => utility === "Water" ? u.water : u.electricity));

  /* Derive total units purchased from token list */
  const totalUnits = tokens
    .filter((t) => t.utility === utility)
    .reduce((s, t) => s + t.units, 0);
  const weekUnits  = Math.round(totalUnits * 0.16); /* mock weekly slice */
  const dailyAvg   = weekUnits > 0 ? Math.round(weekUnits / 7) : 0;
  const unit        = utility === "Electricity" ? "kWh" : "L";

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
          <CardMetric label="This week" value={`${weekUnits} ${unit}`} />
          <CardMetric label="Daily avg"  value={`${dailyAvg} ${unit}`} alignRight />
        </View>
        <View style={S.chart}>
          {usageData.map((item, i) => {
            const val = utility === "Water" ? item.water : item.electricity;
            const pct = val / max;
            return (
              <View key={`${item.day}-${i}`} style={S.chartCol}>
                <View style={S.barTrack}>
                  <View style={[S.bar, { height: `${pct * 100}%` as unknown as number }]} />
                </View>
                <Text style={S.barLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Total purchased */}
      <View style={[S.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
        <Text style={S.cardLabel}>Total {utility.toLowerCase()} purchased</Text>
        <Text style={[S.metricValue, { color: C.lime }]}>{totalUnits.toFixed(1)} {unit}</Text>
      </View>

      <View style={S.insightCard}>
        <View style={S.insightIcon}>
          <Sparkles size={15} color={C.lime} />
        </View>
        <View style={S.flex1}>
          <Text style={S.insightTitle}>Usage looks stable</Text>
          <Text style={S.insightBody}>No unusual spikes detected for Unit 28-05 this week.</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Ledger ──────────────────────────────────────────────────────────── */
type LedgerFilter = "All" | "Electricity" | "Water" | "Top-ups";

function LedgerScreen({ txList }: { txList: Transaction[] }) {
  const [filter, setFilter] = useState<LedgerFilter>("All");

  const filters: LedgerFilter[] = ["All", "Electricity", "Water", "Top-ups"];

  const visible = txList.filter((tx) => {
    if (filter === "All")         return true;
    if (filter === "Top-ups")     return tx.in;
    return tx.utility === filter;
  });

  const totalIn  = visible.filter((t) => t.in).reduce((s, t) => s + t.amount, 0);
  const totalOut = visible.filter((t) => !t.in).reduce((s, t) => s + t.amount, 0);

  return (
    <View style={S.stack}>
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
        : visible.map((item) => (
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
                <Text style={S.txDate}>{item.date}</Text>
              </View>
            </View>
          ))
      }
    </View>
  );
}

/* ─── Control ─────────────────────────────────────────────────────────── */
function ControlScreen() {
  const [ownerHosting, setOwnerHosting] = useState(false);
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
      <CtrlRow title="Hosting"           amount={90}     owner={ownerHosting} onChange={setOwnerHosting} />
      <CtrlRow title="Sewerage"          amount={697.73} owner={true}         onChange={() => null} />
      <CtrlRow title="Water Demand Levy" amount={65.08}  owner={true}         onChange={() => null} />
      <GreenBtn label="Save allocation" icon={Check} />
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
    top: 10, right: 10,
    width: 7, height: 7,
    borderRadius: 999,
    backgroundColor: C.red,
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
