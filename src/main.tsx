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

/* ─── Brand Design Tokens ─────────────────────────────────────────────── */
const C = {
  /* backgrounds */
  bg: "#080d1a",
  /* glass surfaces */
  glass: "rgba(255,255,255,0.07)",
  glassMid: "rgba(255,255,255,0.11)",
  glassHigh: "rgba(255,255,255,0.16)",
  /* borders */
  border: "rgba(255,255,255,0.1)",
  borderBright: "rgba(255,255,255,0.18)",
  borderLime: "rgba(201,255,87,0.3)",
  borderRed: "rgba(255,107,88,0.3)",
  /* brand accent — lime is the ONLY primary accent */
  lime: "#c9ff57",
  /* supporting palette */
  mint: "#00d39b",
  aqua: "#47d7ff",
  blue: "#5868ff",
  violet: "#8b5cf6",
  amber: "#ffb23f",
  red: "#ff6b58",
  /* text */
  white: "#ffffff",
  t1: "#ffffff",
  t2: "rgba(255,255,255,0.6)",
  t3: "rgba(255,255,255,0.35)",
  /* ink — used only ON lime/coloured surfaces */
  ink: "#07111f",
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
  { date: "13 Jun", label: "Wallet top-up",      detail: "Manual EFT",   amount: 550, in: true  },
  { date: "12 Jun", label: "Electricity token",   detail: "60.40 units",  amount: 300, in: false },
  { date: "12 Jun", label: "Electricity token",   detail: "33.60 units",  amount: 167, in: false },
  { date: "01 Jun", label: "Hosting",             detail: "Tenant alloc", amount: 90,  in: false },
];

const methods: Array<{ name: PaymentMethod; fee: string; icon: React.ElementType }> = [
  { name: "Instant EFT", fee: "1.6% min R1.50",  icon: Smartphone  },
  { name: "Card",        fee: "2.95% + R1.25",   icon: CreditCard  },
  { name: "Manual EFT", fee: "R3.50 flat",       icon: Landmark    },
  { name: "Retail",     fee: "3.9% min R8.00",   icon: ReceiptText },
];

const nav: Array<{ screen: Screen; label: string; icon: React.ElementType }> = [
  { screen: "home",    label: "Home",    icon: Home     },
  { screen: "recharge",label: "Recharge",icon: Wallet   },
  { screen: "buy",     label: "Buy",     icon: Bolt     },
  { screen: "usage",   label: "Pulse",   icon: LineChart},
  { screen: "control", label: "Control", icon: Settings },
];

function money(v: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);
}

