/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import {
  Home,
  Compass,
  PlaySquare,
  MessageCircle,
  User,
  Users,
  Bell,
  Lock,
  Zap,
} from "lucide-react";
import { useAuthStore } from "./store/authStore";
import { useCurrentUser } from "./hooks/useCurrentUser";
import {
  useAchievementEngine,
  useTrackingStats,
} from "./lib/mock/achievementEngine";
import { BadgeCelebrationManager } from "./components/BadgeComponents";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import AuthScreen from "./screens/AuthScreen";
import PulseScreen from "./screens/PulseScreen";
import ConnectScreen from "./screens/ConnectScreen";
import VibesScreen from "./screens/VibesScreen";
import WorldsScreen from "./screens/WorldsScreen";
import WorldDetailScreen from "./screens/WorldDetailScreen";
import { WorldCategoryScreen } from "./screens/WorldCategoryScreen";
import MonetizationSetupScreen from "./screens/MonetizationSetupScreen";
import DiscoverScreen from "./screens/DiscoverScreen";
import NearbyScreen from "./screens/NearbyScreen";
import { WorldActivityScreen } from "./screens/WorldActivityScreen";
import { WorldNotificationSettingsScreen } from "./screens/WorldNotificationSettingsScreen";
import IdentityScreen from "./screens/IdentityScreen";
import SignalScreen from "./screens/SignalScreen";
import CreatorDashboardScreen from "./screens/CreatorDashboardScreen";
import PromoteScreen from "./screens/PromoteScreen";
import MonetizationHubScreen from "./screens/MonetizationHubScreen";
import SparkDetailScreen from "./screens/SparkDetailScreen";
import PostDetailScreen from "./screens/PostDetailScreen";
import TipsManageScreen from "./screens/monetization/TipsManageScreen";
import PremiumManageScreen from "./screens/monetization/PremiumManageScreen";
import SubscriptionsManageScreen from "./screens/monetization/SubscriptionsManageScreen";
import TicketsManageScreen from "./screens/monetization/TicketsManageScreen";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import MemberSubscriptionScreen from "./screens/MemberSubscriptionScreen";
import CreatorEarningsScreen from "./screens/CreatorEarningsScreen";
import OtherUserProfileScreen from "./screens/OtherUserProfileScreen";
import HashtagScreen from "./screens/HashtagScreen";
import ChatThreadScreen from "./screens/ChatThreadScreen";
import GroupInfoScreen from "./screens/GroupInfoScreen";
import { BottomTabs } from "./components/BottomTabs";
import {
  DashboardSidebar,
  MobileStatsDashboard,
  DashboardSheets,
} from "./components/DashboardSidebar";

import {
  initOnlineTracking,
  initMockUsersOnlineToggle,
} from "./hooks/useOnlineStatus";

let onlineSetupDone = false;
if (typeof window !== "undefined" && !onlineSetupDone) {
  onlineSetupDone = true;
  initOnlineTracking();
  initMockUsersOnlineToggle();
}

import { useNotificationStore } from "./store/notificationStore";
import { useNavigate } from "react-router-dom";

function PulseToastManager() {
  const { pulseToasts, removePulseToast } = useNotificationStore();
  const navigate = useNavigate();

  if (pulseToasts.length === 0) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-[999] flex flex-col gap-2 items-center pointer-events-none">
      {pulseToasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-gradient-to-r from-[#B026FF] to-[#D4AF37] p-[1px] rounded-2xl shadow-[0_0_20px_rgba(176,38,255,0.4)] animate-in slide-in-from-top-4 fade-in duration-300 w-full max-w-sm cursor-pointer active:scale-95 transition-transform"
          onClick={() => {
            removePulseToast(toast.id);
            navigate("/wallet");
          }}
        >
          <div className="bg-[#0a0a0c] rounded-2xl p-3 flex flex-col items-center text-center">
            <p className="text-[#00F0FF] font-bold text-lg mb-0.5">
              ⚡ +{toast.points} Pulse Points!
            </p>
            <p className="text-white/90 text-sm mb-1">
              {toast.message
                .replace(/\+[0-9]+ Pulse.*|\+[0-9]+ ⚡.*/, "")
                .trim()}
            </p>
            <p className="text-white/60 font-medium text-xs border-t border-white/10 pt-1 w-full mt-1">
              Total: {toast.total.toLocaleString()} ⚡
            </p>
          </div>
        </div>
      ))
      }
    </div >
  );
}

