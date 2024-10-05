import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Theme } from "@radix-ui/themes";
import { ProposalsContextProvider } from "./context/proposalsContext.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Theme>
            <ProposalsContextProvider>
                <App />
            </ProposalsContextProvider>
        </Theme>
    </StrictMode>
);
