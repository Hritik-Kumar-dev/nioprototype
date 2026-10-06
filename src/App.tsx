import { TopHeaderPanel } from "./components/TopHeaderPanel";
import { PhoneFlow } from "./components/PhoneFlow";
import { ComparisonCards } from "./components/ComparisonCards";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <TopHeaderPanel />
        <PhoneFlow />
        <ComparisonCards />
      </main>
    </div>
  );
}

export default App;