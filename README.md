# Eve-Cortex

**AI-Powered EVE Online Optimization Platform**

Eve-Cortex is a comprehensive web platform that leverages the EVE Online ESI API to provide AI-powered optimization recommendations for players. The platform combines real-time game data with advanced algorithms to deliver personalized ship fitting recommendations, career guidance, and strategic optimization across all aspects of EVE Online gameplay.

## 🚀 Features

- **AI-Powered Ship Fitting**: Personalized ship fittings optimized for your character's skills and implants
- **Intelligent Skill Planning**: Optimal skill training queues based on your career goals
- **Market Analysis**: Real-time market data analysis and profit opportunity identification
- **Mission Optimization**: Enemy analysis and optimal fittings for specific mission types
- **ESI Integration**: Seamless integration with EVE Online's official API
- **Real-time Updates**: Live character data synchronization and market monitoring

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom Eve-Cortex theme
- **Authentication**: NextAuth.js with EVE Online ESI OAuth
- **Database**: PostgreSQL with postgres.js client
- **Cache**: Redis with ioredis client
- **UI Components**: Headless UI, Heroicons, Framer Motion
- **Testing**: Jest, Testing Library
- **Deployment**: Vercel (recommended)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── sections/          # Landing page sections
│   └── ui/                # Reusable UI components
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── styles/                # Global styles and themes
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- EVE Online Developer Application (ESI credentials)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/korallis/Eve-Cortex-V2.git
   cd Eve-Cortex-V2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   - `EVE_CLIENT_ID`: Your EVE Online application client ID
   - `EVE_CLIENT_SECRET`: Your EVE Online application client secret
   - `DATABASE_URL`: PostgreSQL connection string
   - `REDIS_URL`: Redis connection string
   - `NEXTAUTH_SECRET`: Random secret for NextAuth.js

4. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development

### Code Quality

- **ESLint**: `npm run lint`
- **Prettier**: `npm run format`
- **Type Checking**: `npm run type-check`

### Database Operations

- **Run Migrations**: `npm run db:migrate`
- **Seed Database**: `npm run db:seed`

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 🔐 ESI Configuration

To use Eve-Cortex, you need to create an EVE Online developer application:

1. Go to [EVE Online Developers](https://developers.eveonline.com/)
2. Create a new application
3. Set the callback URL to: `http://localhost:3000/api/auth/callback/eveonline`
4. Request the following scopes:
   - `esi-characters.read_characters.v1`
   - `esi-skills.read_skills.v1`
   - `esi-assets.read_assets.v1`
   - `esi-wallet.read_character_wallet.v1`
   - `esi-location.read_location.v1`
   - `esi-markets.read_character_orders.v1`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- CCP Games for the EVE Online ESI API
- The EVE Online community for inspiration and feedback
- All contributors who help make Eve-Cortex better

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/korallis/Eve-Cortex-V2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/korallis/Eve-Cortex-V2/discussions)
- **Discord**: [Eve-Cortex Community](https://discord.gg/eve-cortex)

---

**Eve-Cortex** - *Optimize your EVE Online experience with AI-powered intelligence.*