"use client";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { redeemRewards } from "@/lib/commuteStore";
import {
  CASHOUT_THRESHOLD_COINS,
  COIN_VALUE_PKR,
  COINS_PER_HELPFUL_ALERT,
  COINS_PER_VERIFIED_RIDE,
  CoinTransaction,
  formatTimeAgo,
  RedeemRewardsResult,
  StudentProfile,
} from "@/lib/commuteTypes";

export interface RewardsWalletViewProps {
  profile: StudentProfile | null;
  transactions: CoinTransaction[];
  dark?: boolean;
}

export function RewardsWalletView({
  profile,
  transactions,
  dark = true,
}: RewardsWalletViewProps) {
  const coinBalance = profile?.coinBalance ?? 0;
  const lifetimeCoins = profile?.lifetimeCoinsEarned ?? 0;

  const [coinsToRedeem, setCoinsToRedeem] = useState<number>(CASHOUT_THRESHOLD_COINS);
  const [easypaisaNumber, setEasypaisaNumber] = useState<string>("0300-1234567");
  const [accountTitle, setAccountTitle] = useState<string>("Hamza Siddiqui");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [receipt, setReceipt] = useState<RedeemRewardsResult | null>(null);

  useEffect(() => {
    if (!profile) return;
    setEasypaisaNumber(profile.easypaisaNumber || "0300-1234567");
    setAccountTitle(profile.displayName || "");
  }, [profile]);

  const canRedeem =
    coinBalance >= coinsToRedeem && coinsToRedeem >= CASHOUT_THRESHOLD_COINS;
  const payoutPkr = Math.round(coinsToRedeem * COIN_VALUE_PKR);
  const progressPct = Math.min(
    100,
    Math.round((coinBalance / CASHOUT_THRESHOLD_COINS) * 100)
  );
  const coinsMissing = Math.max(0, CASHOUT_THRESHOLD_COINS - coinBalance);

  const handleRedeem = () => {
    setErrorMsg("");
    try {
      const res = redeemRewards({
        coinsToRedeem,
        easypaisaNumber,
        accountTitle,
      });
      setReceipt(res);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not complete redemption."
      );
    }
  };

  const cardBg = dark ? "#0f172a" : "#f8fafc";
  const innerBg = dark ? "#1e293b" : "#ffffff";
  const borderCol = dark ? "#334155" : "#e2e8f0";
  const textPrimary = dark ? "#f8fafc" : "#0f172a";
  const textSecondary = dark ? "#94a3b8" : "#64748b";

  const amountPresets = [200, 300, 400];

  return (
    <div
      style={{
        overflowY: "auto",
        flex: 1,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* ── Wallet Hero Card ─────────────────────────────── */}
      <div
        style={{
          padding: "14px",
          borderRadius: "12px",
          background: dark
            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(16, 185, 129, 0.10))"
            : "linear-gradient(135deg, #fffbeb, #ecfdf5)",
          border: dark
            ? "1px solid rgba(245, 158, 11, 0.35)"
            : "1px solid #fde68a",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: dark ? "#fbbf24" : "#b45309" }}>
              AVAILABLE BALANCE
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: textPrimary, marginTop: 2 }}>
              {coinBalance} Coins
            </div>
            <div style={{ fontSize: "11px", color: textSecondary }}>
              ≈ Rs. {Math.round(coinBalance * COIN_VALUE_PKR)} value • Lifetime:{" "}
              {lifetimeCoins} coins
            </div>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              background: dark ? "rgba(16, 185, 129, 0.18)" : "#d1fae5",
              color: dark ? "#34d399" : "#047857",
              padding: "3px 9px",
              borderRadius: "999px",
            }}
          >
            1 Coin = Rs. {COIN_VALUE_PKR.toFixed(2)}
          </span>
        </div>

        <div
          style={{
            marginTop: 10,
            height: "8px",
            borderRadius: "999px",
            background: dark ? "#1e293b" : "#e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              borderRadius: "999px",
              background: "linear-gradient(90deg, #f59e0b, #10b981)",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 7,
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: textSecondary,
          }}
        >
          <span>
            {coinBalance >= CASHOUT_THRESHOLD_COINS
              ? "EasyPaisa cashout unlocked!"
              : `${CASHOUT_THRESHOLD_COINS - coinBalance} coins away from EasyPaisa cashout`}
          </span>
          <span style={{ fontWeight: 700 }}>
            {coinBalance}/{CASHOUT_THRESHOLD_COINS}
          </span>
        </div>

        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: dark ? "1px dashed #334155" : "1px dashed #d1d5db",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: textSecondary,
          }}
        >
          <span>Board + Exit Ride: <strong style={{ color: textPrimary }}>+{COINS_PER_VERIFIED_RIDE} coins</strong></span>
          <span>Helpful Route Alert: <strong style={{ color: textPrimary }}>+{COINS_PER_HELPFUL_ALERT} coins</strong></span>
        </div>
      </div>

      {/* ── Instant Payout Receipt Banner ────────────────── */}
      {receipt && (
        <div
          style={{
            padding: "12px",
            borderRadius: "10px",
            background: dark ? "rgba(16, 185, 129, 0.14)" : "#ecfdf5",
            border: dark ? "1px solid #059669" : "1px solid #6ee7b7",
            fontSize: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
              color: dark ? "#34d399" : "#047857",
            }}
          >
            <span>Payout Confirmed • {receipt.receiptRef}</span>
            <button
              type="button"
              onClick={() => setReceipt(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ marginTop: 4, color: textPrimary, fontWeight: 600 }}>
            Rs. {receipt.pkrAmount} redeemed ({receipt.transaction.description})
          </div>
          <div style={{ marginTop: 2, fontSize: "11px", color: textSecondary }}>
            Remaining balance: <strong>{receipt.newBalance} Coins</strong>
          </div>
        </div>
      )}

      {/* ── Redemption Form Card ─────────────────────────── */}
      <div
        style={{
          padding: "13px",
          borderRadius: "12px",
          background: cardBg,
          border: `1px solid ${borderCol}`,
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: 700, color: textPrimary, marginBottom: 4 }}>
          EasyPaisa Cash Payout
        </div>
        <div style={{ fontSize: "11px", color: textSecondary, marginBottom: 10 }}>
          Accumulate {CASHOUT_THRESHOLD_COINS}+ coins to withdraw cash directly to EasyPaisa.
        </div>

        {/* Coin Tier Presets */}
        <div style={{ fontSize: "11px", fontWeight: 600, color: textSecondary, marginBottom: 4 }}>
          Select Coins to Cash Out
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
          {amountPresets.map((amt) => {
            const selected = coinsToRedeem === amt;
            const affordable = coinBalance >= amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setCoinsToRedeem(amt);
                }}
                style={{
                  padding: "7px 6px",
                  borderRadius: "8px",
                  border: selected
                    ? "1px solid #f59e0b"
                    : `1px solid ${borderCol}`,
                  background: selected ? "rgba(245, 158, 11, 0.16)" : innerBg,
                  color: selected ? "#fbbf24" : affordable ? textPrimary : textSecondary,
                  opacity: affordable ? 1 : 0.65,
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {amt} Coins
                <div style={{ fontSize: "10px", fontWeight: 500 }}>
                  = Rs. {Math.round(amt * COIN_VALUE_PKR)}
                </div>
              </button>
            );
          })}
        </div>

        {/* EasyPaisa Account Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: textSecondary, marginBottom: 3 }}>
              EasyPaisa Mobile Number
            </label>
            <input
              type="tel"
              value={easypaisaNumber}
              onChange={(e) => setEasypaisaNumber(e.target.value)}
              placeholder="0300-1234567"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                background: innerBg,
                border: `1px solid ${borderCol}`,
                color: textPrimary,
                fontSize: "12px",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: textSecondary, marginBottom: 3 }}>
              Account Title
            </label>
            <input
              type="text"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              placeholder="Full Name on EasyPaisa"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                background: innerBg,
                border: `1px solid ${borderCol}`,
                color: textPrimary,
                fontSize: "12px",
              }}
            />
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              marginBottom: 8,
              padding: "7px 9px",
              borderRadius: "7px",
              background: "rgba(239, 68, 68, 0.14)",
              color: "#f87171",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleRedeem}
          disabled={!canRedeem}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "none",
            background: !canRedeem
              ? dark
                ? "#334155"
                : "#cbd5e1"
              : "#10b981",
            color: !canRedeem ? textSecondary : "white",
            fontWeight: 700,
            fontSize: "13px",
            cursor: !canRedeem ? "not-allowed" : "pointer",
          }}
        >
          {!canRedeem
            ? coinsMissing > 0
              ? `Need ${coinsMissing} more coins (at ${coinBalance})`
              : `Balance below ${coinsToRedeem} coins`
            : `Withdraw Rs. ${payoutPkr} to EasyPaisa`}
        </button>
      </div>

      {/* ── Coin Transaction History ─────────────────────── */}
      <div
        style={{
          padding: "13px",
          borderRadius: "12px",
          background: cardBg,
          border: `1px solid ${borderCol}`,
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: textSecondary, marginBottom: 8 }}>
          COIN LEDGER ({transactions.length})
        </div>
        {transactions.length === 0 ? (
          <div style={{ fontSize: "12px", color: textSecondary }}>
            No coin activity yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {transactions.slice(0, 12).map((txn) => {
              const isPositive = txn.coinsDelta >= 0;
              return (
                <div
                  key={txn._id}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: innerBg,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "11px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
                      {txn.description}
                    </div>
                    <div style={{ color: textSecondary, fontSize: "10px", marginTop: 2 }}>
                      {formatTimeAgo(txn.createdAt)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "12px",
                      color: isPositive
                        ? dark
                          ? "#34d399"
                          : "#059669"
                        : dark
                        ? "#f87171"
                        : "#dc2626",
                      flexShrink: 0,
                    }}
                  >
                    {isPositive ? `+${txn.coinsDelta}` : txn.coinsDelta} coins
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface RewardsWalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile | null;
  transactions: CoinTransaction[];
  dark?: boolean;
}

export default function RewardsWalletSheet({
  open,
  onOpenChange,
  profile,
  transactions,
  dark = true,
}: RewardsWalletSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showOverlay={false}
        className={`w-88 sm:w-[420px] sm:max-w-md p-0 flex flex-col ${
          dark
            ? "bg-slate-950 border-l border-slate-800 text-slate-100"
            : "bg-white text-slate-900"
        }`}
      >
        <SheetHeader
          className={`px-5 pt-5 pb-3 border-b ${
            dark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <SheetTitle
            className={`text-base font-bold flex items-center gap-2 ${
              dark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Commute Rewards &amp; EasyPaisa
          </SheetTitle>
          <SheetDescription
            className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            Earn coins from verified rides &amp; alerts • Cash out via EasyPaisa
          </SheetDescription>
        </SheetHeader>

        <RewardsWalletView
          profile={profile}
          transactions={transactions}
          dark={dark}
        />
      </SheetContent>
    </Sheet>
  );
}
