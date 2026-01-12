import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

// Mapping of old HTML paths to new Next.js routes
const pathMappings = {
  '/views/index.html': '/',
  '/views/about.html': '/about',
  '/views/projects.html': '/projects',
  '/views/ebooks.html': '/ebooks',
  '/views/books.html': '/books',
  '/views/contact.html': '/contacts',
  '/views/notifications.html': '/notifications',
  '/views/login.html': '/login',
  '/views/signup.html': '/signup',
  '/views/donate.html': '/donate'
};

async function fixDatabaseLinks() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const componentsCollection = db.collection('components');
    
    // Get all components
    const components = await componentsCollection.find({}).toArray();
    console.log(`Found ${components.length} components to check`);
    
    let updatedCount = 0;
    
    for (const component of components) {
      let hasUpdates = false;
      const updates: any = {};
      
      // Function to recursively update paths in an object
      function updatePaths(obj: any, path: string = ''): any {
        if (typeof obj === 'string') {
          // Check if this string is a path that needs updating
          for (const [oldPath, newPath] of Object.entries(pathMappings)) {
            if (obj === oldPath) {
              return newPath;
            }
          }
          return obj;
        } else if (Array.isArray(obj)) {
          return obj.map((item, index) => updatePaths(item, `${path}[${index}]`));
        } else if (obj && typeof obj === 'object') {
          const updated: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const newValue = updatePaths(value, path ? `${path}.${key}` : key);
            updated[key] = newValue;
            if (newValue !== value) {
              hasUpdates = true;
            }
          }
          return updated;
        }
        return obj;
      }
      
      // Update the content field
      if (component.content) {
        const updatedContent = updatePaths(component.content);
        if (JSON.stringify(updatedContent) !== JSON.stringify(component.content)) {
          updates.content = updatedContent;
          hasUpdates = true;
        }
      }
      
      // Update the component if changes were made
      if (hasUpdates) {
        await componentsCollection.updateOne(
          { _id: component._id },
          { $set: updates }
        );
        updatedCount++;
        console.log(`Updated component ${component._id} (${component.type})`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} components`);
    
    // Also check and update any other collections that might have these paths
    const collections = ['users', 'ebooks', 'books', 'projects', 'team'];
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const docs = await collection.find({}).toArray();
        
        if (docs.length > 0) {
          console.log(`\nChecking ${collectionName} collection (${docs.length} documents)...`);
          
          let collectionUpdates = 0;
          for (const doc of docs) {
            let hasUpdates = false;
            const updates: any = {};
            
            // Check for any string fields that might contain old paths
            function checkAndUpdateDoc(obj: any, parentKey: string = ''): any {
              if (typeof obj === 'string') {
                for (const [oldPath, newPath] of Object.entries(pathMappings)) {
                  if (obj.includes(oldPath)) {
                    return obj.replace(oldPath, newPath);
                  }
                }
                return obj;
              } else if (Array.isArray(obj)) {
                return obj.map((item: any) => checkAndUpdateDoc(item));
              } else if (obj && typeof obj === 'object') {
                const updated: any = {};
                for (const [key, value] of Object.entries(obj)) {
                  const newValue = checkAndUpdateDoc(value, key);
                  updated[key] = newValue;
                  if (newValue !== value) {
                    hasUpdates = true;
                  }
                }
                return updated;
              }
              return obj;
            }
            
            const updatedDoc = checkAndUpdateDoc(doc);
            if (JSON.stringify(updatedDoc) !== JSON.stringify(doc)) {
              // Remove _id from updates
              const { _id, ...docWithoutId } = updatedDoc;
              await collection.updateOne(
                { _id: doc._id },
                { $set: docWithoutId }
              );
              collectionUpdates++;
            }
          }
          
          if (collectionUpdates > 0) {
            console.log(`Updated ${collectionUpdates} documents in ${collectionName}`);
          }
        }
      } catch (error) {
        // Collection might not exist, skip it
        console.log(`Skipping ${collectionName} collection (doesn't exist or no access)`);
      }
    }
    
  } catch (error) {
    console.error('Error fixing database links:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixDatabaseLinks().catch(console.error);
}

export default fixDatabaseLinks;