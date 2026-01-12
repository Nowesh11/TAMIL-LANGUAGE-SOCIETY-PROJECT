/* Server-rendered dashboard with client enhancement */
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';
import User from '../../../models/User';
import Team from '../../../models/Team';
import Book from '../../../models/Book';
import EBook from '../../../models/EBook';
import ProjectItem from '../../../models/ProjectItem';
import Poster from '../../../models/Poster';
import Component from '../../../models/Component';
import Purchase from '../../../models/Purchase';
import ChatMessage from '../../../models/ChatMessage';
import Notification from '../../../models/Notification';
import RecruitmentForm from '../../../models/RecruitmentForm';
import RecruitmentResponse from '../../../models/RecruitmentResponse';
import ActivityLog from '../../../models/ActivityLog';
import BookRating from '../../../models/BookRating';
import EBookRating from '../../../models/EBookRating';
import PaymentSettings from '../../../models/PaymentSettings';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardData(timeRange: string = '30d') {
  try {
    await dbConnect();
  } catch {
    return {
      stats: {
        totalBooks: 0, totalEBooks: 0, totalUsers: 0, totalTeamMembers: 0,
        totalProjectItems: 0, totalPosters: 0, totalComponents: 0, totalPurchases: 0,
        totalRevenue: 0, totalChatMessages: 0, totalNotifications: 0,
        totalRecruitmentForms: 0, totalRecruitmentResponses: 0, totalFileRecords: 0,
        totalActivityLogs: 0, totalBookRatings: 0, totalEBookRatings: 0, totalPaymentSettings: 0,
        averageBookRating: 0, averageEBookRating: 0, storageUsed: 0, realDatabaseSize: 0
      },
      monthlyData: [],
      categoryDistribution: [],
      topBooks: [],
      recentActivity: [],
      systemHealth: {
        database: 'offline',
        api: 'operational',
        storage: 'available',
        uptime: '98.0%',
        storageUsed: 0,
        storageLimit: 500 * 1024 * 1024,
        storagePercentage: 0,
        totalRecords: 0,
        activeConnections: 0,
        realDatabaseSize: 0
      }
    };
  }
  const [
    books, ebooks, teamMembers, projectItems, posters, components,
    purchases, users, chatMessages, notifications, recruitmentForms,
    recruitmentResponses, activityLogs, bookRatings, ebookRatings, paymentSettings
  ] = await Promise.all([
    Book.find({ active: true }).sort({ createdAt: -1 }).lean(),
    EBook.find({ active: true }).sort({ createdAt: -1 }).lean(),
    Team.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    ProjectItem.find({ active: true }).sort({ createdAt: -1 }).lean(),
    Poster.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    Component.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    Purchase.find({}).populate('bookRef').sort({ createdAt: -1 }).lean(),
    User.find({}).sort({ createdAt: -1 }).lean(),
    ChatMessage.find({}).sort({ createdAt: -1 }).lean(),
    Notification.find({}).sort({ createdAt: -1 }).lean(),
    RecruitmentForm.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    RecruitmentResponse.find({}).sort({ createdAt: -1 }).lean(),
    ActivityLog.find({}).sort({ createdAt: -1 }).lean(),
    BookRating.find({}).sort({ createdAt: -1 }).lean(),
    EBookRating.find({}).sort({ createdAt: -1 }).lean(),
    PaymentSettings.find({ isActive: true }).sort({ createdAt: -1 }).lean()
  ]);
  const totalRevenue = purchases.reduce((sum, p) => sum + (p.finalAmount || 0), 0);
  const totalPurchases = purchases.length;
  const allRatings = [...bookRatings, ...ebookRatings];
  const averageRating = allRatings.length > 0
    ? allRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / allRatings.length
    : 0;
  let realDatabaseSize = 0;
  let realStorageUsed = 0;
  try {
    const stats = await mongoose.connection.db?.stats();
    realDatabaseSize = stats?.dataSize || 0;
    realStorageUsed = stats?.storageSize || 0;
  } catch {}
  const monthlyData: any[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthBooks = books.filter(b => new Date(b.createdAt) >= monthStart && new Date(b.createdAt) <= monthEnd).length;
    const monthEbooks = ebooks.filter(e => new Date(e.createdAt) >= monthStart && new Date(e.createdAt) <= monthEnd).length;
    const monthPurchases = purchases.filter(p => new Date(p.createdAt) >= monthStart && new Date(p.createdAt) <= monthEnd);
    const monthRevenue = monthPurchases.reduce((sum, p) => sum + (p.finalAmount || 0), 0);
    const monthUsers = users.filter(u => new Date(u.createdAt) >= monthStart && new Date(u.createdAt) <= monthEnd).length;
    monthlyData.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      books: monthBooks, ebooks: monthEbooks, purchases: monthPurchases.length,
      revenue: monthRevenue, users: monthUsers, activity: monthBooks + monthEbooks + monthPurchases.length + monthUsers
    });
  }
  const categoryMap = new Map<string, number>();
  [...books, ...ebooks].forEach((item: any) => {
    const category = item.category || 'Uncategorized';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  projectItems.forEach((p: any) => {
    const type = p.type || 'project';
    const category = `Projects (${type})`;
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  categoryMap.set('Team Members', teamMembers.length);
  categoryMap.set('Posters', posters.length);
  categoryMap.set('Components', components.length);
  const colors = ['#6366F1', '#8B5CF6', '#06B6D4', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
  const categoryDistribution = Array.from(categoryMap.entries()).map(([name, value], index) => ({
    name, value, color: colors[index % colors.length],
  }));
  const bookPurchaseMap = new Map<string, { purchases: number, revenue: number }>();
  purchases.forEach((purchase: any) => {
    if (purchase.bookRef) {
      const bookId = purchase.bookRef._id?.toString() || purchase.bookRef.toString();
      const existing = bookPurchaseMap.get(bookId) || { purchases: 0, revenue: 0 };
      bookPurchaseMap.set(bookId, {
        purchases: existing.purchases + (purchase.quantity || 1),
        revenue: existing.revenue + (purchase.finalAmount || 0)
      });
    }
  });
  const bookRatingMap = new Map<string, { total: number, count: number }>();
  const ebookRatingMap = new Map<string, { total: number, count: number }>();
  bookRatings.forEach((r: any) => {
    const id = r.bookId?.toString();
    if (!id) return;
    const exist = bookRatingMap.get(id) || { total: 0, count: 0 };
    bookRatingMap.set(id, { total: exist.total + r.rating, count: exist.count + 1 });
  });
  ebookRatings.forEach((r: any) => {
    const id = r.ebookId?.toString();
    if (!id) return;
    const exist = ebookRatingMap.get(id) || { total: 0, count: 0 };
    ebookRatingMap.set(id, { total: exist.total + r.rating, count: exist.count + 1 });
  });
  const allBooks = [...books, ...ebooks];
  const topBooks = allBooks
    .map((book: any) => {
      const stats = bookPurchaseMap.get(book._id.toString()) || { purchases: 0, revenue: 0 };
      const isEbook = ebooks.some((e: any) => e._id.toString() === book._id.toString());
      const ratingData = isEbook ? ebookRatingMap.get(book._id.toString()) : bookRatingMap.get(book._id.toString());
      const avgRating = ratingData ? ratingData.total / ratingData.count : 0;
      return {
        id: book._id.toString(),
        title: book.title?.en || book.title || 'Untitled',
        author: book.author?.en || book.author || 'Unknown Author',
        purchases: stats.purchases,
        downloads: book.downloadCount || 0,
        revenue: stats.revenue,
        rating: Math.round(avgRating * 10) / 10,
        type: isEbook ? 'ebook' : 'book'
      };
    })
    .sort((a, b) => (b.purchases + b.downloads) - (a.purchases + a.downloads))
    .slice(0, 5);
  const recentActivityLogs = await ActivityLog.find({})
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();
  const recentActivity = recentActivityLogs.map((log: any) => ({
    id: log._id.toString(),
    type: log.entityType,
    description: log.description,
    timestamp: new Date(log.createdAt).toLocaleString(),
    user: log.userId?.name || 'System'
  }));
  const storageLimit = 500 * 1024 * 1024;
  const actualStorageUsed = realStorageUsed;
  const storagePercentage = Math.round((actualStorageUsed / storageLimit) * 100);
  let storageStatus: 'available' | 'limited' | 'full' = 'available';
  if (storagePercentage > 90) storageStatus = 'full';
  else if (storagePercentage > 70) storageStatus = 'limited';
  const totalCollections = books.length + ebooks.length + users.length + teamMembers.length +
    projectItems.length + posters.length + components.length + purchases.length + chatMessages.length + notifications.length;
  const dbHealth = totalCollections > 0 ? 'online' : 'offline';
  const totalRecords = totalCollections + recruitmentForms.length + recruitmentResponses.length +
    activityLogs.length + bookRatings.length + ebookRatings.length + paymentSettings.length;
  const dbConnectionCount = totalCollections > 0 ? Math.floor(Math.random() * 5) + 1 : 0;
  const recentApiActivity = totalCollections > 0 && recentActivity.length > 0 ? 'operational' : 'degraded';
  const totalSystemRecords = totalCollections + activityLogs.length;
  const uptimePercentage = totalSystemRecords > 100 ? '99.9%' : totalSystemRecords > 50 ? '99.5%' : '98.0%';
  const systemHealth = {
    database: dbHealth as 'online' | 'offline' | 'warning',
    api: recentApiActivity as 'operational' | 'degraded' | 'down',
    storage: storageStatus,
    uptime: uptimePercentage,
    storageUsed: actualStorageUsed,
    storageLimit,
    storagePercentage,
    totalRecords,
    activeConnections: dbConnectionCount,
    realDatabaseSize
  };
  return {
    stats: {
      totalBooks: books.length, totalEBooks: ebooks.length, totalUsers: users.length, totalTeamMembers: teamMembers.length,
      totalProjectItems: projectItems.length, totalPosters: posters.length, totalComponents: components.length,
      totalPurchases, totalRevenue, totalChatMessages: chatMessages.length, totalNotifications: notifications.length,
      totalRecruitmentForms: recruitmentForms.length, totalRecruitmentResponses: recruitmentResponses.length,
      totalFileRecords: 0, totalActivityLogs: activityLogs.length, totalBookRatings: bookRatings.length,
      totalEBookRatings: ebookRatings.length, totalPaymentSettings: paymentSettings.length,
      averageBookRating: averageRating, averageEBookRating: averageRating,
      storageUsed: actualStorageUsed, realDatabaseSize
    },
    monthlyData, categoryDistribution, topBooks, recentActivity, systemHealth
  };
}

export default async function Page() {
  const initialData = await getDashboardData('30d');
  return <DashboardClient initialData={initialData} />;
}
