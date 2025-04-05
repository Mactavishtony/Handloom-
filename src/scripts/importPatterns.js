import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get the first user's ID to use as the owner of the albums
async function getUserId() {
  const { data, error } = await supabase
    .from('auth.users')
    .select('id')
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Error getting user ID: ${error.message}`);
  }

  return data.id;
}

const PATTERNS_DIR = join(__dirname, '../../src/patterns');

async function importPatterns() {
  try {
    const userId = await getUserId();

    // Get all category directories
    const categories = readdirSync(PATTERNS_DIR).filter(
      (item) => statSync(join(PATTERNS_DIR, item)).isDirectory()
    );

    for (const category of categories) {
      const categoryPath = join(PATTERNS_DIR, category);
      const metadataPath = join(categoryPath, 'metadata');
      
      // Create an album for this category
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .insert({
          name: category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          preview_image: existsSync(join(categoryPath, readdirSync(categoryPath)[0])) 
            ? `data:image/png;base64,${readFileSync(join(categoryPath, readdirSync(categoryPath)[0])).toString('base64')}`
            : null,
          user_id: userId
        })
        .select()
        .single();

      if (albumError) {
        console.error(`Error creating album for ${category}:`, albumError);
        continue;
      }

      console.log(`Created album: ${album.name}`);

      // Read and process pattern files
      if (existsSync(metadataPath)) {
        const metadataFiles = readdirSync(metadataPath)
          .filter(file => file.endsWith('.json'));

        for (const metadataFile of metadataFiles) {
          const metadata = JSON.parse(
            readFileSync(join(metadataPath, metadataFile), 'utf-8')
          );

          const imageFile = join(categoryPath, metadata.filename);
          if (!existsSync(imageFile)) {
            console.warn(`Image file not found: ${imageFile}`);
            continue;
          }

          const imageData = readFileSync(imageFile);
          const base64Image = `data:image/png;base64,${imageData.toString('base64')}`;

          // Insert pattern into database
          const { error: patternError } = await supabase
            .from('patterns')
            .insert({
              name: metadata.name,
              description: metadata.description,
              style: category,
              image_url: base64Image,
              album_id: album.id,
              user_id: userId,
              is_private: false
            });

          if (patternError) {
            console.error(`Error inserting pattern ${metadata.name}:`, patternError);
          } else {
            console.log(`Successfully imported pattern: ${metadata.name}`);
          }
        }
      }
    }

    console.log('Pattern import completed successfully!');
  } catch (error) {
    console.error('Error during pattern import:', error);
  }
}

// Run the import
importPatterns(); 