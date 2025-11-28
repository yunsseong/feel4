import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Content types enum
enum ContentType {
    BIBLE = 'bible',
    NOVEL = 'novel',
    POEM = 'poem',
    ESSAY = 'essay',
}

// ========== BIBLE INTERFACES ==========
interface BibleVerse {
    chapter: number;
    verse: number;
    name: string;
    text: string;
}

interface BibleChapter {
    chapter: number;
    name: string;
    verses: BibleVerse[];
}

interface BibleBook {
    nr: number;
    name: string;
    chapters: BibleChapter[];
}

interface BibleData {
    translation: string;
    abbreviation: string;
    description: string;
    lang: string;
    language: string;
    books: BibleBook[];
}

// ========== KOREAN LITERATURE INTERFACES ==========
interface LiteraryWork {
    fileName: string;
    contentType: ContentType;
    title: string;
    author: string;
    year: number;
}

// 12개 한국 문학 작품 메타데이터
const WORKS: LiteraryWork[] = [
    // 시 (5편)
    { fileName: '진달래꽃_김소월.md', contentType: ContentType.POEM, title: '진달래꽃', author: '김소월', year: 1925 },
    { fileName: '엄마야_누나야_김소월.md', contentType: ContentType.POEM, title: '엄마야 누나야', author: '김소월', year: 1922 },
    { fileName: '산유화_김소월.md', contentType: ContentType.POEM, title: '산유화', author: '김소월', year: 1925 },
    { fileName: '서시_윤동주.md', contentType: ContentType.POEM, title: '서시', author: '윤동주', year: 1941 },
    { fileName: '별_헤는_밤_윤동주.md', contentType: ContentType.POEM, title: '별 헤는 밤', author: '윤동주', year: 1941 },

    // 소설 (5편)
    { fileName: '동백꽃_김유정.md', contentType: ContentType.NOVEL, title: '동백꽃', author: '김유정', year: 1936 },
    { fileName: '봄봄_김유정.md', contentType: ContentType.NOVEL, title: '봄봄', author: '김유정', year: 1935 },
    { fileName: '운수_좋은_날_현진건.md', contentType: ContentType.NOVEL, title: '운수 좋은 날', author: '현진건', year: 1924 },
    { fileName: '빈처_현진건.md', contentType: ContentType.NOVEL, title: '빈처', author: '현진건', year: 1921 },
    { fileName: '꽃송이같은_첫_눈_강경애.md', contentType: ContentType.NOVEL, title: '꽃송이같은 첫 눈', author: '강경애', year: 1932 },

    // 수필 (2편)
    { fileName: '권태_이상.md', contentType: ContentType.ESSAY, title: '권태', author: '이상', year: 1937 },
    { fileName: '아름다운_조선말_이상.md', contentType: ContentType.ESSAY, title: '아름다운 조선말', author: '이상', year: 1936 },
];

// ========== HELPER FUNCTIONS ==========
function parseMarkdownFile(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract content between first "---" and last "---"
    const sections = content.split('---');
    if (sections.length < 3) {
        return [];
    }

    const mainContent = sections[1].trim();

    // Split by paragraphs (double newlines or single newlines for poems)
    const paragraphs = mainContent
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0 && !p.startsWith('#') && !p.startsWith('**'));

    return paragraphs;
}

