import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface Verse {
    chapter: number;
    verse: number;
    name: string;
    text: string;
}

interface Chapter {
    chapter: number;
    name: string;
    verses: Verse[];
}

interface Book {
    nr: number;
    name: string;
    chapters: Chapter[];
}

interface BibleData {
    translation: string;
    abbreviation: string;
    description: string;
    lang: string;
    language: string;
    books: Book[];
}

async function seedBible() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5632'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'bibliy',
    });

    await dataSource.initialize();
    console.log('Database connected');

    // Read JSON file
    const jsonPath = path.join(__dirname, '../../korean_bible.json');
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const bibleData: BibleData = JSON.parse(rawData);

    console.log(`Loading ${bibleData.description} (${bibleData.translation})`);

    // Clear existing data
    await dataSource.query('TRUNCATE TABLE bible RESTART IDENTITY CASCADE');
    console.log('Cleared existing bible data');

    let totalVerses = 0;

    for (const book of bibleData.books) {
        const bookName = book.name;

        for (const chapter of book.chapters) {
            const chapterNum = chapter.chapter;

            // Batch insert verses for each chapter
            const values: string[] = [];
            const params: any[] = [];
            let paramIndex = 1;

            for (const verse of chapter.verses) {
                values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
                params.push(bookName, chapterNum, verse.verse, verse.text.trim());
                paramIndex += 4;
                totalVerses++;
            }

            if (values.length > 0) {
                await dataSource.query(
                    `INSERT INTO bible (book, chapter, verse, content) VALUES ${values.join(', ')}`,
                    params
                );
            }
        }

        console.log(`✓ ${bookName} - ${book.chapters.length} chapters`);
    }

    console.log(`\nTotal: ${totalVerses} verses imported`);

    await dataSource.destroy();
    console.log('Done!');
}

seedBible().catch(console.error);
