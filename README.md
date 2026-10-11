# HackNC2026
# The Promise Tracker

The Promise Tracker helps people keep track of commitments made in everyday conversations. Instead of rereading long message threads, users can extract promises, identify who made them, and capture deadlines when they are available.

## The Problem

People make casual commitments over text all the time-sending notes, sharing slides, returning something, or following up later. These promises can get buried in conversations and be forgotten. The Promise Tracker is designed to turn those messages into clear, reviewable commitments.

## Features

- **AI-powered promise extraction:** Analyze pasted conversation text to find concrete commitments.
- **Promise details:** Extract a short description, the person who made the promise, and a deadline when one can be determined.
- **Reviewable drafts:** Extracted promises are returned as drafts so the website can review and decide what to save.
- **Screenshot input in the extraction API:** The backend supports image input, such as a chat screenshot, in addition to pasted text.
- **Conversation-aware tracking:** The shared Gemini logic also supports a chat-bot workflow that can recognize new commitments and detect when existing promises are completed.
- **Reminder and chat commands:** The iMessage bot code includes commands to list open promises and mark a promise complete.

> Some features are implemented in separate backend or bot code and may require configuration before they can run. See the setup instructions below.

## Tech Stack

- **React** — frontend UI and reusable components
- **TypeScript** — typed frontend and backend code
- **Vite** — local frontend development server and build tool
- **CSS** — page styling
- **Google Gemini API (`@google/genai`)** — language-model-based promise extraction with structured JSON responses
- **Node.js** — local API server runtime
- **Firebase** — Firebase Authentication/Firestore client integration, Hosting, and Cloud Functions configuration
- **Spectrum TypeScript SDK (`spectrum-ts`)** — iMessage bot integration
- **Git and GitHub** — version control and team collaboration

## AI Tools and How We Used Them

### Google Gemini
Gemini is the generative AI model used by the application. The backend sends conversation text (and, where supported, a screenshot) with instructions and a JSON schema. Gemini returns structured promise information, including:
- who made the promise;
- a concise description of the commitment;
- a deadline, when one can be inferred;
- a confidence score used to filter low-confidence results.

The backend converts the accepted results into promise drafts. For chat-based tracking, the same Gemini logic can also identify promises completed by a recent message.

### Claude and ChatGPT
Claude and ChatGPT were used as AI-assisted development tools to support the building process—for example, helping with boilerplate/scaffolding, brainstorming implementation approaches, explaining code, and troubleshooting errors. They supported development; **Gemini is the model integrated into the project's promise-extraction functionality**.

## Repository Structure

```text
HackNC2026/
├── bot/                         # iMessage bot, chat history, storage, reminders
│   ├── index.ts                 # Reads messages, runs commands, tracks promises
│   ├── history.ts               # Recent conversation history
│   ├── reminders.ts             # Reminder scheduling logic
│   └── store.ts                 # Bot-side promise storage/status updates
├── functions/
│   └── src/index.ts             # Firebase Cloud Function API endpoint
├── server/
│   ├── gemini.ts                # Gemini prompts, schemas, extraction, draft conversion
│   ├── extract.ts               # Validates requests and handles /api/extract
│   ├── index.ts                 # Local development API server
│   ├── config.ts                # Model/timezone/threshold configuration
│   ├── playground.html          # Manual API testing page
│   └── testsuite/               # Extractor tests
├── src/
│   ├── components/              # React UI components
│   ├── services/                # Firebase and promise API services
│   ├── types/promise.ts         # Promise data types
│   ├── utils/dateUtils.ts       # Date/deadline helpers
│   ├── App.tsx                  # Main application UI
│   └── main.tsx                 # React entry point
├── firebase.json                # Firebase Hosting and Functions configuration
├── firestore.rules              # Firestore security rules
├── package.json                 # Scripts and dependencies
└── .env.example                 # Environment variable template
```

## Code Functionality

### Frontend (`src/`)
The React application provides the user-facing interface. Components are organized under `src/components/`, shared promise types are defined in `src/types/promise.ts`, and service modules connect the interface to Firebase and the promise-extraction API.

### Promise extraction (`server/`)
- `gemini.ts` defines the model instructions and JSON schemas, calls Gemini, and transforms model results into typed promise drafts.
- `extract.ts` validates incoming text or image data and exposes the extraction handler used by both the local server and Firebase Function.
- `index.ts` runs the local API server.
- The extraction endpoint is `POST /api/extract`. It accepts pasted text and/or an image data URL and returns a JSON object containing promise drafts. Drafts are not automatically saved by this endpoint.

### iMessage bot (`bot/`)
The bot listens for incoming text messages, keeps recent chat history, asks the shared Gemini logic to identify new promises or completed commitments, stores updates, and sends responses. It supports `list` to display open promises and `done <number>` to mark a listed promise complete.

### Firebase (`functions/`, `firebase.json`, `src/services/`)
Firebase configuration supports hosting and a Cloud Function for the extraction API. The frontend also contains Firebase service modules. Firebase features require the appropriate project configuration and credentials.

## Getting Started

### Requirements
- Node.js and npm
- A Google Gemini API key for AI extraction
- Firebase project credentials only if running/deploying Firebase features
- Spectrum credentials only if running the iMessage bot

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
TIMEZONE=America/New_York
PORT=3001
```

Do not commit `.env` or API keys to GitHub. For Firebase Functions deployment, configure the environment in the way described in `server/README.md`.

### Run the frontend and local API

Open two terminal sessions from the repository root.

**Terminal 1 — start the API server:**

```bash
npm run server
```

The API runs at `http://localhost:3001` and requires `GEMINI_API_KEY` in `.env`.

**Terminal 2 — start the Vite frontend:**

```bash
npm run dev
```

Open the local URL printed by Vite. Vite is configured to forward `/api/*` requests to the local API server.

### Other useful commands

```bash
npm run build             # Type-check and build the frontend
npm run lint              # Run ESLint
npm run typecheck:server  # Type-check server code
npm run test:extractor    # Run the extractor test script (requires .env)
npm run bot               # Start the iMessage bot (requires Spectrum credentials)
npm run emulate           # Build and run Firebase emulators
npm run deploy            # Deploy Firebase resources
```

## Privacy and Reliability Notes

- Conversation content is sent to Gemini for analysis when extraction is requested.
- Phone numbers are not used as the identifier for pasted-conversation extraction in the current prompt; the extraction logic sets `promisorPhone` to `null` for that workflow. For chat-based tracking, the model can use a phone number when a sender's name is unavailable.
- AI extraction can be uncertain. Users should review extracted people, commitments, and deadlines before relying on them.
- Keep API keys and credentials private and out of version control.

## What's Next

Potential next steps include improving participant identification across messaging formats, letting users correct ambiguous names, improving deadline handling, and making it easier to review and save extracted promises.

---

Built at HackNC 2026.
