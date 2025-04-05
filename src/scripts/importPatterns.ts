import { supabase } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

const PATTERNS_DIR = path.join(__dirname, '../../src/patterns');

interface PatternMetadata {
  timestamp: string;
  description: string;
  name: string;
  filename: string;
}

async function importPatterns() {
  try {
    // Get all category directories
    const categories = fs.readdirSync(PATTERNS_DIR).filter(
      (item) => fs.statSync(path.join(PATTERNS_DIR, item)).isDirectory()
    );

    for (const category of categories) {
      const categoryPath = path.join(PATTERNS_DIR, category);
      const metadataPath = path.join(categoryPath, 'metadata');
      
      // Create an album for this category
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .insert({
          name: category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          category: category,
          // Use the first pattern image as preview if available
          preview_image: fs.existsSync(path.join(categoryPath, fs.readdirSync(categoryPath)[0])) 
            ? fs.readFileSync(path.join(categoryPath, fs.readdirSync(categoryPath)[0])).toString('base64')
            : null
        })
        .select()
        .single();

      if (albumError) {
        console.error(`Error creating album for ${category}:`, albumError);
        continue;
      }

      // Read and process pattern files
      if (fs.existsSync(metadataPath)) {
        const metadataFiles = fs.readdirSync(metadataPath)
          .filter(file => file.endsWith('.json'));

        for (const metadataFile of metadataFiles) {
          const metadata: PatternMetadata = JSON.parse(
            fs.readFileSync(path.join(metadataPath, metadataFile), 'utf-8')
          );

          const imageFile = path.join(categoryPath, metadata.filename);
          if (!fs.existsSync(imageFile)) {
            console.warn(`Image file not found: ${imageFile}`);
            continue;
          }

          const imageData = fs.readFileSync(imageFile);
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