// ========== MAIN RESTORE FUNCTION ==========
async function restoreAllData() {
    console.log('🚀 Starting complete data restoration...\n');

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5632'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'feel4',
    });

    await dataSource.initialize();
    console.log('✅ Database connected\n');

    // Clear only Bible content (preserve literature if exists)
    await dataSource.query("DELETE FROM content WHERE content_type = 'bible'");
    console.log('🗑️  Cleared existing Bible data\n');

    let totalItems = 0;

    // ========== RESTORE BIBLE ==========
    const bibleJsonPath = path.join(__dirname, '../../korean_bible.json');

    if (fs.existsSync(bibleJsonPath)) {
        console.log('📖 Restoring Bible data...');
        const rawData = fs.readFileSync(bibleJsonPath, 'utf-8');
        const bibleData: BibleData = JSON.parse(rawData);

        for (const book of bibleData.books) {
            const bookName = book.name;

            for (const chapter of book.chapters) {
                const chapterNum = chapter.chapter;
                const values: string[] = [];
                const params: any[] = [];
                let paramIndex = 1;

                for (const verse of chapter.verses) {
                    const displayRef = `${bookName} ${chapterNum}:${verse.verse}`;
                    values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
                    params.push(
                        ContentType.BIBLE,
                        bookName,
                        chapterNum,
                        verse.verse,
                        verse.text.trim(),
                        displayRef
                    );
                    paramIndex += 6;
                    totalItems++;
                }

                if (values.length > 0) {
                    await dataSource.query(
                        `INSERT INTO content (content_type, work_title, chapter, section, content, display_reference)
                         VALUES ${values.join(', ')}`,
                        params
                    );
                }
            }
            console.log(`  ✓ ${bookName}`);
        }
        console.log(`📖 Bible: ${bibleData.books.length} books completed\n`);
    } else {
        console.warn('⚠️  korean_bible.json not found, skipping Bible data\n');
    }

    // ========== RESTORE KOREAN LITERATURE ==========
    console.log('📚 Restoring Korean literature...');
    const worksDir = path.join(__dirname, '../../../claudedocs/works');

    for (const work of WORKS) {
        const filePath = path.join(worksDir, work.fileName);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  File not found: ${work.fileName}`);
            continue;
        }

        const paragraphs = parseMarkdownFile(filePath);

        if (paragraphs.length === 0) {
            console.warn(`⚠️  No content extracted from: ${work.fileName}`);
            continue;
        }

        // Delete existing work data first (handles section number changes)
        await dataSource.query(
            'DELETE FROM content WHERE work_title = $1 AND author = $2',
            [work.title, work.author]
        );

        // Insert each paragraph/stanza as a section
        for (let i = 0; i < paragraphs.length; i++) {
            const sectionNum = i + 1;
            const displayRef = work.contentType === ContentType.POEM
                ? `${work.title} ${sectionNum}연`
                : `${work.title} ${sectionNum}문단`;

            await dataSource.query(
                `INSERT INTO content (content_type, work_title, author, chapter, section, content, display_reference, publication_year, is_public_domain)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    work.contentType,
                    work.title,
                    work.author,
                    1,
                    sectionNum,
                    paragraphs[i],
                    displayRef,
                    work.year,
                    true
                ]
            );
            totalItems++;
        }

        const icon = work.contentType === ContentType.POEM ? '📝' : work.contentType === ContentType.NOVEL ? '📖' : '📜';
        console.log(`  ${icon} ${work.author} - ${work.title} (${paragraphs.length}개 섹션)`);
    }

    console.log(`📚 Korean literature: ${WORKS.length} works completed\n`);

    // ========== SUMMARY ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Statistics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const stats = await dataSource.query(`
        SELECT content_type, COUNT(*) as count
        FROM content
        GROUP BY content_type
        ORDER BY content_type
    `);

    for (const stat of stats) {
        const icon =
            stat.content_type === 'bible' ? '📖' :
            stat.content_type === 'poem' ? '📝' :
            stat.content_type === 'novel' ? '📚' :
            stat.content_type === 'essay' ? '📜' : '📄';
        console.log(`${icon} ${stat.content_type.toUpperCase()}: ${stat.count.toLocaleString()} items`);
    }

    const totalResult = await dataSource.query('SELECT COUNT(*) as total FROM content');
    console.log(`\n✅ TOTAL: ${totalResult[0].total.toLocaleString()} items restored`);

    await dataSource.destroy();
    console.log('\n🎉 Data restoration completed successfully!');
}

// Run the restoration
restoreAllData().catch((error) => {
    console.error('❌ Error during restoration:', error);
    process.exit(1);
});
