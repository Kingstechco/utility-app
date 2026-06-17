import React, { useMemo, useState } from "react";
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

/* ─── Brand Tokens — Chime-inspired forest green palette ─────────────── */
const C = {
  /* Background (deep forest green) */
  bg: "#061a0a",

  /* Primary accent — bright green */
  green:       "#00d462",
  greenDim:    "rgba(0,212,98,0.12)",
  greenBorder: "rgba(0,212,98,0.28)",

  /* White content cards */
  card:       "#ffffff",
  cardAlt:    "#f2f8f4",
  cardBorder: "rgba(6,26,10,0.07)",

  /* Text ON dark (hero / header areas) */
  t1: "#ffffff",
  t2: "rgba(255,255,255,0.62)",
  t3: "rgba(255,255,255,0.38)",

  /* Text ON white cards */
  c1: "#071a0c",   /* primary */
  c2: "#3a6646",   /* secondary */
  c3: "#7a9b82",   /* muted */

  /* Semantic colours */
  red:       "#ff3b5c",
  redBg:     "#fff0f3",
  redBorder: "rgba(255,59,92,0.2)",
  amber:     "#ff9f00",
  amberBg:   "#fff8ec",
  blue:      "#0a84ff",

  /* Glass surface (hero card / overlay) */
  glass:       "rgba(255,255,255,0.07)",
  glassBorder: "rgba(255,255,255,0.12)",

  /* Used only ON coloured surfaces */
  ink: "#061a0a",
};

/* ─── Data ────────────────────────────────────────────────────────────── */
const tokens = [
  { date: "12 Jun", amount: 300, token: "0736 4844 3944 8209 4274", units: 60.4, utility: "Electricity" as Utility },
  { date: "12 Jun", amount: 167, token: "0841 0205 5352 3480 5042", units: 33.6, utility: "Electricity" as Utility },
  { date: "11 Jun", amount: 80,  token: "7002 3413 1105 8044 4504", units: 16.1, utility: "Electricity" as Utility },
];

const usage = [
  { day: "M", water: 42, electricity: 58 },
  { day: "T", water: 54, electricity: 62 },
  { day: "W", water: 36, electricity: 71 },
  { day: "T", water: 66, electricity: 74 },
  { day: "F", water: 72, electricity: 88 },
  { day: "S", water: 46, electricity: 49 },
  { day: "S", water: 38, electricity: 44 },
];

const transactions = [
  { date: "13 Jun", label: "Wallet top-up",    detail: "Manual EFT",   amount: 550, in: true  },
  { date: "12 Jun", label: "Electricity token", detail: "60.40 units",  amount: 300, in: false },
  { date: "12 Jun", label: "Electricity token", detail: "33.60 units",  amount: 167, in: false },
  { date: "01 Jun", label: "Hosting",           detail: "Tenant alloc", amount: 90,  in: false },
];

