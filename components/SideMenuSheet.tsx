"use client";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Map,
  LayoutDashboard,
  Radio,
  Coins,
  MessageSquare,
  X,
} from "lucide-react";
import { RouteLegendView } from "./RouteLegendSheet";
import { StudentDashboardView } from "./StudentDashboardSheet";
import { LiveTrackerView } from "./LiveTrackerSheet";
import { RewardsWalletView } from "./RewardsWalletSheet";
import { RouteChatView } from "./RouteChatSheet";
import type { RouteData } from "./AllRoutesLayer";
import type {
  ActiveBoardingSession,
  LiveBusSpotting,
  StudentProfile,
  CommuteTrip,
  CoinTransaction,
  RouteChatMessage,
} from "@/lib/commuteTypes";
import type { TransitOption } from "@/lib/routeMatcher";

export type MenuTab = "legend" | "dashboard" | "tracker" | "coins" | "chat";

interface SideMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: MenuTab;
  onTabChange: (tab: MenuTab) => void;
  routes: RouteData[];
  loadingRoutes: boolean;
  visibleRouteIds: Set<string>;
  onToggleRoute: (routeId: string, checked: boolean) => void;
  profile: StudentProfile | null;
  trips: CommuteTrip[];
  activeBoarding: ActiveBoardingSession | null;
  spottings: LiveBusSpotting[];
  coinBalance: number;
  transactions: CoinTransaction[];
  chatMessages: RouteChatMessage[];
  selectedOption: TransitOption | null;
  onFocusLocation: (lat: number, lng: number) => void;
  dark?: boolean;
}

const TABS: { id: MenuTab; label: string; icon: typeof Map }[] = [
  { id: "legend", label: "Routes", icon: Map },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tracker", label: "Live Buses", icon: Radio },
  { id: "coins", label: "Coins", icon: Coins },
  { id: "chat", label: "Route Chat", icon: MessageSquare },
];

export default function SideMenuSheet({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  routes,
  loadingRoutes,
  visibleRouteIds,
  onToggleRoute,
  profile,
  trips,
  activeBoarding,
  spottings,
  coinBalance,
  transactions,
  chatMessages,
  selectedOption,
  onFocusLocation,
  dark = true,
}: SideMenuSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showOverlay={false}
        className={`w-88 sm:w-[460px] sm:max-w-md p-0 flex flex-col h-full ${
          dark
            ? "bg-slate-950 border-l border-slate-800 text-slate-100"
            : "bg-white text-slate-900"
        }`}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "14px 18px 10px",
            borderBottom: dark ? "1px solid #1e293b" : "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src="/icons/icon-192x192.png"
                alt="BusGraph"
                width={20}
                height={20}
                style={{ borderRadius: "4px", objectFit: "contain" }}
              />
              <span style={{ fontWeight: 700, fontSize: "14px" }}>
                BusGraph Menu
              </span>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              style={{
                background: "transparent",
                border: "none",
                color: dark ? "#94a3b8" : "#64748b",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
              }}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div
            style={{
              display: "flex",
              gap: 4,
              overflowX: "auto",
              paddingBottom: 2,
              scrollbarWidth: "none",
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: isActive
                      ? dark
                        ? "1px solid #3b82f6"
                        : "1px solid #2563eb"
                      : "1px solid transparent",
                    background: isActive
                      ? dark
                        ? "rgba(37, 99, 235, 0.2)"
                        : "#eff6ff"
                      : "transparent",
                    color: isActive
                      ? dark
                        ? "#93c5fd"
                        : "#1d4ed8"
                      : dark
                      ? "#94a3b8"
                      : "#64748b",
                    fontSize: "12px",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>

                  {tab.id === "tracker" && spottings.length > 0 && (
                    <span
                      style={{
                        background: "#10b981",
                        color: "white",
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "0 5px",
                        borderRadius: "999px",
                      }}
                    >
                      {spottings.length}
                    </span>
                  )}

                  {tab.id === "coins" && (
                    <span
                      style={{
                        background: dark ? "rgba(245, 158, 11, 0.25)" : "#fef3c7",
                        color: dark ? "#fbbf24" : "#b45309",
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "0 5px",
                        borderRadius: "999px",
                      }}
                    >
                      {coinBalance}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body View */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeTab === "legend" && (
            <RouteLegendView
              routes={routes}
              loading={loadingRoutes}
              visibleRouteIds={visibleRouteIds}
              onToggleRoute={onToggleRoute}
              dark={dark}
            />
          )}

          {activeTab === "dashboard" && (
            <StudentDashboardView
              profile={profile}
              trips={trips}
              onOpenRewards={() => onTabChange("coins")}
              dark={dark}
            />
          )}

          {activeTab === "tracker" && (
            <LiveTrackerView
              activeBoarding={activeBoarding}
              spottings={spottings}
              coinBalance={coinBalance}
              selectedOption={selectedOption}
              onFocusLocation={onFocusLocation}
              dark={dark}
            />
          )}

          {activeTab === "coins" && (
            <RewardsWalletView
              profile={profile}
              transactions={transactions}
              dark={dark}
            />
          )}

          {activeTab === "chat" && (
            <RouteChatView
              profile={profile}
              chatMessages={chatMessages}
              activeBoarding={activeBoarding}
              selectedOption={selectedOption}
              dark={dark}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