/* ─── App Shell ───────────────────────────────────────────────────────── */
function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [copied, setCopied] = useState(false);

  const title = { home: "Metering", recharge: "Recharge", buy: "Buy token",
                  usage: "Usage pulse", ledger: "Ledger", control: "Control" }[screen];

  function copyReference() {
    navigator.clipboard?.writeText("100477911");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <View style={S.app}>
      {/* Ambient glow orbs — blurs through glass cards */}
      <View style={S.orb1} />
      <View style={S.orb2} />
      <View style={S.orb3} />

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.eyebrow}>Unit 28-05</Text>
          <Text style={S.pageTitle}>{title}</Text>
        </View>
        <Pressable style={S.bellBtn}>
          <Bell size={18} color={C.white} />
          <View style={S.bellDot} />
        </Pressable>
      </View>

      {/* Toast notification */}
      {copied && (
        <View style={S.toast}>
          <Check size={14} color={C.ink} />
          <Text style={S.toastText}>Reference copied</Text>
        </View>
      )}

      {/* Screen content */}
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        {screen === "home"     && <HomeScreen    setScreen={setScreen} copyReference={copyReference} />}
        {screen === "recharge" && <RechargeScreen copyReference={copyReference} />}
        {screen === "buy"      && <BuyScreen />}
        {screen === "usage"    && <UsageScreen />}
        {screen === "ledger"   && <LedgerScreen />}
        {screen === "control"  && <ControlScreen />}
      </ScrollView>

      {/* Glass tab bar */}
      <View style={S.tabBar}>
        {nav.map((item) => {
          const active = item.screen === screen;
          return (
            <Pressable
              key={item.screen}
              style={[S.tabItem, active && S.tabItemActive]}
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
function HomeScreen({ setScreen, copyReference }: { setScreen: (s: Screen) => void; copyReference: () => void }) {
  return (
    <View style={S.stack}>
      {/* Hero balance card */}
      <View style={S.heroCard}>
        {/* Subtle lime glow orb inside the card */}
        <View style={S.heroGlow} />
        <View style={S.heroTop}>
          <View>
            <Text style={S.heroLabel}>Available balance</Text>
            <Text style={S.heroAmount}>{money(0.48)}</Text>
          </View>
          <View style={S.heroIconWrap}>
            <Wallet size={24} color={C.lime} />
          </View>
        </View>
        <Pressable style={S.refPill} onPress={copyReference}>
          <Text style={S.refLabel}>Wallet ref</Text>
          <Text style={S.refValue}>100477911</Text>
          <Clipboard size={13} color={C.t2} />
        </Pressable>
        <View style={S.heroStats}>
          <Metric label="Spent this month" value={money(547)} />
          <Metric label="Limit" value={money(10000)} alignRight />
        </View>
        <View style={S.progressTrack}>
          <View style={S.progressFill} />
        </View>
      </View>

      {/* Quick-action dock */}
      <View style={S.dock}>
        <ActionBtn label="Recharge" sub="Add funds"  icon={Wallet}    tint={C.lime}   onPress={() => setScreen("recharge")} />
        <ActionBtn label="Buy token" sub="Power"     icon={Bolt}      tint={C.aqua}   onPress={() => setScreen("buy")}      />
        <ActionBtn label="Pulse"    sub="Usage"      icon={LineChart}  tint={C.violet} onPress={() => setScreen("usage")}    />
      </View>

      {/* Alert */}
      <View style={S.alertCard}>
        <View style={S.alertIconWrap}>
          <Lock size={15} color={C.red} />
        </View>
        <View style={S.flex1}>
          <Text style={S.alertTitle}>Low balance lock</Text>
          <Text style={S.alertBody}>Recharge before buying your next prepaid token.</Text>
        </View>
      </View>

      {/* Latest tokens */}
      <SectionHeader title="Latest tokens" action="Ledger" onPress={() => setScreen("ledger")} />
      {tokens.map((t) => <TokenCard key={t.token} token={t} />)}
    </View>
  );
}

/* ─── Recharge ────────────────────────────────────────────────────────── */
function RechargeScreen({ copyReference }: { copyReference: () => void }) {
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
      <View style={S.glassCard}>
        <Text style={S.cardLabel}>Recharge value</Text>
        <Text style={S.bigAmount}>{money(amount)}</Text>
        <View style={S.chipRow}>
          {[100, 250, 500, 1000].map((v) => (
            <Pressable
              key={v}
              style={[S.chip, amount === v && S.chipActive]}
              onPress={() => setAmount(v)}
            >
              <Text style={[S.chipText, amount === v && S.chipTextActive]}>{money(v)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Payment method */}
      <SectionHeader title="Payment rail" />
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

      {/* Manual EFT bank details */}
      {method === "Manual EFT" && (
        <View style={S.glassCard}>
          <Text style={S.cardTitle}>Manual EFT details</Text>
          <BankRow label="Account" value="SmS" />
          <BankRow label="Bank"    value="FNB" />
          <BankRow label="Number"  value="62937164614" />
          <Pressable style={S.limeRow} onPress={copyReference}>
            <Text style={S.limeRowText}>Use reference 100477911</Text>
            <Clipboard size={15} color={C.ink} />
          </Pressable>
        </View>
      )}

      {/* Checkout summary */}
      <View style={S.checkoutCard}>
        <View style={S.checkoutRow}>
          <Metric label="Amount" value={money(amount)} />
          <Metric label="Fees" value={money(fee)} alignRight />
        </View>
        <View style={S.checkoutDivider} />
        <View style={S.checkoutTotalRow}>
          <Text style={S.checkoutTotalLabel}>Total to pay</Text>
          <Text style={S.checkoutTotalValue}>{money(amount + fee)}</Text>
        </View>
        <PrimaryBtn label="Continue recharge" icon={ArrowUpRight} />
      </View>
    </View>
  );
}

/* ─── Buy ─────────────────────────────────────────────────────────────── */
function BuyScreen() {
  const [utility, setUtility] = useState<Utility>("Electricity");
  const [amount, setAmount] = useState("100");
  const num = Number(amount || 0);
  const units = utility === "Electricity" ? num / 4.97 : num / 22.4;

  return (
    <View style={S.stack}>
      <View style={S.glassCard}>
        <Segment
          options={["Electricity", "Water"] as Utility[]}
          active={utility}
          onChange={(v) => setUtility(v as Utility)}
          icons={{ Electricity: Bolt, Water: Droplets }}
        />
        <Text style={[S.cardLabel, { marginTop: 18 }]}>Token amount</Text>
        <View style={S.amountInput}>
          <Text style={S.amountCurrency}>R</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={S.amountField}
          />
        </View>
        <View style={S.estimateRow}>
          <Gauge size={16} color={C.lime} />
          <Text style={S.estimateLabel}>Estimated units</Text>
          <Text style={S.estimateValue}>{units.toFixed(2)}</Text>
        </View>
      </View>

      <View style={S.alertCard}>
        <View style={S.alertIconWrap}>
          <Lock size={15} color={C.red} />
        </View>
        <View style={S.flex1}>
          <Text style={S.alertTitle}>Wallet balance is too low</Text>
          <Text style={S.alertBody}>Available: {money(0.48)}. Recharge to unlock.</Text>
        </View>
      </View>

      <PrimaryBtn label="Recharge first" icon={Wallet} />
    </View>
  );
}

/* ─── Usage ───────────────────────────────────────────────────────────── */
function UsageScreen() {
  const [utility, setUtility] = useState<Utility>("Water");
  const maxVal = Math.max(...usage.map((u) => utility === "Water" ? u.water : u.electricity));

  return (
    <View style={S.stack}>
      <View style={S.glassCard}>
        <Segment
          options={["Water", "Electricity"] as Utility[]}
          active={utility}
          onChange={(v) => setUtility(v as Utility)}
          icons={{ Water: Droplets, Electricity: Bolt }}
        />
        <View style={S.usageMetrics}>
          <Metric label="This week" value={utility === "Water" ? "354 L" : "446 kWh"} />
          <Metric label="Daily avg" value={utility === "Water" ? "51 L" : "64 kWh"} alignRight />
        </View>
        {/* Bar chart */}
        <View style={S.chart}>
          {usage.map((item, i) => {
            const val = utility === "Water" ? item.water : item.electricity;
            const pct = val / maxVal;
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

      {/* Insight card */}
      <View style={S.insightCard}>
        <View style={S.insightIcon}>
          <Sparkles size={16} color={C.lime} />
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
          <View style={[S.txIcon, item.in ? S.txIconIn : S.txIconOut]}>
            {item.in
              ? <ArrowDownLeft size={16} color={C.ink} />
              : <ArrowUpRight  size={16} color={C.ink} />}
          </View>
          <View style={S.flex1}>
            <Text style={S.txTitle}>{item.label}</Text>
            <Text style={S.txSub}>{item.detail}</Text>
          </View>
          <View style={S.txRight}>
            <Text style={[S.txAmount, item.in ? S.txAmountIn : S.txAmountOut]}>
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
      {/* Profile card */}
      <View style={S.profileCard}>
        <View style={S.profileAvatar}>
          <ShieldCheck size={22} color={C.ink} />
        </View>
        <View style={S.flex1}>
          <Text style={S.profileName}>cube.musa@gmail.com</Text>
          <Text style={S.profileSub}>Unit 28-05 · Wallet 100477911</Text>
        </View>
      </View>

      <SectionHeader title="Cost responsibility" />
      <ControlRow title="Hosting"           amount={90}     owner={ownerHosting} onChange={setOwnerHosting} />
      <ControlRow title="Sewerage"          amount={697.73} owner={true}         onChange={() => null}       />
      <ControlRow title="Water Demand Levy" amount={65.08}  owner={true}         onChange={() => null}       />
      <PrimaryBtn label="Save allocation" icon={Check} />
    </View>
  );
}

/* ─── Reusable components ─────────────────────────────────────────────── */
function ActionBtn({ label, sub, icon: Icon, tint, onPress }:
  { label: string; sub: string; icon: React.ElementType; tint: string; onPress: () => void }) {
  return (
    <Pressable style={S.actionBtn} onPress={onPress}>
      <View style={[S.actionIcon, { backgroundColor: `${tint}22` }]}>
        <Icon size={20} color={tint} />
      </View>
      <Text style={S.actionSub}>{label}</Text>
      <Text style={S.actionLabel}>{sub}</Text>
    </Pressable>
  );
}

function Segment({ options, active, onChange, icons }:
  { options: string[]; active: string; onChange: (v: string) => void; icons: Record<string, React.ElementType> }) {
  return (
    <View style={S.segment}>
      {options.map((opt) => {
        const isActive = opt === active;
        const Icon = icons[opt];
        return (
          <Pressable key={opt} style={[S.segItem, isActive && S.segItemActive]} onPress={() => onChange(opt)}>
            {Icon && <Icon size={15} color={isActive ? C.ink : C.t2} />}
            <Text style={[S.segLabel, isActive && S.segLabelActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Metric({ label, value, alignRight }: { label: string; value: string; alignRight?: boolean }) {
  return (
    <View style={alignRight ? S.alignRight : undefined}>
      <Text style={S.metricLabel}>{label}</Text>
      <Text style={S.metricValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={S.sectionHeader}>
      <Text style={S.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onPress}>
          <Text style={S.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function TokenCard({ token }: { token: (typeof tokens)[number] }) {
  return (
    <View style={S.tokenCard}>
      <View style={S.tokenHeader}>
        <View style={S.tokenBadge}>
          <Bolt size={11} color={C.ink} />
          <Text style={S.tokenBadgeText}>{token.utility}</Text>
        </View>
        <Text style={S.tokenDate}>{token.date}</Text>
      </View>
      <Text style={S.tokenCode}>{token.token}</Text>
      <View style={S.tokenFooter}>
        <Text style={S.tokenMeta}>{money(token.amount)}</Text>
        <Text style={S.tokenMeta}>{token.units.toFixed(2)} units</Text>
        <Clipboard size={14} color={C.t3} />
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

function ControlRow({ title, amount, owner, onChange }:
  { title: string; amount: number; owner: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={S.ctrlRow}>
      <View style={S.flex1}>
        <Text style={S.ctrlTitle}>{title}</Text>
        <Text style={S.ctrlAmount}>{money(amount)}</Text>
      </View>
      <View style={S.toggle}>
        <Pressable style={[S.toggleOpt, owner && S.toggleActive]} onPress={() => onChange(true)}>
          <Text style={[S.toggleText, owner && S.toggleTextActive]}>Owner</Text>
        </Pressable>
        <Pressable style={[S.toggleOpt, !owner && S.toggleActive]} onPress={() => onChange(false)}>
          <Text style={[S.toggleText, !owner && S.toggleTextActive]}>Tenant</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PrimaryBtn({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <Pressable style={S.primaryBtn}>
      <Text style={S.primaryBtnText}>{label}</Text>
      <Icon size={17} color={C.ink} />
    </Pressable>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────── */
const GLASS = {
  backgroundColor: C.glass,
  borderWidth: 1,
  borderColor: C.border,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
} as const;

const S = {
  /* ── Shell ── */
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
    backgroundColor: "rgba(88,104,255,0.15)",
  },
  orb2: {
    position: "absolute" as const,
    top: -80, right: -130,
    width: 300, height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(0,211,155,0.1)",
  },
  orb3: {
    position: "absolute" as const,
    bottom: 80, left: -80,
    width: 250, height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  /* ── Header ── */
  header: {
    paddingTop: 54,
    paddingHorizontal: 22,
    paddingBottom: 14,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    zIndex: 2,
  },
  eyebrow: {
    color: C.t3,
    fontFamily: "Manrope",
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
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...GLASS,
  },
  bellDot: {
    position: "absolute" as const,
    top: 10, right: 10,
    width: 7, height: 7,
    borderRadius: 999,
    backgroundColor: C.red,
  },

  /* ── Toast ── */
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
    backdropFilter: "blur(12px)",
  },
  toastText: {
    color: C.ink,
    fontWeight: "900" as const,
    fontSize: 13,
  },

  /* ── Scroll ── */
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 110,
    gap: 12,
  },
  stack: { gap: 12 },
  flex1: { flex: 1 },
  alignRight: { alignItems: "flex-end" as const },

  /* ── Hero card ── */
  heroCard: {
    borderRadius: 28,
    padding: 22,
    overflow: "hidden" as const,
    position: "relative" as const,
    backgroundColor: "rgba(10,20,44,0.85)",
    borderWidth: 1,
    borderColor: C.borderLime,
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    minHeight: 210,
  },
  heroGlow: {
    position: "absolute" as const,
    bottom: -60, right: -60,
    width: 200, height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(201,255,87,0.08)",
  },
  heroTop: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  heroLabel: {
    color: C.t3,
    fontWeight: "800" as const,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  heroAmount: {
    marginTop: 6,
    color: C.lime,
    fontFamily: "Space Grotesk",
    fontSize: 50,
    fontWeight: "700" as const,
    letterSpacing: -1,
  },
  heroIconWrap: {
    width: 48, height: 48,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(201,255,87,0.12)",
    borderWidth: 1,
    borderColor: C.borderLime,
  },
  refPill: {
    marginTop: 20,
    alignSelf: "flex-start" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    ...GLASS,
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
    marginTop: 22,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  progressTrack: {
    marginTop: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden" as const,
  },
  progressFill: {
    width: "6%",
    height: 4,
    borderRadius: 999,
    backgroundColor: C.lime,
  },

  /* ── Metrics ── */
  metricLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.7,
  },
  metricValue: {
    marginTop: 4,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 18,
    fontWeight: "700" as const,
  },

  /* ── Quick-action dock ── */
  dock: {
    flexDirection: "row" as const,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 24,
    padding: 14,
    minHeight: 126,
    ...GLASS,
  },
  actionIcon: {
    width: 40, height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  actionSub: {
    marginTop: 16,
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

  /* ── Alert / lock ── */
  alertCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 20,
    padding: 14,
    backgroundColor: "rgba(255,107,88,0.1)",
    borderWidth: 1,
    borderColor: C.borderRed,
    backdropFilter: "blur(20px)",
  },
  alertIconWrap: {
    width: 36, height: 36,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,107,88,0.2)",
  },
  alertTitle: {
    color: C.t1,
    fontWeight: "900" as const,
    fontSize: 14,
  },
  alertBody: {
    marginTop: 2,
    color: "rgba(255,170,150,0.85)",
    fontWeight: "700" as const,
    fontSize: 12,
  },

  /* ── Section header ── */
  sectionHeader: {
    marginTop: 4,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  sectionTitle: {
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 20,
    fontWeight: "700" as const,
  },
  sectionAction: {
    color: C.lime,
    fontWeight: "900" as const,
    fontSize: 14,
  },

  /* ── Token card ── */
  tokenCard: {
    borderRadius: 24,
    padding: 18,
    ...GLASS,
  },
  tokenHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  tokenBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: C.lime,
  },
  tokenBadgeText: {
    color: C.ink,
    fontWeight: "900" as const,
    fontSize: 11,
  },
  tokenDate: {
    color: C.t3,
    fontWeight: "800" as const,
    fontSize: 12,
  },
  tokenCode: {
    marginTop: 14,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  tokenFooter: {
    marginTop: 14,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  tokenMeta: {
    color: C.t3,
    fontWeight: "800" as const,
    fontSize: 12,
  },

  /* ── Glass card (generic) ── */
  glassCard: {
    borderRadius: 24,
    padding: 20,
    ...GLASS,
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
    marginBottom: 4,
  },
  bigAmount: {
    marginTop: 6,
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 44,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },

  /* ── Chips ── */
  chipRow: {
    marginTop: 18,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.lime,
    borderColor: C.lime,
  },
  chipText: {
    color: C.t2,
    fontWeight: "900" as const,
    fontSize: 13,
  },
  chipTextActive: {
    color: C.ink,
  },

  /* ── Payment method row ── */
  methodRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    borderRadius: 20,
    padding: 14,
    minHeight: 68,
    ...GLASS,
  },
  methodRowActive: {
    borderColor: C.borderLime,
    backgroundColor: "rgba(201,255,87,0.08)",
  },
  methodIcon: {
    width: 40, height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: C.glassMid,
  },
  methodIconActive: {
    backgroundColor: C.lime,
  },
  methodName: {
    color: C.t1,
    fontWeight: "900" as const,
    fontSize: 14,
  },
  methodFee: {
    marginTop: 2,
    color: C.t3,
    fontWeight: "700" as const,
    fontSize: 12,
  },

  /* ── Bank details ── */
  bankRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 4,
  },
  bankLabel: { color: C.t3, fontWeight: "800" as const, fontSize: 13 },
  bankValue: { color: C.t1, fontWeight: "900" as const, fontSize: 13 },
  limeRow: {
    marginTop: 8,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    backgroundColor: C.lime,
  },
  limeRowText: { color: C.ink, fontWeight: "900" as const, fontSize: 13 },

  /* ── Checkout ── */
  checkoutCard: {
    borderRadius: 24,
    padding: 18,
    ...GLASS,
    gap: 0,
  },
  checkoutRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 14,
  },
  checkoutDivider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 14,
  },
  checkoutTotalRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  checkoutTotalLabel: { color: C.t2, fontWeight: "900" as const, fontSize: 14 },
  checkoutTotalValue: {
    color: C.t1,
    fontFamily: "Space Grotesk",
    fontSize: 24,
    fontWeight: "700" as const,
  },

  /* ── Primary button ── */
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 8,
    backgroundColor: C.lime,
  },
  primaryBtnText: {
    color: C.ink,
    fontWeight: "900" as const,
    fontSize: 15,
  },

  /* ── Amount input ── */
  amountInput: {
    marginTop: 8,
    height: 78,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: C.glassMid,
    borderWidth: 1,
    borderColor: C.borderBright,
  },
  amountCurrency: {
    color: C.t3,
    fontSize: 26,
    fontWeight: "900" as const,
  },
  amountField: {
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
    borderRadius: 14,
    padding: 14,
    marginTop: 0,
    backgroundColor: "rgba(201,255,87,0.08)",
    borderWidth: 1,
    borderColor: C.borderLime,
  },
  estimateLabel: { flex: 1, color: C.t2, fontWeight: "800" as const, fontSize: 13 },
  estimateValue: {
    color: C.lime,
    fontFamily: "Space Grotesk",
    fontSize: 20,
    fontWeight: "700" as const,
  },

  /* ── Segment toggle ── */
  segment: {
    flexDirection: "row" as const,
    gap: 4,
    borderRadius: 16,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: C.border,
  },
  segItem: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 6,
  },
  segItemActive: {
    backgroundColor: C.lime,
  },
  segLabel: { color: C.t2, fontWeight: "900" as const, fontSize: 13 },
  segLabelActive: { color: C.ink },

  /* ── Usage chart ── */
  usageMetrics: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginTop: 18,
    marginBottom: 8,
  },
  chart: {
    height: 160,
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    justifyContent: "space-between" as const,
    marginTop: 8,
  },
  chartCol: {
    flex: 1,
    height: "100%",
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
    gap: 8,
  },
  barTrack: {
    flex: 1,
    width: 20,
    justifyContent: "flex-end" as const,
    borderRadius: 999,
    overflow: "hidden" as const,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bar: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: C.mint,
  },
  barLabel: { color: C.t3, fontWeight: "900" as const, fontSize: 11 },

  /* ── Insight card ── */
  insightCard: {
    flexDirection: "row" as const,
    gap: 12,
    alignItems: "center" as const,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(201,255,87,0.07)",
    borderWidth: 1,
    borderColor: C.borderLime,
    backdropFilter: "blur(20px)",
  },
  insightIcon: {
    width: 36, height: 36,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(201,255,87,0.15)",
  },
  insightTitle: { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  insightBody: { marginTop: 2, color: C.t2, fontWeight: "700" as const, fontSize: 12 },

  /* ── Ledger ── */
  filterRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  filterActive: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    overflow: "hidden" as const,
    color: C.ink,
    backgroundColor: C.lime,
    fontWeight: "900" as const,
    fontSize: 13,
  },
  filterItem: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    overflow: "hidden" as const,
    color: C.t2,
    fontWeight: "900" as const,
    fontSize: 13,
    ...GLASS,
  },
  txRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 20,
    padding: 14,
    ...GLASS,
  },
  txIcon: {
    width: 40, height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  txIconIn:  { backgroundColor: C.lime },
  txIconOut: { backgroundColor: C.amber },
  txTitle: { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  txSub: { marginTop: 2, color: C.t3, fontWeight: "700" as const, fontSize: 12 },
  txRight: { alignItems: "flex-end" as const },
  txAmount: { fontWeight: "900" as const, fontSize: 14 },
  txAmountIn:  { color: C.lime },
  txAmountOut: { color: C.t1 },
  txDate: { marginTop: 2, color: C.t3, fontWeight: "700" as const, fontSize: 12 },

  /* ── Control / profile ── */
  profileCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    borderRadius: 24,
    padding: 18,
    ...GLASS,
  },
  profileAvatar: {
    width: 50, height: 50,
    borderRadius: 18,
    backgroundColor: C.lime,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  profileName: { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  profileSub: { marginTop: 3, color: C.t3, fontWeight: "700" as const, fontSize: 12 },
  ctrlRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 20,
    padding: 14,
    ...GLASS,
  },
  ctrlTitle: { color: C.t1, fontWeight: "900" as const, fontSize: 14 },
  ctrlAmount: { marginTop: 3, color: C.t3, fontWeight: "700" as const, fontSize: 12 },
  toggle: {
    flexDirection: "row" as const,
    borderRadius: 999,
    padding: 3,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: C.border,
  },
  toggleOpt: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  toggleActive: { backgroundColor: C.lime },
  toggleText: { color: C.t3, fontWeight: "900" as const, fontSize: 11 },
  toggleTextActive: { color: C.ink },

  /* ── Tab bar ── */
  tabBar: {
    position: "absolute" as const,
    bottom: 14,
    left: 14,
    right: 14,
    height: 70,
    borderRadius: 26,
    flexDirection: "row" as const,
    padding: 6,
    backgroundColor: "rgba(8,13,26,0.88)",
    borderWidth: 1,
    borderColor: C.borderBright,
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    zIndex: 20,
  },
  tabItem: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: C.lime,
  },
  tabLabel: {
    color: C.t3,
    fontWeight: "900" as const,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: C.ink,
  },
};

createRoot(document.getElementById("root")!).render(<App />);
