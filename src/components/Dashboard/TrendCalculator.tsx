import { BlogPost } from '../../types/blog';
import { ProjectPost } from '../../types/project';

export class TrendCalculator {
  /**
   * Calculate trend for blog posts based on creation date
   * @param posts Array of blog posts
   * @param days Number of days to look back (default: 30)
   * @returns Trend percentage as string (e.g., "+25%", "-10%", "0%")
   */
  static calculatePostsTrend(posts: BlogPost[], days: number = 30): string {
    const currentDate = new Date();
    const lookBackDate = new Date(currentDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const recentPosts = posts.filter(post => 
      new Date(post.createdAt) > lookBackDate
    );
    const olderPosts = posts.filter(post => 
      new Date(post.createdAt) <= lookBackDate
    );
    
    if (olderPosts.length === 0) {
      return recentPosts.length > 0 ? '+100%' : '0%';
    }
    
    const growthRate = ((recentPosts.length / olderPosts.length) * 100) - 100;
    return growthRate >= 0 ? `+${Math.round(growthRate)}%` : `${Math.round(growthRate)}%`;
  }

  /**
   * Calculate trend for projects based on creation date
   * @param projects Array of project posts
   * @param days Number of days to look back (default: 30)
   * @returns Trend percentage as string (e.g., "+25%", "-10%", "0%")
   */
  static calculateProjectsTrend(projects: ProjectPost[], days: number = 30): string {
    const currentDate = new Date();
    const lookBackDate = new Date(currentDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const recentProjects = projects.filter(project => 
      new Date(project.created_at) > lookBackDate
    );
    const olderProjects = projects.filter(project => 
      new Date(project.created_at) <= lookBackDate
    );
    
    if (olderProjects.length === 0) {
      return recentProjects.length > 0 ? '+100%' : '0%';
    }
    
    const growthRate = ((recentProjects.length / olderProjects.length) * 100) - 100;
    return growthRate >= 0 ? `+${Math.round(growthRate)}%` : `${Math.round(growthRate)}%`;
  }

  /**
   * Get color class based on trend value
   * @param trend Trend string (e.g., "+25%", "-10%", "0%")
   * @param positiveColor Color for positive trends
   * @param negativeColor Color for negative trends
   * @param neutralColor Color for neutral/zero trends
   * @returns CSS color class string
   */
  static getTrendColor(
    trend: string, 
    positiveColor: string = 'text-green-600',
    negativeColor: string = 'text-red-600',
    neutralColor: string = 'text-gray-600'
  ): string {
    if (trend.startsWith('+')) {
      return positiveColor;
    } else if (trend === '0%') {
      return neutralColor;
    } else {
      return negativeColor;
    }
  }

  /**
   * Calculate trend for any date-based array
   * @param items Array of items with date property
   * @param dateProperty Property name that contains the date
   * @param days Number of days to look back
   * @returns Trend percentage as string
   */
  static calculateGenericTrend<T>(
    items: T[], 
    dateProperty: keyof T, 
    days: number = 30
  ): string {
    const currentDate = new Date();
    const lookBackDate = new Date(currentDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const recentItems = items.filter(item => 
      new Date(item[dateProperty] as string) > lookBackDate
    );
    const olderItems = items.filter(item => 
      new Date(item[dateProperty] as string) <= lookBackDate
    );
    
    if (olderItems.length === 0) {
      return recentItems.length > 0 ? '+100%' : '0%';
    }
    
    const growthRate = ((recentItems.length / olderItems.length) * 100) - 100;
    return growthRate >= 0 ? `+${Math.round(growthRate)}%` : `${Math.round(growthRate)}%`;
  }
}
