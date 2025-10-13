# Tamil Language Society Website | தமிழ் மொழி சங்கம்

A modern, bilingual website built with Next.js 14 for the Tamil Language Society, promoting Tamil language, culture, and heritage through community engagement.

## 🚀 Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for modern styling
- **MongoDB** with Mongoose for database operations
- **Bilingual support** (English & Tamil)
- **SEO optimized** with comprehensive metadata
- **Responsive design** for all devices

## 📁 Project Structure

```
tamil-language-society/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout with bilingual metadata
│   │   └── page.tsx        # Home page
│   ├── components/         # Reusable React components
│   ├── lib/               # Utility functions and configurations
│   │   └── mongodb.ts     # MongoDB connection setup
│   └── models/            # Database models (Mongoose schemas)
├── public/                # Static assets
├── .env.example          # Environment variables template
├── .env.local           # Local environment variables
└── global.d.ts          # Global TypeScript definitions
```

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   cd tamil-language-society
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your MongoDB connection string and other configuration values.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

The project uses MongoDB with Mongoose. Make sure you have:

1. **MongoDB installed locally** or a **MongoDB Atlas account**
2. **Update the MONGODB_URI** in your `.env.local` file:
   - Local: `mongodb://localhost:27017/tamil-language-society`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/tamil-language-society`

## 🌐 Environment Variables

Key environment variables (see `.env.example` for complete list):

- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET` - Secret key for authentication
- `NODE_ENV` - Environment (development/production)

## 🎨 Styling

The project uses **Tailwind CSS v4** with:
- Custom CSS variables for theming
- Dark mode support
- Responsive design utilities
- Tamil font support ready

## 📱 Bilingual Support

The website supports both English and Tamil:
- **Metadata** includes both languages
- **SEO optimization** for multilingual content
- **Language alternates** configured in layout
- **Ready for i18n implementation**

## 🚀 Deployment

The project is ready for deployment on platforms like:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**

Make sure to set up your environment variables in your deployment platform.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is created for the Tamil Language Society community.

---

**Built with ❤️ for the Tamil community | தமிழ் சமூகத்திற்காக அன்புடன் உருவாக்கப்பட்டது**
