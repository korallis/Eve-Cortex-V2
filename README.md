# Eve-Cortex

**AI-Powered EVE Online Optimization Platform**

Eve-Cortex is a comprehensive web platform that leverages the EVE Online ESI API to provide AI-powered optimization recommendations for players. The platform combines real-time game data with advanced algorithms to deliver personalized ship fitting recommendations, career guidance, and strategic optimization across all aspects of EVE Online gameplay.

## 🚀 Features

### Core Optimization Features

- **AI-Powered Ship Fitting**: Personalized ship fittings optimized for your character's skills and implants
- **Intelligent Skill Planning**: Optimal skill training queues based on your career goals
- **Market Analysis**: Real-time market data analysis and profit opportunity identification
- **Mission Optimization**: Enemy analysis and optimal fittings for specific mission types
- **ESI Integration**: Seamless integration with EVE Online's official API
- **Real-time Updates**: Live character data synchronization and market monitoring

### Brand & Design System

- **Comprehensive Brand Identity**: Complete visual identity system with Eve-Cortex branding
- **Interactive Brand Showcase**: Live demonstration of design system components and guidelines
- **Custom Color Palette**: Cortex Blue (#0066FF), Neural Purple (#6B46C1), EVE Gold (#FFB800)
- **Typography System**: Inter font family with responsive scaling
- **Custom Icon Set**: Purpose-built icons for EVE Online optimization features
- **Dark Theme Design**: Optimized for extended gaming sessions

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
eve-cortex/
├── .github/workflows/      # CI/CD pipeline configurations
├── .husky/                # Git hooks (pre-commit)
├── .kiro/                 # Kiro IDE configurations
│   ├── settings/          # IDE settings
│   ├── specs/            # Feature specifications
│   └── steering/         # AI assistant guidance rules
├── src/                   # Source code
│   ├── app/              # Next.js App Router pages
│   │   ├── brand/        # Brand showcase page
│   │   ├── globals.css   # Global styles with custom theme
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── brand-showcase.tsx  # Interactive brand system demo
│   │   ├── sections/     # Landing page sections
│   │   │   ├── hero-section.tsx
│   │   │   ├── features-section.tsx
│   │   │   ├── cta-section.tsx
│   │   │   └── stats-section.tsx
│   │   └── ui/           # Reusable UI components
│   │       ├── button.tsx
│   │       └── container.tsx
│   ├── lib/              # Utility functions and configurations
│   │   └── utils.ts      # Common utilities (cn, formatters)
│   ├── types/            # TypeScript type definitions
│   └── hooks/            # Custom React hooks
├── public/               # Static assets
│   └── brand/           # Brand assets
│       ├── logos/       # Logo variations (SVG)
│       ├── icons/       # Custom icons
│       └── social/      # Social media assets
├── tailwind.config.js    # Tailwind CSS with Eve-Cortex theme
├── next.config.js        # Next.js configuration
└── package.json          # Dependencies and scripts
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

### Brand Showcase

To view the comprehensive brand system and design guidelines:

1. Navigate to [http://localhost:3000/brand](http://localhost:3000/brand)
2. Explore the interactive brand showcase featuring:
   - Logo variations and usage guidelines
   - Complete color palette with hex codes
   - Typography system demonstration
   - Custom icon set
   - UI component examples
   - Gradient and styling patterns

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

### GitHub Repository Management

- **Setup Branch Protection**: `npm run github:setup-protection`
- **Check Protection Status**: `npm run github:protection-status`

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

**Eve-Cortex** - _Optimize your EVE Online experience with AI-powered intelligence._
