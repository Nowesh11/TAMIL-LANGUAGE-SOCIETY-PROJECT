import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DashboardExportData {
  totalBooks: number;
  totalEbooks: number;
  totalTeamMembers: number;
  totalProjectItems: number;
  totalPosters: number;
  totalComponents: number;
  totalPurchases: number;
  totalRevenue: number;
  averageRating: number;
  activeUsers: number;
  totalChatMessages: number;
  unreadNotifications: number;
  activeRecruitmentForms: number;
  totalRecruitmentResponses: number;
  totalFileRecords: number;
  totalStorageUsed: number;
  totalActivityLogs: number;
  totalRatings: number;
  recentActivity: any[];
  monthlyData: any[];
  categoryDistribution: any[];
  topBooks: any[];
  systemHealth: any;
}

export class PDFExporter {
  private pdf: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = 20;
    this.margin = 20;
  }

  private addHeader(title: string) {
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 15;

    // Add date and time
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const now = new Date();
    this.pdf.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, this.margin, this.currentY);
    this.currentY += 10;

    // Add line separator
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private checkPageBreak(requiredSpace: number = 20) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addSection(title: string, content: string[]) {
    this.checkPageBreak(30);
    
    // Section title
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 10;

    // Section content
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    content.forEach(line => {
      this.checkPageBreak();
      this.pdf.text(line, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 5;
  }

  private addTable(headers: string[], rows: string[][]) {
    this.checkPageBreak(50);
    
    const colWidth = (this.pageWidth - 2 * this.margin) / headers.length;
    let startX = this.margin;

    // Table headers
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      this.pdf.text(header, startX + (index * colWidth), this.currentY);
    });
    this.currentY += 8;

    // Table rows
    this.pdf.setFont('helvetica', 'normal');
    rows.forEach(row => {
      this.checkPageBreak();
      row.forEach((cell, index) => {
        this.pdf.text(cell, startX + (index * colWidth), this.currentY);
      });
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  public async exportDashboardData(data: DashboardExportData): Promise<void> {
    // Header
    this.addHeader('Tamil Language Society - Dashboard Report');

    // System Overview
    const systemOverview = [
      `Total Books: ${data.totalBooks}`,
      `Total E-Books: ${data.totalEbooks}`,
      `Team Members: ${data.totalTeamMembers}`,
      `Project Items: ${data.totalProjectItems}`,
      `Total Posters: ${data.totalPosters}`,
      `Components: ${data.totalComponents}`,
      `Total Purchases: ${data.totalPurchases}`,
      `Total Revenue: ₹${data.totalRevenue.toLocaleString()}`,
      `Average Rating: ${data.averageRating.toFixed(1)}/5.0`,
      `Active Users: ${data.activeUsers}`
    ];
    this.addSection('System Overview', systemOverview);

    // Communication & Engagement
    const communication = [
      `Chat Messages: ${data.totalChatMessages}`,
      `Unread Notifications: ${data.unreadNotifications}`,
      `Activity Logs: ${data.totalActivityLogs}`,
      `Total Ratings: ${data.totalRatings}`
    ];
    this.addSection('Communication & Engagement', communication);

    // Recruitment & HR
    const recruitment = [
      `Active Recruitment Forms: ${data.activeRecruitmentForms}`,
      `Total Applications: ${data.totalRecruitmentResponses}`
    ];
    this.addSection('Recruitment & HR', recruitment);

    // File Management
    const fileManagement = [
      `File Records: ${data.totalFileRecords}`,
      `Storage Used: ${(data.totalStorageUsed / (1024 * 1024)).toFixed(2)} MB`
    ];
    this.addSection('File Management', fileManagement);

    // System Health
    const systemHealth = [
      `Database Status: ${data.systemHealth.database}`,
      `API Status: ${data.systemHealth.api}`,
      `Storage Status: ${data.systemHealth.storage}`,
      `System Uptime: ${data.systemHealth.uptime}`,
      `CPU Usage: ${data.systemHealth.cpu}%`,
      `Memory Usage: ${data.systemHealth.memory}%`
    ];
    this.addSection('System Health', systemHealth);

    // Top Books/E-Books
    if (data.topBooks && data.topBooks.length > 0) {
      const topBooksHeaders = ['Title', 'Author', 'Type', 'Downloads', 'Revenue', 'Rating'];
      const topBooksRows = data.topBooks.slice(0, 10).map(book => [
        book.title.length > 25 ? book.title.substring(0, 25) + '...' : book.title,
        book.author.length > 20 ? book.author.substring(0, 20) + '...' : book.author,
        book.type,
        book.downloads.toString(),
        `₹${book.revenue}`,
        book.rating.toFixed(1)
      ]);
      
      this.checkPageBreak(60);
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Top Performing Content', this.margin, this.currentY);
      this.currentY += 10;
      
      this.addTable(topBooksHeaders, topBooksRows);
    }

    // Recent Activity
    if (data.recentActivity && data.recentActivity.length > 0) {
      const activityHeaders = ['Type', 'Action', 'Description', 'Time'];
      const activityRows = data.recentActivity.slice(0, 15).map(activity => [
        activity.type,
        activity.action,
        activity.title.length > 30 ? activity.title.substring(0, 30) + '...' : activity.title,
        new Date(activity.timestamp).toLocaleDateString()
      ]);
      
      this.checkPageBreak(60);
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Recent Activity', this.margin, this.currentY);
      this.currentY += 10;
      
      this.addTable(activityHeaders, activityRows);
    }

    // Category Distribution
    if (data.categoryDistribution && data.categoryDistribution.length > 0) {
      const categoryHeaders = ['Category', 'Count', 'Percentage'];
      const total = data.categoryDistribution.reduce((sum, cat) => sum + cat.value, 0);
      const categoryRows = data.categoryDistribution.map(category => [
        category.name,
        category.value.toString(),
        `${((category.value / total) * 100).toFixed(1)}%`
      ]);
      
      this.checkPageBreak(60);
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Content Distribution', this.margin, this.currentY);
      this.currentY += 10;
      
      this.addTable(categoryHeaders, categoryRows);
    }

    // Footer
    const totalPages = (this.pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(
        `Page ${i} of ${totalPages} - Tamil Language Society Dashboard Report`,
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  public async exportElementAsPDF(elementId: string, filename: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    this.pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      this.pdf.addPage();
      this.pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  }

  public save(filename: string): void {
    this.pdf.save(filename);
  }

  public getBlob(): Blob {
    return this.pdf.output('blob');
  }
}

// Utility functions
export const exportDashboardToPDF = async (data: DashboardExportData): Promise<void> => {
  const exporter = new PDFExporter();
  await exporter.exportDashboardData(data);
  exporter.save(`dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportElementToPDF = async (elementId: string, filename?: string): Promise<void> => {
  const exporter = new PDFExporter();
  const defaultFilename = `${elementId}-export-${new Date().toISOString().split('T')[0]}.pdf`;
  await exporter.exportElementAsPDF(elementId, filename || defaultFilename);
  exporter.save(filename || defaultFilename);
};