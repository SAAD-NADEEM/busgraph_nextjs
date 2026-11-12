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

interface RouteChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile | null;
  chatMessages: RouteChatMessage[];
  activeBoarding: ActiveBoardingSession | null;
  selectedOption: TransitOption | null;
  dark?: boolean;
}

/**
 * Right-side drawer for Step 4: Isolated Per-Bus Live Chat Rooms (#R11-chat, #EV3-chat).
 * Features 1-tap structured quick-tags (+5 Commute Coins), verified student badges,
 * and free-text commuter updates.
 */
export default function RouteChatSheet({
  open,
  onOpenChange,
  profile,
  chatMessages,
  activeBoarding,
  selectedOption,
  dark = true,
}: RouteChatSheetProps) {
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

  // Sync default channel & stop when opened during an active ride or route search
  useEffect(() => {
    if (!open) return;
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
  }, [open, activeBoarding, selectedOption]);

  // Count messages per channel so active rooms stand out
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
    if (open) {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [channelMessages.length, activeRouteId, open]);

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
          `+${res.coinsAwarded} 🪙 earned for verified route alert! (Balance: ${res.newBalance})`
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
            <span>💬</span>
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
                  flexShrink: 0,
                  padding: "6px 10px",
                  borderRadius: "999px",
                  border: isActive ? `1px solid ${col}` : `1px solid ${borderCol}`,
                  background: isActive ? `${col}26` : cardBg,
                  color: isActive ? textPrimary : textSecondary,
                  fontSize: "11px",
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: col,
                    display: "inline-block",
                  }}
                />
                <span>#{id}-chat</span>
                {msgCount > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      opacity: 0.85,
                      background: innerBg,
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

        {/* ── Channel Banner ───────────────────────────────────── */}
        <div
          style={{
            padding: "8px 16px",
            background: cardBg,
            borderBottom: `1px solid ${borderCol}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 700, color: textPrimary }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: activeRouteColor,
                marginRight: 6,
              }}
            />
            #{activeRouteId}-chat
          </span>
          <span style={{ color: textSecondary }}>
            🛡️ Anti-spam &amp; verified IDs active
          </span>
        </div>

        {/* ── Scrollable Chat Feed ─────────────────────────────── */}
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
                margin: "auto 0",
                textAlign: "center",
                padding: "24px 12px",
                color: textSecondary,
                fontSize: "12px",
              }}
            >
              No messages in <strong>#{activeRouteId}-chat</strong> yet.
              <div style={{ marginTop: 4, fontSize: "11px" }}>
                Tap a 1-tap quick tag below to report bus location or seat availability and earn +{COINS_PER_HELPFUL_ALERT} 🪙!
              </div>
            </div>
          ) : (
            channelMessages.map((msg) => {
              const isSelf = msg.studentId === profile?.studentId;
              const tagMeta = CHAT_TAG_META[msg.tagType];
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
                      ? "1px solid rgba(59, 130, 246, 0.35)"
                      : `1px solid ${borderCol}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "11px" }}>
                      <strong style={{ color: textPrimary }}>
                        {isSelf ? `${msg.senderName} (You)` : msg.senderName}
                      </strong>
                      {msg.verifiedStudent && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "999px",
                            background: dark ? "rgba(16, 185, 129, 0.16)" : "#d1fae5",
                            color: dark ? "#34d399" : "#047857",
                          }}
                        >
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "999px",
                        color: tagMeta.color,
                        background: dark ? tagMeta.bgDark : tagMeta.bgLight,
                      }}
                    >
                      {tagMeta.label}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: textPrimary, lineHeight: 1.4 }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: "10px", color: textSecondary, marginTop: 4, textAlign: "right" }}>
                    {formatTimeAgo(msg.createdAt)}
                  </div>
                </div>
              );
            })
          )}
          <div ref={feedEndRef} />
        </div>

        {/* ── 1-Tap Quick-Tag Composer + Free-Text Input ──────── */}
        <div
          style={{
            padding: "10px 14px 14px",
            borderTop: `1px solid ${borderCol}`,
            background: cardBg,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {statusNotice && (
            <div
              style={{
                padding: "6px 9px",
                borderRadius: "7px",
                background: dark ? "rgba(16, 185, 129, 0.14)" : "#ecfdf5",
                color: dark ? "#34d399" : "#047857",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {statusNotice}
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: "6px 9px",
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: textSecondary }}>
              1-TAP QUICK ALERTS (+{COINS_PER_HELPFUL_ALERT} 🪙)
            </span>
            <select
              value={selectedStopName}
              onChange={(e) => setSelectedStopName(e.target.value)}
              style={{
                maxWidth: "185px",
                padding: "3px 6px",
                borderRadius: "6px",
                background: innerBg,
                border: `1px solid ${borderCol}`,
                color: textPrimary,
                fontSize: "11px",
              }}
              aria-label="Select stop for quick alert"
            >
              {stopOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <button
              type="button"
              onClick={() =>
                handleQuickTag("crossed", `📍 Bus crossed ${selectedStopName}`)
              }
              style={{
                padding: "6px 8px",
                borderRadius: "7px",
                border: `1px solid ${borderCol}`,
                background: innerBg,
                color: textPrimary,
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📍 Crossed stop
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickTag("crowd", `💺 Seats available near ${selectedStopName}`)
              }
              style={{
                padding: "6px 8px",
                borderRadius: "7px",
                border: `1px solid ${borderCol}`,
                background: innerBg,
                color: dark ? "#34d399" : "#047857",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              💺 Seats available
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickTag("crowd", `🧍 Standing only near ${selectedStopName}`)
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
              🧍 Standing only
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickTag("delay", `⚠️ Traffic delay near ${selectedStopName}`)
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
              ⚠️ Traffic delay
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
      </SheetContent>
    </Sheet>
  );
}