const methods: Array<{ name: PaymentMethod; fee: string; icon: React.ElementType }> = [
  { name: "Instant EFT", fee: "1.6% min R1.50",  icon: Smartphone  },
  { name: "Card",        fee: "2.95% + R1.25",   icon: CreditCard  },
  { name: "Manual EFT", fee: "R3.50 flat",       icon: Landmark    },
  { name: "Retail",     fee: "3.9% min R8.00",   icon: ReceiptText },
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

/* ─── App Shell ───────────────────────────────────────────────────────── */
function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [copied, setCopied] = useState(false);

  const title = {
    home: "Metering", recharge: "Recharge", buy: "Buy token",
    usage: "Usage pulse", ledger: "Ledger", control: "Control",
  }[screen];

  function copyReference() {
    navigator.clipboard?.writeText("100477911");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <View style={S.app}>
      {/* Ambient green orbs */}
      <View style={S.orb1} />
      <View style={S.orb2} />

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
      {copied && (
        <View style={S.toast}>
          <Check size={14} color={C.ink} />
          <Text style={S.toastText}>Reference copied</Text>
        </View>
      )}

      {/* Screen content */}
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {screen === "home"     && <HomeScreen    setScreen={setScreen} copyRef={copyReference} />}
        {screen === "recharge" && <RechargeScreen copyRef={copyReference} />}
        {screen === "buy"      && <BuyScreen />}
        {screen === "usage"    && <UsageScreen />}
        {screen === "ledger"   && <LedgerScreen />}
        {screen === "control"  && <ControlScreen />}
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
function HomeScreen({ setScreen, copyRef }: { setScreen: (s: Screen) => void; copyRef: () => void }) {
  return (
    <View style={S.stack}>
      {/* Hero balance — floats on dark green bg */}
      <View style={S.hero}>
        <Text style={S.heroLabel}>Available balance</Text>
        <Text style={S.heroAmount}>{money(0.48)}</Text>
        <Pressable style={S.refPill} onPress={copyRef}>
          <Text style={S.refLabel}>Wallet ref</Text>
          <Text style={S.refValue}>100477911</Text>
          <Clipboard size={13} color={C.t3} />
        </Pressable>
        <View style={S.heroStats}>
          <View>
            <Text style={S.heroStatLabel}>Spent this month</Text>
            <Text style={S.heroStatValue}>{money(547)}</Text>
          </View>
          <View style={S.alignRight}>
            <Text style={S.heroStatLabel}>Limit</Text>
            <Text style={S.heroStatValue}>{money(10000)}</Text>
          </View>
        </View>
        <View style={S.progressTrack}>
          <View style={S.progressFill} />
        </View>
      </View>

      {/* Quick-action dock */}
      <View style={S.dock}>
        <ActionBtn label="Recharge" sub="Add funds" icon={Wallet}   tint={C.green} onPress={() => setScreen("recharge")} />
        <ActionBtn label="Buy"      sub="Token"     icon={Bolt}     tint={C.blue}  onPress={() => setScreen("buy")}      />
        <ActionBtn label="Pulse"    sub="Usage"     icon={LineChart} tint={C.amber} onPress={() => setScreen("usage")}   />
      </View>

      {/* Alert */}
      <View style={S.alertCard}>
        <View style={S.alertIcon}>
          <Lock size={15} color={C.red} />
        </View>
        <View style={S.flex1}>
          <Text style={S.alertTitle}>Low balance lock</Text>
          <Text style={S.alertBody}>Recharge before buying your next prepaid token.</Text>
        </View>
      </View>

      {/* Latest tokens */}
      <SectionHead title="Latest tokens" action="Ledger" onPress={() => setScreen("ledger")} />
      {tokens.map((t) => <TokenCard key={t.token} token={t} />)}
    </View>
  );
}

/* ─── Recharge ────────────────────────────────────────────────────────── */
function RechargeScreen({ copyRef }: { copyRef: () => void }) {
  const [amount, setAmount] = useState(250);
  const [method, setMethod] = useState<PaymentMethod>("Instant EFT");
  const fee = useMemo(() => {
    if (method === "Instant EFT") return Math.max(1.5, amount * 0.016);
    if (method === "Card")        return amount * 0.0295 + 1.25;
    if (method === "Retail")      return Math.max(8, amount * 0.039);
    return 3.5;
  }, [amount, method]);

  return (
    <View style={S.stack}>
      {/* Amount picker */}
      <View style={S.card}>
        <Text style={S.cardLabel}>Recharge value</Text>
        <Text style={S.bigNumber}>{money(amount)}</Text>
        <View style={S.chipRow}>
          {[100, 250, 500, 1000].map((v) => (
            <Pressable key={v} style={[S.chip, amount === v && S.chipActive]} onPress={() => setAmount(v)}>
              <Text style={[S.chipText, amount === v && S.chipTextActive]}>{money(v)}</Text>
            </Pressable>
          ))}
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
                <item.icon size={17} color={sel ? C.ink : C.c2} />
              </View>
              <View style={S.flex1}>
                <Text style={S.methodName}>{item.name}</Text>
                <Text style={S.methodFee}>{item.fee}</Text>
              </View>
              {sel && <Check size={16} color={C.green} />}
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
          <CardMetric label="Amount" value={money(amount)} />
          <CardMetric label="Fees"   value={money(fee)} alignRight />
        </View>
        <View style={S.divider} />
        <View style={S.checkoutTotal}>
          <Text style={S.totalLabel}>Total to pay</Text>
          <Text style={S.totalValue}>{money(amount + fee)}</Text>
        </View>
        <GreenBtn label="Continue recharge" icon={ArrowUpRight} />
      </View>
    </View>
  );
}

/* ─── Buy ─────────────────────────────────────────────────────────────── */
function BuyScreen() {
  const [utility, setUtility] = useState<Utility>("Electricity");
  const [amount, setAmount] = useState("100");
  const units = (Number(amount || 0)) / (utility === "Electricity" ? 4.97 : 22.4);

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
        <View style={S.estimateRow}>
          <Gauge size={16} color={C.green} />
          <Text style={S.estimateLabel}>Estimated units</Text>
          <Text style={S.estimateValue}>{units.toFixed(2)}</Text>
        </View>
      </View>

      <View style={S.alertCard}>
        <View style={S.alertIcon}>
          <Lock size={15} color={C.red} />
        </View>
        <View style={S.flex1}>
          <Text style={S.alertTitle}>Wallet balance is too low</Text>
          <Text style={S.alertBody}>Available: {money(0.48)}. Recharge to unlock.</Text>
        </View>
      </View>

      <GreenBtn label="Recharge first" icon={Wallet} />
    </View>
  );
}

/* ─── Usage ───────────────────────────────────────────────────────────── */
function UsageScreen() {
  const [utility, setUtility] = useState<Utility>("Water");
  const max = Math.max(...usage.map((u) => utility === "Water" ? u.water : u.electricity));

  return (
    <View style={S.stack}>
      <View style={S.card}>
        <Seg
          options={["Water", "Electricity"] as Utility[]}
          active={utility}
          onChange={(v) => setUtility(v as Utility)}
          icons={{ Water: Droplets, Electricity: Bolt }}
        />
        <View style={S.usageMetrics}>
          <CardMetric label="This week" value={utility === "Water" ? "354 L" : "446 kWh"} />
          <CardMetric label="Daily avg"  value={utility === "Water" ? "51 L"  : "64 kWh"}  alignRight />
        </View>
        <View style={S.chart}>
          {usage.map((item, i) => {
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

      <View style={S.insightCard}>
        <View style={S.insightIcon}>
          <Sparkles size={15} color={C.green} />
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
function LedgerScreen() {
  return (
    <View style={S.stack}>
      <View style={S.filterRow}>
        <Text style={S.filterActive}>June</Text>
        <Text style={S.filterItem}>Electricity</Text>
        <Text style={S.filterItem}>All rails</Text>
      </View>
      {transactions.map((item) => (
        <View key={`${item.label}-${item.date}-${item.amount}`} style={S.txRow}>
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
      ))}
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
            {Icon && <Icon size={15} color={on ? C.ink : C.c2} />}
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

function TokenCard({ token }: { token: (typeof tokens)[number] }) {
  return (
    <View style={S.card}>
      <View style={S.tokenHead}>
        <View style={S.tokenBadge}>
          <Bolt size={10} color={C.ink} />
          <Text style={S.tokenBadgeText}>{token.utility}</Text>
        </View>
        <Text style={S.tokenDate}>{token.date}</Text>
      </View>
      <Text style={S.tokenCode}>{token.token}</Text>
      <View style={S.tokenFoot}>
        <Text style={S.tokenMeta}>{money(token.amount)}</Text>
        <Text style={S.tokenMeta}>{token.units.toFixed(2)} units</Text>
        <Clipboard size={14} color={C.c3} />
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

function GreenBtn({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <Pressable style={S.greenBtn}>
      <Text style={S.greenBtnText}>{label}</Text>
      <Icon size={17} color={C.ink} />
    </Pressable>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────── */

/* White card shadow — subtle depth on dark green bg */
const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
} as const;

const S = {
  /* Shell */
  app: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  orb1: {
    position: "absolute" as const,
    top: -160, left: -100,
    width: 380, height: 380,
    borderRadius: 999,
    backgroundColor: "rgba(0,180,70,0.12)",
  },
  orb2: {
    position: "absolute" as const,
    bottom: 60, right: -120,
    width: 300, height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(0,100,40,0.1)",
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
    backgroundColor: C.green,
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

  /* ── Hero (on dark bg, no card border) ── */
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
    backgroundColor: C.green,
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
    ...CARD_SHADOW,
  },
  actionIcon: {
    width: 40, height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  actionSub: {
    marginTop: 14,
    color: C.c3,
    fontSize: 10,
    fontWeight: "900" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.7,
  },
  actionLabel: {
    marginTop: 2,
    color: C.c1,
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
    backgroundColor: C.redBg,
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
  alertBody:  { marginTop: 2, color: "#c0334e", fontWeight: "700" as const, fontSize: 12 },

  /* ── Section header ── */
  sectionHead: {
    marginTop: 4,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  sectionTitle: { color: C.t1, fontFamily: "Space Grotesk", fontSize: 20, fontWeight: "700" as const },
  sectionAction: { color: C.green, fontWeight: "900" as const, fontSize: 14 },

  /* ── White card ── */
  card: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    ...CARD_SHADOW,
  },
  cardLabel: {
    color: C.c3,
    fontWeight: "900" as const,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: C.c1,
    fontFamily: "Space Grotesk",
    fontWeight: "700" as const,
    fontSize: 18,
    marginBottom: 8,
  },
  bigNumber: {
    marginTop: 4,
    color: C.c1,
    fontFamily: "Space Grotesk",
    fontSize: 44,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },

  /* Metrics on white card */
  metricLabel: { color: C.c3, fontSize: 10, fontWeight: "800" as const, textTransform: "uppercase" as const, letterSpacing: 0.7 },
  metricValue: { marginTop: 4, color: C.c1, fontFamily: "Space Grotesk", fontSize: 18, fontWeight: "700" as const },

  /* ── Chips ── */
  chipRow: { marginTop: 16, flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  chip: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: "rgba(6,26,10,0.1)",
  },
  chipActive: { backgroundColor: C.green, borderColor: C.green },
  chipText: { color: C.c2, fontWeight: "900" as const, fontSize: 13 },
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
    ...CARD_SHADOW,
  },
  methodRowActive: { borderColor: C.green, borderWidth: 1.5 },
  methodIcon: {
    width: 40, height: 40,
    borderRadius: 13,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: C.cardAlt,
  },
  methodIconActive: { backgroundColor: C.green },
  methodName: { color: C.c1, fontWeight: "900" as const, fontSize: 14 },
  methodFee:  { marginTop: 2, color: C.c3, fontWeight: "700" as const, fontSize: 12 },

  /* ── Bank rows ── */
  bankRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, paddingVertical: 5 },
  bankLabel: { color: C.c3, fontWeight: "800" as const, fontSize: 13 },
  bankValue: { color: C.c1, fontWeight: "900" as const, fontSize: 13 },
  greenRow: {
    marginTop: 8, borderRadius: 13, padding: 12,
    flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const,
    backgroundColor: C.green,
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
  totalLabel: { color: C.c2, fontWeight: "900" as const, fontSize: 14 },
  totalValue: { color: C.c1, fontFamily: "Space Grotesk", fontSize: 24, fontWeight: "700" as const },

  /* ── Green CTA button ── */
  greenBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 8,
    backgroundColor: C.green,
    ...CARD_SHADOW,
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
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: "rgba(6,26,10,0.1)",
  },
  numCurrency: { color: C.c3, fontSize: 26, fontWeight: "900" as const },
  numField: {
    flex: 1,
    outlineStyle: "none" as unknown as never,
    borderWidth: 0,
    color: C.c1,
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
    backgroundColor: C.greenDim,
    borderWidth: 1,
    borderColor: C.greenBorder,
  },
  estimateLabel: { flex: 1, color: C.c2, fontWeight: "800" as const, fontSize: 13 },
  estimateValue: { color: C.green, fontFamily: "Space Grotesk", fontSize: 20, fontWeight: "700" as const },

  /* ── Segment toggle ── */
  seg: {
    flexDirection: "row" as const,
    gap: 4,
    borderRadius: 14,
    padding: 4,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: "rgba(6,26,10,0.08)",
  },
  segItem: {
    flex: 1, height: 40,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 6,
  },
  segItemActive: { backgroundColor: C.green },
  segLabel: { color: C.c2, fontWeight: "900" as const, fontSize: 13 },
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
    backgroundColor: C.cardAlt,
  },
  bar: { width: "100%", borderRadius: 999, backgroundColor: C.green },
  barLabel: { color: C.c3, fontWeight: "900" as const, fontSize: 11 },

  /* ── Insight card ── */
  insightCard: {
    flexDirection: "row" as const,
    gap: 12,
    alignItems: "center" as const,
    borderRadius: 18,
    padding: 14,
    backgroundColor: C.greenDim,
    borderWidth: 1,
    borderColor: C.greenBorder,
  },
  insightIcon: {
    width: 34, height: 34,
    borderRadius: 11,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(0,212,98,0.2)",
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
    backgroundColor: C.green,
  },
  tokenBadgeText: { color: C.ink, fontWeight: "900" as const, fontSize: 11 },
  tokenDate: { color: C.c3, fontWeight: "800" as const, fontSize: 12 },
  tokenCode: { marginTop: 14, color: C.c1, fontFamily: "Space Grotesk", fontSize: 22, fontWeight: "700" as const, letterSpacing: 0.4 },
  tokenFoot: { marginTop: 14, flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
  tokenMeta: { color: C.c3, fontWeight: "800" as const, fontSize: 12 },

  /* ── Ledger filters ── */
  filterRow: { flexDirection: "row" as const, gap: 8 },
  filterActive: {
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16,
    overflow: "hidden" as const,
    color: C.ink, backgroundColor: C.green,
    fontWeight: "900" as const, fontSize: 13,
  },
  filterItem: {
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16,
    overflow: "hidden" as const,
    color: C.t2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
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
    ...CARD_SHADOW,
  },
  txIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center" as const, justifyContent: "center" as const },
  txIn:   { backgroundColor: C.green },
  txOut:  { backgroundColor: C.amberBg, borderWidth: 1, borderColor: "rgba(255,159,0,0.2)" },
  txTitle:  { color: C.c1, fontWeight: "900" as const, fontSize: 14 },
  txSub:    { marginTop: 2, color: C.c3, fontWeight: "700" as const, fontSize: 12 },
  txAmount: { fontWeight: "900" as const, fontSize: 14 },
  txAmtIn:  { color: C.green },
  txAmtOut: { color: C.c1 },
  txDate:   { marginTop: 2, color: C.c3, fontWeight: "700" as const, fontSize: 12 },

  /* ── Profile / Control ── */
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.green, alignItems: "center" as const, justifyContent: "center" as const },
  profileName: { color: C.c1, fontWeight: "900" as const, fontSize: 14 },
  profileSub:  { marginTop: 3, color: C.c3, fontWeight: "700" as const, fontSize: 12 },
  ctrlRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    ...CARD_SHADOW,
  },
  ctrlTitle: { color: C.c1, fontWeight: "900" as const, fontSize: 14 },
  ctrlAmt:   { marginTop: 3, color: C.c3, fontWeight: "700" as const, fontSize: 12 },
  toggle: {
    flexDirection: "row" as const,
    borderRadius: 999,
    padding: 3,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: "rgba(6,26,10,0.1)",
  },
  toggleOpt:     { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  toggleOn:      { backgroundColor: C.green },
  toggleLabel:   { color: C.c3, fontWeight: "900" as const, fontSize: 11 },
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
    borderColor: "rgba(0,212,98,0.18)",
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
  tabActive: { backgroundColor: C.green },
  tabLabel: { color: C.t3, fontWeight: "900" as const, fontSize: 10, letterSpacing: 0.2 },
  tabLabelActive: { color: C.ink },
};

createRoot(document.getElementById("root")!).render(<App />);
