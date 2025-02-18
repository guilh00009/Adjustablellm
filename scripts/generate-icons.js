import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateIcons() {
    // Source GIF path
    const sourceGif = join(__dirname, '../public/images/ai-orb.gif');
    const outputDir = join(__dirname, '../public/images');

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Icon sizes needed
    const sizes = [152, 167, 180, 192, 512];

    try {
        // Extract first frame from GIF and generate icons
        const buffer = await sharp(sourceGif, { page: 0 })
            .flatten({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();

        // Generate each size
        for (const size of sizes) {
            await sharp(buffer)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toFile(join(outputDir, `ai-orb-${size}.png`));
            
            console.log(`Generated ${size}x${size} icon`);
        }

        console.log('All icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons(); 