import NeonSnakeScreen from "./screens/NeonSnakeScreen";
import TicTacToeScreen from "./screens/TicTacToeScreen";
import QuizBattleScreen from "./screens/QuizBattleScreen";
import SnakesLaddersScreen from "./screens/SnakesLaddersScreen";
import VeilScreen from "./screens/VeilScreen";
import LudoGameScreen from "./screens/LudoGameScreen";
import EmojiGuessScreen from "./screens/EmojiGuessScreen";
import TruthOrDareScreen from "./screens/TruthOrDareScreen";
import KabaddiGameScreen from "./screens/KabaddiGameScreen";
import KanchaGameScreen from "./screens/KanchaGameScreen";
import GilliDandaGameScreen from "./screens/GilliDandaGameScreen";
import LagoriGameScreen from "./screens/LagoriGameScreen";
import GamesLeaderboardScreen from "./screens/GamesLeaderboardScreen";
import MafiaGameScreen from "./screens/MafiaGameScreen";
import WordChainScreen from "./screens/WordChainScreen";
import BluffQuizScreen from "./screens/BluffQuizScreen";
import BubbleShooterScreen from "./screens/BubbleShooterScreen";

import AudioCallScreen from "./components/AudioCallScreen";
import VideoCallScreen from "./components/VideoCallScreen";
import CoinWalletScreen from "./screens/CoinWalletScreen";
import SocialCalendarScreen from "./screens/SocialCalendarScreen";
import { VeilCurtain } from "./components/VeilCurtain";
import { VeilNotificationManager } from "./components/VeilNotificationManager";
import { StealthManager } from "./components/StealthManager";
import { VoiceRoom } from "./components/VoiceRoom";
import { MinimizedRoomBar } from "./components/MinimizedRoomBar";
import { WorldNotificationBanner } from "./components/WorldNotificationBanner";

