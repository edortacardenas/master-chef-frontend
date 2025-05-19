import { Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppRouter } from "./Router";
import Spinner from "./components/ui/spinner";
import { Toaster } from "react-hot-toast";



function App() {

  return (
    <> <Toaster
    position="top-right"
    toastOptions={{
      success: {
        style: {
          background: "green",
          color: "white",
        },
      },
      error: {
        style: {
          background: "red",
          color: "white",
        },
      },
    }}/>
    
    <Router>
      <Suspense fallback={<Spinner/>}>
        <AppRouter />
      </Suspense>
    </Router>
    </>
  ) 
}

export default App
