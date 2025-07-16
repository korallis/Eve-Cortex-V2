# Environment Configuration

## Important: NODE_ENV

**DO NOT set NODE_ENV in your environment files**. Next.js automatically sets NODE_ENV based on the command you run:

- `next dev` sets `NODE_ENV=development`
- `next build` sets `NODE_ENV=production`
- `next start` sets `NODE_ENV=production`

Setting NODE_ENV manually in `.env` files can cause build errors and unexpected behavior.

## Environment Files

### Development (.env.local)

For local development, create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Then update the values with your local configuration.

### Production (.env.production.local)

For production deployments, use environment variables provided by your hosting platform (Vercel, AWS, etc.) or create a `.env.production.local` file based on `.env.production.example`.

## Required Environment Variables

### Next.js Configuration
- `NEXTAUTH_URL`: The full URL of your application
- `NEXTAUTH_SECRET`: A secret key for NextAuth.js (generate a secure one for production)

### EVE Online ESI API
- `EVE_CLIENT_ID`: Your EVE Online application client ID
- `EVE_CLIENT_SECRET`: Your EVE Online application client secret

### Database
- `DATABASE_URL`: PostgreSQL connection string

### Redis
- `REDIS_URL`: Redis connection string

### Application
- `APP_URL`: The full URL of your application (same as NEXTAUTH_URL)
- `LOG_LEVEL`: Logging level (info for development, error for production)

## Best Practices

1. **Never commit `.env.local` or `.env.production.local` files**
2. **Use strong, unique secrets in production**
3. **Rotate secrets regularly**
4. **Use environment variables from your hosting platform when possible**
5. **Do not set NODE_ENV manually**