import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PersonasPage from "./pages/Personas";
import PersonaDetailPage from "./pages/PersonaDetail";
import ChatPage from "./pages/Chat";
import FeedPage from "./pages/Feed";
import GraphPage from "./pages/Graph";
import ProfilePage from "./pages/Profile";
import MarketplacePage from "./pages/Marketplace";
import AppLayout from "./components/AppLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/app">
        {() => (
          <AppLayout>
            <Switch>
              <Route path="/app/personas" component={PersonasPage} />
              <Route path="/app/personas/:id" component={PersonaDetailPage} />
              <Route path="/app/chat" component={ChatPage} />
              <Route path="/app/chat/:conversationId" component={ChatPage} />
              <Route path="/app/feed" component={FeedPage} />
              <Route path="/app/graph" component={GraphPage} />
              <Route path="/app/profile" component={ProfilePage} />
              <Route path="/app/marketplace" component={MarketplacePage} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        )}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.12 0.018 265)",
                border: "1px solid oklch(0.22 0.02 265)",
                color: "oklch(0.93 0.01 265)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
