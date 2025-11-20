# AI<>DEA v3.0

![AI : DEA](https://github.com/user-attachments/assets/46a2f15e-c698-4ab8-b6fa-e830dbe7bfb9)

An all-new assistant that brings your AI<>DEA into a working reality. Now powered by **React + Vite** for a modern, robust experience.

> **⚠️ BETA NOTICE**: The Front Page (Landing Page) is currently in **BETA**. We are actively working on polishing the visual experience. The Agent Interface is fully functional.

## 🚀 Features (v3.0)

- **Browser Mode**: New web search capability that injects relevant results into the AI context.
- **Advanced AI Chat Interface**: Powered by OpenRouter API with custom Temper-1 model integration.
- **Multi-Modal AI Models**: Support for Temper-1 and Temper-1 Colossus models with thinking animations.
- **Intelligent Document Processing**: Upload and process PDF files, ebooks, and images with AI analysis.
- **Professional Canvas Drawing**: Built-in drawing canvas with **persistence** (drawings stay intact when switching views).
- **Smart Note-Taking System**: Integrated note-taking with image attachments and AI response mirroring.
- **Modern Responsive UI**: Clean, adaptive design with syntax highlighting for 15+ programming languages.
- **Persistent Storage**: Local storage for chat history, notes, and drawings.

## 🛠️ Prerequisites

- Node.js (v16 or higher)
- A modern web browser (Chrome, Firefox, Safari, Edge)
- An OpenRouter API key (free tier available)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-dea.git
   cd ai-dea
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - Create a `.env` file in the root directory (optional, or configure directly in `src/lib/apiService.js` for dev).
   - See **API Key Setup** below.

4. **Launch the application**
   ```bash
   npm run dev
   ```
   - Open `http://localhost:5173` in your browser.

## 🔑 API & Search Setup

### OpenRouter API
1. Open `src/lib/apiService.js`.
2. Replace the `apiKey` property with your OpenRouter key:
   ```javascript
   this.apiKey = 'sk-or-v1-your-key-here';
   ```

### Browser Mode (Search)
1. Open `src/lib/searchService.js`.
2. Configure your search provider API key (e.g., Google Custom Search, Serper) to enable real search results.
   - *Note*: By default, it uses a mock service for demonstration.

## 🎯 Usage

### Navigation
- **Home**: Landing page (Beta).
- **Agent**: The main interface (`/agent`).

### AI Chat Interface
- **Browser Mode**: Click the **Globe icon** to enable web search context for your queries.
- **Messaging**: Type in the input field and press Enter.
- **File Attachments**: Use the paper clip for images, book icon for PDFs.
- **Model Selection**: Switch between Temper-1 and Temper-1 Colossus.

### Canvas Drawing
- **Tools**: Pen, pencil, brush, eraser.
- **Persistence**: Your drawing is saved automatically when you switch tabs (e.g., to check AI response) and restored when you return.
- **Clear**: Use the trash bin icon to reset the canvas.

## 📁 Project Structure

```
ai-dea/
├── src/
│   ├── pages/
│   │   ├── Home.jsx        # Landing page (Beta)
│   │   ├── Agent.jsx       # Main AI interface
│   │   └── Pricing.jsx     # Pricing page
│   ├── lib/
│   │   ├── agentApp.js     # Main controller logic
│   │   ├── apiService.js   # OpenRouter API communication
│   │   ├── searchService.js# Browser Mode search logic
│   │   ├── uiComponents.js # UI rendering and canvas logic
│   │   └── storageService.js # Local storage management
│   ├── styles/
│   │   └── agent.css       # Agent interface styling
│   ├── components/         # Shared React components
│   ├── main.jsx            # App entry point
│   └── App.jsx             # Routing configuration
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

## 🔄 Version History

- **v3.0.0** - **Browser Mode & React Migration**
  - **New**: Browser Mode for web search integration.
  - **New**: Fully migrated to React + Vite architecture.
  - **Fix**: Canvas drawing now persists across view switches.
  - **Update**: UI cleanup (removed unused buttons, refined styling).
  - **Beta**: Front page redesign in progress.

- **v2.0.0** - **Agent Interface**
  - Complete modular architecture.
  - Advanced Temper-1 model integration.
  - Professional canvas drawing.

---

**Made with ❤️ for the developer community**
