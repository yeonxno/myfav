import { HomeScreen } from "../screens/HomeScreen";
import { HomeReturnScreen } from "../screens/HomeReturnScreen";
import { InputScreen } from "../screens/InputScreen";
import { AnalysisScreen } from "../screens/AnalysisScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { TranslateScreen } from "../screens/TranslateScreen";
import { DetailScreen } from "../screens/DetailScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { ShareScreen } from "../screens/ShareScreen";
import { ArchiveScreen } from "../screens/ArchiveScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { TermsScreen } from "../screens/TermsScreen";
import { PrivacyScreen } from "../screens/PrivacyScreen";
import { useCurrentScreen } from "./ScreenStack";
import { ScreenId } from "./types";

/** 현재 스택 최상단 화면만 그린다(단순 스택 네비게이터). */
export function ScreenRenderer() {
  const entry = useCurrentScreen();

  switch (entry.screen) {
    case ScreenId.Home:
      return <HomeScreen />;
    case ScreenId.HomeReturn:
      return <HomeReturnScreen />;
    case ScreenId.Input:
      return <InputScreen key={entry.key} />;
    case ScreenId.Analysis:
      return <AnalysisScreen key={entry.key} />;
    case ScreenId.Profile:
      return <ProfileScreen key={entry.key} />;
    case ScreenId.Translate:
      return <TranslateScreen key={entry.key} />;
    case ScreenId.Detail:
      return <DetailScreen key={entry.key} />;
    case ScreenId.Feedback:
      return <FeedbackScreen key={entry.key} />;
    case ScreenId.Share:
      return <ShareScreen key={entry.key} />;
    case ScreenId.Archive:
      return <ArchiveScreen />;
    case ScreenId.About:
      return <AboutScreen />;
    case ScreenId.Terms:
      return <TermsScreen />;
    case ScreenId.Privacy:
      return <PrivacyScreen />;
    default:
      return null;
  }
}