function AppContent() {
  // Expose navigate globally so SparkViewer challenge-accept can deep-link
  const navigate = useNavigate();
  React.useEffect(() => {
    (window as any).__skrimNavigate = navigate;
    return () => { delete (window as any).__skrimNavigate; };
  }, [navigate]);

  useAchievementEngine();
  const currentUser = useCurrentUser();
  const tracking = useTrackingStats();
  const location = useLocation();

  return (
    <div className="w-full h-full relative">
      <WorldNotificationBanner />
      <PulseToastManager />
      <StealthManager />
      <AudioCallScreen />
      <VideoCallScreen />
      <VoiceRoom />
      <MinimizedRoomBar />
      <VeilCurtain />
      <VeilNotificationManager />

      <RouteErrorBoundary key={location.pathname}>
        <Routes>
        <Route path="/" element={<PulseScreen />} />
        <Route path="/discover" element={<DiscoverScreen />} />
        <Route path="/nearby" element={<NearbyScreen />} />
        <Route path="/worlds" element={<WorldsScreen />} />
        <Route path="/worlds/activity" element={<WorldActivityScreen />} />
        <Route
          path="/worlds/category/:categoryId"
          element={<WorldCategoryScreen />}
        />
        <Route path="/world/:id" element={<WorldDetailScreen />} />
        <Route
          path="/world/:id/notifications"
          element={<WorldNotificationSettingsScreen />}
        />
        <Route
          path="/world/:id/monetize"
          element={<MonetizationSetupScreen />}
        />
        <Route path="/world/:id/earnings" element={<CreatorEarningsScreen />} />
        <Route
          path="/world/:id/subscription"
          element={<MemberSubscriptionScreen />}
        />
        <Route path="/games/snake" element={<NeonSnakeScreen />} />
        <Route path="/games/tictactoe" element={<TicTacToeScreen />} />
        <Route path="/games/snakesladders" element={<SnakesLaddersScreen />} />
        <Route path="/games/ludo" element={<LudoGameScreen />} />
        <Route path="/games/emoji" element={<EmojiGuessScreen />} />
        <Route path="/games/quiz" element={<QuizBattleScreen />} />
        <Route path="/games/truthdare" element={<TruthOrDareScreen />} />
        <Route path="/games/kabaddi" element={<KabaddiGameScreen />} />
        <Route path="/games/kancha" element={<KanchaGameScreen />} />
        <Route path="/games/gilli" element={<GilliDandaGameScreen />} />
        <Route path="/games/lagori" element={<LagoriGameScreen />} />
        <Route path="/games/leaderboard" element={<GamesLeaderboardScreen />} />
        <Route path="/games/mafia" element={<MafiaGameScreen />} />
        <Route path="/games/wordchain" element={<WordChainScreen />} />
        <Route path="/games/bluffquiz" element={<BluffQuizScreen />} />
        <Route path="/games/bubbleshooter" element={<BubbleShooterScreen />} />
        <Route path="/vibes" element={<VibesScreen />} />
        <Route path="/connect" element={<ConnectScreen />} />
        <Route path="/veil" element={<VeilScreen />} />
        <Route path="/chat/:id" element={<ChatThreadScreen />} />
        <Route path="/group/info" element={<GroupInfoScreen />} />
        <Route path="/identity" element={<IdentityScreen />} />
        <Route path="/profile/:username" element={<OtherUserProfileScreen />} />
        <Route path="/hashtag/:tag" element={<HashtagScreen />} />
        <Route path="/signal" element={<SignalScreen />} />
        <Route path="/communities" element={<Navigate to="/worlds" replace />} />
        <Route path="/creator" element={<CreatorDashboardScreen />} />
        <Route path="/promote" element={<PromoteScreen />} />
        <Route path="/monetization" element={<MonetizationHubScreen />} />
        <Route path="/spark/:sparkId" element={<SparkDetailScreen />} />
        <Route path="/post/:postId" element={<PostDetailScreen />} />
        <Route path="/monetization/tips" element={<TipsManageScreen />} />
        <Route path="/monetization/premium" element={<PremiumManageScreen />} />
        <Route path="/monetization/subscriptions" element={<SubscriptionsManageScreen />} />
        <Route path="/monetization/tickets" element={<TicketsManageScreen />} />
        <Route path="/admin" element={<AdminDashboardScreen />} />
        <Route path="/wallet" element={<CoinWalletScreen />} />
        <Route path="/calendar" element={<SocialCalendarScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RouteErrorBoundary>
      <BottomTabs />

      {currentUser && (
        <BadgeCelebrationManager
          stats={{
            pulseScore: tracking.pulseScore,
            blazeRun: tracking.blazeRun,
            vibeRating: parseFloat(
              localStorage.getItem("skrimchat_vibe_rating") || "9.1",
            ),
            profileViews: parseInt(
              localStorage.getItem("skrimchat_profile_views") || "892",
              10,
            ),
            followers: tracking.followers,
          }}
          username={currentUser?.username?.replace("@", "") || ""}
        />
      )}
    </div>
  );
}

function useWindowDimensions() {
  const [width, setWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return { width };
}

function MainAppLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const currentUser = useCurrentUser();

  if (isDesktop) {
    return (
      <div className="w-full h-full bg-black text-white overflow-hidden flex">
        <div className="w-[80px] lg:w-[240px] hidden lg:flex flex-col h-full border-r border-[#B026FF]/30 bg-[#0A0A0A] shrink-0 z-50">
          <DashboardSidebar />
        </div>

        <div className="flex-1 h-full overflow-hidden bg-black relative border-r border-white/5">
          <AppContent />
        </div>

        <div className="w-[320px] h-full flex flex-col overflow-y-auto no-scrollbar bg-skrim-bg border-l border-white/5 p-4 shrink-0 gap-6">
          <div className="bg-[#141414] rounded-2xl border border-white/5 p-4 flex flex-col shrink-0">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">
              Connect
            </h3>
            <div className="space-y-3">
              {[
                {
                  img: "https://i.pravatar.cc/150?img=12",
                  name: "Marcus K.",
                  msg: "The design looks insane...",
                  active: true,
                },
                {
                  img: "https://i.pravatar.cc/150?img=13",
                  name: "Sarah J.",
                  msg: "Voice note sent 2h ago",
                  active: false,
                },
              ].map((c, i) => (
                <Link
                  key={i}
                  to="/connect"
                  className={`flex items-center justify-between hover:bg-white/5 rounded-lg p-1 -mx-1 transition ${!c.active ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 border border-white/10 overflow-hidden shrink-0">
                      <img
                        src={c.img}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-white">
                        {c.name}
                      </p>
                      <p className="text-[9px] text-white/40 truncate w-24">
                        {c.msg}
                      </p>
                    </div>
                  </div>
                  {c.active && (
                    <span className="text-[8px] text-[#B026FF]">●</span>
                  )}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <Link
                  to="/connect"
                  className="text-xs text-neon-blue hover:underline text-center"
                >
                  View all chats
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0A0A0A] to-[#141414] rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center text-center shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-white/10 flex items-center justify-center mb-2">
              <span className="text-xl opacity-80 mt-0.5">
                <Lock className="w-5 h-5 text-gray-400" />
              </span>
            </div>
            <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">
              Veil Mode
            </h4>
            <p className="text-[9px] text-white/40 px-2 mb-3 leading-tight">
              True End-to-End Encryption Enabled.
            </p>
            <Link
              to="/veil"
              className="text-[9px] text-[#B026FF] font-black border border-[#B026FF]/30 hover:bg-[#B026FF]/10 transition px-3 py-1 rounded-full"
            >
              UNVEIL SECURE
            </Link>
          </div>

          <div className="rounded-2xl border border-white/5 overflow-hidden relative group h-40 shrink-0">
            <img
              src="https://picsum.photos/400/800?random=vibe"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt="vibe"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Link
                to="/vibes"
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:bg-white/30 transition cursor-pointer"
              >
                <span className="text-lg ml-0.5 text-white/90">▶</span>
              </Link>
            </div>
            <div className="absolute bottom-2 left-2">
              <span className="bg-[#00F0FF] text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                Top Vibes
              </span>
            </div>
          </div>
        </div>
        <DashboardSheets />
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="w-full h-full bg-black text-white overflow-hidden flex">
        <div className="w-[240px] flex flex-col h-full border-r border-[#B026FF]/30 bg-[#0A0A0A] shrink-0 z-50">
          <DashboardSidebar />
        </div>
        <div className="flex-1 w-full bg-skrim-bg relative overflow-hidden flex flex-col">
          <AppContent />
        </div>
        <DashboardSheets />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden bg-black flex flex-col">
      <MobileStatsDashboard />
      <div className="flex-1 w-full min-h-0 relative overflow-hidden bg-skrim-bg flex flex-col">
        <AppContent />
      </div>
      <DashboardSheets />
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      {!isAuthenticated ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
          }}
          className="bg-black"
        >
          <div className="w-full h-full relative">
            <AuthScreen />
          </div>
        </div>
      ) : (
        <MainAppLayout />
      )}
    </Router>
  );
}
