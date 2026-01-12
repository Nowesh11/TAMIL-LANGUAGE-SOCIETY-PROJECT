import fs from 'fs';
import path from 'path';
import dbConnect from '../src/lib/mongodb';
import Team from '../src/models/Team';
import Component from '../src/models/Component';
import Poster from '../src/models/Poster';

interface MigrationResult {
  success: boolean;
  moved: number;
  errors: string[];
  details: string[];
}

class FileOrganizationMigrator {
  private baseUploadDir = path.join(process.cwd(), 'uploads');
  private results: MigrationResult = {
    success: true,
    moved: 0,
    errors: [],
    details: []
  };

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.results.details.push(`Created directory: ${dirPath}`);
    }
  }

  private moveFile(oldPath: string, newPath: string): boolean {
    try {
      if (!fs.existsSync(oldPath)) {
        this.results.errors.push(`Source file not found: ${oldPath}`);
        return false;
      }

      this.ensureDirectoryExists(path.dirname(newPath));
      
      if (fs.existsSync(newPath)) {
        this.results.details.push(`File already exists at destination: ${newPath}`);
        return true;
      }

      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
      this.results.moved++;
      this.results.details.push(`Moved: ${oldPath} → ${newPath}`);
      return true;
    } catch (error) {
      this.results.errors.push(`Failed to move ${oldPath} to ${newPath}: ${error}`);
      return false;
    }
  }

  async migrateTeamImages(): Promise<void> {
    console.log('🔄 Migrating team images...');
    
    try {
      const teamMembers = await Team.find({}).lean();
      
      for (const member of teamMembers) {
        if (!member.imagePath) continue;

        const currentPath = member.imagePath.toString();
        
        // Skip if already in correct format
        if (currentPath.includes(`/team/${member._id}/`)) {
          this.results.details.push(`Team member ${member._id} already in correct format`);
          continue;
        }

        // Determine current file location
        let oldFilePath: string;
        if (path.isAbsolute(currentPath)) {
          oldFilePath = currentPath;
        } else if (currentPath.startsWith('/uploads/')) {
          oldFilePath = path.join(process.cwd(), currentPath.substring(1));
        } else if (currentPath.startsWith('uploads/')) {
          oldFilePath = path.join(process.cwd(), currentPath);
        } else {
          oldFilePath = path.join(process.cwd(), 'uploads', currentPath);
        }

        // New organized path
        const newDir = path.join(this.baseUploadDir, 'team', member._id.toString());
        const fileExt = path.extname(oldFilePath) || '.jpg';
        const newFilePath = path.join(newDir, `photo${fileExt}`);
        const newDbPath = `uploads/team/${member._id}/photo${fileExt}`;

        // Move file
        if (this.moveFile(oldFilePath, newFilePath)) {
          // Update database
          await Team.findByIdAndUpdate(member._id, {
            imagePath: newDbPath
          });
          this.results.details.push(`Updated team member ${member._id} imagePath to: ${newDbPath}`);
        }
      }
    } catch (error) {
      this.results.errors.push(`Team migration error: ${error}`);
    }
  }

  async migrateComponentImages(): Promise<void> {
    console.log('🔄 Migrating component images...');
    
    try {
      const components = await Component.find({}).lean();
      
      for (const component of components) {
        if (!component.content) continue;

        const content = component.content as any;
        let imagePaths: string[] = [];
        
        // Collect all image paths from component content
        if (content.url && typeof content.url === 'string') {
          imagePaths.push(content.url);
        }
        if (content.backgroundImage && typeof content.backgroundImage === 'string') {
          imagePaths.push(content.backgroundImage);
        }
        if (content.image?.src && typeof content.image.src === 'string') {
          imagePaths.push(content.image.src);
        }
        if (content.gallery && Array.isArray(content.gallery)) {
          content.gallery.forEach((item: any) => {
            if (item.url && typeof item.url === 'string') {
              imagePaths.push(item.url);
            }
          });
        }

        let contentUpdated = false;

        for (const imagePath of imagePaths) {
          // Skip logos - they should stay in uploads/components/
          if (imagePath.includes('logo') || imagePath.includes('tls-logo')) {
            this.results.details.push(`Skipping logo file: ${imagePath}`);
            continue;
          }

          // Skip if already in correct format
          if (imagePath.includes(`/components/${component._id}/`)) {
            this.results.details.push(`Component ${component._id} image already in correct format`);
            continue;
          }

          // Skip external URLs
          if (imagePath.startsWith('http')) {
            this.results.details.push(`Skipping external URL: ${imagePath}`);
            continue;
          }

          // Determine current file location
          let oldFilePath: string;
          if (path.isAbsolute(imagePath)) {
            oldFilePath = imagePath;
          } else if (imagePath.startsWith('/uploads/')) {
            oldFilePath = path.join(process.cwd(), imagePath.substring(1));
          } else if (imagePath.startsWith('uploads/')) {
            oldFilePath = path.join(process.cwd(), imagePath);
          } else {
            oldFilePath = path.join(process.cwd(), 'uploads', imagePath);
          }

          // New organized path
          const newDir = path.join(this.baseUploadDir, 'components', component._id.toString());
          const fileName = path.basename(oldFilePath);
          const newFilePath = path.join(newDir, fileName);
          const newDbPath = `uploads/components/${component._id}/${fileName}`;

          // Move file
          if (this.moveFile(oldFilePath, newFilePath)) {
            // Update content with new path
            const newContent = JSON.parse(JSON.stringify(content));
            this.updateImagePathsInContent(newContent, imagePath, newDbPath);
            
            await Component.findByIdAndUpdate(component._id, {
              content: newContent
            });
            contentUpdated = true;
          }
        }

        if (contentUpdated) {
          this.results.details.push(`Updated component ${component._id} image paths`);
        }
      }
    } catch (error) {
      this.results.errors.push(`Component migration error: ${error}`);
    }
  }

  private updateImagePathsInContent(content: any, oldPath: string, newPath: string): void {
    if (typeof content === 'object' && content !== null) {
      for (const key in content) {
        if (content[key] === oldPath) {
          content[key] = newPath;
        } else if (typeof content[key] === 'object') {
          this.updateImagePathsInContent(content[key], oldPath, newPath);
        }
      }
    }
  }

  async verifyPosterOrganization(): Promise<void> {
    console.log('✅ Verifying poster organization...');
    
    try {
      const posters = await Poster.find({}).lean();
      
      for (const poster of posters) {
        if (!poster.imagePath) continue;

        const expectedPath = `uploads/posters/${poster._id}/image`;
        const currentPath = poster.imagePath.toString();

        if (!currentPath.includes(`/posters/${poster._id}/`)) {
          this.results.errors.push(`Poster ${poster._id} not in correct format: ${currentPath}`);
        } else {
          this.results.details.push(`Poster ${poster._id} correctly organized`);
        }
      }
    } catch (error) {
      this.results.errors.push(`Poster verification error: ${error}`);
    }
  }

  async cleanupEmptyDirectories(): Promise<void> {
    console.log('🧹 Cleaning up empty directories...');
    
    const cleanupDirs = [
      path.join(this.baseUploadDir, 'team'),
      path.join(this.baseUploadDir, 'components'),
      path.join(this.baseUploadDir, 'posters')
    ];

    for (const dir of cleanupDirs) {
      if (fs.existsSync(dir)) {
        this.cleanupEmptyDirsRecursive(dir);
      }
    }
  }

  private cleanupEmptyDirsRecursive(dirPath: string): void {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          this.cleanupEmptyDirsRecursive(itemPath);
          
          // Check if directory is now empty
          const remainingItems = fs.readdirSync(itemPath);
          if (remainingItems.length === 0) {
            fs.rmdirSync(itemPath);
            this.results.details.push(`Removed empty directory: ${itemPath}`);
          }
        }
      }
    } catch (error) {
      this.results.details.push(`Cleanup error for ${dirPath}: ${error}`);
    }
  }

  async migrate(): Promise<MigrationResult> {
    console.log('🚀 Starting file organization migration...');
    
    try {
      await dbConnect();
      
      await this.migrateTeamImages();
      await this.migrateComponentImages();
      await this.verifyPosterOrganization();
      await this.cleanupEmptyDirectories();
      
      console.log('✅ Migration completed successfully!');
      
    } catch (error) {
      this.results.success = false;
      this.results.errors.push(`Migration failed: ${error}`);
      console.error('❌ Migration failed:', error);
    }

    return this.results;
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new FileOrganizationMigrator();
  migrator.migrate().then((result) => {
    console.log('\n📊 Migration Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📁 Files moved: ${result.moved}`);
    console.log(`❌ Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.details.length > 0) {
      console.log('\n📝 Details:');
      result.details.forEach(detail => console.log(`  - ${detail}`));
    }
    
    process.exit(result.success ? 0 : 1);
  });
}

export default FileOrganizationMigrator;