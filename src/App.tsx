import { Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppRouter } from "./Router";
import Spinner from "./components/ui/spinner";
import { Toaster } from "react-hot-toast";

//Para el chatbot
import { useEffect } from 'react';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';


function App() {

  useEffect(() => {
		createChat({
      webhookUrl: 'http://localhost:5678/webhook/9f423f7b-94ac-4873-a991-05ecb4b67cb7/chat',
      webhookConfig: {
        method: 'POST',
        headers: {}
      },
      target: '#n8n-chat',
      mode: 'window',
      chatInputKey: 'chatInput',
      chatSessionKey: 'sessionId',
      loadPreviousSession: true,
      metadata: {},
      showWelcomeScreen: false,
      defaultLanguage: 'en',
      initialMessages: [
        'Hi there! 👋',
        'My name is Nathan. How can I assist you today?'
      ],
      i18n: {
        en: {
          title: 'Hi there! 👋',
          subtitle: "Start a chat. We're here to help you 24/7.",
          footer: '',
          getStarted: 'New Conversation',
          inputPlaceholder: 'Type your question..',
          closeButtonTooltip: 'Close chat',
        },
      },
      enableStreaming: false,
    });
	}, []);

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
