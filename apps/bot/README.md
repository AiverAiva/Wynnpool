# wynnpool-bot

A Discord bot for wynnpool

## Getting Started

1. **Fork the repository**  
    Click "Fork" on GitHub to create your own copy.

2. **Clone your fork and install dependencies**
    ```bash
    git clone https://github.com/YOUR_USERNAME/wynnpool-bot.git
    cd wynnpool-bot
    npm install
    ```

3. **Set up environment variables**
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and set:
    - `DISCORD_TOKEN` — Your Discord bot token
    - `CLIENT_ID` — Your bot's application/client ID

## Discord Bot Setup

- **Permissions:**  
  The bot requires the "Application Command" permission.

- **Intents:**  
  Enable the following intents in the Discord Developer Portal:
  - Presence Intent
  - Server Members Intent
  - Message Intent

## License

MIT