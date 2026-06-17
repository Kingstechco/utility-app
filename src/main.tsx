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

const palette = {
  ink: "#07111f",
  paper: "#f7f8f3",
  mist: "#e8efe9",
  lime: "#c9ff57",
  mint: "#00d39b",
  aqua: "#47d7ff",
  blue: "#5868ff",
  violet: "#8b5cf6",
  amber: "#ffb23f",
  red: "#ff6b58",
  white: "#ffffff",
  muted: "#7c8797",
  line: "rgba(7, 17, 31, 0.1)",
};

const tokens = [
  { date: "12 Jun", amount: 300, token: "0736 4844 3944 8209 4274", units: 60.4, utility: "Electricity" as Utility },
  { date: "12 Jun", amount: 167, token: "0841 0205 5352 3480 5042", units: 33.6, utility: "Electricity" as Utility },
  { date: "11 Jun", amount: 80, token: "7002 3413 1105 8044 4504", units: 16.1, utility: "Electricity" as Utility },
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
  { date: "13 Jun", label: "Wallet top-up", detail: "Manual EFT", amount: 550, in: true },
  { date: "12 Jun", label: "Electricity token", detail: "60.40 units", amount: 300, in: false },
  { date: "12 Jun", label: "Electricity token", detail: "33.60 units", amount: 167, in: false },
  { date: "01 Jun", label: "Hosting", detail: "Tenant allocation", amount: 90, in: false },
];

const methods: Array<{ name: PaymentMethod; fee: string; icon: React.ElementType }> = [
  { name: "Instant EFT", fee: "1.6% min R1.50", icon: Smartphone },
  { name: "Card", fee: "2.95% + R1.25", icon: CreditCard },
  { name: "Manual EFT", fee: "R3.50", icon: Landmark },
  { name: "Retail", fee: "3.9% min R8.00", icon: ReceiptText },
];

const nav: Array<{ screen: Screen; label: string; icon: React.ElementType }> = [
  { screen: "home", label: "Home", icon: Home },
  { screen: "recharge", label: "Recharge", icon: Wallet },
  { screen: "buy", label: "Buy", icon: Bolt },
  { screen: "usage", label: "Pulse", icon: LineChart },
  { screen: "control", label: "Control", icon: Settings },
];

