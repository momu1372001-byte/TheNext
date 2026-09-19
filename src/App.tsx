import SettingsScreen from "./SettingsScreen";
import { useSettings } from "./useSettings";

export default function App() {
  const { settings, update, reset } = useSettings();

  return (
    <div className={settings.darkMode ? "theme-dark" : "theme-light"}>
      <SettingsScreen settings={settings} onUpdate={update} onReset={reset} />
    </div>
  );
}
