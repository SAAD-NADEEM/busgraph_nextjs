"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getRouteColor } from "@/lib/routeColors";
import { KARACHI_TRANSIT_STOPS } from "@/lib/stopResolver";
import type { TransitOption } from "@/lib/routeMatcher";
import { postRouteChatMessage } from "@/lib/commuteStore";
import {
  ActiveBoardingSession,
  AVAILABLE_ROUTE_IDS,
  CHAT_TAG_META,
  ChatTagType,
  COINS_PER_HELPFUL_ALERT,
  formatTimeAgo,
  RouteChatMessage,
  StudentProfile,
} from "@/lib/commuteTypes";

export interface RouteChatViewProps {
  profile: StudentProfile | null;
  chatMessages: RouteChatMessage[];
  activeBoarding: ActiveBoardingSession | null;
  selectedOption: TransitOption | null;
  dark?: boolean;
}

export function RouteChatView({
  profile,
  chatMessages,
  activeBoarding,
  selectedOption,
  dark = true,
}: RouteChatViewProps) {
  const defaultRouteId =
    activeBoarding?.routeId || selectedOption?.legs[0]?.routeId || "R11";

  const [activeRouteId, setActiveRouteId] = useState<string>(defaultRouteId);
  const [selectedStopName, setSelectedStopName] = useState<string>(
    KARACHI_TRANSIT_STOPS[0]?.name ?? "Tower (Merewether Clock Tower / Saddar)"
  );
  const [draftText, setDraftText] = useState<string>("");
  const [statusNotice, setStatusNotice] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  const sortedStops = useMemo(
    () => [...KARACHI_TRANSIT_STOPS].map((s) => s.name).sort(),
    []
  );

  useEffect(() => {
    const preferred =
      activeBoarding?.routeId || selectedOption?.legs[0]?.routeId;
    if (preferred) {
      setActiveRouteId(preferred);
    }
    const preferredStop =
      activeBoarding?.boardStopName || selectedOption?.legs[0]?.boardStopName;
    if (preferredStop) {
      setSelectedStopName(preferredStop);
    }
  }, [activeBoarding, selectedOption]);

  const countByRoute = useMemo(() => {
    const map = new Map<string, number>();
    for (const msg of chatMessages) {
      map.set(msg.routeId, (map.get(msg.routeId) ?? 0) + 1);
    }
    return map;
  }, [chatMessages]);

  const channelMessages = useMemo(
    () =>
      chatMessages
        .filter((m) => m.routeId === activeRouteId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [chatMessages, activeRouteId]
  );

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages.length, activeRouteId]);

  const submitMessage = (tagType: ChatTagType, message: string) => {
    setErrorMsg("");
    setStatusNotice("");
    try {
      const res = postRouteChatMessage({
        routeId: activeRouteId,
        tagType,
        message,
      });
      if (res.coinsAwarded > 0) {
        setStatusNotice(
          `+${res.coinsAwarded} coins earned for verified route alert! (Balance: ${res.newBalance})`
        );
      }
      if (tagType === "free") {
        setDraftText("");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send message.");
    }
  };

  const handleQuickTag = (tagType: ChatTagType, message: string) => {
    submitMessage(tagType, message);
  };

  const handleSendFreeText = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage("free", draftText);
  };

  const stopOptions = useMemo(() => {
    if (sortedStops.includes(selectedStopName)) return sortedStops;
    return [selectedStopName, ...sortedStops];
  }, [sortedStops, selectedStopName]);

  const cardBg = dark ? "#0f172a" : "#f8fafc";
  const innerBg = dark ? "#1e293b" : "#ffffff";
  const borderCol = dark ? "#334155" : "#e2e8f0";
  const textPrimary = dark ? "#f8fafc" : "#0f172a";
  const textSecondary = dark ? "#94a3b8" : "#64748b";
  const activeRouteColor = getRouteColor(activeRouteId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* ── Isolated Route Channel Tabs (#R11-chat, #EV3-chat) ── */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${borderCol}`,
          display: "flex",
          gap: 6,
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {AVAILABLE_ROUTE_IDS.map((id) => {
          const isActive = id === activeRouteId;
          const col = getRouteColor(id);
          const msgCount = countByRoute.get(id) ?? 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveRouteId(id);
                setStatusNotice("");
              }}
              style={{
                padding: "5px 10px",
                borderRadius: "999px",
                border: isActive ? `2px solid ${col}` : `1px solid ${borderCol}`,
                background: isActive ? `${col}24` : cardBg,
                color: isActive ? (dark ? "#f8fafc" : "#0f172a") : textSecondary,
                fontSize: "11px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: col,
                  display: "inline-block",
                }}
              />
              <span>#{id}</span>
              {msgCount > 0 && (
                <span
                  style={{
                    background: isActive ? col : dark ? "#334155" : "#cbd5e1",
                    color: "white",
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "0 5px",
                    borderRadius: "999px",
                  }}
                >
                  {msgCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active Channel Header & Stop Picker ───────────── */}
      <div
        style={{
          padding: "10px 14px",
          background: cardBg,
          borderBottom: `1px solid ${borderCol}`,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span
              style={{
                background: activeRouteColor,
                color: "white",
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "999px",
              }}
            >
              {activeRouteId}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: textPrimary }}>
              #{activeRouteId}-chat
            </span>
          </div>
          <span style={{ fontSize: "10px", color: textSecondary }}>
            +{COINS_PER_HELPFUL_ALERT} coins per alert
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: "10px", color: textSecondary, fontWeight: 600, flexShrink: 0 }}>
            Near Stop:
          </label>
          <select
            value={selectedStopName}
            onChange={(e) => setSelectedStopName(e.target.value)}
            style={{
              flex: 1,
              padding: "5px 8px",
              borderRadius: "6px",
              background: innerBg,
              color: textPrimary,
              border: `1px solid ${borderCol}`,
              fontSize: "11px",
              minWidth: 0,
            }}
          >
            {stopOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Status Notices / Coin Rewards ─────────────────── */}
      {statusNotice && (
        <div
          style={{
            margin: "8px 14px 0",
            padding: "7px 10px",
            borderRadius: "7px",
            background: "rgba(16, 185, 129, 0.16)",
            color: dark ? "#34d399" : "#047857",
            fontSize: "11px",
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{statusNotice}</span>
          <button
            type="button"
            onClick={() => setStatusNotice("")}
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            margin: "8px 14px 0",
            padding: "7px 10px",
            borderRadius: "7px",
            background: "rgba(239, 68, 68, 0.16)",
            color: "#f87171",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* ── Scrollable Message Feed ──────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {channelMessages.length === 0 ? (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: textSecondary,
              fontSize: "12px",
              padding: 20,
            }}
          >
            No alerts posted yet in #{activeRouteId}-chat.
            <br />
            Tap a quick alert tag below to share an update (+5 coins)!
          </div>
        ) : (
          channelMessages.map((msg) => {
            const tagMeta = CHAT_TAG_META[msg.tagType];
            const isSelf = msg.senderName.includes(profile?.displayName ?? "Hamza");
            return (
              <div
                key={msg._id}
                style={{
                  padding: "9px 11px",
                  borderRadius: "10px",
                  background: isSelf
                    ? dark
                      ? "rgba(37, 99, 235, 0.14)"
                      : "#eff6ff"
                    : cardBg,
                  border: isSelf
                    ? dark
                      ? "1px solid rgba(37, 99, 235, 0.35)"
                      : "1px solid #bfdbfe"
                    : `1px solid ${borderCol}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "11px" }}>
                    <span style={{ fontWeight: 700, color: textPrimary }}>
                      {msg.senderName}
                    </span>
                    {msg.verifiedStudent && (
                      <span
                        style={{
                          background: dark ? "rgba(16, 185, 129, 0.18)" : "#d1fae5",
                          color: dark ? "#34d399" : "#047857",
                          padding: "0 5px",
                          borderRadius: "999px",
                          fontSize: "9px",
                          fontWeight: 700,
                        }}
                      >
                        ✓ Student
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "10px", color: textSecondary }}>
                    {formatTimeAgo(msg.createdAt)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span
                    style={{
                      background: dark ? tagMeta.bgDark : tagMeta.bgLight,
                      color: tagMeta.color,
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {tagMeta.label}
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: textPrimary, marginTop: 2, lineHeight: 1.35 }}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>

      {/* ── 1-Tap Quick Tag Buttons + Input Bar ───────────── */}
      <div
        style={{
          padding: "10px 14px 12px",
          background: cardBg,
          borderTop: `1px solid ${borderCol}`,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: "10px", fontWeight: 700, color: textSecondary }}>
          1-TAP STRUCTURED ALERTS (+5 COINS)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
          <button
            type="button"
            onClick={() =>
              handleQuickTag("crossed", `Just crossed ${selectedStopName}`)
            }
            style={{
              padding: "6px 8px",
              borderRadius: "7px",
              border: `1px solid ${borderCol}`,
              background: innerBg,
              color: dark ? "#38bdf8" : "#0284c7",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Just crossed stop
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickTag("crowd", `Seats available near ${selectedStopName}`)
            }
            style={{
              padding: "6px 8px",
              borderRadius: "7px",
              border: `1px solid ${borderCol}`,
              background: innerBg,
              color: dark ? "#34d399" : "#059669",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Seats available
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickTag("crowd", `Standing only near ${selectedStopName}`)
            }
            style={{
              padding: "6px 8px",
              borderRadius: "7px",
              border: `1px solid ${borderCol}`,
              background: innerBg,
              color: dark ? "#fbbf24" : "#b45309",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Standing only
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickTag("delay", `Traffic delay near ${selectedStopName}`)
            }
            style={{
              padding: "6px 8px",
              borderRadius: "7px",
              border: `1px solid ${borderCol}`,
              background: innerBg,
              color: dark ? "#fb923c" : "#c2410c",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Traffic delay
          </button>
        </div>

        <form onSubmit={handleSendFreeText} style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <input
            type="text"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            maxLength={240}
            placeholder={`Message #${activeRouteId}-chat...`}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: "8px",
              background: innerBg,
              border: `1px solid ${borderCol}`,
              color: textPrimary,
              fontSize: "12px",
            }}
          />
          <button
            type="submit"
            disabled={!draftText.trim()}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              background: !draftText.trim() ? "#475569" : "#2563eb",
              color: "white",
              fontSize: "12px",
              fontWeight: 700,
              cursor: !draftText.trim() ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

interface RouteChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile | null;
  chatMessages: RouteChatMessage[];
  activeBoarding: ActiveBoardingSession | null;
  selectedOption: TransitOption | null;
  dark?: boolean;
}

export default function RouteChatSheet({
  open,
  onOpenChange,
  profile,
  chatMessages,
  activeBoarding,
  selectedOption,
  dark = true,
}: RouteChatSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showOverlay={false}
        className={`w-88 sm:w-[440px] sm:max-w-md p-0 flex flex-col ${
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
            Route Commuter Channels
          </SheetTitle>
          <SheetDescription
            className={`text-xs flex items-center gap-2 ${
              dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <span>Moderated channel</span>
            {profile?.verifiedStudent && (
              <span
                style={{
                  background: dark ? "rgba(16, 185, 129, 0.16)" : "#d1fae5",
                  color: dark ? "#34d399" : "#047857",
                  padding: "1px 6px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                ✓ Verified Student Chat
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <RouteChatView
          profile={profile}
          chatMessages={chatMessages}
          activeBoarding={activeBoarding}
          selectedOption={selectedOption}
          dark={dark}
        />
      </SheetContent>
    </Sheet>
  );
}