function money(value: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value);
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [copied, setCopied] = useState(false);

  const title = {
    home: "Metering",
    recharge: "Recharge",
    buy: "Buy token",
    usage: "Usage pulse",
    ledger: "Ledger",
    control: "Control",
  }[screen];

  function copyReference() {
    navigator.clipboard?.writeText("100477911");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <View style={styles.viewport}>
      <View style={styles.phone}>
        <View style={styles.statusGlow} />
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Unit 28-05</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <Pressable style={styles.notification}>
            <Bell size={19} color={palette.white} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {copied && (
          <View style={styles.toast}>
            <Check size={15} color={palette.ink} />
            <Text style={styles.toastText}>Reference copied</Text>
          </View>
        )}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {screen === "home" && <HomeScreen setScreen={setScreen} copyReference={copyReference} />}
          {screen === "recharge" && <RechargeScreen copyReference={copyReference} />}
          {screen === "buy" && <BuyScreen />}
          {screen === "usage" && <UsageScreen />}
          {screen === "ledger" && <LedgerScreen />}
          {screen === "control" && <ControlScreen />}
        </ScrollView>

        <View style={styles.tabBar}>
          {nav.map((item) => {
            const active = item.screen === screen;
            return (
              <Pressable key={item.screen} style={[styles.tabItem, active && styles.tabItemActive]} onPress={() => setScreen(item.screen)}>
                <item.icon size={19} color={active ? palette.ink : "rgba(255,255,255,0.62)"} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function HomeScreen({ setScreen, copyReference }: { setScreen: (screen: Screen) => void; copyReference: () => void }) {
  return (
    <View style={styles.stack}>
      <View style={styles.heroCard}>
        <View style={styles.heroGrid} />
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Available balance</Text>
            <Text style={styles.heroAmount}>{money(0.48)}</Text>
          </View>
          <View style={styles.heroIcon}>
            <Wallet size={27} color={palette.ink} />
          </View>
        </View>
        <Pressable style={styles.referencePill} onPress={copyReference}>
          <Text style={styles.referenceLabel}>Wallet ref</Text>
          <Text style={styles.referenceValue}>100477911</Text>
          <Clipboard size={15} color={palette.white} />
        </Pressable>
        <View style={styles.heroStats}>
          <Metric label="Spent this month" value={money(547)} />
          <Metric label="Limit" value={money(10000)} alignRight />
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <View style={styles.actionDock}>
        <ActionButton label="Recharge" detail="Add funds" icon={Wallet} tone={palette.lime} onPress={() => setScreen("recharge")} />
        <ActionButton label="Buy token" detail="Power" icon={Bolt} tone={palette.aqua} onPress={() => setScreen("buy")} />
        <ActionButton label="Pulse" detail="Usage" icon={LineChart} tone={palette.violet} onPress={() => setScreen("usage")} />
      </View>

      <View style={styles.alertCard}>
        <View style={styles.alertIcon}>
          <Lock size={16} color={palette.red} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.alertTitle}>Low balance lock</Text>
          <Text style={styles.alertText}>Recharge before buying your next prepaid token.</Text>
        </View>
      </View>

      <SectionTitle title="Latest tokens" action="Ledger" onPress={() => setScreen("ledger")} />
      {tokens.map((token) => (
        <TokenTicket key={token.token} token={token} />
      ))}
    </View>
  );
}

function RechargeScreen({ copyReference }: { copyReference: () => void }) {
  const [amount, setAmount] = useState(250);
  const [method, setMethod] = useState<PaymentMethod>("Instant EFT");
  const fee = useMemo(() => {
    if (method === "Instant EFT") return Math.max(1.5, amount * 0.016);
    if (method === "Card") return amount * 0.0295 + 1.25;
    if (method === "Retail") return Math.max(8, amount * 0.039);
    return 3.5;
  }, [amount, method]);

  return (
    <View style={styles.stack}>
      <View style={styles.amountHero}>
        <Text style={styles.panelLabel}>Recharge value</Text>
        <Text style={styles.amountText}>{money(amount)}</Text>
        <View style={styles.chipGrid}>
          {[100, 250, 500, 1000].map((value) => (
            <Pressable key={value} style={[styles.amountChip, amount === value && styles.amountChipActive]} onPress={() => setAmount(value)}>
              <Text style={[styles.amountChipText, amount === value && styles.amountChipTextActive]}>{money(value)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SectionTitle title="Payment rail" />
      <View style={styles.methodStack}>
        {methods.map((item) => {
          const selected = method === item.name;
          return (
            <Pressable key={item.name} style={[styles.methodCard, selected && styles.methodCardActive]} onPress={() => setMethod(item.name)}>
              <View style={[styles.methodIcon, selected && styles.methodIconActive]}>
                <item.icon size={18} color={selected ? palette.ink : palette.white} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.methodName}>{item.name}</Text>
                <Text style={styles.methodFee}>{item.fee}</Text>
              </View>
              {selected && <Check size={18} color={palette.lime} />}
            </Pressable>
          );
        })}
      </View>

      {method === "Manual EFT" && (
        <View style={styles.bankCard}>
          <Text style={styles.bankTitle}>Manual EFT details</Text>
          <BankRow label="Account" value="SmS" />
          <BankRow label="Bank" value="FNB" />
          <BankRow label="Number" value="62937164614" />
          <Pressable style={styles.copyRail} onPress={copyReference}>
            <Text style={styles.copyRailText}>Use reference 100477911</Text>
            <Clipboard size={16} color={palette.ink} />
          </Pressable>
        </View>
      )}

      <View style={styles.checkoutCard}>
        <Metric label="Amount" value={money(amount)} />
        <Metric label="Fees" value={money(fee)} alignRight />
        <View style={styles.totalRail}>
          <Text style={styles.totalLabel}>Total to pay</Text>
          <Text style={styles.totalValue}>{money(amount + fee)}</Text>
        </View>
        <PrimaryButton label="Continue recharge" icon={ArrowUpRight} />
      </View>
    </View>
  );
}

function BuyScreen() {
  const [utility, setUtility] = useState<Utility>("Electricity");
  const [amount, setAmount] = useState("100");
  const numericAmount = Number(amount || 0);
  const units = utility === "Electricity" ? numericAmount / 4.97 : numericAmount / 22.4;

  return (
    <View style={styles.stack}>
      <View style={styles.buyPanel}>
        <View style={styles.segment}>
          {(["Electricity", "Water"] as Utility[]).map((item) => {
            const active = utility === item;
            return (
              <Pressable key={item} style={[styles.segmentItem, active && styles.segmentItemActive]} onPress={() => setUtility(item)}>
                {item === "Electricity" ? <Bolt size={17} color={active ? palette.ink : palette.white} /> : <Droplets size={17} color={active ? palette.ink : palette.white} />}
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.panelLabel}>Token amount</Text>
        <View style={styles.inputRail}>
          <Text style={styles.currency}>R</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.amountInput} />
        </View>
        <View style={styles.estimateCard}>
          <Gauge size={18} color={palette.lime} />
          <Text style={styles.estimateText}>Estimated units</Text>
          <Text style={styles.estimateValue}>{units.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.lockCard}>
        <Lock size={18} color={palette.red} />
        <View style={styles.flex}>
          <Text style={styles.lockTitle}>Wallet balance is too low</Text>
          <Text style={styles.lockText}>Available: {money(0.48)}. Recharge to unlock token purchase.</Text>
        </View>
      </View>

      <PrimaryButton label="Recharge first" icon={Wallet} />
    </View>
  );
}

function UsageScreen() {
  const [utility, setUtility] = useState<Utility>("Water");
  return (
    <View style={styles.stack}>
      <View style={styles.usageHero}>
        <View style={styles.segment}>
          {(["Water", "Electricity"] as Utility[]).map((item) => {
            const active = utility === item;
            return (
              <Pressable key={item} style={[styles.segmentItem, active && styles.segmentItemActive]} onPress={() => setUtility(item)}>
                {item === "Water" ? <Droplets size={17} color={active ? palette.ink : palette.white} /> : <Bolt size={17} color={active ? palette.ink : palette.white} />}
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.usageMetricRow}>
          <Metric label="This week" value={utility === "Water" ? "354 L" : "446 kWh"} />
          <Metric label="Daily avg" value={utility === "Water" ? "51 L" : "64 kWh"} alignRight />
        </View>
        <View style={styles.chart}>
          {usage.map((item, index) => {
            const value = utility === "Water" ? item.water : item.electricity;
            return (
              <View key={`${item.day}-${index}`} style={styles.barColumn}>
                <View style={[styles.bar, { height: value }]} />
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.insightCard}>
        <Sparkles size={18} color={palette.lime} />
        <View style={styles.flex}>
          <Text style={styles.insightTitle}>Usage looks stable</Text>
          <Text style={styles.insightText}>No unusual spikes detected for Unit 28-05 this week.</Text>
        </View>
      </View>
    </View>
  );
}

function LedgerScreen() {
  return (
    <View style={styles.stack}>
      <View style={styles.filterRail}>
        <Text style={styles.filterActive}>June</Text>
        <Text style={styles.filterText}>Electricity</Text>
        <Text style={styles.filterText}>All rails</Text>
      </View>
      {transactions.map((item) => (
        <View key={`${item.label}-${item.date}-${item.amount}`} style={styles.transaction}>
          <View style={[styles.txIcon, item.in ? styles.txIconIn : styles.txIconOut]}>
            {item.in ? <ArrowDownLeft size={17} color={palette.ink} /> : <ArrowUpRight size={17} color={palette.ink} />}
          </View>
          <View style={styles.flex}>
            <Text style={styles.txTitle}>{item.label}</Text>
            <Text style={styles.txDetail}>{item.detail}</Text>
          </View>
          <View style={styles.txAmountBlock}>
            <Text style={styles.txAmount}>{item.in ? "+" : "-"}{money(item.amount)}</Text>
            <Text style={styles.txDate}>{item.date}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ControlScreen() {
  const [ownerHosting, setOwnerHosting] = useState(false);
  return (
    <View style={styles.stack}>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <ShieldCheck size={24} color={palette.ink} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.profileTitle}>cube.musa@gmail.com</Text>
          <Text style={styles.profileText}>Unit 28-05 · Wallet 100477911</Text>
        </View>
      </View>
      <SectionTitle title="Cost responsibility" />
      <ControlRow title="Hosting" amount={90} owner={ownerHosting} onChange={setOwnerHosting} />
      <ControlRow title="Sewerage" amount={697.73} owner onChange={() => null} />
      <ControlRow title="Water Demand Levy" amount={65.08} owner onChange={() => null} />
      <PrimaryButton label="Save allocation" icon={Check} />
    </View>
  );
}

function ActionButton({ label, detail, icon: Icon, tone, onPress }: { label: string; detail: string; icon: React.ElementType; tone: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: tone }]}>
        <Icon size={18} color={palette.ink} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionDetail}>{detail}</Text>
    </Pressable>
  );
}

function TokenTicket({ token }: { token: (typeof tokens)[number] }) {
  return (
    <View style={styles.ticket}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketType}>{token.utility}</Text>
        <Text style={styles.ticketDate}>{token.date}</Text>
      </View>
      <Text style={styles.ticketCode}>{token.token}</Text>
      <View style={styles.ticketFooter}>
        <Text style={styles.ticketMeta}>{money(token.amount)}</Text>
        <Text style={styles.ticketMeta}>{token.units.toFixed(2)} units</Text>
        <Clipboard size={15} color={palette.muted} />
      </View>
    </View>
  );
}

function Metric({ label, value, alignRight }: { label: string; value: string; alignRight?: boolean }) {
  return (
    <View style={alignRight && styles.alignRight}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionText}>{title}</Text>
      {action && (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankLabel}>{label}</Text>
      <Text style={styles.bankValue}>{value}</Text>
    </View>
  );
}

function ControlRow({ title, amount, owner, onChange }: { title: string; amount: number; owner: boolean; onChange: (owner: boolean) => void }) {
  return (
    <View style={styles.controlRow}>
      <View style={styles.flex}>
        <Text style={styles.controlTitle}>{title}</Text>
        <Text style={styles.controlAmount}>{money(amount)}</Text>
      </View>
      <View style={styles.switcher}>
        <Pressable style={[styles.switchOption, owner && styles.switchActive]} onPress={() => onChange(true)}>
          <Text style={[styles.switchText, owner && styles.switchActiveText]}>Owner</Text>
        </Pressable>
        <Pressable style={[styles.switchOption, !owner && styles.switchActive]} onPress={() => onChange(false)}>
          <Text style={[styles.switchText, !owner && styles.switchActiveText]}>Tenant</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PrimaryButton({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <Pressable style={styles.primaryButton}>
      <Text style={styles.primaryText}>{label}</Text>
      <Icon size={18} color={palette.ink} />
    </Pressable>
  );
}

const styles = {
  viewport: {
    height: "100vh",
    backgroundColor: palette.ink,
    alignItems: "center",
  },
  phone: {
    width: "100%",
    maxWidth: 430,
    height: "100vh",
    backgroundColor: palette.ink,
    overflow: "hidden",
    position: "relative",
  },
  statusGlow: {
    position: "absolute",
    top: -160,
    left: -90,
    width: 330,
    height: 330,
    borderRadius: 999,
    backgroundColor: "rgba(0, 211, 155, 0.28)",
  },
  header: {
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontFamily: "Manrope",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 3,
    color: palette.white,
    fontFamily: "Space Grotesk",
    fontWeight: "700",
    fontSize: 31,
    letterSpacing: 0,
  },
  notification: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    right: 12,
    top: 11,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.red,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 110,
    gap: 14,
  },
  stack: {
    gap: 14,
  },
  flex: {
    flex: 1,
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 34,
    padding: 22,
    backgroundColor: palette.lime,
    minHeight: 256,
  },
  heroGrid: {
    position: "absolute",
    right: -56,
    bottom: -70,
    width: 210,
    height: 210,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: "rgba(7,17,31,0.16)",
    transform: [{ rotate: "-16deg" }],
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    color: "rgba(7,17,31,0.62)",
    fontWeight: "800",
    fontSize: 12,
  },
  heroAmount: {
    marginTop: 4,
    color: palette.ink,
    fontFamily: "Space Grotesk",
    fontSize: 52,
    fontWeight: "700",
    letterSpacing: 0,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.58)",
    alignItems: "center",
    justifyContent: "center",
  },
  referencePill: {
    marginTop: 22,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: palette.ink,
  },
  referenceLabel: {
    color: "rgba(255,255,255,0.58)",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  referenceValue: {
    color: palette.white,
    fontFamily: "Space Grotesk",
    fontWeight: "700",
    fontSize: 16,
  },
  heroStats: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  alignRight: {
    alignItems: "flex-end",
  },
  metricLabel: {
    color: "rgba(7,17,31,0.54)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  metricValue: {
    marginTop: 4,
    color: palette.ink,
    fontFamily: "Space Grotesk",
    fontSize: 19,
    fontWeight: "700",
  },
  progressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(7,17,31,0.16)",
  },
  progressFill: {
    width: "6%",
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.ink,
  },
  actionDock: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 132,
    borderRadius: 28,
    padding: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    marginTop: 18,
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  actionDetail: {
    marginTop: 2,
    color: palette.white,
    fontFamily: "Space Grotesk",
    fontSize: 17,
    fontWeight: "700",
  },
  alertCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderRadius: 26,
    padding: 15,
    backgroundColor: "#fff0ec",
  },
  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffe0d9",
  },
  alertTitle: {
    color: palette.ink,
    fontWeight: "900",
    fontSize: 15,
  },
  alertText: {
    marginTop: 2,
    color: "#7f4a42",
    fontWeight: "700",
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionText: {
    color: palette.white,
    fontFamily: "Space Grotesk",
    fontSize: 21,
    fontWeight: "700",
  },
  sectionAction: {
    color: palette.lime,
    fontWeight: "900",
  },
  ticket: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: palette.paper,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketType: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: "hidden",
    color: palette.ink,
    backgroundColor: "#fff3b0",
    fontWeight: "900",
    fontSize: 12,
  },
  ticketDate: {
    color: palette.muted,
    fontWeight: "800",
  },
  ticketCode: {
    marginTop: 17,
    color: palette.ink,
    fontFamily: "Space Grotesk",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0,
  },
  ticketFooter: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketMeta: {
    color: palette.muted,
    fontWeight: "900",
    fontSize: 12,
  },
  amountHero: {
    borderRadius: 34,
    padding: 22,
    backgroundColor: palette.paper,
  },
  panelLabel: {
    color: palette.muted,
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  amountText: {
    marginTop: 4,
    color: palette.ink,
    fontFamily: "Space Grotesk",
    fontSize: 48,
    fontWeight: "700",
  },
  chipGrid: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amountChip: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: palette.white,
  },
  amountChipActive: {
    backgroundColor: palette.ink,
  },
  amountChipText: {
    color: palette.ink,
    fontWeight: "900",
    fontSize: 12,
  },
  amountChipTextActive: {
    color: palette.lime,
  },
  methodStack: {
    gap: 10,
  },
  methodCard: {
    minHeight: 70,
    borderRadius: 26,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  methodCardActive: {
    borderColor: "rgba(201,255,87,0.72)",
    backgroundColor: "rgba(201,255,87,0.12)",
  },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  methodIconActive: {
    backgroundColor: palette.lime,
  },
  methodName: {
    color: palette.white,
    fontWeight: "900",
    fontSize: 15,
  },
  methodFee: {
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    fontSize: 12,
  },
  bankCard: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: palette.paper,
    gap: 10,
  },
  bankTitle: {
    color: palette.ink,
    fontFamily: "Space Grotesk",
    fontWeight: "700",
    fontSize: 19,
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bankLabel: {
    color: palette.muted,
    fontWeight: "800",
  },
  bankValue: {
    color: palette.ink,
    fontWeight: "900",
  },
  copyRail: {
    marginTop: 4,
    borderRadius: 18,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.lime,
  },
  copyRailText: {
    color: palette.ink,
    fontWeight: "900",
  },
  checkoutCard: {
    borderRadius: 30,
    padding: 18,
    backgroundColor: palette.lime,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  totalRail: {
    width: "100%",
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: "rgba(7,17,31,0.12)",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: "rgba(7,17,31,0.62)",
    fontWeight: "900",
  },
  totalValue: {
    color: palette.ink,
    fontFamily: "Space Grotesk",
    fontSize: 22,
    fontWeight: "700",
  },
  primaryButton: {
    width: "100%",
    minHeight: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: palette.lime,
  },
  primaryText: {
    color: palette.ink,
    fontWeight: "900",
    fontSize: 15,
  },
  buyPanel: {
    borderRadius: 34,
    padding: 18,
    backgroundColor: palette.paper,
    gap: 16,
  },
  segment: {
    padding: 4,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    backgroundColor: palette.ink,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  segmentItemActive: {
    backgroundColor: palette.lime,
  },
  segmentText: {
    color: palette.white,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: palette.ink,
  },
  inputRail: {
    height: 82,
    borderRadius: 24,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.white,
  },
  currency: {
    color: palette.muted,
    fontSize: 28,
    fontWeight: "900",
  },
  amountInput: {
    flex: 1,
    outlineStyle: "none",
    borderWidth: 0,
    color: palette.ink,
    fontFamily: "Space Grotesk",
    fontSize: 42,
    fontWeight: "700",
  },
  estimateCard: {
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.ink,
  },
  estimateText: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "800",
  },
  estimateValue: {
    color: palette.white,
    fontFamily: "Space Grotesk",
    fontSize: 22,
    fontWeight: "700",
  },
  lockCard: {
    borderRadius: 26,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff0ec",
  },
  lockTitle: {
    color: palette.ink,
    fontWeight: "900",
  },
  lockText: {
    marginTop: 2,
    color: "#7f4a42",
    fontWeight: "700",
    fontSize: 12,
  },
  usageHero: {
    borderRadius: 34,
    padding: 18,
    backgroundColor: palette.paper,
    gap: 18,
  },
  usageMetricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chart: {
    height: 170,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barColumn: {
    flex: 1,
    height: 150,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  bar: {
    width: 22,
    borderRadius: 999,
    backgroundColor: palette.mint,
  },
  barLabel: {
    color: palette.muted,
    fontWeight: "900",
    fontSize: 11,
  },
  insightCard: {
    borderRadius: 26,
    padding: 16,
    backgroundColor: "rgba(201,255,87,0.14)",
    borderWidth: 1,
    borderColor: "rgba(201,255,87,0.26)",
    flexDirection: "row",
    gap: 12,
  },
  insightTitle: {
    color: palette.white,
    fontWeight: "900",
  },
  insightText: {
    marginTop: 3,
    color: "rgba(255,255,255,0.62)",
    fontWeight: "700",
    fontSize: 12,
  },
  filterRail: {
    flexDirection: "row",
    gap: 8,
  },
  filterActive: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: "hidden",
    color: palette.ink,
    backgroundColor: palette.lime,
    fontWeight: "900",
  },
  filterText: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: "hidden",
    color: palette.white,
    backgroundColor: "rgba(255,255,255,0.1)",
    fontWeight: "900",
  },
  transaction: {
    borderRadius: 26,
    padding: 14,
    backgroundColor: palette.paper,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  txIconIn: {
    backgroundColor: palette.lime,
  },
  txIconOut: {
    backgroundColor: "#ffd98c",
  },
  txTitle: {
    color: palette.ink,
    fontWeight: "900",
  },
  txDetail: {
    marginTop: 2,
    color: palette.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  txAmountBlock: {
    alignItems: "flex-end",
  },
  txAmount: {
    color: palette.ink,
    fontWeight: "900",
  },
  txDate: {
    marginTop: 2,
    color: palette.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  profileCard: {
    borderRadius: 30,
    padding: 16,
    backgroundColor: palette.paper,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: palette.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  profileTitle: {
    color: palette.ink,
    fontWeight: "900",
  },
  profileText: {
    marginTop: 3,
    color: palette.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  controlRow: {
    borderRadius: 26,
    padding: 14,
    backgroundColor: palette.paper,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  controlTitle: {
    color: palette.ink,
    fontWeight: "900",
  },
  controlAmount: {
    marginTop: 3,
    color: palette.muted,
    fontWeight: "800",
    fontSize: 12,
  },
  switcher: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 3,
    backgroundColor: "#e4e9e2",
  },
  switchOption: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  switchActive: {
    backgroundColor: palette.ink,
  },
  switchText: {
    color: palette.muted,
    fontWeight: "900",
    fontSize: 11,
  },
  switchActiveText: {
    color: palette.white,
  },
  toast: {
    position: "absolute",
    zIndex: 5,
    top: 82,
    alignSelf: "center",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.lime,
  },
  toastText: {
    color: palette.ink,
    fontWeight: "900",
  },
  tabBar: {
    position: "absolute",
    zIndex: 20,
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 30,
    padding: 6,
    flexDirection: "row",
    backgroundColor: "rgba(7,17,31,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(18px)",
  },
  tabItem: {
    flex: 1,
    minHeight: 56,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: palette.lime,
  },
  tabLabel: {
    color: "rgba(255,255,255,0.82)",
    fontWeight: "900",
    fontSize: 10,
  },
  tabLabelActive: {
    color: palette.ink,
  },
};

createRoot(document.getElementById("root")!).render(<App />);
